import { useEffect, useMemo, useRef, useState } from "react";
import { avatarStyle, initials } from "../lib/format";

/* Overlay stack — a module-level counter ensures that when several
   overlays are open at once (e.g. a ConfirmModal sitting above a Drawer),
   ONLY the top-most one consumes the Escape key. Without this, one
   keypress closed every stacked overlay at once (the bug that made the
   Applications drawer + confirm dialog vanish simultaneously). */
const overlayStack = [];

/* Overlay lifecycle for drawers / modals / palettes:
   ESC-to-close (only when this is the top-most overlay), body scroll
   lock, focus move + restore. Returns the cleanup guarantees the spec
   requires (no stuck dim screens). */
export function useOverlayLifecycle(onClose, panelRef, open = true) {
  const lastActive = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    if (overlayStack.indexOf(`escape-${useOverlayLifecycle.__seq}`) === -1) {
      // register this overlay as open
    }
    lastActive.current = document.activeElement;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    const top = overlayStack.push(`overlay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`) - 1;
    const t = window.setTimeout(() => {
      if (panelRef?.current && typeof panelRef.current.focus === "function") {
        panelRef.current.focus();
      }
    }, 30);
    function onKey(e) {
      if (e.key !== "Escape") return;
      // Only the overlay registered at the TOP of the stack may close on
      // Escape — a drawer stays open while its confirm dialog is on top.
      const topId = overlayStack[overlayStack.length - 1];
      if (topId !== overlayStack[top]) return;
      e.preventDefault();
      onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      overlayStack.splice(top, 1);
      body.style.overflow = prevOverflow;
      const el = lastActive.current;
      if (el && typeof el.focus === "function") el.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — shared UI atoms (all visual styles live in admin.css)
   ════════════════════════════════════════════════════════════════════ */

export function CornerBrackets({ color = "rgba(30,215,232,0.5)", inset = -3 }) {
  const b = {
    position: "absolute",
    width: 11,
    height: 11,
    pointerEvents: "none",
  };
  const s = { ...b, top: inset, left: inset, borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` };
  const s2 = { ...b, top: inset, right: inset, borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` };
  const s3 = { ...b, bottom: inset, left: inset, borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` };
  const s4 = { ...b, bottom: inset, right: inset, borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` };
  return (
    <>
      <span className="ad-corner" style={s} aria-hidden="true" />
      <span className="ad-corner" style={s2} aria-hidden="true" />
      <span className="ad-corner" style={s3} aria-hidden="true" />
      <span className="ad-corner" style={s4} aria-hidden="true" />
    </>
  );
}

export function Avatar({ seed, url, size = 30, className = "", rounded = true }) {
  const style = useMemo(() => avatarStyle(seed || url || "fhc"), [seed, url]);
  const cls = `ad-avatar ${rounded ? "" : ""} ${className}`.trim();
  if (url) {
    return (
      <span className={cls} style={{ width: size, height: size, ...style }}>
        <img src={url} alt="" loading="lazy" />
      </span>
    );
  }
  return (
    <span className={cls} style={{ width: size, height: size, fontSize: Math.max(8, size * 0.32), ...style }}>
      {initials(seed || "FHC")}
    </span>
  );
}

export function Badge({ meta, children }) {
  const cls = typeof meta === "string" ? meta : meta?.cls || "ad-badge--muted";
  return <span className={`ad-badge ${cls}`}>{children || meta?.token || ""}</span>;
}

export function Panel({ title, tag, accentClass = "ad-badge--cyan", children, flush = false, className = "", bodyStyle }) {
  return (
    <section className={`ad-panel ${flush ? "ad-panel--flush" : ""} ${className}`}>
      {title && (
        <header className="ad-panel-head">
          <h3 className="ad-panel-title ad-pixel">
            <span className="ad-dot">▌</span>
            <b>{title}</b>
          </h3>
          {tag && <span className={`ad-badge ${accentClass}`}>{tag}</span>}
        </header>
      )}
      <div className={flush ? "" : "ad-panel-body"} style={bodyStyle}>
        {children}
      </div>
    </section>
  );
}

export function PageHeader({ kicker, title, sub, children }) {
  return (
    <header className="ad-page-head">
      <div className="ad-grow">
        {kicker && <div className="ad-page-kicker ad-pixel">{kicker}</div>}
        <h1 className="ad-page-title ad-pixel">{title}</h1>
        {sub && <p className="ad-page-sub">{sub}</p>}
      </div>
      {children && <div className="ad-row">{children}</div>}
    </header>
  );
}

const BTN_CLASSES = {
  default: "",
  pink: "ad-btn--pink",
  cyan: "ad-btn--cyan",
  green: "ad-btn--green",
  danger: "ad-btn--danger",
  ghost: "ad-btn--ghost",
};

export function Btn({ variant = "default", sm = false, className = "", as: Tag = "button", children, ...rest }) {
  const tagProps = Tag === "button" ? { type: "button", ...rest } : rest;
  return (
    <Tag className={`ad-btn ${BTN_CLASSES[variant] || ""} ${sm ? "ad-btn--sm" : ""} ${className}`} {...tagProps}>
      {children}
    </Tag>
  );
}

export function Input(props) {
  return <input className={`ad-input ${props.className || ""}`} {...props} />;
}

export function Select({ options = [], placeholder = "", className = "", ...rest }) {
  return (
    <select className={`ad-select ${className || ""}`} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => {
        if (typeof o === "string") return <option key={o} value={o}>{o}</option>;
        return (
          <option key={String(o.value)} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        );
      })}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className={`ad-textarea ${props.className || ""}`} {...props} />;
}

export function Field({ label, hint, error, children, className = "" }) {
  return (
    <label className={`ad-field ${className}`}>
      {label && <span className="ad-field-label">{label}</span>}
      {children}
      {hint && <span className="ad-field-hint">{hint}</span>}
      {error && <span className="ad-field-error">{error}</span>}
    </label>
  );
}

/* Debounced search input */
export function DebouncedSearch({ value = "", onChange, placeholder = "SEARCH...", delay = 320, className = "" }) {
  const [internal, setInternal] = useState(value);
  const [busy, setBusy] = useState(false);

  useEffect(() => setInternal(value), [value]);

  useEffect(() => {
    if (internal === value) return;
    setBusy(true);
    const t = setTimeout(() => {
      onChange(internal);
      setBusy(false);
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internal, delay]);

  return (
    <div className={`ad-search ${className}`}>
      <span className="ad-search-icon" aria-hidden="true">⌕</span>
      <input
        className="ad-input"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {busy && <span className="ad-spinner" style={{ position: "absolute", right: 10, width: 12, height: 12 }} aria-hidden="true" />}
    </div>
  );
}

export function ClearFilters({ count = 0, onClear }) {
  if (count <= 0) return null;
  return (
    <button type="button" className="ad-clear" onClick={onClear}>
      ✕ CLEAR FILTERS ({count})
    </button>
  );
}

/* Range + pager */
export function RangeBar({ from, to, total, pageSize, onPageSize }) {
  return (
    <div className="ad-range">
      <span>
        SHOWING <b style={{ color: "var(--ad-cyan)" }}>{from}–{to}</b> OF <b style={{ color: "var(--ad-cream)" }}>{total}</b>
      </span>
      {onPageSize && (
        <span className="ad-page-size">
          ROWS
          <Select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            options={["10", "20", "50", "100"]}
            aria-label="Page size"
          />
        </span>
      )}
    </div>
  );
}

export function Pager({ page, pages, onPage, total }) {
  if (total <= 0) return null;
  const nums = useMemo(() => {
    const out = [];
    const p = Math.max(1, page);
    const max = Math.max(1, pages);
    const lo = Math.max(1, p - 2);
    const hi = Math.min(max, p + 2);
    for (let i = lo; i <= hi; i++) out.push(i);
    return out;
  }, [page, pages]);
  return (
    <div className="ad-pager" role="navigation" aria-label="Pagination">
      <button className="ad-page-btn" disabled={page <= 1} onClick={() => onPage(1)} aria-label="First page">«</button>
      <button className="ad-page-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">‹</button>
      {nums[0] > 1 && <span className="ad-page-btn">…</span>}
      {nums.map((n) => (
        <button key={n} className={`ad-page-btn ${n === page ? "is-active" : ""}`} onClick={() => onPage(n)}>
          {n}
        </button>
      ))}
      {nums[nums.length - 1] < pages && <span className="ad-page-btn">…</span>}
      <button className="ad-page-btn" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">›</button>
      <button className="ad-page-btn" disabled={page >= pages} onClick={() => onPage(pages)} aria-label="Last page">»</button>
    </div>
  );
}

/* Loading / error / empty states */
export function LoadingState({ label = "LOADING DATA" }) {
  return (
    <div className="ad-state" role="status" aria-live="polite">
      <span className="ad-spinner" aria-hidden="true" />
      <div className="ad-state-title ad-pixel">{label}</div>
      <div className="ad-state-sub">QUERYING DATA NODE...</div>
    </div>
  );
}

export function ErrorState({ title = "DATA NODE UNREACHABLE", sub, onRetry }) {
  return (
    <div className="ad-state ad-state-error" role="alert">
      <span className="ad-state-icon" aria-hidden="true">⚠</span>
      <div className="ad-state-title ad-pixel">{title}</div>
      <div className="ad-state-sub">{sub || "THE REQUEST COULD NOT BE COMPLETED."}</div>
      {onRetry && (
        <button type="button" className="ad-btn ad-btn--cyan" onClick={onRetry}>
          ⟳ RETRY LINK
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = "NO RECORDS FOUND", sub, icon = "▮▮▮", children }) {
  return (
    <div className="ad-state">
      <span className="ad-state-icon" aria-hidden="true">{icon}</span>
      <div className="ad-state-title ad-pixel">{title}</div>
      {sub && <div className="ad-state-sub">{sub}</div>}
      {children}
    </div>
  );
}

/* Right slide-in drawer */
export function Drawer({ title, kicker, onClose, children, footer, width = 560 }) {
  const panelRef = useRef(null);
  useOverlayLifecycle(onClose, panelRef);
  return (
    <div className="ad-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="ad-drawer-scrim" onClick={onClose} aria-label="Close drawer" tabIndex={-1} />
      <div className="ad-drawer-right" style={{ width: `min(${width}px, 100%)` }} ref={panelRef} tabIndex={-1}>
        <header className="ad-drawer-head">
          <div>
            {kicker && <div className="ad-pixel ad-track" style={{ fontSize: 7, color: "var(--ad-cyan)", marginBottom: 4 }}>{kicker}</div>}
            <div className="ad-drawer-title ad-pixel">
              <span className="ad-pink">▌</span> {title}
            </div>
          </div>
          <button type="button" className="ad-drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="ad-drawer-body">{children}</div>
        {footer && <footer className="ad-drawer-foot">{footer}</footer>}
      </div>
    </div>
  );
}

/* Confirm modal */
export function ConfirmModal({ open, title, prose, confirmLabel = "CONFIRM", danger = false, busy = false, onConfirm, onCancel, children }) {
  const panelRef = useRef(null);
  useOverlayLifecycle(onCancel, panelRef, open);
  if (!open) return null;
  return (
    <div className="ad-overlay" role="dialog" aria-modal="true">
      <button type="button" className="ad-drawer-scrim" onClick={onCancel} aria-label="Close" tabIndex={-1} />
      <div className="ad-modal-center ad-highlight-target" ref={panelRef} tabIndex={-1}>
        <div className="ad-modal-title ad-pixel">
          <span className="ad-pink">▌</span> {title}
        </div>
        <div className="ad-modal-body">{prose}</div>
        {children}
        <div className="ad-modal-foot">
          <Btn variant="ghost" onClick={onCancel}>CANCEL</Btn>
          <Btn variant={danger ? "danger" : "cyan"} onClick={onConfirm} disabled={busy}>
            {busy ? "PROCESSING..." : confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* Export cluster */
export function ExportBar({ onExport, note = "FILTERED RECORDS ONLY", disabled = false }) {
  return (
    <span className="ad-export-tray">
      <span className="ad-toolbar-label">EXPORT</span>
      <button type="button" className="ad-act ad-act--green" onClick={() => onExport("csv")} disabled={disabled}>CSV</button>
      <button type="button" className="ad-act ad-act--green" onClick={() => onExport("xlsx")} disabled={disabled}>EXCEL</button>
      <button type="button" className="ad-act ad-act--green" onClick={() => onExport("pdf")} disabled={disabled}>PDF</button>
      <span className="ad-field-hint">{note}</span>
    </span>
  );
}

/* Sortable table header */
export function SortTh({ label, sortKey, active, dir, onSort, alignRight = false, breakAll = false }) {
  const activeFlag = active === sortKey;
  return (
    <th
      className={`ad-sortable ${alignRight ? "ad-sortable-right" : ""}`}
      onClick={() => onSort(sortKey)}
      aria-sort={activeFlag ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span>{label}</span>
      {activeFlag && <span className="ad-sort-arrow">{dir === "asc" ? "▲" : "▼"}</span>}
    </th>
  );
}

export function SectionHeader({ tag, title }) {
  return (
    <h3 className="ad-sec-h ad-pixel">
      <span className="ad-sec-tag">▌</span> {title}
      {tag && <span style={{ opacity: 0.6 }}>— {tag}</span>}
    </h3>
  );
}

/* Bulk selection bar */
export function BulkBar({ count, onDelete, onExport, deleteLabel = "DELETE" }) {
  if (!count) return null;
  return (
    <div className="ad-bulkbar">
      <span className="ad-count-pill">{count} SELECTED</span>
      <span className="ad-grow" />
      {onExport && (
        <button type="button" className="ad-act ad-act--cyan" onClick={onExport}>EXPORT SELECTED</button>
      )}
      {onDelete && (
        <button type="button" className="ad-act ad-act--danger" onClick={onDelete}>BULK {deleteLabel}</button>
      )}
    </div>
  );
}