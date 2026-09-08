import { useState } from "react";
import { mulberry32 } from "../../lib/random";
import { resolveMemberPhoto } from "../../lib/teamMembers";

const FALLBACK_PALETTE = ["#FF1687", "#1ED7E8", "#FFD21A", "#36D65A", "#9B59FF"];
const GRID = 8;

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildPixels(seed) {
  const rand = mulberry32(hashSeed(String(seed || "fhc")));
  const cells = Array.from({ length: GRID }, () => Array(GRID).fill(null));
  const skin = FALLBACK_PALETTE[Math.floor(rand() * FALLBACK_PALETTE.length)];
  const shirt = FALLBACK_PALETTE[Math.floor(rand() * FALLBACK_PALETTE.length)];
  const accent = FALLBACK_PALETTE[Math.floor(rand() * FALLBACK_PALETTE.length)];

  const rows = Math.floor(rand() * 3) + 6;
  for (let y = GRID - 2; y < GRID - 2 + rows && y < GRID; y++) {
    const half = Math.floor(rand() * 2) + 2;
    for (let x = GRID / 2 - half; x < GRID / 2; x++) {
      cells[y][x] = shirt;
      cells[y][GRID - 1 - x] = shirt;
    }
  }
  cells[GRID - 3][GRID / 2] = accent;
  cells[GRID - 3][GRID / 2 - 1] = accent;
  cells[GRID - 3][GRID / 2 - 2] = accent;

  for (let y = 1; y <= 4; y++) {
    for (let x = 2; x < GRID - 2; x++) cells[y][x] = skin;
    cells[y][1] = skin;
    cells[y][GRID - 2] = skin;
  }
  cells[3][2] = cells[3][GRID - 3] = cells[3][3] = cells[3][GRID - 4] = accent;
  cells[4][2] = cells[4][GRID - 3] = cells[4][3] = cells[4][GRID - 4] = accent;
  cells[4][GRID / 2 - 1] = cells[4][GRID / 2] = cells[4][GRID / 2 + 1] = FALLBACK_PALETTE[0];

  return cells;
}

function FallbackAvatar({ seed, className = "" }) {
  const cells = buildPixels(seed);
  const cell = 4;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${GRID * cell} ${GRID * cell}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={GRID * cell} height={GRID * cell} fill="#0C0C12" />
      <rect x="1" y="1" width={GRID * cell - 2} height={GRID * cell - 2} fill="#12131C" />
      {cells.map((row, y) =>
        row.map((color, x) =>
          color ? (
            <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export default function PlayerPhoto({ member, alt, eager = false, className = "" }) {
  const [failed, setFailed] = useState(false);
  const src = resolveMemberPhoto(member);

  if (!src || failed) {
    return (
      <div className={`arena-photo-frame ${className}`} role="img" aria-label={alt}>
        <div className="arena-photo-fallback">
          <FallbackAvatar seed={member?.id || member?.name || "player"} />
          <span className="arena-photo-fallback-label font-pixel text-[7px] text-[#FFF7E5]/60">
            {member?.name ? member.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "FHC"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`arena-photo-frame ${className}`}>
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className="arena-photo-img"
      />
      <div className="arena-photo-scan" aria-hidden="true" />
    </div>
  );
}
