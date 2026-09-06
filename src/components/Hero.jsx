import { Link } from "react-router-dom";
import laptop from "../assets/laptop.png";
import robot from "../assets/robot.png";
import microchip from "../assets/microchip.png";
import globe from "../assets/globe.png";
import terminal from "../assets/terminal.png";
import codeBubble from "../assets/code-bubble.png";
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
   HERO ART SCENE — laptop + orbiting devices + connectors
   Positions are relative to the RIGHT ART COL container.
   ═══════════════════════════════════════════════════════════════ */
const SCENE = {
  laptop: { x: 25, y: 25 },

  // upper-left of laptop
  chip: { x: 4, y: 8 },

  // directly above laptop
  bubble: { x: 40, y: 5 },

  // upper-right of laptop
  robot: { x: 72, y: 6 },

  // right side of laptop
  globe: { x: 89, y: 34 },

  // lower-right of laptop
  terminal: { x: 89, y: 66 },

  // lower-left of laptop
  cloud: { x: 5, y: 66 },
};

function CircuitConnections() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 6 }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* LAPTOP upper-left → CHIP: down then left */}
      <path
        d="M 2 15 L 2 12 L 4 12 L 4 10"
        stroke="#0c0c0f"
        strokeWidth="0.28"
        strokeDasharray="0.8,0.6"
        fill="none"
      />

      {/* LAPTOP upper-center → CODE BUBBLE: straight up */}
      <path
        d="M 25 12 L 25 8 L 40 8 L 40 6"
        stroke="#0c0c0f"
        strokeWidth="0.28"
        strokeDasharray="0.8,0.6"
        fill="none"
      />

      {/* LAPTOP upper-right → ROBOT: right then up */}
      <path
        d="M 48 15 L 58 15 L 58 10 L 72 10 L 72 8"
        stroke="#0c0c0f"
        strokeWidth="0.28"
        strokeDasharray="0.8,0.6"
        fill="none"
      />

      {/* LAPTOP right → GLOBE: horizontal right */}
      <path
        d="M 51 25 L 70 25 L 70 34 L 84 34"
        stroke="#0c0c0f"
        strokeWidth="0.28"
        strokeDasharray="0.8,0.6"
        fill="none"
      />

      {/* LAPTOP lower-right → TERMINAL: down then right */}
      <path
        d="M 48 38 L 70 38 L 70 58 L 84 58 L 84 64"
        stroke="#0c0c0f"
        strokeWidth="0.28"
        strokeDasharray="0.8,0.6"
        fill="none"
      />

      {/* LAPTOP lower-left → CLOUD: down then left */}
      <path
        d="M 2 38 L 2 58 L 5 58 L 5 64"
        stroke="#0c0c0f"
        strokeWidth="0.28"
        strokeDasharray="0.8,0.6"
        fill="none"
      />
    </svg>
  );
}

/* ── Floating Asset — anchored by its CENTER at SCENE[key] ───── */
function FloatingAsset({ src, alt, w, h, pos, delay = 0 }) {
  return (
    <div
      className="absolute"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 8,
        animation: "float 4.5s ease-in-out infinite",
        animationDelay: `${delay}s`,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: w,
          height: h,
          imageRendering: "pixelated",
          objectFit: "contain",
          display: "block",
          filter: "drop-shadow(4px 4px 0 0 #0c0c0f)",
        }}
      />
    </div>
  );
}

/* ── Retro Laptop ────────────────────────────────────────────── */
function RetroLaptop() {
  return (
    <div
      className="absolute"
      style={{
        left: `${SCENE.laptop.x}%`,
        top: `${SCENE.laptop.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 8,
        animation: "float 4.5s ease-in-out infinite",
        width: 430,
      }}
    >
      <img
        src={laptop}
        alt="FHC laptop"
        style={{
          width: "100%",
          height: "auto",
          imageRendering: "pixelated",
          display: "block",
        }}
      />
    </div>
  );
}

/* ── Right Tech Scene ────────────────────────────────────────── */
function HeroArt() {
  return (
    <div
      className="relative"
      style={{
        width: "100%",
        height: 560,
        zIndex: 5,
      }}
    >
      <CircuitConnections />

      <RetroLaptop />

      <FloatingAsset
        src={microchip}
        alt="Microchip"
        w={68}
        h={70}
        pos={SCENE.chip}
        delay={0}
      />

      <FloatingAsset
        src={codeBubble}
        alt="Code"
        w={88}
        h={58}
        pos={SCENE.bubble}
        delay={0.5}
      />

      <FloatingAsset
        src={robot}
        alt="FHC Robot"
        w={95}
        h={115}
        pos={SCENE.robot}
        delay={1}
      />

      <FloatingAsset
        src={globe}
        alt="Globe"
        w={85}
        h={87}
        pos={SCENE.globe}
        delay={1.5}
      />

      <FloatingAsset
        src={terminal}
        alt="Terminal"
        w={85}
        h={95}
        pos={SCENE.terminal}
        delay={2}
      />

      <FloatingAsset
        src={heroCloud}
        alt=""
        w={95}
        h={52}
        pos={SCENE.cloud}
        delay={2.5}
      />
    </div>
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
