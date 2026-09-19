-- ════════════════════════════════════════════════════════════════════
-- FHC — HIGHLIGHTS / BROADCAST node (minimal migration)
--
-- RUN AFTER supabase/admin.sql (needs public.is_fhc_admin()) and the
-- schema migrations (public.set_updated_at()).
--
-- The public site had NO highlights table. This creates the smallest
-- safe broadcast surface the admin "FHC // BROADCAST" node manages:
-- a poster + short copy + optional external link, with a publish flag
-- and real timestamps. No public surface references it yet (nothing to
-- preserve), so adding it does not break any existing page.
--
-- RLS:
--   * anon / authenticated  → SELECT is_published = true only
--   * admins (is_fhc_admin) → full CRUD
-- Add the table to the realtime publication so the admin BROADCAST node
-- can live-refresh (admin-only because RLS gates every delivered row).
-- ════════════════════════════════════════════════════════════════════

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

alter table public.highlights owner to postgres;
alter table public.highlights enable row level security;

drop policy if exists "highlights_public_read" on public.highlights;
create policy "highlights_public_read"
  on public.highlights
  for select
  using (is_published = true);

drop policy if exists "highlights_admin_write" on public.highlights;
create policy "highlights_admin_write"
  on public.highlights
  for all
  to authenticated
  using (public.is_fhc_admin())
  with check (public.is_fhc_admin());

-- Keep updated_at honest on writes.
drop trigger if exists highlights_set_updated_at on public.highlights;
create trigger highlights_set_updated_at
  before update on public.highlights
  for each row
  execute function public.set_updated_at();

-- Realtime publication (idempotent). Only admins ever receive rows
-- because RLS filters the delivered payloads.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'highlights'
  ) then
    alter publication supabase_realtime add table public.highlights;
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- DONE — idempotent, safe to re-run.
-- ════════════════════════════════════════════════════════════════════