import { useEffect, useRef, useState } from "react";
import "./../player-hub.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  MotionConfig,
} from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PixelAvatar from "../components/PixelAvatar";
import { supabase } from "../lib/supabase";
import {
  isCloudinaryConfigured,
  isValidAvatarFile,
  uploadAvatarToCloudinary,
} from "../lib/cloudinary";
import { classifyProfileError, PROFILE_ERROR, updateProfileFields } from "../lib/profileService";

const PK = "#FF1687";
const CY = "#00E5FF";
const CR = "#FFF7E5";
const GR = "#36D65A";
const YL = "#FFD21A";
const INK = "#0A0C12";

function fmtDate(iso) {
  if (!iso) return "-- --- ----";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-- --- ----";
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return "-- --- ----"; }
}

/* ── tiny handcrafted pixel sprites ─────────────────────────── */

function PixelIcon({ rows, color = PK, size = 40, className = "" }) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" className={className} aria-hidden="true">
      {rows.map((row, y) =>
        [...row].map((ch, x) =>
          ch === "." ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={ch === "+" ? CR : color} />
          )
        )
      )}
    </svg>
  );
}

const EVENTS_ART = [
  "..####..",
  "..####..",
  ".######.",
  "##....##",
  "##.##.##",
  "##.##.##",
  ".######.",
  "..####..",
];

const PROJECTS_ART = [
  ".########.",
  "#........#",
  "#>......+#",
  "#.#....#.#",
  "#.######.#",
  "#.######.#",
  "#.#....#.#",
  "#........#",
  ".########.",
];

const GALLERY_ART = [
  "...####...",
  "..######..",
  ".########.",
  "##########",
  "#.######.#",
  "#.######.#",
  "#.######.#",
  "#.######.#",
  "##########",
  ".########.",
];

const ABOUT_ART = [
  "..######..",
  ".########.",
  "##########",
  ".#......#.",
  ".#.####.#.",
  ".#.####.#.",
  ".#.####.#.",
  ".#......#.",
  ".########.",
  "..######..",
];

/* The FHC sunrise mark — horizon line over the sun. */
const FHC_MARK_ART = [
  "....####....",
  "...######...",
  "..##....##..",
  "..##.##.##..",
  "...######...",
  "....####....",
  "............",
  "..########..",
  ".##########.",
  "############",
  "############",
  "############",
];

/* ── ARCADE — four destinations ───────────────────────────── */

const WORLD = [
  {
    key: "EVENTS",
    num: "01",
    label: "EVENTS",
    cat: "TICKET",
    sub: "WHAT'S HAPPENING",
    to: "/coming-soon",
    accent: PK,
    art: EVENTS_ART,
    route: { x1: 50, y1: 34, x2: 50, y2: 22 },
    tip: "M49 22 L51 22 L50 20 Z",
  },
  {
    key: "PROJECTS",
    num: "02",
    label: "PROJECTS",
    cat: "SCREEN",
    sub: "BUILDS / EXPERIMENTS",
    to: "/coming-soon",
    accent: CY,
    art: PROJECTS_ART,
    route: { x1: 38, y1: 48, x2: 26, y2: 48 },
    tip: "M22 46 L22 48 L20 47 Z",
  },
  {
    key: "GALLERY",
    num: "03",
    label: "GALLERY",
    cat: "FRAME",
    sub: "MEMORIES",
    to: "/gallery",
    accent: YL,
    art: GALLERY_ART,
    route: { x1: 62, y1: 48, x2: 74, y2: 48 },
    tip: "M78 46 L78 48 L80 47 Z",
  },
  {
    key: "ABOUT",
    num: "04",
    label: "ABOUT",
    cat: "CREST",
    sub: "THE CLUB",
    to: "/about",
    accent: GR,
    art: ABOUT_ART,
    route: { x1: 50, y1: 60, x2: 50, y2: 70 },
    tip: "M49 72 L51 72 L50 74 Z",
  },
];

const MotionLink = motion.create(Link);

/* ── choreography ──────────────────────────────────────────── */

const rise = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const boot = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const viewStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const passWrap = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.35 } },
};

const partStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.5 } },
};

const partRise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/* the little pixel marker descending toward the pass */
const descent = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, delay: 0.5 } },
};

/* the detached stub settling into place after the pass lands */
const stubSettle = {
  hidden: { opacity: 0, x: 16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.75 } },
};

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD — FHC PLAYER HUB
   Business logic is intentionally unchanged: every handler and
   data extraction below is the same one that has always worked.
   ═══════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const { user, profile, status, refreshProfile, signOut, supabase, role, isMedia } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const avatarInputRef = useRef(null);

  const [pwMode, setPwMode] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (status !== "authed" && status !== "loading") navigate("/auth", { replace: true });
  }, [status, navigate]);

  useEffect(() => {
    if (!location.hash || location.hash.length < 2) return;
    try {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } catch { /* hash is a URL token, not an anchor */ }
  }, [location.hash]);

  if (status === "loading" || status !== "authed") {
    return (
      <MotionConfig reducedMotion="user">
        <div className="hub-loader">
          <div className="hub-loader-box">
            <div className="hub-loader-pulse" aria-hidden="true" />
            <div className="font-pixel text-[8px] tracking-[0.3em]" style={{ color: CY }}>
              <span className="hub-caret" aria-hidden="true">_</span> OPENING YOUR FHC SPACE
            </div>
            <div className="hub-loader-sub font-pixel">VERIFYING PLAYER SESSION</div>
          </div>
        </div>
      </MotionConfig>
    );
  }

  /* ── data extraction (real profile fields only) ── */
  const name = profile?.full_name || user?.user_metadata?.full_name || "PLAYER";
  const email = profile?.email || user?.email || "";
  const seed = profile?.avatar_seed || user?.id || email || "fhc";
  const since = profile?.created_at || user?.created_at;
  const avatarUrl = profile?.avatar_url || "";
  const accessLevel = role === "admin" ? "ADMIN" : role === "media" ? "MEDIA" : "MEMBER";

  /* ── handlers ── */
  const saveProfile = async () => {
    setEditSaving(true);
    setEditMsg(null);
    try {
      const uid = user?.id;
      if (!uid) {
        const err = new Error("No authenticated session.");
        err.code = PROFILE_ERROR.NO_USER;
        throw err;
      }
      /* Build the patch from ONLY the fields that actually changed.
         Only columns present in the live profiles schema ship: full_name,
         avatar_url. Username is NOT a live column — writing it would 400. */
      const patch = {};
      const newName = editName.trim();
      if (newName && newName !== name) patch.full_name = newName;

      if (Object.keys(patch).length === 0) {
        setEditMsg({ kind: "ok", text: "NO CHANGES DETECTED" });
        setEditMode(false);
        return;
      }

      const { error } = await updateProfileFields(uid, patch);
      if (error) throw error;

      setEditMsg({ kind: "ok", text: "✓ PROFILE SYNCHRONIZED" });
      await refreshProfile(uid); // refetch from DB — the source of truth
      setEditMode(false);
    } catch (err) {
      console.error("[FHC] Profile update failed:", err);
      const cls = classifyProfileError(err);
      const text =
        cls === PROFILE_ERROR.DUPLICATE_USERNAME
          ? "[!] USERNAME ALREADY TAKEN"
          : cls === PROFILE_ERROR.RLS_DENIED
            ? "[!] UPDATE BLOCKED — RLS PERMISSION"
            : cls === PROFILE_ERROR.NOT_FOUND
              ? "[!] PROFILE ROW NOT FOUND"
              : "[!] PROFILE UPDATE FAILED";
      setEditMsg({ kind: "error", text });
    } finally {
      setEditSaving(false);
    }
  };

  /* ── avatar upload: LOCAL FILE → Cloudinary → secure_url → Supabase ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    /* INPUT RESET: let a re-selected file (even the SAME one) fire onChange.
       The File object is captured above, so clearing the control cannot
       invalidate it. Done first — but only after capturing the file. */
    e.target.value = "";
    console.log("[FHC Avatar] file selected →", file?.name, file ? `${file.type} ${(file.size / 1024).toFixed(1)} KB` : "(none)");
    if (!file || avatarBusy) return;

    setAvatarMsg(null);
    if (!isCloudinaryConfigured()) {
      console.error("[FHC Avatar] not configured (VITE_CLOUDINARY_* missing).");
      setAvatarMsg({
        kind: "error",
        text: "[!] AVATAR UPLOAD OFFLINE — NO CLOUD CHANNEL",
      });
      return;
    }

    const check = isValidAvatarFile(file);
    if (!check.ok) {
      const text =
        check.reason === "TOO_LARGE"
          ? "[!] IMAGE TOO LARGE — MAXIMUM SIZE IS 5 MB"
          : "[!] INVALID IMAGE — PLEASE SELECT A JPG, PNG, OR WEBP IMAGE";
      console.warn("[FHC Avatar] validation rejected →", check.reason);
      setAvatarMsg({ kind: "error", text });
      return;
    }
    console.log("[FHC Avatar] validation passed →", file.name);

    setAvatarBusy(true);
    try {
      const secureUrl = await uploadAvatarToCloudinary(file, user?.id);
      console.log("[FHC Avatar] updating Supabase profile (avatar_url)…");

      const { data, error } = await supabase
        .from("profiles")
        .update({ avatar_url: secureUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select("avatar_url, updated_at")
        .maybeSingle();

      if (error) throw error;
      console.log("[FHC Avatar] Supabase update successful →", data);
      if (!data || data.avatar_url !== secureUrl) {
        console.error("[FHC Avatar] Supabase returned unexpected avatar_url", data);
        throw new Error("Supabase update confirmed but returned wrong avatar_url");
      }

      await refreshProfile(user.id);
      setAvatarVersion((v) => v + 1); // display-only cache-buster
      console.log("[FHC Avatar] local avatar state updated (version", avatarVersion + 1, ")");
      setAvatarMsg({ kind: "ok", text: "AVATAR UPLOADED ✓" });
    } catch (err) {
      console.error("[FHC Avatar] upload pipeline failed:", err);
      const isCloudFail =
        err.code === "CLOUDINARY_NOT_CONFIGURED" ||
        err.code === "CLOUDINARY_NETWORK" ||
        err.code === "CLOUDINARY_UPLOAD_FAILED" ||
        err.code === "INVALID_IMAGE" ||
        err.code === "IMAGE_TOO_LARGE";
      setAvatarMsg({
        kind: "error",
        text: isCloudFail
          ? "[!] AVATAR UPLOAD FAILED — CLOUDINARY UPLOAD FAILED"
          : "[!] PROFILE UPDATE FAILED — AVATAR UPLOADED BUT COULD NOT SAVE THE PROFILE",
      });
    } finally {
      console.log("[FHC Avatar] busy reset → false");
      setAvatarBusy(false);
    }
  };

  const savePassword = async () => {
    setPwMsg(null);
    if (pw1.length < 6) { setPwMsg({ kind: "error", text: "ACCESS CODE MUST BE ≥ 6 CHARS" }); return; }
    if (pw1 !== pw2) { setPwMsg({ kind: "error", text: "ACCESS CODES DO NOT MATCH" }); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setPwSaving(false);
    if (error) {
      setPwMsg({ kind: "error", text: "FAILED TO REINITIALIZE CODE" });
    } else {
      setPwMsg({ kind: "ok", text: "ACCESS CODE UPDATED ✓" });
      setPw1(""); setPw2(""); setPwMode(false);
    }
  };

  const doLogout = async () => {
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 700));
    await signOut();
    navigate("/", { replace: true });
  };

  const openEdit = () => {
    setEditName(name);
    setEditMsg(null);
    setPwMode(false);
    setEditMode(true);
  };

  const openAccessCode = () => {
    setEditMode(false);
    setPwMode(true);
    setPwMsg(null);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="hub-root">
        {/* ── arcade room, at night ── */}
        <div className="hub-ambient" aria-hidden="true">
          <div className="hub-bg-grid" />
          <div className="hub-bg-lites" />
          <div className="hub-bg-scan" />
          <div className="hub-bg-stars" />
          <div className="hub-bg-cue" />
        </div>

        <div className="hub-inner">

          {/* ═══════════════════════════════════════════
              00 — ARRIVAL / GREETING
              ═══════════════════════════════════════════ */}
          <motion.section className="hub-entry" initial="hidden" animate="show" variants={boot} aria-label="Player entry">
            <div className="hub-eyebrow font-pixel" variants={rise}>
              <span className="hub-kicker-tick" aria-hidden="true">▮</span>
              FHC // PLAYER HUB
            </div>

            <h1 className="hub-hello font-pixel" variants={rise}>
              WELCOME BACK<span className="hub-hello-comma" aria-hidden="true">.</span>
            </h1>

            <p className="hub-hello-sub" variants={rise}>YOUR PLACE INSIDE THE HORIZON.</p>

            {/* the little pixel marker descending toward the pass */}
            <motion.div className="hub-descent" variants={descent} aria-hidden="true">
              <span className="hub-descent-rail" />
              <span className="hub-descent-pix" />
            </motion.div>
          </motion.section>

          {/* ═══════════════════════════════════════════
              THE HORIZON PASS — the physical boarding pass
              ═══════════════════════════════════════════ */}
          <section className="hub-section hub-passsec" aria-label="Your FHC horizon pass">
            <div className="hub-section-head">
              <div className="hub-kicker font-pixel">
                <span className="hub-kicker-tick" aria-hidden="true">▮</span>
                01 // HORIZON PASS
              </div>
              <h2 className="hub-h2 font-pixel">YOUR HORIZON PASS</h2>
              <p className="hub-section-sub">YOUR IDENTITY AT THE GATES OF FHC.</p>
            </div>

            <div className="hub-pass-slot">
              <HorizonPass
                name={name}
                email={email}
                seed={seed}
                avatarUrl={avatarUrl}
                avatarVersion={avatarVersion}
                accessLevel={accessLevel}
                since={since}
                avatarBusy={avatarBusy}
                avatarMsg={avatarMsg}
                avatarInputRef={avatarInputRef}
                handleAvatarChange={handleAvatarChange}
              />
            </div>
          </section>

          {/* ═══════════════════════════════════════════
              02 — ARCADE SELECT
              ═══════════════════════════════════════════ */}
          <section className="hub-section hub-select" aria-label="Choose your destination">
            <div className="hub-section-head hub-section-head--center">
              <div className="hub-kicker font-pixel">
                <span className="hub-kicker-tick" aria-hidden="true">▮</span>
                02 // ARCADE SELECT
              </div>
              <h2 className="hub-h2 font-pixel">WHERE DO YOU WANT TO GO?</h2>
              <p className="hub-section-sub">FOUR DESTINATIONS. ONE CLUB. PICK YOUR PATH.</p>
            </div>

            <nav className="hub-select-stage" aria-label="Club destinations">
              <ArcadeBoard />

              {isMedia && (
                <Link to="/media" className="hub-media-link font-pixel">
                  <span className="hub-media-dot" aria-hidden="true">◈</span>
                  MEDIA CONSOLE — MANAGE ALBUMS + UPLOAD EVENT MEDIA
                  <span className="hub-enter-arrow" aria-hidden="true">→</span>
                </Link>
              )}
            </nav>
          </section>

          {/* ═══════════════════════════════════════════
              03 — PLAYER LOADOUT
              ═══════════════════════════════════════════ */}
          <motion.section className="hub-section hub-loadsec" variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-64px" }} aria-label="Player loadout">
            <div className="hub-section-head">
              <div className="hub-kicker font-pixel">
                <span className="hub-kicker-tick" aria-hidden="true">▮</span>
                03 // PLAYER LOADOUT
              </div>
              <h2 className="hub-h2 font-pixel">PLAYER LOADOUT</h2>
              <p className="hub-section-sub">YOUR CURRENT FIGHTING GEAR INSIDE FHC.</p>
            </div>

            <PlayerLoadout
              name={name}
              email={email}
              seed={seed}
              avatarUrl={avatarUrl}
              avatarVersion={avatarVersion}
              accessLevel={accessLevel}
              since={since}
            />
          </motion.section>

          {/* ═══════════════════════════════════════════
              04 — PLAYER CONTROLS
              ═══════════════════════════════════════════ */}
          <motion.section className="hub-section hub-ctlsec" variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-64px" }} aria-label="Player controls">
            <div className="hub-section-head">
              <div className="hub-kicker font-pixel">
                <span className="hub-kicker-tick" aria-hidden="true">▮</span>
                04 // PLAYER CONTROLS
              </div>
              <h2 className="hub-h2 font-pixel">PLAYER CONTROLS</h2>
              <p className="hub-section-sub">MANAGE YOUR SPACE INSIDE FHC.</p>
            </div>

            <div className="hub-ctl-slot">
              <AnimatePresence mode="wait">
                {editMode ? (
                  <motion.div key="edit" className="hub-form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                    <div className="hub-form-head">
                      <span className="hub-form-eye" aria-hidden="true">▸</span>
                      <span className="font-pixel" style={{ color: CY }}>EDITING PLAYER DATA</span>
                    </div>
                    <div className="hub-form-body">
                      <label className="hub-form-label font-pixel" htmlFor="hub-name">FULL NAME</label>
                      <input
                        id="hub-name"
                        className="hub-form-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                      <AnimatePresence>
                        {editMsg && (
                          <motion.div
                            role="status"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="hub-form-msg font-pixel"
                            style={{ color: editMsg.kind === "ok" ? GR : PK }}
                          >
                            {editMsg.text}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="hub-form-actions">
                        <motion.button type="button" onClick={saveProfile} disabled={editSaving} className="hub-btn" style={{ color: GR }} whileHover={{ y: -1 }} whileTap={{ y: 1 }}>
                          {editSaving ? "SYNCING..." : "SAVE CHANGES ✓"}
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => { setEditMode(false); setEditMsg(null); }}
                          className="hub-btn hub-btn--ghost"
                          style={{ color: CR }}
                          whileHover={{ y: -1 }} whileTap={{ y: 1 }}
                        >
                          CANCEL
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : pwMode ? (
                  <motion.div key="pw" className="hub-form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                    <div className="hub-form-head">
                      <span className="hub-form-eye" aria-hidden="true">▸</span>
                      <span className="font-pixel" style={{ color: CY }}>REINITIALIZE ACCESS CODE</span>
                    </div>
                    <div className="hub-form-body">
                      <label className="hub-form-label font-pixel" htmlFor="hub-pw1">NEW ACCESS CODE</label>
                      <input id="hub-pw1" type="password" className="hub-form-input" value={pw1} onChange={(e) => setPw1(e.target.value)} />
                      <label className="hub-form-label font-pixel" htmlFor="hub-pw2">CONFIRM NEW CODE</label>
                      <input id="hub-pw2" type="password" className="hub-form-input" value={pw2} onChange={(e) => setPw2(e.target.value)} />
                      <AnimatePresence>
                        {pwMsg && (
                          <motion.div
                            role="status"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="hub-form-msg font-pixel"
                            style={{ color: pwMsg.kind === "ok" ? GR : PK }}
                          >
                            {pwMsg.text}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="hub-form-actions">
                        <motion.button type="button" onClick={savePassword} disabled={pwSaving} className="hub-btn" style={{ color: GR }} whileHover={{ y: -1 }} whileTap={{ y: 1 }}>
                          {pwSaving ? "ENCRYPTING..." : "REINITIALIZE ✓"}
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => { setPwMode(false); setPwMsg(null); }}
                          className="hub-btn hub-btn--ghost"
                          style={{ color: CR }}
                          whileHover={{ y: -1 }} whileTap={{ y: 1 }}
                        >
                          CANCEL
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <PlayerControls key="controls" openEdit={openEdit} openAccessCode={openAccessCode} doLogout={doLogout} />
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          <footer className="hub-foot">
            <span className="hub-foot-mark font-pixel">FHC // PLAYER HUB</span>
            <span className="hub-foot-text">YOUR PLACE INSIDE THE HORIZON.</span>
            <span className="hub-foot-led" aria-hidden="true" />
          </footer>
        </div>

        {/* ── logout overlay ── */}
        <AnimatePresence>
          {loggingOut && (
            <motion.div className="hub-logout-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="hub-logout-box">
                <motion.div className="font-pixel text-center" style={{ color: CR }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                  <div style={{ color: PK }}>DISCONNECTING PLAYER...</div>
                  <div className="mt-3" style={{ color: CY }}>SESSION TERMINATED</div>
                  <div className="hub-logout-sub font-pixel mt-3">POWERING DOWN THE HORIZON PASS</div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/* ═══════════════════════════════════════════════════════════
   HORIZON PASS — a physical FHC boarding pass / identity ticket
   ═══════════════════════════════════════════════════════════ */

function HorizonPass({ name, email, seed, avatarUrl, avatarVersion, accessLevel, since, avatarBusy, avatarMsg, avatarInputRef, handleAvatarChange }) {
  return (
    <motion.div
      className="hub-pass-wrap"
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -14, transition: { duration: 0.22 } }}
      variants={partStagger}
    >
      <motion.div
        className="hub-pass"
        variants={passWrap}
        whileHover={{ y: -3 }}
      >
        {/* the single scanning line — one pass on load, then still */}
        <span className="hub-pass-scanline" aria-hidden="true" />

        {/* face (main portion, kept whole) */}
        <div className="hub-pass-main">
          {/* header */}
          <motion.div className="hub-pass-top" variants={partRise}>
            <div className="hub-pass-brand">
              <span className="hub-pass-brand-fhc font-pixel">FHC</span>
              <span className="hub-pass-brand-txt font-pixel">HORIZON PASS</span>
            </div>
            <div className="hub-pass-meta">
              <span className="hub-pass-meta-k font-pixel">FISAT HORIZON CLUB</span>
              <span className="hub-pass-meta-v font-pixel" style={{ color: accessLevel === "ADMIN" ? YL : accessLevel === "MEDIA" ? CY : GR }}>
                MEMBER CLASS · {accessLevel}
              </span>
            </div>
            <span className="hub-pass-sun" aria-hidden="true">
              <PixelIcon rows={FHC_MARK_ART} color={PK} size={30} />
            </span>
          </motion.div>

          {/* body — identity + ID photo */}
          <div className="hub-pass-core">
            <motion.div className="hub-pass-id" variants={partRise}>
              <span className="hub-pass-field font-pixel">PLAYER</span>
              <span className="hub-pass-name font-pixel" title={name}>{name}</span>
              {email && <span className="hub-pass-mail">{email}</span>}
              <div className="hub-pass-since">
                <span className="hub-pass-field font-pixel">MEMBER SINCE</span>
                <span className="hub-pass-since-v font-pixel">{fmtDate(since)}</span>
              </div>
            </motion.div>

            {/* photo (ID frame with registration marks) */}
            <motion.div className="hub-pass-photo" variants={partRise}>
              <span className="hub-pass-photo-tag font-pixel">ID PHOTO</span>
              <div className="hub-pass-photo-frame">
                <span className="hub-pass-reg hub-pass-reg--tl" aria-hidden="true" />
                <span className="hub-pass-reg hub-pass-reg--tr" aria-hidden="true" />
                <span className="hub-pass-reg hub-pass-reg--bl" aria-hidden="true" />
                <span className="hub-pass-reg hub-pass-reg--br" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarBusy}
                  className="hub-pass-avatar-btn"
                  aria-label="Edit profile avatar"
                >
                  {avatarUrl ? (
                    <img
                      /* display-only cache-buster — stored avatar_url stays clean */
                      src={avatarVersion ? `${avatarUrl}?v=${avatarVersion}` : avatarUrl}
                      alt={`${name} profile avatar`}
                      className="hub-pass-avatar-img"
                      width={150}
                      height={150}
                    />
                  ) : (
                    <PixelAvatar seed={seed} size={150} className="hub-pass-avatar-pix" />
                  )}
                  <span className="hub-pass-avatar-hint font-pixel">
                    {avatarBusy ? "UPLOADING..." : "EDIT PROFILE"}
                  </span>
                </button>
              </div>
              <AnimatePresence>
                {avatarMsg && (
                  <motion.div
                    role="status"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="hub-pass-avatar-msg font-pixel"
                    style={{ color: avatarMsg.kind === "ok" ? GR : PK }}
                  >
                    {avatarMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="hub-sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            </motion.div>
          </div>

          {/* footer — four printed cells */}
          <motion.div className="hub-pass-foot" variants={partRise} aria-label="Membership status">
            <div className="hub-pass-cell">
              <span className="hub-pass-cell-label font-pixel">ACCOUNT STATUS</span>
              <span className="hub-pass-cell-val font-pixel" style={{ color: GR }}>
                <span className="hub-pass-dot" style={{ background: GR }} aria-hidden="true" />ACTIVE
              </span>
            </div>
            <div className="hub-pass-cell">
              <span className="hub-pass-cell-label font-pixel">MEMBERSHIP</span>
              <span className="hub-pass-cell-val font-pixel" style={{ color: GR }}>
                <span className="hub-pass-dot" style={{ background: GR }} aria-hidden="true" />ACTIVE
              </span>
            </div>
            <div className="hub-pass-cell">
              <span className="hub-pass-cell-label font-pixel">ACCESS LEVEL</span>
              <span className="hub-pass-cell-val font-pixel" style={{ color: YL }}>{accessLevel}</span>
            </div>
            <div className="hub-pass-cell">
              <span className="hub-pass-cell-label font-pixel">MEMBER SINCE</span>
              <span className="hub-pass-cell-val font-pixel" style={{ color: CY }}>{fmtDate(since)}</span>
            </div>
          </motion.div>

          {/* micro print strip */}
          <div className="hub-pass-micro" aria-hidden="true">
            <span>FHC // FISAT HORIZON CLUB OFFICIAL MEMBER IDENTITY · NOT FOR RESALE</span>
            <span>ISSUED BY THE FHC ARCADE — CARRY THIS PASS WITH YOUR CREDENTIALS</span>
          </div>
        </div>

        {/* perforated tear line */}
        <div className="hub-pass-perf" aria-hidden="true">
          <span className="hub-pass-perf-y" />
        </div>

        {/* detachable stub */}
        <motion.div className="hub-pass-stub" variants={stubSettle} aria-hidden="true">
          <div className="hub-pass-stub-crest">
            <span className="hub-pass-stub-crest-ic" aria-hidden="true">
              <PixelIcon rows={FHC_MARK_ART} color={INK} size={30} />
            </span>
            <span className="hub-pass-stub-crest-txt font-pixel">HORIZON CLUB</span>
          </div>
          <div className="hub-pass-stub-barcode" />
          <span className="hub-pass-stub-note font-pixel">★ PASS</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ARCADE SELECT — the FHC arcade terminal. A central CRT hub
   connected to the four destinations by pixel route lines.
   ═══════════════════════════════════════════════════════════ */

function ArcadeBoard() {
  const [hot, setHot] = useState(null);

  return (
    <div className="hub-board" data-hot={hot ?? ""} onMouseLeave={() => setHot(null)}>
      {/* route overlay — hover lights the matching line */}
      <svg className="hub-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {WORLD.map((d) => (
          <g key={d.key} className={`hub-route hub-route--${d.key}`}>
            <line className="hub-route-line" x1={d.route.x1} y1={d.route.y1} x2={d.route.x2} y2={d.route.y2} />
            <circle className="hub-route-node" cx={d.route.x1} cy={d.route.y1} r="1.6" />
            <circle className="hub-route-node hub-route-node--g" cx={d.route.x2} cy={d.route.y2} r="1.2" />
            <path className="hub-route-tip" d={d.tip} />
          </g>
        ))}
      </svg>

      <motion.div className="hub-board-grid" initial="hidden" whileInView="show" viewport={{ once: true, margin: "-64px" }} variants={viewStagger}>
        <ArcadeHub hot={hot} />

        {WORLD.map((d) => (
          <ArcadeModule key={d.key} d={d} setHot={setHot} />
        ))}
      </motion.div>
    </div>
  );
}

function ArcadeHub({ hot }) {
  const dest = hot ? WORLD.find((d) => d.key === hot) : null;

  return (
    <div className="hub-hub" role="status" aria-live="polite">
      <div className="hub-hub-crt" aria-hidden="true" />
      <div className="hub-hub-frame">
        <div className="hub-hub-base" aria-hidden="true" />
        <AnimatePresence mode="wait">
          {dest ? (
            <motion.div className="hub-hub-screen" key={dest.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              <span className="hub-hub-screen-num font-pixel" style={{ color: dest.accent }}>{dest.num} // {dest.cat}</span>
              <span className="hub-hub-screen-label font-pixel" style={{ color: dest.accent }}>{dest.label}</span>
              <span className="hub-hub-screen-sub">{dest.sub}</span>
              <span className="hub-hub-cue font-pixel">
                <span className="hub-hub-cue-dot" style={{ background: dest.accent }} aria-hidden="true" />PRESS TO ENTER
              </span>
            </motion.div>
          ) : (
            <motion.div className="hub-hub-screen hub-hub-screen--idle" key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              <span className="hub-hub-screen-mark" aria-hidden="true">
                <PixelIcon rows={FHC_MARK_ART} color={CY} size={30} />
              </span>
              <span className="hub-hub-screen-title font-pixel">FHC HORIZON HUB</span>
              <span className="hub-hub-screen-sub">SELECT DESTINATION</span>
              <span className="hub-hub-cue font-pixel">
                <span className="hub-hub-cue-dot" aria-hidden="true" />INSERT COIN — PICK YOUR PATH
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ArcadeModule({ d, setHot }) {
  return (
    <MotionLink
      to={d.to}
      variants={rise}
      style={{ "--hub-a": d.accent, gridArea: d.key.toLowerCase() }}
      className="hub-mod"
      onMouseEnter={() => setHot(d.key)}
      onFocus={() => setHot(d.key)}
      onBlur={() => setHot(null)}
      whileHover={{ y: -3 }}
      whileTap={{ y: 0 }}
      aria-label={`${d.label} — enter`}
    >
      <span className="hub-mod-num font-pixel" aria-hidden="true">{d.num}</span>
      <span className="hub-mod-ic" aria-hidden="true">
        <PixelIcon rows={d.art} color={d.accent} size={26} />
      </span>
      <span className="hub-mod-txt">
        <span className="hub-mod-kicker font-pixel" style={{ color: d.accent }}>{d.cat}</span>
        <span className="hub-mod-label font-pixel">{d.label}</span>
        <span className="hub-mod-sub">{d.sub}</span>
      </span>
      <span className="hub-mod-enter font-pixel">
        ENTER <span className="hub-enter-arrow" aria-hidden="true">→</span>
      </span>
      <span className="hub-mod-spark hub-mod-spark--1" aria-hidden="true" />
      <span className="hub-mod-spark hub-mod-spark--2" aria-hidden="true" />
      <span className="hub-mod-spark hub-mod-spark--3" aria-hidden="true" />
      <span className="hub-mod-spark hub-mod-spark--4" aria-hidden="true" />
    </MotionLink>
  );
}

/* ═══════════════════════════════════════════════════════════
   PLAYER LOADOUT — compact character-select footer
   ═══════════════════════════════════════════════════════════ */

function PlayerLoadout({ name, email, seed, avatarUrl, avatarVersion, accessLevel, since }) {
  return (
    <div className="hub-loadout" aria-label="Player loadout summary">
      <div className="hub-loadout-frame">
        {avatarUrl ? (
          <img
            src={avatarVersion ? `${avatarUrl}?v=${avatarVersion}` : avatarUrl}
            alt=""
            width={52}
            height={52}
            className="hub-loadout-port-img"
          />
        ) : (
          <PixelAvatar seed={seed} size={52} className="hub-loadout-port-pix" />
        )}
      </div>

      <div className="hub-loadout-id">
        <span className="hub-loadout-k font-pixel">PLAYER</span>
        <span className="hub-loadout-name font-pixel" title={name}>{name}</span>
        {email && <span className="hub-loadout-mail">{email}</span>}
      </div>

      <div className="hub-loadout-cell">
        <span className="hub-loadout-k font-pixel">MEMBERSHIP</span>
        <span className="hub-loadout-v font-pixel" style={{ color: GR }}>ACTIVE</span>
      </div>

      <div className="hub-loadout-cell">
        <span className="hub-loadout-k font-pixel">ACCESS</span>
        <span className="hub-loadout-v font-pixel" style={{ color: YL }}>{accessLevel}</span>
      </div>

      <div className="hub-loadout-cell">
        <span className="hub-loadout-k font-pixel">SINCE</span>
        <span className="hub-loadout-v hub-loadout-v--thick font-pixel" style={{ color: CY }}>{fmtDate(since)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PLAYER CONTROLS — the arcade control panel
   ═══════════════════════════════════════════════════════════ */

function PlayerControls({ openEdit, openAccessCode, doLogout }) {
  return (
    <div className="hub-ctl">
      <button type="button" onClick={openEdit} className="hub-ctl-row" style={{ "--hub-a": PK }}>
        <span className="hub-ctl-ic" aria-hidden="true">
          <PixelIcon rows={[
            ".####.",
            "#....#",
            "#.#..#",
            ".#..#.",
            "..##..",
            "#....#",
          ]} color={PK} size={26} />
        </span>
        <span className="hub-ctl-txt">
          <span className="hub-ctl-label font-pixel">EDIT PROFILE</span>
          <span className="hub-ctl-desc">Update your player identity</span>
        </span>
        <span className="hub-ctl-cue font-pixel">SELECT</span>
        <span className="hub-ctl-arrow font-pixel" aria-hidden="true">→</span>
      </button>

      <button type="button" onClick={openAccessCode} className="hub-ctl-row" style={{ "--hub-a": CY }}>
        <span className="hub-ctl-ic" aria-hidden="true">
          <PixelIcon rows={[
            "..####..",
            ".#....#.",
            ".#.##.#.",
            ".#.##.#.",
            ".#....#.",
            "..####..",
          ]} color={CY} size={26} />
        </span>
        <span className="hub-ctl-txt">
          <span className="hub-ctl-label font-pixel">CHANGE ACCESS CODE</span>
          <span className="hub-ctl-desc">Manage account security</span>
        </span>
        <span className="hub-ctl-cue font-pixel">SELECT</span>
        <span className="hub-ctl-arrow font-pixel" aria-hidden="true">→</span>
      </button>

      <button type="button" onClick={doLogout} className="hub-ctl-row hub-ctl-row--exit" style={{ "--hub-a": CR }}>
        <span className="hub-ctl-ic" aria-hidden="true">
          <PixelIcon rows={[
            "........",
            "...##...",
            "...#....",
            ".#####..",
            "...#....",
            "...##...",
            "........",
            ".######.",
          ]} color={PK} size={26} />
        </span>
        <span className="hub-ctl-txt">
          <span className="hub-ctl-label font-pixel">EXIT HUB — LOG OUT</span>
          <span className="hub-ctl-desc">Power down and leave the arcade</span>
        </span>
        <span className="hub-ctl-cue font-pixel">EXIT</span>
        <span className="hub-ctl-arrow font-pixel" aria-hidden="true">↗</span>
      </button>
    </div>
  );
}