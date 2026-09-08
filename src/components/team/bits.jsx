export function Led({ color = "#36D65A", size = 6, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`arena-led inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
  );
}

export function Brackets({ size = 12, color = "#1ED7E8", className = "" }) {
  const base = {
    position: "absolute",
    width: size,
    height: size,
    pointerEvents: "none",
    zIndex: 3,
  };
  return (
    <>
      <span
        aria-hidden="true"
        className={className}
        style={{ ...base, top: 0, left: 0, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }}
      />
      <span
        aria-hidden="true"
        className={className}
        style={{ ...base, top: 0, right: 0, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }}
      />
      <span
        aria-hidden="true"
        className={className}
        style={{ ...base, bottom: 0, left: 0, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }}
      />
      <span
        aria-hidden="true"
        className={className}
        style={{ ...base, bottom: 0, right: 0, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }}
      />
    </>
  );
}

export function ScanOverlay({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`arena-scan-overlay pointer-events-none absolute inset-0 z-[2] ${className}`}
    />
  );
}

export function PixelTag({ children, color = "#1ED7E8", className = "" }) {
  return (
    <span
      className={`arena-pixel-tag inline-flex items-center gap-1.5 px-2 py-1 font-pixel text-[7px] tracking-[0.18em] ${className}`}
      style={{ borderColor: `${color}40`, color }}
    >
      {children}
    </span>
  );
}

export function BarSeparator({ color = "rgba(30,215,232,0.15)", className = "" }) {
  return (
    <div className={`arena-bar-sep relative overflow-hidden ${className}`}>
      <span
        className="arena-bar-sep-core absolute inset-y-0 left-0"
        style={{ background: `linear-gradient(90deg, ${color}44, ${color}, ${color}44)` }}
      />
    </div>
  );
}

export function HudLine({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-px w-full ${className}`}
      style={{ background: "linear-gradient(90deg, transparent, rgba(30,215,232,0.15), transparent)" }}
    />
  );
}
