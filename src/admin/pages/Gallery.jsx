import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isConfigured } from "../lib/upload";
import { toastError, toastSuccess } from "../lib/toast";
import {
  fetchGalleryFolders,
  createGalleryFolder,
  deleteGalleryFolder,
  GALLERY_STATE,
  buildGallerySrc,
  formatEventDateShort,
} from "../../lib/gallery";
import { humanizeAdminError } from "../lib/adminDb";
import { roleLabel } from "../lib/format";
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

const CLOUD_FOLDER = "fhc/gallery";

export default function AdminGallery() {
  const { role } = useAuth();
  const isAdminUser = role === "admin";

  const [state, setState] = useState(GALLERY_STATE.LOADING);
  const [folders, setFolders] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", event_date: "" });
  const [formErr, setFormErr] = useState("");
  const [creating, setCreating] = useState(false);

  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const cloudReady = isConfigured();

  const load = async () => {
    setState(GALLERY_STATE.LOADING);
    setError(null);
    try {
      const rows = await fetchGalleryFolders();
      setFolders(rows);
      setState(GALLERY_STATE.SUCCESS);
    } catch (err) {
      console.error("[FHC Admin] gallery load failed:", err);
      setFolders([]);
      setError(err);
      setState(GALLERY_STATE.ERROR);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = String(query).trim().toLowerCase();
    if (!q) return folders;
    return folders.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        (f.description || "").toLowerCase().includes(q)
    );
  }, [folders, query]);

  const openCreate = () => {
    setForm({ title: "", description: "", event_date: "" });
    setFormErr("");
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const title = String(form.title || "").trim();
    if (!title) {
      setFormErr("ALBUM TITLE IS REQUIRED");
      return;
    }
    setCreating(true);
    setFormErr("");
    try {
      const { data, error: err } = await createGalleryFolder(form);
      if (err) {
        setFormErr(String(err.message || "CREATE FAILED").toUpperCase());
        setCreating(false);
        return;
      }
      toastSuccess(`${title.toUpperCase()} CREATED`);
      setCreateOpen(false);
      setForm({ title: "", description: "", event_date: "" });
      await load();
    } catch (e) {
      setFormErr(humanizeAdminError(e, "CREATE FAILED"));
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      const { error: err } = await deleteGalleryFolder(delTarget.id);
      if (err) {
        toastError(String(err.message || "DELETE FAILED").toUpperCase());
      } else {
        toastSuccess(`${delTarget.title.toUpperCase()} DELETED`);
        setDelTarget(null);
        await load();
      }
    } catch (e) {
      toastError(humanizeAdminError(e, "DELETE FAILED"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        kicker="FHC // GALLERY MANAGEMENT"
        title="MEDIA ARCHIVE"
        sub="EVENT ALBUMS — CREATE, UPLOAD, AND CURATE THE PUBLIC GALLERY"
      >
        <span className="ad-badge ad-badge--pink">
          <span className="ad-bd-dot" /> {roleLabel(role)} ACCESS
        </span>
        <Btn variant={cloudReady ? "cyan" : "ghost"} onClick={openCreate} disabled={!isAdminUser}>
          {cloudReady ? (isAdminUser ? "+ NEW ALBUM" : "ADMIN ONLY") : "CLOUDINARY NOT CONFIGURED"}
        </Btn>
        {!cloudReady && <span className="ad-field-hint">ADD VITE_CLOUDINARY_* TO .env.local</span>}
      </PageHeader>

      {state === GALLERY_STATE.ERROR ? (
        <Panel>
          <ErrorState title="GALLERY UNAVAILABLE" sub="UNABLE TO LOAD ALBUM DATA." onRetry={load} />
        </Panel>
      ) : state === GALLERY_STATE.LOADING ? (
        <Panel>
          <LoadingState label="LOADING MEDIA ARCHIVE" />
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel>
          <EmptyState
            title={query ? "NO ALBUMS FOUND" : "NO GALLERY ALBUMS YET"}
            sub={query ? `NO ALBUMS MATCH "${query.toUpperCase()}".` : "CREATE AN ALBUM TO START BUILDING THE MEDIA ARCHIVE."}
            icon="◫"
          >
            {!query && isAdminUser && (
              <div className="ad-row" style={{ marginTop: 16, justifyContent: "center" }}>
                <Btn variant="cyan" onClick={openCreate}>+ NEW ALBUM</Btn>
              </div>
            )}
          </EmptyState>
        </Panel>
      ) : (
        <Panel flush title="EVENT ALBUMS" tag={`${folders.length} ALBUM${folders.length === 1 ? "" : "S"}`}>
          <div className="ad-toolbar" style={{ padding: "10px 14px", borderBottom: "1px solid var(--ad-line)" }}>
            <span className="ad-toolbar-label">SEARCH</span>
            <input
              className="ad-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="FILTER ALBUMS..."
              aria-label="Filter albums"
            />
          </div>
          <div className="ad-gallery-grid" style={{ padding: 16 }}>
            {filtered.map((folder) => {
              const cover = folder.cover_image_url
                ? buildGallerySrc(folder.cover_image_url, { width: 480 })
                : null;
              return (
                <figure key={folder.id} className="ad-gallery-card">
                  <div className="ad-gallery-img">
                    {cover ? (
                      <img src={cover} alt={`${folder.title} cover`} loading="lazy" />
                    ) : (
                      <span className="ad-gallery-ph" aria-hidden="true">◫</span>
                    )}
                  </div>
                  <figcaption>
                    <div className="ad-pixel" style={{ fontSize: 11, lineHeight: 1.4 }}>
                      {folder.title}
                    </div>
                    <div className="ad-track" style={{ fontSize: 10, color: "var(--ad-muted)" }}>
                      {folder.image_count} PHOTO{folder.image_count === 1 ? "" : "S"}
                      {folder.event_date ? ` · ${formatEventDateShort(folder.event_date)}` : ""}
                    </div>
                  </figcaption>
                  <div className="ad-row" style={{ padding: 8, gap: 6 }}>
                    <Btn size="md" variant="cyan" as={Link} to={`/admin/gallery/${folder.id}`} className="ad-grow" style={{ textAlign: "center" }}>
                      OPEN ALBUM ▸
                    </Btn>
                    {isAdminUser && (
                      <Btn
                        size="md"
                        variant="danger"
                        onClick={() => setDelTarget(folder)}
                        aria-label={`Delete ${folder.title}`}
                      >
                        ✕
                      </Btn>
                    )}
                  </div>
                </figure>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Create album drawer */}
      {createOpen && (
      <Drawer
        title="NEW ALBUM"
        kicker="FHC // GALLERY"
        onClose={() => !creating && setCreateOpen(false)}
        footer={
          <div className="ad-row" style={{ justifyContent: "flex-end", gap: 8 }}>
            <Btn variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              CANCEL
            </Btn>
            <Btn variant="cyan" onClick={submitCreate} disabled={creating || !String(form.title || "").trim()}>
              {creating ? "CREATING..." : "CREATE ALBUM"}
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
          <Field label="ALBUM TITLE" hint={String(form.title || "").trim() ? undefined : "REQUIRED — ALBUM NAME / EVENT / PROGRAMME"} error={!String(form.title || "").trim() && formErr ? "TITLE REQUIRED" : ""}>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="E.G. INNOVATION SUMMIT 2026"
              autoFocus
            />
          </Field>
          <Field label="EVENT DATE">
            <Input
              type="date"
              value={form.event_date}
              onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
            />
          </Field>
          <Field label="DESCRIPTION">
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="SHORT SUMMARY OF THE EVENT / PROGRAMME"
            />
          </Field>
          <div className="ad-field-hint">
            UPLOADS GO TO CLOUDINARY UNDER <b>{CLOUD_FOLDER}</b>
          </div>
        </div>
      </Drawer>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={Boolean(delTarget)}
        title="DELETE ALBUM"
        prose={
          delTarget
            ? `DELETE "${delTarget.title.toUpperCase()}" AND ALL ${delTarget.image_count} PHOTO${delTarget.image_count === 1 ? "" : "S"}? THIS CANNOT BE UNDONE.`
            : ""
        }
        confirmLabel="DELETE ALBUM"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDelTarget(null)}
      />
    </>
  );
}