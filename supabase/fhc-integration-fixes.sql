-- ════════════════════════════════════════════════════════════════════
-- FHC — INTEGRATION FIXES (consolidated, idempotent)
--
-- RUN THIS ENTIRE FILE ONCE IN THE SUPABASE SQL EDITOR. Safe to re-run.
--
-- This is the SINGLE migration for the live admin panel + public site.
-- It does NOT create any new "dead node" tables (events / projects /
-- highlights / gallery_assets / site_content / admin_activity_logs are
-- intentionally untouched — they are not part of the FHC schema contract).
--
-- WHAT THIS FIXES  (verified against the live REST API)
--   1. profiles 400  — live profiles lacks email / username / bio /
--                      is_active / avatar_seed / last_login_at /
--                      email_verified  →  every probe or column reference
--                      hit HTTP 400 "column does not exist".
--                      → columns are ADDed (IF NOT EXISTS).
--   2. team_members 406 — an authenticated admin could UPDATE / INSERT a
--                      roster row, but the read-back SELECT was denied
--                      (only the public "active only" SELECT policy
--                      existed), so .update().select().single() returned
--                      zero visible rows → HTTP 406 "Cannot coerce the
--                      result to a single JSON object".
--                      → an admin SELECT policy (is_fhc_admin()) is added
--                      so the RETURNING row is visible to the caller.
--   3. admin_dashboard_stats 404 — the RPC does not exist in the live
--                      project (PGRST202). It is created here so the
--                      dashboard reads server-authoritative counts.
--   4. admin_security_audit / get_fhc_role / admin_set_user_role /
--                      admin_set_application_status / admin_bootstrap /
--                      log_admin_activity — all 404 in the live project.
--                      They are created (CREATE OR REPLACE) so the admin
--                      UI never probes a missing RPC.
--
-- ALREADY DONE IN THE FRONTEND (no SQL needed for these):
--   • Homepage gates the events section behind admin_schema_status() and
--     never issues a request to public.events (which does not exist) —
--     it renders the NO ACTIVE EVENTS terminal.
--   • adminDb.js probes RLS-gated columns before every dependent query
--     and skips absents tables entirely.
--   • profileService.js strips non-live columns (username/bio/is_active…)
--     from writes so the public API never produces PGRST204.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. ROLE HELPER — single admin gate for every RLS policy + RPC.
--    CREATE OR REPLACE (idempotent): already live in some projects, but
--    this file stays self-contained for fresh databases. Implementation
--    matches supabase/team-members-admin-upgrade.sql / fhc-reconcile.sql:
--    SECURITY DEFINER, resolves the role from auth.users metadata so the
--    DB gate always matches the frontend role check.
-- ────────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────────
-- 2. PROFILES — add every column the live admin panel reads.
--    (ADD COLUMN IF NOT EXISTS: never touches existing data.)
-- ────────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.profiles to anon, authenticated;

alter table public.profiles add column if not exists full_name      text not null default '';
alter table public.profiles add column if not exists email          text;
alter table public.profiles add column if not exists username       text;
alter table public.profiles add column if not exists avatar_seed    text;
alter table public.profiles add column if not exists bio            text;
alter table public.profiles add column if not exists is_active      boolean not null default true;
alter table public.profiles add column if not exists email_verified boolean;
alter table public.profiles add column if not exists last_login_at  timestamptz;

create index if not exists profiles_role_idx      on public.profiles (role);
create index if not exists profiles_is_active_idx on public.profiles (is_active);

-- updated_at helper + trigger (guarded, idempotent)
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

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-profile trigger mirrors a new auth.users row into profiles.
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
    coalesce(new.raw_app_meta_data ->> 'role', 'user'),
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

-- ────────────────────────────────────────────────────────────────────
-- 3. PROFILES RLS — own-row select/update + admin full access.
--    (drop-if-exists / create: idempotent and permissive-OR safe.)
-- ────────────────────────────────────────────────────────────────────
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles
  for select
  using (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (id = auth.uid());

drop policy if exists "Admins can read any profile" on public.profiles;
create policy "Admins can read any profile"
  on public.profiles
  for select
  using (public.is_fhc_admin());

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles
  for update
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles
  for delete
  using (public.is_fhc_admin());

-- ────────────────────────────────────────────────────────────────────
-- 4. TEAM_MEMBERS — the CRITICAL fix.
--    Public keeps read-only access to ACTIVE rows; admins get FULL CRUD
--    INCLUDING SELECT of every row (active + inactive). The admin SELECT
--    policy is what makes .update().select().single() return exactly one
--    row again (no more HTTP 406 on the read-back).
-- ────────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.team_members to anon, authenticated;

drop policy if exists "team_members_public_select_active" on public.team_members;
create policy "team_members_public_select_active"
  on public.team_members
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "team_members_admin_select" on public.team_members;
create policy "team_members_admin_select"
  on public.team_members
  for select
  to authenticated
  using (public.is_fhc_admin());

drop policy if exists "Admins can insert team_members" on public.team_members;
create policy "Admins can insert team_members"
  on public.team_members
  for insert
  to authenticated
  with check (public.is_fhc_admin());

drop policy if exists "Admins can update team_members" on public.team_members;
create policy "Admins can update team_members"
  on public.team_members
  for update
  to authenticated
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

drop policy if exists "Admins can delete team_members" on public.team_members;
create policy "Admins can delete team_members"
  on public.team_members
  for delete
  to authenticated
  using (public.is_fhc_admin());

-- ────────────────────────────────────────────────────────────────────
-- 5. AUDIT HOOK — best-effort no-op signature. The project intentionally
--    has NO admin_activity_logs table (no dead nodes); keeping the
--    function present lets admin_* RPCs call it without conditional
--    branches. Writes are silently dropped.
-- ────────────────────────────────────────────────────────────────────
create or replace function public.log_admin_activity(
  p_action       text,
  p_entity_type  text default null,
  p_entity_id    text default null,
  p_metadata     jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  return; -- no-op by design; never blocks the primary operation
end;
$$;

grant execute on function public.log_admin_activity(text, text, text, jsonb) to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 6. ROLE RPCs
-- ────────────────────────────────────────────────────────────────────

-- get_fhc_role() — current user's role string (admin/media/member/user).
create or replace function public.get_fhc_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _uid  uuid := auth.uid();
  _role text;
begin
  if _uid is null then return 'anonymous'; end if;
  select u.raw_app_meta_data ->> 'role' into _role from auth.users u where u.id = _uid;
  if _role is not null and _role in ('admin', 'media', 'member', 'user') then
    return _role;
  end if;
  select u.raw_user_meta_data ->> 'role' into _role from auth.users u where u.id = _uid;
  if _role is not null and _role in ('admin', 'media', 'member', 'user') then
    return _role;
  end if;
  return 'user';
end;
$$;

grant execute on function public.get_fhc_role() to anon, authenticated;

-- admin_set_user_role(target, new_role) — atomic role change.
-- Restores the metadata mirror AND the profiles.role display column.
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
    raise exception 'FHC_PERMISSION_DENIED: only admins may change user roles'
      using errcode = '42501';
  end if;

  if new_role not in ('admin', 'media', 'member', 'user') then
    raise exception 'FHC_INVALID_ROLE: allowed values are admin, media, member, user'
      using errcode = 'P0001';
  end if;

  select (u.raw_app_meta_data ->> 'role') into _current
    from auth.users u where u.id = target;
  if _current is null then
    raise exception 'FHC_USER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if _current = 'admin' and new_role <> 'admin' then
    select count(*) into _target_admins
      from auth.users
     where (raw_app_meta_data ->> 'role') = 'admin';
    if _target_admins <= 1 then
      raise exception 'FHC_LAST_ADMIN: at least one admin must remain' using errcode = 'P0001';
    end if;
  end if;

  update auth.users
     set raw_app_meta_data  = jsonb_set(coalesce(raw_app_meta_data,  '{}'::jsonb), '{role}', to_jsonb(new_role)),
         raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(new_role)),
         updated_at         = now()
   where id = target;

  update public.profiles
     set role = new_role, updated_at = now()
   where id = target;

  perform public.log_admin_activity('ROLE_CHANGED', 'profiles', target::text,
    jsonb_build_object('role', new_role, 'previous', _current));
end;
$$;

grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- admin_bootstrap(target_email, new_role) — SQL-EDITOR-ONLY first admin.
create or replace function public.admin_bootstrap(
  target_email text,
  new_role     text default 'admin'
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  _uid uuid;
begin
  if new_role not in ('admin', 'media', 'member', 'user') then
    raise exception 'FHC_INVALID_ROLE' using errcode = 'P0001';
  end if;

  select id into _uid from auth.users where lower(email) = lower(target_email) limit 1;
  if _uid is null then
    raise exception 'FHC_USER_NOT_FOUND: no auth.users row with email %', target_email
      using errcode = 'P0001';
  end if;

  update auth.users
     set raw_app_meta_data  = jsonb_set(coalesce(raw_app_meta_data,  '{}'::jsonb), '{role}', to_jsonb(new_role)),
         raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(new_role)),
         updated_at         = now()
   where id = _uid;

  update public.profiles
     set role = new_role, updated_at = now()
   where id = _uid;

  perform public.log_admin_activity('BOOTSTRAP_ROLE', 'profiles', _uid::text,
    jsonb_build_object('role', new_role, 'email', target_email));
end;
$$;

revoke all on function public.admin_bootstrap(text, text) from public, anon, authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 7. APPLICATIONS RPC — atomic status transition (single transaction).
-- ────────────────────────────────────────────────────────────────────
create or replace function public.admin_set_application_status(
  p_target uuid,
  p_status text
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  _current text;
begin
  if not public.is_fhc_admin() then
    raise exception 'FHC_PERMISSION_DENIED' using errcode = '42501', hint = 'ADMIN ONLY OPERATION';
  end if;

  if p_status not in ('applied', 'under_review', 'selected', 'rejected') then
    raise exception 'FHC_INVALID_STATUS' using errcode = 'P0001';
  end if;

  select status into _current
    from public.fhc_join_applications where id = p_target;
  if _current is null then
    raise exception 'FHC_APPLICATION_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.fhc_join_applications
     set status = p_status, updated_at = now()
   where id = p_target;

  perform public.log_admin_activity('APPLICATION_STATUS_CHANGED', 'fhc_join_applications', p_target::text,
    jsonb_build_object('status', p_status, 'previous', _current));
end;
$$;

grant execute on function public.admin_set_application_status(uuid, text) to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 8. DASHBOARD + SECURITY RPCs
-- ────────────────────────────────────────────────────────────────────
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _result jsonb;
begin
  select jsonb_build_object(
    'total_users',               (select count(*) from public.profiles),
    'active_members',            (select count(*) from public.profiles where coalesce(is_active, true) = true),
    'admins',                    (select count(*) from public.profiles where role = 'admin'),
    'media',                     (select count(*) from public.profiles where role = 'media'),
    'pending_applications',      (select count(*) from public.fhc_join_applications where status in ('applied', 'under_review')),
    'under_review_applications', (select count(*) from public.fhc_join_applications where status = 'under_review'),
    'approved_applications',     (select count(*) from public.fhc_join_applications where status = 'selected'),
    'rejected_applications',     (select count(*) from public.fhc_join_applications where status = 'rejected'),
    'applications_total',        (select count(*) from public.fhc_join_applications),
    'team_members_total',        (select count(*) from public.team_members),
    'team_members_active',       (select count(*) from public.team_members where is_active = true),
    'gallery_folders',           (select count(*) from public.gallery_folders),
    'gallery_images',            (select count(*) from public.gallery_images)
  ) into _result;
  return _result;
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;

create or replace function public.admin_security_audit()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _role_source text;
  _result      jsonb;
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
    'is_admin',        public.is_fhc_admin(),
    'rls_table_count', (
      select count(distinct tablename)::int
        from pg_policies
       where schemaname = 'public'
    ),
    'table_counts', (
      select coalesce(jsonb_object_agg(tablename, row_count), '{}'::jsonb)
        from (
          select 'profiles' as tablename,             (select count(*)::int from public.profiles)             as row_count
          union all select 'team_members',            (select count(*)::int from public.team_members)
          union all select 'fhc_join_applications',   (select count(*)::int from public.fhc_join_applications)
          union all select 'gallery_folders',         (select count(*)::int from public.gallery_folders)
          union all select 'gallery_images',          (select count(*)::int from public.gallery_images)
        ) counts
    ),
    'profiles_total',  (select count(*)::int from public.profiles),
    'role_rpc_enabled', exists(
      select 1 from pg_proc p
       where p.pronamespace = 'public'::regnamespace
         and p.proname     = 'admin_set_user_role'
    )
  ) into _result;

  return _result;
end;
$$;

grant execute on function public.admin_security_audit() to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 9. REALTIME — publish the live admin tables (guarded; gallery tables
--    may not exist in a fresh project, so wrap each add).
-- ────────────────────────────────────────────────────────────────────
do $$
declare v_table text;
begin
  foreach v_table in array array[
    'profiles',
    'team_members',
    'fhc_join_applications',
    'gallery_folders',
    'gallery_images'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = v_table
    ) then
      begin
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      exception
        when others then null;
      end;
    end if;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- DONE — idempotent, safe to re-run, no dead tables created.
--
-- After running, promote an admin (SQL editor only):
--   select public.admin_bootstrap('your-email@example.com');
--
-- Expected results in the app:
--   • /admin/team      add/edit/delete/search/filters work and edits
--                      persist + read-back (no more 406).
--   • /admin           admin_dashboard_stats RPC exists → no 404.
--   • /admin/users     no more profiles 400 (is_active/email/username…).
--   • Homepage         events section renders NO ACTIVE EVENTS with zero
--                      requests to public.events.
-- ════════════════════════════════════════════════════════════════════