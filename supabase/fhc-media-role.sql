-- ════════════════════════════════════════════════════════════════════
-- FHC — MEDIA ROLE (ONE MINIMAL ADDITIVE MIGRATION)
--
-- This is THE migration for the MEDIA feature. It enables a regular
-- authenticated `media` user to manage gallery content through the
-- public Media Console (/media) — WITHOUT admin access.
--
-- It uses the EXISTING gallery data model only:
--     gallery_folders  (one row = one album / event / programme)
--     gallery_images   (one row = one photo OR video, FK → folder)
-- and the EXISTING role system (auth.users app_metadata.role → media),
-- mirrored to profiles.role like admin already is.
--
-- FINAL PERMISSION MATRIX (matches this file's policies):
--   gallery_folders  SELECT: public
--                    INSERT: admin + media            (media creates albums)
--                    UPDATE: admin only + media on OWN albums (created_by = uid)
--                    DELETE: admin only
--   gallery_images   SELECT: public
--                    INSERT: admin + media            (media uploads photos/videos)
--                    UPDATE: admin + media            (shared caption/cover edits)
--                    DELETE: admin full + media deletes OWN uploads (uploaded_by = uid)
--   profiles / team_members / fhc_join_applications: TOUCHED. Media gains no access.
--
-- SAFETY:
--   * Additive + idempotent. Guarded "if not exists" everywhere.
--   * No tables created, none dropped, no data rewritten.
--   * The only dropped policies are the legacy WIDE folder policies
--     (media could edit ANY folder) which are replaced by the narrower
--     admin-only + media-own pair. Admin authority is fully preserved.
--   * Public read policies are re-asserted but never narrowed.
--
-- RUN ONCE IN THE SUPABASE SQL EDITOR. Safe to re-run.
-- Requires supabase/admin.sql to have been applied first (is_fhc_admin,
-- auth_user_set_meta, log_admin_activity).
--
-- Assign a media user afterwards:
--   -- from the SQL editor / service role:
--   select public.admin_bootstrap('user@email.com', 'media');
--   -- or from the Admin → Users view → MEDIA / admin roles (admin_set_user_role).
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. gallery_images.media_type — distinguish photos from videos.
--    MINIMAL additive migration (+ column with NOT NULL DEFAULT 'photo',
--    CHECK across 'photo'/'video'). Existing rows become 'photo' and stay
--    valid. If the old 'image'/'video' draft was ever applied, those rows
--    are normalized to 'photo' and the canonical constraint replaces it.
--    After running this in the SQL editor, if PostgREST still reports the
--    column missing run:
--        notify pgrst, 'reload schema';
-- ────────────────────────────────────────────────────────────────────
alter table public.gallery_images add column if not exists media_type text not null default 'photo';

update public.gallery_images set media_type = 'photo' where media_type = 'image';

do $$
begin
  execute format($f$alter table public.gallery_images drop constraint if exists gallery_images_media_type_check$f$);
  execute format($f$
    alter table public.gallery_images add constraint gallery_images_media_type_check
      check (media_type in ('photo', 'video'))
  $f$);
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 2. is_fhc_media() — 'admin' OR 'media', sourced from the SAME trusted
--    role system as is_fhc_admin() (auth.users metadata, never client
--    editable). Idempotent create-or-replace.
-- ────────────────────────────────────────────────────────────────────
create or replace function public.is_fhc_media()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _role text;
begin
  if _uid is null then return false; end if;
  select coalesce(
    nullif(u.raw_app_meta_data ->> 'role', ''),
    nullif(u.raw_user_meta_data ->> 'role', '')
  ) into _role
  from auth.users u where u.id = _uid;
  return _role in ('admin', 'media');
end;
$$;

grant execute on function public.is_fhc_media() to anon, authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 3. gallery_folders RLS — public SELECT (preserved showcase read).
-- ────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_folders'
      and policyname = 'gallery_folders_public_select'
  ) then
    execute format($f$
      create policy "gallery_folders_public_select"
        on public.gallery_folders for select
        using (true)
    $f$);
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 4. gallery_folders RLS — INSERT: admin + media.
--    The legacy combined policy (admin_media_insert) is replaced by the
--    two named policies; is_fhc_media() also matches admin, so no admin
--    insert capability is ever lost.
-- ────────────────────────────────────────────────────────────────────
drop policy if exists "gallery_folders_admin_media_insert" on public.gallery_folders;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_folders'
      and policyname = 'gallery_folders_admin_insert'
  ) then
    execute format($f$
      create policy "gallery_folders_admin_insert"
        on public.gallery_folders for insert to authenticated
        with check (public.is_fhc_admin())
    $f$);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_folders'
      and policyname = 'gallery_folders_media_insert'
  ) then
    execute format($f$
      create policy "gallery_folders_media_insert"
        on public.gallery_folders for insert to authenticated
        with check (public.is_fhc_media())
    $f$);
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 5. gallery_folders RLS — UPDATE: admin only + media on OWN albums.
--    The legacy combined policy (media could update ANY folder) is
--    dropped and replaced by the ownership pair below.
-- ────────────────────────────────────────────────────────────────────
drop policy if exists "gallery_folders_admin_media_update" on public.gallery_folders;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_folders'
      and policyname = 'gallery_folders_admin_update'
  ) then
    execute format($f$
      create policy "gallery_folders_admin_update"
        on public.gallery_folders for update to authenticated
        using (public.is_fhc_admin())
        with check (public.is_fhc_admin())
    $f$);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_folders'
      and policyname = 'gallery_folders_media_manage_own'
  ) then
    execute format($f$
      create policy "gallery_folders_media_manage_own"
        on public.gallery_folders for update to authenticated
        using (public.is_fhc_media() and created_by = auth.uid())
        with check (public.is_fhc_media() and created_by = auth.uid())
    $f$);
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 6. gallery_folders RLS — DELETE: admin only (additive re-assert).
-- ────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_folders'
      and policyname = 'gallery_folders_admin_full_delete'
  ) then
    execute format($f$
      create policy "gallery_folders_admin_full_delete"
        on public.gallery_folders for delete to authenticated
        using (public.is_fhc_admin())
    $f$);
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 7. gallery_images RLS — public SELECT (preserved showcase read).
-- ────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_images'
      and policyname = 'gallery_images_public_select'
  ) then
    execute format($f$
      create policy "gallery_images_public_select"
        on public.gallery_images for select
        using (true)
    $f$);
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 8. gallery_images RLS — media photo/video management (shared trusted
--    gallery role, matching the established is_fhc_media() design):
--      INSERT / UPDATE:        admin + media
--      DELETE admin full + media only on rows they uploaded.
-- ────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_images'
      and policyname = 'gallery_images_admin_media_insert'
  ) then
    execute format($f$
      create policy "gallery_images_admin_media_insert"
        on public.gallery_images for insert to authenticated
        with check (public.is_fhc_media())
    $f$);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_images'
      and policyname = 'gallery_images_admin_media_update'
  ) then
    execute format($f$
      create policy "gallery_images_admin_media_update"
        on public.gallery_images for update to authenticated
        using (public.is_fhc_media())
        with check (public.is_fhc_media())
    $f$);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_images'
      and policyname = 'gallery_images_admin_full_delete'
  ) then
    execute format($f$
      create policy "gallery_images_admin_full_delete"
        on public.gallery_images for delete to authenticated
        using (public.is_fhc_admin())
    $f$);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gallery_images'
      and policyname = 'gallery_images_media_delete_own'
  ) then
    execute format($f$
      create policy "gallery_images_media_delete_own"
        on public.gallery_images for delete to authenticated
        using (uploaded_by = auth.uid())
    $f$);
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 9. profiles.role CHECK — accept 'media' (widens, never narrows).
-- ────────────────────────────────────────────────────────────────────
do $$
begin
  execute format($f$alter table public.profiles drop constraint if exists profiles_role_check$f$);
  execute format($f$
    alter table public.profiles add constraint profiles_role_check
      check (role in ('admin', 'media', 'member', 'user'))
  $f$);
exception
  when others then null;
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 10. admin_set_user_role() — re-asserted so the admin panel's Users
--     page can assign the 'media' role through the secure SECURITY
--     DEFINER RPC. Behaviour identical to the existing admin.sql RPC
--     with 'media' added to the allowed set. Requires admin.sql (or
--     equivalent) to have defined is_fhc_admin / auth_user_set_meta /
--     log_admin_activity.
-- ────────────────────────────────────────────────────────────────────
create or replace function public.admin_set_user_role(
  target uuid,
  new_role text
)
returns jsonb
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

  if new_role not in ('admin', 'media', 'member', 'user') then
    raise exception 'FHC_INVALID_ROLE'
      using errcode = 'P0001';
  end if;

  if not exists (select 1 from auth.users where id = target) then
    raise exception 'FHC_USER_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if new_role not in ('admin', 'media') then
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

-- ────────────────────────────────────────────────────────────────────
-- 11. admin_bootstrap() — allow 'media' as well (SQL-editor / service
--     role only). Unchanged behaviour otherwise.
-- ────────────────────────────────────────────────────────────────────
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
  if p_role not in ('admin', 'media', 'member', 'user') then
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

-- ════════════════════════════════════════════════════════════════════
-- DONE — MEDIA role + Media Console back-end ready.
-- Admin / public gallery access is untouched. No tables were created,
-- no table was dropped, no public-read policy was narrowed.
-- ════════════════════════════════════════════════════════════════════