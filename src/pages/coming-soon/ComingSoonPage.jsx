import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";

const FACILITY = "/assets/coming-soon/facility.jpg";

/* ─────────────────────────────────────────────
   Page-scoped styling (isolated — does not touch
   global index.css or any other page).
   ───────────────────────────────────────────── */
const css = `
  .cs2-wrap { background:#030609; }

  /* Slow Ken Burns drift on the hero backdrop */
  @keyframes cs2-drift {
    0%   { transform: scale(1.08) translate3d(0,0,0); }
    100% { transform: scale(1.16) translate3d(-1.2%, -0.6%, 0); }
  }

  /* Slow volumetric light sweep */
  @keyframes cs2-rays {
    0%   { transform: translate3d(-6%, 0, 0) rotate(0.001deg); opacity: 0.7; }
    50%  { transform: translate3d(4%, 0, 0) rotate(0.001deg); opacity: 1; }
    100% { transform: translate3d(-6%, 0, 0) rotate(0.001deg); opacity: 0.7; }
  }

  /* Gentle atmospheric haze drift */
  @keyframes cs2-haze {
    0%,100% { transform: translate3d(-1.5%, 0, 0); opacity: 0.5; }
    50%     { transform: translate3d(1.5%, -0.5%, 0); opacity: 0.85; }
  }

  @keyframes cs2-flicker {
    0%, 88%, 100% { opacity: 1; }
    89% { opacity: 0.55; }
    91% { opacity: 0.8; }
    93% { opacity: 0.5; }
  }

  /* Floating dust motes */
  @keyframes cs2-mote {
    0%   { transform: translate3d(0, 0, 0); opacity: 0; }
    12%  { opacity: var(--o, 0.5); }
    88%  { opacity: var(--o, 0.5); }
    100% { transform: translate3d(var(--dx,20px), var(--dy,-40px), 0); opacity: 0; }
  }

  @keyframes cs2-blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }

  @keyframes cs2-bar {
    0%   { width: 4%; }
    55%  { width: 62%; }
    70%  { width: 58%; }
    90%  { width: 84%; }
    100% { width: 96%; }
  }

  @keyframes cs2-rec {
    0%, 30% { background:#FF1687; box-shadow:0 0 8px rgba(255,22,135,0.9); }
    50%, 60% { background:#5a0d31; box-shadow:0 0 4px rgba(255,22,135,0.4); }
    80%, 100% { background:#FF1687; box-shadow:0 0 8px rgba(255,22,135,0.9); }
  }

  .cs2-drift { animation: cs2-drift 90s ease-in-out infinite alternate; will-change: transform; }
  .cs2-rays { animation: cs2-rays 18s ease-in-out infinite; will-change: transform, opacity; }
  .cs2-haze { animation: cs2-haze 26s ease-in-out infinite; will-change: transform, opacity; }
  .cs2-flicker { animation: cs2-flicker 7s ease-in-out infinite; }
  .cs2-blink { animation: cs2-blink 1.2s steps(1) infinite; }
  .cs2-rec { animation: cs2-rec 3.2s steps(1) infinite; }
  .cs2-bar-fill { animation: cs2-bar 8s cubic-bezier(0.4,0,0.2,1) infinite; }
  .cs2-mote { animation: cs2-mote linear infinite; }

  @media (prefers-reduced-motion: reduce) {
    .cs2-drift, .cs2-rays, .cs2-haze, .cs2-flicker, .cs2-blink, .cs2-rec,
    .cs2-bar-fill, .cs2-mote {
      animation: none !important;
    }
    .cs2-mote { display: none; }
  }

  @media (max-width: 640px) {
    .cs2-title {
      font-size: clamp(3.2rem, 18vw, 5rem) !important;
      letter-spacing: 0.02em !important;
    }
  }
  @media (min-width: 641px) and (max-width: 1023px) {
    .cs2-title {
      font-size: clamp(5rem, 13vw, 8rem) !important;
    }
  }
  @media (min-width: 1024px) {
    .cs2-title {
      font-size: clamp(6.5rem, 11vw, 12rem) !important;
    }
  }
`;

/* ═══════════════════════════════════════════════
   Parallel-moved depth layers
   ═══════════════════════════════════════════════ */
function MouseParallax({ strength = 1, children }) {
  const ref = useRef(null);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0, ty = 0;
    const onMove = (e) => {
      tx = ((e.clientX / window.innerWidth) - 0.5) * 12 * strength;
      ty = ((e.clientY / window.innerHeight) - 0.5) * 8 * strength;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          raf = 0;
        });
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, strength]);

  return <div ref={ref} className="will-change-transform">{children}</div>;
}

/* Small drifting dust motes (cheap, CSS-driven) */
function DustMotes() {
  const motes = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: (i * 47 + 13) % 100,
        top: 62 + ((i * 31) % 38),
        size: 1 + ((i * 7) % 4),
        dx: -8 + ((i * 5) % 40),
        dy: -28 - ((i * 3) % 40),
        dur: 14 + ((i * 3) % 11),
        delay: -((i * 17) % 20),
        o: 0.15 + ((i * 11) % 40) / 100,
        warm: i % 2 === 0,
      })),
    []
  );

  return (
    <>
      {motes.map((m, i) => (
        <span
          key={i}
          className="cs2-mote absolute rounded-full pointer-events-none"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            background: m.warm ? "#ff9bbf" : "#9adff0",
            opacity: 0,
            ["--dx"]: `${m.dx}px`,
            ["--dy"]: `${m.dy}px`,
            ["--o"]: m.o,
            animationDuration: `${m.dur}s`,
            animationDelay: `${m.delay}s`,
            filter: "blur(0.5px)",
          }}
        />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function ComingSoonPage() {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="cs2-wrap relative min-h-screen overflow-x-hidden text-[#FFF7E5]">
      <style>{css}</style>

      {/* ── NAVBAR (existing component, consumed not modified) ── */}
      <div className="relative z-[60]">
        <Navbar />
      </div>

      {/* ═════════════════════════════════════
          FULL-SCREEN CINEMATIC SCENE
          ═════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-108px)] md:min-h-[calc(100vh-108px)] flex items-center justify-center overflow-hidden isolate">
        {/* Backdrop image (lazy) */}
        <MouseParallax strength={1.15}>
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="cs2-drift absolute inset-0">
              <img
                src={FACILITY}
                alt="A vast, dimly lit technological facility under construction"
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgLoaded(false)}
                className="absolute inset-0 w-full h-full object-cover object-center"
                style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 1.2s ease" }}
              />
            </div>

            {/* Cinematic fallback backdrop (if image fails to load) */}
            <div
              className="absolute inset-0"
              style={{
                opacity: imgLoaded ? 0 : 1,
                transition: "opacity 1s ease",
                background:
                  "radial-gradient(120% 90% at 70% 20%, #0a1626 0%, #050a13 45%, #03060a 100%)",
              }}
            />

            {/* Deep shadow + colour grade / vignette */}
            <div className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(90% 80% at 50% 40%, rgba(3,6,9,0.15) 0%, rgba(3,6,9,0.55) 55%, rgba(2,4,7,0.92) 100%)",
              }}
            />
            {/* Cyan wash from the left, magenta from the right — restrained */}
            <div className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, rgba(30,215,232,0.10) 0%, transparent 38%), linear-gradient(255deg, rgba(255,22,135,0.09) 0%, transparent 42%)",
              }}
            />

            {/* Volumetric light rays */}
            <div className="cs2-rays absolute inset-0"
              style={{
                background:
                  "conic-gradient(from 200deg at 30% -20%, transparent 0deg, rgba(255,255,244,0.05) 14deg, transparent 30deg, transparent 180deg, rgba(30,215,232,0.06) 210deg, transparent 245deg)",
                mixBlendMode: "screen",
              }}
            />
          </div>
        </MouseParallax>

        {/* Atmospheric foreground haze layers (gentle depth) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="cs2-haze absolute inset-x-0 bottom-0 h-[45%]"
            style={{
              background: "linear-gradient(to top, rgba(8,14,22,0.55), transparent)",
            }}
          />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, #030609 0%, transparent 18%)" }}
          />
        </div>

        {/* Subtle tech grid — extremely faint */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(30,215,232,0.6) 0 1px, transparent 1px 120px), repeating-linear-gradient(90deg, rgba(30,215,232,0.6) 0 1px, transparent 1px 120px)",
          }}
        />

        {/* Drifting dust motes */}
        <DustMotes />

        {/* ═════════════════════════════════════
            HERO CONTENT
            ═════════════════════════════════════ */}
        <div
          className={`relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 text-center py-24 transition-all duration-[1400ms] ${
            show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Eyebrow — FHC identity */}
          <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8 text-[10px] sm:text-[11px] tracking-[0.35em] font-mono uppercase">
            <span className="inline-block h-px w-8 sm:w-12 bg-[#1ED7E8]/40" />
            <span className="text-[#1ED7E8]/70">FHC&nbsp;//&nbsp;TRANSMISSION</span>
            <span className="inline-block h-px w-8 sm:w-12 bg-[#1ED7E8]/40" />
          </div>

          {/* Dominant typography */}
          <h1 className="font-pixel leading-none tracking-tight select-none cs2-title">
            <span
              className="block text-[#FFF7E5]"
              style={{ textShadow: "0 4px 30px rgba(0,0,0,0.6), 0 0 60px rgba(30,215,232,0.10)" }}
            >
              COMING
            </span>
            <span
              className="block mt-1 text-[#FF1687]"
              style={{
                textShadow: "0 4px 34px rgba(0,0,0,0.6), 0 0 70px rgba(255,22,135,0.28)",
              }}
            >
              SOON
            </span>
          </h1>

          {/* Tagline */}
          <p className="mt-6 sm:mt-8 font-mono text-[12px] sm:text-[15px] lg:text-[17px] tracking-[0.28em] uppercase text-[#FFF7E5]/55">
            The Next Horizon is Being Built.
          </p>
          <p className="mt-3 font-mono text-[11px] sm:text-[13px] lg:text-[14px] tracking-[0.18em] text-[#FFF7E5]/30">
            Something new is taking shape inside FHC.
          </p>

          {/* Status area — minimal futuristic readout */}
          <div className="cs2-flicker mt-10 sm:mt-12 inline-flex flex-col items-center gap-3 mx-auto">
            <div className="flex items-center gap-3 text-[10px] sm:text-[11px] font-mono tracking-[0.22em] uppercase">
              <span className="cs2-rec inline-block w-2 h-2" />
              <span className="text-[#FF1687]/75">System Status: Development</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] text-[#1ED7E8]/55 uppercase">
              Next Horizon&nbsp;//&nbsp;Incoming
            </div>

            {/* Subtle progress bar */}
            <div className="w-[240px] sm:w-[300px] h-[2px] mt-2 bg-[#FFF7E5]/8 relative overflow-hidden">
              <div className="cs2-bar-fill absolute inset-y-0 left-0 bg-gradient-to-r from-[#1ED7E8]/70 via-[#1ED7E8] to-[#FF1687]" />
            </div>
            <div className="flex items-center justify-between w-[240px] sm:w-[300px] text-[8px] font-mono tracking-[0.2em] text-[#FFF7E5]/20">
              <span>CALIBRATING</span>
              <span className="cs2-blink">▮</span>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 sm:mt-12 flex justify-center">
            <Link
              to="/"
              className="group relative inline-flex items-center gap-3 font-pixel text-[10px] sm:text-[11px] tracking-[0.12em] text-[#FFF7E5] px-7 py-4 border border-[#FFF7E5]/25 bg-[#080d13]/55 backdrop-blur-sm overflow-hidden"
              style={{
                clipPath:
                  "polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
            >
              <span className="text-[#1ED7E8]/70 group-hover:text-[#1ED7E8] transition-colors">→</span>
              RETURN TO FHC
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-[#FFF7E5]/6 to-transparent" />
            </Link>
          </div>
        </div>

        {/* Bottom-left corner tag + top-right transmission marker */}
        <div className="absolute bottom-4 left-5 sm:left-8 font-mono text-[8px] sm:text-[9px] tracking-[0.25em] text-[#FFF7E5]/15 pointer-events-none select-none">
          FISAT&nbsp;HORIZON&nbsp;CLUB&nbsp;—&nbsp;FACILITY&nbsp;0
        </div>
        <div className="absolute top-6 right-5 sm:right-8 flex items-center gap-2 font-mono text-[8px] sm:text-[9px] tracking-[0.25em] text-[#1ED7E8]/40 pointer-events-none select-none">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#36D65A]" style={{ boxShadow: "0 0 6px #36D65A" }} />
          <span className="cs2-blink">REC</span>
        </div>
      </section>

      {/* ── Film grain + CRT scanlines (existing scoped overlays) ── */}
      <div className="cs-film-grain pointer-events-none" />
      <div className="cs-crt-overlay pointer-events-none" />
    </div>
  );
}
