import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { label: "HOME", to: "/", arrow: true },
  { label: "EVENTS", to: "/coming-soon" },
  { label: "PROJECTS", to: "/coming-soon" },
  { label: "TEAM", to: "/coming-soon" },
  { label: "GALLERY", to: "/coming-soon" },
  { label: "ABOUT", to: "/about" },
  { label: "JOIN", to: "/join" },
];

export default function Navbar() {
  const { hash, pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isJoin = pathname === "/join";

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
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
              <li key={l.to} className="flex items-center">
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

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="lg:hidden ml-auto w-12 h-12 grid place-items-center bg-ink text-cream font-pixel text-sm"
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
        <Link to="/" className="block relative" style={{ width: "min(260px, calc(100vw - 105px))", height: 155 }}>
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
              FULL FISAT
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
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block font-pixel text-[12px] px-4 py-3 border-2 border-ink text-center bg-ink text-cream"
                >
                  {l.arrow && <span className="mr-1">▶</span>}
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
