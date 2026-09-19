import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PixelAvatar from "../components/PixelAvatar";
import { supabase } from "../lib/supabase";
import {
  isCloudinaryConfigured,
  isValidAvatarFile,
  uploadAvatarToCloudinary,
} from "../lib/cloudinary";
import { classifyProfileError, PROFILE_ERROR, updateProfileFields } from "../lib/profileService";

const PK = "#FF007F";
const CY = "#00E5FF";
const CR = "#FFF4D6";
const GR = "#4CFF4C";
const YL = "#FFD400";

function fmtDate(iso) {
  if (!iso) return "-- --- ----";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-- --- ----";
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return "-- --- ----"; }
}

/* ═══════════════════════════════════════════════════════════
   SMALL ATOMICS
   ═══════════════════════════════════════════════════════════ */

function Led({ color = GR, size = 5, blink = false }) {
  return (
    <span
      aria-hidden="true"
      className={blink ? "dsh-blink" : ""}
      style={{ width: size, height: size, background: color, boxShadow: `0 0 6px ${color}88`, display: "inline-block", flexShrink: 0 }}
    />
  );
}

function CornerBrackets({ color = CY, inset = -1 }) {
  const s = { position: "absolute", width: 12, height: 12, pointerEvents: "none", opacity: 0.7 };
  return (
    <>
      <span aria-hidden="true" style={{ ...s, top: inset, left: inset, borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...s, top: inset, right: inset, borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...s, bottom: inset, left: inset, borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...s, bottom: inset, right: inset, borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
    </>
  );
}

function SectionLabel({ tag, title, accent = CY }) {
  return (
    <div className="dsh-mod-head">
      <span className="font-pixel text-[7px] tracking-[0.2em]" style={{ color: accent }}>
        <span style={{ color: PK, marginRight: 4 }}>▌</span>{tag}
      </span>
      <span className="font-pixel text-[6px] text-cream/25 tracking-[0.15em]">{title}</span>
    </div>
  );
}

function Panel({ id, tag, title, accent = CY, wide = false, children }) {
  return (
    <motion.div
      id={id}
      className={`dsh-mod ${wide ? "dsh-mod--wide" : ""}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderColor: `${accent}28`, scrollMarginTop: 120 }}
      whileHover={{ borderColor: `${accent}50` }}
    >
      <CornerBrackets color={accent} />
      <SectionLabel tag={tag} title={title} accent={accent} />
      <div className="dsh-mod-body">{children}</div>
      <div className="dsh-mod-foot" aria-hidden="true" />
    </motion.div>
  );
}

function SecRow({ label, value, accent = CY }) {
  return (
    <div className="dsh-sec-row">
      <span className="font-pixel text-[6px] tracking-[0.2em]" style={{ color: CR, opacity: 0.45 }}>{label}</span>
      <span className="dsh-sec-leader" aria-hidden="true" />
      <span className="font-pixel text-[7px] tracking-[0.14em]" style={{ color: accent }}>{value || "—"}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD — minimal member terminal
   ═══════════════════════════════════════════════════════════ */

const ACCESS_LINKS = [
  { label: "EVENTS", to: "/coming-soon", desc: "CLUB OPERATIONS SCHEDULE" },
  { label: "PROJECTS", to: "/coming-soon", desc: "HACKATHONS & DIVISION BUILDS" },
  { label: "GALLERY", to: "/gallery", desc: "MEMORY ARCHIVE" },
  { label: "ABOUT", to: "/about", desc: "HORIZON CORE RECORD" },
];

export default function Dashboard() {
  const { user, profile, status, refreshProfile, signOut, supabase, isMedia } = useAuth();
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
      <div className="dsh-loader">
        <div className="dsh-loader-inner">
          <div className="dsh-loader-bar" />
          <div className="font-pixel text-[8px] tracking-[0.3em] mt-4" style={{ color: CY }}>
            <span className="dsh-blink">█</span> ESTABLISHING SECURE CONNECTION...
          </div>
          <div className="font-pixel text-[6px] tracking-[0.2em] mt-2" style={{ color: CR, opacity: 0.4 }}>
            VERIFYING PLAYER CREDENTIALS
          </div>
        </div>
      </div>
    );
  }

  /* ── data extraction (real profile fields only) ── */
  const name = profile?.full_name || user?.user_metadata?.full_name || "PLAYER";
  const email = profile?.email || user?.email || "";
  const seed = profile?.avatar_seed || user?.id || email || "fhc";
  /* MEMBER SINCE: prefer profiles.created_at; fall back to the Supabase Auth
     user's real created_at. No extra query, no fake/hardcoded date. */
  const since = profile?.created_at || user?.created_at;
  const avatarUrl = profile?.avatar_url || "";

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
      /* Real cause must never be hidden — always in the console. */
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

    /* busy → always released in finally below; the button/file input are
       only disabled while a real upload/update is running. */
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
      /* Do not trust it blindly — confirm what came back. */
      console.log("[FHC Avatar] Supabase update successful →", data);
      if (!data || data.avatar_url !== secureUrl) {
        console.error("[FHC Avatar] Supabase returned unexpected avatar_url", data);
        throw new Error("Supabase update confirmed but returned wrong avatar_url");
      }

      /* refresh profile/context state so dashboard AND navbar update now */
      await refreshProfile(user.id);
      setAvatarVersion((v) => v + 1); // display-only cache-buster
      console.log("[FHC Avatar] local avatar state updated (version", avatarVersion + 1, ")");
      setAvatarMsg({ kind: "ok", text: "AVATAR UPLOADED ✓" });
    } catch (err) {
      /* previous avatar stays — avatar_url is never cleared on failure */
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

  /* MEDIA-only entry point: media users manage albums/uploads from the
     public MEDIA CONSOLE (/media). Normal members see nothing; admins
     keep their existing /admin/gallery workflow. */
  const accessLinks = isMedia
    ? [
        ...ACCESS_LINKS,
        { label: "MEDIA CONSOLE", to: "/media", desc: "MANAGE ALBUMS + UPLOAD EVENT MEDIA" },
      ]
    : ACCESS_LINKS;

  return (
    <div className="dsh-root">
      {/* ── ambient layers ── */}
      <div className="dsh-bg-grid" aria-hidden="true" />
      <div className="dsh-bg-glow dsh-bg-glow--pink" aria-hidden="true" />
      <div className="dsh-bg-glow dsh-bg-glow--cyan" aria-hidden="true" />
      <div className="dsh-bg-scanlines" aria-hidden="true" />
      <div className="dsh-bg-noise" aria-hidden="true" />
      <div className="dsh-bg-vignette" aria-hidden="true" />
      <div className="dsh-bg-sweep" aria-hidden="true" />

      {/* ── logout overlay ── */}
      <AnimatePresence>
        {loggingOut && (
          <motion.div className="dsh-logout-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="dsh-logout-box">
              <CornerBrackets color={PK} inset={-4} />
              <motion.div className="font-pixel text-[9px] tracking-[0.2em] text-center" style={{ color: CR }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                <div style={{ color: PK }}>DISCONNECTING PLAYER...</div>
                <div className="mt-3" style={{ color: CY }}>SESSION TERMINATED</div>
                <div className="mt-3 text-[7px]" style={{ color: CR, opacity: 0.5 }}>RETURNING TO HORIZON NETWORK</div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dsh-inner">

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — MEMBER IDENTITY
            ═══════════════════════════════════════════════════════ */}
        <motion.section
          className="dsh-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <CornerBrackets color={PK} inset={-2} />
          <div className="dsh-hero-scan" aria-hidden="true" />

          <div className="dsh-hero-inner">
            <div className="dsh-hero-avatar-col">
              <div className="dsh-hero-avatar-frame">
                <CornerBrackets color={CY} inset={-3} />
                <div className="dsh-hero-avatar-glow" aria-hidden="true" />
                {avatarUrl ? (
                  <img
                    /* display-only cache-buster — stored avatar_url stays clean */
                    src={avatarVersion ? `${avatarUrl}?v=${avatarVersion}` : avatarUrl}
                    alt={`${name} profile avatar`}
                    width={120}
                    height={120}
                    className="dsh-hero-avatar dsh-hero-avatar-img"
                  />
                ) : (
                  <PixelAvatar seed={seed} size={120} className="dsh-hero-avatar" />
                )}
                <div className="dsh-hero-avatar-scan" aria-hidden="true" />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarBusy}
                  className="dsh-avatar-change font-pixel"
                  aria-label="Change avatar"
                >
                  {avatarBusy ? "UPLOADING..." : "[ CHANGE AVATAR ]"}
                </button>
                {avatarMsg && (
                  <div
                    className="dsh-avatar-msg font-pixel"
                    role="status"
                    style={{ color: avatarMsg.kind === "ok" ? GR : PK }}
                  >
                    {avatarMsg.text}
                  </div>
                )}
              </div>
            </div>

            <div className="dsh-hero-info">
              <div className="dsh-hero-breadcrumb font-pixel">
                <span style={{ color: PK }}>FHC</span>
                <span style={{ color: CY, opacity: 0.4, margin: "0 6px" }}>//</span>
                <span style={{ color: CR, opacity: 0.5 }}>MEMBER TERMINAL</span>
              </div>

              <h1 className="dsh-hero-name font-pixel">
                {name}
              </h1>

              <div className="dsh-hero-email font-mono">
                {email}
              </div>

              <div className="dsh-hero-divider" aria-hidden="true" />

              <div className="dsh-hero-meta">
                <div className="dsh-hero-meta-row">
                  <Led color={GR} blink size={5} />
                  <span className="font-pixel text-[6px] tracking-[0.2em]" style={{ color: GR }}>PLAYER ONLINE</span>
                </div>
                <div className="dsh-hero-meta-row">
                  <Led color={YL} size={5} />
                  <span className="font-pixel text-[6px] tracking-[0.2em]" style={{ color: YL }}>
                    MEMBER SINCE {fmtDate(since)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — QUICK ACCESS + ACCOUNT
            ═══════════════════════════════════════════════════════ */}
        <div className="dsh-grid">

          <Panel tag="QUICK ACCESS" title="NAVIGATE" accent={YL} wide>
            <div className="dsh-sectors">
              {accessLinks.map((l) => (
                <Link key={l.label} to={l.to} className="dsh-sector group" aria-label={`${l.label} — enter`}>
                  <CornerBrackets color={YL} inset={0} />
                  <div className="dsh-sector-inner">
                    <div className="dsh-sector-label font-pixel">{l.label}</div>
                    <div className="dsh-sector-desc font-pixel">{l.desc}</div>
                    <div className="dsh-sector-foot">
                      <span className="dsh-sector-enter font-pixel" style={{ color: PK }}>
                        ENTER <span className="inline-block transition-transform group-hover:translate-x-1">▶</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel id="account" tag="ACCOUNT" title="CONTROL" accent={GR} wide>
            <div className="dsh-account" style={{ maxWidth: 560 }}>
              {editMode ? (
                <div className="dsh-profile-edit">
                  <div className="dsh-profile-edit-header font-pixel">
                    <span style={{ color: CY }}>▸</span> EDITING PLAYER DATA
                  </div>
                  <label className="dsh-edit-label font-pixel" htmlFor="dsh-name">FULL NAME</label>
                  <input id="dsh-name" className="dsh-edit-input font-mono" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                  <AnimatePresence>
                    {editMsg && (
                      <motion.div role="status" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="dsh-edit-msg font-pixel" style={{ color: editMsg.kind === "ok" ? GR : PK }}>
                        {editMsg.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="dsh-edit-actions">
                    <motion.button type="button" onClick={saveProfile} disabled={editSaving} className="dsh-btn" style={{ color: GR, borderColor: `${GR}55` }} whileHover={{ y: -1 }} whileTap={{ y: 1 }}>
                      {editSaving ? "SYNCING..." : "SAVE CHANGES ✓"}
                    </motion.button>
                    <motion.button type="button" onClick={() => { setEditMode(false); setEditMsg(null); }} className="dsh-btn" style={{ color: CR, opacity: 0.6, borderColor: `${CR}22` }} whileHover={{ y: -1 }} whileTap={{ y: 1 }}>
                      CANCEL
                    </motion.button>
                  </div>
                </div>
              ) : pwMode ? (
                <div className="dsh-pw-form">
                  <label className="dsh-edit-label font-pixel" htmlFor="dsh-pw1">NEW ACCESS CODE</label>
                  <input id="dsh-pw1" type="password" className="dsh-edit-input font-mono" value={pw1} onChange={(e) => setPw1(e.target.value)} />
                  <label className="dsh-edit-label font-pixel" htmlFor="dsh-pw2">CONFIRM NEW CODE</label>
                  <input id="dsh-pw2" type="password" className="dsh-edit-input font-mono" value={pw2} onChange={(e) => setPw2(e.target.value)} />
                  <AnimatePresence>
                    {pwMsg && (
                      <motion.div role="status" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="dsh-edit-msg font-pixel" style={{ color: pwMsg.kind === "ok" ? GR : PK }}>
                        {pwMsg.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="dsh-edit-actions">
                    <motion.button type="button" onClick={savePassword} disabled={pwSaving} className="dsh-btn" style={{ color: GR, borderColor: `${GR}55` }} whileHover={{ y: -1 }} whileTap={{ y: 1 }}>
                      {pwSaving ? "ENCRYPTING..." : "REINITIALIZE ✓"}
                    </motion.button>
                    <motion.button type="button" onClick={() => { setPwMode(false); setPwMsg(null); }} className="dsh-btn" style={{ color: CR, opacity: 0.6, borderColor: `${CR}22` }} whileHover={{ y: -1 }} whileTap={{ y: 1 }}>
                      CANCEL
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="dsh-account-status">
                    <SecRow label="ACCOUNT STATUS" value="ACTIVE" accent={GR} />
                    <SecRow label="MEMBERSHIP" value="ACTIVE" accent={GR} />
                    <SecRow label="ACCESS LEVEL" value="MEMBER" accent={YL} />
                    <SecRow label="MEMBER SINCE" value={fmtDate(since)} accent={CY} />
                  </div>
                  <div className="dsh-account-actions">
                    <motion.button
                      type="button"
                      onClick={() => { setEditName(name); setEditMsg(null); setEditMode(true); }}
                      className="dsh-btn dsh-btn--accent dsh-btn-edit"
                      style={{ color: PK }}
                      whileHover={{ y: -1 }}
                      whileTap={{ y: 1 }}
                    >
                      <span className="dsh-edit-swap-a">[ EDIT PROFILE ]</span>
                      <span className="dsh-edit-swap-b">{">"} ACCESS PROFILE EDITOR</span>
                    </motion.button>
                    <motion.button type="button" onClick={() => setPwMode(true)} className="dsh-btn dsh-btn--full" style={{ color: CY, borderColor: `${CY}44` }} whileHover={{ y: -1 }} whileTap={{ y: 1 }}>
                      [ CHANGE ACCESS CODE ]
                    </motion.button>
                    <motion.button type="button" onClick={doLogout} className="dsh-btn dsh-btn--full dsh-btn--danger" style={{ color: PK, borderColor: `${PK}44` }} whileHover={{ y: -1 }} whileTap={{ y: 1 }}>
                      [ LOG OUT ]
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </Panel>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — CONSOLE FOOTER
            ═══════════════════════════════════════════════════════ */}
        <div className="dsh-footer">
          <span className="dsh-footer-item">
            <Led color={GR} size={4} />
          </span>
          <span className="dsh-footer-item font-pixel" style={{ color: CY, opacity: 0.5 }}>FHC // MEMBER TERMINAL</span>
          <span className="dsh-footer-item font-pixel" style={{ color: PK, opacity: 0.4 }}>INTERNAL NETWORK</span>
        </div>
      </div>
    </div>
  );
}