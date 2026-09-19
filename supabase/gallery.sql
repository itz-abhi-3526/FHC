-- ════════════════════════════════════════════════════════════════════
-- FHC (FISAT HORIZON CLUB) — GALLERY MIGRATION
--
-- Creates the event-based Gallery system:
--   gallery_folders  — one row per event/programme
--   gallery_images   — one row per photo (FK → folder, ON DELETE CASCADE)
--
-- RLS:
--   Public:   SELECT on both tables (gallery is a public showcase)
--   Admin:    full CRUD on both tables
--   Media:    INSERT/UPDATE/DELETE on both tables (content management)
--
-- Run this ENTIRE file in the Supabase SQL editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 0. Ensure is_fhc_media() helper exists (extends role system)
--    Checks auth.users metadata for role = 'admin' OR role = 'media'
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
-- 1. GALLERY FOLDERS — one event/programme = one folder
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.gallery_folders (
  id              uuid primary key default gen_random_uuid(),
  title           text not null default '',
  description     text,
  event_date      date,
  cover_image_url text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.gallery_folders is 'FHC Gallery event folders. Each row = one event/programme.';

drop trigger if exists on_gallery_folders_updated on public.gallery_folders;
create trigger on_gallery_folders_updated
  before update on public.gallery_folders
  for each row execute function public.set_updated_at();

create index if not exists gallery_folders_event_date_idx on public.gallery_folders (event_date desc nulls last);
create index if not exists gallery_folders_created_at_idx on public.gallery_folders (created_at desc);

-- ────────────────────────────────────────────────────────────────────
-- 2. GALLERY IMAGES — photos belonging to a folder
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.gallery_images (
  id                  uuid primary key default gen_random_uuid(),
  folder_id           uuid not null references public.gallery_folders(id) on delete cascade,
  image_url           text not null,
  cloudinary_public_id text,
  caption             text,
  uploaded_by         uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now()
);

comment on table public.gallery_images is 'FHC Gallery images. FK to gallery_folders with ON DELETE CASCADE.';

create index if not exists gallery_images_folder_idx on public.gallery_images (folder_id);
create index if not exists gallery_images_created_idx on public.gallery_images (created_at desc);

-- ────────────────────────────────────────────────────────────────────
-- 3. REALTIME PUBLICATION
-- ────────────────────────────────────────────────────────────────────
do $$
declare v_table text;
begin
  foreach v_table in array array[
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

-- ────────────────────────────────────────────────────────────────────
-- 4. RLS — enable on both tables
-- ────────────────────────────────────────────────────────────────────

-- GALLERY FOLDERS RLS
alter table public.gallery_folders enable row level security;

-- Public: anyone can read folders (gallery is a public showcase)
drop policy if exists "gallery_folders_public_select" on public.gallery_folders;
create policy "gallery_folders_public_select"
  on public.gallery_folders for select
  using (true);

-- Admin + Media: full CRUD
drop policy if exists "gallery_folders_admin_media_insert" on public.gallery_folders;
create policy "gallery_folders_admin_media_insert"
  on public.gallery_folders for insert to authenticated
  with check (public.is_fhc_media());

drop policy if exists "gallery_folders_admin_media_update" on public.gallery_folders;
create policy "gallery_folders_admin_media_update"
  on public.gallery_folders for update to authenticated
  using (public.is_fhc_media())
  with check (public.is_fhc_media());

drop policy if exists "gallery_folders_admin_full_delete" on public.gallery_folders;
create policy "gallery_folders_admin_full_delete"
  on public.gallery_folders for delete to authenticated
  using (public.is_fhc_admin());

-- GALLERY IMAGES RLS
alter table public.gallery_images enable row level security;

-- Public: anyone can read images
drop policy if exists "gallery_images_public_select" on public.gallery_images;
create policy "gallery_images_public_select"
  on public.gallery_images for select
  using (true);

-- Admin + Media: INSERT
drop policy if exists "gallery_images_admin_media_insert" on public.gallery_images;
create policy "gallery_images_admin_media_insert"
  on public.gallery_images for insert to authenticated
  with check (public.is_fhc_media());

-- Admin + Media: UPDATE (caption edits etc.)
drop policy if exists "gallery_images_admin_media_update" on public.gallery_images;
create policy "gallery_images_admin_media_update"
  on public.gallery_images for update to authenticated
  using (public.is_fhc_media())
  with check (public.is_fhc_media());

-- Admin only: DELETE
drop policy if exists "gallery_images_admin_full_delete" on public.gallery_images;
create policy "gallery_images_admin_full_delete"
  on public.gallery_images for delete to authenticated
  using (public.is_fhc_admin());

-- Admin + Media: DELETE their own uploads
drop policy if exists "gallery_images_media_delete_own" on public.gallery_images;
create policy "gallery_images_media_delete_own"
  on public.gallery_images for delete to authenticated
  using (uploaded_by = auth.uid());

-- ────────────────────────────────────────────────────────────────────
-- 5. Update role CHECK constraint to include 'media'
-- ────────────────────────────────────────────────────────────────────
do $$
begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check
    check (role in ('admin', 'media', 'member', 'user'));
exception
  when others then null;
end $$;

-- Also update admin_set_user_role to accept 'media'
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
-- 6. Gallery aggregate helper for public image counts
-- ────────────────────────────────────────────────────────────────────
create or replace function public.gallery_folder_image_count(p_folder_id uuid)
returns bigint
language sql
stable
as $$
  select count(*) from public.gallery_images where folder_id = p_folder_id;
$$;

grant execute on function public.gallery_folder_image_count(uuid) to anon, authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 7. Update admin_schema_status to include new tables
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
      ('gallery_folders'),
      ('gallery_images'),
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
  )
  select coalesce(jsonb_agg(jsonb_build_object('table_name', table_name, 'exists', exists)),
                  '[]'::jsonb)
    from table_existence;
$$;

-- ════════════════════════════════════════════════════════════════════
-- DONE — Gallery tables, RLS, role system update complete.
-- After running, assign media role:
--   select public.admin_bootstrap('user@email.com', 'media');
-- ════════════════════════════════════════════════════════════════════
