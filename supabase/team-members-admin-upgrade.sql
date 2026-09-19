-- ════════════════════════════════════════════════════════════════════
-- FHC — TEAM MEMBERS // ADMIN CRUD UPGRADE
--
-- Run this in the Supabase SQL editor against your project. It is
-- idempotent (safe to re-run).
--
-- Goal: make /admin/team a REAL roster console against public.team_members
-- while keeping the public /team page read-only to active rows.
--
-- This file does NOT bypass RLS and does NOT use a service-role key in the
-- browser. Authorized writes go through the same authenticated anon-key
-- client as every other admin node, gated by is_fhc_admin().
--
-- What it guarantees (safe against partially-migrated databases):
--   1. public.is_fhc_admin() exists (role resolved from auth.users
--      app_metadata / user_metadata, matching the app's frontend check).
--   2. Table-level grants for anon + authenticated.
--   3. RLS enabled with:
--         - public/anon ........ SELECT active rows only (existing behaviour)
--         - admins (is_fhc_admin)  FULL CRUD across all rows (incl. inactive)
--   4. team_members is subscribed on the supabase_realtime publication so
--      the admin table refreshes when another operator edits a row.
--   5. Storage bucket "team-members": public read, admin-only writes.
--
-- Idempotency notes: create or replace / drop policy if exists / on
-- conflict / guarded alter publication.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. ROLE HELPER (single source of admin truth for every RLS policy here)
--    Mirrors supabase/fhc-reconcile.sql — SECURITY DEFINER, resolves the
--    role from auth.users metadata so the DB gate matches the frontend.
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
-- 2. TABLE GRANTS — the PostgREST API needs explicit privileges on the
--    roles it impersonates (anon for public reads, authenticated for the
--    admin session). RLS still decides WHICH rows are visible/editable.
-- ────────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.team_members to anon, authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 3. RLS — public sees active only; admins get full CRUD on all rows.
-- ────────────────────────────────────────────────────────────────────
alter table public.team_members enable row level security;

drop policy if exists "team_members_public_select_active" on public.team_members;
create policy "team_members_public_select_active"
  on public.team_members
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "team_members_admin_full" on public.team_members;
create policy "team_members_admin_full"
  on public.team_members
  for all
  to authenticated
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

-- ────────────────────────────────────────────────────────────────────
-- 4. REALTIME — refresh the admin roster when another operator writes.
-- ────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'team_members'
  ) then
    alter publication supabase_realtime add table public.team_members;
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 5. STORAGE — team-members bucket: public read, ADMIN-only writes.
--    (Kept in lock-step with supabase/admin.sql for sites where the older
--    team-members.sql left the looser authenticated-write policies.)
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
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'team-members');

drop policy if exists "team_members_storage_insert_auth" on storage.objects;
drop policy if exists "team_members_storage_update_auth" on storage.objects;
drop policy if exists "team_members_storage_delete_auth" on storage.objects;

drop policy if exists "team_members_storage_insert_admin" on storage.objects;
create policy "team_members_storage_insert_admin"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'team-members' and public.is_fhc_admin());

drop policy if exists "team_members_storage_update_admin" on storage.objects;
create policy "team_members_storage_update_admin"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'team-members' and public.is_fhc_admin())
  with check (bucket_id = 'team-members' and public.is_fhc_admin());

drop policy if exists "team_members_storage_delete_admin" on storage.objects;
create policy "team_members_storage_delete_admin"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'team-members' and public.is_fhc_admin());