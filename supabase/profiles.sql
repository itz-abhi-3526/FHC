-- ════════════════════════════════════════════════════════════════════
-- FHC (FISAT HORIZON CLUB) — member PROFILE table + RLS
--
-- Purpose: website USER profiles used by /auth and /dashboard.
-- Row key: profiles.id = auth.users(id)  →  RLS "own row only".
--
-- This file is the FIX for the dashboard "PROFILE UPDATE FAILED"
-- symptom. That message appears when public.profiles has Row Level
-- Security ENABLED but the UPDATE policy is missing (or never applied),
-- so Supabase rejects every authenticated write. Running this file
-- re-applies the correct policies.
--
-- Also guarantees the `avatar_url` column used by the Cloudinary avatar
-- upload. Safe to re-run (idempotent).
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. TABLE + guaranteed columns (never duplicates, never drops data)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  email         text,
  username      text unique,
  avatar_seed   text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_login_at timestamptz
);

-- Guarantee each field on tables created before this migration ran.
alter table public.profiles add column if not exists id            uuid;
alter table public.profiles add column if not exists full_name     text not null default '';
alter table public.profiles add column if not exists email         text;
alter table public.profiles add column if not exists username      text;
alter table public.profiles add column if not exists avatar_seed   text;
alter table public.profiles add column if not exists avatar_url    text;
alter table public.profiles add column if not exists created_at    timestamptz not null default now();
alter table public.profiles add column if not exists updated_at    timestamptz not null default now();
alter table public.profiles add column if not exists last_login_at timestamptz;

-- ────────────────────────────────────────────────────────────────────
-- 2. updated_at helper + trigger (self-contained + idempotent)
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

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY — THE ACTUAL "PROFILE UPDATE FAILED" FIX
--    Users may ONLY read / insert / update their OWN profile row.
--    No one can modify another member's profile.
-- ────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ────────────────────────────────────────────────────────────────────
-- 4. UNIQUE USERNAME — power the "USERNAME ALREADY TAKEN" flow.
--    Created only when safe (skips automatically if legacy duplicate
--    rows would block it; dedupe manually before enabling).
-- ────────────────────────────────────────────────────────────────────
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
  when others then null; -- legacy duplicates present: skip, add later manually
end $$;

-- ────────────────────────────────────────────────────────────────────
-- 5. INDEXES — supporting lookups
-- ────────────────────────────────────────────────────────────────────
create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profiles_email_idx on public.profiles (email);