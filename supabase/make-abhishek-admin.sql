-- ════════════════════════════════════════════════════════════════════
-- FHC (FISAT HORIZON CLUB) — elevate the FOUNDER account to ADMIN
--
-- RUN IN THE SUPABASE SQL EDITOR (service-role only — the function is
-- REVOKE'd from anon / authenticated, so it can only run server-side or
-- from the SQL editor). Must run AFTER supabase/admin.sql.
--
--     supabase/admin.sql        →  role architecture + RPCs + tables
--     this file                 →  promote the account below
--
-- admin_bootstrap() writes the role into BOTH raw_app_meta_data and
-- raw_user_meta_data so user.user_metadata.role (the frontend gate) and
-- the RLS gate (is_fhc_admin()) stay aligned for every session.
-- ════════════════════════════════════════════════════════════════════

select public.admin_bootstrap('itz.abhi.3526@gmail.com');   -- -> 'admin'

-- OPTIONAL: promote a second account without demoting the first:
-- select public.admin_bootstrap('other@example.com');       -- -> 'admin'
-- select public.admin_bootstrap('someone@example.com','user'); -- -> 'user'

-- Verify (role must appear in BOTH columns):
-- select email,
--        raw_app_meta_data  ->> 'role' as app_role,
--        raw_user_meta_data ->> 'role' as user_role
--   from auth.users
--  where email = 'itz.abhi.3526@gmail.com';

-- Sanity: the admin gate should resolve for that user (run inside a
-- query window, not logged-in context, to see its internals):
-- select raw_app_meta_data -> 'role' as app_role_set
--   from auth.users where email = 'itz.abhi.3526@gmail.com';