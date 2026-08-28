export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const GLYPHS = ["+", "✦", "✧", "·"];

export function makeTwinkles(count = 22, seed = 42, maxTop = 65) {
  const rand = mulberry32(seed);
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    glyph: GLYPHS[Math.floor(rand() * GLYPHS.length)],
    left: `${rand() * 100}%`,
    top: `${rand() * maxTop}%`,
    delay: `${rand() * 3}s`,
  }));
}
