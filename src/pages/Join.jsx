import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import PlayerPreviewViewport from "../components/arcade/PlayerPreviewViewport";
import PageFrame from "../components/PageFrame";
import JoinBackground from "../components/arcade/JoinBackground";
import HolographicPortal from "../components/arcade/HolographicPortal";

import fhcController from "../assets/fhc-controller.png";
import fhcHeart from "../assets/fhc-heart.png";

const INK = "#08090B";
const PK = "#FF1687";
const CR = "#FFF7E5";
const CY = "#1ED7E8";
const PU = "#9B59FF";
const GR = "#36D65A";
const YL = "#FFD21A";
const BL = "#238BE6";
const DP = "#17101F";

const DOMAINS = [
  { icon: "🌐", label: "Web Development", desc: "BUILD THE WORLD", color: GR, num: "01" },
  { icon: "🧠", label: "Artificial Intelligence", desc: "THINK BEYOND", color: PK, num: "02" },
  { icon: "🛡️", label: "Cyber Security", desc: "DEFEND THE CODE", color: BL, num: "03" },
  { icon: "📶", label: "Internet of Things", desc: "CONNECT ALL", color: CY, num: "04" },
  { icon: "✏️", label: "UI/UX Design", desc: "CRAFT THE FEEL", color: "#FF4500", num: "05" },
  { icon: "📣", label: "Content & Media", desc: "TELL THE STORY", color: PU, num: "06" },
  { icon: "📖", label: "Documentation", desc: "WRITE THE LEGEND", color: PU, num: "07" },
];

const BRANCHES = [
  "Select your year & branch", "S2 Computer Science", "S4 Computer Science",
  "S6 Computer Science", "S8 Computer Science", "S4 CS (AI & ML)",
  "S6 CS (AI & ML)", "S4 Information Technology", "S6 Information Technology",
];

/* ═══════════════════════════════════════════════════════════════
   MASTER JOIN FRAME — ONE continuous arcade machine bezel
   wraps the entire /join page as a single FHC system
   ═══════════════════════════════════════════════════════════════ */
const MJF_CY = "#00E5FF";
const MJF_PK = "#FF007F";
const MJF_BG = "#03050B";

function MasterJoinFrame({ children }) {
  return (
    <PageFrame bg={MJF_BG}>
      <JoinBackground />
      {children}
    </PageFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION DIVIDER — HUD-style internal system divider
   ═══════════════════════════════════════════════════════════════ */
function SectionDivider({ leftLabel, rightLabel, color = MJF_CY }) {
  return (
    <div className="relative" style={{ padding: "16px 0", zIndex: 30 }}>
      {/* Main divider line */}
      <div className="flex items-center gap-3" style={{ padding: "0 clamp(16px, 5vw, 48px)" }}>
        {/* Left label */}
        <span className="font-pixel shrink-0 max-md:hidden" style={{ fontSize: 6, letterSpacing: "0.18em", color: MJF_CY, opacity: 0.35 }}>{leftLabel}</span>
        {/* Dashed line — left */}
        <div style={{ flex: 1, borderTop: `1px dashed ${MJF_CY}15` }} />
        {/* Center diamond */}
        <div className="w-[5px] h-[5px] rotate-45 shrink-0" style={{ background: color, opacity: 0.4 }} />
        {/* Dashed line — right */}
        <div style={{ flex: 1, borderTop: `1px dashed ${MJF_CY}15` }} />
        {/* Right label */}
        <span className="font-pixel shrink-0 max-md:hidden" style={{ fontSize: 6, letterSpacing: "0.18em", color: MJF_CY, opacity: 0.35 }}>{rightLabel}</span>
      </div>
      {/* Tiny status nodes */}
      <div className="absolute top-1/2 -translate-y-1/2 max-md:hidden" style={{ left: "calc(48px + 25%)" }}>
        <div className="w-[3px] h-[3px] rounded-full" style={{ background: MJF_PK, opacity: 0.3 }} />
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 max-md:hidden" style={{ right: "calc(48px + 25%)" }}>
        <div className="w-[3px] h-[3px] rounded-full" style={{ background: MJF_CY, opacity: 0.25 }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 01 — HERO
   FHC PLAYER ENTRY / CHARACTER SELECT — premium arcade HUD
   ═══════════════════════════════════════════════════════════════ */
const HC_BG = "#03050B";
const HC_CY = "#00E5FF";
const HC_PK = "#FF007F";
const HC_CR = "#FFF4D6";
const HC_GR = "#4CFF4C";
const HC_YL = "#FFD400";

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: HC_BG, minHeight: "100vh" }}>

      {/* ═══ TEXTURE LAYERS ═══ */}
      <div className="term-scanlines" />
      <div className="term-grid" />
      <div className="term-crt-sweep" />

      {/* ═══ SPARSE TECHNICAL MARKERS ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[4] max-md:hidden">
        <span className="absolute font-pixel" style={{ left: "3%", top: "8%", fontSize: 5, color: HC_CY, opacity: 0.12 }}>FHC // PLAYER ENTRY</span>
        <span className="absolute font-pixel" style={{ right: "3%", top: "6%", fontSize: 5, color: HC_PK, opacity: 0.1 }}>SYS_RDY</span>
        <span className="absolute font-pixel" style={{ left: "4%", bottom: "8%", fontSize: 5, color: HC_CY, opacity: 0.08 }}>INITIALIZING</span>
        <span className="absolute font-pixel" style={{ right: "4%", bottom: "10%", fontSize: 5, color: HC_GR, opacity: 0.08 }}>HORIZON_v2.6</span>
        <span className="absolute font-pixel" style={{ left: "15%", bottom: "15%", fontSize: 5, color: HC_CY, opacity: 0.06 }}>NODE // ACTIVE</span>
        <span className="absolute font-pixel" style={{ right: "15%", bottom: "18%", fontSize: 5, color: HC_PK, opacity: 0.06 }}>CORE // ONLINE</span>
        <span className="absolute" style={{ left: "6%", top: "30%", width: 3, height: 3, background: HC_CY, opacity: 0.08 }} />
        <span className="absolute" style={{ left: "18%", top: "65%", width: 2, height: 2, background: HC_PK, opacity: 0.06 }} />
        <span className="absolute" style={{ right: "12%", top: "25%", width: 2, height: 2, background: HC_PK, opacity: 0.06 }} />
        <span className="absolute" style={{ right: "8%", bottom: "30%", width: 3, height: 3, background: HC_CY, opacity: 0.06 }} />
        <span className="absolute" style={{ left: "50%", top: "6%", width: 4, height: 1, background: HC_CY, opacity: 0.06 }} />
        <span className="absolute" style={{ right: "30%", bottom: "6%", width: 4, height: 1, background: HC_PK, opacity: 0.06 }} />
      </div>

      {/* ═══ TOP HUD STRIP ═══ */}
      <div className="absolute top-[14px] left-0 right-0 z-40 pointer-events-none flex items-center px-[40px] max-md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-[4px] h-[4px]" style={{ background: HC_GR, boxShadow: `0 0 4px ${HC_GR}50` }} />
          <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.2em", color: HC_CY, opacity: 0.55 }}>FHC // PLAYER ENTRY</span>
        </div>
        <div className="flex-1 mx-4" style={{ height: 1, background: `${HC_CY}18` }} />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-[4px] h-[4px] rounded-full" style={{ background: HC_CY, opacity: 0.6, animation: "term-led 1.4s steps(1) infinite" }} />
            <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.15em", color: HC_CY, opacity: 0.4 }}>SYSTEM ONLINE</span>
          </div>
          <div style={{ width: 1, height: 8, background: `${HC_CY}15` }} />
          <div className="flex items-center gap-2">
            <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.15em", color: HC_PK, opacity: 0.45 }}>NEW PLAYER DETECTED</span>
            <span style={{ display: "inline-block", width: 5, height: 5, background: HC_PK, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      {/* ═══ MAIN TWO-COLUMN LAYOUT ═══ */}
      <div
        className="relative z-10 mx-auto grid hero-grid-responsive"
        style={{
          maxWidth: 1400,
          width: "100%",
          padding: "110px 48px 40px",
          gridTemplateColumns: "44% 56%",
          gap: "0 24px",
          alignItems: "center",
        }}
      >
        <style>{`
          @media (max-width: 1023px) {
            .hero-grid-responsive { grid-template-columns: 1fr !important; gap: 32px !important; }
            .hero-link-overlay { display: none !important; }
          }
          @media (max-width: 767px) {
            .hero-grid-responsive { padding: 90px 20px 32px !important; }
          }
        `}</style>

        {/* ═══ SUBTLE CONNECTION HUD — left ↔ right ═══ */}
        <div className="absolute pointer-events-none hero-link-overlay" style={{
          left: "47%", top: "32%", width: "6%", height: "36%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 12, zIndex: 0,
        }}>
          <div className="w-[3px] h-[3px]" style={{ background: HC_CY, opacity: 0.2 }} />
          <div style={{ width: 20, height: 1, background: `${HC_CY}15` }} />
          <div className="w-[2px] h-[2px] rounded-full" style={{ background: HC_PK, opacity: 0.25 }} />
          <div style={{ width: 36, height: 1, background: `linear-gradient(90deg, ${HC_CY}10, ${HC_PK}15, ${HC_CY}10)` }} />
          <span className="font-pixel" style={{ fontSize: 4, letterSpacing: "0.25em", color: HC_CY, opacity: 0.12 }}>LINK</span>
          <div style={{ width: 1, height: 22, background: `${HC_CY}0c` }} />
          <div className="flex items-center" style={{ gap: 5 }}>
            <div className="w-[2px] h-[2px]" style={{ background: HC_CY, opacity: 0.15 }} />
            <div className="w-[2px] h-[2px]" style={{ background: HC_PK, opacity: 0.12 }} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            LEFT COLUMN — JOIN IDENTITY + CTA
            ═══════════════════════════════════════════ */}
        <div className="flex flex-col" style={{ paddingTop: 24 }}>

          {/* ── MAIN TITLE ── */}
          <div style={{ marginBottom: 28, position: "relative" }}>
            {/* Initialization label */}
            <div className="flex items-center gap-2 mb-2 max-md:hidden">
              <div className="w-[3px] h-[3px]" style={{ background: HC_CY, opacity: 0.3 }} />
              <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.2em", color: HC_CY, opacity: 0.35 }}>INITIALIZING JOURNEY...</span>
            </div>
            {/* JOIN_ — cream */}
            <div style={{ position: "relative", zIndex: 2 }}>
              <h1 className="font-pixel leading-none" style={{
                fontSize: "clamp(44px, 5.5vw, 80px)", color: HC_CR, marginBottom: 0,
                letterSpacing: -1, lineHeight: 0.95,
              }}>
                JOIN<span className="term-blink" style={{ color: HC_PK }}>_</span>
              </h1>
              <h1 className="font-pixel leading-none" aria-hidden="true" style={{
                fontSize: "clamp(44px, 5.5vw, 80px)", color: HC_CY, marginBottom: 0,
                letterSpacing: -1, lineHeight: 0.95, position: "absolute", top: 3, left: 3, zIndex: 1, opacity: 0.2,
              }}>
                JOIN_
              </h1>
            </div>
            {/* FHC — hot pink */}
            <div style={{ position: "relative", zIndex: 2, marginTop: 6 }}>
              <h2 className="font-pixel font-bold leading-none" style={{
                fontSize: "clamp(52px, 7vw, 100px)", color: HC_PK, marginBottom: 0,
                letterSpacing: -1,
              }}>
                FHC
              </h2>
              <h2 className="font-pixel font-bold leading-none" aria-hidden="true" style={{
                fontSize: "clamp(52px, 7vw, 100px)", color: HC_CY, marginBottom: 0,
                letterSpacing: -1, position: "absolute", top: 3, left: 3, zIndex: 1, opacity: 0.18,
              }}>
                FHC
              </h2>
            </div>
            {/* Player slot indicator */}
            <div className="flex items-center gap-2 mt-2 max-md:hidden">
              <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: HC_PK, opacity: 0.3 }}>PLAYER SLOT // 01</span>
              <div className="w-[3px] h-[3px]" style={{ background: HC_PK, opacity: 0.2 }} />
              <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: HC_CY, opacity: 0.25 }}>INITIALIZING</span>
            </div>
          </div>

          {/* ── FHC PLAYER SYSTEM MESSAGE PANEL ── */}
          <div style={{
            position: "relative", background: "#030508", border: `1px solid ${HC_CY}30`,
            padding: "14px 18px", marginBottom: 22, maxWidth: 420,
          }}>
            {/* Corner brackets */}
            <div style={{ position: "absolute", top: -1, left: -1, width: 7, height: 7, borderTop: `1px solid ${HC_CY}80`, borderLeft: `1px solid ${HC_CY}80` }} />
            <div style={{ position: "absolute", top: -1, right: -1, width: 7, height: 7, borderTop: `1px solid ${HC_CY}80`, borderRight: `1px solid ${HC_CY}80` }} />
            <div style={{ position: "absolute", bottom: -1, left: -1, width: 7, height: 7, borderBottom: `1px solid ${HC_CY}80`, borderLeft: `1px solid ${HC_CY}80` }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 7, height: 7, borderBottom: `1px solid ${HC_CY}80`, borderRight: `1px solid ${HC_CY}80` }} />
            {/* Scanline texture */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(to bottom, rgba(0,229,255,0.012) 0px, rgba(0,229,255,0.012) 1px, transparent 1px, transparent 4px)" }} />
            {/* Pink accent dot */}
            <div className="absolute top-2 right-2 w-[4px] h-[4px]" style={{ background: HC_PK, opacity: 0.5 }} />

            {/* Header */}
            <div className="flex items-center gap-2 max-md:hidden" style={{ marginBottom: 8 }}>
              <span style={{ display: "inline-block", width: 4, height: 4, background: HC_PK }} />
              <span className="font-pixel" style={{ fontSize: 8, letterSpacing: "0.12em", color: HC_CY, opacity: 0.6 }}>FHC // PLAYER SYSTEM</span>
            </div>
            {/* Message text */}
            <p className="font-pixel" style={{ fontSize: 11, color: HC_CR, lineHeight: 1.7, marginBottom: 4 }}>
              YOU&apos;RE NOT JUST JOINING A CLUB.
            </p>
            <p className="font-pixel" style={{ fontSize: 11, color: HC_CY, lineHeight: 1.7, opacity: 0.75 }}>
              YOU&apos;RE ENTERING A COMMUNITY THAT{" "}
              <span style={{ color: HC_PK, opacity: 1 }}>BUILDS</span>,{" "}
              <span style={{ color: HC_CY, opacity: 1 }}>EXPLORES</span>, AND{" "}
              <span style={{ color: HC_GR, opacity: 1 }}>CREATES</span>{" "}
              TOGETHER.
            </p>
          </div>

          {/* ── CONNECTING DETAIL ── */}
          <div className="flex items-center max-md:hidden" style={{ marginBottom: 24 }}>
            <div style={{ width: 18, height: 1, background: `${HC_CY}25` }} />
            <div className="w-[3px] h-[3px] rotate-45" style={{ background: HC_CY, opacity: 0.45 }} />
            <div style={{ width: 36, height: 1, background: `linear-gradient(90deg, ${HC_CY}25, ${HC_PK}25)` }} />
            <div className="w-[3px] h-[3px] rounded-full" style={{ background: HC_PK, opacity: 0.45 }} />
            <div style={{ width: 18, height: 1, background: `${HC_PK}20` }} />
          </div>

          {/* ── CREATE PLAYER BUTTON — arcade START ── */}
          <div style={{ position: "relative", marginBottom: 14, width: "fit-content" }}>
            {/* Corner brackets — tightly framing the button */}
            {/* Top-left */}
            <div style={{ position: "absolute", top: -4, left: -4, width: 10, height: 1, background: HC_PK, opacity: 0.7 }} />
            <div style={{ position: "absolute", top: -4, left: -4, width: 1, height: 10, background: HC_PK, opacity: 0.7 }} />
            {/* Top-right */}
            <div style={{ position: "absolute", top: -4, right: -4, width: 10, height: 1, background: HC_PK, opacity: 0.7 }} />
            <div style={{ position: "absolute", top: -4, right: -4, width: 1, height: 10, background: HC_PK, opacity: 0.7 }} />
            {/* Bottom-left */}
            <div style={{ position: "absolute", bottom: -4, left: -4, width: 10, height: 1, background: HC_PK, opacity: 0.7 }} />
            <div style={{ position: "absolute", bottom: -4, left: -4, width: 1, height: 10, background: HC_PK, opacity: 0.7 }} />
            {/* Bottom-right */}
            <div style={{ position: "absolute", bottom: -4, right: -4, width: 10, height: 1, background: HC_PK, opacity: 0.7 }} />
            <div style={{ position: "absolute", bottom: -4, right: -4, width: 1, height: 10, background: HC_PK, opacity: 0.7 }} />
            {/* Inner accent corners */}
            <div style={{ position: "absolute", top: -1, left: -1, width: 6, height: 1, background: HC_CY, opacity: 0.25 }} />
            <div style={{ position: "absolute", top: -1, left: -1, width: 1, height: 6, background: HC_CY, opacity: 0.25 }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 6, height: 1, background: HC_CY, opacity: 0.25 }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 1, height: 6, background: HC_CY, opacity: 0.25 }} />

            <a
              href="#create-profile"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("create-profile")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group relative inline-flex items-center gap-3"
              id="create-player-btn"
              style={{
                background: "#030508", color: HC_CR,
                border: `2px solid ${HC_PK}`,
                boxShadow: `inset 0 0 0 3px #030508, inset 0 0 0 4px ${HC_PK}50, 0 0 0 1px #1E90FF20`,
                padding: "16px clamp(18px, 6vw, 38px)", fontFamily: "var(--font-pixel)", fontSize: "clamp(11px, 3vw, 16px)",
                letterSpacing: 2, cursor: "pointer", textDecoration: "none",
                transition: "background 0.1s steps(2), color 0.1s steps(2), box-shadow 0.15s, transform 0.08s steps(2)",
                overflow: "hidden", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = HC_PK;
                e.currentTarget.style.color = "#030508";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `inset 0 0 0 3px #030508, inset 0 0 0 4px ${HC_PK}, 0 0 0 1px #1E90FF40, 0 0 28px ${HC_PK}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#030508";
                e.currentTarget.style.color = HC_CR;
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = `inset 0 0 0 3px #030508, inset 0 0 0 4px ${HC_PK}50, 0 0 0 1px #1E90FF20`;
              }}
            >
              {/* Scanline sweep on hover (CSS-driven) */}
              <span className="absolute inset-0 pointer-events-none" style={{
                background: `linear-gradient(90deg, transparent, ${HC_CY}15, transparent)`,
                transform: "translateX(-100%)",
                transition: "transform 0.4s ease",
              }} />
              <span style={{ fontSize: 14 }} className="group-hover:translate-x-0.5 transition-transform" transition="transform 0.1s steps(2)">&#x25B6;</span> CREATE PLAYER
            </a>
          </div>

          {/* PRESS START */}
          <div className="flex items-center gap-2">
            <span className="font-pixel" style={{ fontSize: 9, letterSpacing: 1, color: HC_PK, opacity: 0.65 }}>
              &gt;&gt; PRESS START TO BEGIN
            </span>
            <span className="term-blink" style={{ display: "inline-block", width: 6, height: 10, background: HC_PK, opacity: 0.35 }} />
          </div>

          {/* ── Small system metadata ── */}
          <div className="flex items-center gap-3 mt-5 max-md:hidden" style={{ opacity: 0.3 }}>
            <span className="font-pixel" style={{ fontSize: 6, color: HC_CY, letterSpacing: "0.15em" }}>FHC</span>
            <div style={{ width: 3, height: 3, background: HC_CY, opacity: 0.5 }} />
            <span className="font-pixel" style={{ fontSize: 6, color: HC_CY, letterSpacing: "0.15em" }}>CORE</span>
            <div style={{ width: 3, height: 3, background: HC_PK, opacity: 0.5 }} />
            <span className="font-pixel" style={{ fontSize: 6, color: HC_PK, letterSpacing: "0.15em" }}>v2.6</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            RIGHT COLUMN — PLAYER 01 // CHARACTER
            ═══════════════════════════════════════════ */}
        <div className="flex flex-col items-center" style={{ paddingTop: 16 }}>
          {/* ── PLAYER PREVIEW — main focal point ── */}
          <div className="relative" style={{ width: "100%", maxWidth: 400 }}>
            <PlayerPreviewViewport playerSlot={1} />
          </div>

          {/* ── Status line ── */}
          <div className="flex items-center gap-2 mt-3">
            <div style={{ width: 12, height: 1, background: `${HC_CY}20` }} />
            <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.12em", color: HC_CY, opacity: 0.35 }}>
              FHC NETWORK // READY FOR NEW CONTRIBUTORS
            </span>
            <div style={{ width: 12, height: 1, background: `${HC_CY}20` }} />
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM HUD ═══ */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none max-md:hidden">
        <div style={{ borderTop: `1px solid #1E90FF12`, margin: "0 48px" }} />
        <div className="flex items-center justify-between" style={{ padding: "10px 48px", maxWidth: 1400, margin: "0 auto" }}>
          <div className="flex flex-col gap-1">
            <span className="font-pixel" style={{ fontSize: 7, letterSpacing: 1, color: HC_CY, opacity: 0.3 }}>FHC // PLAYER ENTRY</span>
            <div className="flex" style={{ gap: 1 }}>
              {[1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0].map((f, i) => (
                <div key={i} style={{ width: 6, height: 2, background: f ? HC_PK : "rgba(255,255,255,0.06)" }} />
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span style={{ color: HC_YL, fontSize: 10, opacity: 0.4 }}>&#x2726;</span>
            <div className="flex items-end" style={{ gap: 2 }}>
              <div style={{ width: 3, height: 5, background: HC_CY, opacity: 0.3 }} />
              <div style={{ width: 3, height: 9, background: HC_CY, opacity: 0.3 }} />
              <div style={{ width: 3, height: 4, background: HC_CY, opacity: 0.3 }} />
              <div style={{ width: 3, height: 7, background: HC_CY, opacity: 0.3 }} />
            </div>
            <span className="font-pixel" style={{ fontSize: 7, letterSpacing: 1, color: HC_CY, opacity: 0.25 }}>FHC NETWORK // READY</span>
          </div>
          <span className="font-pixel" style={{ fontSize: 7, letterSpacing: 1, color: HC_CY, opacity: 0.3, textAlign: "right" }}>
            PRESS START TO ENTER THE HORIZON_ <span style={{ color: HC_PK, opacity: 0.35 }}>&gt;&gt;</span>
          </span>
        </div>
      </div>

    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 02 — CREATE YOUR PROFILE
   FHC Player Creation Terminal — premium arcade
   ═══════════════════════════════════════════════════════════════ */
const CP_BG = "#030711";
const CP_DK = "#08090B";
const CP_CR = "#FFF4D6";
const CP_CY = "#00E5FF";
const CP_PK = "#FF007F";
const CP_GR = "#4CFF4C";
const CP_BLUE = "#1E90FF";

function CreateProfile({ onSubmit, form, setForm }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const selected = DOMAINS.find((d) => d.label === form.domain);
  const BLUE = CP_BLUE;

  return (
    <div id="create-profile" className="scroll-mt-32">
      <section className="relative overflow-hidden" style={{ background: CP_BG }}>

        {/* ═══ CRT SCANLINES ═══ */}
        <div className="absolute inset-0 pointer-events-none z-[1]"
          style={{ background: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)" }} />

        {/* ═══ PIXEL GRID ═══ */}
        <div className="absolute inset-0 pointer-events-none z-[1]"
          style={{ backgroundImage: `linear-gradient(${BLUE}08 1px, transparent 1px), linear-gradient(90deg, ${BLUE}08 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />

        {/* ═══ CRT SWEEP ═══ */}
        <div className="pointer-events-none absolute left-0 right-0 h-[160px] z-[2]"
          style={{ background: `linear-gradient(to bottom, transparent, ${CP_CY}06, ${CP_CY}0c, ${CP_CY}06, transparent)`, animation: "term-crt-sweep 7s linear infinite" }} />

        {/* ═══ DECORATIVE PIXELS ═══ */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
          <span className="absolute" style={{ left: "7%", top: "15%", width: 3, height: 3, background: CP_CY, opacity: 0.18 }} />
          <span className="absolute" style={{ left: "92%", top: "20%", width: 2, height: 2, background: CP_CY, opacity: 0.14 }} />
          <span className="absolute" style={{ left: "14%", top: "78%", width: 2, height: 2, background: CP_CY, opacity: 0.12 }} />
          <span className="absolute" style={{ left: "88%", top: "72%", width: 3, height: 3, background: CP_CY, opacity: 0.1 }} />
          <span className="absolute" style={{ left: "5%", top: "45%", width: 2, height: 2, background: CP_PK, opacity: 0.15 }} />
          <span className="absolute" style={{ left: "95%", top: "50%", width: 2, height: 2, background: CP_PK, opacity: 0.12 }} />
          <span className="absolute" style={{ left: "20%", top: "12%", width: 2, height: 2, background: YL, opacity: 0.1 }} />
          <span className="absolute" style={{ left: "80%", top: "85%", width: 2, height: 2, background: YL, opacity: 0.08 }} />
          <span className="absolute" style={{ left: "10%", top: "60%", width: 2, height: 2, background: CP_GR, opacity: 0.1 }} />
          <span className="absolute" style={{ left: "90%", top: "40%", width: 2, height: 2, background: CP_GR, opacity: 0.08 }} />
          <span className="absolute font-pixel" style={{ left: "8%", top: "30%", fontSize: 8, color: CP_CY, opacity: 0.08 }}>+</span>
          <span className="absolute font-pixel" style={{ left: "93%", top: "65%", fontSize: 7, color: CP_CY, opacity: 0.06 }}>+</span>
          <span className="absolute font-pixel" style={{ left: "25%", top: "88%", fontSize: 6, color: CP_CY, opacity: 0.05 }}>+</span>
          <span className="absolute font-pixel" style={{ left: "4%", top: "88%", fontSize: 5, color: CP_CY, opacity: 0.06 }}>0x3F</span>
          <span className="absolute font-pixel" style={{ right: "4%", top: "12%", fontSize: 5, color: CP_PK, opacity: 0.05 }}>SYS_OK</span>
        </div>

        {/* ═══ TOP SYSTEM BAR ═══ */}
        <div className="absolute top-[14px] left-0 right-0 z-30 pointer-events-none flex items-center px-[32px] max-md:hidden">
          <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.2em", color: CP_CY, opacity: 0.5 }}>FHC // PLAYER CREATION</span>
          <div className="flex-1 mx-3" style={{ height: 1, background: `${CP_CY}18` }} />
          <div className="flex items-center gap-2">
            <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.2em", color: CP_CY, opacity: 0.5 }}>PROFILE INITIALIZATION // 01</span>
            <div className="w-[4px] h-[4px]" style={{ background: CP_GR, boxShadow: `0 0 4px ${CP_GR}50` }} />
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="relative z-10 mx-auto" style={{ maxWidth: 1100, padding: "70px 32px 50px" }}>

          {/* ═══ HEADER ═══ */}
          <div className="relative text-center" style={{ marginBottom: 36 }}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 1, background: CP_PK, opacity: 0.5 }} />
                <div className="w-[4px] h-[4px]" style={{ background: CP_PK, opacity: 0.6 }} />
              </div>
              <h2 className="font-pixel tracking-wider font-bold" style={{ fontSize: "clamp(22px, 3vw, 32px)", color: CP_CR, letterSpacing: 3 }}>CREATE YOUR PROFILE</h2>
              <div className="flex items-center gap-2">
                <div className="w-[4px] h-[4px]" style={{ background: CP_PK, opacity: 0.6 }} />
                <div style={{ width: 8, height: 1, background: CP_PK, opacity: 0.5 }} />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <div style={{ width: 40, height: 1, background: `${CP_CY}35` }} />
              <p className="font-pixel text-center" style={{ fontSize: "clamp(8px, 1vw, 11px)", color: CP_CY, letterSpacing: "0.12em", opacity: 0.75 }}>
                FILL IN YOUR DETAILS AND LET&apos;S START YOUR JOURNEY WITH FHC!
              </p>
              <div style={{ width: 40, height: 1, background: `${CP_CY}35` }} />
            </div>

            <div className="flex items-center justify-center gap-3 max-md:hidden">
              <div style={{ width: 40, height: 1, background: CP_CY, opacity: 0.15 }} />
              <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.2em", color: CP_CY, opacity: 0.3 }}>NEW PLAYER DETECTED</span>
              <div style={{ width: 4, height: 4, background: CP_PK, opacity: 0.4 }} className="term-led" />
              <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.2em", color: CP_CY, opacity: 0.3 }}>SYSTEM READY</span>
              <div style={{ width: 40, height: 1, background: CP_CY, opacity: 0.15 }} />
            </div>
          </div>

          <form id="join-form" onSubmit={onSubmit}>
            {/* ═══ UNIFIED PLAYER CREATION TERMINAL ═══ */}
            <div className="relative" style={{ background: CP_DK, border: `2px solid ${CP_CY}25`, borderRadius: 0 }}>

              {/* Terminal header bar */}
              <div className="flex items-center justify-between px-5 py-2.5 max-md:hidden" style={{ borderBottom: `1px solid ${CP_CY}18` }}>
                <div className="flex items-center gap-2">
                  <div className="w-[4px] h-[4px]" style={{ background: CP_PK, opacity: 0.6 }} />
                  <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.2em", color: CP_CY, opacity: 0.5 }}>FHC // PLAYER CREATION TERMINAL</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: CP_CY, opacity: 0.3 }}>STAGE 01 + 02</span>
                  <div className="w-[4px] h-[4px] rounded-full" style={{ background: CP_GR, boxShadow: `0 0 4px ${CP_GR}50` }} />
                </div>
              </div>

              {/* ═══════════════════════════════════════════
                  STAGE 01 — PLAYER DATA + PROFILE PREVIEW
                  ═══════════════════════════════════════════ */}
              <div className="flex items-center gap-2 px-5 pt-4 pb-2 max-md:hidden" style={{ borderBottom: `1px solid ${CP_CY}08` }}>
                <div className="w-[3px] h-[3px]" style={{ background: CP_PK, opacity: 0.5 }} />
                <span className="font-pixel" style={{ fontSize: 8, letterSpacing: "0.15em", color: CP_CY, opacity: 0.45 }}>STAGE 01</span>
                <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.12em", color: CP_CY, opacity: 0.3 }}>—</span>
                <span className="font-pixel" style={{ fontSize: 8, letterSpacing: "0.15em", color: CP_CR, opacity: 0.6 }}>PLAYER DATA</span>
                <div className="flex-1" style={{ height: 1, background: `${CP_CY}08` }} />
                <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: CP_CY, opacity: 0.2 }}>FIELDS: 6</span>
              </div>

              {/* Two-column layout: Profile Card + Form */}
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 items-stretch">

                {/* ═══ LEFT — HOLOGRAPHIC PORTAL ═══ */}
                <div className="hidden lg:block" style={{ borderRight: `1px solid ${CP_CY}0c` }}>
                  <div className="relative" style={{ background: "transparent" }}>

                    {/* Terminal header */}
                    <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid ${CP_CY}12` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-[4px] h-[4px]" style={{ background: CP_PK, opacity: 0.5 }} />
                        <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.2em", color: CP_CY, opacity: 0.45 }}>PLAYER ENTRY</span>
                      </div>
                      <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: CP_CY, opacity: 0.25 }}>PORTAL // ACTIVE</span>
                    </div>

                    {/* Holographic Portal */}
                    <div className="relative" style={{ overflow: "hidden", clipPath: "inset(0)" }}>
                      <HolographicPortal />
                    </div>

                    {/* Player HUD */}
                    <div className="px-4 py-3" style={{ borderTop: `1px solid ${CP_CY}0a` }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-pixel" style={{ fontSize: 8, color: CP_CY, opacity: 0.4 }}>STATUS</span>
                        <span className="font-pixel" style={{ fontSize: 8, color: CP_GR }}>READY</span>
                      </div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-pixel" style={{ fontSize: 8, color: CP_CY, opacity: 0.4 }}>GATE</span>
                        <span className="font-pixel" style={{ fontSize: 8, color: CP_CR }}>OPEN</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-pixel" style={{ fontSize: 8, color: CP_CY, opacity: 0.4 }}>SIGNAL</span>
                        <div className="flex items-center" style={{ gap: 2 }}>
                          {[1,1,1,1,1,0,0,0].map((f, i) => (
                            <div key={i} style={{ width: 4, height: 5, background: f ? CP_PK : "rgba(255,255,255,0.05)" }} />
                          ))}
                        </div>
                      </div>
                      <div style={{ height: 1, background: `${CP_CY}08`, marginBottom: 6 }} />
                      <div className="flex items-center justify-between">
                        <span className="font-pixel" style={{ fontSize: 7, letterSpacing: 1, color: CP_CY, opacity: 0.22 }}>FHC HORIZON SYSTEM</span>
                        <span className="font-pixel" style={{ fontSize: 6, letterSpacing: 1, color: CP_CY, opacity: 0.15 }}>v2.6</span>
                      </div>
                    </div>

                    {/* Heart status pill */}
                    <div className="flex justify-center" style={{ padding: "10px 0 14px" }}>
                      <div className="term-status-pill" style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${CP_CY}1a`, padding: "4px 12px" }}>
                        <img src="/assets/fhc-loader/pixel-heart.png" alt="" style={{ width: 10, height: 10, imageRendering: "pixelated" }} className="term-heart-pulse" />
                        <span className="font-pixel" style={{ fontSize: 9, letterSpacing: 1, color: CP_CR }}>01</span>
                        <span style={{ width: 3, height: 3, background: CP_PK, opacity: 0.25 }} />
                        <span className="font-pixel" style={{ fontSize: 9, letterSpacing: 1, color: CP_GR }}>READY</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ RIGHT — PLAYER DATA INPUT FORM ═══ */}
                <div>
                  {/* Form fields */}
                  <div className="p-5 md:p-6">
                    <div className="grid md:grid-cols-2" style={{ gap: 16 }}>
                      {/* FULL NAME */}
                      <div>
                        <label className="font-pixel tracking-widest block mb-1.5" style={{ fontSize: 9, letterSpacing: 1, color: CP_CY, opacity: 0.55 }}>FULL NAME</label>
                        <div className="relative flex items-center gap-2 px-3 join-input-wrap" style={{ minHeight: 40 }}>
                          <span className="shrink-0 opacity-35" style={{ fontSize: 12 }} aria-hidden="true">🧑</span>
                          <input required value={form.name} onChange={set("name")} placeholder="Enter your full name" className="flex-1 bg-transparent font-mono placeholder:text-white/15 focus:outline-none" style={{ color: CP_CR, fontSize: 12, padding: "8px 0" }} />
                        </div>
                      </div>

                      {/* YEAR & BRANCH */}
                      <div>
                        <label className="font-pixel tracking-widest block mb-1.5" style={{ fontSize: 9, letterSpacing: 1, color: CP_CY, opacity: 0.55 }}>YEAR & BRANCH</label>
                        <div className="relative flex items-center gap-2 px-3 join-input-wrap" style={{ minHeight: 40 }}>
                          <span className="shrink-0 opacity-35" style={{ fontSize: 12 }} aria-hidden="true">🎓</span>
                          <select required value={form.branch} onChange={set("branch")} className="flex-1 bg-transparent font-mono focus:outline-none cursor-pointer" style={{ color: CP_CR, fontSize: 12, padding: "8px 0" }}>
                            {BRANCHES.map((b) => (<option key={b} value={b} style={{ background: "#0a0d14", color: CP_CR }}>{b}</option>))}
                          </select>
                        </div>
                      </div>

                      {/* REGISTER NUMBER */}
                      <div>
                        <label className="font-pixel tracking-widest block mb-1.5" style={{ fontSize: 9, letterSpacing: 1, color: CP_CY, opacity: 0.55 }}>REGISTER NUMBER</label>
                        <div className="relative flex items-center gap-2 px-3 join-input-wrap" style={{ minHeight: 40 }}>
                          <span className="shrink-0 opacity-35" style={{ fontSize: 12 }} aria-hidden="true">🪪</span>
                          <input required value={form.reg} onChange={set("reg")} placeholder="Enter your register number" className="flex-1 bg-transparent font-mono placeholder:text-white/15 focus:outline-none" style={{ color: CP_CR, fontSize: 12, padding: "8px 0" }} />
                        </div>
                      </div>

                      {/* EMAIL */}
                      <div>
                        <label className="font-pixel tracking-widest block mb-1.5" style={{ fontSize: 9, letterSpacing: 1, color: CP_CY, opacity: 0.55 }}>EMAIL</label>
                        <div className="relative flex items-center gap-2 px-3 join-input-wrap" style={{ minHeight: 40 }}>
                          <span className="shrink-0 opacity-35" style={{ fontSize: 12 }} aria-hidden="true">✉️</span>
                          <input required type="email" value={form.email} onChange={set("email")} placeholder="Enter your email address" className="flex-1 bg-transparent font-mono placeholder:text-white/15 focus:outline-none" style={{ color: CP_CR, fontSize: 12, padding: "8px 0" }} />
                        </div>
                      </div>

                      {/* PHONE */}
                      <div>
                        <label className="font-pixel tracking-widest block mb-1.5" style={{ fontSize: 9, letterSpacing: 1, color: CP_CY, opacity: 0.55 }}>PHONE</label>
                        <div className="relative flex items-center gap-2 px-3 join-input-wrap" style={{ minHeight: 40 }}>
                          <span className="shrink-0 opacity-35" style={{ fontSize: 12 }} aria-hidden="true">📞</span>
                          <input required type="tel" value={form.phone} onChange={set("phone")} placeholder="Enter your phone number" className="flex-1 bg-transparent font-mono placeholder:text-white/15 focus:outline-none" style={{ color: CP_CR, fontSize: 12, padding: "8px 0" }} />
                        </div>
                      </div>

                      {/* ABOUT YOU — full width */}
                      <div className="md:col-span-2">
                        <label className="font-pixel tracking-widest block mb-1.5" style={{ fontSize: 9, letterSpacing: 1, color: CP_CY, opacity: 0.55 }}>ABOUT YOU</label>
                        <div className="relative flex items-start gap-2 px-3 join-input-wrap">
                          <span className="mt-2 opacity-35" style={{ fontSize: 12 }} aria-hidden="true">✏️</span>
                          <textarea required rows="3" value={form.about} onChange={set("about")} placeholder="Share your interests, skills or anything you'd like us to know..." className="flex-1 resize-none bg-transparent font-mono placeholder:text-white/15 focus:outline-none" style={{ color: CP_CR, fontSize: 12, padding: "8px 0", minHeight: 80 }} />
                        </div>
                      </div>
                    </div>

                    {/* Stage 01 footer */}
                    <div className="flex items-center justify-between mt-5 pt-3 max-md:hidden" style={{ borderTop: `1px solid ${CP_CY}08` }}>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <div key={j} style={{ width: 3, height: 2, background: j % 2 === 0 ? CP_PK : `${CP_PK}12` }} />
                        ))}
                      </div>
                      <span className="font-pixel" style={{ fontSize: 6, letterSpacing: 1, color: `${CP_CY}20` }}>STAGE 01 // COMPLETE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════
                  STAGE TRANSITION DIVIDER
                  ═══════════════════════════════════════════ */}
              <div className="flex items-center gap-3 px-5 max-md:hidden" style={{ padding: "12px 20px" }}>
                <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: CP_CY, opacity: 0.3 }}>01</span>
                <div className="flex-1 flex items-center gap-1">
                  <div style={{ flex: 1, height: 1, background: `${CP_CY}18` }} />
                  <div style={{ width: 3, height: 3, background: CP_PK, opacity: 0.35, transform: "rotate(45deg)" }} />
                  <div style={{ flex: 1, height: 1, background: `${CP_CY}18` }} />
                </div>
                <span className="font-pixel" style={{ fontSize: 5, letterSpacing: "0.2em", color: CP_PK, opacity: 0.3 }}>STAGE TRANSITION</span>
                <div className="flex-1 flex items-center gap-1">
                  <div style={{ flex: 1, height: 1, background: `${CP_CY}18` }} />
                  <div style={{ width: 3, height: 3, background: CP_PK, opacity: 0.35, transform: "rotate(45deg)" }} />
                  <div style={{ flex: 1, height: 1, background: `${CP_CY}18` }} />
                </div>
                <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: CP_CY, opacity: 0.3 }}>02</span>
              </div>

              {/* ═══════════════════════════════════════════
                  STAGE 02 — DOMAIN / ABILITY SELECT
                  ═══════════════════════════════════════════ */}
              <div className="flex items-center gap-2 px-5 pt-2 pb-2 max-md:hidden" style={{ borderBottom: `1px solid ${CP_CY}08` }}>
                <div className="w-[3px] h-[3px]" style={{ background: CP_PK, opacity: 0.5 }} />
                <span className="font-pixel" style={{ fontSize: 8, letterSpacing: "0.15em", color: CP_CY, opacity: 0.45 }}>STAGE 02</span>
                <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.12em", color: CP_CY, opacity: 0.3 }}>—</span>
                <span className="font-pixel" style={{ fontSize: 8, letterSpacing: "0.15em", color: CP_CR, opacity: 0.6 }}>DOMAIN SELECT</span>
                <div className="flex-1" style={{ height: 1, background: `${CP_CY}08` }} />
                <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: CP_CY, opacity: 0.2 }}>{DOMAINS.length} AVAILABLE</span>
              </div>

              {/* Domain grid */}
              <div className="p-5 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {DOMAINS.map((d) => {
                    const isActive = form.domain === d.label;
                    return (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, domain: d.label }))}
                        className="relative text-left transition-all duration-150 group domain-card"
                        style={{
                          background: isActive ? `${d.color}12` : "#0a0d14",
                          border: `2px solid ${isActive ? d.color : `${CP_CY}14`}`,
                          boxShadow: isActive ? `0 0 12px ${d.color}12, inset 0 0 20px ${d.color}08` : "none",
                        }}
                      >
                        {/* Slot number */}
                        <div className="px-3 pt-3 pb-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.2em", color: isActive ? d.color : `${CP_CY}35` }}>{d.num}</span>
                            {isActive && (
                              <span className="font-pixel" style={{ fontSize: 5, padding: "2px 6px", background: d.color, color: CP_DK, letterSpacing: "0.1em" }}>
                                &#x25B6; SELECTED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: 14 }}>{d.icon}</span>
                            <span className="font-pixel font-bold" style={{ fontSize: 9, color: isActive ? d.color : CP_CR }}>{d.label}</span>
                          </div>
                          <p className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.1em", color: isActive ? `${d.color}90` : `${CP_CY}30` }}>{d.desc}</p>
                        </div>

                        {/* Bottom bar */}
                        <div style={{ height: 2, background: isActive ? d.color : `${CP_CY}06` }} />

                        {/* Corner dots */}
                        <div className="absolute top-[3px] left-[3px] w-[2px] h-[2px]" style={{ background: isActive ? d.color : `${CP_CY}12` }} />
                        <div className="absolute top-[3px] right-[3px] w-[2px] h-[2px]" style={{ background: isActive ? d.color : `${CP_CY}12` }} />
                        <div className="absolute bottom-[3px] left-[3px] w-[2px] h-[2px]" style={{ background: isActive ? d.color : `${CP_CY}08` }} />
                        <div className="absolute bottom-[3px] right-[3px] w-[2px] h-[2px]" style={{ background: isActive ? d.color : `${CP_CY}08` }} />
                      </button>
                    );
                  })}
                </div>

                {/* Selected status */}
                {selected && (
                  <div className="mt-4 pt-3 flex items-center gap-3 max-md:hidden" style={{ borderTop: `1px solid ${CP_CY}0c` }}>
                    <div className="w-[5px] h-[5px]" style={{ background: selected.color, boxShadow: `0 0 6px ${selected.color}50` }} />
                    <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.15em", color: CP_CY, opacity: 0.4 }}>SYSTEM PATH LOCKED</span>
                    <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.15em", color: selected.color }}>{selected.label.toUpperCase()}</span>
                  </div>
                )}

                {/* Stage 02 footer */}
                <div className="flex items-center justify-between mt-4 pt-3 max-md:hidden" style={{ borderTop: `1px solid ${CP_CY}08` }}>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <div key={j} style={{ width: 3, height: 2, background: j % 2 === 0 ? CP_CY : `${CP_CY}10` }} />
                    ))}
                  </div>
                  <span className="font-pixel" style={{ fontSize: 6, letterSpacing: 1, color: `${CP_CY}20` }}>STAGE 02 // SELECT DOMAIN</span>
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-[4px] left-[4px] w-[3px] h-[3px]" style={{ background: CP_PK, opacity: 0.2 }} />
              <div className="absolute top-[4px] right-[4px] w-[3px] h-[3px]" style={{ background: CP_PK, opacity: 0.2 }} />
              <div className="absolute bottom-[4px] left-[4px] w-[3px] h-[3px]" style={{ background: CP_CY, opacity: 0.15 }} />
              <div className="absolute bottom-[4px] right-[4px] w-[3px] h-[3px]" style={{ background: CP_CY, opacity: 0.15 }} />
            </div>
          </form>

          {/* ═══ BOTTOM SYSTEM BAR ═══ */}
          <div className="w-full max-md:hidden" style={{ marginTop: 24, borderTop: `1px solid ${BLUE}20`, paddingTop: 10 }}>
            <div className="flex items-center justify-between">
              <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: CP_CY, opacity: 0.3 }}>FHC // PLAYER CREATION TERMINAL</span>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-[2px]">
                  {[1,1,1,1,0,0].map((f, i) => (
                    <div key={i} style={{ width: 5, height: 2, background: f ? CP_CY : `${CP_CY}12` }} />
                  ))}
                </div>
                <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.12em", color: CP_CY, opacity: 0.35 }}>PROFILE STAGE // 02</span>
              </div>
              <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: CP_CY, opacity: 0.3 }}>
                READY FOR INPUT <span style={{ color: CP_PK, opacity: 0.4 }}>&gt;&gt;</span>
              </span>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 03 — READY TO LEVEL UP
   RETRO 8-BIT ARCADE / GAME START SCREEN
   ═══════════════════════════════════════════════════════════════ */
function ReadyToLevelUp() {
  const BG = "#060a18";
  const PK = "#FF007F";
  const CY = "#00D4FF";
  const CR = "#FFF4DC";
  const GRN = "#4CFF4C";
  const BLUE = "#1E90FF";

  const pixelClip = "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))";

  return (
    <section className="relative overflow-hidden" style={{ background: BG }}>

      {/* ═══ CRT SCANLINES ═══ */}
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)" }} />

      {/* ═══ PIXEL GRID ═══ */}
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{ backgroundImage: "linear-gradient(rgba(30,144,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(30,144,255,0.03) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      {/* ═══ CRT SWEEP ═══ */}
      <div className="pointer-events-none absolute left-0 right-0 h-[160px] z-[2]"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(0,212,255,0.015), rgba(0,212,255,0.03), rgba(0,212,255,0.015), transparent)", animation: "term-crt-sweep 7s linear infinite" }} />

      {/* ═══ DECORATIVE PIXELS ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
        {/* Cyan squares */}
        <span className="absolute" style={{ left: "7%", top: "15%", width: 3, height: 3, background: CY, opacity: 0.18 }} />
        <span className="absolute" style={{ left: "92%", top: "20%", width: 2, height: 2, background: CY, opacity: 0.14 }} />
        <span className="absolute" style={{ left: "14%", top: "78%", width: 2, height: 2, background: CY, opacity: 0.12 }} />
        <span className="absolute" style={{ left: "88%", top: "72%", width: 3, height: 3, background: CY, opacity: 0.1 }} />
        {/* Pink squares */}
        <span className="absolute" style={{ left: "5%", top: "45%", width: 2, height: 2, background: PK, opacity: 0.15 }} />
        <span className="absolute" style={{ left: "95%", top: "50%", width: 2, height: 2, background: PK, opacity: 0.12 }} />
        {/* Yellow squares */}
        <span className="absolute" style={{ left: "20%", top: "12%", width: 2, height: 2, background: "#FFD500", opacity: 0.1 }} />
        <span className="absolute" style={{ left: "80%", top: "85%", width: 2, height: 2, background: "#FFD500", opacity: 0.08 }} />
        {/* Green squares */}
        <span className="absolute" style={{ left: "10%", top: "60%", width: 2, height: 2, background: GRN, opacity: 0.1 }} />
        <span className="absolute" style={{ left: "90%", top: "40%", width: 2, height: 2, background: GRN, opacity: 0.08 }} />
        {/* Cyan plus signs */}
        <span className="absolute font-pixel" style={{ left: "8%", top: "30%", fontSize: 8, color: CY, opacity: 0.08 }}>+</span>
        <span className="absolute font-pixel" style={{ left: "93%", top: "65%", fontSize: 7, color: CY, opacity: 0.06 }}>+</span>
        <span className="absolute font-pixel" style={{ left: "25%", top: "88%", fontSize: 6, color: CY, opacity: 0.05 }}>+</span>
        {/* Tiny data labels */}
        <span className="absolute font-pixel" style={{ left: "4%", top: "88%", fontSize: 5, color: CY, opacity: 0.06 }}>0x3F</span>
        <span className="absolute font-pixel" style={{ right: "4%", top: "12%", fontSize: 5, color: PK, opacity: 0.05 }}>SYS_OK</span>
      </div>

      {/* ═══ TOP SYSTEM BAR ═══ */}
      <div className="absolute top-[14px] left-0 right-0 z-30 pointer-events-none flex items-center px-[32px] max-md:hidden">
        <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.2em", color: CY, opacity: 0.5 }}>FHC // PRESS START</span>
        <div className="flex-1 mx-3" style={{ height: 1, background: `${CY}18` }} />
        <div className="flex items-center gap-2">
          <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.2em", color: CY, opacity: 0.5 }}>PLAYER READY</span>
          <div className="w-[4px] h-[4px]" style={{ background: GRN, boxShadow: `0 0 4px ${GRN}50` }} />
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="relative z-10 mx-auto flex flex-col items-center" style={{ maxWidth: 1100, padding: "70px 32px 60px" }}>

        {/* ═══ TITLE ═══ */}
        <h2 className="font-pixel font-bold text-center" style={{
          fontSize: "clamp(30px, 4.5vw, 58px)", color: CR, letterSpacing: 3, lineHeight: 1.15,
          textShadow: `4px 4px 0 ${PK}, 0 0 40px ${PK}18`,
          marginBottom: 14,
        }}>
          READY TO <br />LEVEL UP?
          <span style={{ marginLeft: 8, color: PK, fontSize: "0.8em" }} className="animate-arcade-cursor-slow">&#x2588;</span>
        </h2>

        {/* ═══ SUBTITLE ═══ */}
        <div className="flex items-center gap-3 mb-8">
          <div style={{ width: 40, height: 1, background: CY, opacity: 0.35 }} />
          <p className="font-pixel text-center" style={{ fontSize: "clamp(8px, 1vw, 11px)", color: CY, letterSpacing: "0.12em", opacity: 0.75 }}>
            JOIN FHC AND START BUILDING THE FUTURE TODAY!
          </p>
          <div style={{ width: 40, height: 1, background: CY, opacity: 0.35 }} />
        </div>

        {/* ═══════════════════════════════════════════════════════
            DESKTOP — 3-PART COMPOSITION
            ═══════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex w-full items-center justify-between" style={{ padding: "0 20px" }}>

          {/* ── LEFT: CONTROLLER ── */}
          <div className="flex flex-col items-center" style={{ flex: "0 0 220px" }}>
            <div className="relative" style={{ padding: 10 }}>
              {/* Corner brackets */}
              <div className="absolute top-0 left-0"><div style={{ width: 10, height: 1, background: CY, opacity: 0.5 }} /><div style={{ width: 1, height: 10, background: CY, opacity: 0.5 }} /></div>
              <div className="absolute top-0 right-0"><div style={{ width: 10, height: 1, background: CY, opacity: 0.5, marginLeft: "auto" }} /><div style={{ width: 1, height: 10, background: CY, opacity: 0.5, marginLeft: "auto" }} /></div>
              <div className="absolute bottom-0 left-0"><div style={{ width: 1, height: 10, background: CY, opacity: 0.5 }} /><div style={{ width: 10, height: 1, background: CY, opacity: 0.5 }} /></div>
              <div className="absolute bottom-0 right-0"><div style={{ width: 1, height: 10, background: CY, opacity: 0.5, marginLeft: "auto" }} /><div style={{ width: 10, height: 1, background: CY, opacity: 0.5, marginLeft: "auto" }} /></div>
              <div className="absolute top-2 right-2 w-[3px] h-[3px]" style={{ background: GRN, boxShadow: `0 0 4px ${GRN}60` }} />

              <img src={fhcController} alt="Controller" style={{ width: 140, height: "auto", imageRendering: "pixelated", display: "block" }} />
            </div>
            <div className="flex items-center gap-1.5" style={{ marginTop: 8 }}>
              <div className="w-[4px] h-[4px]" style={{ background: CY }} />
              <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.15em", color: CY, opacity: 0.55 }}>CONTROLLER // READY</span>
            </div>
          </div>

          {/* ── CENTER: CTA TERMINAL ── */}
          <div className="flex flex-col items-center" style={{ flex: "1 1 auto", maxWidth: 420, padding: "0 30px" }}>
            {/* Targeting brackets around CTA */}
            <div style={{ position: "relative", padding: 18 }}>
              {/* Outer corner brackets */}
              <div style={{ position: "absolute", top: 0, left: 0, width: 16, height: 1, background: PK, opacity: 0.8 }} />
              <div style={{ position: "absolute", top: 0, left: 0, width: 1, height: 16, background: PK, opacity: 0.8 }} />
              <div style={{ position: "absolute", top: 0, right: 0, width: 16, height: 1, background: PK, opacity: 0.8 }} />
              <div style={{ position: "absolute", top: 0, right: 0, width: 1, height: 16, background: PK, opacity: 0.8 }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, width: 16, height: 1, background: PK, opacity: 0.8 }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, width: 1, height: 16, background: PK, opacity: 0.8 }} />
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 1, background: PK, opacity: 0.8 }} />
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 1, height: 16, background: PK, opacity: 0.8 }} />
              {/* Inner corner brackets */}
              <div style={{ position: "absolute", top: 6, left: 6, width: 8, height: 1, background: CY, opacity: 0.4 }} />
              <div style={{ position: "absolute", top: 6, left: 6, width: 1, height: 8, background: CY, opacity: 0.4 }} />
              <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 1, background: CY, opacity: 0.4 }} />
              <div style={{ position: "absolute", top: 6, right: 6, width: 1, height: 8, background: CY, opacity: 0.4 }} />
              <div style={{ position: "absolute", bottom: 6, left: 6, width: 1, height: 8, background: CY, opacity: 0.4 }} />
              <div style={{ position: "absolute", bottom: 6, left: 6, width: 8, height: 1, background: CY, opacity: 0.4 }} />
              <div style={{ position: "absolute", bottom: 6, right: 6, width: 1, height: 8, background: CY, opacity: 0.4 }} />
              <div style={{ position: "absolute", bottom: 6, right: 6, width: 8, height: 1, background: CY, opacity: 0.4 }} />

              {/* The CTA BUTTON */}
              <button
                type="submit"
                form="join-form"
                className="relative inline-flex items-center gap-3 cursor-pointer"
                style={{
                  fontFamily: "var(--font-pixel)", fontSize: 15, fontWeight: 700, letterSpacing: 2,
                  color: CR, background: "#0a0a14",
                  border: `3px solid ${PK}`,
                  boxShadow: `inset 0 0 0 4px #0a0a14, inset 0 0 0 5px ${PK}50, 0 0 0 1px ${BLUE}30, 0 0 20px ${PK}10`,
                  padding: "24px 52px",
                  outline: "none", minWidth: 380, justifyContent: "center",
                  transition: "transform 0.08s steps(2), box-shadow 0.15s, background 0.15s",
                  clipPath: pixelClip,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.background = "#0f0f1a";
                  e.currentTarget.style.boxShadow = `inset 0 0 0 4px #0a0a14, inset 0 0 0 5px ${PK}, 0 0 0 1px ${BLUE}50, 0 0 30px ${PK}20, 0 0 60px ${PK}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.background = "#0a0a14";
                  e.currentTarget.style.boxShadow = `inset 0 0 0 4px #0a0a14, inset 0 0 0 5px ${PK}50, 0 0 0 1px ${BLUE}30, 0 0 20px ${PK}10`;
                }}
              >
                <span style={{ color: PK, fontSize: 18 }}>&#x25B6;</span> SUBMIT & JOIN FHC
              </button>
            </div>

            {/* Below-button pixel detail */}
            <div className="flex items-center gap-1 mt-2">
              <div style={{ width: 12, height: 1, background: PK, opacity: 0.2 }} />
              <div style={{ width: 3, height: 3, background: PK, opacity: 0.3 }} />
              <div style={{ width: 30, height: 1, background: CY, opacity: 0.15 }} />
              <div style={{ width: 3, height: 3, background: CY, opacity: 0.3 }} />
              <div style={{ width: 12, height: 1, background: PK, opacity: 0.2 }} />
            </div>
          </div>

          {/* ── RIGHT: SPEECH BUBBLE + HEART ── */}
          <div className="flex flex-col items-center" style={{ flex: "0 0 220px" }}>
            {/* Speech bubble */}
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", inset: 0, background: "#0a0a12", transform: "translate(3px, 3px)",
                clipPath: "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 16px 100%, 12px calc(100% + 10px), 24px 100%, 4px 100%, 0 calc(100% - 4px))",
              }} />
              <div className="font-pixel" style={{
                position: "relative", padding: "22px 28px", fontSize: 11, lineHeight: 2.2, textAlign: "center",
                background: CR, border: `2px solid #1a1a2e`, minWidth: 170,
                clipPath: "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 16px 100%, 12px calc(100% + 10px), 24px 100%, 4px 100%, 0 calc(100% - 4px))",
              }}>
                <span style={{ color: "#0a0a12" }}>LET&apos;S<br />BUILD<br />TOGETHER!</span>
              </div>
              {/* Corner marks */}
              <div className="absolute top-1 left-1" style={{ width: 6, height: 6, borderTop: `1px solid ${CY}30`, borderLeft: `1px solid ${CY}30` }} />
              <div className="absolute top-1 right-1" style={{ width: 6, height: 6, borderTop: `1px solid ${CY}30`, borderRight: `1px solid ${CY}30` }} />
            </div>

            {/* Heart */}
            <div style={{ marginTop: 14 }}>
              <img src={fhcHeart} alt="" style={{ width: 32, height: 32, imageRendering: "pixelated", filter: `drop-shadow(0 0 8px ${PK}35)` }} className="animate-heart-pulse" />
            </div>

            {/* Signal label */}
            <div className="flex items-center gap-1.5" style={{ marginTop: 8 }}>
              <div className="w-[3px] h-[3px] rounded-full" style={{ background: PK, boxShadow: `0 0 4px ${PK}40` }} />
              <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.12em", color: CY, opacity: 0.45 }}>SIGNAL // CONNECTED</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            MOBILE — VERTICAL STACK
            ═══════════════════════════════════════════════════════ */}
        <div className="flex lg:hidden flex-col items-center gap-6 w-full">

          {/* Controller (mobile) */}
          <div className="flex flex-col items-center max-md:hidden">
            <div className="relative" style={{ padding: 10 }}>
              <div className="absolute top-0 left-0"><div style={{ width: 6, height: 1, background: CY, opacity: 0.4 }} /><div style={{ width: 1, height: 6, background: CY, opacity: 0.4 }} /></div>
              <div className="absolute top-0 right-0"><div style={{ width: 6, height: 1, background: CY, opacity: 0.4, marginLeft: "auto" }} /><div style={{ width: 1, height: 6, background: CY, opacity: 0.4, marginLeft: "auto" }} /></div>
              <div className="absolute bottom-0 left-0"><div style={{ width: 1, height: 6, background: CY, opacity: 0.4 }} /><div style={{ width: 6, height: 1, background: CY, opacity: 0.4 }} /></div>
              <div className="absolute bottom-0 right-0"><div style={{ width: 1, height: 6, background: CY, opacity: 0.4, marginLeft: "auto" }} /><div style={{ width: 6, height: 1, background: CY, opacity: 0.4, marginLeft: "auto" }} /></div>
              <img src={fhcController} alt="Controller" style={{ width: 110, height: "auto", imageRendering: "pixelated", display: "block" }} />
            </div>
            <div className="flex items-center gap-1 max-md:hidden" style={{ marginTop: 6 }}>
              <div className="w-[3px] h-[3px]" style={{ background: CY }} />
              <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.12em", color: CY, opacity: 0.45 }}>CONTROLLER // READY</span>
            </div>
          </div>

          {/* CTA (mobile) */}
          <button
            type="submit"
            form="join-form"
            className="relative inline-flex items-center gap-2 cursor-pointer"
            style={{
              fontFamily: "var(--font-pixel)", fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
              color: CR, background: "#0a0a14", border: `2px solid ${PK}`,
              boxShadow: `inset 0 0 0 3px #0a0a14, inset 0 0 0 4px ${PK}50`,
              padding: "16px 32px", clipPath: pixelClip, justifyContent: "center",
            }}
          >
            <span style={{ color: PK, fontSize: 14 }}>&#x25B6;</span> SUBMIT & JOIN FHC
          </button>

          {/* Speech bubble (mobile) */}
          <div className="flex flex-col items-center">
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "#0a0a12", transform: "translate(2px, 2px)", clipPath: "polygon(0 3px, 3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 12px 100%, 9px calc(100% + 8px), 18px 100%, 3px 100%, 0 calc(100% - 3px))" }} />
              <div className="font-pixel" style={{ position: "relative", padding: "18px 22px", fontSize: 10, lineHeight: 2.2, textAlign: "center", background: CR, border: `2px solid #1a1a2e`, minWidth: 150, clipPath: "polygon(0 3px, 3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 12px 100%, 9px calc(100% + 8px), 18px 100%, 3px 100%, 0 calc(100% - 3px))" }}>
                <span style={{ color: "#0a0a12" }}>LET&apos;S<br />BUILD<br />TOGETHER!</span>
              </div>
            </div>
            <img src={fhcHeart} alt="" style={{ width: 26, height: 26, imageRendering: "pixelated", marginTop: 10, filter: `drop-shadow(0 0 6px ${PK}30)`, display: "block", marginLeft: "auto", marginRight: "auto" }} className="animate-heart-pulse" />
            <div className="flex items-center gap-1 max-md:hidden" style={{ marginTop: 6 }}>
              <div className="w-[3px] h-[3px] rounded-full" style={{ background: PK, opacity: 0.5, boxShadow: `0 0 3px ${PK}25` }} />
              <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.1em", color: CY, opacity: 0.35 }}>SIGNAL // CONNECTED</span>
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM TEXT ═══ */}
        <p className="font-pixel text-center mt-10 max-md:hidden" style={{ fontSize: "clamp(9px, 1.1vw, 12px)", letterSpacing: "0.18em", color: CY, opacity: 0.5 }}>
          PRESS START TO ENTER THE HORIZON<span style={{ color: CY }} className="animate-arcade-cursor-slow">_</span>
        </p>

        {/* ═══ BOTTOM SYSTEM BAR ═══ */}
        <div className="w-full max-md:hidden" style={{ marginTop: 24, borderTop: `1px solid ${BLUE}20`, paddingTop: 10 }}>
          <div className="flex items-center justify-between">
            <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: CY, opacity: 0.3 }}>FHC // PRESS START</span>
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-[2px]">
                {[1,1,1,1,0,0].map((f, i) => (
                  <div key={i} style={{ width: 5, height: 2, background: f ? CY : `${CY}12` }} />
                ))}
              </div>
              <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.12em", color: CY, opacity: 0.35 }}>READY FOR NEW PLAYERS</span>
            </div>
            <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.15em", color: CY, opacity: 0.3 }}>PLAYER SLOT // AVAILABLE</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN JOIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Join() {
  const [form, setForm] = useState({
    name: "", branch: "Select your year & branch", reg: "",
    email: "", phone: "", about: "", domain: "",
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleSubmit(e) {
    e.preventDefault();
    console.log("FHC join payload:", form);
    setToast(form.name);
  }

  return (
    <>
      <MasterJoinFrame>
        <Hero />
        <SectionDivider leftLabel="FHC // PLAYER ENTRY" rightLabel="SECTION 01" />
        <CreateProfile onSubmit={handleSubmit} form={form} setForm={setForm} />
        <SectionDivider leftLabel="FHC // PLAYER CREATION" rightLabel="STAGE 02" />
        <ReadyToLevelUp />
        <div className="mx-[10px]"><Footer /></div>
      </MasterJoinFrame>

      {/* Success toast */}
      {toast && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center" style={{ background: "rgba(8,9,11,0.92)" }}>
          <div className="relative max-w-md w-full mx-4">
            <div className="absolute inset-0" style={{ background: GR, transform: "translate(8px, 8px)", clipPath: "polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))", opacity: 0.2 }} />
            <div className="relative p-8 text-center" style={{ background: DP, border: `3px solid ${GR}`, clipPath: "polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))" }}>
              <div className="text-4xl mb-4">🎉</div>
              <p className="font-pixel text-[11px] mb-2" style={{ color: GR }}>PLAYER CREATED!</p>
              <p className="font-pixel text-lg mb-4" style={{ color: CR }}>FHC_</p>
              <p className="font-mono text-sm mb-4" style={{ color: `${CR}CC` }}>WELCOME TO THE HORIZON.</p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="px-3 py-2" style={{ background: INK, border: `2px solid ${GR}30` }}>
                  <p className="font-pixel text-[6px] tracking-widest" style={{ color: `${GR}60` }}>STATUS</p>
                  <p className="font-pixel text-[9px] font-bold" style={{ color: YL }}>READY</p>
                </div>
                <div className="px-3 py-2" style={{ background: INK, border: `2px solid ${GR}30` }}>
                  <p className="font-pixel text-[6px] tracking-widest" style={{ color: `${GR}60` }}>MISSION</p>
                  <p className="font-pixel text-[9px] font-bold" style={{ color: PK }}>STARTED</p>
                </div>
              </div>
              <button onClick={() => setToast(null)} className="font-pixel text-[10px] cursor-pointer transition-colors hover:text-cream" style={{ color: PK }}>▶ CONTINUE</button>
            </div>
            <div className="absolute top-[6px] left-[6px] w-3 h-3 border-t-2 border-l-2" style={{ borderColor: GR }} />
            <div className="absolute top-[6px] right-[6px] w-3 h-3 border-t-2 border-r-2" style={{ borderColor: GR }} />
            <div className="absolute bottom-[6px] left-[6px] w-3 h-3 border-b-2 border-l-2" style={{ borderColor: GR }} />
            <div className="absolute bottom-[6px] right-[6px] w-3 h-3 border-b-2 border-r-2" style={{ borderColor: GR }} />
          </div>
        </div>
      )}
    </>
  );
}
