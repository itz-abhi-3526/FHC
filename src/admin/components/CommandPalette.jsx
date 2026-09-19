import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GLOBAL_SEARCH_EMPTY, globalSearch } from "../lib/adminDb";
import { appStatusMeta } from "../lib/format";

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — GLOBAL COMMAND SEARCH
   Ctrl+K / ⌘K to open. Queries live across USERS, JOIN APPLICATIONS
   and TEAM only — every node here is backed by a real table.
   Arrow keys + Enter to open.
   ════════════════════════════════════════════════════════════════════ */

const NODES = [
  {
    key: "users",
    label: "USERS",
    icon: "☰",
    to: "/admin/users",
    title: (r) => r.full_name || r.email || r.username,
    sub: (r) => [r.email, r.username].filter(Boolean).join(" // "),
    tag: (r) => String(r.role || "MEMBER").toUpperCase(),
  },
  {
    key: "applications",
    label: "JOIN APPLICATIONS",
    icon: "▤",
    to: "/admin/applications",
    title: (r) => r.full_name,
    sub: (r) => [r.register_number, r.email].filter(Boolean).join(" // "),
    tag: (r) => appStatusMeta(r.status).token,
  },
  {
    key: "team",
    label: "TEAM MEMBERS",
    icon: "☺",
    to: "/admin/team",
    title: (r) => r.name,
    sub: (r) => [r.designation, r.team].filter(Boolean).join(" // "),
    tag: (r) => (r.is_active ? "ACTIVE" : "HIDDEN"),
  },
  {
    key: "gallery",
    label: "GALLERY FOLDERS",
    icon: "▦",
    to: "/admin/gallery",
    title: (r) => r.title || "",
    sub: (r) => [r.event_date, r.description].filter(Boolean).join(" // "),
    tag: "ALBUM",
    toId: (r) => r.id,
  },
];

function Highlight({ text = "", term = "" }) {
  const t = String(text);
  const q = String(term).trim();
  if (!q) return <>{t}</>;
  const idx = t.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{t}</>;
  return (
    <>
      {t.slice(0, idx)}
      <span className="ad-cmd-hit">{t.slice(idx, idx + q.length)}</span>
      {t.slice(idx + q.length)}
    </>
  );
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState(GLOBAL_SEARCH_EMPTY);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const seq = useRef(0);

  const flat = useMemo(() => {
    const out = [];
    for (const node of NODES) {
      for (const item of results[node.key] || []) {
        out.push({ node, item });
      }
    }
    return out;
  }, [results]);

  const runSearch = useCallback(async (value) => {
    const mySeq = ++seq.current;
    setLoading(true);
    const res = await globalSearch(value);
    if (mySeq !== seq.current) return;
    setResults(res);
    setActiveIdx(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTerm("");
    setResults({ ...GLOBAL_SEARCH_EMPTY });
    setActiveIdx(0);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || term.trim().length < 2) {
      setResults({ ...GLOBAL_SEARCH_EMPTY });
      setActiveIdx(0);
      return;
    }
    const t = setTimeout(() => runSearch(term), 220);
    return () => clearTimeout(t);
  }, [term, open, runSearch]);

  useEffect(() => setActiveIdx(0), [term]);

  const pick = useCallback(
    (node, item) => {
      if (!node || !item) return;
      onClose?.();
      const targetId = node.toId ? node.toId(item) : item.id;
      if (node.key === "gallery") {
        navigate(`/admin/gallery/${encodeURIComponent(targetId)}`);
      } else {
        navigate(`${node.to}?focus=${encodeURIComponent(targetId)}`);
      }
    },
    [navigate, onClose]
  );

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = flat[activeIdx];
      if (hit) pick(hit.node, hit.item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
    }
  };

  if (!open) return null;

  const total = flat.length;
  const empty = !loading && term.trim().length >= 2 && total === 0;

  return (
    <div className="ad-cmd-overlay" role="dialog" aria-modal="true" aria-label="Global search">
      <button className="ad-drawer-scrim" onClick={onClose} aria-label="Close search" tabIndex={-1} />
      <div className="ad-cmd-panel">
        <div className="ad-cmd-box">
          <span className="ad-cmd-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="SEARCH USERS, APPLICATIONS, TEAM, GALLERY..."
            aria-label="Search all admin data"
            role="combobox"
            aria-expanded={total > 0}
          />
          {loading && <span className="ad-spinner" aria-hidden="true" />}
        </div>

        <div className="ad-cmd-body">
          {empty && (
            <div className="ad-cmd-empty">
              <div className="ad-state-title ad-pixel">NO RECORDS FOUND</div>
              <div className="ad-state-sub">NOTHING MATCHED "{term.toUpperCase()}" ACROSS THE DATA NODES.</div>
            </div>
          )}

          {term.trim().length < 2 && (
            <div className="ad-cmd-empty">
              <div className="ad-state-title ad-pixel">GLOBAL SEARCH ONLINE</div>
              <div className="ad-state-sub">TYPE AT LEAST 2 CHARACTERS TO QUERY EVERY NODE.</div>
            </div>
          )}

          {NODES.map((node) => {
            const rows = results[node.key] || [];
            if (!rows.length) return null;
            return (
              <div key={node.key}>
                <div className="ad-cmd-group-label">▌ {node.label}</div>
                {rows.map((item, i) => {
                  const globalIdx = flat.findIndex((f) => f.node.key === node.key && f.item.id === item.id);
                  return (
                    <button
                      key={`${node.key}-${item.id}`}
                      type="button"
                      className={`ad-cmd-item ${activeIdx === globalIdx ? "is-active" : ""}`}
                      onMouseEnter={() => setActiveIdx(globalIdx)}
                      onClick={() => pick(node, item)}
                    >
                      <span className="ad-cmd-glyph" aria-hidden="true">{node.icon}</span>
                      <span className="ad-cmd-name">
                        <Highlight text={node.title(item)} term={term} />
                      </span>
                      <span className="ad-cmd-meta ad-track">
                        <Highlight text={node.sub(item)} term={term} />
                      </span>
                      <span className="ad-cmd-tag">{node.tag(item)}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="ad-cmd-foot ad-track">
          <span><span className="ad-cmd-kbd">↑↓</span> NAVIGATE</span>
          <span><span className="ad-cmd-kbd">↵</span> OPEN</span>
          <span><span className="ad-cmd-kbd">ESC</span> CLOSE</span>
          <span style={{ marginLeft: "auto", color: "var(--ad-cyan)" }}>{total} MATCHES</span>
        </div>
      </div>
    </div>
  );
}