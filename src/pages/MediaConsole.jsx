import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../gallery.css";
import { useAuth } from "../context/AuthContext";
import {
  fetchGalleryFolders,
  fetchGalleryImages,
  fetchGalleryFolder,
  createGalleryFolder,
  updateGalleryFolder,
  addGalleryImage,
  deleteGalleryImage,
  GALLERY_STATE,
  buildGallerySrc,
  formatEventDateShort,
  isVideoMediaRow,
} from "../lib/gallery";
import {
  isConfigured,
  validateGalleryMedia,
  uploadGalleryMedia,
  humanizeMediaUploadError,
  MEDIA_ACCEPT,
  MEDIA_TYPE,
} from "../lib/mediaConsole";

/* ════════════════════════════════════════════════════════════════════
   FHC // MEDIA CONSOLE — public-site gallery tool for `media` users.
   Route: /media (guarded by RequireMedia). Admins also pass the guard,
   but their real workflow stays in /admin/gallery.
   Ability model (mirrors RLS):
     - CREATE albums
     - manage ONLY albums the user created (created_by = auth.uid())
     - upload photos + videos into those albums
     - delete ONLY uploads they made (uploaded_by = auth.uid())
   The uploaded content is immediately public via /gallery + /gallery/:id.
   ════════════════════════════════════════════════════════════════════ */

const UPLOAD_FOLDER = "fhc/gallery";
const MAX_QUEUE = 60;

function LoadingBlock({ title, sub }) {
  return (
    <section className="gf-state" aria-live="polite" aria-busy="true" role="status">
      <span className="gf-state-spin" aria-hidden="true" />
      <p className="gf-state-title">{title}</p>
      <p className="gf-state-sub">{sub}</p>
    </section>
  );
}

function ErrorBlock({ title, sub, retry }) {
  return (
    <section className="gf-state gf-state-err" role="alert">
      <p className="gf-state-title">{title}</p>
      <p className="gf-state-sub">{sub}</p>
      <button type="button" className="mc-btn mc-btn--ghost" onClick={retry}>
        ↻ RETRY
      </button>
    </section>
  );
}

function EmptyBlock({ children }) {
  return (
    <section className="gf-empty">
      <span className="gf-empty-icon" aria-hidden="true">◫</span>
      {children}
    </section>
  );
}

function AlbumCard({ folder, onOpen }) {
  const cover = folder.cover_image_url
    ? buildGallerySrc(folder.cover_image_url, { width: 480 })
    : null;
  return (
    <article className="mc-album">
      <div className="mc-album-cover">
        {cover ? (
          <img src={cover} alt={`${folder.title} cover`} loading="lazy" decoding="async" />
        ) : (
          <span className="mc-album-ph" aria-hidden="true">◫</span>
        )}
        <span className="mc-album-count">
          {folder.image_count} MEDIA
        </span>
      </div>
      <div className="mc-album-body">
        <h3 className="mc-album-title">{folder.title}</h3>
        {folder.event_date && (
          <p className="mc-album-date">{formatEventDateShort(folder.event_date)}</p>
        )}
      </div>
      <div className="mc-album-actions">
        <button
          type="button"
          className="mc-btn mc-btn--cyan mc-grow"
          onClick={() => onOpen(folder.id)}
        >
          MANAGE ▸
        </button>
        <Link to={`/gallery/${folder.id}`} className="mc-btn mc-btn--ghost" target="_blank" rel="noopener noreferrer">
          VIEW
        </Link>
      </div>
    </article>
  );
}

function MediaTile({ item, isCover, canDelete, onDelete }) {
  const [busy, setBusy] = useState(false);
  const video = isVideoMediaRow(item);
  const doDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete(item);
    } finally {
      setBusy(false);
    }
  };

  return (
    <figure className="mc-tile">
      <div className="mc-tile-media">
        {video ? (
          <video
            src={item.image_url}
            controls
            preload="metadata"
            playsInline
          />
        ) : (
          <img
            src={buildGallerySrc(item.image_url, { width: 480 })}
            alt={item.caption || "Gallery media"}
            loading="lazy"
            decoding="async"
          />
        )}
        {isCover && <span className="mc-tile-cov" aria-hidden="true">COVER</span>}
        {video && <span className="mc-tile-type" aria-hidden="true">VIDEO</span>}
      </div>
      {canDelete && (
        <div className="mc-tile-actions">
          <button type="button" className="mc-btn mc-btn--danger mc-sm" onClick={doDelete} disabled={busy} aria-label="Delete media">
            ✕ DELETE
          </button>
        </div>
      )}
    </figure>
  );
}

function UploadQueueItem({ item, onRetry }) {
  const size = item.file ? `${(item.file.size / 1024 / 1024).toFixed(1)} MB` : "";
  const cls =
    item.status === "done" ? "is-done" :
    item.status === "failed" ? "is-failed" :
    item.status === "uploading" ? "is-uploading" :
    "is-queued";
  const label =
    item.status === "done" ? "DONE" :
    item.status === "failed" ? "FAILED" :
    item.status === "uploading" ? "UPLOADING..." :
    "QUEUED";
  return (
    <div className={`mc-qitem ${cls}`}>
      <div className="mc-qitem-name">{item.file?.name || "FILE"}</div>
      <div className="mc-qitem-meta">
        <span>{size}</span>
        <span>{item.mediaType === MEDIA_TYPE.VIDEO ? "VIDEO" : "PHOTO"}</span>
      </div>
      <div className="mc-qitem-right">
        <span className="mc-qstatus">{label}</span>
        {item.status === "failed" && (
          <button type="button" className="mc-btn mc-btn--ghost mc-sm" onClick={() => onRetry(item.id)}>
            RETRY
          </button>
        )}
      </div>
      {item.error && <div className="mc-qitem-error" role="alert">{item.error}</div>}
    </div>
  );
}

export default function MediaConsole() {
  const { user, isAdmin } = useAuth();
  const uid = user?.id || null;

  const [listState, setListState] = useState(GALLERY_STATE.LOADING);
  const [folders, setFolders] = useState([]);
  const [listError, setListError] = useState(null);

  const [activeId, setActiveId] = useState(null);
  const [folder, setFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [detailState, setDetailState] = useState(GALLERY_STATE.LOADING);
  const [detailError, setDetailError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", description: "", event_date: "" });
  const [createErr, setCreateErr] = useState("");
  const [creating, setCreating] = useState(false);

  const [editForm, setEditForm] = useState({ title: "", description: "", event_date: "" });
  const [editErr, setEditErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);

  const cloudReady = isConfigured();

  /* My albums = albums I created (RLS only lets MEDIA edit own folders). */
  const myFolders = useMemo(
    () => folders.filter((f) => !uid || f.created_by === uid),
    [folders, uid]
  );

  const loadFolders = useCallback(async () => {
    setListState(GALLERY_STATE.LOADING);
    setListError(null);
    try {
      const rows = await fetchGalleryFolders();
      setFolders(rows);
      setListState(GALLERY_STATE.SUCCESS);
    } catch (err) {
      console.error("[FHC MediaConsole] folder load failed:", err);
      setFolders([]);
      setListError(err);
      setListState(GALLERY_STATE.ERROR);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  /* ── create album ─────────────────────────────────────────────── */
  const submitCreate = async () => {
    const title = String(createForm.title || "").trim();
    if (!title) {
      setCreateErr("ALBUM TITLE IS REQUIRED");
      return;
    }
    setCreating(true);
    setCreateErr("");
    try {
      const { data, error } = await createGalleryFolder(createForm);
      if (error) {
        console.error("[FHC MediaConsole] album create insert:", error);
        setCreateErr(createDbErrorMessage(error));
        setCreating(false);
        return;
      }
      setCreateForm({ title: "", description: "", event_date: "" });
      setCreateOpen(false);
      await loadFolders();
      if (data?.id) await openAlbum(data.id);
    } catch (err) {
      console.error("[FHC MediaConsole] album create failed:", err);
      setCreateErr("ALBUM CREATE FAILED — CHECK CONNECTION AND RETRY");
      setCreating(false);
    }
  };

  /* ── open / reload an album ───────────────────────────────────── */
  const openAlbum = useCallback(async (id) => {
    setActiveId(id);
    setDetailState(GALLERY_STATE.LOADING);
    setDetailError(null);
    setUploadQueue([]);
    setUploadErr("");
    setEditOpen(false);
    try {
      const [folderRow, imageRows] = await Promise.all([
        fetchGalleryFolder(id),
        fetchGalleryImages(id),
      ]);
      if (!folderRow) {
        setDetailError({ message: "ALBUM NOT FOUND" });
        setDetailState(GALLERY_STATE.ERROR);
        return;
      }
      setFolder(folderRow);
      setImages(imageRows);
      setDetailState(GALLERY_STATE.SUCCESS);
    } catch (err) {
      console.error("[FHC MediaConsole] album load failed:", err);
      setDetailError(err);
      setDetailState(GALLERY_STATE.ERROR);
    }
  }, []);

  const backToList = () => {
    setActiveId(null);
    setFolder(null);
    setImages([]);
    setUploadQueue([]);
    setUploadErr("");
    setEditOpen(false);
  };

  /* ── edit album metadata (own albums only) ────────────────────── */
  const openEdit = () => {
    if (!folder) return;
    setEditForm({
      title: folder.title || "",
      description: folder.description || "",
      event_date: folder.event_date || "",
    });
    setEditErr("");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const title = String(editForm.title || "").trim();
    if (!title || !folder) {
      setEditErr("ALBUM TITLE IS REQUIRED");
      return;
    }
    setEditing(true);
    setEditErr("");
    try {
      const { data, error } = await updateGalleryFolder(folder.id, editForm);
      if (error) {
        console.error("[FHC MediaConsole] album update:", error);
        setEditErr(createDbErrorMessage(error));
        setEditing(false);
        return;
      }
      setFolder(data);
      setEditOpen(false);
      loadFolders();
    } catch (err) {
      console.error("[FHC MediaConsole] album update failed:", err);
      setEditErr("ALBUM SAVE FAILED — CHECK CONNECTION AND RETRY");
      setEditing(false);
    }
  };

  /* ── upload queue (photos + videos) ───────────────────────────── */
  const canOpenPicker = () => {
    if (!folder) return false;
    if (!cloudReady) return false;
    if (uploadQueue.length >= MAX_QUEUE) return false;
    return true;
  };

  const pickFiles = (e) => {
    queueFiles(e.target.files);
    e.target.value = "";
  };

  const queueFiles = (files) => {
    const list = Array.from(files || []).slice(0, MAX_QUEUE);
    if (!list.length) return;
    const next = [];
    let firstErr = "";

    for (const file of list) {
      const check = validateGalleryMedia(file);
      if (!check.ok) {
        const reason = check.reason;
        const text =
          reason === "INVALID_TYPE"
            ? `INVALID FILE TYPE — ${file.name} (USE JPG / PNG / WEBP / GIF / MP4 / WEBM / MOV)`
            : reason === "IMAGE_TOO_LARGE"
              ? `PHOTO TOO LARGE — ${file.name} (MAX 20 MB)`
              : reason === "VIDEO_TOO_LARGE"
                ? `VIDEO TOO LARGE — ${file.name} (MAX 200 MB)`
                : reason === "EMPTY_FILE"
                  ? `EMPTY FILE — ${file.name}`
                  : `UNACCEPTABLE FILE — ${file.name}`;
        firstErr = firstErr || text;
        continue;
      }
      next.push({
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: "queued",
        mediaType: check.mediaType,
      });
    }

    setUploadQueue((q) => [...q, ...next]);
    setUploadErr((prev) => prev || firstErr);
    if (firstErr) console.warn("[FHC MediaConsole] rejected files:", firstErr);
  };

  const startUpload = async () => {
    if (!folder) return;
    if (uploading) return;
    const pending = uploadQueue.filter((i) => i.status === "queued");
    if (!pending.length) return;

    setUploading(true);
    setUploadErr("");
    setUploadQueue((q) =>
      q.map((i) => (i.status === "queued" ? { ...i, status: "uploading" } : i))
    );

    let inserted = 0;
    let failed = 0;
    const preCount = images.length;

    for (const item of pending) {
      try {
        const result = await uploadGalleryMedia(item.file, folder.id);
        const { data: row, error: dbErr } = await addGalleryImage({
          folderId: folder.id,
          imageUrl: result.secure_url,
          cloudinaryPublicId: result.public_id,
        });
        if (dbErr) {
          console.error(
            "[FHC MediaConsole] gallery_images insert failed; Cloudinary asset left in place for debugging:",
            { public_id: result.public_id, media_type: result.media_type },
            dbErr
          );
          const insertErr = new Error(createDbErrorMessage(dbErr));
          insertErr.code = "SUPABASE_INSERT";
          throw insertErr;
        }
        inserted += 1;
        setUploadQueue((q) =>
          q.map((qi) => (qi.id === item.id ? { ...qi, status: "done", row_id: row?.id } : qi))
        );
      } catch (err) {
        failed += 1;
        console.error(`[FHC MediaConsole] upload failed (${item.file.name}):`, err);
        const message =
          err?.code === "INVALID_GALLERY_MEDIA"
            ? String(err.message || "INVALID MEDIA").toUpperCase()
            : humanizeMediaUploadError(err);
        setUploadQueue((q) =>
          q.map((qi) =>
            qi.id === item.id ? { ...qi, status: "failed", error: message } : qi
          )
        );
      }
    }

    if (inserted > 0) {
      await openAlbum(folder.id);
      const freshness = await fetchGalleryImages(folder.id);
      const firstImage = freshness.find((r) => !isVideoMediaRow(r));
      if (!folder.cover_image_url && preCount === 0 && firstImage) {
        const { error: covErr } = await updateGalleryFolder(folder.id, {
          cover_image_url: firstImage.image_url,
        });
        if (covErr) console.warn("[FHC MediaConsole] auto-cover failed:", covErr.message);
      }
    }

    if (failed > 0) {
      setUploadErr(
        `${failed} FILE${failed === 1 ? "" : "S"} FAILED CLOUDINARY UPLOAD — RETRY FAILED ITEMS`
      );
    }
    setUploading(false);
  };

  const retryItem = (id) => {
    setUploadQueue((q) =>
      q.map((i) => (i.id === id ? { ...i, status: "queued", error: undefined } : i))
    );
    setUploadErr("");
  };

  const retryAll = () => {
    setUploadQueue((q) =>
      q.map((i) => (i.status === "failed" ? { ...i, status: "queued", error: undefined } : i))
    );
    setUploadErr("");
  };

  const clearQueue = () => {
    if (uploading) return;
    setUploadQueue([]);
    setUploadErr("");
  };

  /* ── delete media (own uploads / admin) ───────────────────────── */
  const deleteMedia = async (item) => {
    if (!item?.id) return;
    const canDelete = isAdmin || item.uploaded_by === uid;
    if (!canDelete) return;
    try {
      const { error } = await deleteGalleryImage(item.id);
      if (error) {
        console.error("[FHC MediaConsole] media delete:", error);
        setUploadErr(createDbErrorMessage(error));
        return;
      }
      if (item.cloudinary_public_id) {
        console.warn(
          `[FHC MediaConsole] DELETE: DB row removed; Cloudinary asset '${item.cloudinary_public_id}' left in place (browser-side destroy disabled — signed server-side cleanup is out of scope).`
        );
      }
      await openAlbum(folder.id);
    } catch (err) {
      console.error("[FHC MediaConsole] media delete failed:", err);
      setUploadErr("DELETE FAILED — CHECK CONNECTION AND RETRY");
    }
  };

  /* ── derived ──────────────────────────────────────────────────── */
  const folderReady = detailState === GALLERY_STATE.SUCCESS && folder;
  const canManage = Boolean(folder) && (isAdmin || folder?.created_by === uid);
  const pendingCount = uploadQueue.filter((i) => i.status === "queued").length;
  const failedCount = uploadQueue.filter((i) => i.status === "failed").length;

  if (detailState === GALLERY_STATE.LOADING && activeId) {
    return (
      <div className="gf-root mc-root">
        <LoadingBlock title="LOADING ALBUM..." sub="FETCHING EVENT MEDIA" />
      </div>
    );
  }

  return (
    <div className="gf-root mc-root">
      <header className="gf-header mc-header">
        <div className="gf-header-inner">
          <p className="gf-kicker">
            <span className="gf-kicker-fhc">FHC</span>
            <span className="gf-kicker-sep">//</span>
            <span className="gf-kicker-path">MEDIA CONSOLE</span>
          </p>
          <h1 className="gf-title">
            <span className="gf-title-accent">MEDIA CONSOLE</span>
          </h1>
          <p className="gf-sub">GALLERY UPLOAD TERMINAL — ALBUMS + PHOTOS + VIDEOS</p>
        </div>
      </header>

      {!cloudReady && (
        <div className="mc-banner mc-banner--warn" role="alert">
          CLOUDINARY NOT CONFIGURED — ADD VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET TO .env.local
        </div>
      )}

      {activeId && folderReady ? (
        /* ════════════════ SINGLE ALBUM MANAGE VIEW ════════════════ */
        <>
          <div className="mc-toolbar">
            <button type="button" className="mc-btn mc-btn--ghost" onClick={backToList}>
              ← ALL ALBUMS
            </button>
            <div className="mc-toolbar-spacer" />
            <div className="mc-toolbar-badges">
              <span className="mc-badge">{images.length} MEDIA</span>
              {folder.event_date && (
                <span className="mc-badge mc-badge--dim">{formatEventDateShort(folder.event_date)}</span>
              )}
            </div>
          </div>

          <section className="mc-panel">
            <div className="mc-panel-head">
              <span className="mc-panel-tag">▌ALBUM</span>
              <span className="mc-panel-sub">METADATA + SETTINGS</span>
            </div>
            <div className="mc-panel-body">
              <div className="mc-album-meta-row">
                <div>
                  <h2 className="mc-album-bigtitle">{folder.title}</h2>
                  {folder.description && <p className="mc-album-desc">{folder.description}</p>}
                </div>
                <div className="mc-album-meta-actions">
                  {canManage && (
                    <button type="button" className="mc-btn mc-btn--pink mc-sm" onClick={openEdit}>
                      [ EDIT ALBUM ]
                    </button>
                  )}
                  <Link to={`/gallery/${folder.id}`} className="mc-btn mc-btn--ghost mc-sm" target="_blank" rel="noopener noreferrer">
                    VIEW PUBLIC ▸
                  </Link>
                </div>
              </div>
            </div>

            {editOpen && (
              <div className="mc-panel-body mc-edit">
                {editErr && <div className="mc-banner mc-banner--error" role="alert">{editErr}</div>}
                <div className="mc-field">
                  <label className="mc-label" htmlFor="mc-edit-title">ALBUM TITLE</label>
                  <input
                    id="mc-edit-title"
                    className="mc-input"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="EVENT / PROGRAMME NAME"
                  />
                </div>
                <div className="mc-field">
                  <label className="mc-label" htmlFor="mc-edit-date">EVENT DATE</label>
                  <input
                    id="mc-edit-date"
                    type="date"
                    className="mc-input mc-input--date"
                    value={editForm.event_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, event_date: e.target.value }))}
                  />
                </div>
                <div className="mc-field">
                  <label className="mc-label" htmlFor="mc-edit-desc">DESCRIPTION</label>
                  <textarea
                    id="mc-edit-desc"
                    className="mc-textarea"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="SHORT SUMMARY OF THE EVENT / PROGRAMME"
                  />
                </div>
                <div className="mc-row">
                  <button type="button" className="mc-btn mc-btn--cyan" onClick={saveEdit} disabled={editing || !String(editForm.title || "").trim()}>
                    {editing ? "SAVING..." : "SAVE CHANGES"}
                  </button>
                  <button type="button" className="mc-btn mc-btn--ghost" onClick={() => setEditOpen(false)} disabled={editing}>
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </section>

          {canManage && (
            <section className="mc-panel">
              <div className="mc-panel-head">
                <span className="mc-panel-tag">▌UPLOAD</span>
                <span className="mc-panel-sub">PHOTOS [JPG/PNG/WEBP/GIF ≤20MB] + VIDEOS [MP4/WEBM/MOV ≤200MB]</span>
              </div>
              <div className="mc-panel-body">
                <div
                  className="mc-dropzone"
                  role="button"
                  tabIndex={0}
                  aria-disabled={!canOpenPicker()}
                  onClick={() => canOpenPicker() && fileRef.current?.click()}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && canOpenPicker()) {
                      e.preventDefault();
                      fileRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (canOpenPicker()) queueFiles(e.dataTransfer.files);
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept={MEDIA_ACCEPT}
                    multiple
                    hidden
                    onChange={pickFiles}
                  />
                  <div className="mc-dropzone-main">+ DROP MEDIA HERE OR CLICK TO UPLOAD</div>
                  <div className="mc-dropzone-sub">
                    {uploadQueue.length >= MAX_QUEUE ? "UPLOAD QUEUE FULL" : "PHOTOS + VIDEOS — MULTI-SELECT OK"}
                  </div>
                </div>

                {uploadErr && (
                  <div className="mc-banner mc-banner--error" role="alert" style={{ marginTop: 10 }}>
                    {uploadErr}
                  </div>
                )}

                {uploadQueue.length > 0 && (
                  <div className="mc-queue" style={{ marginTop: 10 }}>
                    {uploadQueue.map((item) => (
                      <UploadQueueItem key={item.id} item={item} onRetry={retryItem} />
                    ))}
                  </div>
                )}

                {uploadQueue.length > 0 && (
                  <div className="mc-row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="mc-btn mc-btn--cyan"
                      onClick={startUpload}
                      disabled={uploading || !pendingCount}
                    >
                      {uploading
                        ? "UPLOADING..."
                        : `UPLOAD ${pendingCount} FILE${pendingCount === 1 ? "" : "S"} ▸`}
                    </button>
                    {failedCount > 0 && !uploading && (
                      <button type="button" className="mc-btn mc-btn--ghost" onClick={retryAll}>
                        RETRY FAILED
                      </button>
                    )}
                    <button type="button" className="mc-btn mc-btn--ghost" onClick={clearQueue} disabled={uploading}>
                      CLEAR QUEUE
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="mc-panel">
            <div className="mc-panel-head">
              <span className="mc-panel-tag">▌{folder.title}</span>
              <span className="mc-panel-sub">{images.length} MEDIA IN ALBUM</span>
            </div>
            <div className="mc-panel-body">
              {images.length === 0 ? (
                <EmptyBlock>
                  <p className="gf-empty-title">NO MEDIA YET</p>
                  <p className="gf-empty-sub">UPLOAD PHOTOS / VIDEOS TO POPULATE THIS ALBUM.</p>
                </EmptyBlock>
              ) : (
                <div className="mc-grid">
                  {images.map((img) => (
                    <MediaTile
                      key={img.id}
                      item={img}
                      isCover={folder.cover_image_url === img.image_url}
                      canDelete={isAdmin || img.uploaded_by === uid}
                      onDelete={deleteMedia}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        /* ════════════════ ALBUM LIST VIEW ════════════════ */
        <>
          <section className="mc-panel">
            <div className="mc-panel-head">
              <span className="mc-panel-tag">▌CREATE</span>
              <span className="mc-panel-sub">NEW GALLERY ALBUM</span>
            </div>
            <div className="mc-panel-body">
              {!createOpen ? (
                <button type="button" className="mc-btn mc-btn--pink mc-create" onClick={() => setCreateOpen(true)}>
                  + CREATE ALBUM
                </button>
              ) : (
                <div className="mc-create-form">
                  {createErr && <div className="mc-banner mc-banner--error" role="alert">{createErr}</div>}
                  <div className="mc-field">
                    <label className="mc-label" htmlFor="mc-title">ALBUM TITLE</label>
                    <input
                      id="mc-title"
                      className="mc-input"
                      value={createForm.title}
                      onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="E.G. INNOVATION SUMMIT 2026"
                      autoFocus
                    />
                  </div>
                  <div className="mc-field">
                    <label className="mc-label" htmlFor="mc-date">EVENT DATE</label>
                    <input
                      id="mc-date"
                      type="date"
                      className="mc-input mc-input--date"
                      value={createForm.event_date}
                      onChange={(e) => setCreateForm((f) => ({ ...f, event_date: e.target.value }))}
                    />
                  </div>
                  <div className="mc-field">
                    <label className="mc-label" htmlFor="mc-desc">DESCRIPTION</label>
                    <textarea
                      id="mc-desc"
                      className="mc-textarea"
                      rows={3}
                      value={createForm.description}
                      onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="SHORT SUMMARY OF THE EVENT / PROGRAMME"
                    />
                  </div>
                  <div className="mc-row">
                    <button
                      type="button"
                      className="mc-btn mc-btn--cyan"
                      onClick={submitCreate}
                      disabled={creating || !String(createForm.title || "").trim()}
                    >
                      {creating ? "CREATING..." : "CREATE ALBUM"}
                    </button>
                    <button type="button" className="mc-btn mc-btn--ghost" onClick={() => { setCreateOpen(false); setCreateErr(""); }} disabled={creating}>
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="mc-panel">
            <div className="mc-panel-head">
              <span className="mc-panel-tag">▌MY ALBUMS</span>
              <span className="mc-panel-sub">{myFolders.length} ALBUM{myFolders.length === 1 ? "" : "S"} YOU MANAGE</span>
            </div>
            <div className="mc-panel-body">
              {listState === GALLERY_STATE.ERROR ? (
                <ErrorBlock title="GALLERY UNAVAILABLE" sub="UNABLE TO LOAD ALBUM DATA." retry={loadFolders} />
              ) : listState === GALLERY_STATE.LOADING ? (
                <LoadingBlock title="LOADING YOUR ALBUMS..." sub="FETCHING MEDIA ARCHIVE" />
              ) : myFolders.length === 0 ? (
                <EmptyBlock>
                  <p className="gf-empty-title">NO ALBUMS YET</p>
                  <p className="gf-empty-sub">CREATE AN ALBUM ABOVE, THEN OPEN IT TO UPLOAD PHOTOS AND VIDEOS.</p>
                </EmptyBlock>
              ) : (
                <div className="mc-albums">
                  {myFolders.map((f) => (
                    <AlbumCard key={f.id} folder={f} onOpen={openAlbum} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {(!canManage && activeId && folderReady) && (
        <div className="mc-banner mc-banner--warn" role="alert">
          YOU CAN VIEW THIS ALBUM BUT ONLY ITS OWNER CAN MODIFY IT.
        </div>
      )}
    </div>
  );
}

/* Friendly DB error text — never surfaces raw PostgREST strings. */
function createDbErrorMessage(error) {
  const msg = String(error?.message || "").toLowerCase();
  if (msg.includes("permission") || msg.includes("policy") || msg.includes("row-level") || msg.includes("42501")) {
    return "ACCESS BLOCKED — RLS PERMISSION POLICY";
  }
  if (msg.includes("fhc_invalid_role") || msg.includes("invalid role")) {
    return "INVALID ROLE RECORD";
  }
  if (msg.includes("network") || msg.includes("fetch failed") || msg.includes("connection")) {
    return "NETWORK FAILURE — CHECK CONNECTION AND RETRY";
  }
  if (msg.includes("foreign key") || msg.includes("fk ")) {
    return "ALBUM RECORD NOT FOUND — REFRESH AND RETRY";
  }
  return "DATABASE REJECTED THE REQUEST — CONTACT ADMIN";
}