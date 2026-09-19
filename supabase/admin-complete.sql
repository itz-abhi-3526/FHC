-- ════════════════════════════════════════════════════════════════════
-- FHC (FISAT HORIZON CLUB) — ADMIN COMPLETE migration (part 2)
--
-- Complements supabase/admin.sql. Run AFTER admin.sql in the Supabase
-- SQL editor. Safe to re-run (fully idempotent).
--
-- WHAT THIS ADDS
--   1. Missing public.profiles columns used by the admin panel:
--        * bio            — profile biography (edited in Users/Profiles)
--        * is_active      — account enable/disable (Users table toggle)
--        * email_verified — DISPLAY-ONLY mirror of the auth verification
--                           status. Never used for authorization.
--   2. Realtime publication for admin live updates:
--        * fhc_join_applications → "new application" notifications +
--                                  live dashboard refresh
--        * profiles / team_members / gallery_assets → live sync between
--                                  administrators
--   3. handle_new_user extended to seed bio/is_active/email_verified.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. PROFILES — guarantee the admin columns
-- ────────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists email_verified boolean;

create index if not exists profiles_is_active_idx on public.profiles (is_active);

-- Backfill email_verified (display mirror only) from the auth provider
-- verification flag. Never read for privileges.
update public.profiles p
   set email_verified = (u.raw_user_meta_data ->> 'email_verified')::boolean
  from auth.users u
 where u.id = p.id
   and (u.raw_user_meta_data ->> 'email_verified') is not null
   and p.email_verified is distinct from ((u.raw_user_meta_data ->> 'email_verified')::boolean);

-- New signups: seed the mirror columns too.
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
    coalesce(new.raw_app_meta_data ->> 'role', 'member'),
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
-- 2. REALTIME PUBLICATION
--    Tables are added to the `supabase_realtime` publication so admin
--    channels receive live row events. RLS still applies to every
--    delivered event: non-admins never see a single payload row.
-- ────────────────────────────────────────────────────────────────────
do $$
declare v_table text;
begin
  foreach v_table in array array[
    'profiles',
    'team_members',
    'fhc_join_applications',
    'gallery_assets'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- DONE — idempotent, safe to re-run.
-- ════════════════════════════════════════════════════════════════════