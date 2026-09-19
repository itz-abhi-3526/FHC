/* ════════════════════════════════════════════════════════════════
   FHC — profile (matching row in public.profiles, keyed on auth uid)
   Profile row: id(uuid, PK → auth.users). Update only writes the
   authenticated user's OWN row; RLS enforces auth.uid() = id.
   ════════════════════════════════════════════════════════════════ */

import { supabase, PROFILE_TABLE } from "./supabase";

export const PROFILE_ERROR = {
  NO_USER: "FHC_NO_USER",
  NOT_FOUND: "FHC_NOT_FOUND",
  RLS_DENIED: "FHC_RLS_DENIED",
  DUPLICATE_USERNAME: "FHC_DUPLICATE_USERNAME",
  UNKNOWN: "FHC_UNKNOWN",
};

/** Fresh session check — never trust stale React state when writing. */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

/** Classify a profiles UPDATE error into a stable code so the UI can
 *  show different FHC-styled messages per failure mode. The raw error is
 *  always logged separately by the caller (never swallowed). */
export function classifyProfileError(error) {
  if (!error) return null;
  const code = error.code || "";
  const message = (error.message || error.error_description || "").toString().toLowerCase();

  if (
    code === "23505" ||
    message.includes("duplicate key") ||
    message.includes("duplicate value") ||
    message.includes("unique constraint")
  ) {
    // Username column carries a UNIQUE constraint; only username can collide here.
    return PROFILE_ERROR.DUPLICATE_USERNAME;
  }
  if (
    message.includes("row-level security") ||
    message.includes("new row violates") ||
    message.includes("permission denied") ||
    code === "42501"
  ) {
    return PROFILE_ERROR.RLS_DENIED;
  }
  if (code === "PGRST116" || message.includes("could not find")) {
    return PROFILE_ERROR.NOT_FOUND;
  }
  return PROFILE_ERROR.UNKNOWN;
}

/** Columns that may be written through the PUBLIC API. Anything else
 *  (username, bio, is_active, email, last_login_at, avatar_seed ...) is
 *  NOT part of the LIVE profiles schema — attempting to write it returns
 *  a 400 (PGRST204), so those keys are stripped here before any request. */
const WRITABLE_COLUMNS = new Set(["full_name", "avatar_url"]);

/** Update ONLY the given auth uid's own profile row with `patch`.
 *  Caller decides WHICH fields actually changed. Returns the Supabase
 *  result; inspect `.error` (null on success). */
export async function updateProfileFields(uid, patch) {
  const safe = {};
  for (const [k, v] of Object.entries(patch || {})) {
    if (WRITABLE_COLUMNS.has(k)) safe[k] = v;
  }
  if (uid == null || Object.keys(safe).length === 0) {
    return { data: null, error: { message: "NO WRITABLE PROFILE FIELDS PROVIDED", code: "FHC_NO_WRITABLE_FIELDS" } };
  }
  return supabase.from(PROFILE_TABLE).update(safe).eq("id", uid);
}