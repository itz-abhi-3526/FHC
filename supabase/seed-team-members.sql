-- ════════════════════════════════════════════════════════════════════
-- FHC — TEAMS // PLAYERS ARENA — SAMPLE SEED DATA (OPTIONAL)
--
-- ⚠️  SAMPLE / DEMO ONLY — by default the store should stay EMPTY.
--     These fictional placeholders exist so you can visually verify the
--     arena (grouping, filtering, counting, ordering, fallback avatars)
--     before adding real members.
--
--     Delete every row below before going live:
--         delete from public.team_members;
--
--     Then add real members through Supabase Dashboard → Table Editor
--     (or your future admin panel). Any row inserted with the right
--     columns will appear on /team immediately.
--
--     Run ONLY after supabase/team-members.sql has been applied.
-- ════════════════════════════════════════════════════════════════════

insert into public.team_members (name, designation, team, photo_url, display_order, is_active, bio)
values
  -- CORE SYSTEM
  ('Kai Arden',      'CLUB PRESIDENT',       'CORE', null, 1,  true,  'Keeps the whole network online.'),
  ('Mira Sol',       'VICE PRESIDENT',       'CORE', null, 2,  true,  'Ops, culture and coordination.'),
  ('Dev Okafor',     'TECHNICAL LEAD',       'CORE', null, 3,  true,  'Routes every data stream.'),
  ('Lina Reyes',     'CREATIVE LEAD',        'CORE', null, 4,  true,  'Defines the FHC visual language.'),

  -- TECH DIVISION
  ('Ira Voss',       'FULLSTACK ENGINEER',   'TECH', null, 1,  true,  'Builds the core systems end to end.'),
  ('Sam Bell',       'BACKEND ENGINEER',     'TECH', null, 2,  true,  'Databases, APIs, infrastructure.'),
  ('Noah Trent',     'AI/ML TRAINEE',        'TECH', null, 3,  false, 'Example INACTIVE row — must NOT appear.'),

  -- WEB DIVISION
  ('Aya Chen',       'FRONTEND OPERATOR',    'WEB',  null, 1,  true,  'Crafts the pixel-perfect interfaces.'),
  ('Rui Matsui',     'UI/UX DESIGNER',       'WEB',  null, 2,  true,  'Makes the arena feel human.'),
  ('Eli Stone',      'WEB PERFORMANCE OPS',  'WEB',  null, 3,  true,  null),

  -- CREATIVE DIVISION
  ('Tess Vega',      'MEDIA OPERATOR',       'DESIGN', null, 1, true, 'Shoots and edits the story.'),
  ('Jonah Pike',     'GRAPHIC DESIGNER',     'DESIGN', null, 2, true, null)
on conflict (id) do nothing;