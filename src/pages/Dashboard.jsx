import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PixelAvatar from "../components/PixelAvatar";

const PK = "#FF007F";
const CY = "#00E5FF";
const CR = "#FFF4D6";
const GR = "#4CFF4C";
const YL = "#FFD400";
const INK = "#05070D";

function fmtDate(iso) {
  if (!iso) return "-- --- ----";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-- --- ----";
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return "-- --- ----"; }
}

function fmtTime(iso) {
  if (!iso) return "--:--:--";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "--:--:--";
    return d.toISOString().slice(11,19);
  } catch { return "--:--:--"; }
}

function fmtShort(iso) {
  if (!iso) return null;
  return `${fmtDate(iso)} ${fmtTime(iso)}`;
}

/* ═══════════════════════════════════════════════════════════
   SMALL ATOMICS
   ═══════════════════════════════════════════════════════════ */

function Led({ color = GR, size = 5, blink = false }) {
  return (
    <span
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

function DataField({ label, value, accent = CY, mono = true }) {
  return (
    <div className="dsh-field">
      <span className="dsh-field-label font-pixel">{label}</span>
      <span className={`${mono ? "font-mono" : "font-pixel"} dsh-field-value`} style={{ color: accent }}>
        {value || "—"}
      </span>
    </div>
  );
}

function StatBlock({ label, value, accent = CY, icon }) {
  return (
    <motion.div
      className="dsh-stat"
      whileHover={{ borderColor: `${accent}60`, boxShadow: `0 0 20px ${accent}18` }}
      transition={{ duration: 0.2 }}
    >
      <div className="dsh-stat-icon" style={{ color: accent }}>{icon || "◆"}</div>
      <div className="dsh-stat-value font-pixel" style={{ color: accent }}>{value}</div>
      <div className="dsh-stat-label font-pixel">{label}</div>
    </motion.div>
  );
}

function SectorCard({ tag, label, to, accent = YL }) {
  return (
    <Link to={to} className="dsh-sector group">
      <CornerBrackets color={accent} inset={0} />
      <div className="dsh-sector-inner">
        <div className="dsh-sector-tag font-pixel" style={{ color: accent }}>{tag}</div>
        <div className="dsh-sector-label font-pixel">{label}</div>
        <div className="dsh-sector-enter font-pixel" style={{ color: PK }}>
          ENTER <span className="inline-block transition-transform group-hover:translate-x-1">▶</span>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACTIVITY TIMELINE
   ═══════════════════════════════════════════════════════════ */

function ActivityTimeline({ since, lastLogin, updated }) {
  const events = [];
  if (since) events.push({ label: "ACCOUNT CREATED", ts: since, color: GR });
  if (lastLogin) events.push({ label: "LAST LOGIN", ts: lastLogin, color: CY });
  if (updated && updated !== since) events.push({ label: "PROFILE UPDATED", ts: updated, color: YL });
  events.push({ label: "SESSION ACTIVE", ts: null, color: GR });

  return (
    <div className="dsh-timeline">
      {events.map((ev, i) => (
        <div key={`${ev.label}-${i}`} className="dsh-timeline-item">
          <div className="dsh-timeline-dot" style={{ background: ev.color, boxShadow: `0 0 8px ${ev.color}66` }} />
          <div className="dsh-timeline-line" aria-hidden="true" />
          <div className="dsh-timeline-content">
            <div className="dsh-timeline-label font-pixel" style={{ color: ev.color }}>{ev.label}</div>
            {ev.ts ? (
              <div className="dsh-timeline-ts font-mono">{fmtDate(ev.ts)} · {fmtTime(ev.ts)}</div>
            ) : (
              <div className="dsh-timeline-ts font-mono" style={{ color: GR, opacity: 0.6 }}>NOW</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SYSTEM STATUS HUD
   ═══════════════════════════════════════════════════════════ */

function SystemStatus() {
  const items = [
    { label: "FHC NETWORK", value: "ONLINE", color: GR },
    { label: "AUTH", value: "SECURE", color: CY },
    { label: "DATABASE", value: "CONNECTED", color: GR },
    { label: "SESSION", value: "ACTIVE", color: CY },
  ];
  return (
    <div className="dsh-sysstatus">
      {items.map((it) => (
        <div key={it.label} className="dsh-sysstatus-item">
          <Led color={it.color} blink={it.label === "SESSION"} />
          <span className="font-pixel text-[5px] tracking-[0.2em] text-cream/30">{it.label}</span>
          <span className="font-pixel text-[6px] tracking-[0.14em] ml-auto" style={{ color: it.color }}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════ */

const ACCESS_LINKS = [
  { label: "EVENTS", to: "/coming-soon", tag: "SECTOR_01" },
  { label: "PROJECTS", to: "/coming-soon", tag: "SECTOR_02" },
  { label: "GALLERY", to: "/gallery", tag: "SECTOR_03" },
  { label: "ABOUT", to: "/about", tag: "CORE" },
];

export default function Dashboard() {
  const { user, profile, status, refreshProfile, signOut, supabase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUser, setEditUser] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

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

  /* ── data extraction ── */
  const name = profile?.full_name || user?.user_metadata?.full_name || "PLAYER";
  const email = profile?.email || user?.email || "";
  const username = profile?.username || user?.email || "";
  const seed = profile?.avatar_seed || user?.id || email || "fhc";
  const since = profile?.created_at;
  const lastLogin = profile?.last_login_at;
  const updated = profile?.updated_at;
  const shortId = user?.id ? user.id.slice(0, 8).toUpperCase() : "--------";
  const displayName = name.split(" ")[0] || "PLAYER";

  /* ── handlers (unchanged logic) ── */
  const saveProfile = async () => {
    setEditSaving(true);
    setEditMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editName.trim() || name, username: editUser.trim() || username })
      .eq("id", user.id);
    setEditSaving(false);
    if (error) {
      setEditMsg({ kind: "error", text: "[!] PROFILE UPDATE FAILED" });
    } else {
      setEditMsg({ kind: "ok", text: "✓ PROFILE SYNCHRONIZED" });
      setEditMode(false);
      refreshProfile();
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

  return (
    <div className="dsh-root">
      {/* ── ambient layers ── */}
      <div className="dsh-bg-grid" aria-hidden="true" />
      <div className="dsh-bg-glow dsh-bg-glow--pink" aria-hidden="true" />
      <div className="dsh-bg-glow dsh-bg-glow--cyan" aria-hidden="true" />
      <div className="dsh-bg-scanlines" aria-hidden="true" />

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
            SECTION 1 — PLAYER TERMINAL HERO
            ═══════════════════════════════════════════════════════ */}
        <motion.section
          className="dsh-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <CornerBrackets color={PK} inset={-2} />

          {/* hero scanline */}
          <div className="dsh-hero-scan" aria-hidden="true" />

          <div className="dsh-hero-inner">
            {/* ── avatar column ── */}
            <div className="dsh-hero-avatar-col">
              <div className="dsh-hero-avatar-frame">
                <CornerBrackets color={CY} inset={-3} />
                <div className="dsh-hero-avatar-glow" aria-hidden="true" />
                <PixelAvatar seed={seed} size={120} className="dsh-hero-avatar" />
                <div className="dsh-hero-avatar-scan" aria-hidden="true" />
              </div>
              <div className="dsh-hero-avatar-id font-pixel">
                <span style={{ color: CY, opacity: 0.6 }}>ID://</span>
                <span style={{ color: CR, opacity: 0.8 }}>{shortId}</span>
              </div>
              <div className="dsh-hero-avatar-badge">
                <Led color={GR} blink size={4} />
                <span className="font-pixel text-[5px] tracking-[0.2em]" style={{ color: GR }}>IDENTITY VERIFIED</span>
              </div>
            </div>

            {/* ── info column ── */}
            <div className="dsh-hero-info">
              <div className="dsh-hero-breadcrumb font-pixel">
                <span style={{ color: PK }}>FHC</span>
                <span style={{ color: CY, opacity: 0.4, margin: "0 6px" }}>//</span>
                <span style={{ color: CR, opacity: 0.5 }}>PLAYER TERMINAL</span>
              </div>

              <h1 className="dsh-hero-name font-pixel">
                {displayName}
              </h1>

              <div className="dsh-hero-username font-mono">
                @{username.startsWith("@") ? username.slice(1) : username}
              </div>

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
                  <Led color={CY} size={5} />
                  <span className="font-pixel text-[6px] tracking-[0.2em]" style={{ color: CY }}>ACCOUNT ACTIVE</span>
                </div>
                <div className="dsh-hero-meta-row">
                  <Led color={YL} size={5} />
                  <span className="font-pixel text-[6px] tracking-[0.2em]" style={{ color: YL }}>
                    MEMBER SINCE {fmtDate(since)}
                  </span>
                </div>
              </div>

              <div className="dsh-hero-access">
                <span className="font-pixel text-[6px] tracking-[0.2em]" style={{ color: CR, opacity: 0.4 }}>ACCESS LEVEL</span>
                <span className="font-pixel text-[8px] tracking-[0.16em]" style={{ color: YL, textShadow: `0 0 12px ${YL}44` }}>MEMBER</span>
              </div>
            </div>

            {/* ── status column ── */}
            <div className="dsh-hero-status">
              <div className="dsh-hero-status-item">
                <span className="font-pixel text-[5px] tracking-[0.2em] text-cream/30">SYS STATUS</span>
                <span className="font-pixel text-[7px]" style={{ color: GR }}>ONLINE</span>
              </div>
              <div className="dsh-hero-status-item">
                <span className="font-pixel text-[5px] tracking-[0.2em] text-cream/30">NETWORK</span>
                <span className="font-pixel text-[7px]" style={{ color: CY }}>STABLE</span>
              </div>
              <div className="dsh-hero-status-item">
                <span className="font-pixel text-[5px] tracking-[0.2em] text-cream/30">TERMINAL</span>
                <span className="font-pixel text-[7px]" style={{ color: PK }}>FHC-01</span>
              </div>
              <div className="dsh-hero-status-item">
                <span className="font-pixel text-[5px] tracking-[0.2em] text-cream/30">UPTIME</span>
                <span className="font-mono text-[10px]" style={{ color: CR, opacity: 0.7 }}>ACTIVE</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — PLAYER STATS STRIP
            ═══════════════════════════════════════════════════════ */}
        <motion.div
          className="dsh-stats"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <StatBlock label="EVENTS" value="00" accent={PK} icon="◈" />
          <StatBlock label="PROJECTS" value="00" accent={CY} icon="⬡" />
          <StatBlock label="ACHIEVEMENTS" value="00" accent={YL} icon="★" />
          <StatBlock label="GALLERY" value="00" accent={GR} icon="▣" />
          <StatBlock label="MEMBERSHIP" value="ACTIVE" accent={CY} icon="●" />
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — MAIN GRID
            ═══════════════════════════════════════════════════════ */}
        <div className="dsh-grid">

          {/* ── PLAYER PROFILE (wide) ── */}
          <Panel id="profile" tag="PLAYER PROFILE" title="MODULE_01" accent={PK} wide>
            <div className="dsh-profile">
              <div className="dsh-profile-head">
                <div className="dsh-profile-avatar-wrap">
                  <PixelAvatar seed={seed} size={64} className="dsh-profile-avatar" />
                  <div className="dsh-profile-avatar-ring" aria-hidden="true" />
                </div>
                <div className="dsh-profile-identity">
                  <div className="font-mono text-[16px]" style={{ color: CR }}>{name}</div>
                  <div className="font-mono text-[13px]" style={{ color: CY, opacity: 0.8 }}>@{username.startsWith("@") ? username.slice(1) : username}</div>
                  <div className="font-pixel text-[5px] tracking-[0.2em] mt-1" style={{ color: GR, opacity: 0.7 }}>
                    <Led color={GR} size={4} /> IDENTITY VERIFIED
                  </div>
                </div>
              </div>

              {editMode ? (
                <div className="dsh-profile-edit">
                  <div className="dsh-profile-edit-header font-pixel">
                    <span style={{ color: CY }}>▸</span> EDITING PLAYER DATA
                  </div>
                  <label className="dsh-edit-label font-pixel">FULL NAME</label>
                  <input className="dsh-edit-input font-mono" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                  <label className="dsh-edit-label font-pixel">USERNAME</label>
                  <input className="dsh-edit-input font-mono" value={editUser} onChange={(e) => setEditUser(e.target.value)} />
                  <AnimatePresence>
                    {editMsg && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="dsh-edit-msg font-pixel" style={{ color: editMsg.kind === "ok" ? GR : PK }}>
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
              ) : (
                <div className="dsh-profile-readonly">
                  <DataField label="FULL NAME" value={name} accent={CR} mono={false} />
                  <DataField label="EMAIL" value={email} accent={CY} />
                  <DataField label="USERNAME" value={`@${username.startsWith("@") ? username.slice(1) : username}`} accent={CY} />
                  <DataField label="MEMBER SINCE" value={fmtShort(since)} accent={CR} />
                  <motion.button
                    type="button"
                    onClick={() => { setEditName(name); setEditUser(username.startsWith("@") ? username.slice(1) : username); setEditMsg(null); setEditMode(true); }}
                    className="dsh-btn dsh-btn--accent"
                    style={{ color: PK }}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 1 }}
                  >
                    [ EDIT PROFILE ]
                  </motion.button>
                </div>
              )}
            </div>
          </Panel>

          {/* ── ACTIVITY TIMELINE ── */}
          <Panel tag="ACTIVITY STREAM" title="MODULE_02" accent={CY}>
            <ActivityTimeline since={since} lastLogin={lastLogin} updated={updated} />
          </Panel>

          {/* ── FHC ACCESS (wide) ── */}
          <Panel tag="FHC ACCESS" title="NAVIGATE" accent={YL} wide>
            <div className="dsh-sectors">
              {ACCESS_LINKS.map((l) => (
                <SectorCard key={l.label} tag={l.tag} label={l.label} to={l.to} accent={YL} />
              ))}
            </div>
          </Panel>

          {/* ── ACCOUNT CONTROL ── */}
          <Panel id="account" tag="ACCOUNT CONTROL" title="MODULE_03" accent={GR}>
            <div className="dsh-account">
              <div className="dsh-account-status">
                <div className="dsh-account-status-row">
                  <Led color={GR} blink size={5} />
                  <span className="font-pixel text-[6px] tracking-[0.2em]" style={{ color: GR }}>ACCOUNT STATUS</span>
                  <span className="font-pixel text-[7px] ml-auto" style={{ color: GR }}>ACTIVE</span>
                </div>
                <div className="dsh-account-status-row">
                  <Led color={CY} size={5} />
                  <span className="font-pixel text-[6px] tracking-[0.2em]" style={{ color: CY }}>AUTHENTICATION</span>
                  <span className="font-pixel text-[7px] ml-auto" style={{ color: CY }}>SUPABASE // SECURE</span>
                </div>
              </div>

              {pwMode ? (
                <div className="dsh-pw-form">
                  <label className="dsh-edit-label font-pixel">NEW ACCESS CODE</label>
                  <input type="password" className="dsh-edit-input font-mono" value={pw1} onChange={(e) => setPw1(e.target.value)} />
                  <label className="dsh-edit-label font-pixel">CONFIRM NEW CODE</label>
                  <input type="password" className="dsh-edit-input font-mono" value={pw2} onChange={(e) => setPw2(e.target.value)} />
                  <AnimatePresence>
                    {pwMsg && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="dsh-edit-msg font-pixel" style={{ color: pwMsg.kind === "ok" ? GR : PK }}>
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
                <div className="dsh-account-actions">
                  <motion.button type="button" onClick={() => setPwMode(true)} className="dsh-btn dsh-btn--full" style={{ color: CY, borderColor: `${CY}44` }} whileHover={{ y: -1 }} whileTap={{ y: 1 }}>
                    [ CHANGE ACCESS CODE ]
                  </motion.button>
                  <motion.button type="button" onClick={doLogout} className="dsh-btn dsh-btn--full dsh-btn--danger" style={{ color: PK, borderColor: `${PK}44` }} whileHover={{ y: -1 }} whileTap={{ y: 1 }}>
                    [ LOG OUT ]
                  </motion.button>
                </div>
              )}
            </div>
          </Panel>

          {/* ── SYSTEM STATUS ── */}
          <Panel tag="SYSTEM STATUS" title="HUD" accent={CY}>
            <SystemStatus />
          </Panel>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 4 — CONSOLE FOOTER
            ═══════════════════════════════════════════════════════ */}
        <div className="dsh-footer">
          <span className="dsh-footer-item">
            <Led color={GR} size={4} /> <span style={{ color: GR }}>●</span>
          </span>
          <span className="dsh-footer-item font-pixel" style={{ color: CY, opacity: 0.5 }}>FHC // PLAYER TERMINAL</span>
          <span className="dsh-footer-item font-pixel" style={{ color: PK, opacity: 0.4 }}>AUTHENTICATED SESSION</span>
          <span className="dsh-footer-item font-pixel" style={{ color: CR, opacity: 0.25 }}>v2.6</span>
          <span className="dsh-footer-item font-pixel" style={{ color: CR, opacity: 0.2 }}>NODE_{shortId}</span>
        </div>
      </div>
    </div>
  );
}
