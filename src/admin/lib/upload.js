import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, MAX_AVATAR_BYTES } from "../../lib/cloudinary";

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — general Cloudinary uploads
   Uses the SAME uid-based collision-proof id scheme as the avatar upload:
   fresh public_id per upload under an optional folder prefix.
   ════════════════════════════════════════════════════════════════════ */

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/* High-res stills (gallery photos) may be larger than avatar stills. */
const MAX_GALLERY_BYTES = 20 * 1024 * 1024; // 20 MB

export function isConfigured() {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
}

export function validateImage(file) {
  if (!file) return { ok: false, reason: "NO_FILE" };
  if (!ACCEPTED.includes(file.type)) return { ok: false, reason: "INVALID_TYPE" };
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, reason: "TOO_LARGE" };
  if (file.size <= 0) return { ok: false, reason: "EMPTY_FILE" };
  return { ok: true };
}

export function validateGalleryImage(file) {
  if (!file) return { ok: false, reason: "NO_FILE" };
  if (!ACCEPTED.includes(file.type)) return { ok: false, reason: "INVALID_TYPE" };
  if (file.size > MAX_GALLERY_BYTES) return { ok: false, reason: "TOO_LARGE" };
  if (file.size <= 0) return { ok: false, reason: "EMPTY_FILE" };
  return { ok: true };
}

function makePublicId(prefix) {
  const unique = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return prefix ? `${prefix}/${unique}` : unique;
}

const UPLOAD_ENDPOINT = (cloud) => `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;

async function postToCloudinary(file, publicId) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  form.append("public_id", publicId);

  let res;
  try {
    res = await fetch(UPLOAD_ENDPOINT(CLOUDINARY_CLOUD_NAME), { method: "POST", body: form });
  } catch (fetchErr) {
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

  if (!res.ok || !json || !json.secure_url) {
    const reason = json?.error?.message || `HTTP ${res.status}`;
    const err = new Error(`Cloudinary upload failed: ${reason}`);
    err.code = "CLOUDINARY_UPLOAD_FAILED";
    err.detail = reason;
    throw err;
  }
  return json;
}

/**
 * Upload an image at an arbitrary folder prefix.
 * @param {File} file
 * @param {string} folder  e.g. "fhc/gallery", "fhc/events", "fhc/projects"
 * @returns {Promise<string>} secure_url
 */
export async function uploadAdminImage(file, folder = "fhc/admin") {
  if (!isConfigured()) {
    const err = new Error("Cloudinary not configured");
    err.code = "CLOUDINARY_NOT_CONFIGURED";
    throw err;
  }
  const check = validateImage(file);
  if (!check.ok) {
    const err = new Error(check.reason);
    err.code = "INVALID_IMAGE";
    throw err;
  }

  const json = await postToCloudinary(file, makePublicId(folder));
  return json.secure_url;
}

/**
 * Upload a gallery image (up to 20 MB) and capture both the deliverable
 * URL and the public_id so the asset can be removed on delete.
 * @param {File} file
 * @param {string} folder  e.g. "fhc/gallery/01JQ..."
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export async function uploadGalleryImage(file, folder = "fhc/gallery") {
  if (!isConfigured()) {
    const err = new Error("Cloudinary not configured");
    err.code = "CLOUDINARY_NOT_CONFIGURED";
    throw err;
  }
  const check = validateGalleryImage(file);
  if (!check.ok) {
    const err = new Error(check.reason);
    err.code = "INVALID_IMAGE";
    throw err;
  }
  const json = await postToCloudinary(file, makePublicId(folder));
  return { secure_url: json.secure_url, public_id: json.public_id };
}

/**
 * Destroy a Cloudinary asset by public_id using the SAME unsigned upload
 * preset (unsigned deletion must be enabled on the preset in the
 * Cloudinary console). Best-effort: if the preset does not permit it, the
 * resolve stays false and the caller decides whether to hide the error.
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function destroyCloudinaryAsset(publicId) {
  if (!isConfigured() || !publicId) return { ok: false, reason: "MISSING_ID" };
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  let res;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
      method: "POST",
      body: form,
    });
  } catch (fetchErr) {
    return { ok: false, reason: `NETWORK: ${fetchErr.message}` };
  }
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok || json?.result !== "ok") {
    return {
      ok: false,
      reason: json?.error?.message || `HTTP ${res.status}`,
    };
  }
  return { ok: true };
}

export function humanizeUploadError(err) {
  switch (err?.code) {
    case "CLOUDINARY_NOT_CONFIGURED":
      return "CLOUDINARY NOT CONFIGURED — CHECK .env.local";
    case "INVALID_TYPE":
      return "INVALID FILE TYPE — USE JPG / PNG / WEBP / GIF";
    case "TOO_LARGE":
      return "FILE TOO LARGE";
    case "CLOUDINARY_NETWORK":
      return "UPLOAD NETWORK FAILURE — RETRY LINK";
    case "CLOUDINARY_UPLOAD_FAILED":
      return `UPLOAD REJECTED — ${err?.detail || "CLOUDINARY ERROR"}`.toUpperCase();
    default:
      return String(err?.message || "UPLOAD FAILED").toUpperCase();
  }
}