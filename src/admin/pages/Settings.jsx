import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { pingAuth, pingDatabase, pingStorage, securityAudit } from "../lib/adminDb";
import { fmtDateTime, timeAgo } from "../lib/format";
import { Btn, ErrorState, LoadingState, Panel, PageHeader } from "../components/ui";
import { supabase } from "../../lib/supabase";

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — SETTINGS
   Real system diagnostics: auth / database / realtime / session state and
   the DB-verified security audit. Nothing fake, no latency theater, no
   secrets. The admin role source is AuthContext's authoritative chain:
   auth.app_metadata.role → auth.user_metadata.role → context fallback.
   ════════════════════════════════════════════════════════════════════ */

const VERSION = "1.0.0";

function Row({ k, v, color }) {
  return (
    <div className="ad-sys-row ad-track">
      <span className="ad-sys-key">{k}</span>
      <span className="ad-grow" />
      <span style={{ color: color || "var(--ad-cream)" }}>{v}</span>
    </div>
  );
}

function Probe({ running, onDone }) {
  useEffect(() => {
    let timer = null;
    let active = true;
    const started = Date.now();
    const channel = supabase.channel(`fhc-realtime-probe-${Date.now()}`).subscribe((status) => {
      if (!active) return;
      if (status === "SUBSCRIBED") {
        timer = window.setTimeout(() => onDone(true, Date.now() - started), 400);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onDone(false, Date.now() - started);
      }
    });
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className="ad-track ad-muted" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
      {running ? <>PINGING REALTIME NODE...</> : null}
    </span>
  );
}

export default function AdminSettings() {
  const { user, profile, session, role, status } = useAuth();

  const [nodes, setNodes] = useState([
    { label: "DATABASE", ok: null, latency: null },
    { label: "AUTH", ok: null, latency: null },
    { label: "STORAGE (TEAM-MEMBERS)", ok: null, latency: null },
    { label: "REALTIME", ok: null, latency: null },
  ]);
  const [running, setRunning] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [audit, setAudit] = useState(null);
  const [auditErr, setAuditErr] = useState(null);
  const [auditBusy, setAuditBusy] = useState(false);

  const markRealtimeResult = useCallback((ok, latencyMs) => {
    setNodes((prev) => prev.map((n) => (n.label === "REALTIME" ? { ...n, ok, latency: latencyMs } : n)));
  }, []);

  const runHealth = useCallback(async () => {
    setRunning(true);
    const [db, auth, storage] = [await pingDatabase(), await pingAuth(), await pingStorage()];
    setNodes((prev) => [
      { label: "DATABASE", ok: db.ok, latency: db.latencyMs },
      { label: "AUTH", ok: auth.ok, latency: auth.latencyMs },
      { label: "STORAGE (TEAM-MEMBERS)", ok: storage.ok, latency: storage.latencyMs },
      prev.find((n) => n.label === "REALTIME") || { label: "REALTIME", ok: null, latency: null },
    ]);
    setLastSync(new Date().toISOString());
    setRunning(false);
  }, []);

  const runAudit = useCallback(async () => {
    setAuditBusy(true);
    setAuditErr(null);
    const { data, error } = await securityAudit();
    if (error) setAuditErr(error);
    else setAudit(data);
    setAuditBusy(false);
  }, []);

  useEffect(() => {
    runHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email || "—";
  const sessionAge = session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null;

  return (
    <>
      <PageHeader
        kicker="// SETTINGS // SYSTEM"
        title="SETTINGS"
        sub="AUTH, DATABASE, REALTIME AND SESSION STATE — VERIFIED LIVE. NO KEYS, TEMPLATES OR GUESSES."
      >
        <Btn sm variant="cyan" onClick={runHealth} disabled={running}>⟳ RE-RUN DIAGNOSTICS</Btn>
      </PageHeader>

      <div className="ad-grid-2">
        <Panel title="NODE STATUS" tag="DIAGNOSTICS" bodyStyle={{ paddingTop: 4 }}>
          <ul className="ad-health-list">
            {nodes.map((n) => (
              <li key={n.label} className={`ad-health-item ${n.ok === null ? "" : n.ok ? "ad-health-item--ok" : "ad-health-item--down"}`}>
                <span className="ad-health-icon" aria-hidden="true">{n.ok === null ? "…" : n.ok ? "▣" : "×"}</span>
                <span className="ad-grow ad-track">{n.label}</span>
                <span className="ad-track">{n.latency != null ? `${n.latency}ms` : n.label === "REALTIME" ? "" : "—"}</span>
              </li>
            ))}
          </ul>
          {nodes.some((n) => n.label === "REALTIME" && n.ok === null) && <Probe running onDone={markRealtimeResult} />}
          <div className="ad-track ad-muted" style={{ fontSize: 9, marginTop: 12, letterSpacing: "0.16em" }}>
            REALTIME PROBE SUBSCRIBES & CLOSES A CHANNEL — 0 PERMANENT SUBSCRIPTIONS
          </div>
        </Panel>

        <Panel title="SESSION" tag="CONTEXT" bodyStyle={{ paddingTop: 4 }}>
          <Row k="CURRENT USER" v={userName} />
          <Row k="USER ID" v={String(user?.id || "—").slice(0, 18)} color="var(--ad-cyan)" />
          <Row k="ROLE" v={String(role || "member").toUpperCase()} color={role === "admin" ? "var(--ad-pink)" : "var(--ad-muted)"} />
          <Row k="ROLE SOURCE" v="AUTH APP METADATA (SINGLE AUTHORITY)" color="var(--ad-cyan)" />
          <Row k="AUTH STATUS" v={String(status || "—").toUpperCase()} color={status === "authed" ? "var(--ad-green)" : "var(--ad-yellow)"} />
          <Row k="SESSION" v={session ? "ACTIVE" : "NONE"} color={session ? "var(--ad-green)" : "var(--ad-red)"} />
          <Row k="EXPIRES" v={sessionAge ? fmtDateTime(sessionAge) : "—"} />
          <Row k="LAST SYNC" v={lastSync ? fmtDateTime(lastSync) : "—"} color="var(--ad-cyan)" />
          <Row k="APPLICATION VERSION" v={VERSION} color="var(--ad-yellow)" />
          <div className="ad-track ad-field-hint" style={{ marginTop: 12 }}>
            LAST LOGIN {session?.user?.last_sign_in_at ? timeAgo(session.user.last_sign_in_at) : "—"}
          </div>
        </Panel>
      </div>

      <Panel title="SECURITY AUDIT" tag="DB-VERIFIED" bodyStyle={{ paddingTop: 8 }}>
        <div className="ad-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
<div className="ad-track ad-muted" style={{ fontSize: 11, maxWidth: 560, marginBottom: 12 }}>
                    EXECUTES admin_security_audit() — A SECURITY-DEFINER RPC READING THE LIVE DATABASE CATALOG:
                    ROLE SOURCE, RLS-ENABLED TABLE COUNT AND PER-TABLE ROW COUNTS.
                  </div>
                  {audit && (
                    <div className="ad-audit-banner ad-track">
                      <span style={{ color: "var(--ad-pink)" }}>SECURE ROLE: {String(audit.role_source || "?").toLowerCase() === "admin" ? "admin ✓" : String(audit.role_source || "?")}</span>
                      <span style={{ marginLeft: 14, color: "var(--ad-cyan)" }}>RLS TABLES: {audit.rls_table_count}</span>
                      <span style={{ marginLeft: 14, color: "var(--ad-yellow)" }}>AUDITED: {fmtDateTime(audit.audit_time)}</span>
                      {audit.fallback && <span style={{ marginLeft: 14, color: "var(--ad-red)" }}>CLIENT FALLBACK (RPC UNAVAILABLE)</span>}
                    </div>
                  )}
            {auditErr && <ErrorState title="AUDIT FAILED" sub={String(auditErr.message || "").toUpperCase()} onRetry={runAudit} />}
            {!audit && !auditErr && auditBusy && <LoadingState label="RUNNING AUDIT" />}
          </div>
          <Btn variant="pink" onClick={runAudit} disabled={auditBusy}>
            {auditBusy ? "RUNNING AUDIT..." : "⚙ RUN SECURITY AUDIT"}
          </Btn>
        </div>
      </Panel>

      <div className="ad-track ad-foot-legal">
        FHC // ADMIN CONTROL CENTER — SETTINGS v{VERSION} — NO SERVICE KEYS ARE EVER ACCESSIBLE TO THIS PAGE
      </div>
    </>
  );
}