import { useCallback, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PixelAvatar from "./PixelAvatar";

/* FHC MOBILE NAVIGATION TERMINAL
   Open-state overlay only. The CLOSED mobile navbar is the existing
   pink FHC header (rendered by Navbar.jsx itself) — this drawer simply
   overlays it when the hamburger is tapped (see .mnav-* styles in
   index.css, gated to <1024px). */

const MOBILE_NAV = [
  { code: "01", label: "HOME", sub: "PLAYER HUB", to: "/" },
  { code: "02", label: "EVENTS", sub: "GAME SCHEDULE", to: "/coming-soon" },
  { code: "03", label: "PROJECTS", sub: "MISSION LOGS", to: "/coming-soon" },
  { code: "04", label: "TEAM", sub: "PLAYERS ARENA", to: "/team" },
  { code: "05", label: "GALLERY", sub: "ARCHIVE FEED", to: "/gallery" },
  { code: "06", label: "ABOUT", sub: "MISSION PROFILE", to: "/about" },
  { code: "07", label: "JOIN", sub: "ACCESS FHC", to: "/join" },
];

const EASE = [0.22, 1, 0.36, 1];

export default function MobileTerminal({ open, onClose }) {
  const { pathname } = useLocation();
  const { status, user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const touchStartRef = useRef(null);

  const isAuthed = status === "authed";
  const name = isAuthed
    ? profile?.full_name || user?.user_metadata?.full_name || "PLAYER"
    : "";
  const seed = isAuthed ? profile?.avatar_seed || user?.id || "fhc" : "fhc";
  const avatarUrl = isAuthed ? profile?.avatar_url || "" : "";

  const isActive = (to) => (to === "/" ? pathname === to : pathname.startsWith(to));

  const close = useCallback(() => onClose?.(), [onClose]);

  /* Close the drawer whenever the route changes */
  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* Body scroll lock while the drawer is open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Focus the close control on open, close on Escape */
  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const handleTabTrap = (e) => {
    if (e.key !== "Tab") return;
    const items = drawerRef.current?.querySelectorAll('a[href], button:not([disabled])');
    if (!items || items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const doLogout = async () => {
    close();
    await signOut();
    navigate("/", { replace: true });
  };

  const onTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - start.x;
    const dy = endY - start.y;
    if (Math.abs(dy) < 60 && dx > 64) close();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="mnav-overlay"
            className="mnav-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden="true"
          />
          <motion.aside
            key="mnav-drawer"
            ref={drawerRef}
            className="mnav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="FHC navigation"
            onKeyDown={handleTabTrap}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: EASE }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="mnav-drawer-crt" aria-hidden="true" />
            <span className="mnav-scan" aria-hidden="true" />
            <span className="mnav-bracket tl" aria-hidden="true" />
            <span className="mnav-bracket tr" aria-hidden="true" />
            <span className="mnav-bracket bl" aria-hidden="true" />
            <span className="mnav-bracket br" aria-hidden="true" />

            <div className="mnav-drawer-body">
              <div className="mnav-drawer-head">
                <div className="mnav-drawer-id">
                  <span className="mnav-drawer-title">FHC // NAVIGATION</span>
                  <span className="mnav-drawer-online">
                    <span className="mnav-drawer-dot" aria-hidden="true" />
                    SYSTEM ONLINE
                  </span>
                </div>
                <button
                  type="button"
                  ref={closeBtnRef}
                  className="mnav-close"
                  onClick={close}
                  aria-label="Close navigation"
                >
                  ×
                </button>
              </div>

              <nav className="mnav-list" aria-label="Primary">
                {MOBILE_NAV.map((item, i) => (
                  <motion.div
                    key={item.code}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.07 + i * 0.045, duration: 0.25, ease: EASE }}
                  >
                    <Link
                      to={item.to}
                      onClick={close}
                      className={`mnav-item${isActive(item.to) ? " is-active" : ""}`}
                      aria-current={isActive(item.to) ? "page" : undefined}
                    >
                      <span className="mnav-item-code" aria-hidden="true">{item.code}</span>
                      <span className="mnav-item-main">
                        <span className="mnav-item-label">{item.label}</span>
                        <span className="mnav-item-sub">{item.sub}</span>
                      </span>
                      <span className="mnav-item-arrow" aria-hidden="true">→</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mnav-terminal">
                <span className="mnav-terminal-head">PLAYER TERMINAL</span>
                {isAuthed ? (
                  <>
                    <div className="mnav-term-user">
                      <span className="mnav-term-av">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" width={36} height={36} className="mnav-player-img" />
                        ) : (
                          <PixelAvatar seed={seed} size={36} className="mnav-player-px" />
                        )}
                        <span className="mnav-term-dot" aria-hidden="true" />
                      </span>
                      <span className="mnav-term-meta">
                        <span className="mnav-term-name">{name}</span>
                        <span className={`mnav-term-status${isAdmin ? " is-admin" : ""}`}>
                          {isAdmin ? "ADMIN // AUTHORIZED" : "ONLINE"}
                        </span>
                      </span>
                    </div>
                    <Link to="/dashboard" onClick={close} className="mnav-term-link">
                      <span>DASHBOARD</span>
                      <span className="mnav-term-arrow" aria-hidden="true">→</span>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={close} className="mnav-term-link is-admin">
                        <span>ADMIN PANEL</span>
                        <span className="mnav-term-arrow" aria-hidden="true">→</span>
                      </Link>
                    )}
                    <button type="button" onClick={doLogout} className="mnav-term-link is-logout">
                      <span>POWER DOWN // LOG OUT</span>
                      <span className="mnav-term-arrow" aria-hidden="true">⏻</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mnav-term-user is-off">
                      <span className="mnav-term-av is-off" aria-hidden="true">···</span>
                      <span className="mnav-term-meta">
                        <span className="mnav-term-name">NO PLAYER LINKED</span>
                        <span className="mnav-term-status is-offline">OFFLINE</span>
                      </span>
                    </div>
                    <Link to="/auth" onClick={close} className="mnav-term-link is-access">
                      <span>ACCESS TERMINAL // AUTH</span>
                      <span className="mnav-term-arrow" aria-hidden="true">→</span>
                    </Link>
                  </>
                )}
              </div>

              <div className="mnav-drawer-foot">
                <span>FHC_NETWORK</span>
                <span className="mnav-foot-div" aria-hidden="true">|</span>
                <span>SIGNAL LOCKED</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}