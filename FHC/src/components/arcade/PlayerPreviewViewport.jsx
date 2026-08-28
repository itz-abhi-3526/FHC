import { useRef, useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import PlayerAvatar3D from "./PlayerAvatar3D";

const VARIANTS = [
  { id: 0, name: "BUILDER", classLabel: "CLASS // BUILDER" },
  { id: 1, name: "EXPLORER", classLabel: "CLASS // EXPLORER" },
  { id: 2, name: "CYBER", classLabel: "CLASS // CYBER" },
];

const ACCENTS = [
  { id: "pink", label: "PK", color: "#FF007F" },
  { id: "cyan", label: "CY", color: "#00E5FF" },
  { id: "green", label: "GR", color: "#4CFF4C" },
];

function HudLabel({ children, className = "", style = {} }) {
  return (
    <span
      className={`font-pixel text-[6px] sm:text-[7px] tracking-wider pointer-events-none select-none ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

function StatusLed({ color = "#4CFF4C", delay = 0 }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => setOn((v) => !v), 1200 + delay);
    return () => clearInterval(iv);
  }, [delay]);
  return (
    <span
      className="inline-block w-[4px] h-[4px] rounded-full flex-shrink-0"
      style={{
        background: on ? color : "rgba(255,255,255,0.06)",
        boxShadow: on ? `0 0 5px ${color}` : "none",
        transition: "all 0.3s",
      }}
    />
  );
}

export default function PlayerPreviewViewport({ playerSlot = 1 }) {
  const containerRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [variant, setVariant] = useState(0);
  const [accent, setAccent] = useState("cyan");
  const [resetKey, setResetKey] = useState(0);

  const handleDoubleClick = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  const currentVariant = VARIANTS[variant];
  const currentAccent = ACCENTS.find((a) => a.id === accent);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventScroll = (e) => {
      if (isDragging) e.preventDefault();
    };
    el.addEventListener("touchmove", preventScroll, { passive: false });
    return () => el.removeEventListener("touchmove", preventScroll);
  }, [isDragging]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* ── TOP HUD — terminal label ── */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-[3px]" style={{ background: "#FF007F", opacity: 0.4 }} />
          <span className="font-pixel" style={{ fontSize: 7, letterSpacing: "0.15em", color: "#00E5FF", opacity: 0.5 }}>
            PLAYER 0{playerSlot} // CHARACTER
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusLed color="#4CFF4C" />
          <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.1em", color: "#4CFF4C", opacity: 0.4 }}>
            READY
          </span>
        </div>
      </div>

      <div
        className="relative bg-[#030508] border overflow-hidden"
        style={{ borderColor: "rgba(0,229,255,0.15)" }}
      >
        {/* HUD corner brackets */}
        <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 pointer-events-none z-30" style={{ borderColor: "rgba(0,229,255,0.5)" }} />
        <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 pointer-events-none z-30" style={{ borderColor: "rgba(255,0,127,0.5)" }} />
        <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 pointer-events-none z-30" style={{ borderColor: "rgba(255,0,127,0.5)" }} />
        <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 pointer-events-none z-30" style={{ borderColor: "rgba(0,229,255,0.5)" }} />



        {/* Main viewport */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "#020510",
            width: "100%",
            aspectRatio: "3/4",
            maxHeight: 480,
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onDoubleClick={handleDoubleClick}
        >
          {/* ── Left side HUD — player info ── */}
          <div className="absolute left-2 top-12 z-20 pointer-events-none flex flex-col gap-1.5">
            <div className="flex items-center gap-1" style={{ opacity: 0.45 }}>
              <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.1em", color: "#00E5FF" }}>
                PLAYER 0{playerSlot}
              </span>
            </div>
            <div className="flex items-center gap-1" style={{ opacity: 0.35 }}>
              <span className="font-pixel" style={{ fontSize: 5, letterSpacing: "0.08em", color: "#4CFF4C" }}>
                STATUS // READY
              </span>
            </div>
            <div className="flex items-center gap-1" style={{ opacity: 0.35 }}>
              <span className="font-pixel" style={{ fontSize: 5, letterSpacing: "0.08em", color: currentAccent?.color || "#00E5FF" }}>
                {currentVariant.classLabel}
              </span>
            </div>
            <div className="flex items-center gap-1" style={{ opacity: 0.3 }}>
              <span className="font-pixel" style={{ fontSize: 5, letterSpacing: "0.08em", color: "#FFF4D6" }}>
                LEVEL // 01
              </span>
            </div>
          </div>

          {/* ── Right side — top HUD ── */}
          <div className="absolute right-2 top-12 z-20 pointer-events-none flex flex-col gap-1.5 items-end">
            <div className="flex items-center gap-1" style={{ opacity: 0.3 }}>
              <StatusLed color="#FF007F" delay={100} />
              <span className="font-pixel" style={{ fontSize: 5, letterSpacing: "0.08em", color: "#FF007F" }}>
                SLOT 0{playerSlot}
              </span>
            </div>
            <div className="flex items-center gap-1" style={{ opacity: 0.25 }}>
              <span className="font-pixel" style={{ fontSize: 5, letterSpacing: "0.08em", color: "#00E5FF" }}>
                EXP ▰▰▱▱▱
              </span>
            </div>
          </div>

          {/* ── Drag instruction ── */}
          <div className="absolute top-7 inset-x-0 z-20 flex justify-center pointer-events-none">
            <div
              className="flex items-center gap-1.5 px-2 py-0.5"
              style={{
                background: "rgba(3,5,8,0.7)",
                border: "1px solid rgba(0,229,255,0.08)",
                opacity: isDragging ? 0.15 : 0.5,
                transition: "opacity 0.4s",
              }}
            >
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.4 }}
              >
                <path d="M5 9l-3 3 3 3" />
                <path d="M19 9l3 3-3 3" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
              <HudLabel style={{ color: "rgba(0,229,255,0.25)", fontSize: 5 }}>
                DRAG TO ROTATE // DBL-CLICK RESET
              </HudLabel>
            </div>
          </div>

          {/* ── Bottom status ── */}
          <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-3 py-1.5 pointer-events-none">
            <HudLabel style={{ color: "rgba(0,229,255,0.2)" }}>
              SCROLL TO ZOOM
            </HudLabel>
            <div className="flex items-center gap-1.5">
              <StatusLed color="#00E5FF" delay={300} />
              <HudLabel style={{ color: "rgba(0,229,255,0.25)" }}>
                3D PREVIEW
              </HudLabel>
            </div>
          </div>

          {/* ── WebGL Canvas ── */}
          <div className="absolute inset-0">
              <Canvas
                camera={{ position: [0, 0.1, 2.4], fov: 34, near: 0.1, far: 20 }}
                gl={{
                  antialias: true,
                  alpha: true,
                  powerPreference: "high-performance",
                  stencil: false,
                  physicallyCorrectLights: true,
                }}
                dpr={
                  typeof window !== "undefined"
                    ? Math.min(window.devicePixelRatio, 2)
                    : 1
                }
                style={{ background: "transparent", width: "100%", height: "100%" }}
                onCreated={({ gl }) => {
                  gl.toneMapping = THREE.ACESFilmicToneMapping;
                  gl.toneMappingExposure = 1.5;
                  gl.setClearColor(0x000000, 0);
                }}
              >
                <PlayerAvatar3D variant={variant} accent={accent} resetKey={resetKey} />
              </Canvas>
          </div>
        </div>
      </div>

      {/* ── SELECTION CONTROLS — below viewport ── */}
      <div className="mt-2 px-1">
        {/* Player variant selector */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.12em", color: "#00E5FF", opacity: 0.4 }}>
            SELECT CLASS
          </span>
          <span className="font-pixel" style={{ fontSize: 5, letterSpacing: "0.08em", color: "#FF007F", opacity: 0.3 }}>
            {VARIANTS[variant].name}
          </span>
        </div>
        <div className="flex gap-1.5 mb-2">
          {VARIANTS.map((v) => {
            const isActive = variant === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariant(v.id)}
                className="flex-1 text-center transition-all duration-100"
                style={{
                  fontFamily: "var(--font-pixel)",
                  fontSize: 6,
                  letterSpacing: "0.08em",
                  padding: "6px 4px",
                  color: isActive ? "#030508" : "#00E5FF",
                  background: isActive ? "#00E5FF" : "rgba(0,229,255,0.06)",
                  border: `1px solid ${isActive ? "#00E5FF" : "rgba(0,229,255,0.12)"}`,
                  cursor: "pointer",
                  transition: "all 0.1s steps(2)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "rgba(0,229,255,0.3)";
                    e.currentTarget.style.background = "rgba(0,229,255,0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "rgba(0,229,255,0.12)";
                    e.currentTarget.style.background = "rgba(0,229,255,0.06)";
                  }
                }}
              >
                {v.name}
              </button>
            );
          })}
        </div>

        {/* Accent color selector */}
        <div className="flex items-center justify-between mb-1">
          <span className="font-pixel" style={{ fontSize: 6, letterSpacing: "0.12em", color: "#00E5FF", opacity: 0.4 }}>
            ACCENT
          </span>
        </div>
        <div className="flex gap-1.5">
          {ACCENTS.map((a) => {
            const isActive = accent === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent(a.id)}
                className="flex-1 flex items-center justify-center gap-1 transition-all duration-100"
                style={{
                  fontFamily: "var(--font-pixel)",
                  fontSize: 5,
                  letterSpacing: "0.06em",
                  padding: "5px 4px",
                  color: isActive ? "#030508" : a.color,
                  background: isActive ? a.color : `${a.color}08`,
                  border: `1px solid ${isActive ? a.color : `${a.color}15`}`,
                  cursor: "pointer",
                  transition: "all 0.1s steps(2)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = `${a.color}40`;
                    e.currentTarget.style.background = `${a.color}15`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = `${a.color}15`;
                    e.currentTarget.style.background = `${a.color}08`;
                  }
                }}
              >
                <span style={{ width: 5, height: 5, background: a.color, display: "inline-block" }} />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bottom HUD ── */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-2">
          <StatusLed color="#00E5FF" delay={400} />
          <HudLabel style={{ color: "rgba(0,229,255,0.25)" }}>
            PREVIEW ACTIVE
          </HudLabel>
        </div>
        <HudLabel style={{ color: "rgba(255,0,127,0.2)" }}>
          FHC // PLAYER TERMINAL
        </HudLabel>
      </div>
    </div>
  );
}
