-- ════════════════════════════════════════════════════════════════════
-- FHC (FISAT HORIZON CLUB) — TEAMS // PLAYERS ARENA
--
-- Backing schema for the public Teams page ("Players Arena").
-- Run this entire file in the Supabase SQL editor against your project.
-- It is safe to re-run (idempotent).
--
-- What this creates:
--   1. public.team_members        — one row per roster entry
--   2. updated_at trigger         — auto-maintained on UPDATE
--   3. Row Level Security         — public can only SELECT active members
--   4. Indexes                    — team, display_order, composite lookups
--   5. Storage bucket "team-members" + secure policies for photographs
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 0. updated_at helper (shared with profiles; defined here too so this
--    file is self-contained and re-runnable).
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
-- 1. TEAM_MEMBERS TABLE
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

comment on table  public.team_members is 'FHC Players Arena roster.';
comment on column public.team_members.photo_url is 'Public URL or a path inside the "team-members" storage bucket.';

-- Auto-maintain updated_at on every UPDATE.
drop trigger if exists on_team_members_updated on public.team_members;
create trigger on_team_members_updated
  before update on public.team_members
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
--    Public/anonymous users can only SELECT rows that are active.
--    Nobody can INSERT / UPDATE / DELETE through the API yet —
--    those policies get added together with a future admin panel.
-- ────────────────────────────────────────────────────────────────────
alter table public.team_members enable row level security;

drop policy if exists "team_members_public_select_active" on public.team_members;
create policy "team_members_public_select_active"
  on public.team_members
  for select
  using (is_active = true);

-- No INSERT / UPDATE / DELETE policies exist, so all writes via the
-- anon/authenticated API are denied by default (safe by default).
--
-- Future admin hook (example — uncomment when an admin role exists):
--   create policy "team_members_admin_insert"
--     on public.team_members for insert
--     with check (is_fhc_admin());
--   create policy "team_members_admin_update"
--     on public.team_members for update
--     using (is_fhc_admin()) with check (is_fhc_admin());
--   create policy "team_members_admin_delete"
--     on public.team_members for delete
--     using (is_fhc_admin());

-- ────────────────────────────────────────────────────────────────────
-- 3. INDEXES
--    The public query pattern: WHERE is_active = true
--    ORDER BY team ASC, display_order ASC.
-- ────────────────────────────────────────────────────────────────────
create index if not exists team_members_team_idx
  on public.team_members (team);

create index if not exists team_members_is_active_idx
  on public.team_members (is_active);

create index if not exists team_members_team_display_order_idx
  on public.team_members (team, display_order);

create index if not exists team_members_active_team_order_idx
  on public.team_members (is_active, team, display_order);

-- ────────────────────────────────────────────────────────────────────
-- 4. STORAGE — member photographs
--    Bucket: team-members (public, read-only for anonymous visitors).
--    Read:   anyone (these are public display photographs)
--    Write:  authenticated users only, bounded to this bucket. Tighten
--            to an admin-only check when an admin role exists.
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
  using (bucket_id = 'team-members');

drop policy if exists "team_members_storage_insert_auth" on storage.objects;
create policy "team_members_storage_insert_auth"
  on storage.objects
  for insert to authenticated
  with check (bucket_id = 'team-members');

drop policy if exists "team_members_storage_update_auth" on storage.objects;
create policy "team_members_storage_update_auth"
  on storage.objects
  for update to authenticated
  using (bucket_id = 'team-members')
  with check (bucket_id = 'team-members');

drop policy if exists "team_members_storage_delete_auth" on storage.objects;
create policy "team_members_storage_delete_auth"
  on storage.objects
  for delete to authenticated
  using (bucket_id = 'team-members');