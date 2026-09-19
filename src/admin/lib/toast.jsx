import { useCallback, useEffect, useState } from "react";

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — global toast notifications
   Framework-free emitter + <Toaster/> host (visual styles: admin.css
   .ad-toast-viewport / .ad-toast--{kind}). Mount <Toaster/> once in the
   admin shell; pages call toastSuccess / toastError from anywhere.
   ════════════════════════════════════════════════════════════════════ */

const listeners = new Set();
let nextId = 1;

function notify(toast) {
  for (const fn of listeners) fn(toast);
}

export function dismiss(id) {
  notify({ id, dismiss: true });
}

function push(kind, msg, title, ttl = 5200) {
  if (!msg) return;
  const id = nextId++;
  notify({ id, kind, msg, title });
  if (ttl > 0) window.setTimeout(() => dismiss(id), ttl);
}

export function toastSuccess(msg, title = "SUCCESS") { push("success", msg, title); }
export function toastError(msg, title = "ERROR") { push("error", msg, title); }
export function toastInfo(msg, title = "INFO") { push("info", msg, title); }
export function toastWarning(msg, title = "WARNING") { push("warning", msg, title); }

const KIND_ICON = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fn = (t) => {
      setItems((prev) => {
        if (t.dismiss) return prev.filter((it) => it.id !== t.id);
        if (prev.some((it) => it.id === t.id)) return prev;
        return [...prev.slice(-4), t];
      });
    };
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  const close = useCallback((id) => dismiss(id), []);

  if (!items.length) return null;
  return (
    <div className="ad-toast-viewport" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`ad-toast ad-toast--${t.kind}`} role={t.kind === "error" ? "alert" : "status"}>
          <span className="ad-toast-icon" aria-hidden="true">{KIND_ICON[t.kind] || "•"}</span>
          <div style={{ minWidth: 0 }}>
            <div className="ad-toast-title ad-pixel">{t.title}</div>
            <div className="ad-toast-msg">{t.msg}</div>
          </div>
          <button
            type="button"
            onClick={() => close(t.id)}
            aria-label="Dismiss"
            className="ad-drawer-close"
            style={{ width: 20, height: 20, marginLeft: "auto", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

/* Provider form used by AdminApp; a standalone Toaster is mounted by
   AdminShell via the shared emitter (same module → one global channel). */
export function AdminToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}