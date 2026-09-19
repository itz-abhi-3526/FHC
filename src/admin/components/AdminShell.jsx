import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Btn, useOverlayLifecycle } from "./ui";
import { Toaster } from "../lib/toast";
import CommandPalette from "./CommandPalette";
import { useRealtimeTable } from "../lib/realtime";
import { fetchPendingCount } from "../lib/adminDb";

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN TERMINAL — application shell
   Desktop : fixed left sidebar
   Tablet  : collapsed navbar + hamburger drawer
   Phone   : compact top bar + drawer (never a squeezed sidebar)
   ════════════════════════════════════════════════════════════════════ */

const NAV_SECTIONS = [
  {
    group: "CONTROL",
    items: [
      { to: "/admin", label: "OVERVIEW", glyph: "◉", end: true },
    ],
  },
  {
    group: "MANAGEMENT",
    items: [
      { to: "/admin/gallery", label: "GALLERY", glyph: "▦", staff: true },
      { to: "/admin/users", label: "USERS", glyph: "☰", adminOnly: true },
      { to: "/admin/applications", label: "APPLICATIONS", glyph: "▤", adminOnly: true, pending: true },
      { to: "/admin/team", label: "TEAM", glyph: "☺", adminOnly: true },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { to: "/admin/settings", label: "SYSTEM", glyph: "⚙", adminOnly: true },
    ],
  },
];

function visibleSections(role) {
  if (role === "admin") return NAV_SECTIONS;
  const staff = role === "media";
  return NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => (staff ? i.staff : !i.adminOnly && !i.staff)),
  })).filter((s) => s.items.length > 0);
}

function BrandBlock({ compact = false }) {
  return (
    <div className={compact ? "ad-brand-lg" : "ad-sidebar-brand"}>
      <div className={compact ? "" : "ad-sidebar-brand-title"}>
        <span className="ad-sidebar-logo">FHC</span>
        <div>
          <div className="ad-pixel ad-track" style={{ fontSize: 10, color: "var(--ad-cream)" }}>
            ADMIN<span style={{ color: "var(--ad-pink)" }}>//</span>TERMINAL
          </div>
          <div className="ad-sidebar-sub">CONTROL CENTER // v1.0</div>
        </div>
      </div>
      <div className="ad-sidebar-node">ノ FISAT HORIZON CLUB SECURE</div>
    </div>
  );
}

function CurrentAdmin({ onDone }) {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const name = profile?.full_name || user?.user_metadata?.full_name || "ADMIN";
  const email = profile?.email || user?.email || "";
  const seed = profile?.avatar_seed || user?.id || "fhc";
  const avatarUrl = profile?.avatar_url || "";
  const badge = role === "admin" ? "ADMIN" : role === "media" ? "MEDIA" : "STAFF";

  const doLogout = async () => {
    if (leaving) return;
    setLeaving(true);
    await new Promise((r) => setTimeout(r, 650));
    await signOut();
    onDone?.();
    navigate("/", { replace: true });
  };

  return (
    <div className="ad-side-admin">
      <div className="ad-side-admin-row">
        <Avatar seed={seed} url={avatarUrl} size={32} />
        <div className="ad-grow" style={{ minWidth: 0 }}>
          <div className="ad-pixel ad-track" style={{ fontSize: 8, color: "var(--ad-cream)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </div>
          <div className="ad-track" style={{ fontSize: 10, color: "var(--ad-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email}
          </div>
        </div>
        <span className="ad-badge ad-badge--pink">
          <span className="ad-bd-dot" /> {badge}
        </span>
      </div>
      <div className="ad-side-admin-actions">
        <Btn variant="ghost" sm className="ad-grow" onClick={() => { onDone?.(); navigate("/dashboard"); }}>
          ⌂ DASHBOARD
        </Btn>
        <Btn variant="danger" sm className="ad-grow" onClick={doLogout} disabled={leaving}>
          {leaving ? "..." : "⏻ LOG OUT"}
        </Btn>
      </div>
    </div>
  );
}

function CommandBar() {
  return (
    <div className="ad-commandbar ad-track">
      <span className="ad-pixel" style={{ fontSize: 10, letterSpacing: "0.2em" }}>
        FHC <span className="ad-dot-pink">//</span> COMMAND CENTER
      </span>
      <span className="ad-grow" />
    </div>
  );
}

function NavContent({ onNavigate, pendingCount = 0, pendingPulse = false, role = "admin" }) {
  const location = useLocation();
  const sections = visibleSections(role);
  return (
    <nav className="ad-nav" aria-label="Admin navigation">
      {sections.map((section) => (
        <div key={section.group}>
          <div className="ad-nav-group ad-pixel">{section.group}</div>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `ad-nav-item ${isActive ? "is-active" : ""} ${location.pathname.startsWith(item.to) && item.to !== "/admin" ? "is-active" : ""}`
              }
            >
              <span className="ad-nav-glyph" aria-hidden="true">{item.glyph}</span>
              <span className="ad-nav-label">{item.label}</span>
              {item.pending && role === "admin" && pendingCount > 0 && (
                <span className={`ad-nav-count ${pendingPulse ? "pulse" : ""}`}>{pendingCount}</span>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

function MobileDrawer({ open, onClose, children }) {
  const panelRef = useRef(null);
  useOverlayLifecycle(onClose, panelRef, open);
  if (!open) return null;
  return (
    <div className="ad-drawer" role="dialog" aria-modal="true" ref={panelRef} tabIndex={-1}>
      <button type="button" className="ad-drawer-scrim" onClick={onClose} aria-label="Close menu" tabIndex={-1} />
      <div className="ad-drawer-panel">{children}</div>
    </div>
  );
}

export default function AdminShell() {
  const location = useLocation();
  const { user, profile, role } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingPulse, setPendingPulse] = useState(false);
  const isAdminUser = role === "admin";

  useEffect(() => setDrawer(false), [location.pathname]);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setCmdOpen((v) => !v);
      } else if (e.key === "Escape") {
        setDrawer(false);
        setCmdOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Live pending count + new-application notification (spec §20).
     Propagation is driven by the realtime publication configured in
     supabase/admin.sql; a visibilitychange refetch covers a tab that
     came to the foreground after events were coalesced by the browser
     (an event, not polling). */
  const refreshPending = useCallback(async () => {
    const { count } = await fetchPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    if (!isAdminUser) return undefined;
    refreshPending();
    const onVis = () => {
      if (document.visibilityState === "visible") refreshPending();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshPending, isAdminUser]);

  useRealtimeTable(
    "fhc_join_applications",
    () => {
      refreshPending();
      setPendingPulse(true);
      window.setTimeout(() => setPendingPulse(false), 1500);
    },
    { debounceMs: 100, events: ["INSERT"], enabled: isAdminUser }
  );

  const name = profile?.full_name || user?.user_metadata?.full_name || "ADMIN";
  const seed = profile?.avatar_seed || user?.id || "fhc";
  const avatarUrl = profile?.avatar_url || "";

  return (
    <div className="admin-root ad-scope">
      <div className="ad-bg-grid" aria-hidden="true" />
      <div className="ad-bg-scan" aria-hidden="true" />
      <div className="ad-bg-glow ad-bg-glow--pink" aria-hidden="true" />
      <div className="ad-bg-glow ad-bg-glow--cyan" aria-hidden="true" />

      {/* Desktop sidebar */}
      <aside className="ad-sidebar" aria-label="Admin sidebar">
        <BrandBlock />
        <div className="ad-sidebar-search">
          <button type="button" className="ad-cmd-trigger" onClick={() => setCmdOpen(true)}>
            <span>⌕ GLOBAL SEARCH</span>
            <span className="ad-cmd-kbd">CTRL K</span>
          </button>
        </div>
        <NavContent pendingCount={pendingCount} pendingPulse={pendingPulse} role={role} />
        <CurrentAdmin />
      </aside>

      {/* Topbar (tablet / mobile) */}
      <header className="ad-topbar">
        <button type="button" className="ad-hamburger" onClick={() => setDrawer(true)} aria-label="Open admin menu">
          ☰
        </button>
        <div className="ad-grow ad-topbar-title ad-pixel">
          <span className="ad-topbar-pink">FHC</span> // ADMIN TERMINAL
        </div>
        <button type="button" className="ad-cmd-trigger ad-hide-mobile" onClick={() => setCmdOpen(true)} aria-label="Global search">
          <span>⌕</span>
          <span className="ad-cmd-kbd">CTRL K</span>
        </button>
        <Avatar seed={seed} url={avatarUrl} size={30} />
      </header>

      {/* Drawer (tablet / mobile) */}
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: 8 }}>
          <button type="button" className="ad-drawer-close" onClick={() => setDrawer(false)} aria-label="Close menu">
            ✕
          </button>
        </div>
        <BrandBlock compact />
        <NavContent pendingCount={pendingCount} pendingPulse={pendingPulse} onNavigate={() => setDrawer(false)} role={role} />
        <CurrentAdmin onDone={() => setDrawer(false)} />
      </MobileDrawer>

      <main className="ad-main">
        <CommandBar />
        <div className="ad-page">
          <Outlet />
        </div>
      </main>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <Toaster />
    </div>
  );
}