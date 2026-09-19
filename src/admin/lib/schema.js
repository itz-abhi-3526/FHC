/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — database schema contract (SINGLE SOURCE OF TRUTH)
   Mirrors the LIVE Supabase database. Every admin data module reads
   table/column/domain names from here so the frontend and the database
   can never drift apart.

   LIVE TABLES ONLY (verified against the project's REST API):
     - profiles                (own-row RLS by default)
     - team_members            (public reads active)
     - fhc_join_applications   (anon INSERT, authenticated SELECT)
   Tables like events / projects / gallery_assets / highlights /
   site_content / admin_activity_logs DO NOT EXIST in the live project
   and are therefore NOT part of any dashboard, search, export or
   subscription surface.
   ════════════════════════════════════════════════════════════════════ */

export const TABLES = {
  profiles: "profiles",
  team: "team_members",
  applications: "fhc_join_applications",
  galleryFolders: "gallery_folders",
  galleryImages: "gallery_images",
};

/* Guaranteed lean set for read-only egress queries (RLS-safe select).
   Gallery tables are included — they are LIVE (public SELECT, media/admin
   CRUD) and feed the dashboard + realtime refresh. */
export const CORE_TABLES = [
  TABLES.profiles,
  TABLES.team,
  TABLES.applications,
  TABLES.galleryFolders,
  TABLES.galleryImages,
];

/* Domain enumerations enforced by the schema's CHECK constraints. */
export const APPLICATION_STATUSES = ["applied", "under_review", "selected", "rejected"];

export const PROFILE_ROLES = ["admin", "media", "member", "user"];

/* Columns the admin panel touches. Live base columns exist in the project
   NOW; optional columns may be added by supabase/fhc-admin-rpcs.sql and are
   probed lazily (RLS-gated) before every dependent query. */
export const PROFILE_BASE_COLUMNS = ["id", "full_name", "role", "created_at", "updated_at", "avatar_url"];
export const PROFILE_OPTIONAL_COLUMNS = ["email", "username", "avatar_seed", "bio", "is_active", "email_verified", "last_login_at"];

export const APPLICATION_COLUMNS = ["id", "full_name", "year_branch", "register_number", "email", "phone", "about_you", "selected_domain", "status", "created_at", "updated_at"];

export const TEAM_COLUMNS = ["id", "name", "designation", "team", "photo_url", "bio", "linkedin_url", "github_url", "instagram_url", "display_order", "is_active", "created_at", "updated_at"];