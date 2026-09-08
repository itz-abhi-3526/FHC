/* ════════════════════════════════════════════════════════════════
   FHC — Cloudinary avatar upload (UNSIGNED only)
   Replaces file→base64 entirely. Flow:
     LOCAL FILE → Cloudinary (unsigned preset) → secure_url → Supabase avatar_url.
   SECURITY:
     * Only the cloud name + unsigned upload preset live in the frontend.
     * NO API secret, NO signed request, NO VITE_CLOUDINARY_API_SECRET.
     * The unsigned preset must be created in the Cloudinary dashboard with
       "Signing Mode: Unsigned" (and an optional folder, e.g. fhc/avatars).
   ════════════════════════════════════════════════════════════════ */

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
export const AVATAR_ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];

export function isCloudinaryConfigured() {
  return Boolean(
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_UPLOAD_PRESET &&
    !CLOUDINARY_CLOUD_NAME.includes("your-") &&
    !CLOUDINARY_UPLOAD_PRESET.includes("your-")
  );
}

/** Validate a File before it is sent anywhere.
 *  Returns { ok:true } or { ok:false, reason: code }. */
export function isValidAvatarFile(file) {
  if (!file) return { ok: false, reason: "NO_FILE" };
  if (!AVATAR_ACCEPTED_MIME.includes(file.type)) return { ok: false, reason: "INVALID_TYPE" };
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, reason: "TOO_LARGE" };
  if (file.size <= 0) return { ok: false, reason: "EMPTY_FILE" };
  return { ok: true };
}

/** Upload an image to Cloudinary using the UNSIGNED preset.
 *  Returns the resulting secure_url. Throws an Error with a `.code`:
 *   CLOUDINARY_NOT_CONFIGURED | INVALID_IMAGE | IMAGE_TOO_LARGE |
 *   CLOUDINARY_NETWORK | CLOUDINARY_UPLOAD_FAILED */
export async function uploadAvatarToCloudinary(file, uid) {
  if (!isCloudinaryConfigured()) {
    const err = new Error(
      "Cloudinary not configured: add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env.local"
    );
    err.code = "CLOUDINARY_NOT_CONFIGURED";
    throw err;
  }

  const check = isValidAvatarFile(file);
  if (!check.ok) {
    const err = new Error(check.reason);
    err.code = check.reason === "TOO_LARGE" ? "IMAGE_TOO_LARGE" : "INVALID_IMAGE";
    throw err;
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  /* UNIQUE public id PER UPLOAD — required for repeated uploads.
     This preset has overwrite=false: reusing one fixed public_id
     (fhc/avatars/<uid>) makes Cloudinary reject the 2nd upload with
     "Overwrite is set to false, but an asset with the same public ID
     already exists" (HTTP 400). A fresh public id each time avoids that
     collision entirely, requires no preset change, and keeps all of a
     user's avatars grouped under fhc/avatars/. */
  if (uid) {
    const unique = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    form.append("public_id", `fhc/avatars/${uid}_${unique}`);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  console.log("[FHC Avatar] starting Cloudinary upload →", file.name, `${file.type} ${(file.size / 1024).toFixed(1)} KB`);
  let res;
  try {
    res = await fetch(endpoint, { method: "POST", body: form });
  } catch (fetchErr) {
    console.error("[FHC Avatar] Cloudinary request threw:", fetchErr);
    const err = new Error(`Cloudinary network failure: ${fetchErr.message}`);
    err.code = "CLOUDINARY_NETWORK";
    throw err;
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  console.log("[FHC Avatar] Cloudinary response received →", res.status);

  if (!res.ok || !json || !json.secure_url) {
    const reason = json?.error?.message || `HTTP ${res.status}`;
    console.error("[FHC Avatar] Cloudinary rejected upload:", reason);
    const err = new Error(`Cloudinary upload failed: ${reason}`);
    err.code = "CLOUDINARY_UPLOAD_FAILED";
    err.detail = reason;
    throw err;
  }

  console.log("[FHC Avatar] secure_url received →", json.secure_url);
  return json.secure_url;
}