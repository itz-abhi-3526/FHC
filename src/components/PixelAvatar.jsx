import { mulberry32 } from "../lib/random";

/**
 * FHC PLAYER AVATAR
 * Deterministic arcade-portrait generated from a seed string.
 * Same seed → same avatar, every time. No external service needed.
 *
 * Pixel grid (symmetric) filled with the FHC palette, framed like a
 * tiny arcade cabinet portrait.
 */

const PALETTE = ["#FF1687", "#1ED7E8", "#FFD21A", "#36D65A", "#9B59FF", "#FFA23D", "#6FD0F0", "#FFF7E5"];

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

  const skin = PALETTE[Math.floor(rand() * PALETTE.length)];
  const shirt = PALETTE[Math.floor(rand() * PALETTE.length)];
  const accent = PALETTE[Math.floor(rand() * PALETTE.length)];

  // Symmetric body: left = sqrt-shaped torso, mirrored to the right.
  const rows = Math.floor(rand() * 3) + 6; // torso height 6-8
  for (let y = GRID - 2; y < GRID - 2 + rows && y < GRID; y++) {
    const half = Math.floor(rand() * 2) + 2; // shoulder half-width 2-3
    for (let x = GRID / 2 - half; x < GRID / 2; x++) {
      cells[y][x] = shirt;
      cells[y][GRID - 1 - x] = shirt;
    }
  }
  // Accent belly pixel / visor line
  cells[GRID - 3][GRID / 2] = accent;
  cells[GRID - 3][GRID / 2 - 1] = accent;
  cells[GRID - 3][GRID / 2 - 2] = accent;

  // Head fill
  for (let y = 1; y <= 4; y++) {
    for (let x = 2; x < GRID - 2; x++) cells[y][x] = skin;
    cells[y][1] = skin;
    cells[y][GRID - 2] = skin;
    if (y === GRID / 2 + 1) { cells[y][1] = skin; cells[y][GRID - 2] = skin; }
  }
  // Visor eyes (pixel visor band)
  cells[3][2] = cells[3][GRID - 3] = cells[3][3] = cells[3][GRID - 4] = accent;
  cells[4][2] = cells[4][GRID - 3] = cells[4][3] = cells[4][GRID - 4] = accent;
  // Mouth
  cells[4][GRID / 2 - 1] = cells[4][GRID / 2] = cells[4][GRID / 2 + 1] = PALETTE[0];

  return cells;
}

export default function PixelAvatar({ seed, size = 40, className = "" }) {
  const cells = buildPixels(seed);
  const cell = 4;

  return (
    <span
      className={`pixel-avatar ${className}`}
      style={{ width: size, height: size, display: "inline-block", lineHeight: 0 }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${GRID * cell} ${GRID * cell}`}
        shapeRendering="crispEdges"
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        <rect width={GRID * cell} height={GRID * cell} fill="#0C0C12" />
        <rect x="1" y="1" width={GRID * cell - 2} height={GRID * cell - 2} fill="#12131C"/>
        {cells.map((row, y) =>
          row.map((color, x) =>
            color ? (
              <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={color} />
            ) : null
          )
        )}
      </svg>
    </span>
  );
}