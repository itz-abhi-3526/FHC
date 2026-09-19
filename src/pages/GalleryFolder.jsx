import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../gallery.css";
import Footer from "../components/Footer";
import {
  fetchGalleryFolder,
  fetchGalleryImages,
  GALLERY_STATE,
  buildGallerySrc,
  formatEventDate,
  isVideoMediaRow,
} from "../lib/gallery";

function LoadingFolder() {
  return (
    <section className="gf-state" aria-live="polite" aria-busy="true" role="status">
      <span className="gf-state-spin" aria-hidden="true" />
      <p className="gf-state-title">LOADING ALBUM...</p>
      <p className="gf-state-sub">FETCHING EVENT PHOTOGRAPHS</p>
    </section>
  );
}

function ErrorFolder({ retry }) {
  return (
    <section className="gf-state gf-state-err" role="alert">
      <p className="gf-state-title">GALLERY UNAVAILABLE</p>
      <p className="gf-state-sub">UNABLE TO LOAD ALBUM DATA.</p>
      <button type="button" className="gf-retry" onClick={retry}>
        ↻ RETRY
      </button>
    </section>
  );
}

function Lightbox({ images, index, onClose, onPrev, onNext }) {
  const image = images[index];
  const total = images.length;
  const closeRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [image?.id]);

  useEffect(() => {
    closeRef.current?.focus();
  }, [image?.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    if (!images.length || index == null) return;
    [index - 1, index + 1].forEach((i) => {
      const neighbor = images[(i + images.length) % images.length];
      if (neighbor?.image_url && !isVideoMediaRow(neighbor)) {
        const probe = new Image();
        probe.src = buildGallerySrc(neighbor.image_url, { width: 1600 });
      }
    });
  }, [index, images]);

  if (!image) return null;

  const src = buildGallerySrc(image.image_url, { width: 1800 });
  const counter = String(index + 1).padStart(2, "0");

  return (
    <div className="gf-lightbox" role="dialog" aria-modal="true" aria-label="FHC image viewer">
      <div className="gf-lightbox-top">
        <span className="gf-lightbox-brand">
          <span className="gf-lightbox-brand-fhc">FHC</span>
          <span className="gf-lightbox-sep">//</span> IMAGE VIEWER
        </span>
        <button
          type="button"
          ref={closeRef}
          className="gf-lightbox-close"
          onClick={onClose}
        >
          <span aria-hidden="true">✕</span> CLOSE
        </button>
      </div>

      <button
        type="button"
        className="gf-nav gf-nav-prev"
        onClick={onPrev}
        aria-label="Previous image"
      >
        <span aria-hidden="true">‹</span>
      </button>

      <div
        className="gf-lightbox-stage"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={`gf-lightbox-frame${loaded ? " is-loaded" : ""}`}>
          {isVideoMediaRow(image) ? (
            <video
              key={image.id}
              className="gf-lightbox-video"
              src={image.image_url}
              controls
              autoPlay
              playsInline
              onLoadedData={() => setLoaded(true)}
              onError={() => setLoaded(true)}
            />
          ) : (
            <img
              key={image.id}
              className="gf-lightbox-img"
              src={src}
              alt={image.caption || `Photo from gallery`}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
            />
          )}
        </div>
      </div>

      <button
        type="button"
        className="gf-nav gf-nav-next"
        onClick={onNext}
        aria-label="Next image"
      >
        <span aria-hidden="true">›</span>
      </button>

      <div className="gf-lightbox-bottom">
        <div className="gf-lightbox-count">
          {counter} / {String(total).padStart(2, "0")}
        </div>
        <p className="gf-lightbox-hint">
          <span>ESC</span> CLOSE · <span>←</span> <span>→</span> NAVIGATE
        </p>
      </div>
    </div>
  );
}

export default function GalleryFolder() {
  const { folderId } = useParams();
  const [state, setState] = useState(GALLERY_STATE.LOADING);
  const [folder, setFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(null);
  const openerRef = useRef(null);

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
      console.error("[FHC Gallery] folder detail load failed:", err);
      setFolder(null);
      setImages([]);
      setError(err);
      setState(GALLERY_STATE.ERROR);
    }
  }, [folderId]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (i) => {
    openerRef.current = document.activeElement;
    setViewerIndex(i);
  };
  const prev = () =>
    setViewerIndex((v) => (v == null ? v : (v - 1 + images.length) % images.length));
  const next = () =>
    setViewerIndex((v) => (v == null ? v : (v + 1) % images.length));
  const close = () => {
    setViewerIndex(null);
    requestAnimationFrame(() => openerRef.current?.focus?.());
  };

  useEffect(() => {
    if (viewerIndex == null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [viewerIndex]);

  useEffect(() => {
    if (viewerIndex != null && images.length === 0) setViewerIndex(null);
  }, [viewerIndex, images.length]);

  const ready = state === GALLERY_STATE.SUCCESS;
  const viewerImage =
    viewerIndex != null && images[viewerIndex] ? images[viewerIndex] : null;

  const coverSrc = useMemo(
    () =>
      folder?.cover_image_url
        ? buildGallerySrc(folder.cover_image_url, { width: 900 })
        : null,
    [folder]
  );

  return (
    <div className="gf-root gf-root-folder">
      <div className="gf-folder-head">
        <p className="gf-kicker gf-folder-kicker">
          <span className="gf-kicker-fhc">FHC</span>
          <span className="gf-kicker-sep">//</span>
          <span className="gf-kicker-path">/GALLERY</span>
        </p>

        <Link to="/gallery" className="gf-back">
          <span aria-hidden="true">←</span> BACK TO GALLERY
        </Link>

        {state === GALLERY_STATE.ERROR ? (
          <ErrorFolder retry={load} />
        ) : !ready ? (
          <LoadingFolder />
        ) : (
          <>
            <div className="gf-folder-mast">
              <h1 className="gf-title">{folder.title}</h1>
              {folder.description && (
                <p className="gf-folder-desc">{folder.description}</p>
              )}
              <div className="gf-folder-meta">
                {folder.event_date && (
                  <span className="gf-folder-date">
                    {formatEventDate(folder.event_date)}
                  </span>
                )}
                <span className="gf-folder-count">
                  {images.length} PHOTO{images.length === 1 ? "" : "S"}
                </span>
              </div>
            </div>

            {images.length === 0 ? (
              <section className="gf-empty">
                <span className="gf-empty-icon" aria-hidden="true">◫</span>
                <p className="gf-empty-title">NO IMAGES YET</p>
                <p className="gf-empty-sub">UPLOAD IMAGES TO POPULATE THIS ALBUM.</p>
              </section>
            ) : (
              <>
                {coverSrc && (
                  <div className="gf-folder-cover">
                    <img
                      src={coverSrc}
                      alt={`${folder.title} cover`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <div className="gf-grid gf-grid-folder" aria-label={`${folder.title} photographs`}>
                  {images.map((img, i) => (
                    <figure
                      key={img.id}
                      className="gf-tile"
                    >
                      <div className="gf-tile-media">
                        {isVideoMediaRow(img) ? (
                          <video
                            src={img.image_url}
                            controls
                            preload="metadata"
                            playsInline
                          />
                        ) : (
                          <img
                            src={buildGallerySrc(img.image_url, { width: 640 })}
                            alt={img.caption || `Photo ${i + 1} from ${folder.title}`}
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                      {img.caption && <figcaption className="gf-tile-cap">{img.caption}</figcaption>}
                      {!isVideoMediaRow(img) && (
                        <button
                          type="button"
                          className="gf-tile-cover"
                          onClick={() => open(i)}
                          tabIndex={0}
                          aria-label={`OPEN PHOTO ${i + 1} — ${folder.title}`}
                        />
                      )}
                    </figure>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Footer />

      {viewerImage ? (
        <Lightbox
          images={images}
          index={viewerIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      ) : null}
    </div>
  );
}