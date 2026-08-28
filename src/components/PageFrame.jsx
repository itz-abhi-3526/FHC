/**
 * Shared outer-page frame used by /about and /join.
 * Thin neon cyberpunk outer border with corner details and glow.
 */
export default function PageFrame({ bg = "#050810", children }) {
  return (
    <div className="relative" style={{ background: bg }}>
      {/* ── Thin neon cyberpunk outer border ── */}
      <div className="fixed inset-0 pointer-events-none z-[10001]">
        {/* Thin outer border — 1px neon pink */}
        <div
          className="absolute"
          style={{
            inset: 10,
            border: "1px solid #FF007F",
            boxShadow: "0 0 6px rgba(255,0,127,0.25), inset 0 0 6px rgba(255,0,127,0.08)",
          }}
        />
        {/* Inner accent border — 1px cyan, inset further */}
        <div
          className="absolute"
          style={{
            inset: 14,
            border: "1px solid rgba(0,229,255,0.15)",
          }}
        />

        {/* Top-left corner bracket */}
        <div className="absolute" style={{ top: 6, left: 6, width: 20, height: 1, background: "#FF007F", opacity: 0.6 }} />
        <div className="absolute" style={{ top: 6, left: 6, width: 1, height: 20, background: "#FF007F", opacity: 0.6 }} />
        {/* Top-right corner bracket */}
        <div className="absolute" style={{ top: 6, right: 6, width: 20, height: 1, background: "#00E5FF", opacity: 0.45 }} />
        <div className="absolute" style={{ top: 6, right: 6, width: 1, height: 20, background: "#00E5FF", opacity: 0.45 }} />
        {/* Bottom-left corner bracket */}
        <div className="absolute" style={{ bottom: 6, left: 6, width: 1, height: 20, background: "#00E5FF", opacity: 0.35 }} />
        <div className="absolute" style={{ bottom: 6, left: 6, width: 20, height: 1, background: "#00E5FF", opacity: 0.35 }} />
        {/* Bottom-right corner bracket */}
        <div className="absolute" style={{ bottom: 6, right: 6, width: 1, height: 20, background: "#FF007F", opacity: 0.45 }} />
        <div className="absolute" style={{ bottom: 6, right: 6, width: 20, height: 1, background: "#FF007F", opacity: 0.45 }} />

        {/* Corner pixel markers */}
        <div className="absolute" style={{ top: 5, left: 5, width: 3, height: 3, background: "#FF007F", opacity: 0.4 }} />
        <div className="absolute" style={{ top: 5, right: 5, width: 3, height: 3, background: "#00E5FF", opacity: 0.3 }} />
        <div className="absolute" style={{ bottom: 5, left: 5, width: 3, height: 3, background: "#00E5FF", opacity: 0.25 }} />
        <div className="absolute" style={{ bottom: 5, right: 5, width: 3, height: 3, background: "#FF007F", opacity: 0.35 }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
