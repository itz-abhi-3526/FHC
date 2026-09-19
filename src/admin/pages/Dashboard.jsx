import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchApplicationStatusCounts,
  fetchDashboardStats,
} from "../lib/adminDb";
import { useRealtimeTableGroup } from "../lib/realtime";
import { CORE_TABLES } from "../lib/schema";
import { fmtDateTime } from "../lib/format";
import {
  Btn,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
} from "../components/ui";

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — DASHBOARD (overview)
   Every number is a REAL head-query against the LIVE tables
   (profiles / fhc_join_applications / team_members / gallery_folders /
   gallery_images) executed over the admin's own anon session. No
   auth.users peek, no fabricated counters, no dead tables — the exact
   same source the detail pages use.
   ════════════════════════════════════════════════════════════════════ */

const STAT_CARDS = [
  { key: "total_users", label: "REGISTERED USERS", accent: "pink", glyph: "☰", to: "/admin/users" },
  { key: "active_members", label: "ACTIVE MEMBERS", accent: "cyan", glyph: "◉", to: "/admin/users" },
  { key: "admins", label: "ADMINS", accent: "yellow", glyph: "⚑", to: "/admin/users" },
  { key: "media", label: "MEDIA TEAM", accent: "yellow", glyph: "▦", to: "/admin/users" },
  { key: "pending_applications", label: "PENDING APPLICATIONS", accent: "green", glyph: "▤", to: "/admin/applications" },
  { key: "team_members_active", label: "ACTIVE TEAM MEMBERS", accent: "pink", glyph: "☺", to: "/admin/team" },
  { key: "gallery_folders", label: "GALLERY FOLDERS", accent: "cyan", glyph: "▦", to: "/admin/gallery" },
  { key: "gallery_images", label: "GALLERY IMAGES", accent: "green", glyph: "◫", to: "/admin/gallery" },
];

const FLOW_ITEMS = [
  { key: "applied", token: "PENDING", cls: "ad-badge--cyan" },
  { key: "under_review", token: "UNDER REVIEW", cls: "ad-badge--yellow" },
  { key: "selected", token: "APPROVED", cls: "ad-badge--green" },
  { key: "rejected", token: "REJECTED", cls: "ad-badge--red" },
];

function Stat({ card, value }) {
  return (
    <Link to={card.to} className={`ad-stat ad-stat--${card.accent}`} title={`OPEN ${card.label}`}>
      <div className="ad-stat-head">
        <span className="ad-stat-glyph" aria-hidden="true">{card.glyph}</span>
        <span className="ad-stat-label ad-pixel">{card.label}</span>
      </div>
      <div className="ad-stat-value ad-pixel">{value == null ? "—" : value.toLocaleString()}</div>
      <div className="ad-stat-trend">LIVE TABLE COUNT</div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [statsErr, setStatsErr] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [flow, setFlow] = useState({ applied: 0, under_review: 0, selected: 0, rejected: 0 });
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setStatsLoading(true);
    setStatsErr(null);
    const { data, error } = await fetchDashboardStats();
    if (error) {
      setStatsErr(error);
    } else {
      setStats(data);
      setLastSync(new Date().toISOString());
    }
    if (!silent) setStatsLoading(false);
  }, []);

  const loadFlow = useCallback(async () => {
    const counts = await fetchApplicationStatusCounts();
    if (counts) setFlow(counts);
  }, []);

  useEffect(() => {
    loadStats();
    loadFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Live refresh: ANY change to a stat-affecting table re-pulls the real
     counts. One subscription per table, all released on unmount. */
  const refreshLive = useCallback(() => {
    loadStats(true);
    loadFlow();
  }, [loadStats, loadFlow]);

  useRealtimeTableGroup(CORE_TABLES, refreshLive);

  const flowTotal = Object.values(flow).reduce((a, b) => a + (b || 0), 0);

  return (
    <>
      <PageHeader
        kicker="// CONTROL CENTER // OVERVIEW"
        title="DASHBOARD"
        sub="REAL COUNTS FROM THE LIVE TABLES. NO MOCK DATA, NO DEAD DATA NODES."
      >
        <Btn variant="cyan" sm onClick={() => loadStats()}>
          ⟳ REFRESH
        </Btn>
      </PageHeader>

      <div className="ad-status-strip ad-track" role="status" aria-live="polite">
        <span className="ad-track">
          SOURCE:{" "}
          <b style={{ color: "var(--ad-cyan)" }}>LIVE TABLES</b>
          {" "}(profiles / fhc_join_applications / team_members / gallery_folders / gallery_images)
        </span>
        <span className="ad-track">
          LAST UPDATE: <b style={{ color: "var(--ad-cyan)" }}>{fmtDateTime(lastSync)}</b>
        </span>
      </div>

      {statsLoading && !statsErr && <LoadingState label="READING DATA NODE" />}
      {!statsLoading && statsErr && (
        <ErrorState
          title="DATABASE ERROR"
          sub={String(statsErr.message || "THE REQUEST COULD NOT BE COMPLETED").toUpperCase()}
          onRetry={loadStats}
        />
      )}

      {stats && (
        <div className="ad-stat-grid">
          {STAT_CARDS.map((c) => (
            <Stat key={c.key} card={c} value={stats[c.key] ?? null} />
          ))}
        </div>
      )}

      {stats && (
        <Panel title="APPLICATION FLOW" tag="LIVE STATUSES" bodyStyle={{ paddingTop: 8 }}>
          <div className="ad-flow">
            {FLOW_ITEMS.map((f) => {
              const val = flow[f.key] ?? 0;
              const pct = flowTotal ? Math.round((val / flowTotal) * 100) : 0;
              const color = f.cls.replace("ad-badge--", "");
              return (
                <div key={f.key} className="ad-flow-row ad-track">
                  <span className={`ad-badge ${f.cls}`}>{f.token}</span>
                  <div className="ad-grow">
                    <div className="ad-flow-track">
                      <div className={`ad-flow-fill ad-flow-fill--${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="ad-flow-val ad-pixel">{val}</span>
                </div>
              );
            })}
          </div>
          <div className="ad-timeline-note ad-track">
            PIPELINE TOTAL:{" "}
            <b style={{ color: "var(--ad-cream)" }}>{flowTotal}</b>
            {" "}— NEW APPLICATIONS (APPLIED) PUSH THIS LIVE
          </div>
        </Panel>
      )}
    </>
  );
}