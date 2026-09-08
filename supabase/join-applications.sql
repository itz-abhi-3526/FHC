-- ════════════════════════════════════════════════════════════════════
-- FHC (FISAT HORIZON CLUB) — PUBLIC JOIN APPLICATIONS
--
-- Backing schema for the public "/join" application form.
-- Run this entire file in the Supabase SQL editor against your project.
-- It is safe to re-run (idempotent): existing tables/rows are preserved.
--
-- What this creates / guarantees:
--   1. public.fhc_join_applications  — one row per submitted application
--   2. Missing columns are ADDED to an already-existing table (never
--      duplicated, never loses existing data)
--   3. Row Level Security:
--        - anon (public)  -> INSERT allowed  (public join form)
--        - anon (public)  -> SELECT / UPDATE / DELETE DENIED (privacy)
--        - authenticated  -> SELECT allowed  (review/approval path)
--   4. Unique indexes on register_number + normalized email to power the
--      "PLAYER ALREADY REGISTERED" path — created only when safe (skipped
--      automatically if legacy duplicate rows already exist)
--   5. updated_at trigger + status index
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 0. updated_at helper (shared with team_members/profiles; defined here
--    too so this file is self-contained and idempotent).
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
-- 1. TABLE — create if missing, then guarantee the exact columns the
--    Join form writes into. Existing rows are never touched.
--    Columns: id, full_name, year_branch, register_number, email,
--             phone, about_you, selected_domain, status,
--             created_at, updated_at
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
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Guarantee each field on tables created before this migration ran
-- (add column if not exists = no duplicates, no data loss).
alter table public.fhc_join_applications add column if not exists full_name       text not null default '';
alter table public.fhc_join_applications add column if not exists year_branch     text not null default '';
alter table public.fhc_join_applications add column if not exists register_number text not null default '';
alter table public.fhc_join_applications add column if not exists email           text not null default '';
alter table public.fhc_join_applications add column if not exists phone           text;
alter table public.fhc_join_applications add column if not exists about_you       text;
alter table public.fhc_join_applications add column if not exists selected_domain text not null default '';
alter table public.fhc_join_applications add column if not exists status          text not null default 'applied';
alter table public.fhc_join_applications add column if not exists created_at      timestamptz not null default now();
alter table public.fhc_join_applications add column if not exists updated_at      timestamptz not null default now();

-- Status lifecycle: applied → under_review → selected | rejected.
-- Legacy 'pending' (old default) normalizes to 'applied'; old 'approved'
-- (pre-review schema) normalizes to 'selected'. Submission rows are
-- NEVER marked selected/approved by the Join page.
update public.fhc_join_applications
  set status = 'applied'
  where status is null or btrim(status) = '' or status = 'pending';

update public.fhc_join_applications
  set status = 'selected'
  where status = 'approved';

-- Enforce the lifecycle at the database level. Safe to re-run.
do $$
begin
  alter table public.fhc_join_applications
    drop constraint if exists fhc_join_applications_status_check;
  alter table public.fhc_join_applications
    add constraint fhc_join_applications_status_check
    check (status in ('applied', 'under_review', 'selected', 'rejected'));
exception
  when others then null; -- unexpected stray values: inspect manually
end $$;

comment on table public.fhc_join_applications is 'FHC public join applications (status: applied / under_review / selected / rejected).';
comment on column public.fhc_join_applications.register_number is 'Student register number — uniquely identifies a player.';
comment on column public.fhc_join_applications.selected_domain is 'One of: Web Development, Artificial Intelligence, Cyber Security, Internet of Things, UI/UX Design, Content & Media, Documentation.';
comment on column public.fhc_join_applications.status is 'Lifecycle: applied → under_review → selected | rejected. Join only ever writes applied; admin panel owns status changes.';

-- Auto-maintain updated_at on every UPDATE.
drop trigger if exists on_fhc_join_applications_updated on public.fhc_join_applications;
create trigger on_fhc_join_applications_updated
  before update on public.fhc_join_applications
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
--    Privacy model:
--      * anonymous visitors  -> INSERT only (the form must work without
--        login) — they can NEVER read/update/delete applications.
--      * authenticated users -> SELECT (screen-review path). Tighten to
--        an admin-only check (e.g. is_fhc_admin()) when a role exists.
--    There is deliberately NO anon SELECT/UPDATE/DELETE policy, so the
--    full_name / register_number / email / phone / about_you columns are
--    impossible to read by the public API.
-- ────────────────────────────────────────────────────────────────────
alter table public.fhc_join_applications enable row level security;

-- Public join form: anon may INSERT a new application.
drop policy if exists "fhc_join_applications_public_insert" on public.fhc_join_applications;
create policy "fhc_join_applications_public_insert"
  on public.fhc_join_applications
  for insert to anon
  with check (true);

-- Logged-in users may also submit (they are students too).
drop policy if exists "fhc_join_applications_auth_insert" on public.fhc_join_applications;
create policy "fhc_join_applications_auth_insert"
  on public.fhc_join_applications
  for insert to authenticated
  with check (true);

-- Review/approval path: authenticated users may read applications.
-- NOTE: restrict to an admin role later if preferred, e.g.
--   create policy "..." on public.fhc_join_applications for select
--     to authenticated using (is_fhc_admin());
drop policy if exists "fhc_join_applications_auth_select" on public.fhc_join_applications;
create policy "fhc_join_applications_auth_select"
  on public.fhc_join_applications
  for select to authenticated
  using (true);

-- No UPDATE / DELETE policies exist -> writes via the API are denied to
-- everyone except the table owner (Supabase). Approval flows that need
-- to use the API should add an authenticated/admin policy later.

-- ────────────────────────────────────────────────────────────────────
-- 3. UNIQUE GUARDS for the "PLAYER ALREADY REGISTERED" flow.
--    The frontend maps the Postgres unique_violation (code 23505) to a
--    clean "PLAYER ALREADY REGISTERED_" modal. These indexes are added
--    only when no conflicting legacy rows exist — if pre-existing
--    duplicates prevent creation, the DO block logs nothing and the run
--    continues (dedupe manually before enabling).
-- ────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'fhc_join_applications'
      and indexdef ilike '%register_number%'
  ) then
    create unique index fhc_join_applications_register_number_key
      on public.fhc_join_applications (lower(btrim(register_number)));
  end if;
exception
  when others then null; -- legacy duplicates present: skip, add later manually
end $$;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'fhc_join_applications'
      and indexdef ilike '%email%'
  ) then
    create unique index fhc_join_applications_email_key
      on public.fhc_join_applications (lower(btrim(email)));
  end if;
exception
  when others then null; -- legacy duplicates present: skip, add later manually
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 4. INDEXES — review/approval admin panel looks up by status.
-- ────────────────────────────────────────────────────────────────────
create index if not exists fhc_join_applications_status_idx
  on public.fhc_join_applications (status);

create index if not exists fhc_join_applications_created_at_idx
  on public.fhc_join_applications (created_at desc);