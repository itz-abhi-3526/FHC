import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PixelAvatar from "../components/PixelAvatar";

const LINKS = [
  { label: "HOME", to: "/", arrow: true },
  { label: "EVENTS", to: "/coming-soon" },
  { label: "PROJECTS", to: "/coming-soon" },
  { label: "TEAM", to: "/coming-soon" },
  { label: "GALLERY", to: "/coming-soon" },
  { label: "ABOUT", to: "/about" },
  { label: "JOIN", to: "/join" },
  { label: "AUTH", to: "/auth", auth: true },
];

const MotionLink = motion.create(Link);

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

/* ── PLAYER menu — avatar trigger + compact arcade dropdown ── */
function PlayerMenu({ name, email, seed, onLoggedInChange }) {
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
        <PixelAvatar seed={seed} size={30} className="nav-player-avatar" />
        <span className="nav-player-name">{name}</span>
        <span className="nav-player-cheveron" aria-hidden="true">▼</span>
      </button>

      {open && (
        <div className="nav-player-menu font-pixel">
          <div className="nav-player-menu-head">
            <PixelAvatar seed={seed} size={34} className="nav-player-avatar" />
            <div className="min-w-0 flex-1">
              <div className="nav-player-menu-name">{name}</div>
              <div className="nav-player-menu-mail">{email}</div>
              <div className="nav-player-menu-status mt-1"><span className="nav-player-online">ONLINE</span></div>
            </div>
          </div>
          <Link to="/dashboard#profile" onClick={close} className="nav-player-menu-item">
            <span>PROFILE</span>
            <span className="nav-player-menu-arrow" aria-hidden="true">▶</span>
          </Link>
          <Link to="/dashboard" onClick={close} className="nav-player-menu-item">
            <span>DASHBOARD</span>
            <span className="nav-player-menu-arrow" aria-hidden="true">▶</span>
          </Link>
          <Link to="/dashboard#account" onClick={close} className="nav-player-menu-item">
            <span>SETTINGS</span>
            <span className="nav-player-menu-arrow" aria-hidden="true">▶</span>
          </Link>
          <button type="button" onClick={doLogout} className="nav-player-menu-item is-logout">
            <span>LOG OUT</span>
            <span className="nav-player-menu-arrow" aria-hidden="true">⏻</span>
          </button>
          <div className="nav-player-menu-foot">
            FHC // MEMBER SESSION
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { hash, pathname } = useLocation();
  const { status, user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isJoin = pathname === "/join";
  const isAuthActive = pathname === "/auth";
  const isAuthed = status === "authed";

  const name = isAuthed
    ? profile?.full_name || user?.user_metadata?.full_name || "PLAYER"
    : "";
  const email = isAuthed ? profile?.email || user?.email || "" : "";
  const seed = isAuthed
    ? profile?.avatar_seed || user?.id || email || "fhc"
    : "fhc";

  const handleMobileLogout = async () => {
    setOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

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
              <li key={l.to} className={`flex items-center${l.auth ? " nav-auth" : ""}`}>
                {l.auth ? (
                  isAuthed ? (
                    <PlayerMenu name={name} email={email} seed={seed} />
                  ) : (
                    <AuthNavButton active={isAuthActive} onClose={() => setOpen(false)} />
                  )
                ) : (
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="font-pixel text-[18px] text-ink hover:text-cream transition-colors px-3 py-2 whitespace-nowrap"
                  >
                    {l.arrow && (
                      <span
                        className="mr-2 inline-block"
                        style={{
                          width: 0,
                          height: 0,
                          borderTop: "6px solid transparent",
                          borderBottom: "6px solid transparent",
                          borderLeft: "10px solid #0c0c0f",
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                    {l.label}
                  </Link>
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

      {/* ── Mobile dropdown ──────────────────────────────────── */}
      {open && (
        <div className="lg:hidden border-b-4 border-ink bg-pink absolute top-full left-0 right-0 z-40">
          <ul className="px-6 py-4 flex flex-col gap-2 max-h-[calc(100dvh-140px)] overflow-y-auto">
            {isAuthed && (
              <li>
                <div className="nav-auth-mobile flex items-start gap-3 justify-start mb-2 max-w-none">
                  <PixelAvatar seed={seed} size={34} className="nav-player-avatar shrink-0" />
                  <div className="min-w-0">
                    <div className="nav-player-menu-name text-left">{name}</div>
                    <div className="nav-player-menu-mail text-left">{email}</div>
                    <div className="nav-player-menu-status mt-1 text-left">
                      <span className="nav-player-online">ONLINE</span>
                    </div>
                  </div>
                </div>
              </li>
            )}
            {LINKS.map((l) => (
              <li key={l.to}>
                {l.auth ? (
                  isAuthed ? (
                    <div className="flex flex-col gap-2">
                      {[
                        { label: "PROFILE", to: "/dashboard#profile" },
                        { label: "DASHBOARD", to: "/dashboard" },
                        { label: "SETTINGS", to: "/dashboard#account" },
                      ].map((m) => (
                        <Link
                          key={m.label}
                          to={m.to}
                          onClick={() => setOpen(false)}
                          className="block font-pixel text-[12px] px-4 py-3 border-2 border-ink text-center bg-ink text-cream text-left"
                        >
                          {m.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={handleMobileLogout}
                        className="block font-pixel text-[12px] px-4 py-3 border-2 border-ink text-center bg-ink text-pink text-left"
                      >
                        LOG OUT
                      </button>
                    </div>
                  ) : (
                    <Link
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className={`nav-auth-mobile font-pixel${isAuthActive ? " nav-auth-mobile-act" : ""}`}
                    >
                      <span className="nav-auth-mobile-edge" aria-hidden="true" />
                      <span className="nav-auth-mobile-main">
                        <span className="nav-auth-icon" aria-hidden="true">▶</span>
                        AUTH
                      </span>
                      <span className="nav-auth-mobile-micro font-pixel">ACCESS</span>
                    </Link>
                  )
                ) : (
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="block font-pixel text-[12px] px-4 py-3 border-2 border-ink text-center bg-ink text-cream"
                  >
                    {l.arrow && <span className="mr-1">▶</span>}
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}