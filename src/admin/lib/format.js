/* FHC // ADMIN — shared formatting utilities */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function fmtDate(iso, opts = {}) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    if (opts.short) return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
    if (opts.iso) return d.toISOString();
    return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return "—";
  }
}

export function fmtTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  } catch {
    return "";
  }
}

export function fmtDateTime(iso) {
  const d = fmtDate(iso);
  const t = fmtTime(iso);
  return t ? `${d} ${t}` : d;
}

export function timeAgo(iso) {
  if (!iso) return "";
  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "JUST NOW";
    if (mins < 60) return `${mins}M AGO`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}H AGO`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}D AGO`;
    return fmtDate(iso);
  } catch {
    return "";
  }
}

export function padNum(n, width = 3) {
  return String(n == null ? 0 : n).padStart(width, "0");
}

export function initials(name = "") {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

const SEED_PALETTE = [
  ["#ff1687", "#2a0d1c"],
  ["#1ed7e8", "#0a1c20"],
  ["#36d65a", "#0c1a10"],
  ["#ffd21a", "#241e08"],
  ["#9b59ff", "#1a1026"],
  ["#ffa23d", "#241708"],
  ["#ff4d5e", "#200a0d"],
];

export function seedPalette(seed = "") {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return SEED_PALETTE[h % SEED_PALETTE.length];
}

export function avatarStyle(seed = "") {
  const [fg, bg] = seedPalette(seed);
  return { background: bg, color: fg, borderColor: `${fg}55` };
}

/* Slug-safe filename base */
export function sanitizeFile(name = "") {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function nowStamp() {
  const d = new Date();
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/* Friendly role label — DB stores 'member' as legacy alias of 'user' */
export function roleLabel(role) {
  const r = String(role || "user").toLowerCase();
  if (r === "member") return "USER";
  if (r === "admin") return "ADMIN";
  if (r === "media") return "MEDIA";
  return r.toUpperCase();
}

/* Map application lifecycle to a token + color class.
   DB lifecycle: applied → under_review → selected / rejected.
   The UI presents them as PENDING / UNDER REVIEW / APPROVED / REJECTED
   (the spec's user-facing status names). */
export function appStatusMeta(status) {
  switch (String(status || "")) {
    case "applied":
      return { token: "PENDING", cls: "ad-badge--cyan" };
    case "under_review":
      return { token: "UNDER REVIEW", cls: "ad-badge--yellow" };
    case "selected":
      return { token: "APPROVED", cls: "ad-badge--green" };
    case "rejected":
      return { token: "REJECTED", cls: "ad-badge--red" };
    default:
      return { token: String(status || "UNKNOWN").toUpperCase(), cls: "ad-badge--muted" };
  }
}

export function eventStatusMeta(status) {
  switch (String(status || "")) {
    case "published":
      return { token: "PUBLISHED", cls: "ad-badge--green" };
    case "draft":
      return { token: "DRAFT", cls: "ad-badge--yellow" };
    case "archived":
      return { token: "ARCHIVED", cls: "ad-badge--muted" };
    default:
      return { token: String(status || "UNKNOWN").toUpperCase(), cls: "ad-badge--muted" };
  }
}

export function projectStatusMeta(status) {
  return eventStatusMeta(status);
}

export function boolStatus(active) {
  if (active === true) return { token: "ACTIVE", cls: "ad-badge--green" };
  if (active === false) return { token: "INACTIVE", cls: "ad-badge--muted" };
  return { token: "—", cls: "ad-badge--muted" };
}

export function publishedMeta(published) {
  if (published === true) return { token: "PUBLISHED", cls: "ad-badge--green" };
  return { token: "HIDDEN", cls: "ad-badge--muted" };
}

export function buildRangeLabel(from, to) {
  if (from && to) return `${fmtDate(from)} — ${fmtDate(to)}`;
  if (from) return `SINCE ${fmtDate(from)}`;
  if (to) return `UNTIL ${fmtDate(to)}`;
  return "";
}

export function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

export function truthyCount(arr) {
  return safeArray(arr).filter(Boolean).length;
}

/* Nice human list join */
export function joinList(arr, empty = "") {
  const a = safeArray(arr).filter((x) => x != null && String(x).trim() !== "");
  return a.length ? a.join(", ") : empty;
}

/* Strip direction indicator for a sort token cache key */
export function sortKey(a, b) {
  return `${a}:${b}`;
}