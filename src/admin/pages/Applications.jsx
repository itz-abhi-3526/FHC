import { useCallback, useMemo, useState } from "react";
import { fetchApplications, humanizeAdminError, setApplicationStatus } from "../lib/adminDb";
import { COLUMN_BUILDERS, runExport } from "../lib/exports";
import { appStatusMeta, fmtDateTime } from "../lib/format";
import { useAdminData, useSelection, selectedRows } from "../lib/useAdminData";
import { useRealtimeApplications } from "../lib/realtime";
import {
  Badge,
  Btn,
  ClearFilters,
  ConfirmModal,
  DebouncedSearch,
  Drawer,
  EmptyState,
  ErrorState,
  ExportBar,
  Field,
  Input,
  LoadingState,
  PageHeader,
  Pager,
  Panel,
  RangeBar,
  Select,
  SortTh,
} from "../components/ui";

const STATUS_OPTIONS = [
  { value: "ALL", label: "ALL STATUSES" },
  { value: "applied", label: "PENDING" },
  { value: "under_review", label: "UNDER REVIEW" },
  { value: "selected", label: "APPROVED" },
  { value: "rejected", label: "REJECTED" },
];

export default function AdminApplications() {
  const fetchFn = useCallback(
    (opts) =>
      fetchApplications({
        ...opts,
        search: opts.search ?? "",
        status: opts.status ?? "ALL",
        domain: opts.domain ?? "",
        yearBranch: opts.yearBranch ?? "",
        from: opts.from ?? "",
        to: opts.to ?? "",
      }),
    []
  );

  const table = useAdminData(fetchFn, { initialFilters: { sortBy: "created_at", sortDir: "desc" }, pageSize: 20 });
  const { data, count, loading, error, filters } = table;

  useRealtimeApplications(() => table.load());

  const [openRow, setOpenRow] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [bulkStatus, setBulkStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const sel = useSelection(data, (r) => r.id);

  const domains = useMemo(() => {
    const s = new Set();
    for (const a of data) if (a.selected_domain) s.add(a.selected_domain);
    return [...s].sort();
  }, [data]);

  const years = useMemo(() => {
    const s = new Set();
    for (const a of data) {
      if (a.year_branch) s.add(String(a.year_branch).split("/")[0].trim());
    }
    return [...s].sort();
  }, [data]);

  const applyStatus = async (row, status) => {
    setBusy(true);
    const { error } = await setApplicationStatus(row.id, status);
    setBusy(false);
    setStatusTarget(null);
    if (openRow?.id === row.id) setOpenRow((r) => (r ? { ...r, status } : r));
    if (error) {
      setNotice(`STATUS UPDATE REJECTED — ${humanizeAdminError(error)}`);
    } else {
      setNotice(`STATUS UPDATED → ${appStatusMeta(status).token}`);
    }
    table.load();
  };

  const bulkApplyStatus = async () => {
    const rows = selectedRows(data, sel.selected);
    setBusy(true);
    let ok = 0;
    for (const r of rows) {
      const { error } = await setApplicationStatus(r.id, bulkStatus);
      if (!error) ok++;
    }
    setBusy(false);
    sel.clear();
    setBulkStatus("");
    setNotice(
      ok === rows.length
        ? `BULK UPDATE COMPLETE — ${ok} APPLICATION${ok === 1 ? "" : "S"} → ${appStatusMeta(bulkStatus).token}`
        : `BULK UPDATE PARTIAL — ${ok}/${rows.length} UPDATED (REMAINING REJECTED BY RLS)`
    );
    table.load();
  };

  const doExport = async (format) => {
    const { data: all } = await fetchApplications({
      ...filters,
      search: filters.search ?? "",
      status: filters.status ?? "ALL",
      domain: filters.domain ?? "",
      yearBranch: filters.yearBranch ?? "",
      from: filters.from ?? "",
      to: filters.to ?? "",
      sortBy: table.sortBy,
      sortDir: table.sortDir,
      page: 1,
      pageSize: 5000,
    });
    const filterDesc = ["ALL"];
    if (filters.status && filters.status !== "ALL") filterDesc.push(`STATUS: ${filters.status}`);
    if (filters.domain) filterDesc.push(`DOMAIN: ${filters.domain}`);
    if (filters.search) filterDesc.push(`SEARCH: ${filters.search}`);
    runExport(format, {
      filename: `fhc-applications-${new Date().toISOString().slice(0, 10)}`,
      title: "FHC // JOIN APPLICATIONS REPORT",
      generated: fmtDateTime(new Date().toISOString()),
      filters: filterDesc,
      columns: COLUMN_BUILDERS.application,
      rows: all || [],
    });
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.status && filters.status !== "ALL" ? 1 : 0) +
    (filters.domain ? 1 : 0) +
    (filters.yearBranch ? 1 : 0) +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0);

  return (
    <>
      <PageHeader
        kicker="// DATA NODE // JOIN APPLICATIONS"
        title="APPLICATIONS"
        sub="FHC JOIN REQUESTS. STATUS WORKFLOW: PENDING → UNDER REVIEW → APPROVED / REJECTED."
      >
        <ExportBar onExport={doExport} disabled={count === 0} />
      </PageHeader>

      {notice && (
        <div className="ad-lastsave ad-track" role="status">{notice}</div>
      )}

      <Panel>
        <div className="ad-toolbar">
          <DebouncedSearch value={filters.search || ""} onChange={(v) => table.updateFilters({ search: v })} placeholder="SEARCH NAME / EMAIL / REGISTER NUMBER..." />
          <Select
            value={filters.status || "ALL"}
            onChange={(e) => table.updateFilters({ status: e.target.value })}
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
          />
          <Select
            value={filters.domain || ""}
            onChange={(e) => table.updateFilters({ domain: e.target.value })}
            options={[{ value: "", label: "ALL DOMAINS" }, ...domains.map((d) => ({ value: d, label: d }))]}
            aria-label="Filter by domain"
          />
          <Select
            value={filters.yearBranch || ""}
            onChange={(e) => table.updateFilters({ yearBranch: e.target.value })}
            options={[{ value: "", label: "ALL YEARS" }, ...years.map((y) => ({ value: y, label: y }))]}
            aria-label="Filter by year"
          />
          <Input type="date" value={filters.from || ""} onChange={(e) => table.updateFilters({ from: e.target.value })} aria-label="Submitted from" />
          <Input type="date" value={filters.to || ""} onChange={(e) => table.updateFilters({ to: e.target.value })} aria-label="Submitted until" />
          <ClearFilters count={activeFilterCount} onClear={table.clearFilters} />
        </div>

        <RangeBar from={table.from} to={table.to} total={count} pageSize={table.pageSize} onPageSize={table.setPageSize} />

        {sel.selected.size > 0 && (
          <div className="ad-bulkrow">
            <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} options={[{ value: "", label: "BULK STATUS..." }, ...STATUS_OPTIONS.slice(1)]} aria-label="Bulk status" />
            <Btn sm variant="cyan" disabled={!bulkStatus || busy} onClick={bulkApplyStatus}>
              {busy ? "APPLYING..." : `SET ${sel.selected.size} APPLICATION${sel.selected.size === 1 ? "" : "S"}`}
            </Btn>
          </div>
        )}

        {loading && <LoadingState label="READING APPLICATIONS" />}
        {!loading && error && <ErrorState sub={String(error?.message || "").toUpperCase()} onRetry={table.retry} />}
        {!loading && !error && data.length === 0 && (
          <EmptyState
            title="NO APPLICATIONS FOUND"
            sub={
              activeFilterCount > 0
                ? "NO RECORDS MATCH YOUR CURRENT FILTERS — CLEAR THEM TO SEE ALL APPLICATIONS."
                : "NEW JOIN REQUESTS FROM THE PUBLIC JOIN PAGE WILL APPEAR HERE IN REAL TIME."
            }
            icon="▤"
          />
        )}
        {!loading && !error && data.length > 0 && (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th style={{ width: 34 }}>
                    <input
                      type="checkbox"
                      checked={data.length > 0 && data.every((r) => sel.selected.has(r.id))}
                      onChange={sel.toggleAll}
                      aria-label="Select all applications"
                    />
                  </th>
                  <SortTh label="FULL NAME / EMAIL" sortKey="full_name" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="REGISTER NUMBER" sortKey="register_number" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="YEAR & BRANCH" sortKey="year_branch" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="DOMAIN" sortKey="selected_domain" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="STATUS" sortKey="status" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="SUBMITTED" sortKey="created_at" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <th className="ad-th-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => {
                  const meta = appStatusMeta(r.status);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setOpenRow(r)}
                      style={{ cursor: "pointer" }}
                      className={sel.selected.has(r.id) ? "is-selected" : ""}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={sel.selected.has(r.id)}
                          onChange={() => sel.toggle(r.id)}
                          aria-label={`Select ${r.full_name}`}
                        />
                      </td>
                      <td>
                        <div className="ad-cell-user">
                          <div style={{ minWidth: 0 }}>
                            <div className="ad-track" style={{ color: "var(--ad-cream)", fontSize: 12 }}>{r.full_name}</div>
                            <div className="ad-track ad-muted" style={{ fontSize: 10 }}>{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="ad-track ad-muted">{r.register_number || "—"}</td>
                      <td className="ad-track ad-muted">{r.year_branch || "—"}</td>
                      <td><Badge meta={{ token: (r.selected_domain || "—").toUpperCase(), cls: "ad-badge--cyan" }} /></td>
                      <td><Badge meta={meta} /></td>
                      <td className="ad-track ad-muted">{fmtDateTime(r.created_at)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="ad-row ad-gap-s">
                          <Btn sm variant="ghost" onClick={() => setOpenRow(r)}>VIEW</Btn>
                          {r.status !== "rejected" && r.status !== "selected" && (
                            <Btn sm variant="green" onClick={() => setStatusTarget({ row: r, status: "selected" })}>
                              APPROVE
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="ad-table-foot">
          <RangeBar from={table.from} to={table.to} total={count} />
          <Pager page={table.page} pages={table.pages} onPage={table.setPage} total={count} />
        </div>
      </Panel>

      {openRow && (
        <Drawer
          title="APPLICATION REVIEW"
          kicker={`${openRow.register_number || "APPLICATION"} // ${appStatusMeta(openRow.status).token}`}
          onClose={() => setOpenRow(null)}
          footer={
            <div style={{ width: "100%" }}>
              <div className="ad-track ad-field-hint" style={{ marginBottom: 10 }}>
                MOVE THIS APPLICATION THROUGH THE REVIEW PIPELINE.
              </div>
              <div className="ad-row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <Btn sm variant="ghost" onClick={() => setStatusTarget({ row: openRow, status: "applied" })} disabled={openRow.status === "applied"}>↩ PENDING</Btn>
                <Btn sm variant="cyan" onClick={() => setStatusTarget({ row: openRow, status: "under_review" })} disabled={openRow.status === "under_review"}>▌ UNDER REVIEW</Btn>
                <Btn sm variant="green" onClick={() => setStatusTarget({ row: openRow, status: "selected" })} disabled={openRow.status === "selected"}>✓ APPROVED</Btn>
                <Btn sm variant="danger" onClick={() => setStatusTarget({ row: openRow, status: "rejected" })} disabled={openRow.status === "rejected"}>✕ REJECTED</Btn>
              </div>
            </div>
          }
        >
          <div className="ad-drawer-avatar">
            <div className="ad-track" style={{ fontSize: 16, color: "var(--ad-cream)" }}>{openRow.full_name}</div>
            <div className="ad-track ad-muted" style={{ fontSize: 11 }}>{openRow.email} · {openRow.phone || "NO PHONE"}</div>
          </div>
          <div className="ad-kv">
            {openRow.register_number && <div><span>REGISTER NUMBER</span><b>{openRow.register_number}</b></div>}
            {openRow.year_branch && <div><span>YEAR & BRANCH</span><b>{openRow.year_branch}</b></div>}
            {openRow.selected_domain && <div><span>DOMAIN</span><b>{openRow.selected_domain}</b></div>}
            <div><span>SUBMITTED</span><b>{fmtDateTime(openRow.created_at)}</b></div>
            {openRow.about_you && (
              <div style={{ gridColumn: "1 / -1" }}>
                <span>WHY DO YOU WANT TO JOIN?</span>
                <p className="ad-kv-text">{openRow.about_you}</p>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {statusTarget && (
        <ConfirmModal
          open
          title={`SET STATUS → ${statusTarget.status.toUpperCase()}`}
          prose={`UPDATE THE APPLICATION FOR ${statusTarget.row.full_name.toUpperCase()} TO ${statusTarget.status.toUpperCase().replace("_", " ")}?`}
          confirmLabel="APPLY STATUS"
          danger={statusTarget.status === "rejected"}
          busy={busy}
          onConfirm={() => applyStatus(statusTarget.row, statusTarget.status)}
          onCancel={() => setStatusTarget(null)}
        />
      )}
    </>
  );
}