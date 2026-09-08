import { supabase } from "./supabase";

export const JOIN_APPLICATIONS_TABLE = "fhc_join_applications";

export const JOIN_SUBMIT_STATE = {
  IDLE: "idle",
  SUBMITTING: "submitting",
  SUCCESS: "success",
  ERROR: "error",
};

/* FHC canonical domain labels (Stage 02). These are the exact values
   written to `selected_domain` — clean labels only, no emoji/markup. */
export const DOMAIN_LABELS = [
  "Web Development",
  "Artificial Intelligence",
  "Cyber Security",
  "Internet of Things",
  "UI/UX Design",
  "Content & Media",
  "Documentation",
];

const DOMAIN_SET = new Set(DOMAIN_LABELS);

/* Validation code used to distinguish client-side input errors from
   network/database failures in the caller. */
export const VALIDATION_ERROR = "FHC_VALIDATION";

/* Postgres `unique_violation` — raised when register_number or email
   already exists on the table. Drives the duplicate message. */
const UNIQUE_VIOLATION = "23505";

/* Application lifecycle — Join ONLY ever writes `applied`. Moving to
   under_review / selected / rejected is an admin-side decision. */
export const APPLICATION_STATUS = {
  APPLIED: "applied",
  UNDER_REVIEW: "under_review",
  SELECTED: "selected",
  REJECTED: "rejected",
};

export function isValidDomain(label) {
  return DOMAIN_SET.has(String(label || "").trim());
}

/* Normalize + validate the Join form shape into the exact row we write.
   Returns { clean, errors } — clean is null when errors are present. */
export function validateJoinForm(form = {}) {
  const errors = [];
  const clean = {
    full_name: String(form.name || "").trim(),
    year_branch: String(form.branch || "").trim(),
    register_number: String(form.reg || "").trim(),
    email: String(form.email || "").trim(),
    phone: String(form.phone || "").trim(),
    about_you: String(form.about || "").trim(),
    selected_domain: String(form.domain || "").trim(),
  };

  if (!clean.full_name) errors.push("FULL NAME // PROVIDE YOUR NAME");
  if (!clean.year_branch || clean.year_branch === "Select your year & branch")
    errors.push("YEAR & BRANCH // SELECT A BRANCH");
  if (!clean.register_number) errors.push("REGISTER NUMBER // REQUIRED");
  if (!clean.email) {
    errors.push("EMAIL // REQUIRED");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.email)) {
    errors.push("EMAIL // INVALID FORMAT");
  }
  if (!clean.phone) errors.push("PHONE // REQUIRED");
  if (!clean.about_you) errors.push("ABOUT YOU // TELL US ABOUT YOURSELF");
  if (!clean.selected_domain) {
    errors.push("DOMAIN // SELECT A DOMAIN");
  } else if (!DOMAIN_SET.has(clean.selected_domain)) {
    errors.push("DOMAIN // UNKNOWN DOMAIN");
  }

  return { clean: errors.length ? null : clean, errors };
}

export function isDuplicateApplicationError(error) {
  return Boolean(error && error.code === UNIQUE_VIOLATION);
}

/* Legacy live-schema compatibility: projects that have not yet run
   supabase/join-applications.sql still carry the ORIGINAL status CHECK
   (('pending','approved','rejected')), so 'applied' would be rejected
   with 23514. That migration rebuilds the constraint to the full lifecycle
   and NORMALIZES legacy 'pending' → 'applied'. When the ONLY failure is
   that status check, retry ONCE with legacy 'pending' — functionally the
   same application; it becomes 'applied' the moment the migration runs.
   Every other error is forwarded verbatim (never hidden). */
const LEGACY_PENDING = "pending";

export function isLegacyStatusConstraintError(error) {
  return Boolean(
    error &&
    error.code === "23514" &&
    (String(error.message || "").includes("fhc_join_applications_status_check"))
  );
}

/* Write exactly ONE application row on final submit. Never called from
   stage transitions — only from the terminal submit handler. Throws on
   failure so the caller can render the appropriate FHC-styled state. */
export async function submitJoinApplication(form) {
  const { clean, errors } = validateJoinForm(form);
  if (!clean) {
    const err = new Error(errors.join(" / "));
    err.code = VALIDATION_ERROR;
    throw err;
  }

  const insert = (status) =>
    supabase
      .from(JOIN_APPLICATIONS_TABLE)
      .insert({
        full_name: clean.full_name,
        year_branch: clean.year_branch,
        register_number: clean.register_number,
        email: clean.email,
        phone: clean.phone,
        about_you: clean.about_you,
        selected_domain: clean.selected_domain,
        status,
      });

  /* NOTE: we deliberately do NOT chain `.select()` here. RLS grants anon
     INSERT-only on this table (public join form); requesting the inserted
     row back would force PostgREST to read it (return=representation),
     which requires a public SELECT policy we must NOT create. The insert
     resolving without `error` IS the database confirmation. */
  let { error } = await insert(APPLICATION_STATUS.APPLIED);

  if (error && isLegacyStatusConstraintError(error)) {
    console.warn(
      "[FHC] Live DB still on legacy status constraint — retrying once with 'pending' (normalizes to 'applied' after running join-applications.sql).",
      error
    );
    error = (await insert(LEGACY_PENDING)).error;
  }

  if (error) throw error;
  return true;
}