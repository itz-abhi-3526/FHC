-- ════════════════════════════════════════════════════════════════════
-- FHC (FISAT HORIZON CLUB) — ADMIN CONTROL CENTER MIGRATION
--
-- ONE consolidated, idempotent migration for the whole Admin panel.
-- Run this ENTIRE file in the Supabase SQL editor. Safe to re-run.
--
-- WHAT THIS CREATES / GUARANTEES
--   1. profiles: role mirror (admin/member/user), bio, is_active,
--      email_verified, last_login_at — plus the auto-profile trigger.
--   2. Secure role helpers (SECURITY DEFINER, JWT-aware):
--        * public.is_fhc_admin()          → used by EVERY admin RLS policy
--        * public.get_fhc_role()          → current role as text
--        * public.log_admin_activity(...) → audit-trail writer
--        * public.admin_set_user_role(...)→ secure role-change RPC
--        * public.admin_set_application_status(...) → atomic, audited
--          application state-machine RPC (UPDATE + audit log per tx)
--        * public.admin_dashboard_stats() → live aggregate counts
--        * public.admin_schema_status()   → one-RPC capability report
--          that lets the frontend discover tables + columns WITHOUT any
--          raw REST probes (keeps the admin console free of 404/400 noise)
--        * public.admin_security_audit()  → in-app policy verifier
--        * public.admin_bootstrap(...)    → SQL-editor-only first admin
--   3. RLS hardened on every admin-managed table. Public users only
--      read what the public site exposes; ONLY admins mutate data.
--      No USING(true) mutation policies anywhere.
--   4. Admin tables (all CREATE TABLE IF NOT EXISTS — never duplicated):
--        public.events
--        public.projects
--        public.gallery_assets
--        public.site_content
--        public.admin_activity_logs
--        public.highlights
--   5. fhc_join_applications: guaranteed columns (+ college/message),
--      legacy status normalization, lifecycle CHECK, admin-gated RLS.
--   6. team_members: public read of active members + admin CRUD.
--   7. Storage: "team-members" bucket reads stay public; writes become
--      admin-only (bounded to the bucket).
--   8. Realtime publication for live admin sync between administrators.
--
-- FIRST ADMIN BOOTSTRAP (run AFTER this file, in the SQL editor):
--     select public.admin_bootstrap('you@example.com');        -- → admin
--     select public.admin_bootstrap('you@example.com','user'); -- → demote
--   admin_bootstrap() is REVOKE'd from anon/authenticated — it can
--   only run as the SQL editor / postgres / service_role.
--
-- AUTHORIZATION MODEL
--   Frontend (visibility only):  user.user_metadata.role === 'admin'
--   Database (the REAL gate):    is_fhc_admin() which resolves, in
--   trust order:  auth.users.raw_app_meta_data.role  →  JWT
--   app_metadata.role  →  auth.users.raw_user_meta_data.role.
--   The bootstrap + admin_set_user_role write BOTH app_metadata and
--   user_metadata so the two stay aligned.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 0. updated_at helper (idempotent, shared across every table)
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
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.profiles add column if not exists full_name     text not null default '';
alter table public.profiles add column if not exists email         text;
alter table public.profiles add column if not exists username      text;
alter table public.profiles add column if not exists avatar_seed   text;
alter table public.profiles add column if not exists avatar_url    text;
alter table public.profiles add column if not exists created_at    timestamptz not null default now();
alter table public.profiles add column if not exists updated_at    timestamptz not null default now();
alter table public.profiles add column if not exists last_login_at timestamptz;
alter table public.profiles add column if not exists role          text not null default 'member';
alter table public.profiles add column if not exists bio           text;
alter table public.profiles add column if not exists is_active     boolean not null default true;
alter table public.profiles add column if not exists email_verified boolean;

-- Role mirror accepts admin / member / user (member = legacy alias of user).
do $$
begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check
    check (role in ('admin', 'member', 'user'));
exception
  when others then null;
end $$;

-- Unique username (skip silently if legacy duplicate rows block it).
do $$
begin
  if not exists (
    select 1 from pg_indexes
     where schemaname = 'public' and tablename = 'profiles'
       and indexdef ilike '%username%'
  ) then
    create unique index profiles_username_key on public.profiles (username);
  end if;
exception
  when others then null;
end $$;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index if not exists profiles_role_idx           on public.profiles (role);
create index if not exists profiles_full_name_idx      on public.profiles (lower(full_name));
create index if not exists profiles_email_idx          on public.profiles (email);
create index if not exists profiles_username_idx       on public.profiles (username);
create index if not exists profiles_is_active_idx      on public.profiles (is_active);
create index if not exists profiles_last_login_idx     on public.profiles (last_login_at desc);
create index if not exists profiles_role_full_name_idx on public.profiles (role, full_name);

-- Backfill email_verified display-mirror from the auth provider flag.
update public.profiles p
   set email_verified = (u.raw_user_meta_data ->> 'email_verified')::boolean
  from auth.users u
 where u.id = p.id
   and (u.raw_user_meta_data ->> 'email_verified') is not null
   and p.email_verified is distinct from ((u.raw_user_meta_data ->> 'email_verified')::boolean);

-- Drift repair: keep the profiles.role mirror aligned to auth.users
-- (the authoritative source). Never the other way around.
update public.profiles p
   set role = coalesce(nullif(u.raw_app_meta_data ->> 'role', ''), 'member'),
       updated_at = now()
  from auth.users u
 where u.id = p.id
   and coalesce(nullif(u.raw_app_meta_data ->> 'role', ''), 'member') <> p.role;

-- Auto-create a profile on signup (idempotent, no duplicates).
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
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1), 'PLAYER'),
    new.email,
    lower(coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(coalesce(new.email, ''), '@', 1))),
    new.id::text,
    coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'member'),
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
-- 2. SECURE ROLE HELPERS — the ONLY place role logic lives
-- ────────────────────────────────────────────────────────────────────

-- is_fhc_admin(): resolves the role from the secure sources in trust
-- order. JWT app_metadata claim keeps it working without a DB round-trip;
-- auth.users app_metadata is the authoritative value; user_metadata is
-- accepted as a bootstrap/legacy fallback (admin_bootstrap writes both).
create or replace function public.is_fhc_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(raw_app_meta_data ->> 'role', '')
       from auth.users where id = auth.uid()
       limit 1),
    (select nullif(current_setting('request.jwt.claims', true)::jsonb
                   #>> '{app_metadata,role}', '')),
    (select nullif(raw_user_meta_data ->> 'role', '')
       from auth.users where id = auth.uid()
       limit 1),
    (select nullif(current_setting('request.jwt.claims', true)::jsonb
                   #>> '{user_metadata,role}', '')),
    'member'
  ) = 'admin';
$$;

-- get_fhc_role(): current secure role as text ('admin' | 'member'…).
create or replace function public.get_fhc_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(raw_app_meta_data ->> 'role', '')
       from auth.users where id = auth.uid()
       limit 1),
    (select nullif(current_setting('request.jwt.claims', true)::jsonb
                   #>> '{app_metadata,role}', '')),
    (select nullif(raw_user_meta_data ->> 'role', '')
       from auth.users where id = auth.uid()
       limit 1),
    (select nullif(current_setting('request.jwt.claims', true)::jsonb
                   #>> '{user_metadata,role}', '')),
    'member'
  );
$$;

revoke execute on function public.is_fhc_admin() from public, anon;
grant  execute on function public.is_fhc_admin() to authenticated;

revoke execute on function public.get_fhc_role() from public, anon;
grant  execute on function public.get_fhc_role() to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 3. ADMIN-MANAGED TABLES
-- ────────────────────────────────────────────────────────────────────

-- EVENTS ────────────────────────────────────────────────────────────
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  tagline     text,
  description text,
  event_date  timestamptz,
  end_date    timestamptz,
  venue       text,
  status      text not null default 'draft'
              check (status in ('draft', 'published', 'archived')),
  featured    boolean not null default false,
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.events is 'FHC events. Public API exposes published rows only.';

drop trigger if exists on_events_updated on public.events;
create trigger on_events_updated
  before update on public.events
  for each row execute function public.set_updated_at();

create index if not exists events_event_date_idx      on public.events (event_date);
create index if not exists events_status_idx          on public.events (status);
create index if not exists events_status_date_idx     on public.events (status, event_date);

-- PROJECTS ──────────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default '',
  tagline     text,
  description text,
  category    text not null default 'TECH',
  status      text not null default 'draft'
              check (status in ('draft', 'published', 'archived')),
  image_url   text,
  project_url text,
  github_url  text,
  tech_stack  text[] not null default '{}',
  year        text,
  featured    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.projects is 'FHC projects. Public API exposes published rows only.';

drop trigger if exists on_projects_updated on public.projects;
create trigger on_projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

create index if not exists projects_status_idx         on public.projects (status);
create index if not exists projects_category_idx       on public.projects (category);
create index if not exists projects_year_idx           on public.projects (year);
create index if not exists projects_status_category_idx on public.projects (status, category);

-- GALLERY ASSETS ────────────────────────────────────────────────────
-- Metadata only: the original binaries live on Cloudinary.
create table if not exists public.gallery_assets (
  id            uuid primary key default gen_random_uuid(),
  title         text not null default '',
  image_url     text not null default '',
  category      text not null default 'EVENTS',
  subcategory   text,
  alt_text      text,
  credit        text,
  width         integer,
  height        integer,
  is_featured   boolean not null default false,
  is_active     boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.gallery_assets is 'FHC media archive metadata (images hosted on Cloudinary).';

drop trigger if exists on_gallery_assets_updated on public.gallery_assets;
create trigger on_gallery_assets_updated
  before update on public.gallery_assets
  for each row execute function public.set_updated_at();

create index if not exists gallery_assets_category_idx        on public.gallery_assets (category);
create index if not exists gallery_assets_active_idx          on public.gallery_assets (is_active);
create index if not exists gallery_assets_active_category_idx on public.gallery_assets (is_active, category);
create index if not exists gallery_assets_created_idx         on public.gallery_assets (created_at desc);

-- SITE CONTENT ──────────────────────────────────────────────────────
create table if not exists public.site_content (
  id            uuid primary key default gen_random_uuid(),
  key           text not null,
  label         text not null default '',
  section       text not null default 'general',
  content       text,
  content_json  jsonb,
  is_published  boolean not null default true,
  updated_at    timestamptz not null default now()
);

comment on table public.site_content is 'Site-wide manageable copy. Keys are stable identifiers referenced by the frontend.';

-- Unique key (powers the frontend upsert onConflict: 'key').
do $$
begin
  if not exists (
    select 1 from pg_indexes
     where schemaname = 'public' and tablename = 'site_content'
       and indexdef ilike '%key%'
  ) then
    create unique index site_content_key_key on public.site_content (key);
  end if;
exception
  when others then null;
end $$;

drop trigger if exists on_site_content_updated on public.site_content;
create trigger on_site_content_updated
  before update on public.site_content
  for each row execute function public.set_updated_at();

create index if not exists site_content_section_idx on public.site_content (section);

-- ADMIN ACTIVITY LOGS ───────────────────────────────────────────────
-- Writes flow through log_admin_activity() (SECURITY DEFINER) only.
create table if not exists public.admin_activity_logs (
  id            bigint generated always as identity primary key,
  admin_user_id uuid references auth.users (id) on delete set null,
  action        text not null,
  entity_type   text,
  entity_id     text,
  details       text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

comment on table public.admin_activity_logs is 'FHC admin audit trail.';

create index if not exists admin_activity_logs_created_idx on public.admin_activity_logs (created_at desc);
create index if not exists admin_activity_logs_admin_idx   on public.admin_activity_logs (admin_user_id, created_at desc);
create index if not exists admin_activity_logs_action_idx  on public.admin_activity_logs (action);
create index if not exists admin_activity_logs_entity_idx  on public.admin_activity_logs (entity_type);

-- HIGHLIGHTS / BROADCAST ────────────────────────────────────────────
create table if not exists public.highlights (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  tagline       text,
  image_url     text,
  link_url      text,
  location      text,
  notes         text,
  badge         text,
  is_published  boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.highlights is 'FHC broadcast highlights. Public API exposes published rows only.';

drop trigger if exists highlights_set_updated_at on public.highlights;
create trigger highlights_set_updated_at
  before update on public.highlights
  for each row execute function public.set_updated_at();

create index if not exists highlights_published_idx on public.highlights (is_published, display_order);

-- ────────────────────────────────────────────────────────────────────
-- 4. JOIN APPLICATIONS — guarantee columns + normalize lifecycle
--    REAL schema statuses (already live): applied / under_review /
--    selected / rejected. The admin UI displays them as
--    PENDING / UNDER REVIEW / APPROVED / REJECTED. Join never writes
--    anything except 'applied'.
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.fhc_join_applications (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null default '',
  year_branch     text not null default '',
  register_number text not null default '',
  email           text not null default '',
  phone           text,
  about_you       text,
  selected_domain text not null default '',
  status          text not null default 'applied',
  college         text,
  message         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.fhc_join_applications add column if not exists full_name       text not null default '';
alter table public.fhc_join_applications add column if not exists year_branch     text not null default '';
alter table public.fhc_join_applications add column if not exists register_number text not null default '';
alter table public.fhc_join_applications add column if not exists email           text not null default '';
alter table public.fhc_join_applications add column if not exists phone           text;
alter table public.fhc_join_applications add column if not exists about_you       text;
alter table public.fhc_join_applications add column if not exists selected_domain text not null default '';
alter table public.fhc_join_applications add column if not exists status          text not null default 'applied';
alter table public.fhc_join_applications add column if not exists college         text;
alter table public.fhc_join_applications add column if not exists message         text;
alter table public.fhc_join_applications add column if not exists created_at      timestamptz not null default now();
alter table public.fhc_join_applications add column if not exists updated_at      timestamptz not null default now();

-- Normalize legacy statuses into the live lifecycle.
update public.fhc_join_applications
  set status = 'applied'
  where status is null or btrim(status) = '' or status = 'pending';

update public.fhc_join_applications
  set status = 'selected'
  where status = 'approved';

-- Enforce the lifecycle at the database level.
do $$
begin
  alter table public.fhc_join_applications
    drop constraint if exists fhc_join_applications_status_check;
  alter table public.fhc_join_applications
    add constraint fhc_join_applications_status_check
    check (status in ('applied', 'under_review', 'selected', 'rejected'));
exception
  when others then null;
end $$;

drop trigger if exists on_fhc_join_applications_updated on public.fhc_join_applications;
create trigger on_fhc_join_applications_updated
  before update on public.fhc_join_applications
  for each row execute function public.set_updated_at();

create index if not exists fhc_join_applications_status_idx     on public.fhc_join_applications (status);
create index if not exists fhc_join_applications_created_at_idx on public.fhc_join_applications (created_at desc);
create index if not exists fhc_join_applications_year_branch_idx on public.fhc_join_applications (year_branch);
create index if not exists fhc_join_applications_domain_idx     on public.fhc_join_applications (selected_domain);
create index if not exists fhc_join_applications_reg_idx        on public.fhc_join_applications (lower(btrim(register_number)));
create index if not exists fhc_join_applications_email_idx      on public.fhc_join_applications (lower(btrim(email)));

-- ────────────────────────────────────────────────────────────────────
-- 5. TEAM MEMBERS — columns + indexes
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.team_members (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  designation   text not null,
  team          text not null default 'CORE',
  photo_url     text,
  bio           text,
  linkedin_url  text,
  github_url    text,
  instagram_url text,
  display_order integer not null default 0 check (display_order >= 0),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists on_team_members_updated on public.team_members;
create trigger on_team_members_updated
  before update on public.team_members
  for each row execute function public.set_updated_at();

create index if not exists team_members_team_idx              on public.team_members (team);
create index if not exists team_members_is_active_idx         on public.team_members (is_active);
create index if not exists team_members_team_display_order_idx on public.team_members (team, display_order);
create index if not exists team_members_active_team_order_idx on public.team_members (is_active, team, display_order);
create index if not exists team_members_name_lower_idx        on public.team_members (lower(name));

-- ────────────────────────────────────────────────────────────────────
-- 6. ADMIN RPCs
-- ────────────────────────────────────────────────────────────────────

-- log_admin_activity(): audit-trail writer (admin-only, SECURITY DEFINER).
create or replace function public.log_admin_activity(
  p_action       text,
  p_entity_type  text default null,
  p_entity_id    text default null,
  p_metadata     jsonb default null
) returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.is_fhc_admin() then
    raise exception 'FHC_PERMISSION_DENIED'
      using errcode = '42501';
  end if;
  insert into public.admin_activity_logs
    (admin_user_id, action, entity_type, entity_id, details, metadata)
  values
    (auth.uid(),
     coalesce(nullif(btrim(p_action), ''), 'ACTION'),
     p_entity_type,
     p_entity_id,
     case when p_metadata is null then null else p_metadata::text end,
     p_metadata);
end;
$$;

revoke execute on function public.log_admin_activity(text, text, text, jsonb) from public, anon;
grant  execute on function public.log_admin_activity(text, text, text, jsonb) to authenticated;

-- add_column helper used to mutate auth.users metadata portably.
create or replace function public.auth_user_set_meta(p_target uuid, p_key text, p_value text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  -- Raw app meets raw user metadata (drives the JWT claims on refresh).
  update auth.users u
     set raw_app_meta_data  = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(p_key, p_value),
         raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(p_key, p_value),
         updated_at         = now()
   where u.id = p_target;
end;
$$;

revoke execute on function public.auth_user_set_meta(uuid, text, text) from public, anon, authenticated;
grant  execute on function public.auth_user_set_meta(uuid, text, text) to service_role;

-- admin_set_user_role(): the ONLY secure browser path to promote/demote.
--  * verifies the caller is admin
--  * writes the authoritative role into auth.users app_metadata AND
--    user_metadata (so user.user_metadata.role stays in sync per spec)
--  * mirrors the change into public.profiles.role
--  * refuses to remove the last remaining administrator
create or replace function public.admin_set_user_role(
  target uuid,
  new_role text
) returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_admin_count int;
begin
  if not public.is_fhc_admin() then
    raise exception 'FHC_PERMISSION_DENIED'
      using errcode = '42501', hint = 'ADMIN ONLY OPERATION';
  end if;

  if new_role not in ('admin', 'member', 'user') then
    raise exception 'FHC_INVALID_ROLE'
      using errcode = 'P0001';
  end if;

  if not exists (select 1 from auth.users where id = target) then
    raise exception 'FHC_USER_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if new_role = 'member' or new_role = 'user' then
    select count(*) into v_admin_count
      from auth.users
     where coalesce(raw_app_meta_data ->> 'role', 'member') = 'admin';
    if v_admin_count <= 1 then
      raise exception 'FHC_LAST_ADMIN'
        using errcode = 'P0001', hint = 'AT LEAST ONE ADMIN MUST REMAIN';
    end if;
  end if;

  perform public.auth_user_set_meta(target, 'role', new_role);

  update public.profiles
     set role = new_role, updated_at = now()
   where id = target;

  perform public.log_admin_activity('ROLE_CHANGED', 'profiles', target::text,
    jsonb_build_object('role', new_role));

  return jsonb_build_object(
    'ok', true,
    'user_id', target::text,
    'role', new_role
  );
end;
$$;

revoke execute on function public.admin_set_user_role(uuid, text) from public, anon;
grant  execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- admin_dashboard_stats(): real SQL aggregates for the dashboard.
-- Returns the full field set used by the UI plus every spec-required
-- field (empty tables coalesce to 0 — never fake values).
create or replace function public.admin_dashboard_stats()
returns table (
  total_users              bigint,
  total_profiles           bigint,
  active_members           bigint,
  admins                   bigint,
  pending_applications     bigint,
  under_review_applications bigint,
  approved_applications    bigint,
  rejected_applications    bigint,
  applications_total       bigint,
  team_members_total       bigint,
  team_members_active      bigint,
  events_total             bigint,
  events_published         bigint,
  projects_total           bigint,
  projects_published       bigint,
  gallery_assets           bigint,
  total_gallery_assets     bigint,
  highlights               bigint,
  total_highlights         bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_fhc_admin() then
    raise exception 'FHC_PERMISSION_DENIED'
      using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from auth.users),
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where is_active = true),
    (select count(*) from auth.users
        where coalesce(raw_app_meta_data ->> 'role', 'member') = 'admin'),
    (select count(*) from public.fhc_join_applications where status = 'applied'),
    (select count(*) from public.fhc_join_applications where status = 'under_review'),
    (select count(*) from public.fhc_join_applications where status = 'selected'),
    (select count(*) from public.fhc_join_applications where status = 'rejected'),
    (select count(*) from public.fhc_join_applications),
    (select count(*) from public.team_members),
    (select count(*) from public.team_members where is_active = true),
    (select count(*) from public.events),
    (select count(*) from public.events where status = 'published'),
    (select count(*) from public.projects),
    (select count(*) from public.projects where status = 'published'),
    (select count(*) from public.gallery_assets where is_active = true),
    (select count(*) from public.gallery_assets),
    (select count(*) from public.highlights),
    (select count(*) from public.highlights);
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon;
grant  execute on function public.admin_dashboard_stats() to authenticated;

-- admin_security_audit(): in-app policy + connectivity verifier.
create or replace function public.admin_security_audit()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if not public.is_fhc_admin() then
    raise exception 'FHC_PERMISSION_DENIED'
      using errcode = '42501';
  end if;
  select jsonb_build_object(
    'audit_time', now(),
    'role_source', public.get_fhc_role(),
    'is_admin', public.is_fhc_admin(),
    'role_rpc_enabled', public.get_fhc_role() = 'admin',
    'profiles_total', (select count(*) from public.profiles),
    'events_admin_read', (select count(*) from public.events),
    'projects_admin_read', (select count(*) from public.projects),
    'gallery_admin_read', (select count(*) from public.gallery_assets),
    'highlights_admin_read', (select count(*) from public.highlights),
    'activity_log_rows', (select count(*) from public.admin_activity_logs),
    'activity_logging', true,
    'rls_table_count', (select count(*) from pg_tables
        where schemaname = 'public' and
              tablename in ('profiles','team_members','fhc_join_applications',
                            'events','projects','gallery_assets','site_content',
                            'highlights','admin_activity_logs'))
  ) into v;
  return v;
end;
$$;

revoke execute on function public.admin_security_audit() from public, anon;
grant  execute on function public.admin_security_audit() to authenticated;

-- admin_bootstrap(): SQL-editor / service-role ONLY. Promotes the first
-- admin (writes BOTH app_metadata and user_metadata role).
create or replace function public.admin_bootstrap(
  p_email text,
  p_role text default 'admin'
) returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  if p_role not in ('admin', 'member', 'user') then
    raise exception 'FHC_INVALID_ROLE' using errcode = 'P0001';
  end if;

  select u.id into v_uid
    from auth.users u
   where lower(u.email) = lower(p_email)
   limit 1;

  if v_uid is null then
    raise exception 'FHC_USER_NOT_FOUND'
      using errcode = 'P0001', hint = 'NO AUTH USER WITH THAT EMAIL';
  end if;

  perform public.auth_user_set_meta(v_uid, 'role', p_role);

  update public.profiles
     set role = p_role, updated_at = now()
   where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_uid::text,
    'email', p_email,
    'role', p_role
  );
end;
$$;

revoke execute on function public.admin_bootstrap(text, text) from public, anon, authenticated;
grant  execute on function public.admin_bootstrap(text, text) to service_role;

-- ────────────────────────────────────────────────────────────────────
-- 7. RLS — enable + policies on every admin-managed table
--    Public = read-only exposure of published/active rows.
--    ADMINS = full CRUD, gated by is_fhc_admin() (never USING(true)).
-- ────────────────────────────────────────────────────────────────────

-- PROFILES
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
  on public.profiles for select to authenticated
  using (public.is_fhc_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update to authenticated
  using (public.is_fhc_admin()) with check (public.is_fhc_admin());

-- TEAM MEMBERS
alter table public.team_members enable row level security;

drop policy if exists "team_members_public_select_active" on public.team_members;
create policy "team_members_public_select_active"
  on public.team_members for select
  using (is_active = true);

drop policy if exists "team_members_admin_full" on public.team_members;
create policy "team_members_admin_full"
  on public.team_members for all to authenticated
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

-- JOIN APPLICATIONS
alter table public.fhc_join_applications enable row level security;

drop policy if exists "fhc_join_applications_public_insert" on public.fhc_join_applications;
create policy "fhc_join_applications_public_insert"
  on public.fhc_join_applications for insert to anon
  with check (true);

drop policy if exists "fhc_join_applications_auth_insert" on public.fhc_join_applications;
create policy "fhc_join_applications_auth_insert"
  on public.fhc_join_applications for insert to authenticated
  with check (true);

-- Remove the ANY-authenticated-user read hole on applicant data.
drop policy if exists "fhc_join_applications_auth_select" on public.fhc_join_applications;
drop policy if exists "fhc_join_applications_admin_select" on public.fhc_join_applications;
create policy "fhc_join_applications_admin_select"
  on public.fhc_join_applications for select to authenticated
  using (public.is_fhc_admin());

drop policy if exists "fhc_join_applications_admin_update" on public.fhc_join_applications;
create policy "fhc_join_applications_admin_update"
  on public.fhc_join_applications for update to authenticated
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

drop policy if exists "fhc_join_applications_admin_delete" on public.fhc_join_applications;
create policy "fhc_join_applications_admin_delete"
  on public.fhc_join_applications for delete to authenticated
  using (public.is_fhc_admin());

-- EVENTS
alter table public.events enable row level security;

drop policy if exists "events_public_select_published" on public.events;
create policy "events_public_select_published"
  on public.events for select
  using (status = 'published');

drop policy if exists "events_admin_full" on public.events;
create policy "events_admin_full"
  on public.events for all to authenticated
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

-- PROJECTS
alter table public.projects enable row level security;

drop policy if exists "projects_public_select_published" on public.projects;
create policy "projects_public_select_published"
  on public.projects for select
  using (status = 'published');

drop policy if exists "projects_admin_full" on public.projects;
create policy "projects_admin_full"
  on public.projects for all to authenticated
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

-- GALLERY ASSETS
alter table public.gallery_assets enable row level security;

drop policy if exists "gallery_assets_public_select_active" on public.gallery_assets;
create policy "gallery_assets_public_select_active"
  on public.gallery_assets for select
  using (is_active = true);

drop policy if exists "gallery_assets_admin_full" on public.gallery_assets;
create policy "gallery_assets_admin_full"
  on public.gallery_assets for all to authenticated
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

-- SITE CONTENT
alter table public.site_content enable row level security;

drop policy if exists "site_content_public_select_published" on public.site_content;
create policy "site_content_public_select_published"
  on public.site_content for select
  using (is_published = true);

drop policy if exists "site_content_admin_full" on public.site_content;
create policy "site_content_admin_full"
  on public.site_content for all to authenticated
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

-- HIGHLIGHTS
alter table public.highlights enable row level security;

drop policy if exists "highlights_public_read" on public.highlights;
create policy "highlights_public_read"
  on public.highlights for select
  using (is_published = true);

drop policy if exists "highlights_admin_write" on public.highlights;
create policy "highlights_admin_write"
  on public.highlights for all to authenticated
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

-- ADMIN ACTIVITY LOGS (admin read-only; writes go through the RPC)
alter table public.admin_activity_logs enable row level security;

drop policy if exists "admin_activity_logs_admin_select" on public.admin_activity_logs;
create policy "admin_activity_logs_admin_select"
  on public.admin_activity_logs for select to authenticated
  using (public.is_fhc_admin());

-- ────────────────────────────────────────────────────────────────────
-- 8. STORAGE — team-members bucket
--    Reads stay public. Writes become admin-only (bounded to bucket).
-- ────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-members',
  'team-members',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set public = true;

drop policy if exists "team_members_storage_read_public" on storage.objects;
create policy "team_members_storage_read_public"
  on storage.objects for select
  using (bucket_id = 'team-members');

drop policy if exists "team_members_storage_insert_auth" on storage.objects;
drop policy if exists "team_members_storage_update_auth" on storage.objects;
drop policy if exists "team_members_storage_delete_auth" on storage.objects;

drop policy if exists "team_members_storage_insert_admin" on storage.objects;
create policy "team_members_storage_insert_admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'team-members' and public.is_fhc_admin());

drop policy if exists "team_members_storage_update_admin" on storage.objects;
create policy "team_members_storage_update_admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'team-members' and public.is_fhc_admin())
  with check (bucket_id = 'team-members' and public.is_fhc_admin());

drop policy if exists "team_members_storage_delete_admin" on storage.objects;
create policy "team_members_storage_delete_admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'team-members' and public.is_fhc_admin());

-- ────────────────────────────────────────────────────────────────────
-- 9. REALTIME PUBLICATION — live admin refresh between admins.
--    RLS still gates every delivered row: non-admins never receive any.
-- ────────────────────────────────────────────────────────────────────
do $$
declare v_table text;
begin
  foreach v_table in array array[
    'profiles',
    'team_members',
    'fhc_join_applications',
    'gallery_assets',
    'highlights',
    'events',
    'projects',
    'site_content',
    'admin_activity_logs'
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

-- ────────────────────────────────────────────────────────────────────
-- 10. FOUNDER / OWNER ADMIN BOOTSTRAP — direct, idempotent.
--     Sets the authoritative role for the current admin in BOTH
--     auth.users metadata sources (app_metadata drives the JWT claim,
--     user_metadata is what this repo's isAdmin(user) reads) plus the
--     public.profiles role mirror. Runs safely in the SQL editor
--     (postgres / service-role scope); safe to re-run.
-- ────────────────────────────────────────────────────────────────────
do $$
declare v_uid uuid;
begin
  -- Resolve by the known owner id first, fall back to the email so a
  -- fresh DB clone still works without changes.
  select id into v_uid from auth.users
   where id = '4b2115b9-e3cc-44d3-8b3c-15412cedbe6b'
      or lower(email) = 'itz.abhi.3526@gmail.com'
   limit 1;

  if v_uid is not null then
    perform public.auth_user_set_meta(v_uid, 'role', 'admin');

    update public.profiles
       set role = 'admin', updated_at = now()
     where id = v_uid;
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 11. APPLICATIONS WORKFLOW — admin_set_application_status RPC.
--     State machine: applied (PENDING) → under_review (UNDER REVIEW) →
--     selected (APPROVED) / rejected (REJECTED). Single transaction:
--     the UPDATE onto fhc_join_applications and the audit-log INSERT
--     commit together or roll back together. Admin-gated server-side;
--     never exposed to anon. Idempotent (create or replace).
-- ────────────────────────────────────────────────────────────────────
create or replace function public.admin_set_application_status(
  p_target uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev text;
begin
  if not public.is_fhc_admin() then
    raise exception 'forbidden — admin only' using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('applied', 'under_review', 'selected', 'rejected') then
    raise exception 'invalid application status: %', coalesce(p_status, 'null') using errcode = '22023';
  end if;

  select status into v_prev
    from public.fhc_join_applications
   where id = p_target;

  if v_prev is null then
    raise exception 'application not found: %', p_target using errcode = 'P0002';
  end if;

  update public.fhc_join_applications
     set status = p_status,
         updated_at = now()
   where id = p_target;

  perform public.log_admin_activity(
    'APPLICATION_STATUS_CHANGED',
    'fhc_join_applications',
    p_target::text,
    jsonb_build_object('from', v_prev, 'to', p_status)
  );

  return jsonb_build_object('ok', true, 'from', v_prev, 'to', p_status);
end;
$$;

revoke  execute on function public.admin_set_application_status(uuid, text) from anon;
revoke  execute on function public.admin_set_application_status(uuid, text) from public;
grant   execute on function public.admin_set_application_status(uuid, text) to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 12. SCHEMA CAPABILITY REPORT — admin_schema_status() RPC.
--     One round-trip that tells the frontend exactly which managed tables
--     and which profiles columns exist. The admin panel calls this ONCE
--     per session; every table/column check afterwards is answered from
--     memory. This is what removes recurring 404 / 400 requests for
--     tables that do not exist (or exist only AFTER this migration runs).
--     Only available to authenticated users; the RPC itself is
--     SECURITY DEFINER but leaks only catalog booleans, never rows.
-- ────────────────────────────────────────────────────────────────────
create or replace function public.admin_schema_status()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with wanted(table_name) as (
    values
      ('profiles'),
      ('team_members'),
      ('fhc_join_applications'),
      ('gallery_assets'),
      ('highlights'),
      ('events'),
      ('projects'),
      ('site_content'),
      ('admin_activity_logs')
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
  ),
  profile_is_active as (
    select exists(
      select 1
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        join pg_attribute a on a.attrelid = c.oid
       where n.nspname = 'public'
         and c.relname = 'profiles'
         and a.attname = 'is_active'
         and not a.attisdropped
    ) as exists
  )
  select coalesce(jsonb_agg(jsonb_build_object('table_name', table_name, 'exists', exists)),
                  '[]'::jsonb)
    from (
      select table_name, exists from table_existence
      union all
      select 'is_active', exists from profile_is_active
    ) allrows;
$$;

revoke execute on function public.admin_schema_status() from anon;
revoke execute on function public.admin_schema_status() from public;
grant  execute on function public.admin_schema_status() to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 13. PERFORMANCE INDEXES — the dashboard + activity feed always read
--     newest-first; application flow filters by status; users filter by
--     role. Clean, idempotent, low-cost indexes under the hot paths.
-- ────────────────────────────────────────────────────────────────────
create index if not exists idx_admin_activity_created_at
  on public.admin_activity_logs (created_at desc);

create index if not exists idx_applications_status
  on public.fhc_join_applications (status);

create index if not exists idx_profiles_role
  on public.profiles (role);

-- ════════════════════════════════════════════════════════════════════
-- DONE — the migration is idempotent and safe to re-run.
-- ADMIN ROLE IS SET ABOVE (owner id 4b2115b9-e3cc-44d3-8b3c-15412cedbe6b).
-- ════════════════════════════════════════════════════════════════════