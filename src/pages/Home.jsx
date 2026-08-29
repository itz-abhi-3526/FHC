import { useState } from "react";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import PixelButton from "../components/PixelButton";
import SectionEyebrow from "../components/SectionEyebrow";

const STATS = [
  { icon: "★", value: "25+", label: "EVENTS" },
  { icon: "☺", value: "100+", label: "MEMBERS" },
  { icon: "</>", value: "15+", label: "PROJECTS" },
];

const ACHIEVEMENTS = [
  { icon: "🏆", title: "BEST CLUB 2023" },
  { icon: "🎖️", title: "ACTIVE COMMUNITY" },
  { icon: "⚡", title: "INNOVATION DRIVEN" },
  { icon: "♥", title: "MADE BY STUDENTS" },
];

const STAT_ACCENTS = ["#ff2e8c", "#5ab8ff", "#39ff6a"];
const ACHIEV_ACCENTS = ["#ffd400", "#5ab8ff", "#ff2e8c", "#39ff6a"];

const EVENTS = [
  {
    day: "JUN 15",
    icon: "🖥️",
    title: "WEB DEV WORKSHOP",
    desc: "Learn modern web dev technologies and build real-world projects.",
  },
  {
    day: "JUN 28",
    icon: "🧠",
    title: "AI EXPLORER TALK",
    desc: "A session on the future of AI and its real-world applications.",
  },
  {
    day: "JUL 10",
    icon: "⌨️",
    title: "CODE HORIZON 3.0",
    desc: "Intra-college coding competition. Solve. Code. Win. Repeat.",
  },
  {
    day: "JUL 24",
    icon: "🎤",
    title: "TECH TALK",
    desc: "Talk by industry experts on emerging tech and career guidance.",
  },
];

const PROJECTS = [
  {
    icon: "📱",
    title: "CAMPUS PAY",
    desc: "QR payments for campus cafeterias and events.",
    tech: ["React", "Node"],
    accent: "#39ff6a",
  },
  {
    icon: "🩺",
    title: "MEDISCHED",
    desc: "Appointment scheduler for rural clinics.",
    tech: ["Flutter", "Django"],
    accent: "#5ab8ff",
  },
  {
    icon: "🤖",
    title: "HORIZON BOT",
    desc: "Discord bot for club RSVPs and reminders.",
    tech: ["TypeScript"],
    accent: "#ff2e8c",
  },
  {
    icon: "🌦️",
    title: "FARMWISE",
    desc: "Crop advisory app powered by weather data.",
    tech: ["React", "Python"],
    accent: "#ffd400",
  },
];

const WHY_JOIN = [
  {
    asset: "/assets/pixel-tech/retro-pc.png",
    title: "LEARN",
    desc: "Workshops and talks that level up your skills.",
    accent: "#39ff6a",
    ability: "01",
  },
  {
    asset: "/assets/fhc-loader/collaboration.png",
    title: "COLLABORATE",
    desc: "Build with peers across every department.",
    accent: "#5ab8ff",
    ability: "02",
  },
  {
    asset: "/assets/fhc-loader/rocket.png",
    title: "BUILD",
    desc: "Ship real projects, not just assignments.",
    accent: "#ff2e8c",
    ability: "03",
  },
  {
    asset: "/assets/fhc-loader/lightbulb.png",
    title: "GROW",
    desc: "Mentorship and a network that sticks.",
    accent: "#ffd400",
    ability: "04",
  },
  {
    asset: "/assets/pixel-tech/globe.png",
    title: "EXPLORE",
    desc: "Discover fields beyond the syllabus.",
    accent: "#2ecdc9",
    ability: "05",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   STATS + ACHIEVEMENTS — FHC Arcade Poster Showcase
   ═══════════════════════════════════════════════════════════════════ */
function StatsAchievements() {
  const PK = "#ff2e8c";
  const BL = "#5ab8ff";
  const GR = "#39ff6a";
  const YL = "#ffd400";
  const CR = "#fdf6e8";
  const INK = "#0c0c0f";

  const stats = [
    { val: "25+", label: "EVENTS", accent: PK, icon: "★" },
    { val: "300+", label: "MEMBERS", accent: BL, icon: "☺" },
    { val: "15+", label: "PROJECTS", accent: GR, icon: "</>" },
  ];

  const achievements = [
    { icon: "🏆", title: "BEST CLUB 2023", accent: YL },
    { icon: "🎖️", title: "ACTIVE COMMUNITY", accent: BL },
    { icon: "⚡", title: "INNOVATION DRIVEN", accent: PK },
    { icon: "♥", title: "MADE BY STUDENTS", accent: GR },
  ];

  return (
    <section
      id="stats"
      className="relative bg-ink overflow-hidden"
      style={{ borderTop: `4px solid ${INK}`, borderBottom: `4px solid ${PK}` }}
    >
      {/* ── OUTER ARCADE BORDER FRAME ───────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {/* Hot pink outer border */}
        <div className="absolute inset-[10px]" style={{ border: `2px solid ${PK}` }} />
        {/* Black inner outline */}
        <div className="absolute inset-[14px]" style={{ border: `1px solid ${INK}` }} />

        {/* Pixel-cut corner brackets — TL */}
        <div className="absolute top-[8px] left-[8px]">
          <div className="w-4 h-[2px]" style={{ background: PK }} />
          <div className="w-[2px] h-4" style={{ background: PK }} />
        </div>
        {/* TR */}
        <div className="absolute top-[8px] right-[8px]">
          <div className="w-4 h-[2px] ml-auto" style={{ background: PK }} />
          <div className="w-[2px] h-4 ml-auto" style={{ background: PK }} />
        </div>
        {/* BL */}
        <div className="absolute bottom-[8px] left-[8px]">
          <div className="absolute bottom-0 left-0 w-4 h-[2px]" style={{ background: PK }} />
          <div className="absolute bottom-0 left-0 w-[2px] h-4" style={{ background: PK }} />
        </div>
        {/* BR */}
        <div className="absolute bottom-[8px] right-[8px]">
          <div className="absolute bottom-0 right-0 w-4 h-[2px]" style={{ background: PK }} />
          <div className="absolute bottom-0 right-0 w-[2px] h-4" style={{ background: PK }} />
        </div>

        {/* Small corner pixel details */}
        <span className="absolute top-[6px] left-[6px] w-[4px] h-[4px]" style={{ background: PK }} />
        <span className="absolute top-[6px] right-[6px] w-[4px] h-[4px]" style={{ background: PK }} />
        <span className="absolute bottom-[6px] left-[6px] w-[4px] h-[4px]" style={{ background: PK }} />
        <span className="absolute bottom-[6px] right-[6px] w-[4px] h-[4px]" style={{ background: PK }} />
      </div>

      {/* ── CRT scanlines ─────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 4px)",
        }}
      />

      {/* ── Floating pixel particles ──────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
        {[
          { x: "4%", y: "12%", s: 3, c: PK, o: 0.4 },
          { x: "14%", y: "78%", s: 2, c: GR, o: 0.3 },
          { x: "26%", y: "8%", s: 4, c: YL, o: 0.25 },
          { x: "40%", y: "85%", s: 2, c: BL, o: 0.35 },
          { x: "58%", y: "14%", s: 3, c: PK, o: 0.3 },
          { x: "72%", y: "68%", s: 2, c: YL, o: 0.4 },
          { x: "85%", y: "22%", s: 3, c: GR, o: 0.3 },
          { x: "92%", y: "80%", s: 2, c: BL, o: 0.35 },
          { x: "10%", y: "50%", s: 2, c: YL, o: 0.2 },
          { x: "66%", y: "42%", s: 3, c: PK, o: 0.2 },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: p.x, top: p.y, width: p.s, height: p.s, background: p.c, opacity: p.o }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-8 md:py-10">

        {/* ── MAIN: STATS + ACHIEVEMENTS ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-0 items-start">

          {/* ═══════ LEFT: STATS PANEL ══════════════════════════════ */}
          <div>
            {/* Stats heading */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-pixel text-[11px] text-pink tracking-wider" style={{ letterSpacing: 2 }}>//</span>
              <h3 className="font-pixel text-[11px] text-pink tracking-wider">STATS</h3>
              <span className="inline-block w-[8px] h-[14px] bg-pink" style={{ animation: "blink 1s steps(1) infinite" }} />
            </div>

            {/* Three stat cards — larger */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {stats.map((s, i) => {
                const rotations = [-1.2, 0.6, -0.5];
                return (
                  <div
                    key={s.label}
                    className="relative group"
                    style={{ transform: `rotate(${rotations[i]}deg)` }}
                  >
                    {/* Offset shadow */}
                    <div
                      className="absolute"
                      style={{
                        inset: 0,
                        background: s.accent,
                        transform: "translate(5px, 5px)",
                        clipPath: "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))",
                      }}
                    />
                    {/* Card body */}
                    <div
                      className="relative bg-cream px-3 pt-3 pb-4 text-center transition-transform duration-150 group-hover:translate-y-[-2px]"
                      style={{
                        border: `3px solid ${INK}`,
                        clipPath: "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))",
                      }}
                    >
                      {/* Top row: number marker + icon */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${s.accent}80` }}>0{i + 1}</span>
                        <div
                          className="flex items-center justify-center"
                          style={{ width: 22, height: 22, background: `${s.accent}18`, border: `2px solid ${s.accent}50` }}
                        >
                          <span className="font-pixel text-[7px]" style={{ color: s.accent }}>{s.icon}</span>
                        </div>
                      </div>

                      {/* The number — hero */}
                      <div className="relative mb-2">
                        <span
                          className="font-pixel font-bold block leading-none"
                          style={{
                            fontSize: 42,
                            color: s.accent,
                            WebkitTextStroke: `2px ${INK}`,
                            paintOrder: "stroke fill",
                            textShadow: `3px 3px 0 0 ${INK}`,
                          }}
                        >
                          {s.val}
                        </span>
                      </div>

                      {/* Label */}
                      <span className="font-pixel text-[8px] tracking-[0.15em] block mb-3" style={{ color: INK }}>
                        {s.label}
                      </span>

                      {/* Decorative pixel strip */}
                      <div className="flex items-center justify-center gap-[2px]">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <div key={j} style={{
                            width: 4,
                            height: 3,
                            background: j % 3 === 0 ? s.accent : `${s.accent}25`,
                          }} />
                        ))}
                      </div>

                      {/* Corner accents */}
                      <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: s.accent }} />
                      <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: s.accent }} />
                      <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: s.accent }} />
                      <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: s.accent }} />
                    </div>

                    {/* Sparkle */}
                    <span
                      className="absolute -top-2 -right-1 font-pixel text-[6px]"
                      style={{
                        color: s.accent,
                        animation: "twinkle 2.4s ease-in-out infinite",
                        animationDelay: `${i * 0.3}s`,
                      }}
                    >✦</span>
                  </div>
                );
              })}
            </div>

            {/* ── Pixel decoration strip ──────────────────────────── */}
            <div className="flex flex-col items-center gap-3 mt-2">
              <div className="flex items-center gap-[2px]">
                <span className="w-[3px] h-[3px]" style={{ background: `${PK}40` }} />
                <span className="w-8 h-[1px]" style={{ background: `${PK}18` }} />
                <span className="w-[2px] h-[2px]" style={{ background: `${CR}20` }} />
                <span className="w-12 h-[1px]" style={{ background: `${PK}12` }} />
                <span className="w-[3px] h-[3px]" style={{ background: `${BL}40` }} />
                <span className="w-12 h-[1px]" style={{ background: `${PK}12` }} />
                <span className="w-[2px] h-[2px]" style={{ background: `${CR}20` }} />
                <span className="w-8 h-[1px]" style={{ background: `${PK}18` }} />
                <span className="w-[3px] h-[3px]" style={{ background: `${GR}40` }} />
              </div>
              <div className="flex items-center gap-1 opacity-40">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-[2px] h-[2px]" style={{ background: i === 2 ? PK : `${CR}30` }} />
                ))}
              </div>
            </div>
          </div>

          {/* ═══════ CENTER DIVIDER ═════════════════════════════════ */}
          <div className="hidden lg:flex flex-col items-center justify-center px-4 gap-0 self-stretch">
            {/* Top node */}
            <div className="w-[6px] h-[6px] mb-2" style={{ background: PK, boxShadow: `0 0 6px ${PK}60` }} />
            {/* Dotted pixel line — fills available height */}
            <div className="flex-1 flex flex-col items-center justify-between py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{
                  width: i % 3 === 0 ? 3 : 2,
                  height: i % 3 === 0 ? 3 : 6,
                  background: i % 4 === 0 ? PK : i % 4 === 1 ? BL : i % 4 === 2 ? YL : GR,
                  opacity: i % 3 === 0 ? 0.7 : 0.3,
                }} />
              ))}
            </div>
            {/* Bottom node */}
            <div className="w-[6px] h-[6px] mt-2" style={{ background: GR, boxShadow: `0 0 6px ${GR}60` }} />
          </div>

          {/* ═══════ RIGHT: ACHIEVEMENTS ════════════════════════════ */}
          <div>
            {/* Achievements heading */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-pixel text-[11px] text-arcade tracking-wider" style={{ letterSpacing: 2 }}>//</span>
              <h3 className="font-pixel text-[11px] text-arcade tracking-wider">ACHIEVEMENTS</h3>
            </div>

            {/* Achievement tiles — slightly compact */}
            <div className="flex flex-col gap-2.5">
              {achievements.map((a, i) => (
                <div
                  key={a.title}
                  className="group relative flex items-center gap-3 transition-transform duration-150 hover:translate-x-[3px]"
                >
                  {/* Offset shadow */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: a.accent,
                      transform: "translate(4px, 4px)",
                      clipPath: "polygon(0 3px, 3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px))",
                    }}
                  />

                  {/* Card */}
                  <div
                    className="relative flex-1 flex items-center gap-3 px-4 py-2.5"
                    style={{
                      background: INK,
                      border: `2px solid ${a.accent}40`,
                      clipPath: "polygon(0 3px, 3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px))",
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="flex-shrink-0 flex items-center justify-center transition-transform duration-150 group-hover:scale-110"
                      style={{
                        width: 36,
                        height: 36,
                        background: `${a.accent}15`,
                        border: `2px solid ${a.accent}40`,
                      }}
                    >
                      <span className="text-base">{a.icon}</span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-pixel text-[9px] tracking-wider truncate" style={{ color: a.accent }}>
                        {a.title}
                      </p>
                    </div>

                    {/* Accent dot */}
                    <span className="w-[4px] h-[4px] flex-shrink-0" style={{ background: a.accent, opacity: 0.5 }} />
                  </div>

                  {/* Sparkle */}
                  <span
                    className="absolute -top-1 right-2 font-pixel text-[5px]"
                    style={{
                      color: a.accent,
                      animation: "twinkle 2s ease-in-out infinite",
                      animationDelay: `${i * 0.25}s`,
                    }}
                  >✦</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM STRIP ──────────────────────────────────────── */}
        <div className="mt-5 pt-3 flex items-center justify-between" style={{ borderTop: `2px solid ${PK}15` }}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-pixel text-[6px] text-cream/40 tracking-widest">FHC</span>
            <span className="w-[3px] h-[3px] rounded-full" style={{ background: PK, opacity: 0.5 }} />
            <span className="font-pixel text-[6px] text-cream/40 tracking-widest">BUILDING</span>
            <span className="w-[3px] h-[3px] rounded-full" style={{ background: BL, opacity: 0.5 }} />
            <span className="font-pixel text-[6px] text-cream/40 tracking-widest">CONNECTING</span>
            <span className="w-[3px] h-[3px] rounded-full" style={{ background: GR, opacity: 0.5 }} />
            <span className="font-pixel text-[6px] text-cream/40 tracking-widest">INNOVATING</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[4px] h-[4px] bg-pink" style={{ animation: "led-blink 1.2s ease-in-out infinite" }} />
            <span className="font-pixel text-[6px] text-cream/30 tracking-widest">FISAT</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   UPCOMING EVENTS — FHC ARCADE EVENT TICKETING TERMINAL
   ═══════════════════════════════════════════════════════════════════ */
function UpcomingEvents() {
  const [selected, setSelected] = useState(0);
  const [ticketKey, setTicketKey] = useState(0);

  const PK = "#ff2e8c";
  const CY = "#5ab8ff";
  const YL = "#ffd400";
  const GR = "#39ff6a";
  const CR = "#fdf6e8";
  const INK = "#0c0c0f";

  const accents = [PK, CY, YL, GR];
  const accent = accents[selected];
  const e = EVENTS[selected];
  const num = String(selected + 1).padStart(2, "0");

  const handleSelect = (idx) => {
    if (idx !== selected) {
      setSelected(idx);
      setTicketKey((k) => k + 1);
    }
  };

  return (
    <section
      id="events"
      className="relative scroll-mt-24 overflow-hidden"
      style={{
        background: "#07111F",
        borderTop: `4px solid ${INK}`,
        borderBottom: `4px solid ${PK}`,
      }}
    >
      {/* ── Sparse floating pixel particles ─────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
        {[
          { x: "3%", y: "8%", s: 3, c: PK, o: 0.35 },
          { x: "95%", y: "12%", s: 2, c: CY, o: 0.25 },
          { x: "7%", y: "90%", s: 2, c: GR, o: 0.3 },
          { x: "91%", y: "85%", s: 3, c: YL, o: 0.2 },
          { x: "50%", y: "4%", s: 2, c: PK, o: 0.2 },
          { x: "42%", y: "94%", s: 2, c: CY, o: 0.25 },
          { x: "15%", y: "50%", s: 2, c: GR, o: 0.15 },
          { x: "82%", y: "45%", s: 3, c: YL, o: 0.15 },
          { x: "60%", y: "70%", s: 2, c: PK, o: 0.1 },
          { x: "30%", y: "30%", s: 2, c: CY, o: 0.1 },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              left: p.x, top: p.y, width: p.s, height: p.s,
              background: p.c, opacity: p.o,
              animation: `twinkle ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* ── OUTER ARCADE TERMINAL BORDER ───────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-[35]">
        {/* Primary blue border */}
        <div className="absolute inset-[10px]" style={{ border: "2px solid #1687B8" }} />
        {/* Dark inner gap */}
        <div className="absolute inset-[14px]" style={{ border: "1px solid #0c0c0f" }} />
        {/* Thin secondary blue line */}
        <div className="absolute inset-[16px]" style={{ border: "1px solid #1687B820" }} />

        {/* TL — stepped pixel bracket (elaborate) */}
        <div className="absolute top-[6px] left-[6px]">
          <div className="w-6 h-[2px]" style={{ background: "#1687B8" }} />
          <div className="w-[2px] h-6" style={{ background: "#1687B8" }} />
          <div className="absolute top-[2px] left-[2px] w-3 h-[1px]" style={{ background: PK }} />
          <div className="absolute top-[2px] left-[2px] w-[1px] h-3" style={{ background: PK }} />
          <span className="absolute -top-[2px] -left-[2px] w-[3px] h-[3px]" style={{ background: "#1687B8" }} />
        </div>
        {/* TR — simple */}
        <div className="absolute top-[8px] right-[8px]">
          <div className="w-4 h-[2px] ml-auto" style={{ background: "#1687B8" }} />
          <div className="w-[2px] h-4 ml-auto" style={{ background: "#1687B8" }} />
        </div>
        {/* BL — simple */}
        <div className="absolute bottom-[8px] left-[8px]">
          <div className="absolute bottom-0 left-0 w-4 h-[2px]" style={{ background: "#1687B8" }} />
          <div className="absolute bottom-0 left-0 w-[2px] h-4" style={{ background: "#1687B8" }} />
        </div>
        {/* BR — stepped pixel bracket (elaborate) */}
        <div className="absolute bottom-[6px] right-[6px]">
          <div className="absolute bottom-0 right-0 w-6 h-[2px]" style={{ background: "#1687B8" }} />
          <div className="absolute bottom-0 right-0 w-[2px] h-6" style={{ background: "#1687B8" }} />
          <div className="absolute bottom-[2px] right-[2px] w-3 h-[1px]" style={{ background: PK }} />
          <div className="absolute bottom-[2px] right-[2px] w-[1px] h-3" style={{ background: PK }} />
          <span className="absolute -bottom-[2px] -right-[2px] w-[3px] h-[3px]" style={{ background: "#1687B8" }} />
        </div>

        {/* Top edge — segmented accent marks */}
        <div className="absolute top-[9px] left-1/4 flex items-center gap-[3px]">
          <span className="w-[4px] h-[1px]" style={{ background: "#1687B8", opacity: 0.5 }} />
          <span className="w-[2px] h-[2px]" style={{ background: PK, opacity: 0.6 }} />
          <span className="w-[6px] h-[1px]" style={{ background: "#1687B8", opacity: 0.3 }} />
        </div>
        <div className="absolute top-[9px] right-1/4 flex items-center gap-[3px]">
          <span className="w-[6px] h-[1px]" style={{ background: "#1687B8", opacity: 0.3 }} />
          <span className="w-[2px] h-[2px]" style={{ background: PK, opacity: 0.6 }} />
          <span className="w-[4px] h-[1px]" style={{ background: "#1687B8", opacity: 0.5 }} />
        </div>

        {/* Bottom edge — segmented accent marks */}
        <div className="absolute bottom-[9px] left-1/3 flex items-center gap-[3px]">
          <span className="w-[2px] h-[2px]" style={{ background: PK, opacity: 0.5 }} />
          <span className="w-[8px] h-[1px]" style={{ background: "#1687B8", opacity: 0.25 }} />
        </div>
        <div className="absolute bottom-[9px] right-1/3 flex items-center gap-[3px]">
          <span className="w-[8px] h-[1px]" style={{ background: "#1687B8", opacity: 0.25 }} />
          <span className="w-[2px] h-[2px]" style={{ background: PK, opacity: 0.5 }} />
        </div>

        {/* Left edge — midpoint tick */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[8px] flex flex-col items-center gap-[2px]">
          <span className="w-[1px] h-[4px]" style={{ background: "#1687B8", opacity: 0.4 }} />
          <span className="w-[2px] h-[2px]" style={{ background: PK, opacity: 0.5 }} />
          <span className="w-[1px] h-[4px]" style={{ background: "#1687B8", opacity: 0.4 }} />
        </div>
        {/* Right edge — midpoint tick */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[8px] flex flex-col items-center gap-[2px]">
          <span className="w-[1px] h-[4px]" style={{ background: "#1687B8", opacity: 0.4 }} />
          <span className="w-[2px] h-[2px]" style={{ background: PK, opacity: 0.5 }} />
          <span className="w-[1px] h-[4px]" style={{ background: "#1687B8", opacity: 0.4 }} />
        </div>

        {/* Border labels — top-left */}
        <span className="absolute top-[10px] left-[24px] font-pixel text-[5px] tracking-widest" style={{ color: "#1687B8", opacity: 0.45 }}>FHC // EVENT TERMINAL</span>
        {/* Border labels — bottom-right */}
        <span className="absolute bottom-[10px] right-[24px] font-pixel text-[5px] tracking-widest" style={{ color: "#1687B8", opacity: 0.45 }}>04 PASSES AVAILABLE</span>
      </div>

      {/* ── Arcade Machine Frame ────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <div className="absolute inset-0" style={{ border: `3px solid ${accent}60` }} />
        <div className="absolute inset-[5px]" style={{ border: `2px solid ${INK}` }} />
        <div className="absolute inset-[9px]" style={{ border: `1px solid ${accent}15` }} />

        {/* Corner brackets */}
        <div className="absolute top-[5px] left-[5px]">
          <div className="w-5 h-[3px]" style={{ background: accent }} />
          <div className="w-[3px] h-5" style={{ background: accent }} />
          <span className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}60` }} />
        </div>
        <div className="absolute top-[5px] right-[5px]">
          <div className="w-5 h-[3px] ml-auto" style={{ background: accent }} />
          <div className="w-[3px] h-5 ml-auto" style={{ background: accent }} />
          <span className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full" style={{ background: YL, boxShadow: `0 0 8px ${YL}60` }} />
        </div>
        <div className="absolute bottom-[5px] left-[5px]">
          <div className="absolute bottom-0 left-0 w-5 h-[3px]" style={{ background: accent }} />
          <div className="absolute bottom-0 left-0 w-[3px] h-5" style={{ background: accent }} />
          <span className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] rounded-full" style={{ background: GR, boxShadow: `0 0 8px ${GR}60` }} />
        </div>
        <div className="absolute bottom-[5px] right-[5px]">
          <div className="absolute bottom-0 right-0 w-5 h-[3px]" style={{ background: accent }} />
          <div className="absolute bottom-0 right-0 w-[3px] h-5" style={{ background: accent }} />
          <span className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] rounded-full" style={{ background: PK, boxShadow: `0 0 8px ${PK}60` }} />
        </div>

        {/* Side screws */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[5px] w-[4px] h-[4px] rounded-full" style={{ background: `${accent}70`, boxShadow: `0 0 4px ${accent}40` }} />
        <div className="absolute top-1/2 -translate-y-1/2 right-[5px] w-[4px] h-[4px] rounded-full" style={{ background: `${accent}70`, boxShadow: `0 0 4px ${accent}40` }} />
      </div>

      <div className="relative z-10 max-w-[1300px] mx-auto px-4 sm:px-6 py-10 md:py-14">

        {/* ── HEADER — Arcade Marquee ───────────────────────────── */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-pixel text-[10px] tracking-wider" style={{ color: accent, letterSpacing: 2 }}>//</span>
            <h2
              className="font-pixel tracking-wider font-bold"
              style={{ fontSize: "clamp(15px, 4.5vw, 28px)", color: CR, textShadow: `2px 2px 0 0 ${INK}, 0 0 12px ${accent}30` }}
            >
              FHC EVENT ARCADE
            </h2>
            <span className="inline-block w-[8px] h-[14px]" style={{ background: accent, animation: "blink 1s steps(1) infinite" }} />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-pixel text-[8px] tracking-widest" style={{ color: `${accent}90` }}>UPCOMING EVENTS</span>
            <span className="flex-1 h-[1px] hidden sm:block" style={{ background: `${accent}20` }} />
            <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${CR}30` }}>SELECT YOUR NEXT EXPERIENCE</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="w-[4px] h-[4px] rounded-full" style={{ background: GR, animation: "led-blink 1.2s ease-in-out infinite" }} />
            <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${CR}25` }}>FHC // EVENT TERMINAL</span>
            <span className="flex-1 h-[1px]" style={{ background: `${CR}08` }} />
            <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${GR}50` }}>SYSTEM ONLINE</span>
          </div>
        </div>

        {/* ── MAIN 3-PANEL LAYOUT ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-4 lg:gap-5 items-start">

          {/* ═══════════════════════════════════════════════════════════
              LEFT — ARCADE EVENT SELECTOR
              ═══════════════════════════════════════════════════════════ */}
          <div className="order-2 lg:order-1">
            {/* Selector header */}
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-[5px] h-[5px]" style={{ background: accent }} />
              <span className="font-pixel text-[7px] tracking-widest" style={{ color: `${accent}90` }}>EVENT SELECTOR</span>
            </div>

            {/* Mobile: horizontal scroll carousel */}
            <div className="flex lg:flex-col gap-2 events-selector-scroll lg:events-selector-scroll-none pb-2 lg:pb-0">
              {EVENTS.map((ev, i) => {
                const isActive = i === selected;
                const evAccent = accents[i];
                return (
                  <button
                    key={ev.title}
                    onClick={() => handleSelect(i)}
                    className="relative text-left w-[140px] lg:w-full transition-all duration-200 group"
                    style={{
                      background: isActive ? `${evAccent}12` : `${INK}90`,
                      border: `2px solid ${isActive ? evAccent : `${INK}60`}`,
                      boxShadow: isActive ? `inset 0 0 16px ${evAccent}20, 0 0 8px ${evAccent}15` : "none",
                      animation: isActive ? "selector-active-glow 2.5s ease-in-out infinite" : "none",
                      ["--glow-color"]: evAccent,
                    }}
                  >
                    {/* Active pixel cursor */}
                    {isActive && (
                      <div className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-[4px] h-[4px]" style={{ background: evAccent, boxShadow: `0 0 6px ${evAccent}` }} />
                    )}

                    <div className="p-3 flex items-center gap-3">
                      {/* Stage number */}
                      <div
                        className="flex-shrink-0 w-[32px] h-[32px] flex items-center justify-center"
                        style={{
                          background: isActive ? evAccent : `${INK}`,
                          border: `2px solid ${isActive ? INK : `${evAccent}30`}`,
                        }}
                      >
                        <span
                          className="font-pixel text-[10px] font-bold"
                          style={{ color: isActive ? INK : evAccent }}
                        >
                          {num === String(i + 1).padStart(2, "0") ? num : String(i + 1).padStart(2, "0")}
                        </span>
                      </div>

                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-pixel text-[5px] tracking-widest" style={{ color: isActive ? evAccent : `${CR}30` }}>
                            STAGE {String(i + 1).padStart(2, "0")}
                          </span>
                          {isActive && (
                            <span className="font-pixel text-[5px] px-1.5 py-0.5" style={{ background: evAccent, color: INK }}>SELECTED</span>
                          )}
                        </div>
                        <p
                          className="font-pixel text-[7px] tracking-wider truncate leading-tight"
                          style={{ color: isActive ? CR : `${CR}60` }}
                        >
                          {ev.title}
                        </p>
                        <p className="font-pixel text-[6px] mt-1" style={{ color: isActive ? evAccent : `${CR}25` }}>
                          {ev.day}
                        </p>
                      </div>
                    </div>

                    {/* Bottom accent bar */}
                    {isActive && (
                      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${evAccent}, transparent)` }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile: dots indicator */}
            <div className="flex lg:hidden items-center justify-center gap-2 mt-3">
              {EVENTS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className="w-[6px] h-[6px] transition-all duration-200"
                  style={{
                    background: i === selected ? accents[i] : `${CR}20`,
                    boxShadow: i === selected ? `0 0 6px ${accents[i]}60` : "none",
                  }}
                />
              ))}
            </div>

            {/* Decorative ticket dispenser */}
            <div className="hidden lg:block mt-4 mx-2">
              <div
                className="relative p-3"
                style={{ background: `${INK}`, border: `1px solid ${accent}20` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 flex items-center justify-center" style={{ border: `1px solid ${accent}40` }}>
                    <span className="font-pixel text-[5px] font-bold" style={{ color: accent }}>FHC</span>
                  </div>
                  <div>
                    <span className="font-pixel text-[5px] tracking-widest block" style={{ color: `${CR}30` }}>TICKET</span>
                    <span className="font-pixel text-[5px] tracking-widest block" style={{ color: `${CR}20` }}>DISPENSER</span>
                  </div>
                </div>
                {/* Mini ticket sticking out */}
                <div className="flex gap-[1px]">
                  {[3,5,2,4,6,2,3,5,2,4].map((w, i) => (
                    <div key={i} style={{ width: w, height: 8, background: i % 3 === 0 ? accent : `${CR}10` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              CENTER — FEATURED EVENT TICKET
              ═══════════════════════════════════════════════════════════ */}
          <div className="order-1 lg:order-2" key={ticketKey}>
            <div className="animate-ticket-in">
              {/* Ticket wrapper with depth */}
              <div className="relative" style={{ filter: `drop-shadow(0 8px 24px ${accent}15)` }}>
                {/* Offset shadow for physical feel */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: accent,
                    opacity: 0.08,
                    transform: "translate(6px, 6px)",
                    clipPath: "polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))",
                  }}
                />

                {/* Main ticket */}
                <div
                  className="relative flex"
                  style={{
                    background: CR,
                    border: `3px solid ${INK}`,
                    clipPath: "polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))",
                  }}
                >
                  {/* ── Ticket main body ──────────────────── */}
                  <div className="flex-1 p-5 sm:p-6 md:p-8 flex flex-col min-w-0">
                    {/* Top header row */}
                    <div className="flex items-start justify-between mb-4 md:mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2" style={{ background: accent }} />
                          <span className="font-pixel text-[7px] tracking-widest" style={{ color: `${INK}50` }}>FHC EVENT PASS</span>
                        </div>
                        <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${INK}25` }}>FISAT HORIZON CLUB</span>
                      </div>
                      <div className="text-right">
                        <span className="font-pixel text-[6px] tracking-widest block" style={{ color: `${INK}35` }}>PASS // {num}</span>
                        <span className="font-pixel text-[5px] tracking-widest block mt-1" style={{ color: `${INK}20` }}>SERIAL: FHC-TKT-{num}</span>
                      </div>
                    </div>

                    {/* Date display */}
                    <div className="mb-4 md:mb-6">
                      <div
                        className="inline-block px-4 py-2"
                        style={{
                          background: accent,
                          border: `2px solid ${INK}`,
                          clipPath: "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))",
                        }}
                      >
                        <span className="font-pixel text-[12px] sm:text-[14px] font-bold tracking-wider" style={{ color: INK }}>{e.day}</span>
                      </div>
                    </div>

                    {/* Title area */}
                    <div className="mb-4 md:mb-6">
                      <h3
                        className="font-pixel tracking-wider font-bold leading-tight mb-3"
                        style={{ fontSize: 22, color: INK, lineHeight: 1.3 }}
                      >
                        {e.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-[2px] w-8" style={{ background: accent }} />
                        <div className="h-[2px] w-4" style={{ background: `${accent}40` }} />
                      </div>
                      <p className="font-pixel text-[8px] sm:text-[9px] leading-[2]" style={{ color: `${INK}65` }}>
                        {e.desc}
                      </p>
                    </div>

                    {/* Icon display area */}
                    <div
                      className="relative flex items-center justify-center mb-5 md:mb-6"
                      style={{
                        background: INK,
                        border: `2px solid ${accent}25`,
                        height: 100,
                      }}
                    >
                      {/* Corner brackets */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: `${accent}40` }} />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: `${accent}40` }} />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: `${accent}40` }} />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: `${accent}40` }} />
                      <span
                        className="text-4xl sm:text-5xl relative z-10 transition-transform duration-300 hover:scale-110"
                        style={{ filter: `drop-shadow(0 0 12px ${accent}30)` }}
                      >
                        {e.icon}
                      </span>
                      {/* Tiny accent pixels */}
                      <span className="absolute top-3 right-4 w-[3px] h-[3px]" style={{ background: accent, opacity: 0.3 }} />
                      <span className="absolute bottom-3 left-4 w-[2px] h-[2px]" style={{ background: accent, opacity: 0.25 }} />
                      <span className="absolute top-3 left-4 w-[2px] h-[2px]" style={{ background: YL, opacity: 0.2 }} />
                    </div>

                    {/* Register button */}
                    <div className="mb-4">
                      <div
                        className="relative inline-flex cursor-pointer group/btn transition-all duration-200"
                        style={{
                          background: INK,
                          border: `2px solid ${accent}50`,
                          clipPath: "polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))",
                        }}
                      >
                        <div
                          className="absolute inset-0 translate-x-[3px] translate-y-[3px] transition-all duration-200 group-hover/btn:translate-x-[4px] group-hover/btn:translate-y-[4px]"
                          style={{ background: accent, opacity: 0.3 }}
                        />
                        <div
                          className="relative flex items-center gap-2 px-5 py-2.5 transition-all duration-200 group-hover/btn:translate-y-[-1px]"
                          style={{
                            background: INK,
                            clipPath: "polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))",
                          }}
                        >
                          <span className="font-pixel text-[9px]" style={{ color: accent }}>&#9654;</span>
                          <span className="font-pixel text-[9px] tracking-wider" style={{ color: CR }}>GET YOUR PASS</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom row: serial + registration marks */}
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[5px] tracking-widest" style={{ color: `${INK}25` }}>FHC // EVENT PASS // NO. {num}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-[5px]" style={{ color: `${INK}15` }}>&#9670;</span>
                        <span className="font-pixel text-[5px]" style={{ color: `${INK}15` }}>&#9670;</span>
                      </div>
                      <span className="font-pixel text-[5px] tracking-widest" style={{ color: `${INK}25` }}>{num} / 04</span>
                    </div>
                  </div>

                  {/* ── Perforation line ────────────────────── */}
                  <div
                    className="w-[2px] flex flex-col items-center justify-between py-3"
                    style={{
                      background: `repeating-linear-gradient(to bottom, ${INK}20 0px, ${INK}20 4px, transparent 4px, transparent 8px)`,
                    }}
                  />

                  {/* ── Ticket stub ─────────────────────────── */}
                  <div
                    className="w-[70px] sm:w-[80px] flex flex-col items-center justify-between py-4 flex-shrink-0"
                    style={{ background: `${accent}06` }}
                  >
                    {/* Stub top: FHC + number */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-7 h-7 flex items-center justify-center"
                        style={{ border: `1.5px solid ${accent}40` }}
                      >
                        <span className="font-pixel text-[7px] font-bold" style={{ color: accent }}>FHC</span>
                      </div>
                      <span className="font-pixel text-[10px] font-bold" style={{ color: accent }}>{num}</span>
                      <span className="font-pixel text-[5px] tracking-widest" style={{ color: `${INK}35` }}>EVENT</span>
                    </div>

                    {/* Stub middle: date */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${INK}30` }}>DATE</span>
                      <span className="font-pixel text-[7px] font-bold" style={{ color: `${INK}60` }}>{e.day}</span>
                    </div>

                    {/* Stub: pixel barcode */}
                    <div className="flex flex-col items-center gap-[2px]">
                      {[5,2,7,2,4,2,6,2,3,2,5,2,7,2,4].map((w, i) => (
                        <div key={i} style={{ width: w, height: 2, background: i % 2 === 0 ? accent : `${INK}12` }} />
                      ))}
                    </div>

                    {/* Stub bottom */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-pixel text-[5px] tracking-widest" style={{ color: `${INK}25` }}>PASS</span>
                      <span className="font-pixel text-[5px] tracking-widest" style={{ color: `${INK}25` }}>ADMIT</span>
                      <span className="font-pixel text-[5px] tracking-widest" style={{ color: `${INK}25` }}>ONE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              RIGHT — ARCADE BOOKING CONSOLE
              ═══════════════════════════════════════════════════════════ */}
          <div className="order-3">
            {/* Console header */}
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-[5px] h-[5px]" style={{ background: accent }} />
              <span className="font-pixel text-[7px] tracking-widest" style={{ color: `${accent}90` }}>EVENT INFO</span>
            </div>

            <div
              className="p-4"
              style={{
                background: `${INK}f0`,
                border: `2px solid ${accent}25`,
              }}
            >
              {/* Status indicator */}
              <div className="mb-4 pb-3" style={{ borderBottom: `1px solid ${accent}15` }}>
                <span className="font-pixel text-[6px] tracking-widest block mb-2" style={{ color: `${CR}30` }}>REGISTRATION STATUS</span>
                <div className="flex items-center gap-2">
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: GR, boxShadow: `0 0 6px ${GR}60` }} />
                  <span className="font-pixel text-[8px] tracking-wider" style={{ color: GR }}>REGISTRATION OPEN</span>
                </div>
              </div>

              {/* Date */}
              <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${accent}10` }}>
                <span className="font-pixel text-[6px] tracking-widest block mb-1.5" style={{ color: `${CR}25` }}>DATE</span>
                <span className="font-pixel text-[11px] font-bold tracking-wider" style={{ color: accent }}>{e.day}</span>
              </div>

              {/* Event name */}
              <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${accent}10` }}>
                <span className="font-pixel text-[6px] tracking-widest block mb-1.5" style={{ color: `${CR}25` }}>EVENT</span>
                <span className="font-pixel text-[9px] tracking-wider block leading-relaxed" style={{ color: CR }}>{e.title}</span>
              </div>

              {/* Event number */}
              <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${accent}10` }}>
                <span className="font-pixel text-[6px] tracking-widest block mb-1.5" style={{ color: `${CR}25` }}>PASS NUMBER</span>
                <span className="font-pixel text-[14px] font-bold" style={{ color: accent }}>{num}</span>
                <span className="font-pixel text-[6px] tracking-widest ml-2" style={{ color: `${CR}20` }}>/ 04</span>
              </div>

              {/* Coin slot decoration */}
              <div className="mb-4 py-2 flex items-center justify-center" style={{ border: `1px dashed ${accent}15` }}>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[5px]" style={{ color: `${CR}20` }}>&#9670;</span>
                  <span className="font-pixel text-[5px] tracking-widest" style={{ color: `${CR}20` }}>INSERT COIN</span>
                  <span className="font-pixel text-[5px]" style={{ color: `${CR}20` }}>&#9670;</span>
                </div>
              </div>

              {/* Confirm button */}
              <div
                className="relative w-full cursor-pointer group transition-all duration-200"
                style={{
                  background: accent,
                  border: `2px solid ${INK}`,
                  clipPath: "polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))",
                }}
              >
                <div
                  className="absolute inset-0 translate-x-[2px] translate-y-[2px] transition-all duration-200 group-hover:translate-x-[3px] group-hover:translate-y-[3px]"
                  style={{ background: INK, opacity: 0.3 }}
                />
                <div
                  className="relative flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200 group-hover:translate-y-[-1px]"
                >
                  <span className="font-pixel text-[9px] font-bold tracking-wider" style={{ color: INK }}>&#9654; SELECT</span>
                </div>
              </div>

              {/* Indicator lights */}
              <div className="flex items-center justify-center gap-2 mt-3">
                {[PK, CY, YL, GR].map((c, i) => (
                  <span
                    key={i}
                    className="w-[4px] h-[4px]"
                    style={{
                      background: c,
                      opacity: i === selected ? 1 : 0.2,
                      boxShadow: i === selected ? `0 0 4px ${c}80` : "none",
                      transition: "all 0.3s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* View All Events button */}
            <div className="mt-4">
              <div
                className="relative cursor-pointer group transition-all duration-200 w-full"
                style={{
                  background: INK,
                  border: `2px solid ${accent}40`,
                  clipPath: "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))",
                }}
              >
                <div
                  className="absolute inset-0 translate-x-[2px] translate-y-[2px] transition-all duration-200 group-hover:translate-x-[3px] group-hover:translate-y-[3px]"
                  style={{ background: accent, opacity: 0.2 }}
                />
                <div
                  className="relative flex items-center justify-center gap-2 px-4 py-2.5 transition-all duration-200 group-hover:translate-y-[-1px]"
                  style={{
                    background: INK,
                    clipPath: "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))",
                  }}
                >
                  <span className="font-pixel text-[8px] tracking-wider" style={{ color: CR }}>VIEW ALL EVENTS</span>
                  <span className="font-pixel text-[8px]" style={{ color: accent }}>&#9654;</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM STATUS BAR ──────────────────────────────────── */}
        <div
          className="mt-8 md:mt-10 flex flex-wrap items-center justify-between gap-3 pt-4"
          style={{ borderTop: `1px solid ${accent}12` }}
        >
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[7px] tracking-widest" style={{ color: `${CR}40` }}>&gt; SELECT AN EVENT TO VIEW DETAILS</span>
            <span className="inline-block w-[5px] h-[9px]" style={{ background: `${CR}20`, animation: "blink 1s steps(1) infinite" }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${CR}20` }}>FHC EVENT TERMINAL</span>
            <span className="h-[8px] w-[1px]" style={{ background: `${CR}10` }} />
            <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${CR}20` }}>04 PASSES AVAILABLE</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PROJECTS — FHC CREATIVE WORKSHOP / EDITORIAL SHOWCASE
   ═══════════════════════════════════════════════════════════════════ */
function ProjectsBand() {
  const C = {
    bg: "#D9D4E3",
    ink: "#17151D",
    pink: "#FF2D87",
    purple: "#7657FF",
    mint: "#5FE0B7",
    blue: "#65B8FF",
  };

  const featured = PROJECTS[0];

  return (
    <section
      id="projects"
      className="relative scroll-mt-24 overflow-hidden"
      style={{ background: C.bg, borderTop: `4px solid ${C.ink}`, borderBottom: `4px solid ${C.pink}` }}
    >
      {/* ═══ SUBTLE HORIZONTAL TEXTURE ════════════════════════════ */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(23,21,29,0.012) 0px, rgba(23,21,29,0.012) 1px, transparent 1px, transparent 5px)",
        }}
      />

      {/* ═══ DECORATIVE PIXELS ════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
        {[
          { x: "4%", y: "12%", c: C.pink, s: 3 }, { x: "16%", y: "85%", c: C.purple, s: 2 },
          { x: "28%", y: "8%", c: C.mint, s: 2 }, { x: "42%", y: "92%", c: C.pink, s: 3 },
          { x: "56%", y: "15%", c: C.blue, s: 2 }, { x: "68%", y: "78%", c: C.purple, s: 2 },
          { x: "82%", y: "22%", c: C.mint, s: 3 }, { x: "94%", y: "88%", c: C.pink, s: 2 },
          { x: "10%", y: "48%", c: C.blue, s: 2 }, { x: "90%", y: "55%", c: C.purple, s: 2 },
        ].map((p, i) => (
          <span key={`dp${i}`} className="absolute" style={{ left: p.x, top: p.y, width: p.s, height: p.s, background: p.c, opacity: 0.12 }} />
        ))}
        {/* Tiny plus signs */}
        {[
          { x: "8%", y: "30%" }, { x: "24%", y: "72%" }, { x: "48%", y: "18%" },
          { x: "72%", y: "65%" }, { x: "88%", y: "38%" },
        ].map((p, i) => (
          <span key={`pl${i}`} className="absolute font-pixel" style={{ left: p.x, top: p.y, fontSize: 8, color: C.pink, opacity: 0.08 }}>+</span>
        ))}
        {/* Registration marks */}
        <span className="absolute font-pixel" style={{ left: "2%", top: "4%", fontSize: 7, color: C.ink, opacity: 0.06 }}>&#9670;</span>
        <span className="absolute font-pixel" style={{ right: "2%", top: "4%", fontSize: 7, color: C.ink, opacity: 0.06 }}>&#9670;</span>
        <span className="absolute font-pixel" style={{ left: "2%", bottom: "4%", fontSize: 7, color: C.ink, opacity: 0.06 }}>&#9670;</span>
        <span className="absolute font-pixel" style={{ right: "2%", bottom: "4%", fontSize: 7, color: C.ink, opacity: 0.06 }}>&#9670;</span>
      </div>

      {/* ═══ SECTION FRAME ═════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Dark ink outer border */}
        <div className="absolute inset-0" style={{ border: `3px solid ${C.ink}` }} />
        {/* Hot pink offset */}
        <div className="absolute inset-[5px]" style={{ border: `2px solid ${C.pink}` }} />
        {/* Purple inner */}
        <div className="absolute inset-[10px]" style={{ border: `1px solid ${C.purple}20` }} />

        {/* Asymmetric corners — bold editorial style */}
        {/* TL: large pink block */}
        <div className="absolute top-[5px] left-[5px] pointer-events-none">
          <div className="w-6 h-[3px]" style={{ background: C.pink }} />
          <div className="w-[3px] h-6" style={{ background: C.pink }} />
        </div>
        {/* TR: purple offset */}
        <div className="absolute top-[5px] right-[5px] pointer-events-none">
          <div className="w-4 h-[2px] ml-auto" style={{ background: C.purple }} />
          <div className="w-[2px] h-4 ml-auto" style={{ background: C.purple }} />
        </div>
        {/* BL: ink block */}
        <div className="absolute bottom-[5px] left-[5px] pointer-events-none">
          <div className="absolute bottom-0 left-0 w-4 h-[3px]" style={{ background: C.ink }} />
          <div className="absolute bottom-0 left-0 w-[3px] h-4" style={{ background: C.ink }} />
        </div>
        {/* BR: pink diagonal cut */}
        <div className="absolute bottom-[5px] right-[5px] pointer-events-none">
          <div className="absolute bottom-0 right-0 w-5 h-[2px]" style={{ background: C.pink }} />
          <div className="absolute bottom-0 right-0 w-[2px] h-5" style={{ background: C.pink }} />
        </div>

        {/* Registration marks */}
        <span className="absolute top-[14px] left-[14px] font-pixel text-[6px]" style={{ color: C.pink, opacity: 0.4 }}>+</span>
        <span className="absolute top-[14px] right-[14px] font-pixel text-[6px]" style={{ color: C.pink, opacity: 0.4 }}>+</span>
        <span className="absolute bottom-[14px] left-[14px] font-pixel text-[6px]" style={{ color: C.purple, opacity: 0.4 }}>+</span>
        <span className="absolute bottom-[14px] right-[14px] font-pixel text-[6px]" style={{ color: C.purple, opacity: 0.4 }}>+</span>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-20">

        {/* ═══ HEADER ═══════════════════════════════════════════════ */}
        <div className="mb-12">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2
                className="font-pixel leading-none tracking-wider"
                style={{ fontSize: 48, color: C.ink }}
              >
                PROJECTS
              </h2>
              <div className="flex items-center gap-3 mt-3">
                <span className="h-[2px] w-8" style={{ background: C.pink }} />
                <span className="font-pixel text-[9px] tracking-widest" style={{ color: C.ink, opacity: 0.5 }}>
                  THINGS WE BUILD AT FHC
                </span>
              </div>
            </div>

            {/* Decorative pixel illustration area */}
            <div className="hidden md:flex items-center gap-3 mt-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 flex items-center justify-center" style={{ border: `2px solid ${C.pink}30` }}>
                  <span className="text-2xl">{PROJECTS[0].icon}</span>
                </div>
                <span className="font-pixel text-[5px]" style={{ color: C.pink }}>01</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 flex items-center justify-center" style={{ border: `2px solid ${C.purple}30` }}>
                  <span className="text-lg">{PROJECTS[1].icon}</span>
                </div>
                <span className="font-pixel text-[5px]" style={{ color: C.purple }}>02</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-5 h-5 flex items-center justify-center" style={{ border: `2px solid ${C.mint}30` }}>
                  <span className="text-sm">{PROJECTS[2].icon}</span>
                </div>
                <span className="font-pixel text-[5px]" style={{ color: C.mint }}>03</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 flex items-center justify-center" style={{ border: `2px solid ${C.blue}30` }}>
                  <span className="text-lg">{PROJECTS[3].icon}</span>
                </div>
                <span className="font-pixel text-[5px]" style={{ color: C.blue }}>04</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ FEATURED PROJECT — CAMPUS PAY ═════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-6 lg:gap-8 mb-12">
          {/* Left: Large visual window */}
          <div className="relative">
            {/* Large number behind */}
            <span
              className="absolute -top-6 -left-3 font-pixel font-bold pointer-events-none z-0 select-none"
              style={{ fontSize: 120, color: `${C.pink}10`, lineHeight: 1 }}
            >
              01
            </span>

            {/* Image panel */}
            <div
              className="relative z-10 overflow-hidden group"
              style={{
                background: "#EAE6F0",
                border: `4px solid ${C.ink}`,
                boxShadow: `8px 8px 0 0 ${C.pink}`,
              }}
            >
              {/* Inner purple border */}
              <div className="absolute inset-[4px] pointer-events-none z-10" style={{ border: `1px solid ${C.purple}25` }} />

              {/* Top bar */}
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{ borderBottom: `2px solid ${C.ink}`, background: "#E2DDE8" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ background: C.pink }} />
                  <span className="font-pixel text-[7px] tracking-wider" style={{ color: C.ink }}>CAMPUS PAY</span>
                </div>
                <span className="font-pixel text-[6px] tracking-widest" style={{ color: C.ink, opacity: 0.4 }}>FHC // 01</span>
              </div>

              {/* Image area */}
              <div className="relative p-8 flex items-center justify-center" style={{ minHeight: 280 }}>
                <span
                  className="text-[120px] group-hover:scale-105 transition-transform duration-300"
                  style={{ filter: "drop-shadow(0 4px 12px rgba(23,21,29,0.15))" }}
                >
                  {featured.icon}
                </span>

                {/* Halftone texture overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.03]"
                  style={{
                    backgroundImage: `radial-gradient(${C.ink} 1px, transparent 1px)`,
                    backgroundSize: "6px 6px",
                  }}
                />

                {/* Corner decorations */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: `${C.pink}40` }} />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: `${C.purple}40` }} />

                {/* Bottom label */}
                <div className="absolute bottom-3 left-3 z-20">
                  <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${C.ink}40` }}>FHC_PROJECT_01</span>
                </div>
              </div>
            </div>

            {/* BUILT AT FHC stamp */}
            <div
              className="absolute -bottom-3 -right-2 z-20 px-3 py-1.5"
              style={{
                background: C.pink,
                border: `2px solid ${C.ink}`,
                transform: "rotate(-2deg)",
              }}
            >
              <span className="font-pixel text-[7px] tracking-wider" style={{ color: "#fff" }}>BUILT AT FHC</span>
            </div>
          </div>

          {/* Right: Project information */}
          <div className="flex flex-col justify-center">
            <span className="font-pixel text-[10px] tracking-widest mb-2" style={{ color: C.pink }}>PROJECT 01</span>
            <h3
              className="font-pixel tracking-wider font-bold leading-tight mb-4"
              style={{ fontSize: 32, color: C.ink }}
            >
              CAMPUS PAY
            </h3>

            {/* Decorative separator */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-[2px]" style={{ background: C.pink }} />
              <div className="w-4 h-[2px]" style={{ background: C.purple }} />
              <div className="w-2 h-[2px]" style={{ background: C.mint }} />
            </div>

            <p className="font-pixel text-[9px] leading-[2.2] mb-6" style={{ color: `${C.ink}80` }}>
              {featured.desc}
            </p>

            {/* Technology */}
            <div className="mb-6">
              <span className="font-pixel text-[7px] tracking-widest block mb-2" style={{ color: `${C.ink}50` }}>TECHNOLOGY</span>
              <div className="flex flex-wrap gap-2">
                {featured.tech.map((t) => (
                  <span
                    key={t}
                    className="font-pixel text-[9px] px-4 py-2"
                    style={{
                      background: C.ink,
                      color: "#fff",
                    }}
                  >
                    {t.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* View Project button */}
            <div
              className="relative inline-flex cursor-pointer group transition-all duration-200 self-start"
              style={{
                background: C.ink,
                border: `3px solid ${C.ink}`,
                boxShadow: `5px 5px 0 0 ${C.purple}`,
              }}
            >
              <div
                className="flex items-center gap-3 px-6 py-3 transition-all duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[2px]"
                style={{ background: C.pink }}
              >
                <span className="font-pixel text-[10px]" style={{ color: C.ink }}>&gt;</span>
                <span className="font-pixel text-[11px] tracking-wider" style={{ color: C.ink }}>VIEW PROJECT</span>
              </div>
            </div>

            {/* Project counter */}
            <div className="mt-6 flex items-center gap-3">
              <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${C.ink}35` }}>01 / 04</span>
              <span className="h-[1px] w-12" style={{ background: `${C.ink}15` }} />
              <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${C.ink}35` }}>CAMPUS PAY</span>
            </div>
          </div>
        </div>

        {/* ═══ MORE FROM THE LAB ════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="h-[2px] w-6" style={{ background: C.pink }} />
            <span className="font-pixel text-[10px] tracking-wider" style={{ color: C.ink }}>MORE FROM THE LAB</span>
            <span className="flex-1 h-[1px]" style={{ background: `${C.ink}10` }} />
            <span className="font-pixel text-[6px] tracking-widest" style={{ color: `${C.ink}30` }}>PROJECTS 02-04</span>
          </div>

          {/* ═══ ASYMMETRIC PROJECT GRID ══════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

            {/* ═══ MEDITSCHED — large horizontal panel ═══════════════ */}
            <div className="group relative">
              {/* Number */}
              <span
                className="absolute -top-3 left-3 font-pixel font-bold pointer-events-none z-0 select-none"
                style={{ fontSize: 80, color: `${C.blue}15`, lineHeight: 1 }}
              >
                02
              </span>

              <div
                className="relative z-10 overflow-hidden transition-all duration-200 group-hover:translate-y-[-2px]"
                style={{
                  background: "#E4EDF5",
                  border: `3px solid ${C.ink}`,
                  boxShadow: `6px 6px 0 0 ${C.blue}`,
                }}
              >
                {/* Inner border */}
                <div className="absolute inset-[3px] pointer-events-none z-10" style={{ border: `1px solid ${C.blue}20` }} />

                <div className="grid sm:grid-cols-[1fr_1.2fr] gap-0">
                  {/* Image area */}
                  <div className="relative p-6 flex items-center justify-center" style={{ minHeight: 180 }}>
                    <span
                      className="text-[80px] group-hover:scale-105 transition-transform duration-300"
                      style={{ filter: "drop-shadow(0 3px 8px rgba(23,21,29,0.12))" }}
                    >
                      {PROJECTS[1].icon}
                    </span>
                    {/* Halftone */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-[0.025]"
                      style={{
                        backgroundImage: `radial-gradient(${C.ink} 1px, transparent 1px)`,
                        backgroundSize: "5px 5px",
                      }}
                    />
                    {/* Corner brackets */}
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: `${C.blue}30` }} />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: `${C.blue}30` }} />
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-pixel text-[7px] tracking-wider" style={{ color: C.blue }}>PROJECT 02</span>
                      <div className="w-4 h-[1px]" style={{ background: C.blue }} />
                    </div>
                    <h4
                      className="font-pixel tracking-wider font-bold leading-tight mb-3"
                      style={{ fontSize: 20, color: C.ink }}
                    >
                      {PROJECTS[1].title}
                    </h4>
                    <p className="font-pixel text-[8px] leading-[2] mb-4" style={{ color: `${C.ink}65` }}>
                      {PROJECTS[1].desc}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {PROJECTS[1].tech.map((t) => (
                        <span
                          key={t}
                          className="font-pixel text-[7px] px-3 py-1.5"
                          style={{ background: C.blue, color: "#fff" }}
                        >
                          {t.toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <div
                      className="inline-flex cursor-pointer group/btn transition-all duration-200 self-start"
                      style={{
                        border: `2px solid ${C.ink}`,
                        boxShadow: `3px 3px 0 0 ${C.blue}`,
                      }}
                    >
                      <div
                        className="flex items-center gap-2 px-4 py-2 transition-all duration-200 group-hover/btn:translate-x-[1px] group-hover/btn:translate-y-[1px]"
                        style={{ background: `${C.blue}20` }}
                      >
                        <span className="font-pixel text-[8px]" style={{ color: C.ink }}>&gt;</span>
                        <span className="font-pixel text-[8px] tracking-wider" style={{ color: C.ink }}>VIEW</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom accent */}
                <div className="h-[3px]" style={{ background: `${C.blue}40` }} />
              </div>
            </div>

            {/* ═══ RIGHT COLUMN: HORIZON BOT + FARMWISE ═══════════════ */}
            <div className="flex flex-col gap-5">

              {/* ═══ HORIZON BOT — playful pink panel ════════════════ */}
              <div className="group relative">
                {/* Stamp number */}
                <div
                  className="absolute -top-2 -right-2 z-20 w-8 h-8 flex items-center justify-center"
                  style={{
                    background: C.pink,
                    border: `2px solid ${C.ink}`,
                    transform: "rotate(6deg)",
                  }}
                >
                  <span className="font-pixel text-[8px] font-bold" style={{ color: "#fff" }}>03</span>
                </div>

                <div
                  className="relative z-10 overflow-hidden transition-all duration-200 group-hover:translate-y-[-2px]"
                  style={{
                    background: "#F2E0EE",
                    border: `3px solid ${C.ink}`,
                    boxShadow: `5px 5px 0 0 ${C.pink}`,
                  }}
                >
                  {/* Inner border */}
                  <div className="absolute inset-[3px] pointer-events-none z-10" style={{ border: `1px solid ${C.pink}20` }} />

                  {/* Image */}
                  <div className="relative p-4 flex items-center justify-center" style={{ minHeight: 120 }}>
                    <span
                      className="text-[56px] group-hover:scale-105 transition-transform duration-300"
                      style={{ filter: "drop-shadow(0 2px 6px rgba(23,21,29,0.1))" }}
                    >
                      {PROJECTS[2].icon}
                    </span>
                    {/* Corner */}
                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l pointer-events-none" style={{ borderColor: `${C.pink}40` }} />
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r pointer-events-none" style={{ borderColor: `${C.purple}40` }} />
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-pixel text-[6px] tracking-wider" style={{ color: C.pink }}>PROJECT 03</span>
                    </div>
                    <h4
                      className="font-pixel tracking-wider font-bold leading-tight mb-2"
                      style={{ fontSize: 16, color: C.ink }}
                    >
                      {PROJECTS[2].title}
                    </h4>
                    <p className="font-pixel text-[7px] leading-[1.9] mb-3" style={{ color: `${C.ink}60` }}>
                      {PROJECTS[2].desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {PROJECTS[2].tech.map((t) => (
                        <span
                          key={t}
                          className="font-pixel text-[6px] px-2 py-1"
                          style={{ background: `${C.pink}20`, border: `1px solid ${C.pink}40`, color: C.pink }}
                        >
                          {t.toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <div
                      className="inline-flex cursor-pointer group/btn transition-all duration-200"
                      style={{ border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 0 ${C.pink}` }}
                    >
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 transition-all duration-200 group-hover/btn:translate-x-[1px] group-hover/btn:translate-y-[1px]"
                        style={{ background: `${C.pink}15` }}
                      >
                        <span className="font-pixel text-[7px]" style={{ color: C.ink }}>&gt;</span>
                        <span className="font-pixel text-[7px] tracking-wider" style={{ color: C.ink }}>VIEW</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ FARMWISE — mint environmental panel ═════════════ */}
              <div className="group relative">
                {/* Number — vertical */}
                <span
                  className="absolute -left-2 top-4 font-pixel font-bold pointer-events-none z-0 select-none"
                  style={{ fontSize: 72, color: `${C.mint}18`, lineHeight: 1, writingMode: "vertical-rl" }}
                >
                  04
                </span>

                <div
                  className="relative z-10 overflow-hidden transition-all duration-200 group-hover:translate-y-[-2px]"
                  style={{
                    background: "#DFF0E8",
                    border: `3px solid ${C.ink}`,
                    boxShadow: `5px 5px 0 0 ${C.mint}`,
                  }}
                >
                  {/* Inner border */}
                  <div className="absolute inset-[3px] pointer-events-none z-10" style={{ border: `1px solid ${C.mint}20` }} />

                  <div className="grid sm:grid-cols-[auto_1fr] gap-0">
                    {/* Image */}
                    <div className="relative p-4 flex items-center justify-center" style={{ minHeight: 100 }}>
                      <span
                        className="text-[52px] group-hover:scale-105 transition-transform duration-300"
                        style={{ filter: "drop-shadow(0 2px 6px rgba(23,21,29,0.1))" }}
                      >
                        {PROJECTS[3].icon}
                      </span>
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r pointer-events-none" style={{ borderColor: `${C.mint}40` }} />
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-pixel text-[6px] tracking-wider" style={{ color: C.mint }}>PROJECT 04</span>
                        <div className="w-3 h-[1px]" style={{ background: C.mint }} />
                      </div>
                      <h4
                        className="font-pixel tracking-wider font-bold leading-tight mb-2"
                        style={{ fontSize: 16, color: C.ink }}
                      >
                        {PROJECTS[3].title}
                      </h4>
                      <p className="font-pixel text-[7px] leading-[1.9] mb-3" style={{ color: `${C.ink}60` }}>
                        {PROJECTS[3].desc}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {PROJECTS[3].tech.map((t) => (
                          <span
                            key={t}
                            className="font-pixel text-[6px] px-2 py-1"
                            style={{ background: `${C.mint}25`, border: `1px solid ${C.mint}50`, color: `${C.ink}80` }}
                          >
                            {t.toUpperCase()}
                          </span>
                        ))}
                      </div>
                      <div
                        className="inline-flex cursor-pointer group/btn transition-all duration-200 self-start"
                        style={{ border: `2px solid ${C.ink}`, boxShadow: `3px 3px 0 0 ${C.mint}` }}
                      >
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 transition-all duration-200 group-hover/btn:translate-x-[1px] group-hover/btn:translate-y-[1px]"
                          style={{ background: `${C.mint}20` }}
                        >
                          <span className="font-pixel text-[7px]" style={{ color: C.ink }}>&gt;</span>
                          <span className="font-pixel text-[7px] tracking-wider" style={{ color: C.ink }}>VIEW</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM STATEMENT ═════════════════════════════════════ */}
        <div className="mt-12 pt-6" style={{ borderTop: `3px solid ${C.ink}` }}>
          <h3
            className="font-pixel tracking-wider font-bold leading-tight mb-3"
            style={{ fontSize: 22, color: C.ink }}
          >
            WE BUILD IDEAS INTO SOMETHING REAL<span style={{ color: C.pink }}>_</span>
          </h3>
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[7px] tracking-widest" style={{ color: `${C.ink}40` }}>FHC // PROJECTS // 04 BUILDS</span>
            <span className="h-[1px] w-8" style={{ background: `${C.pink}40` }} />
            <span className="w-[5px] h-[5px]" style={{ background: C.pink }} />
            <span className="w-[5px] h-[5px]" style={{ background: C.purple }} />
            <span className="w-[5px] h-[5px]" style={{ background: C.mint }} />
            <span className="w-[5px] h-[5px]" style={{ background: C.blue }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyJoin() {
  return (
    <section
      id="why-join"
      className="relative bg-ink text-cream overflow-hidden"
      style={{ borderTop: "4px solid #0c0c0f", borderBottom: "4px solid #ff2e8c" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)" }} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { x: "5%", y: "15%", s: 3, c: "#ff2e8c", o: 0.4 },
          { x: "12%", y: "45%", s: 2, c: "#39ff6a", o: 0.3 },
          { x: "25%", y: "80%", s: 4, c: "#ffd400", o: 0.25 },
          { x: "38%", y: "20%", s: 2, c: "#5ab8ff", o: 0.35 },
          { x: "52%", y: "70%", s: 3, c: "#ff2e8c", o: 0.3 },
          { x: "65%", y: "10%", s: 2, c: "#2ecdc9", o: 0.4 },
          { x: "78%", y: "55%", s: 4, c: "#ffd400", o: 0.25 },
          { x: "88%", y: "30%", s: 3, c: "#39ff6a", o: 0.35 },
          { x: "95%", y: "75%", s: 2, c: "#5ab8ff", o: 0.3 },
          { x: "15%", y: "60%", s: 3, c: "#ff2e8c", o: 0.2 },
          { x: "42%", y: "88%", s: 2, c: "#2ecdc9", o: 0.3 },
          { x: "70%", y: "40%", s: 4, c: "#ffd400", o: 0.2 },
        ].map((p, i) => (
          <span key={i} className="absolute" style={{ left: p.x, top: p.y, width: p.s, height: p.s, background: p.c, opacity: p.o }} />
        ))}
      </div>

      {/* ── Arcade outer border frame ──────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Hot pink outer border */}
        <div className="absolute inset-[10px]" style={{ border: "2px solid #ff2e8c" }} />
        {/* Black inner outline */}
        <div className="absolute inset-[14px]" style={{ border: "1px solid #0c0c0f" }} />

        {/* Pixel-cut corner brackets — TL */}
        <div className="absolute top-[8px] left-[8px]">
          <div className="w-4 h-[2px]" style={{ background: "#ff2e8c" }} />
          <div className="w-[2px] h-4" style={{ background: "#ff2e8c" }} />
        </div>
        {/* TR */}
        <div className="absolute top-[8px] right-[8px]">
          <div className="w-4 h-[2px] ml-auto" style={{ background: "#ff2e8c" }} />
          <div className="w-[2px] h-4 ml-auto" style={{ background: "#ff2e8c" }} />
        </div>
        {/* BL */}
        <div className="absolute bottom-[8px] left-[8px]">
          <div className="absolute bottom-0 left-0 w-4 h-[2px]" style={{ background: "#ff2e8c" }} />
          <div className="absolute bottom-0 left-0 w-[2px] h-4" style={{ background: "#ff2e8c" }} />
        </div>
        {/* BR */}
        <div className="absolute bottom-[8px] right-[8px]">
          <div className="absolute bottom-0 right-0 w-4 h-[2px]" style={{ background: "#ff2e8c" }} />
          <div className="absolute bottom-0 right-0 w-[2px] h-4" style={{ background: "#ff2e8c" }} />
        </div>

        {/* Small corner pixel details */}
        <span className="absolute top-[6px] left-[6px] w-[4px] h-[4px]" style={{ background: "#ff2e8c" }} />
        <span className="absolute top-[6px] right-[6px] w-[4px] h-[4px]" style={{ background: "#ff2e8c" }} />
        <span className="absolute bottom-[6px] left-[6px] w-[4px] h-[4px]" style={{ background: "#ff2e8c" }} />
        <span className="absolute bottom-[6px] right-[6px] w-[4px] h-[4px]" style={{ background: "#ff2e8c" }} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-pixel text-[11px] text-pink tracking-wider" style={{ letterSpacing: 2 }}>//</span>
            <h2 className="font-pixel text-[11px] text-pink tracking-wider">WHY JOIN FHC?</h2>
            <span className="inline-block w-[8px] h-[14px] bg-pink" style={{ animation: "blink 1s steps(1) infinite" }} />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className="font-pixel text-[7px] text-cream/40 tracking-widest">PLAYER DEVELOPMENT</span>
            <span className="flex-1 h-[1px] bg-cream/10" />
            <span className="font-pixel text-[7px] text-cream/40 tracking-widest">SKILLS UNLOCKED: 05</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-between mb-8 px-4">
          {WHY_JOIN.map((w, i) => (
            <div key={w.title} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-3 h-3" style={{ background: w.accent, boxShadow: `0 0 8px ${w.accent}60` }} />
                <span className="font-pixel text-[6px]" style={{ color: w.accent }}>{w.ability}</span>
              </div>
              {i < WHY_JOIN.length - 1 && (
                <div className="w-16 lg:w-24 h-[2px] mx-2" style={{ background: `linear-gradient(90deg, ${w.accent}40, ${WHY_JOIN[i + 1].accent}40)` }} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {WHY_JOIN.map((w) => (
            <div key={w.title} className="group relative" style={{ animation: "float 4.5s ease-in-out infinite" }}>
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: w.accent }} />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: w.accent }} />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: w.accent }} />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: w.accent }} />

              <div className="relative bg-ink/80 p-5 text-center transition-all duration-150" style={{ border: `2px solid ${w.accent}30`, clipPath: "polygon(0 6px, 4px 2px, 8px 0, calc(100% - 8px) 0, calc(100% - 4px) 2px, 100% 6px, 100% calc(100% - 6px), calc(100% - 4px) calc(100% - 2px), calc(100% - 8px) 100%, 8px 100%, 4px calc(100% - 2px), 0 calc(100% - 6px))" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-pixel text-[7px] tracking-widest" style={{ color: `${w.accent}80` }}>ABILITY {w.ability}</span>
                  <span className="flex items-center gap-1">
                    <span className="w-[4px] h-[4px]" style={{ background: w.accent }} />
                    <span className="font-pixel text-[6px]" style={{ color: w.accent }}>UNLOCKED</span>
                  </span>
                </div>

                <div className="flex justify-center mb-4">
                  <div className="relative group-hover:translate-y-[-4px] transition-transform duration-150" style={{ width: 72, height: 72, background: `${w.accent}10`, border: `2px solid ${w.accent}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={w.asset} alt={w.title} style={{ width: 48, height: 48, imageRendering: "pixelated", objectFit: "contain" }} />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ background: `radial-gradient(circle, ${w.accent}20 0%, transparent 70%)` }} />
                  </div>
                </div>

                <h3 className="font-pixel text-[12px] mb-3 tracking-wider" style={{ color: w.accent }}>{w.title}</h3>
                <p className="font-pixel text-[8px] leading-[1.8] text-cream/70">{w.desc}</p>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-1 h-1" style={{ background: w.accent }} />
                  <div className="w-6 h-[1px]" style={{ background: `${w.accent}60` }} />
                  <div className="w-1 h-1" style={{ background: w.accent }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <span className="font-pixel text-[6px] text-cream/30 tracking-widest">PRESS START TO UNLOCK ALL ABILITIES</span>
          <div className="flex items-center gap-2">
            <span className="w-[4px] h-[4px] bg-pink" style={{ animation: "blink 1s steps(1) infinite" }} />
            <span className="font-pixel text-[6px] text-pink/60">FHC_ARCADE_v1.0</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <StatsAchievements />
      <UpcomingEvents />
      <WhyJoin />
      <Footer variant="home" />
    </>
  );
}
