import { supabase } from "./supabase";

export const TEAM_MEMBERS_TABLE = "team_members";
export const TEAM_MEMBERS_BUCKET = "team-members";

/* ── FHC canonical sectors ─────────────────────────────────────────
   Deterministic order used by the selector, section headers and the
   roster terminal. DB values are normalized case-insensitively onto
   these keys; anything unrecognized lands in the OTHER bucket. */
export const TEAM_ORDER = [
  "CORE",
  "FACULTY INCHARGE",
  "ADVISORY BOARD",
  "EVENT TEAM",
  "PROJECT TEAM",
  "WOMEN IN FHC",
  "TECH TEAM",
  "DOC & CONTENT TEAM",
  "MEDIA TEAM",
  "DESIGN TEAM",
];

export const OTHER_TEAM_KEY = "OTHER";

/* Case-insensitive synonym map: raw DB value (uppercased) → canonical
   sector key. Keeps older/looser labels on the correct sector. */
const TEAM_CANON = {
  CORE: "CORE",
  "CORE TEAM": "CORE",
  "CORE SYSTEM": "CORE",
  "FACULTY INCHARGE": "FACULTY INCHARGE",
  FACULTY: "FACULTY INCHARGE",
  "FACULTY IN-CHARGE": "FACULTY INCHARGE",
  "ADVISORY BOARD": "ADVISORY BOARD",
  ADVISORS: "ADVISORY BOARD",
  ADVISOR: "ADVISORY BOARD",
  "EVENT TEAM": "EVENT TEAM",
  EVENTS: "EVENT TEAM",
  "EVENTS TEAM": "EVENT TEAM",
  "EVENT DIVISION": "EVENT TEAM",
  "PROJECT TEAM": "PROJECT TEAM",
  PROJECTS: "PROJECT TEAM",
  "PROJECT DIVISION": "PROJECT TEAM",
  "WOMEN IN FHC": "WOMEN IN FHC",
  "WOMEN IN TECH": "WOMEN IN FHC",
  WITFHC: "WOMEN IN FHC",
  WIF: "WOMEN IN FHC",
  "TECH TEAM": "TECH TEAM",
  TECH: "TECH TEAM",
  "TECH DIVISION": "TECH TEAM",
  TECHNICAL: "TECH TEAM",
  "TECHNICAL TEAM": "TECH TEAM",
  "DOC & CONTENT TEAM": "DOC & CONTENT TEAM",
  "DOC AND CONTENT TEAM": "DOC & CONTENT TEAM",
  "DOC&CONTENT TEAM": "DOC & CONTENT TEAM",
  DOCUMENTATION: "DOC & CONTENT TEAM",
  "DOCUMENTATION TEAM": "DOC & CONTENT TEAM",
  CONTENT: "DOC & CONTENT TEAM",
  "CONTENT TEAM": "DOC & CONTENT TEAM",
  "MEDIA TEAM": "MEDIA TEAM",
  MEDIA: "MEDIA TEAM",
  "MEDIA DIVISION": "MEDIA TEAM",
  "DESIGN TEAM": "DESIGN TEAM",
  DESIGN: "DESIGN TEAM",
  "CREATIVE DIVISION": "DESIGN TEAM",
  "CREATIVE TEAM": "DESIGN TEAM",
};

export function normalizeTeam(raw) {
  const up = String(raw || "").trim().toUpperCase();
  if (!up) return OTHER_TEAM_KEY;
  return TEAM_CANON[up] || OTHER_TEAM_KEY;
}

/* Sector position (1-based) for any raw value or canonical key.
   Returns null for the OTHER bucket. */
export function teamSectorNumber(key) {
  const idx = TEAM_ORDER.indexOf(normalizeTeam(key));
  return idx === -1 ? null : idx + 1;
}

export function formatTeamName(team) {
  const canon = normalizeTeam(team);
  return canon === OTHER_TEAM_KEY ? "OTHER/UNCLASSIFIED" : canon;
}

/* Compact terminal label (roster HUD rows) — short, aligned, creed-like. */
const TEAM_SHORT = {
  CORE: "CORE",
  "FACULTY INCHARGE": "FACULTY",
  "ADVISORY BOARD": "ADVISORY",
  "EVENT TEAM": "EVENTS",
  "PROJECT TEAM": "PROJECT",
  "WOMEN IN FHC": "WOMEN",
  "TECH TEAM": "TECH",
  "DOC & CONTENT TEAM": "DOC/CT",
  "MEDIA TEAM": "MEDIA",
  "DESIGN TEAM": "DESIGN",
  [OTHER_TEAM_KEY]: OTHER_TEAM_KEY,
};

export function teamShortLabel(key) {
  const canon = normalizeTeam(key);
  return TEAM_SHORT[canon] || canon;
}

/* Fetch the public roster — active members only, sector order then
   display_order, so teams and players always appear in their intended
   sequence regardless of insertion order. */
export async function fetchActiveTeamMembers() {
  const { data, error } = await supabase
    .from(TEAM_MEMBERS_TABLE)
    .select("*")
    .eq("is_active", true)
    .order("team", { ascending: true })
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data || [])
    .map((m) => ({
      id: m.id,
      name: String(m.name || "UNKNOWN PLAYER"),
      designation: String(m.designation || ""),
      team: String(m.team || ""),
      photo_url: m.photo_url ? String(m.photo_url) : "",
      bio: m.bio ? String(m.bio) : "",
      linkedin_url: m.linkedin_url ? String(m.linkedin_url) : "",
      github_url: m.github_url ? String(m.github_url) : "",
      instagram_url: m.instagram_url ? String(m.instagram_url) : "",
      display_order: Number.isFinite(Number(m.display_order))
        ? Number(m.display_order)
        : 0,
      is_active: m.is_active !== false,
    }))
    .sort((a, b) => {
      if (a.display_order !== b.display_order)
        return a.display_order - b.display_order;
      return String(a.name).localeCompare(String(b.name));
    });
}

/* Resolve a member's photograph to a renderable URL.
   - Full URLs (http/https/data/blob) are used as-is.
   - Anything else is treated as a path inside the `team-members` bucket
     and resolved through Supabase Storage (with image optimization when
     the project has it enabled).
   Returns null when there is no usable image. */
export function resolveMemberPhoto(member, { width, height } = {}) {
  const raw = member?.photo_url;
  if (!raw) return null;
  const url = raw.trim();
  if (!url) return null;

  const fullUrl = /^(https?:\/\/|data:|blob:|\/)/i.test(url);
  if (fullUrl) return url;

  try {
    const opts =
      width && height
        ? { transform: { width, height, resize: "cover", format: "webp" } }
        : undefined;
    const { data } = supabase.storage
      .from(TEAM_MEMBERS_BUCKET)
      .getPublicUrl(url, opts);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

export function safeSocialUrl(url, baseUrl) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${baseUrl}${value.startsWith("/") ? "" : "/"}${value}`;
}

/* Group the (already sorted) roster into the deterministic FHC sector
   order, preserving display_order within each sector. Every generated
   group is guaranteed to carry a members array — never undefined.
   Unknown teams collect into ONE trailing OTHER bucket (omitted when
   no such members exist). */
export function buildArena(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const buckets = new Map();
  for (const m of safeRows) {
    const canon = normalizeTeam(m?.team);
    if (!buckets.has(canon)) buckets.set(canon, []);
    buckets.get(canon).push(m);
  }

  const groups = [];
  TEAM_ORDER.forEach((canon, i) => {
    const members = buckets.get(canon);
    if (members && members.length) {
      groups.push({ key: canon, num: i + 1, members });
    }
  });

  const other = buckets.get(OTHER_TEAM_KEY);
  if (other && other.length) {
    groups.push({ key: OTHER_TEAM_KEY, num: groups.length + 1, members: other });
  }
  return groups;
}

export const TEAM_STATE = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};