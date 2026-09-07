import { Link } from "react-router-dom";
import fhcMain from "../assets/FHC Main.png";
import heroCloud from "../assets/hero-cloud.png";
import heroGrass from "../assets/hero-grass-clean.png";

/* ═══════════════════════════════════════════════════════════════
   HERO — Retro Pixel-Art Game Title Screen
   ═══════════════════════════════════════════════════════════════ */

/* ── CRT Scanlines (subtle pixel texture) ────────────────────── */
function HeroScanlines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 2,
        background:
          "repeating-linear-gradient(to bottom, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 4px)",
      }}
    />
  );
}

/* ── Pixel Sparkles / Stars ──────────────────────────────────── */
function HeroSparks() {
  const sparks = [
    { color: "#ff2e8c", glyph: "✦", top: "8%", left: "32%", size: 10 },
    { color: "#ffd400", glyph: "+", top: "5%", left: "50%", size: 9 },
    { color: "#ffffff", glyph: "✦", top: "15%", left: "46%", size: 8 },
    { color: "#ff2e8c", glyph: "+", top: "40%", left: "4%", size: 9 },
    { color: "#5ab8ff", glyph: "✦", top: "30%", left: "3%", size: 10 },
    { color: "#ffffff", glyph: "+", top: "55%", left: "40%", size: 7 },
    { color: "#ffd400", glyph: "✦", top: "65%", left: "7%", size: 9 },
    { color: "#ffffff", glyph: "+", top: "3%", left: "7%", size: 8 },
    { color: "#5ab8ff", glyph: "✦", top: "20%", left: "66%", size: 7 },
    { color: "#ff2e8c", glyph: "✦", top: "46%", left: "95%", size: 8 },
    { color: "#ffd400", glyph: "+", top: "9%", left: "78%", size: 9 },
    { color: "#ffffff", glyph: "✦", top: "34%", left: "70%", size: 7 },
    { color: "#5ab8ff", glyph: "+", top: "58%", left: "56%", size: 8 },
    { color: "#ff2e8c", glyph: "✦", top: "72%", left: "91%", size: 9 },
  ];
  return sparks.map((s, i) => (
    <span
      key={i}
      className="hero-spark"
      style={{
        position: "absolute",
        top: s.top,
        left: s.left,
        color: s.color,
        fontSize: s.size,
        zIndex: 3,
        animationDelay: `${i * 0.35}s`,
      }}
    >
      {s.glyph}
    </span>
  ));
}

/* ── Floating Pixel Clouds in Sky ─────────────────────────────── */
function HeroClouds() {
  const clouds = [
    { left: "16%", top: "10%", width: 130, opacity: 0.92 },
    { left: "74%", top: "8%", width: 120, opacity: 0.90 },
    { left: "3%", top: "36%", width: 90, opacity: 0.85 },
    { left: "82%", top: "42%", width: 100, opacity: 0.82 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
      {clouds.map((cloud, i) => (
        <img
          key={i}
          src={heroCloud}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            left: cloud.left,
            top: cloud.top,
            width: cloud.width,
            height: "auto",
            opacity: cloud.opacity,
            imageRendering: "pixelated",
            display: "block",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}

/* ── Real Pixel-Art Ground Assets ─────────────────────────────── */
function GrassFloor() {
  return (
    <div
      className="absolute inset-x-0 bottom-0 pointer-events-none"
      style={{
        zIndex: 3,
        height: 65,
        overflow: "hidden",
      }}
    >
      <img
        src={heroGrass}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: 65,
          objectFit: "fill",
          imageRendering: "pixelated",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO ART — unified tech scene (FHC Main.png)
   Single composition: laptop, robot, globe, terminal, chip,
   code bubble, clouds and connecting details.
   ═══════════════════════════════════════════════════════════════ */

/* ── Unified Hero Illustration ──────────────────────────────── */
function HeroArt() {
  return (
    <img
      src={fhcMain}
      alt="FHC tech network — laptop, robot, globe, terminal and more"
      className="hero-art-img"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HERO COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Hero() {
  return (
    <section id="home" className="hero-window-frame">
      <div className="hero-sky-bg relative overflow-hidden" style={{ minHeight: 680 }}>
        <HeroScanlines />
        <HeroSparks />
        <HeroClouds />
        <GrassFloor />

        <div
          className="relative mx-auto px-6 md:px-8 hero-content-grid"
          style={{ maxWidth: 1440, zIndex: 6, paddingTop: 24, paddingBottom: 90 }}
        >
          {/* ── LEFT: Typography & CTA ──────────────────── */}
          <div className="hero-text-col">
            <div
              className="hero-init-chip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#0c0c0f",
                border: "3px solid #0c0c0f",
                padding: "10px 14px",
                marginBottom: 18,
                fontFamily: "var(--font-pixel)",
                fontSize: 11,
                color: "#ffffff",
                letterSpacing: 1,
              }}
            >
              <span style={{ color: "#39ff6a" }}>▶</span> INITIATING CONNECTION..
              <span className="animate-blink" style={{ color: "#39ff6a" }}>▌</span>
            </div>

            <h1
              className="font-pixel"
              style={{
                fontSize: "clamp(20px, 6vw, 28px)",
                color: "#0c0c0f",
                marginBottom: 8,
                lineHeight: 1.2,
                textShadow: "3px 3px 0 0 #0c0c0f",
              }}
            >
              WELCOME TO
            </h1>

            <h2
              className="font-pixel"
              style={{
                fontSize: "clamp(64px, 11vw, 145px)",
                lineHeight: 0.95,
                color: "#ff2e8c",
                marginBottom: 10,
                WebkitTextStroke: "6px #0c0c0f",
                paintOrder: "stroke fill",
                textShadow: "8px 8px 0 0 #0c0c0f",
                position: "relative",
              }}
            >
              FHC
            </h2>

            <div
              style={{
                display: "inline-block",
                background: "#0c0c0f",
                padding: "10px 18px",
                marginBottom: 18,
                border: "3px solid #0c0c0f",
                boxShadow: "5px 5px 0 0 #0c0c0f",
                whiteSpace: "nowrap",
              }}
            >
              <span className="font-pixel" style={{ fontSize: "clamp(8px, 3.2vw, 13px)", color: "#ffffff", letterSpacing: 1 }}>
                FISAT HORIZON CLUB_
              </span>
            </div>

            <p
              className="font-mono"
              style={{
                fontSize: 18,
                lineHeight: 1.55,
                color: "#0c0c0f",
                maxWidth: 440,
                marginBottom: 22,
                letterSpacing: 0.5,
                fontWeight: 600,
              }}
            >
              THE OFFICIAL TECH CLUB OF THE COMPUTER SCIENCE DEPARTMENT AT FISAT, DRIVING{" "}
              <span style={{ background: "#ff2e8c", color: "#0c0c0f", padding: "2px 8px", fontWeight: 700 }}>INNOVATION</span>,{" "}
              <span style={{ background: "#ff2e8c", color: "#0c0c0f", padding: "2px 8px", fontWeight: 700 }}>COLLABORATION</span>{" "}
              AND GROWTH THROUGH TECHNOLOGY.
            </p>

            <Link
              to="/join"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#ff2e8c",
                color: "#0c0c0f",
                border: "3px solid #0c0c0f",
                boxShadow: "5px 5px 0 0 #0c0c0f",
                padding: "14px 26px",
                fontFamily: "var(--font-pixel)",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1,
                cursor: "pointer",
                textDecoration: "none",
                transition: "transform 0.1s, box-shadow 0.1s",
                clipPath:
                  "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translate(3px, 3px)";
                e.currentTarget.style.boxShadow = "2px 2px 0 0 #0c0c0f";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "5px 5px 0 0 #0c0c0f";
              }}
            >
              <span>▶</span> JOIN THE CLUB
            </Link>
          </div>

          {/* ── RIGHT: Tech Scene ───────────────────────── */}
          <div className="hero-art-col">
            <HeroArt />
          </div>
        </div>
      </div>
    </section>
  );
}
