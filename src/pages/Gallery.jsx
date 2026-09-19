import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../gallery.css";
import Footer from "../components/Footer";
import {
  fetchGalleryFolders,
  GALLERY_STATE,
  buildGallerySrc,
  formatEventDateShort,
} from "../lib/gallery";

function LoadingGallery() {
  return (
    <section className="gf-state" aria-live="polite" aria-busy="true" role="status">
      <span className="gf-state-spin" aria-hidden="true" />
      <p className="gf-state-title">LOADING GALLERY...</p>
      <p className="gf-state-sub">FETCHING FHC MEDIA ARCHIVE</p>
    </section>
  );
}

function ErrorGallery({ retry }) {
  return (
    <section className="gf-state gf-state-err" role="alert">
      <p className="gf-state-title">GALLERY UNAVAILABLE</p>
      <p className="gf-state-sub">UNABLE TO LOAD GALLERY DATA.</p>
      <button type="button" className="gf-retry" onClick={retry}>
        ↻ RETRY
      </button>
    </section>
  );
}

function EmptyGallery({ query }) {
  return (
    <section className="gf-empty">
      <span className="gf-empty-icon" aria-hidden="true">▦</span>
      {query ? (
        <>
          <p className="gf-empty-title">NO ALBUMS FOUND</p>
          <p className="gf-empty-sub">NO EVENTS MATCH "{query.toUpperCase()}".</p>
        </>
      ) : (
        <>
          <p className="gf-empty-title">NO GALLERY ALBUMS YET</p>
          <p className="gf-empty-sub">FHC EVENTS AND PROGRAMME MEMORIES WILL APPEAR HERE.</p>
        </>
      )}
    </section>
  );
}

function FolderCard({ folder }) {
  const cover = folder.cover_image_url
    ? buildGallerySrc(folder.cover_image_url, { width: 800 })
    : null;

  return (
    <Link to={`/gallery/${folder.id}`} className="gf-card">
      <div className="gf-card-cover">
        {cover ? (
          <img
            src={cover}
            alt={`${folder.title} cover`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="gf-card-cover-ph" aria-hidden="true">
            <span className="gf-card-glyph">◫</span>
          </div>
        )}
        <span className="gf-card-count">
          {folder.image_count} PHOTO{folder.image_count === 1 ? "" : "S"}
        </span>
      </div>
      <div className="gf-card-body">
        <h3 className="gf-card-title">{folder.title}</h3>
        {folder.event_date && (
          <p className="gf-card-date">{formatEventDateShort(folder.event_date)}</p>
        )}
      </div>
    </Link>
  );
}

export default function Gallery() {
  const [state, setState] = useState(GALLERY_STATE.LOADING);
  const [folders, setFolders] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  const load = async () => {
    setState(GALLERY_STATE.LOADING);
    setError(null);
    try {
      const rows = await fetchGalleryFolders();
      setFolders(rows);
      setState(GALLERY_STATE.SUCCESS);
    } catch (err) {
      console.error("[FHC Gallery] folder load failed:", err);
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

  const ready = state === GALLERY_STATE.SUCCESS;

  return (
    <div className="gf-root">
      <header className="gf-header">
        <div className="gf-header-inner">
          <p className="gf-kicker">
            <span className="gf-kicker-fhc">FHC</span>
            <span className="gf-kicker-sep">//</span>
            <span className="gf-kicker-path">/GALLERY</span>
          </p>
          <h1 className="gf-title">
            <span className="gf-title-accent">GALLERY</span>
          </h1>
          <p className="gf-sub">FHC MEDIA ARCHIVE</p>
          <p className="gf-tag">EVERY EVENT. EVERY PROGRAMME. EVERY MEMORY.</p>
        </div>

        {ready && (
          <div className="gf-search" data-glyph="⌕">
            <input
              type="search"
              className="gf-search-input"
              placeholder="SEARCH EVENTS / ALBUMS..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search gallery albums"
            />
            <span className="gf-search-cursor" aria-hidden="true" />
          </div>
        )}
      </header>

      {state === GALLERY_STATE.ERROR ? (
        <ErrorGallery retry={load} />
      ) : !ready ? (
        <LoadingGallery />
      ) : (
        <main className="gf-stage" aria-label="FHC media archive">
          {filtered.length === 0 ? (
            <EmptyGallery query={query} />
          ) : (
            <div className="gf-grid">
              {filtered.map((folder) => (
                <FolderCard key={folder.id} folder={folder} />
              ))}
            </div>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}