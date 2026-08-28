import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import RobotScene from "./Robot3D";

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

function StatusLed({ color = "#36D65A", delay = 0 }) {
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

function ScanSweep() {
  return (
    <div
      className="absolute inset-x-0 top-0 h-[2px] pointer-events-none z-20"
      style={{
        background: "linear-gradient(90deg, transparent, rgba(30,215,232,0.3), transparent)",
        animation: "arcade-viewport-sweep 4s linear infinite",
      }}
    />
  );
}

function CanvasLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border border-[#1ED7E8]/30 border-t-[#1ED7E8] rounded-full animate-spin" />
        <span className="font-pixel text-[6px] text-[#1ED7E8]/40 tracking-wider">LOADING NODE</span>
      </div>
    </div>
  );
}

export default function ArcadeViewport() {
  const containerRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
      <div className="relative bg-[#060a14] border border-[#FF1687]/20 overflow-hidden p-[1px]">
        {/* HUD corner brackets */}
        <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-[#1ED7E8]/60 pointer-events-none z-30" />
        <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-[#FF1687]/60 pointer-events-none z-30" />
        <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-[#FF1687]/60 pointer-events-none z-30" />
        <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-[#1ED7E8]/60 pointer-events-none z-30" />

        {/* Scanline overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-[25]"
          style={{
            background: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 2px, transparent 2px, transparent 4px)",
          }}
        />

        {/* Main viewport */}
        <div
          className="relative bg-[#020510] border border-[#1ED7E8]/12 overflow-hidden"
          style={{ aspectRatio: "4/3", cursor: isDragging ? "grabbing" : "grab" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => { setIsHovered(false); setIsDragging(false); }}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        >
          {/* Scanlines */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{ background: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)" }}
          />
          <ScanSweep />

          {/* Hover glow */}
          <div
            className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500"
            style={{ background: "radial-gradient(ellipse at center, rgba(30,215,232,0.025) 0%, transparent 65%)", opacity: isHovered ? 1 : 0 }}
          />

          {/* ── Top HUD — minimal ── */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-center px-3 py-1.5 pointer-events-none">
            <div className="flex items-center gap-2">
              <StatusLed color="#FF1687" />
              <HudLabel className="text-[#FF1687]/40">FHC HOLOGRAPHIC INTERFACE</HudLabel>
            </div>
          </div>

          {/* ── DRAG TO ROTATE — small, above robot ── */}
          <div className="absolute top-7 inset-x-0 z-20 flex justify-center pointer-events-none">
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0a0e1a]/60 border border-[#1ED7E8]/10"
              style={{ opacity: isDragging ? 0.2 : 0.55, transition: "opacity 0.4s" }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1ED7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
                <path d="M5 9l-3 3 3 3" />
                <path d="M19 9l3 3-3 3" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
              <HudLabel className="text-[#1ED7E8]/30 text-[5px]">DRAG TO ROTATE</HudLabel>
            </div>
          </div>

          {/* ── 360° VIEW — bottom center ── */}
          <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center pointer-events-none">
            <HudLabel className="text-[#1ED7E8]/20 text-[6px] tracking-[0.3em]">360° VIEW</HudLabel>
          </div>

          {/* ── WebGL Canvas ── */}
          <div className="absolute inset-0">
            <Suspense fallback={<CanvasLoader />}>
              <Canvas
                camera={{ position: [0, 0.3, 2.2], fov: 36, near: 0.1, far: 20 }}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
                dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1}
                style={{ background: "transparent" }}
                onCreated={({ gl }) => {
                  gl.toneMapping = THREE.ACESFilmicToneMapping;
                  gl.toneMappingExposure = 1.1;
                }}
              >
                <RobotScene />
              </Canvas>
            </Suspense>
          </div>
        </div>
      </div>

      {/* ── Bottom status strip ── */}
      <div className="flex items-center justify-center mt-2 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <StatusLed color="#36D65A" delay={200} />
            <HudLabel className="text-[#36D65A]/30">RENDER</HudLabel>
          </div>
        </div>
      </div>
    </div>
  );
}
