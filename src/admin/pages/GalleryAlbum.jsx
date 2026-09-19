import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toastError, toastSuccess } from "../lib/toast";
import { humanizeAdminError } from "../lib/adminDb";
import { fmtDateTime } from "../lib/format";
import {
  fetchGalleryFolder,
  fetchGalleryImages,
  updateGalleryFolder,
  deleteGalleryFolder,
  deleteGalleryImage,
  addGalleryImage,
  GALLERY_STATE,
  buildGallerySrc,
  formatEventDate,
} from "../../lib/gallery";
import { useAuth } from "../../context/AuthContext";
import { isConfigured, uploadGalleryImage, destroyCloudinaryAsset, humanizeUploadError } from "../lib/upload";
import {
  Btn,
  ConfirmModal,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  PageHeader,
  Panel,
  Textarea,
} from "../components/ui";

const UPLOAD_FOLDER = "fhc/gallery";
const ACCEPT_TYPES = "image/jpeg,image/png,image/webp,image/gif";

function ImageTile({ image, onDelete, onSetCover, isCover, canDelete }) {
  const src = buildGallerySrc(image.image_url, { width: 480 });
  return (
    <figure className="ad-gallery-card">
      <div className="ad-gallery-img">
        <img src={src} alt={image.caption || "Gallery photo"} loading="lazy" />
        {isCover && <span className="ad-gallery-cov" aria-hidden="true">COVER</span>}
      </div>
      <figcaption>
        <div className="ad-track" style={{ fontSize: 9, color: "var(--ad-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          UPLOADED {fmtDateTime(image.created_at)}
        </div>
        {image.cloudinary_public_id && (
          <div className="ad-track" style={{ fontSize: 8, color: "var(--ad-muted)", opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {image.cloudinary_public_id}
          </div>
        )}
      </figcaption>
      <div className="ad-row" style={{ padding: 8, gap: 6 }}>
        {!isCover && (
          <Btn sm variant="ghost" onClick={() => onSetCover(image)} className="ad-grow">
            SET COVER
          </Btn>
        )}
        {canDelete && (
          <Btn sm variant="danger" onClick={() => onDelete(image)} aria-label="Delete photo">
            ✕
          </Btn>
        )}
      </div>
    </figure>
  );
}

function UploadQueueItem({ item, onRetry }) {
  const size = item.file ? `${(item.file.size / 1024 / 1024).toFixed(1)} MB` : "";
  const statusCls =
    item.status === "done" ? "ad-upload-status--done" :
    item.status === "failed" ? "ad-upload-status--failed" :
    item.status === "uploading" ? "ad-upload-status--uploading" :
    "ad-upload-status--queued";
  const statusLabel =
    item.status === "done" ? "DONE" :
    item.status === "failed" ? "FAILED" :
    item.status === "uploading" ? "UPLOADING..." :
    "QUEUED";
  return (
    <div className="ad-upload-item">
      <div className="ad-upload-item-info">
        <span className="ad-upload-item-name">{item.file?.name || "FILE"}</span>
        <span className="ad-upload-item-size">{size}</span>
      </div>
      <div className="ad-upload-item-right">
        <span className={`ad-upload-status ${statusCls}`}>{statusLabel}</span>
        {item.status === "failed" && (
          <Btn sm variant="ghost" onClick={() => onRetry(item.id)}>RETRY</Btn>
        )}
      </div>
      {item.error && <div className="ad-upload-item-error">{item.error}</div>}
    </div>
  );
}

export default function AdminGalleryAlbum() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, canManageGallery } = useAuth();
  const currentUserId = user?.id || null;

  const [state, setState] = useState(GALLERY_STATE.LOADING);
  const [folder, setFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", event_date: "" });
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [delImage, setDelImage] = useState(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const [delFolder, setDelFolder] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState(false);

  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);

  const cloudReady = isConfigured();

  const load = useCallback(async () => {
    setState(GALLERY_STATE.LOADING);
    setError(null);
    try {
      const [folderRow, imageRows] = await Promise.all([
        fetchGalleryFolder(folderId),
        fetchGalleryImages(folderId),
      ]);
      if (!folderRow) {
        setError({ message: "ALBUM NOT FOUND" });
        setState(GALLERY_STATE.ERROR);
        return;
      }
      setFolder(folderRow);
      setImages(imageRows);
      setState(GALLERY_STATE.SUCCESS);
    } catch (err) {
      console.error("[FHC Admin] album load failed:", err);
      setError(err);
      setState(GALLERY_STATE.ERROR);
    }
  }, [folderId]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = () => {
    if (!folder) return;
    setForm({ title: folder.title, description: folder.description || "", event_date: folder.event_date || "" });
    setFormErr("");
    setSaving(false);
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditOpen(false);
    setFormErr("");
  };

  const saveEdit = async () => {
    const title = String(form.title || "").trim();
    if (!title || !folder) {
      setFormErr("ALBUM TITLE IS REQUIRED");
      return;
    }
    setSaving(true);
    setFormErr("");
    try {
      const { data, error: err } = await updateGalleryFolder(folder.id, form);
      if (err) {
        setFormErr(String(err.message || "UPDATE FAILED").toUpperCase());
        setSaving(false);
        return;
      }
      setFolder(data);
      toastSuccess("ALBUM UPDATED");
      setEditOpen(false);
    } catch (e) {
      setFormErr(humanizeAdminError(e, "UPDATE FAILED"));
      setSaving(false);
    }
  };

  const queueFiles = (files) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploadQueue((q) => [
      ...q,
      ...list.map((f) => ({
        file: f,
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: "queued",
      })),
    ]);
    setUploadErr("");
  };

  const pickFiles = (e) => {
    queueFiles(e.target.files);
    e.target.value = "";
  };

  const startUpload = async () => {
    if (!folder || uploading) return;
    const pending = uploadQueue.filter((item) => item.status === "queued");
    if (!pending.length) return;

    setUploading(true);
    setUploadErr("");
    setUploadQueue((q) =>
      q.map((item) => (item.status === "queued" ? { ...item, status: "uploading" } : item))
    );

    let inserted = 0;
    let failed = 0;
    const preUploadImageCount = images.length;

    for (const item of pending) {
      try {
        const { secure_url, public_id } = await uploadGalleryImage(
          item.file,
          `${UPLOAD_FOLDER}/${folder.id}`
        );
        const { error: dbErr } = await addGalleryImage({
          folderId: folder.id,
          imageUrl: secure_url,
          cloudinaryPublicId: public_id,
        });
        if (dbErr) {
          destroyCloudinaryAsset(public_id).catch(() => {});
          throw new Error(dbErr.message);
        }
        inserted += 1;
        setUploadQueue((q) =>
          q.map((qi) => (qi.id === item.id ? { ...qi, status: "done", public_id } : qi))
        );
      } catch (err) {
        failed += 1;
        console.error(`[FHC Admin] upload failed (${item.file.name}):`, err);
        setUploadQueue((q) =>
          q.map((qi) =>
            qi.id === item.id
              ? { ...qi, status: "failed", error: humanizeUploadError(err) }
              : qi
          )
        );
      }
    }

    if (inserted > 0) {
      toastSuccess(`${inserted} PHOTO${inserted === 1 ? "" : "S"} UPLOADED`);
      await load();
      if (!folder.cover_image_url && preUploadImageCount === 0) {
        const fresh = await fetchGalleryImages(folder.id);
        const first = fresh[0];
        if (first) {
          const { error: covErr } = await updateGalleryFolder(folder.id, {
            cover_image_url: first.image_url,
          });
          if (covErr) console.warn("[FHC Admin] auto-cover failed:", covErr.message);
          await load();
        }
      }
    }

    if (failed > 0) {
      setUploadErr(`${failed} FILE${failed === 1 ? "" : "S"} FAILED CLOUDINARY UPLOAD`);
    }

    setUploading(false);
  };

  const retryItem = (itemId) => {
    setUploadQueue((q) =>
      q.map((item) =>
        item.id === itemId ? { ...item, status: "queued", error: undefined } : item
      )
    );
    setUploadErr("");
  };

  const retryAll = () => {
    setUploadQueue((q) =>
      q.map((item) =>
        item.status === "failed" ? { ...item, status: "queued", error: undefined } : item
      )
    );
    setUploadErr("");
  };

  const clearQueue = () => {
    if (uploading) return;
    setUploadQueue([]);
    setUploadErr("");
  };

  const setCover = async (image) => {
    if (!folder) return;
    const { data, error: err } = await updateGalleryFolder(folder.id, {
      cover_image_url: image.image_url,
    });
    if (err) {
      toastError(String(err.message || "COVER UPDATE FAILED").toUpperCase());
      return;
    }
    setFolder(data);
    toastSuccess("COVER UPDATED");
  };

  const confirmDeleteImage = async () => {
    if (!delImage) return;
    setDeletingImage(true);
    try {
      const { error: dbErr } = await deleteGalleryImage(delImage.id);
      if (dbErr) {
        toastError(String(dbErr.message || "DELETE FAILED").toUpperCase());
        return;
      }
      toastSuccess("PHOTO DELETED");
      if (delImage.cloudinary_public_id) {
        const res = await destroyCloudinaryAsset(delImage.cloudinary_public_id);
        if (!res.ok) {
          console.warn(`[FHC Admin] cloudinary cleanup skipped for ${delImage.cloudinary_public_id}: ${res.reason}`);
        }
      }
      setDelImage(null);
      await load();
    } catch (e) {
      toastError(humanizeAdminError(e, "DELETE FAILED"));
    } finally {
      setDeletingImage(false);
    }
  };

  const confirmDeleteFolder = async () => {
    if (!folder) return;
    setDeletingFolder(true);
    try {
      const publicIds = images.map((img) => img.cloudinary_public_id).filter(Boolean);
      await Promise.all(publicIds.map((pid) => destroyCloudinaryAsset(pid).catch(() => {})));
      const { error: err } = await deleteGalleryFolder(folder.id);
      if (err) {
        toastError(String(err.message || "DELETE FAILED").toUpperCase());
        return;
      }
      toastSuccess(`${folder.title.toUpperCase()} DELETED`);
      navigate("/admin/gallery", { replace: true });
    } catch (e) {
      toastError(humanizeAdminError(e, "DELETE FAILED"));
    } finally {
      setDeletingFolder(false);
    }
  };

  const pendingCount = uploadQueue.filter((i) => i.status === "queued").length;
  const doneCount = images.length;
  const failedCount = uploadQueue.filter((i) => i.status === "failed").length;

  return (
    <div className="ad-album-page">
      {state === GALLERY_STATE.ERROR ? (
        <Panel>
          <ErrorState
            title="ALBUM UNAVAILABLE"
            sub={error?.message === "ALBUM NOT FOUND" ? "THIS ALBUM DOES NOT EXIST." : "UNABLE TO LOAD ALBUM DATA."}
            onRetry={load}
          />
          <div className="ad-row" style={{ marginTop: 12 }}>
            <Btn variant="cyan" as={Link} to="/admin/gallery">← BACK TO GALLERY</Btn>
          </div>
        </Panel>
      ) : state === GALLERY_STATE.LOADING ? (
        <Panel>
          <LoadingState label="LOADING ALBUM" />
        </Panel>
      ) : (
        <>
          <PageHeader
            kicker="FHC // GALLERY"
            title={folder.title}
            sub={
              folder.description ||
              (folder.event_date ? formatEventDate(folder.event_date) : "") ||
              "EVENT ALBUM"
            }
          >
            <span className="ad-badge ad-badge--cyan">
              {images.length} PHOTO{images.length === 1 ? "" : "S"}
            </span>
            {folder.event_date && (
              <span className="ad-badge ad-badge--muted">{formatEventDate(folder.event_date)}</span>
            )}
          </PageHeader>

          <div className="ad-album-nav">
            <Btn as={Link} to="/admin/gallery">← BACK TO GALLERY</Btn>
            <span className="ad-grow" />
            {isAdmin && (
              <Btn variant="ghost" onClick={openEdit} sm>✎ EDIT ALBUM</Btn>
            )}
            {isAdmin && (
              <Btn variant="danger" onClick={() => setDelFolder(true)} sm>DELETE ALBUM</Btn>
            )}
          </div>

          {/* Upload zone */}
          {canManageGallery && (
            <Panel title="UPLOAD PHOTOS" tag={cloudReady ? "CLOUDINARY" : "NOT CONFIGURED"} accentClass={cloudReady ? "ad-badge--cyan" : "ad-badge--danger"}>
              {!cloudReady && (
                <div className="ad-alert ad-alert--error" role="alert">
                  CLOUDINARY NOT CONFIGURED — ADD VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET TO .env.local
                </div>
              )}
              <div
                className="ad-dropzone"
                role="button"
                tabIndex={0}
                onClick={() => cloudReady && fileRef.current?.click()}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && cloudReady) {
                    e.preventDefault();
                    fileRef.current?.click();
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (cloudReady) queueFiles(e.dataTransfer.files);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT_TYPES}
                  multiple
                  hidden
                  onChange={pickFiles}
                />
                <div className="ad-dropzone-main">+ DROP PHOTOS HERE OR CLICK TO UPLOAD</div>
                <div className="ad-dropzone-sub">JPG · PNG · WEBP · GIF — UP TO 20 MB EACH — MULTI-SELECT OK</div>
              </div>

              {uploadErr && (
                <div className="ad-alert ad-alert--error" role="alert" style={{ marginTop: 10 }}>
                  {uploadErr}
                </div>
              )}

              {uploadQueue.length > 0 && (
                <div className="ad-upload-list" style={{ marginTop: 10 }}>
                  {uploadQueue.map((item) => (
                    <UploadQueueItem key={item.id} item={item} onRetry={retryItem} />
                  ))}
                </div>
              )}

              {uploadQueue.length > 0 && (
                <div className="ad-row" style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}>
                  <Btn variant="cyan" onClick={startUpload} disabled={uploading || !pendingCount}>
                    {uploading ? "UPLOADING..." : `UPLOAD ${pendingCount} PHOTO${pendingCount === 1 ? "" : "S"} ▸`}
                  </Btn>
                  {failedCount > 0 && !uploading && (
                    <Btn variant="ghost" onClick={retryAll}>RETRY FAILED</Btn>
                  )}
                  <Btn variant="ghost" onClick={clearQueue} disabled={uploading}>
                    CLEAR QUEUE
                  </Btn>
                </div>
              )}
            </Panel>
          )}

          {/* Image grid */}
          <Panel flush title="ALBUM PHOTOS" tag={doneCount ? `${doneCount} TOTAL` : "EMPTY"}>
            {images.length === 0 ? (
              <EmptyState
                title="NO IMAGES YET"
                sub={canManageGallery ? "UPLOAD PHOTOS TO POPULATE THIS ALBUM." : "NO PHOTOS HAVE BEEN UPLOADED YET."}
                icon="◫"
              />
            ) : (
              <div className="ad-gallery-grid" style={{ padding: 16 }}>
                {images.map((image) => (
                  <ImageTile
                    key={image.id}
                    image={image}
                    isCover={folder.cover_image_url === image.image_url}
                    canDelete={isAdmin || image.uploaded_by === currentUserId}
                    onSetCover={setCover}
                    onDelete={setDelImage}
                  />
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {/* Delete image confirm */}
      <ConfirmModal
        open={Boolean(delImage)}
        title="DELETE PHOTO"
        prose="DELETE THIS PHOTO FROM THE ALBUM AND REMOVE ITS CLOUDINARY ASSET?"
        confirmLabel="DELETE PHOTO"
        danger
        busy={deletingImage}
        onConfirm={confirmDeleteImage}
        onCancel={() => !deletingImage && setDelImage(null)}
      />

      {/* Delete folder confirm */}
      <ConfirmModal
        open={delFolder}
        title="DELETE ALBUM"
        prose={`DELETE "${String(folder?.title || "").toUpperCase()}" AND ALL ${images.length} PHOTO${images.length === 1 ? "" : "S"}? THIS CANNOT BE UNDONE.`}
        confirmLabel="DELETE ALBUM"
        danger
        busy={deletingFolder}
        onConfirm={confirmDeleteFolder}
        onCancel={() => !deletingFolder && setDelFolder(false)}
      />

      {/* Edit drawer — gated on editOpen */}
      {editOpen && (
        <Drawer
          title="EDIT ALBUM"
          kicker="FHC // GALLERY"
          onClose={closeEdit}
          footer={
            <div className="ad-row" style={{ justifyContent: "flex-end", gap: 8 }}>
              <Btn variant="ghost" onClick={closeEdit} disabled={saving}>
                CANCEL
              </Btn>
              <Btn variant="cyan" onClick={saveEdit} disabled={saving || !String(form.title || "").trim()}>
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </Btn>
            </div>
          }
        >
          <div className="ad-stack">
            {formErr && (
              <div className="ad-alert ad-alert--error" role="alert">
                {formErr}
              </div>
            )}
            <Field label="ALBUM TITLE" hint={String(form.title || "").trim() ? undefined : "REQUIRED — ALBUM / EVENT / PROGRAMME NAME"} error={!String(form.title || "").trim() && formErr ? "TITLE REQUIRED" : ""}>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
            </Field>
            <Field label="EVENT DATE">
              <Input type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} />
            </Field>
            <Field label="DESCRIPTION">
              <Textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Field>
          </div>
        </Drawer>
      )}
    </div>
  );
}
