/* ════════════════════════════════════════════════════════════════
   FHC // GALLERY — event-based media archive
   gallery_folders (one folder = one event/programme)
   gallery_images  (photos belonging to a folder)

   Public:        SELECT both tables
   Admin/Media:   full management (gated by RLS at the database)
   ════════════════════════════════════════════════════════════════ */

import { supabase } from "./supabase";

export const GALLERY_TABLES = {
  folders: "gallery_folders",
  images: "gallery_images",
};

export const GALLERY_STATE = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

/* ── Cloudinary URL transforms ─────────────────────────────────
   Rewrite Cloudinary URLs with delivery transforms so the archive
   serves the right bytes per context (f_auto/q_auto + width). */
const CLOUDINARY_RE = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.*)$/i;

export function buildGallerySrc(url, { width, quality = "auto", format = "auto" } = {}) {
  const trimmed = String(url || "").trim();
  const m = CLOUDINARY_RE.exec(trimmed);
  if (!m) return trimmed;
  const [, cloud, rest] = m;
  const segments = rest.split("/");
  let versionIdx = segments.findIndex((s) => /^v\d+$/.test(s));
  if (versionIdx === -1) versionIdx = 0;
  const transforms = [`f_${format}`, `q_${quality}`];
  if (width) transforms.push("c_limit", `w_${width}`, "dpr_auto");
  return `https://res.cloudinary.com/${cloud}/image/upload/${transforms.join(",")}/${segments
    .slice(versionIdx)
    .join("/")}`;
}

export function gallerySrcSet(url, widths = [420, 840, 1280]) {
  return widths.map((w) => `${buildGallerySrc(url, { width: w })} ${w}w`).join(", ");
}

/* ── Folder queries ───────────────────────────────────────────── */
export async function fetchGalleryFolders() {
  const { data, error } = await supabase
    .from(GALLERY_TABLES.folders)
    .select("*, gallery_images(count)")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  return rows.map((r) => ({
    id: r.id,
    title: r.title || "UNTITLED EVENT",
    description: r.description || "",
    event_date: r.event_date || null,
    cover_image_url: r.cover_image_url || "",
    created_by: r.created_by || null,
    created_at: r.created_at || null,
    updated_at: r.updated_at || null,
    /* gallery_images(count) returns [{ count: N }] — never .length. */
    image_count: r?.gallery_images?.[0]?.count ?? 0,
  }));
}

export async function fetchGalleryFolder(id) {
  const { data, error } = await supabase
    .from(GALLERY_TABLES.folders)
    .select("*, gallery_images(count)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    title: data.title || "UNTITLED EVENT",
    description: data.description || "",
    event_date: data.event_date || null,
    cover_image_url: data.cover_image_url || "",
    created_by: data.created_by || null,
    created_at: data.created_at || null,
    updated_at: data.updated_at || null,
    image_count: data?.gallery_images?.[0]?.count ?? 0,
  };
}

export async function fetchGalleryImages(folderId) {
  const { data, error } = await supabase
    .from(GALLERY_TABLES.images)
    .select("*")
    .eq("folder_id", folderId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createGalleryFolder(payload) {
  const clean = {
    title: String(payload.title || "").trim(),
    description: String(payload.description || "").trim() || null,
    event_date: payload.event_date || null,
    cover_image_url: payload.cover_image_url || null,
    created_by: (await supabase.auth.getUser()).data?.user?.id || null,
  };
  const { data, error } = await supabase
    .from(GALLERY_TABLES.folders)
    .insert(clean)
    .select("*")
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function updateGalleryFolder(id, patch) {
  const clean = {};
  if (patch.title !== undefined) clean.title = String(patch.title).trim();
  if (patch.description !== undefined) clean.description = patch.description ? String(patch.description).trim() : null;
  if (patch.event_date !== undefined) clean.event_date = patch.event_date || null;
  if (patch.cover_image_url !== undefined) clean.cover_image_url = patch.cover_image_url || null;
  if (Object.keys(clean).length === 0) return { data: null, error: { message: "NO FIELDS TO UPDATE" } };
  const { data, error } = await supabase
    .from(GALLERY_TABLES.folders)
    .update(clean)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function deleteGalleryFolder(id) {
  const { error } = await supabase
    .from(GALLERY_TABLES.folders)
    .delete()
    .eq("id", id);
  return { error };
}

/* ── Media queries (photos + videos) ───────────────────────────
   gallery_images schema has NO media_type column. The uploader
   stores the Cloudinary asset URL + public_id; image-vs-video is
   decided at render time from the URL. */
export async function addGalleryImage({ folderId, imageUrl, cloudinaryPublicId, caption }) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from(GALLERY_TABLES.images)
    .insert({
      folder_id: folderId,
      image_url: imageUrl,
      cloudinary_public_id: cloudinaryPublicId || null,
      caption: caption || null,
      uploaded_by: userData?.user?.id || null,
    })
    .select("*")
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

/* ── Media type helpers ────────────────────────────────────────
   gallery_images has no media_type column — this runs entirely in
   the frontend. Cloudinary video URLs live under /video/upload/. */
export function isVideoMediaUrl(url) {
  return /\/video\/upload\//i.test(String(url || ""));
}

export function isVideoMediaRow(row) {
  if (!row) return false;
  if (isVideoMediaUrl(row.image_url)) return true;
  /* Tolerant legacy only — never present in the current schema. */
  if (row.media_type === "video") return true;
  return false;
}

export async function addGalleryImagesBulk(rows) {
  const { data, error } = await supabase.from(GALLERY_TABLES.images).insert(rows).select("*");
  if (error) return { data: [], error };
  return { data: data || [], error: null };
}

export async function deleteGalleryImage(id) {
  const { error } = await supabase
    .from(GALLERY_TABLES.images)
    .delete()
    .eq("id", id);
  return { error };
}

/* ── Date helpers ─────────────────────────────────────────────── */
export function formatEventDate(iso) {
  if (!iso) return "";
  try {
    const d = typeof iso === "string" ? new Date(`${iso}T00:00:00`) : new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const day = d.getDate();
    const suffix = day % 10 === 1 && day !== 11 ? "ST" : day % 10 === 2 && day !== 12 ? "ND" : day % 10 === 3 && day !== 13 ? "RD" : "TH";
    return `${day}${suffix} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return "";
  }
}

export function formatEventDateShort(iso) {
  if (!iso) return "";
  try {
    const d = typeof iso === "string" ? new Date(`${iso}T00:00:00`) : new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return "";
  }
}