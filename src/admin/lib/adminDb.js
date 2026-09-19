/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — real Supabase data layer
   Every function talks straight to the existing Supabase project. RLS +
   the admin helper functions protect every read/write at the database
   level; the UI is only a shell on top.

   LIVE-TABLE SCOPED: only profiles / team_members / fhc_join_applications
   are queried. Tables that do not exist in the project (events, projects,
   gallery_assets, highlights, site_content, admin_activity_logs) are NOT
   referenced anywhere in this module — the console stays clean of the
   404/400 noise those dead nodes used to produce.
   ════════════════════════════════════════════════════════════════════ */

import { supabase } from "../../lib/supabase";
import { teamSynonyms } from "../../lib/teamMembers";
import {
  APPLICATION_STATUSES,
  TABLES,
} from "./schema";

const PROFILES = TABLES.profiles;
const TEAM = TABLES.team;
const APPLICATIONS = TABLES.applications;
const GALLERY_FOLDERS = TABLES.galleryFolders;
const GALLERY_IMAGES = TABLES.galleryImages;

/* ── schema probe (cached) — safe against partially-migrated databases ── */
const PROBE_CACHE = new Map();

/* Capability snapshot (table → exists). Populated once per session from
   admin_schema_status() when the migration is live; falls back to one
   cached HEAD probe per table otherwise. Never re-fires mid-session, so
   feature nodes missing from the database are NEVER requested again. */
const CAP_CACHE = { done: false, tables: null };

const KNOWN_TABLES = Object.values(TABLES);

/* ── one-shot schema capability discovery ───────────────────────────── */
export async function schemaCapabilities() {
  if (CAP_CACHE.done) return CAP_CACHE.tables;

  let snapshot = {};
  try {
    const { data, error } = await supabase.rpc("admin_schema_status");
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        snapshot[row.table_name] = !!row.exists;
      }
    }
  } catch {
    snapshot = {};
  }

  if (Object.keys(snapshot).length === 0) {
    const results = await Promise.all(KNOWN_TABLES.map(async (t) => ({ t, e: await tableExists(t) })));
    for (const r of results) snapshot[r.t] = r.e;
  }

  CAP_CACHE.tables = snapshot;
  CAP_CACHE.done = true;
  return snapshot;
}

export async function columnExists(table, column) {
  const key = `${table}\x00${column}`;
  if (PROBE_CACHE.has(key)) return PROBE_CACHE.get(key);
  let exists = true;
  try {
    const { error } = await supabase.from(table).select(column).limit(1);
    if (error && /column.*(does not exist|could not find)|could not find.*column|PGRST204/i.test(String(error?.message || ""))) {
      exists = false;
    }
  } catch {
    exists = false;
  }
  PROBE_CACHE.set(key, exists);
  return exists;
}

export async function tableExists(table) {
  // When the capability snapshot is ready, use it. Tables not listed by
  // admin_schema_status are absent — return false immediately without a
  // failing network request (avoids 404 noise for missing tables).
  if (CAP_CACHE.done && CAP_CACHE.tables) {
    if (table in CAP_CACHE.tables) return CAP_CACHE.tables[table];
    return false;
  }
  const key = `t\x00${table}`;
  if (PROBE_CACHE.has(key)) return PROBE_CACHE.get(key);
  let exists = true;
  try {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error && /relation.*does not exist|PGRST205|PGRST202|not found|40P01/i.test(String(error?.message || ""))) {
      exists = false;
    }
  } catch {
    exists = false;
  }
  PROBE_CACHE.set(key, exists);
  return exists;
}

function isTableMissingError(error) {
  return /relation.*does not exist|PGRST205|PGRST202/i.test(String(error?.message || ""));
}

function isColumnMissingError(error) {
  return /column.*(does not exist|could not find)|could not find.*column|PGRST204/i.test(String(error?.message || ""));
}

/* ── error classification ─────────────────────────────────────────── */
export function classifyAdminError(error) {
  const code = String(error?.code || "");
  const msg = String(error?.message || error?.error_description || error?.hint || "");
  if (code === "PGRST202" || /could not find the function/i.test(msg)) return "NOT_MIGRATED";
  if (/relation ".*" does not exist|PGRST205|PGRST204/.test(msg)) return "NOT_MIGRATED";
  if (code === "42501" || /permission denied|row-level security/i.test(msg)) return "PERMISSION_DENIED";
  if (/FHC_LAST_ADMIN/i.test(msg)) return "LAST_ADMIN";
  if (/FHC_INVALID_ROLE/i.test(msg)) return "INVALID_ROLE";
  if (/FHC_USER_NOT_FOUND/i.test(msg)) return "USER_NOT_FOUND";
  if (code === "P0001" || /FHC_/i.test(msg)) return "RPC_REJECTED";
  if (/network|fetch failed|failed to fetch/i.test(msg)) return "NETWORK";
  return "UNKNOWN";
}

export function humanizeAdminError(error, fallback = "OPERATION FAILED") {
  const kind = classifyAdminError(error);
  switch (kind) {
    case "NOT_MIGRATED":
      return "REQUIRED DATABASE OBJECTS MISSING — RUN supabase/fhc-admin-rpcs.sql IN THE SQL EDITOR";
    case "PERMISSION_DENIED":
      return "PERMISSION DENIED — RLSD DATABASE REJECTED THE OPERATION";
    case "LAST_ADMIN":
      return "LAST ADMIN GUARD — AT LEAST ONE ADMIN MUST REMAIN";
    case "NETWORK":
      return "CONNECTION LOST — NO DATA NODE RESPONSE";
    default:
      return error?.message ? String(error.message).toUpperCase() : fallback;
  }
}

/* ── audit trail (best-effort, never hides the primary result) ──────
   admin_activity_logs + log_admin_activity() only exist AFTER the
   reconcile migration is applied. To keep the console clean before that,
   capability is probed ONCE per session: if the RPC is absent, audit
   writes are skipped silently (the primary operation is unaffected). */
const TRACK_CACHE = { done: false, works: false };

async function activityLogAvailable() {
  if (TRACK_CACHE.done) return TRACK_CACHE.works;
  TRACK_CACHE.done = true;
  try {
    const { error } = await supabase.rpc("log_admin_activity", {
      p_action: "SYSTEM_PROBE",
      p_entity_type: "system",
      p_entity_id: null,
      p_metadata: null,
    });
    TRACK_CACHE.works = !error;
  } catch {
    TRACK_CACHE.works = false;
  }
  return TRACK_CACHE.works;
}

export async function trackActivity(action, entityType, entityId, metadata = null) {
  if (!(await activityLogAvailable())) return;
  try {
    const { error } = await supabase.rpc("log_admin_activity", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId ? String(entityId) : null,
      p_metadata: metadata || null,
    });
    if (error) console.warn("[FHC Admin] activity log write failed:", error.message);
  } catch (err) {
    console.warn("[FHC Admin] activity log exception:", err?.message);
  }
}

/* ── one-shot RPC presence probe (session-cached) ──────────────────
   RPCs like admin_dashboard_stats / admin_security_audit only exist
   AFTER the reconcile migration is applied. Probing once per session
   lets callers skip a repeatedly-404 RPC and use their client fallback
   instead of firing a failing request on every visit. */
const RPC_PROBE = new Map(); // name -> boolean (available)

async function rpcAvailable(name) {
  if (RPC_PROBE.has(name)) return RPC_PROBE.get(name);
  const { error } = await supabase.rpc(name);
  const available = !error;
  RPC_PROBE.set(name, available);
  return available;
}

/* ════════════════════════════════════════════════════════════════════
   USERS  (profiles — live columns: id, full_name, avatar_url,
   created_at, updated_at, role)
   ════════════════════════════════════════════════════════════════════ */
export async function fetchUsers(opts = {}) {
  const {
    search = "",
    role = "ALL",
    status = "ALL",
    from = "",
    to = "",
    sortBy = "created_at",
    sortDir = "desc",
    page = 1,
    pageSize = 20,
  } = opts;

  let q = supabase.from(PROFILES).select("*", { count: "exact" });
  const s = String(search).trim();
  if (s) {
    const searchParts = ["full_name.ilike.%{s}%"];
    if (await columnExists(PROFILES, "email")) searchParts.push("email.ilike.%{s}%");
    if (await columnExists(PROFILES, "username")) searchParts.push("username.ilike.%{s}%");
    q = q.or(searchParts.map((p) => p.replace("{s}", s)).join(","));
  }
  if (role && role !== "ALL") q = q.eq("role", String(role).toLowerCase());
  if (status === "active" && (await columnExists(PROFILES, "is_active"))) q = q.eq("is_active", true);
  if (status === "inactive" && (await columnExists(PROFILES, "is_active"))) q = q.eq("is_active", false);
  if (from) q = q.gte("created_at", new Date(from).toISOString());
  if (to) q = q.lte("created_at", new Date(to).toISOString());

  const start = (page - 1) * pageSize;
  if (sortBy && (await columnExists(PROFILES, sortBy))) {
    q = q.range(start, start + pageSize - 1).order(sortBy, { ascending: sortDir === "asc" });
  } else {
    q = q.range(start, start + pageSize - 1).order("created_at", { ascending: false });
  }

  const { data, error, count } = await q;
  if (error) return { data: [], count: 0, error };
  return { data: data || [], count: count || 0, error: null };
}

export async function fetchUserById(id) {
  const { data, error } = await supabase.from(PROFILES).select("*").eq("id", id).maybeSingle();
  if (error) return { data: null, error };
  return { data, error: null };
}

/* ── profile-record centric listing (used by exports) ─────────────── */
export async function fetchProfiles(opts = {}) {
  const {
    search = "",
    role = "ALL",
    status = "ALL",
    hasAvatar = "ALL",
    sortBy = "updated_at",
    sortDir = "desc",
    page = 1,
    pageSize = 20,
  } = opts;

  let q = supabase.from(PROFILES).select("*", { count: "exact" });
  const s = String(search).trim();
  if (s) {
    const searchParts = ["full_name.ilike.%{s}%"];
    if (await columnExists(PROFILES, "email")) searchParts.push("email.ilike.%{s}%");
    if (await columnExists(PROFILES, "username")) searchParts.push("username.ilike.%{s}%");
    q = q.or(searchParts.map((p) => p.replace("{s}", s)).join(","));
  }
  if (role && role !== "ALL") q = q.eq("role", String(role).toLowerCase());
  if (status === "active" && (await columnExists(PROFILES, "is_active"))) q = q.eq("is_active", true);
  if (status === "inactive" && (await columnExists(PROFILES, "is_active"))) q = q.eq("is_active", false);
  if (hasAvatar === "yes") q = q.not("avatar_url", "is", null);
  if (hasAvatar === "no") q = q.is("avatar_url", null);

  const start = (page - 1) * pageSize;
  if (sortBy && (await columnExists(PROFILES, sortBy))) {
    q = q.range(start, start + pageSize - 1).order(sortBy, { ascending: sortDir === "asc" });
  } else {
    q = q.range(start, start + pageSize - 1).order("created_at", { ascending: false });
  }

  const { data, error, count } = await q;
  if (error) return { data: [], count: 0, error };
  return { data: data || [], count: count || 0, error: null };
}

/* ── pending applications count (applied + under_review) ──────────── */
export async function fetchPendingCount() {
  const { count, error } = await supabase
    .from(APPLICATIONS)
    .select("id", { count: "exact", head: true })
    .in("status", ["applied", "under_review"]);
  if (error) return { count: 0, error };
  return { count: count || 0, error: null };
}

/* ── global command search across the LIVE admin data nodes ────────── */
export const GLOBAL_SEARCH_EMPTY = {
  users: [],
  applications: [],
  team: [],
  gallery: [],
};

export async function globalSearch(term) {
  const s = String(term || "").trim();
  if (s.length < 2) return { ...GLOBAL_SEARCH_EMPTY };

  const limit = 5;

  /* One capability snapshot per session. Tables absent from the live DB
     (or excluded feature nodes) are SKIPPED — never queried, so no
     repeated 404 noise while typing in the command palette. */
  const caps = await schemaCapabilities();
  const canSearch = (table) => (caps && table in caps ? caps[table] : true);

  const [hasEmail, hasUsername, hasSeed] = await Promise.all([
    columnExists(PROFILES, "email"),
    columnExists(PROFILES, "username"),
    columnExists(PROFILES, "avatar_seed"),
  ]);

  const profileCols = ["id", "full_name", "role", "avatar_url"];
  if (hasEmail) profileCols.push("email");
  if (hasUsername) profileCols.push("username");
  if (hasSeed) profileCols.push("avatar_seed");

  const profileConditions = [`full_name.ilike.%${s}%`];
  if (hasEmail) profileConditions.push(`email.ilike.%${s}%`);
  if (hasUsername) profileConditions.push(`username.ilike.%${s}%`);

  const tasks = [
    { key: "users", active: true, promise: supabase.from(PROFILES).select(profileCols.join(", ")).or(profileConditions.join(",")).order("full_name", { ascending: true }).limit(limit) },
    { key: "applications", active: true, promise: supabase.from(APPLICATIONS).select("id, full_name, email, register_number, status, created_at").or(`full_name.ilike.%${s}%,email.ilike.%${s}%,register_number.ilike.%${s}%`).order("created_at", { ascending: false }).limit(limit) },
    { key: "team", active: true, promise: supabase.from(TEAM).select("id, name, designation, team, is_active, display_order").or(`name.ilike.%${s}%,designation.ilike.%${s}%`).order("display_order", { ascending: true }).limit(limit) },
    { key: "gallery", active: canSearch(GALLERY_FOLDERS), promise: GALLERY_FOLDERS ? supabase.from(GALLERY_FOLDERS).select("id, title, description, event_date, cover_image_url, created_at").or(`title.ilike.%${s}%,description.ilike.%${s}%`).order("event_date", { ascending: false, nullsFirst: false }).limit(limit) : Promise.resolve({ data: [], error: null }) },
  ];

  const settled = await Promise.all(
    tasks.map(async (t) => {
      if (!t.active) return { key: t.key, res: { data: [], error: null } };
      const res = await t.promise;
      return { key: t.key, res };
    })
  );

  const out = { ...GLOBAL_SEARCH_EMPTY };
  for (const r of settled) out[r.key] = r.res.error ? [] : r.res.data || [];
  return out;
}

export async function updateUserProfile(id, patch) {
  const clean = { ...patch };
  delete clean.role; // roles go through the secure RPC only
  // Strip columns that don't exist in the current schema
  const safePatch = {};
  for (const [k, v] of Object.entries(clean)) {
    if (k === "id" || k === "created_at") continue;
    if (await columnExists(PROFILES, k)) safePatch[k] = v;
  }
  if (Object.keys(safePatch).length === 0) return { data: null, error: { message: "NO EDITABLE COLUMNS AVAILABLE ON THIS PROFILE" } };
  const { data, error } = await supabase.from(PROFILES).update(safePatch).eq("id", id);
  if (!error) await trackActivity("USER_UPDATED", PROFILES, id, { patch: safePatch });
  return { data, error };
}

export async function setUserRole(id, newRole) {
  const { data, error } = await supabase.rpc("admin_set_user_role", {
    target: id,
    new_role: newRole,
  });
  if (!error) await trackActivity("ROLE_CHANGED", PROFILES, id, { role: newRole });
  return { data, error };
}

export async function toggleUserActive(id, active) {
  const col = await columnExists(PROFILES, "is_active");
  if (!col) {
    return { data: null, error: { message: "ACTIVE TOGGLE UNAVAILABLE — RUN supabase/fhc-admin-rpcs.sql" } };
  }
  const { data, error } = await supabase
    .from(PROFILES)
    .update({ is_active: active === false ? false : true })
    .eq("id", id);
  if (!error) await trackActivity(active ? "USER_ENABLED" : "USER_DISABLED", PROFILES, id);
  return { data, error };
}

/* ════════════════════════════════════════════════════════════════════
   JOIN APPLICATIONS  (statuses: applied / under_review / selected / rejected)
   ════════════════════════════════════════════════════════════════════ */
export async function fetchApplications(opts = {}) {
  const {
    search = "",
    status = "ALL",
    domain = "",
    yearBranch = "",
    from = "",
    to = "",
    sortBy = "created_at",
    sortDir = "desc",
    page = 1,
    pageSize = 20,
  } = opts;

  let q = supabase.from(APPLICATIONS).select("*", { count: "exact" });
  const s = String(search).trim();
  if (s) q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,register_number.ilike.%${s}%`);
  if (status && status !== "ALL") q = q.eq("status", String(status).toLowerCase());
  if (domain) q = q.ilike("selected_domain", `%${domain}%`);
  if (yearBranch) q = q.ilike("year_branch", `%${yearBranch}%`);
  if (from) q = q.gte("created_at", new Date(from).toISOString());
  if (to) q = q.lte("created_at", new Date(to).toISOString());

  const start = (page - 1) * pageSize;
  q = q.range(start, start + pageSize - 1).order(sortBy, { ascending: sortDir === "asc" });

  const { data, error, count } = await q;
  if (error) return { data: [], count: 0, error };
  return { data: data || [], count: count || 0, error: null };
}

/* Status transitions: RPC-first (one transaction: status + audit log),
   with a direct-update fallback once the reconcile migration grants an
   admin UPDATE policy. Before the migration, both paths surface a real
   PERMISSION_DENIED error — the UI shows it explicitly. */
export async function setApplicationStatus(id, status) {
  const rpcResult = await supabase.rpc("admin_set_application_status", {
    p_target: id,
    p_status: status,
  });
  if (!rpcResult.error) return rpcResult;
  if (String(rpcResult.error?.code || "") !== "PGRST202") return rpcResult;

  const { data, error } = await supabase
    .from(APPLICATIONS)
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (!error && data) await trackActivity("APPLICATION_STATUS_CHANGED", APPLICATIONS, id, { status });
  return { data, error };
}

/* ════════════════════════════════════════════════════════════════════
   TEAM
   ════════════════════════════════════════════════════════════════════ */
export async function fetchTeam(opts = {}) {
  const {
    search = "",
    team = "ALL",
    active = "ALL",
    sortBy = "display_order",
    sortDir = "asc",
    page = 1,
    pageSize = 20,
  } = opts;

  let q = supabase.from(TEAM).select("*", { count: "exact" });
  const s = String(search).trim();
  if (s)
    q = q.or(
      `name.ilike.%${s}%,designation.ilike.%${s}%,team.ilike.%${s}%,bio.ilike.%${s}%`
    );
  if (team && team !== "ALL") q = q.in("team", teamSynonyms(team));
  if (active === "active") q = q.eq("is_active", true);
  if (active === "inactive") q = q.eq("is_active", false);

  const start = (page - 1) * pageSize;
  q = q.range(start, start + pageSize - 1).order(sortBy, { ascending: sortDir === "asc" });

  const { data, error, count } = await q;
  if (error) {
    console.warn("[FHC TEAM] LOAD FAILED:", error.message);
    return { data: [], count: 0, error };
  }
  return { data: data || [], count: count || 0, error: null };
}

export async function fetchTeamMemberById(id) {
  const { data, error } = await supabase.from(TEAM).select("*").eq("id", id).maybeSingle();
  return { data, error };
}

/* Next free display order (current max + 1). Reads the ACTUAL database
   value so new members never collide with the highest existing order. */
export async function fetchTeamNextOrder() {
  const { data, error } = await supabase
    .from(TEAM)
    .select("display_order")
    .order("display_order", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[FHC TEAM] NEXT-ORDER PROBE FAILED:", error.message);
    return { value: 0, error };
  }
  return { value: (data?.display_order ?? 0) + 1, error: null };
}

export async function addTeamMember(payload) {
  const { data, error } = await supabase.from(TEAM).insert(payload).select("*").maybeSingle();
  if (error) {
    console.warn("[FHC TEAM] CREATE FAILED:", error.message);
    return { data: null, error };
  }
  if (!data) {
    // INSERT succeeded but no row returned — RLS blocked the read-back
    // (no admin SELECT policy yet). Surface a useful message, not a
    // cryptic PostgREST coercion error.
    console.warn("[FHC TEAM] CREATE RETURNED NO ROW — PERMISSION DENIED ON READ-BACK");
    return {
      data: null,
      error: { message: "Team member created but could not be read back. No permission to view this member." },
    };
  }
  await trackActivity("TEAM_MEMBER_ADDED", TEAM, data.id, { name: data.name });
  return { data, error: null };
}

export async function updateTeamMember(id, payload) {
  const { data, error } = await supabase.from(TEAM).update(payload).eq("id", id).select("*").maybeSingle();
  if (error) {
    console.warn("[FHC TEAM] UPDATE FAILED:", error.message);
    return { data: null, error };
  }
  if (!data) {
    // The UPDATE matched 0 rows (did not rewrite anything). Root cause is
    // covered by team_members_admin_full RLS: either the row is not
    // visible to the caller, or is_fhc_admin() is false. Distinguish
    // "not found" from "no permission" with a follow-up read.
    const { data: existing } = await supabase.from(TEAM).select("id").eq("id", id).maybeSingle();
    const err = existing
      ? { message: "No permission to update this member." }
      : { message: "Team member record was not found." };
    console.warn("[FHC TEAM] UPDATE RETURNED NO ROW:", err.message);
    return { data: null, error: err };
  }
  await trackActivity("TEAM_MEMBER_UPDATED", TEAM, id, { name: data.name, patch: payload });
  return { data, error: null };
}

export async function deleteTeamMember(id, name = "") {
  const { error } = await supabase.from(TEAM).delete().eq("id", id);
  if (error) console.warn("[FHC TEAM] DELETE FAILED:", error.message);
  if (!error) await trackActivity("TEAM_MEMBER_REMOVED", TEAM, id, { name });
  return { error };
}

/* ════════════════════════════════════════════════════════════════════
   APPLICATION FLOW — real per-status counts
   ════════════════════════════════════════════════════════════════════ */
export async function fetchApplicationStatusCounts() {
  const results = await Promise.all(
    APPLICATION_STATUSES.map(async (st) => {
      const { count, error } = await supabase
        .from(APPLICATIONS)
        .select("id", { count: "exact", head: true })
        .eq("status", st);
      return { status: st, count: error ? 0 : count || 0 };
    })
  );
  const fallback = { applied: 0, under_review: 0, selected: 0, rejected: 0 };
  const out = { ...fallback };
  for (const r of results) out[r.status] = r.count;
  return out;
}

/* ════════════════════════════════════════════════════════════════════
   ASSET COUNTS — live gallery dimensions
   ════════════════════════════════════════════════════════════════════ */
export async function fetchGalleryCounts() {
  const countRows = async (table) => {
    try {
      const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
      return error ? null : count || 0;
    } catch {
      return null;
    }
  };
  const [folders, images] = await Promise.all([
    countRows(GALLERY_FOLDERS),
    countRows(GALLERY_IMAGES),
  ]);
  return { folders, images };
}

/* ════════════════════════════════════════════════════════════════════
   STATS + SECURITY
   ════════════════════════════════════════════════════════════════════ */
export async function fetchDashboardStats() {
  // Primary path: server-side RPC (admin_dashboard_stats) computes the
  // ONLY trusted numbers — total_users and admins come from auth.users,
  // active_members from profiles.is_active. No client-side guessing.
  // Probed once per session: before the reconcile migration is applied
  // the RPC does not exist, so we skip it and use the client fallback
  // below instead of firing a 404 on every dashboard visit.
  if (await rpcAvailable("admin_dashboard_stats")) {
    const { data: rpcData, error: rpcError } = await supabase.rpc("admin_dashboard_stats");

    if (!rpcError && rpcData) {
      const s = Array.isArray(rpcData) ? rpcData[0] || {} : rpcData;
      return {
        data: {
          total_users: s.total_users ?? 0,
          active_members: s.active_members ?? 0,
          admins: s.admins ?? 0,
          media: s.media ?? 0,
          pending_applications: s.pending_applications ?? 0,
          approved_applications: s.approved_applications ?? 0,
          rejected_applications: s.rejected_applications ?? 0,
          under_review_applications: s.under_review_applications ?? 0,
          applications_total: s.applications_total ?? 0,
          team_members_total: s.team_members_total ?? 0,
          team_members_active: s.team_members_active ?? 0,
          gallery_folders: s.gallery_folders ?? 0,
          gallery_images: s.gallery_images ?? 0,
        },
        _source: "rpc",
        _missing: [],
        error: null,
      };
    }
  }

  // Fallback (migration not applied yet): count ONLY retained tables that
  // exist. Absent tables are skipped, never queried, and surface as null.
  const missing = [];
  let coreError = null;

  const countRows = async (table, buildFilter, { optional = false } = {}) => {
    try {
      if (optional && !(await tableExists(table))) {
        missing.push(table);
        return null;
      }
      const base = supabase.from(table).select("id", { count: "exact", head: true });
      const q = buildFilter ? buildFilter(base) : base;
      const { count, error } = await q;
      if (error) throw error;
      return count || 0;
    } catch (err) {
      if (!optional) coreError = err;
      return optional ? null : 0;
    }
  };

  // ── Core counts (required) ─────────────────────────────────────────
  const totalProfiles = await countRows(PROFILES);
  const admins = await countRows(PROFILES, (q) => q.eq("role", "admin"));
  const media = await countRows(PROFILES, (q) => q.eq("role", "media"));

  let activeMembers;
  if (await columnExists(PROFILES, "is_active")) {
    activeMembers = await countRows(PROFILES, (q) => q.eq("is_active", true));
  } else {
    activeMembers = await countRows(PROFILES, (q) => q.eq("role", "member"));
  }

  const pendingApps = await countRows(APPLICATIONS, (q) => q.in("status", ["applied", "under_review"]));
  const underReviewApps = await countRows(APPLICATIONS, (q) => q.eq("status", "under_review"));
  const approvedApps = await countRows(APPLICATIONS, (q) => q.eq("status", "selected"));
  const rejectedApps = await countRows(APPLICATIONS, (q) => q.eq("status", "rejected"));
  const totalApps = await countRows(APPLICATIONS);

  const teamActive = await countRows(TEAM, (q) => q.eq("is_active", true));
  const teamTotal = await countRows(TEAM);

  // ── Gallery counts (live tables) ────────────────────────────────────
  const galleryFolders = await countRows(GALLERY_FOLDERS);
  const galleryImages = await countRows(GALLERY_IMAGES);

  const data = {
    total_users: totalProfiles,
    active_members: activeMembers,
    admins,
    media,
    pending_applications: pendingApps,
    under_review_applications: underReviewApps,
    approved_applications: approvedApps,
    rejected_applications: rejectedApps,
    applications_total: totalApps,
    team_members_total: teamTotal,
    team_members_active: teamActive,
    gallery_folders: galleryFolders,
    gallery_images: galleryImages,
    _missing: missing,
  };

  return { data, error: coreError, _source: "client" };
}

export async function securityAudit() {
  // Server-side audit first (probed once per session — skips a 404 when
  // the reconcile migration hasn't been applied yet).
  if (await rpcAvailable("admin_security_audit")) {
    const { data, error } = await supabase.rpc("admin_security_audit");
    if (!error && data) {
      return { data, error: null };
    }
  }

  // Fallback: build a client-side audit from real queries only.
  const caps = await schemaCapabilities();
  const tables = Object.values(TABLES);
  const tableCounts = {};

  await Promise.all(
    tables.map(async (t) => {
      if (caps && t in caps && !caps[t]) {
        tableCounts[t] = "UNAVAILABLE";
        return;
      }
      try {
        const exists = await tableExists(t);
        if (!exists) {
          tableCounts[t] = "UNAVAILABLE";
          return;
        }
        const { count, error: e } = await supabase.from(t).select("id", { count: "exact", head: true });
        tableCounts[t] = e ? "UNAVAILABLE" : count || 0;
      } catch {
        tableCounts[t] = "UNAVAILABLE";
      }
    })
  );

  const { data: userData } = await supabase.auth.getUser();
  const roleSource =
    userData?.user?.app_metadata?.role ||
    userData?.user?.user_metadata?.role ||
    "member";

  const rlsTableCount = tables.filter((t) => tableCounts[t] !== "UNAVAILABLE").length;

  return {
    data: {
      audit_time: new Date().toISOString(),
      role_source: roleSource,
      is_admin: roleSource === "admin",
      rls_table_count: rlsTableCount,
      table_counts: tableCounts,
      profiles_total: tableCounts.profiles,
      gallery_folders: tableCounts.gallery_folders,
      gallery_images: tableCounts.gallery_images,
      role_rpc_enabled: false,
      fallback: true,
    },
    error: null,
  };
}

export async function pingDatabase() {
  const started = Date.now();
  const { error } = await supabase.from(TEAM).select("id", { head: true }).limit(1);
  return { ok: !error, latencyMs: Date.now() - started, error };
}

export async function pingAuth() {
  const started = Date.now();
  const { data, error } = await supabase.auth.getUser();
  return { ok: !error && !!data?.user, latencyMs: Date.now() - started, error };
}

export async function pingStorage() {
  const started = Date.now();
  try {
    const { data, error } = await supabase.storage.from("team-members").list("", { limit: 1 });
    return { ok: !error, latencyMs: Date.now() - started, error };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - started, error: err };
  }
}

export function extractDomainOptions(applications) {
  const set = new Set();
  for (const a of applications || []) {
    if (a.selected_domain) set.add(a.selected_domain);
  }
  return [...set].sort();
}

export function extractTeamOptions(team) {
  const set = new Set();
  for (const m of team || []) {
    if (m.team) set.add(m.team);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}