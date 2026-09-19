-- ════════════════════════════════════════════════════════════════════
-- FHC — RECONCILE MIGRATION (lean, retained-sections only)
--
-- Run this in the Supabase SQL editor. Safe to re-run (idempotent).
-- This is a focused alternative to supabase/admin.sql: it creates
-- ONLY what the live admin panel and the public site need. Dead
-- tables (events, projects, gallery_assets, highlights, site_content)
-- are intentionally omitted — no empty nodes, no 404 console noise.
--
-- SECTIONS COVERED
--   profiles          — role, bio, is_active, email_verified, etc.
--   fhc_join_applications — admin RLS (SELECT, UPDATE) + lifecycle CHECK
--   team_members      — admin RLS (INSERT, UPDATE, DELETE)
--   admin_activity_logs — audit trail (best-effort; absent = silent skip)
--   RPCs              — is_fhc_admin, get_fhc_role, admin_set_user_role,
--                        admin_set_application_status, log_admin_activity,
--                        admin_schema_status, admin_security_audit
--   realtime          — profiles, team_members, fhc_join_applications
-- ────────────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────────────
-- 0. updated_at helper
-- ────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 1. PROFILES — guarantee every column the admin panel reads
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  email         text,
  username      text,
  avatar_seed   text,
  avatar_url    text,
  role          text not null default 'member',
  bio           text,
  is_active     boolean not null default true,
  email_verified boolean,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name      text not null default '';
alter table public.profiles add column if not exists email          text;
alter table public.profiles add column if not exists username       text;
alter table public.profiles add column if not exists avatar_seed    text;
alter table public.profiles add column if not exists avatar_url     text;
alter table public.profiles add column if not exists role           text not null default 'member';
alter table public.profiles add column if not exists bio            text;
alter table public.profiles add column if not exists is_active      boolean not null default true;
alter table public.profiles add column if not exists email_verified boolean;
alter table public.profiles add column if not exists last_login_at  timestamptz;
alter table public.profiles add column if not exists created_at     timestamptz not null default now();
alter table public.profiles add column if not exists updated_at     timestamptz not null default now();

-- Role mirror CHECK constraint (member = legacy alias of user)
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'profiles_role_check'
       and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('admin','member','user'));
  end if;
end $$;

create index if not exists profiles_role_idx      on public.profiles (role);
create index if not exists profiles_is_active_idx on public.profiles (is_active);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-profile trigger: creates a profile row on every new auth.users row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, username, avatar_seed, role, bio, is_active, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))),
    new.id::text,
    coalesce(new.raw_app_meta_data ->> 'role', 'member'),
    new.raw_user_meta_data ->> 'bio',
    true,
    (new.raw_user_meta_data ->> 'email_verified')::boolean
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill email_verified from auth metadata (display mirror only)
update public.profiles p
   set email_verified = (u.raw_user_meta_data ->> 'email_verified')::boolean
  from auth.users u
 where u.id = p.id
   and (u.raw_user_meta_data ->> 'email_verified') is not null
   and p.email_verified is distinct from ((u.raw_user_meta_data ->> 'email_verified')::boolean);

-- ────────────────────────────────────────────────────────────────────
-- 2. fhc_join_applications — lifecycle CHECK + admin RLS
-- ────────────────────────────────────────────────────────────────────
alter table public.fhc_join_applications
  add constraint fhc_join_applications_status_check
  check (status in ('applied','under_review','selected','rejected'));

-- Drop any legacy policies that assumed a different status set
do $$
begin
  for p in
    select policyname from pg_policies
     where schemaname = 'public'
       and tablename  = 'fhc_join_applications'
       and policyname in (
         'Admins can do everything on fhc_join_applications',
         'Allow admin insert update delete'
       )
  loop
    execute format('drop policy if exists %I on public.fhc_join_applications', p.policyname);
  end loop;
end $$;

-- Admin: full SELECT + UPDATE (INSERT stays open for public Join form)
drop policy if exists "Admins can view all fhc_join_applications" on public.fhc_join_applications;
create policy "Admins can view all fhc_join_applications"
  on public.fhc_join_applications
  for select
  using (public.is_fhc_admin());

drop policy if exists "Admins can update fhc_join_applications" on public.fhc_join_applications;
create policy "Admins can update fhc_join_applications"
  on public.fhc_join_applications
  for update
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

-- Admin: DELETE (removal of applications)
drop policy if exists "Admins can delete fhc_join_applications" on public.fhc_join_applications;
create policy "Admins can delete fhc_join_applications"
  on public.fhc_join_applications
  for delete
  using (public.is_fhc_admin());

-- ────────────────────────────────────────────────────────────────────
-- 3. team_members — admin CRUD
-- ────────────────────────────────────────────────────────────────────
drop policy if exists "Admins can insert team_members" on public.team_members;
create policy "Admins can insert team_members"
  on public.team_members
  for insert
  with check (public.is_fhc_admin());

drop policy if exists "Admins can update team_members" on public.team_members;
create policy "Admins can update team_members"
  on public.team_members
  for update
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

drop policy if exists "Admins can delete team_members" on public.team_members;
create policy "Admins can delete team_members"
  on public.team_members
  for delete
  using (public.is_fhc_admin());

-- ────────────────────────────────────────────────────────────────────
-- 4. Secure role helpers (SECURITY DEFINER, JWT-aware)
-- ────────────────────────────────────────────────────────────────────

-- is_fhc_admin(): the SINGLE source of admin truth used by every RLS policy
create or replace function public.is_fhc_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then return false; end if;
  return exists (
    select 1 from auth.users u
     where u.id = _uid
       and (
         u.raw_app_meta_data  ->> 'role' = 'admin'
         or u.raw_user_meta_data ->> 'role' = 'admin'
       )
  );
end;
$$;

grant execute on function public.is_fhc_admin() to anon, authenticated;

-- get_fhc_role(): current user's role string ('admin','member','user',...)
create or replace function public.get_fhc_role()
returns text
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _role text;
begin
  if _uid is null then return 'anonymous'; end if;
  select u.raw_app_meta_data ->> 'role' into _role
    from auth.users u where u.id = _uid;
  if _role is not null and _role in ('admin','member','user') then
    return _role;
  end if;
  select u.raw_user_meta_data ->> 'role' into _role
    from auth.users u where u.id = _uid;
  if _role is not null and _role in ('admin','member','user') then
    return _role;
  end if;
  return 'user';
end;
$$;

grant execute on function public.get_fhc_role() to anon, authenticated;

-- admin_set_user_role(target, new_role): atomic role change (both metadata layers)
create or replace function public.admin_set_user_role(
  target uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _current text;
  _target_admins bigint;
begin
  if not public.is_fhc_admin() then
    raise exception 'FHC_PERMISSION_DENIED: only admins may change user roles';
  end if;

  if new_role not in ('admin','member','user') then
    raise exception 'FHC_INVALID_ROLE: allowed values are admin, member, user';
  end if;

  select (u.raw_app_meta_data ->> 'role') into _current
    from auth.users u where u.id = target;
  if _current is null then
    raise exception 'FHC_USER_NOT_FOUND';
  end if;

  if _current = 'admin' and new_role <> 'admin' then
    select count(*) into _target_admins
      from auth.users
     where (raw_app_meta_data ->> 'role') = 'admin';
    if _target_admins <= 1 then
      raise exception 'FHC_LAST_ADMIN: at least one admin must remain';
    end if;
  end if;

  update auth.users
     set raw_app_meta_data  = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb),  '{role}', to_jsonb(new_role)),
         raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(new_role))
   where id = target;

  perform public.log_admin_activity('ROLE_CHANGED', 'profiles', target::text,
    jsonb_build_object('role', new_role, 'previous', _current));
end;
$$;

grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- admin_set_application_status(p_target, p_status): atomic status + audit
create or replace function public.admin_set_application_status(
  p_target uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _current text;
begin
  if not public.is_fhc_admin() then
    raise exception 'FHC_PERMISSION_DENIED: only admins may change application status';
  end if;

  if p_status not in ('applied','under_review','selected','rejected') then
    raise exception 'FHC_INVALID_STATUS: allowed values are applied, under_review, selected, rejected';
  end if;

  select status into _current
    from public.fhc_join_applications
   where id = p_target;
  if _current is null then
    raise exception 'FHC_APPLICATION_NOT_FOUND';
  end if;

  update public.fhc_join_applications
     set status = p_status
   where id = p_target;

  perform public.log_admin_activity('APPLICATION_STATUS_CHANGED', 'fhc_join_applications', p_target::text,
    jsonb_build_object('status', p_status, 'previous', _current));
end;
$$;

grant execute on function public.admin_set_application_status(uuid, text) to authenticated;

-- admin_dashboard_stats(): live aggregate counts
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  _result jsonb;
begin
  select jsonb_build_object(
    'total_users',             (select count(*) from public.profiles),
    'total_profiles',          (select count(*) from public.profiles),
    'active_members',          (select count(*) from public.profiles where is_active = true),
    'admins',                  (select count(*) from public.profiles where role = 'admin'),
    'pending_applications',    (select count(*) from public.fhc_join_applications where status in ('applied','under_review')),
    'under_review_applications',(select count(*) from public.fhc_join_applications where status = 'under_review'),
    'approved_applications',   (select count(*) from public.fhc_join_applications where status = 'selected'),
    'rejected_applications',   (select count(*) from public.fhc_join_applications where status = 'rejected'),
    'applications_total',      (select count(*) from public.fhc_join_applications),
    'team_members_total',      (select count(*) from public.team_members),
    'team_members_active',     (select count(*) from public.team_members where is_active = true)
  ) into _result;
  return _result;
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;

-- admin_schema_status(): one-shot capability report for the frontend
create or replace function public.admin_schema_status()
returns table (
  table_name text,
  exists     boolean
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return query
  select v.table_name::text,
         exists(
           select 1 from information_schema.tables t
            where t.table_schema = 'public' and t.table_name = v.table_name
         ) as exists
  from (values
    ('profiles'),
    ('team_members'),
    ('fhc_join_applications'),
    ('admin_activity_logs')
  ) as v(table_name);
end;
$$;

grant execute on function public.admin_schema_status() to authenticated;

-- admin_security_audit(): in-app policy / RLS verifier
create or replace function public.admin_security_audit()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  _is_admin boolean := public.is_fhc_admin();
  _role_source text;
  _result jsonb;
begin
  select raw_app_meta_data ->> 'role' into _role_source
    from auth.users where id = auth.uid();
  if _role_source is null then
    select raw_user_meta_data ->> 'role' into _role_source
      from auth.users where id = auth.uid();
  end if;

  select jsonb_build_object(
    'audit_time',      now()::text,
    'role_source',     coalesce(_role_source, 'user'),
    'is_admin',        _is_admin,
    'rls_table_count', (
      select count(distinct tablename)::int
        from pg_policies
       where schemaname = 'public'
    ),
    'table_counts', (
      select jsonb_object_agg(tablename, exists_count)
        from (
          select t.table_name as tablename,
                 (select count(*) from information_schema.columns c
                   where c.table_schema = 'public' and c.table_name = t.table_name) as exists_count
            from information_schema.tables t
           where t.table_schema = 'public'
        ) sub
    ),
    'profiles_total',    (select count(*) from public.profiles),
    'activity_log_rows', (select count(*) from public.admin_activity_logs),
    'role_rpc_enabled',  exists(
      select 1 from pg_proc p
       where p.pronamespace = 'public'::regnamespace
         and p.proname     = 'admin_set_user_role'
    )
  ) into _result;

  return _result;
end;
$$;

grant execute on function public.admin_security_audit() to authenticated;

-- admin_bootstrap(email, role): SQL-editor-only first admin setup
create or replace function public.admin_bootstrap(
  target_email text,
  new_role text default 'admin'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid;
begin
  select id into _uid from auth.users where lower(email) = lower(target_email) limit 1;
  if _uid is null then
    raise exception 'FHC_USER_NOT_FOUND: no auth.users row with email %', target_email;
  end if;

  update auth.users
     set raw_app_meta_data  = jsonb_set(coalesce(raw_app_meta_data,  '{}'::jsonb), '{role}', to_jsonb(new_role)),
         raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(new_role))
   where id = _uid;

  perform public.log_admin_activity('BOOTSTRAP_ROLE', 'profiles', _uid::text,
    jsonb_build_object('role', new_role, 'email', target_email));
end;
$$;

-- Revoke bootstrap from application roles (SQL-editor-only function)
revoke execute on function public.admin_bootstrap(text, text) from anon;
revoke execute on function public.admin_bootstrap(text, text) from authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 5. Audit trail (best-effort: create if absent; otherwise skip)
-- ────────────────────────────────────────────────────────────────────

-- admin_activity_logs table (CREATE IF NOT EXISTS — never duplicate)
create table if not exists public.admin_activity_logs (
  id            uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  action        text not null,
  entity_type   text,
  entity_id     text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

alter table public.admin_activity_logs
  add column if not exists admin_user_id uuid not null;
alter table public.admin_activity_logs
  add column if not exists action text not null;
alter table public.admin_activity_logs
  add column if not exists entity_type text;
alter table public.admin_activity_logs
  add column if not exists entity_id text;
alter table public.admin_activity_logs
  add column if not exists metadata jsonb;
alter table public.admin_activity_logs
  add column if not exists created_at timestamptz not null default now();

create index if not exists admin_activity_logs_created_idx on public.admin_activity_logs (created_at desc);

-- Admin-only read access to the audit log
drop policy if exists "Admins can read admin_activity_logs" on public.admin_activity_logs;
create policy "Admins can read admin_activity_logs"
  on public.admin_activity_logs
  for select
  using (public.is_fhc_admin());

-- System-only insert (SECURITY DEFINER function writes; no direct INSERT policy)
-- log_admin_activity(p_action, p_entity_type, p_entity_id, p_metadata)
create or replace function public.log_admin_activity(
  p_action      text,
  p_entity_type text default null,
  p_entity_id   text default null,
  p_metadata    jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_activity_logs (admin_user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
exception
  when others then
    -- Audit failure must never block the primary operation
    raise notice 'FHC AUDIT LOG WRITE FAILED: %', sqlerrm;
end;
$$;

grant execute on function public.log_admin_activity(text, text, text, jsonb) to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 6. RLS: profiles — own-row select + admin full access
-- ────────────────────────────────────────────────────────────────────

-- Users can read their own profile
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles
  for select
  using (id = auth.uid());

-- Users can update their own profile (non-admin columns only; admin column
-- changes like role/bio/is_active go through the RPCs above)
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can read ANY profile row
drop policy if exists "Admins can read any profile" on public.profiles;
create policy "Admins can read any profile"
  on public.profiles
  for select
  using (public.is_fhc_admin());

-- Admins can update ANY profile row (role/bio/is_active changes go through RPCs)
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles
  for update
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

-- Admins can DELETE profile rows (hazardous; only via SQL editor or this policy)
drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles
  for delete
  using (public.is_fhc_admin());

-- ────────────────────────────────────────────────────────────────────
-- 7. Realtime publication for admin live sync
-- ────────────────────────────────────────────────────────────────────
do $$
declare v_table text;
begin
  foreach v_table in array array[
    'profiles',
    'team_members',
    'fhc_join_applications',
    'admin_activity_logs'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- DONE — idempotent, safe to re-run.
--
-- After running, bootstrap an admin:
--   select public.admin_bootstrap('your-email@example.com');
--
-- The admin panel will then:
--   • read/write profiles, team_members, fhc_join_applications
--   • display live counts + audit trail
--   • hide sections for absent columns (no console 404/400 noise)
-- ════════════════════════════════════════════════════════════════════