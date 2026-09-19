/* ════════════════════════════════════════════════════════════════
   FHC // MEDIA CONSOLE — gallery photo + video upload (UNSIGNED only)
   Mirrors the Admin upload flow (src/admin/lib/upload.js) using the
   SAME Cloudinary cloud + unsigned preset, but splits resources:
     image/*  → /image/upload     (jpg/png/webp/gif, ≤ 20 MB, photo only)
     video/*  → /video/upload     (mp4/webm/mov/m4v, ≤ 200 MB)
   SECURITY:
     * Only the cloud name + unsigned preset live in the frontend.
     * No API secret, no signed request.
     * A fresh public_id per upload under fhc/gallery/<folderId> avoids
       the "overwrite=false" collision and keeps an album's assets grouped.
   ════════════════════════════════════════════════════════════════ */

import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  isCloudinaryConfigured,
} from "./cloudinary";

/* Photo limits mirror the existing admin upload rules. */
export const MEDIA_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MEDIA_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB
export const MEDIA_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MEDIA_VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

export const MEDIA_TYPE = {
  PHOTO: "photo",
  VIDEO: "video",
};

/* Shared accept="..." string for <input type="file">. */
export const MEDIA_ACCEPT = [...MEDIA_IMAGE_MIME, ...MEDIA_VIDEO_MIME].join(",");

export function isConfigured() {
  return isCloudinaryConfigured();
}

/** Route a file to its media type by MIME. Unknown → "photo" fallback
 *  is avoided: validation runs before any routing decision. */
export function mimeToMediaType(mime) {
  if (MEDIA_VIDEO_MIME.includes(mime)) return MEDIA_TYPE.VIDEO;
  return MEDIA_TYPE.PHOTO;
}

/** Validate a File before it is sent anywhere.
 *  Returns { ok:true, mediaType } or { ok:false, reason: code }. */
export function validateGalleryMedia(file) {
  if (!file) return { ok: false, reason: "NO_FILE" };
  const isVideo = MEDIA_VIDEO_MIME.includes(file.type);
  const isImage = MEDIA_IMAGE_MIME.includes(file.type);
  if (!isVideo && !isImage) return { ok: false, reason: "INVALID_TYPE" };
  if (isVideo && file.size > MEDIA_VIDEO_BYTES) return { ok: false, reason: "VIDEO_TOO_LARGE" };
  if (isImage && file.size > MEDIA_IMAGE_BYTES) return { ok: false, reason: "IMAGE_TOO_LARGE" };
  if (file.size <= 0) return { ok: false, reason: "EMPTY_FILE" };
  return { ok: true, mediaType: isVideo ? MEDIA_TYPE.VIDEO : MEDIA_TYPE.PHOTO };
}

function makePublicId(folderId) {
  const unique = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return `fhc/gallery/${folderId}/${unique}`;
}

function endpoint(resourceType) {
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
}

/** Upload a gallery photo or video to Cloudinary via the UNSIGNED preset.
 *  @returns {Promise<{ secure_url: string, public_id: string, media_type: string }>} */
export async function uploadGalleryMedia(file, folderId) {
  if (!isCloudinaryConfigured()) {
    const err = new Error("Cloudinary not configured");
    err.code = "CLOUDINARY_NOT_CONFIGURED";
    throw err;
  }

  const check = validateGalleryMedia(file);
  if (!check.ok) {
    const err = new Error(check.reason);
    err.code = "INVALID_GALLERY_MEDIA";
    throw err;
  }

  /* DB media_type and Cloudinary resource_type are DIFFERENT values:
       photo (DB)  → image (Cloudinary)
       video (DB)  → video (Cloudinary)
     Cloudinary has no "photo" resource type — map explicitly. */
  const mediaType = check.mediaType; // "photo" | "video" → gallery_images.media_type
  const resourceType = mediaType === "video" ? "video" : "image"; // Cloudinary

  const publicId = makePublicId(folderId || "unnamed");

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  form.append("public_id", publicId);

  let res;
  try {
    res = await fetch(endpoint(resourceType), { method: "POST", body: form });
  } catch (fetchErr) {
    const err = new Error(`Cloudinary network failure: ${fetchErr.message}`);
    err.code = "CLOUDINARY_NETWORK";
    throw err;
  }

  const responseText = await res.text();
  let json = null;
  try {
    json = JSON.parse(responseText);
  } catch {
    json = null;
  }

  if (!res.ok || !json || !json.secure_url) {
    const reason = json?.error?.message || responseText.trim() || `HTTP ${res.status}`;
    console.error(`[FHC MediaConsole] Cloudinary upload rejected (${res.status}):`, reason);
    const err = new Error(`Cloudinary upload failed (${res.status}): ${reason}`);
    err.code = "CLOUDINARY_UPLOAD_FAILED";
    err.detail = reason;
    throw err;
  }

  return {
    secure_url: json.secure_url,
    public_id: json.public_id || publicId,
    media_type: mediaType,
  };
}

export function humanizeMediaUploadError(err) {
  switch (err?.code) {
    case "CLOUDINARY_NOT_CONFIGURED":
      return "CLOUDINARY NOT CONFIGURED — CHECK .env.local";
    case "INVALID_TYPE":
      return "INVALID FILE TYPE — USE JPG / PNG / WEBP / GIF OR MP4 / WEBM / MOV";
    case "IMAGE_TOO_LARGE":
      return "PHOTO TOO LARGE — MAXIMUM 20 MB";
    case "VIDEO_TOO_LARGE":
      return "VIDEO TOO LARGE — MAXIMUM 200 MB";
    case "CLOUDINARY_NETWORK":
      return "UPLOAD NETWORK FAILURE — RE-CONNECT AND RETRY";
    case "CLOUDINARY_UPLOAD_FAILED":
      return `UPLOAD REJECTED — ${err?.detail || "CLOUDINARY ERROR"}`.toUpperCase();
    default:
      return String(err?.message || "UPLOAD FAILED").toUpperCase();
  }
}