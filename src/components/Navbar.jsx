import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PixelAvatar from "../components/PixelAvatar";
import MobileTerminal from "./MobileTerminal";

const LINKS = [
  { label: "HOME", to: "/", arrow: true },
  { label: "EVENTS", to: "/coming-soon" },
  { label: "PROJECTS", to: "/coming-soon" },
  { label: "TEAM", to: "/team" },
  { label: "GALLERY", to: "/gallery" },
  { label: "ABOUT", to: "/about" },
  { label: "JOIN", to: "/join" },
  { label: "AUTH", to: "/auth", auth: true },
];

const MotionLink = motion.create(Link);

/* ── Desktop nav link — established original structure, subtle active underline ── */
function DesktopNavLink({ to, label, active, arrow, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className="relative inline-flex items-center font-pixel text-[18px] text-ink hover:text-cream transition-colors px-3 py-2 whitespace-nowrap"
    >
      {arrow && (
        <span
          className="mr-2 inline-block"
          style={{ width: 0, height: 0, borderLeft: "9px solid #0c0c0f", borderTop: "5px solid transparent", borderBottom: "5px solid transparent" }}
          aria-hidden="true"
        />
      )}
      {label}
      {active && <span className="nav-link-active" aria-hidden="true" />}
    </Link>
  );
}

/* ── AUTH arcade control — layered pixel frame, mechanical press ── */
function AuthNavButton({ active, onClose }) {
  return (
    <>
      <span className="nav-auth-glow" aria-hidden="true" />
      <span className="nav-auth-shadow" aria-hidden="true" />
      <MotionLink
        to="/auth"
        onClick={onClose}
        className={`nav-auth-btn${active ? " nav-auth-act" : ""}`}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 520, damping: 22, mass: 0.6 } }}
        whileTap={{ y: 3, transition: { type: "spring", stiffness: 700, damping: 30, mass: 0.5 } }}
        aria-label="AUTH — open the FHC access terminal"
      >
        <span className="nav-auth-pink" aria-hidden="true" />
        <span className="nav-auth-face" aria-hidden="true" />
        <span className="nav-auth-scan" aria-hidden="true" />
        <span className="nav-auth-led" aria-hidden="true" />
        <span className="nav-auth-content">
          <span className="nav-auth-micro font-pixel">ACCESS</span>
          <span className="nav-auth-main font-pixel">
            <span className="nav-auth-icon" aria-hidden="true">▶</span>
            AUTH
          </span>
        </span>
      </MotionLink>
    </>
  );
}

/* ── PLAYER menu avatar — uploaded Cloudinary image when set, else the
   deterministic generated pixel avatar (single source: profile.avatar_url) ── */
function NavAvatar({ url, seed, size, className = "" }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className={`nav-player-avatar nav-player-avatar-img ${className}`}
        style={{ width: size, height: size, display: "block" }}
      />
    );
  }
  return <PixelAvatar seed={seed} size={size} className={`nav-player-avatar ${className}`} />;
}

/* ── PLAYER menu — avatar trigger + compact arcade dropdown ── */
function PlayerMenu({ name, seed, avatarUrl, onLoggedInChange, isAdmin = false }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const close = () => setOpen(false);

  const doLogout = async () => {
    close();
    await signOut();
    onLoggedInChange?.();
    navigate("/", { replace: true });
  };

  return (
    <div className="nav-player" ref={rootRef}>
      <button
        type="button"
        className={`nav-player-btn font-pixel${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="PLAYER MENU — member options"
        aria-expanded={open}
      >
        <NavAvatar url={avatarUrl} seed={seed} size={30} className="nav-player-avatar" />
        <span className="nav-player-name">{name}</span>
        <span className="nav-player-cheveron" aria-hidden="true">▼</span>
      </button>

      {open && (
        <div className="nav-player-menu font-pixel">
          <div className="nav-player-menu-head">
            <NavAvatar url={avatarUrl} seed={seed} size={34} className="nav-player-avatar" />
            <div className="min-w-0 flex-1">
              <div className="nav-player-menu-name">{name}</div>
              <div className="nav-player-menu-status mt-1">
                {isAdmin ? (
                  <span className="nav-player-online nav-player-admin">ADMIN</span>
                ) : (
                  <span className="nav-player-online">ONLINE</span>
                )}
              </div>
            </div>
          </div>
          <Link to="/dashboard" onClick={close} className="nav-player-menu-item">
            <span>DASHBOARD</span>
            <span className="nav-player-menu-arrow" aria-hidden="true">▶</span>
          </Link>
          {isAdmin && (
            <Link to="/admin" onClick={close} className="nav-player-menu-item is-admin">
              <span>ADMIN PANEL</span>
              <span className="nav-player-menu-arrow" aria-hidden="true">▶</span>
            </Link>
          )}
          <button type="button" onClick={doLogout} className="nav-player-menu-item is-logout">
            <span>LOG OUT</span>
            <span className="nav-player-menu-arrow" aria-hidden="true">⏻</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { hash, pathname } = useLocation();
  const { status, user, profile, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const isJoin = pathname === "/join";
  const isAuthActive = pathname === "/auth";
  const isAuthed = status === "authed";

  const isActive = (to) => (to === "/" ? pathname === to : pathname.startsWith(to));

  const name = isAuthed
    ? profile?.full_name || user?.user_metadata?.full_name || "PLAYER"
    : "";
  const seed = isAuthed ? profile?.avatar_seed || user?.id || "fhc" : "fhc";
  const avatarUrl = isAuthed ? profile?.avatar_url || "" : "";

  useEffect(() => {
    if (!hash || hash.length < 2) return;
    try {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } catch {
      /* hash is a URL token (e.g. #access_token=...) from an auth email link, not an anchor */
    }
  }, [hash]);

  return (
    <>
      <header
        className={`relative z-[10000]${isJoin ? ' join-nav-header' : ''}`}
      >
      {isJoin && (
        <style>{`
          .join-nav-header { margin: 6px; margin-bottom: 0; background: #08090B; }
          @media (min-width: 768px) { .join-nav-header { margin: 10px; margin-bottom: 0; } }
        `}</style>
      )}
      {/* ── Main pink navbar bar — arcade-framed ────────────── */}
      <div className="bg-pink relative border-4 border-ink">
        {/* Inner accent line */}
        <div className="absolute inset-[4px] border-2 border-ink/30 pointer-events-none" />
        <nav className="max-w-[1400px] mx-auto px-6 h-[108px] flex items-center">
          {/* Spacer for plaque width on desktop */}
          <div className="hidden lg:block shrink-0" style={{ width: 235 }} />

          {/* Desktop nav links */}
          <ul className="hidden lg:flex items-center gap-0">
            {LINKS.map((l, idx) => (
              <li key={l.label} className={`flex items-center${l.auth ? " nav-auth" : ""}`}>
                {l.auth ? (
                  isAuthed ? (
                    <PlayerMenu name={name} seed={seed} avatarUrl={avatarUrl} isAdmin={isAdmin} />
                  ) : (
                    <AuthNavButton active={isAuthActive} onClose={() => setOpen(false)} />
                  )
                ) : (
                  <DesktopNavLink
                    to={l.to}
                    label={l.label}
                    active={isActive(l.to)}
                    arrow={l.arrow}
                    onNavigate={() => setOpen(false)}
                  />
                )}
                {idx < LINKS.length - 1 && (
                  <span
                    className="select-none mx-1.5"
                    style={{
                      width: 2,
                      height: 28,
                      background: "#c4106a",
                      display: "inline-block",
                    }}
                  />
                )}
              </li>
            ))}
        </ul>

          {/* Mobile toggle — own black panel, upper-right, clear of the logo badge */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="lg:hidden absolute right-6 bottom-[16px] w-[58px] h-[52px] grid place-items-center bg-ink border-2 border-pink text-cream font-pixel text-sm"
            style={{
              clipPath:
                "polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
          >
            {open ? "✕" : "☰"}
          </button>
        </nav>
      </div>

      {/* ── FHC Logo Plaque — overlaps navbar bottom into hero ── */}
      <div
        className="absolute left-[15px] top-[18px] z-[60] pointer-events-auto"
      >
        <Link to="/" className="block relative" style={{ width: "min(260px, calc(100vw - 125px))", height: 155 }}>
          {/* Layer 1: Black outer shadow */}
          <div
            className="absolute bg-ink"
            style={{
              inset: 0,
              top: 7,
              left: 7,
              clipPath:
                "polygon(0 12px, 4px 8px, 8px 4px, 12px 0, calc(100% - 12px) 0, calc(100% - 8px) 4px, calc(100% - 4px) 8px, 100% 12px, 100% calc(100% - 12px), calc(100% - 4px) calc(100% - 8px), calc(100% - 8px) calc(100% - 4px), calc(100% - 12px) 100%, 12px 100%, 8px calc(100% - 4px), 4px calc(100% - 8px), 0 calc(100% - 12px))",
            }}
          />
          {/* Layer 2: Hot pink border */}
          <div
            className="absolute bg-pink"
            style={{
              inset: 0,
              clipPath:
                "polygon(0 12px, 4px 8px, 8px 4px, 12px 0, calc(100% - 12px) 0, calc(100% - 8px) 4px, calc(100% - 4px) 8px, 100% 12px, 100% calc(100% - 12px), calc(100% - 4px) calc(100% - 8px), calc(100% - 8px) calc(100% - 4px), calc(100% - 12px) 100%, 12px 100%, 8px calc(100% - 4px), 4px calc(100% - 8px), 0 calc(100% - 12px))",
            }}
          />
          {/* Layer 3: Black interior */}
          <div
            className="absolute bg-ink flex flex-col items-center justify-center"
            style={{
              top: 5,
              left: 5,
              right: 5,
              bottom: 5,
              clipPath:
                "polygon(0 10px, 4px 6px, 6px 4px, 10px 0, calc(100% - 10px) 0, calc(100% - 6px) 4px, calc(100% - 4px) 6px, 100% 10px, 100% calc(100% - 10px), calc(100% - 4px) calc(100% - 6px), calc(100% - 6px) calc(100% - 4px), calc(100% - 10px) 100%, 10px 100%, 6px calc(100% - 4px), 4px calc(100% - 6px), 0 calc(100% - 10px))",
            }}
          >
            <span
              className="font-pixel leading-none text-pink block mb-3"
              style={{ fontSize: 52 }}
            >
              FHC
            </span>
            <span className="font-pixel text-[10px] leading-[1.7] text-cream text-center block px-3">
              FISAT
              <br />
              HORIZON CLUB
            </span>
          </div>
        </Link>
      </div>
    </header>

    {/* ── Mobile navigation terminal — overlay drawer (<1024px) ── */}
    <MobileTerminal open={open} onClose={() => setOpen(false)} />
    </>
  );
}