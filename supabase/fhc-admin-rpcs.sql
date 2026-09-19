-- ════════════════════════════════════════════════════════════════════
-- FHC (FISAT HORIZON CLUB) — ADMIN RPC MIGRATION (consolidated)
--
-- Creates ONLY the server-side RPCs the live admin panel + public site
-- actually call, and ONLY the real columns they depend on. NO dead
-- tables (events, projects, gallery_assets, highlights, site_content,
-- admin_activity_logs) are created anywhere in this file.
--
-- This closes the gap between the applied supabase/gallery.sql and the
-- rest of the RPC layer, so:
--   • admin_set_user_role()  (live, from gallery.sql) stops failing — its
--     missing deps auth_user_set_meta() + log_admin_activity() are added
--   • Dashboard gets server-authoritative admin_dashboard_stats() with
--     REAL gallery + media + member counts (no events fake)
--   • Settings gets admin_security_audit() over live catalog data
--   • Applications gets admin_set_application_status() (single transaction)
--   • get_fhc_role() + admin_bootstrap() complete the role system
--
-- Run this ENTIRE file once in the Supabase SQL editor. Fully idempotent
-- (safe to re-run). After running, make yourself (or any user) an admin:
--   select public.admin_bootstrap('you@example.com');
-- To grant the MEDIA role to a user instead:
--   select public.admin_bootstrap('mediahandle@example.com', 'media');
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. PROFILES — real columns consumed by the live admin panel
--    (is_active drives active_members; bio/email_verified are display). 
-- ────────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists bio            text;
alter table public.profiles add column if not exists is_active      boolean not null default true;
alter table public.profiles add column if not exists email_verified boolean;
alter table public.profiles add column if not exists last_login_at  timestamptz;

create index if not exists profiles_role_idx      on public.profiles (role);
create index if not exists profiles_is_active_idx on public.profiles (is_active);

-- Extend signup seeding to cover the mirror columns.
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

-- Backfill email_verified from auth metadata (display mirror only;
-- never read for privileges).
update public.profiles p
   set email_verified = (u.raw_user_meta_data ->> 'email_verified')::boolean
  from auth.users u
 where u.id = p.id
   and (u.raw_user_meta_data ->> 'email_verified') is not null
   and p.email_verified is distinct from ((u.raw_user_meta_data ->> 'email_verified')::boolean);

-- ────────────────────────────────────────────────────────────────────
-- 2. auth_user_set_meta() — write role into BOTH metadata layers.
--    Executed ONLY from inside SECURITY DEFINER parent functions or
--    via the service_role key; browser/anon never get direct access.
-- ────────────────────────────────────────────────────────────────────
create or replace function public.auth_user_set_meta(p_target uuid, p_key text, p_value text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update auth.users u
     set raw_app_meta_data  = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(p_key, p_value),
         raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(p_key, p_value),
         updated_at         = now()
   where u.id = p_target;
end;
$$;

revoke all on function public.auth_user_set_meta(uuid, text, text) from public, anon, authenticated;
grant  execute on function public.auth_user_set_meta(uuid, text, text) to service_role;

-- ────────────────────────────────────────────────────────────────────
-- 3. log_admin_activity() — audit trail hook.
--    Declared as a BEST-EFFORT NO-OP: the project intentionally has NO
--    admin_activity_logs table (no dead nodes). Keeping the function
--    present (rather than absent) lets live callers such as
--    admin_set_user_role() / admin_set_application_status() run without
--    conditional branches. Writes are silently dropped.
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
  -- No-op by design. Keep for signature compatibility with admin_* RPCs.
  return;
end;
$$;

grant execute on function public.log_admin_activity(text, text, text, jsonb) to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 4. admin_set_application_status() — atomic status transition.
--    Security-definer verifies the caller is admin, then updates the
--    application row in one transaction.
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
begin
  if not public.is_fhc_admin() then
    raise exception 'FHC_PERMISSION_DENIED' using errcode = '42501', hint = 'ADMIN ONLY OPERATION';
  end if;

  if p_status not in ('applied', 'under_review', 'selected', 'rejected') then
    raise exception 'FHC_INVALID_STATUS' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.fhc_join_applications where id = p_target) then
    raise exception 'FHC_APPLICATION_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.fhc_join_applications
     set status = p_status,
         updated_at = now()
   where id = p_target;

  perform public.log_admin_activity('APPLICATION_STATUS_CHANGED', 'fhc_join_applications', p_target::text,
    jsonb_build_object('status', p_status));
end;
$$;

grant execute on function public.admin_set_application_status(uuid, text) to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 5. admin_dashboard_stats() — live aggregate counts (NO events/projects).
--    Mirrors exactly what the admin dashboard renders: profiles, role
--    counts (incl. media), application lifecycle, team and gallery.
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
    'total_users',              (select count(*) from public.profiles),
    'active_members',           (select count(*) from public.profiles where coalesce(is_active, true) = true),
    'admins',                   (select count(*) from public.profiles where role = 'admin'),
    'media',                    (select count(*) from public.profiles where role = 'media'),
    'pending_applications',     (select count(*) from public.fhc_join_applications where status in ('applied', 'under_review')),
    'under_review_applications',(select count(*) from public.fhc_join_applications where status = 'under_review'),
    'approved_applications',    (select count(*) from public.fhc_join_applications where status = 'selected'),
    'rejected_applications',    (select count(*) from public.fhc_join_applications where status = 'rejected'),
    'applications_total',       (select count(*) from public.fhc_join_applications),
    'team_members_total',       (select count(*) from public.team_members),
    'team_members_active',      (select count(*) from public.team_members where is_active = true),
    'gallery_folders',          (select count(*) from public.gallery_folders),
    'gallery_images',           (select count(*) from public.gallery_images)
  ) into _result;
  return _result;
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 6. admin_security_audit() — live catalog audit (role source, RLS table
--    count, row counts for the real tables). No dead-table reads.
-- ────────────────────────────────────────────────────────────────────
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
          select 'profiles' as tablename, (select count(*)::int from public.profiles)             as row_count
          union all select 'team_members',       (select count(*)::int from public.team_members)
          union all select 'fhc_join_applications', (select count(*)::int from public.fhc_join_applications)
          union all select 'gallery_folders',    (select count(*)::int from public.gallery_folders)
          union all select 'gallery_images',     (select count(*)::int from public.gallery_images)
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
-- 7. get_fhc_role() — current user's role string (incl. media).
-- ────────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────────
-- 8. admin_bootstrap(email, role) — SQL-EDITOR-ONLY role promotion.
--    Revoked from anon/authenticated so browsers can never call it.
-- ────────────────────────────────────────────────────────────────────
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
         raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(new_role))
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
-- 9. admin_schema_status() — lean capability report (LIVE tables only,
--    admin_activity_logs dropped — it is intentionally absent).
-- ────────────────────────────────────────────────────────────────────
create or replace function public.admin_schema_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with wanted(table_name) as (
    values
      ('profiles'),
      ('team_members'),
      ('fhc_join_applications'),
      ('gallery_folders'),
      ('gallery_images')
  ),
  table_existence as (
    select w.table_name,
           exists(
             select 1
               from pg_class c
               join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public'
                and c.relname = w.table_name
           ) as exists
      from wanted w
  )
  select coalesce(jsonb_agg(jsonb_build_object('table_name', table_name, 'exists', exists)),
                  '[]'::jsonb)
    from table_existence;
$$;

grant execute on function public.admin_schema_status() to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 10. REALTIME — ensure gallery tables are published (dashboard live
--     refresh already subscribes to them).
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
-- DONE — idempotent, no dead tables created.
--
-- After running, promote yourself (or a member) to admin:
--   select public.admin_bootstrap('admin@example.com');
-- Or grant the MEDIA role for gallery management (admin-managed can
--   also use the Users page ROLE dropdown once this migration is live):
--   select public.admin_bootstrap('media@example.com', 'media');
-- ════════════════════════════════════════════════════════════════════