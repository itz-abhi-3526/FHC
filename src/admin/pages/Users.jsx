import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  columnExists,
  fetchUsers,
  humanizeAdminError,
  setUserRole,
  toggleUserActive,
  trackActivity,
  updateUserProfile,
} from "../lib/adminDb";
import { COLUMN_BUILDERS, runExport } from "../lib/exports";
import { fmtDate, fmtDateTime, roleLabel, timeAgo } from "../lib/format";
import { useAdminData, useSelection, selectedRows } from "../lib/useAdminData";
import { useRealtimeUsers } from "../lib/realtime";
import { toastError, toastSuccess } from "../lib/toast";
import {
  Avatar,
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
  SectionHeader,
  Select,
  SortTh,
  Textarea,
  BulkBar,
} from "../components/ui";

const ROLE_OPTIONS = [
  { value: "ALL", label: "ALL ROLES" },
  { value: "admin", label: "ADMIN" },
  { value: "media", label: "MEDIA" },
  { value: "member", label: "USER" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "ALL STATUSES" },
  { value: "active", label: "ACTIVE" },
  { value: "inactive", label: "INACTIVE" },
];

export default function AdminUsers() {
  const fetchFn = useCallback(
    (opts) =>
      fetchUsers({
        ...opts,
        search: opts.search ?? "",
        role: opts.role ?? "ALL",
        status: opts.status ?? "ALL",
        from: opts.from ?? "",
        to: opts.to ?? "",
      }),
    []
  );

  const table = useAdminData(fetchFn, { initialFilters: { sortBy: "created_at", sortDir: "desc" }, pageSize: 20 });
  const { data, count, loading, error, filters } = table;
  const sel = useSelection(data, (r) => r.id);

  useRealtimeUsers(() => table.load());

  const [editing, setEditing] = useState(null); // full row being edited
  const [form, setForm] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [togTarget, setTogTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [lastSave, setLastSave] = useState(null);
  const [focusedId, setFocusedId] = useState(null);

  const [searchParams] = useSearchParams();

  /* LIVE-COLUMN PROBES — UI only shows what the database actually has.
     Columns like username / bio / is_active arrive with the reconcile
     migration; until then they are hidden (no empty columns, no fake
     toggles, no silent no-op filters). */
  const [cols, setCols] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const [email, username, avatar_seed, bio, is_active, last_login_at] = await Promise.all([
        columnExists("profiles", "email"),
        columnExists("profiles", "username"),
        columnExists("profiles", "avatar_seed"),
        columnExists("profiles", "bio"),
        columnExists("profiles", "is_active"),
        columnExists("profiles", "last_login_at"),
      ]);
      if (alive) setCols({ email, username, avatar_seed, bio, is_active, last_login_at });
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = searchParams.get("focus");
    if (!id) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`row-${id}`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      setFocusedId(id);
      const t2 = setTimeout(() => setFocusedId(null), 2400);
      return () => clearTimeout(t2);
    }, 400);
    return () => clearTimeout(t);
  }, [searchParams, loading]);

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      full_name: row.full_name || "",
      username: row.username || "",
      email: row.email || "",
      avatar_url: row.avatar_url || "",
      avatar_seed: row.avatar_seed || row.id || "",
      bio: row.bio || "",
    });
    setSaveErr("");
  };

  const saveEdit = async () => {
    setBusy(true);
    setSaveErr("");
    const patch = { full_name: form.full_name.trim() };
    if (cols?.username) patch.username = form.username.trim();
    if (cols?.avatar_url === undefined || true) patch.avatar_url = form.avatar_url.trim() || null;
    if (cols?.avatar_seed) patch.avatar_seed = form.avatar_seed.trim() || null;
    if (cols?.bio) patch.bio = form.bio || null;
    const { error } = await updateUserProfile(editing.id, patch);
    setBusy(false);
    if (error) {
      setSaveErr(String(error.message || "UPDATE FAILED"));
      toastError(String(error.message || "UPDATE FAILED"), "SAVE REJECTED");
      return;
    }
    setLastSave(`PROFILE UPDATED — ${form.full_name.toUpperCase()}`);
    toastSuccess(`${form.full_name.toUpperCase()} PROFILE UPDATED`);
    setEditing(null);
    table.load();
  };

  const applyRole = async (target, next) => {
    setBusy(true);
    const { error } = await setUserRole(target.id, next);
    setBusy(false);
    setRoleTarget(null);
    if (error) {
      const msg = `ROLE CHANGE REJECTED — ${humanizeAdminError(error)}`;
      setLastSave(msg);
      toastError(humanizeAdminError(error), "ROLE CHANGE REJECTED");
      table.load();
      return;
    }
    const msg = `ROLE CHANGED — ${target.full_name || target.email} → ${next.toUpperCase()}`;
    setLastSave(msg);
    toastSuccess(`${(target.full_name || target.email).toUpperCase()} → ${next.toUpperCase()}`);
    table.load();
  };

  const applyToggle = async (target, next) => {
    setBusy(true);
    const { error } = await toggleUserActive(target.id, next);
    setBusy(false);
    setTogTarget(null);
    if (error) {
      const msg = `TOGGLE REJECTED — ${humanizeAdminError(error)}`;
      setLastSave(msg);
      toastError(humanizeAdminError(error), "ACTION REJECTED");
      table.load();
      return;
    }
    const msg = `${target.full_name || target.email} ${next ? "ACTIVATED" : "DEACTIVATED"}`;
    setLastSave(msg);
    toastSuccess(msg);
    table.load();
  };

  const doExport = async (format) => {
    const { data: all } = await fetchUsers({
      ...filters,
      search: filters.search ?? "",
      role: filters.role ?? "ALL",
      status: filters.status ?? "ALL",
      from: filters.from ?? "",
      to: filters.to ?? "",
      sortBy: table.sortBy,
      sortDir: table.sortDir,
      page: 1,
      pageSize: 5000,
    });
    const filterDesc = ["ALL"];
    if (filters.role && filters.role !== "ALL") filterDesc.push(`ROLE: ${filters.role}`);
    if (filters.status && filters.status !== "ALL") filterDesc.push(`STATUS: ${filters.status}`);
    if (filters.search) filterDesc.push(`SEARCH: ${filters.search}`);
    runExport(format, {
      filename: `fhc-users-${new Date().toISOString().slice(0, 10)}`,
      title: "FHC // USERS REPORT",
      generated: fmtDateTime(new Date().toISOString()),
      filters: filterDesc,
      columns: COLUMN_BUILDERS.user,
      rows: all || [],
    });
  };

  const bulkToggle = async () => {
    const rows = selectedRows(data, sel.selected);
    let ok = 0;
    let firstErr = null;
    for (const r of rows) {
      const { error } = await toggleUserActive(r.id, false);
      if (error) firstErr = firstErr || error;
      else ok++;
    }
    if (ok) {
      await trackActivity("BULK_USER_DEACTIVATE", "profiles", null, { count: ok });
      setLastSave(`DEACTIVATED ${ok} USER${ok === 1 ? "" : "S"}`);
      toastSuccess(`DEACTIVATED ${ok} USER${ok === 1 ? "" : "S"}`);
    }
    if (firstErr) {
      const msg = `PARTIAL FAILURE — ${ok}/${rows.length} DEACTIVATED — ${humanizeAdminError(firstErr)}`;
      setLastSave(msg);
      toastError(humanizeAdminError(firstErr), "BULK ACTION INCOMPLETE");
    }
    sel.clear();
    table.load();
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.role && filters.role !== "ALL" ? 1 : 0) +
    (filters.status && filters.status !== "ALL" ? 1 : 0) +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0);

  return (
    <>
      <PageHeader
        kicker="// DATA NODE // USERS DIRECTORY"
        title="USERS"
        sub="EVERY REGISTERED ACCOUNT. ROLES MUTATE THROUGH THE SECURE admin_set_user_role RPC ONLY."
      >
        <ExportBar onExport={doExport} disabled={count === 0} />
      </PageHeader>

      <Panel>
        <div className="ad-toolbar">
          <DebouncedSearch value={filters.search || ""} onChange={(v) => table.updateFilters({ search: v })} placeholder="SEARCH NAME / EMAIL / USERNAME..." />
          <Select
            value={filters.role || "ALL"}
            onChange={(e) => table.updateFilters({ role: e.target.value })}
            options={ROLE_OPTIONS}
            aria-label="Filter by role"
          />
          {cols?.is_active && (
            <Select
              value={filters.status || "ALL"}
              onChange={(e) => table.updateFilters({ status: e.target.value })}
              options={STATUS_OPTIONS}
              aria-label="Filter by status"
            />
          )}
          <Input type="date" value={filters.from || ""} onChange={(e) => table.updateFilters({ from: e.target.value })} title="JOINED FROM" aria-label="Joined from" />
          <Input type="date" value={filters.to || ""} onChange={(e) => table.updateFilters({ to: e.target.value })} title="JOINED UNTIL" aria-label="Joined until" />
          <ClearFilters count={activeFilterCount} onClear={table.clearFilters} />
        </div>

        <RangeBar from={table.from} to={table.to} total={count} pageSize={table.pageSize} onPageSize={table.setPageSize} />

        <BulkBar count={sel.selected.size} onDelete={bulkToggle} deleteLabel="DEACTIVATE" onExport={() => doExport("csv")} />

        {loading && <LoadingState label="READING USERS" />}
        {!loading && error && <ErrorState sub={String(error?.message || "").toUpperCase()} onRetry={table.retry} />}
        {!loading && !error && data.length === 0 && (
          <EmptyState
            title="NO USERS FOUND"
            sub={
              activeFilterCount > 0
                ? "NO RECORDS MATCH YOUR CURRENT FILTERS — CLEAR THEM TO SEE ALL USERS."
                : "ADJUST THE FILTERS OR ADD A USER THROUGH THE PUBLIC SIGNUP."
            }
            icon="☰"
          />
        )}
        {!loading && !error && data.length > 0 && (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th className="ad-check-col" aria-label="Select all">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && data.every((r) => sel.selected.has(r.id))}
                      onChange={sel.toggleAll}
                      aria-label="Select all rows"
                    />
                  </th>
                  <SortTh label="FULL NAME" sortKey="full_name" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="ROLE" sortKey="role" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  {cols?.username && <SortTh label="USERNAME" sortKey="username" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />}
                  {cols?.is_active && <SortTh label="STATUS" sortKey="is_active" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />}
                  <SortTh label="MEMBER SINCE" sortKey="created_at" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <th className="ad-th-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr
                    key={r.id}
                    id={`row-${r.id}`}
                    className={`${sel.selected.has(r.id) ? "is-selected" : ""} ${focusedId === r.id ? "ad-target-row" : ""}`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={sel.selected.has(r.id)}
                        onChange={() => sel.toggle(r.id)}
                        aria-label={`Select ${r.full_name || r.email}`}
                      />
                    </td>
                    <td>
                      <div className="ad-cell-user">
                        <Avatar seed={r.avatar_seed || r.id} url={r.avatar_url} size={32} />
                        <div style={{ minWidth: 0 }}>
                          <div className="ad-track" style={{ color: "var(--ad-cream)", fontSize: 12 }}>{r.full_name || r.id.slice(0, 8)}</div>
                          {cols?.email && <div className="ad-track ad-muted" style={{ fontSize: 10 }}>{r.email || "NO EMAIL"}</div>}
                        </div>
                      </div>
                    </td>
                    <td><Badge meta={{ token: roleLabel(r.role), cls: r.role === "admin" ? "ad-badge--pink" : r.role === "media" ? "ad-badge--yellow" : "ad-badge--cyan" }} /></td>
                    {cols?.username && <td className="ad-track ad-muted">{r.username || "—"}</td>}
                    {cols?.is_active && <td><Badge meta={r.is_active ? { token: "ACTIVE", cls: "ad-badge--green" } : { token: "INACTIVE", cls: "ad-badge--muted" }} /></td>}
                    <td className="ad-track ad-muted">{fmtDate(r.created_at)}</td>
                    <td>
                      <div className="ad-row ad-gap-s">
                        <Btn sm variant="cyan" onClick={() => openEdit(r)}>EDIT</Btn>
                        {cols?.is_active && (
                          <Btn sm variant={r.is_active ? "danger" : "green"} onClick={() => setTogTarget({ target: r, next: !r.is_active })}>
                            {r.is_active ? "OFF" : "ON"}
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="ad-table-foot">
          <RangeBar from={table.from} to={table.to} total={count} />
          <Pager page={table.page} pages={table.pages} onPage={table.setPage} total={count} />
        </div>
      </Panel>

      {lastSave && (
        <div className="ad-lastsave ad-track" role="status">{lastSave}</div>
      )}

      {editing && form && (
        <Drawer
          title="EDIT USER"
          kicker="USERS // PROFILE EDIT"
          onClose={() => setEditing(null)}
          footer={
            <div style={{ width: "100%" }}>
              {saveErr && <div className="ad-form-error ad-track">{saveErr}</div>}
              <div className="ad-row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <Btn variant="ghost" onClick={() => setEditing(null)}>CANCEL</Btn>
                <Btn variant="cyan" onClick={saveEdit} disabled={busy}>{busy ? "SAVING..." : "SAVE CHANGES"}</Btn>
              </div>
            </div>
          }
        >
          <div className="ad-drawer-avatar">
            <Avatar seed={form.avatar_seed || editing.id} url={form.avatar_url || ""} size={72} />
            {cols?.email && <div className="ad-track ad-muted" style={{ fontSize: 10, marginTop: 6 }}>{editing.email}</div>}
          </div>
          <Field label="FULL NAME">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          {cols?.username && (
            <Field label="USERNAME">
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
          )}
          {cols?.email && (
            <Field label="EMAIL">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled />
            </Field>
          )}
          {cols?.avatar_seed && (
            <Field label="AVATAR SEED" hint="SEED CONTROLS THE AUTO-GENERATED AVATAR COLORS">
              <Input value={form.avatar_seed} onChange={(e) => setForm({ ...form, avatar_seed: e.target.value })} />
            </Field>
          )}
          <Field label="AVATAR URL" hint="PASTE A CLOUDINARY / EXTERNAL IMAGE URL TO OVERRIDE THE SEED AVATAR">
            <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
          </Field>
          {cols?.bio && (
            <Field label="BIO">
              <Textarea rows={4} value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </Field>
          )}

          <SectionHeader tag="ROLE" title="SECURE ROLE" />
          <div className="ad-row" style={{ gap: 8, marginTop: 10 }}>
            <Btn sm variant={editing.role === "member" ? "cyan" : "ghost"} onClick={() => setRoleTarget({ target: editing, next: "member" })} disabled={editing.role === "member"}>
              USER
            </Btn>
            <Btn sm variant={editing.role === "media" ? "cyan" : "ghost"} onClick={() => setRoleTarget({ target: editing, next: "media" })} disabled={editing.role === "media"}>
              MEDIA
            </Btn>
            <Btn sm variant={editing.role === "admin" ? "pink" : "ghost"} onClick={() => setRoleTarget({ target: editing, next: "admin" })} disabled={editing.role === "admin"}>
              ADMIN
            </Btn>
          </div>
          <div className="ad-track ad-field-hint" style={{ marginTop: 8 }}>
            MEDIA = GALLERY EDITOR ONLY — CAN CREATE/EDIT ALBUMS AND UPLOAD PHOTOS, BUT NOTHING ELSE IN THE CONTROL PLANE.
          </div>
          <div className="ad-track ad-field-hint" style={{ marginTop: 8 }}>
            AUTHORIZED VIA auth.users METADATA (user_metadata + app_metadata) — PRIVILEGE CHANGES ARE INSTANT AND LOGGED TO THE AUDIT TRAIL.
          </div>
          <div className="ad-drawer-meta ad-track">
            <div>MEMBER SINCE <b>{fmtDateTime(editing.created_at)}</b></div>
            <div>LAST UPDATE <b>{fmtDateTime(editing.updated_at)}</b></div>
            {cols?.last_login_at && editing.last_login_at && <div>LAST LOGIN <b>{timeAgo(editing.last_login_at)}</b></div>}
          </div>
        </Drawer>
      )}

      {roleTarget && (
        <ConfirmModal
          open
          title={`${roleTarget.next === "admin" ? "PROMOTE" : roleTarget.next === "media" ? "ASSIGN MEDIA" : "DEMOTE"} USER`}
          prose={`CHANGE ${(roleTarget.target.full_name || roleTarget.target.email).toUpperCase()} TO ${roleTarget.next.toUpperCase()}?`}
          confirmLabel={roleTarget.next === "admin" ? "PROMOTE TO ADMIN" : roleTarget.next === "media" ? "ASSIGN MEDIA" : "DEMOTE TO USER"}
          danger={roleTarget.next === "member" || roleTarget.next === "admin"}
          busy={busy}
          onConfirm={() => applyRole(roleTarget.target, roleTarget.next)}
          onCancel={() => setRoleTarget(null)}
        />
      )}

      {togTarget && (
        <ConfirmModal
          open
          title={togTarget.next ? "ACTIVATE USER" : "DEACTIVATE USER"}
          prose={`${togTarget.next ? "RESTORE" : "DISABLE"} ACCESS FOR ${(togTarget.target.full_name || togTarget.target.email).toUpperCase()}? THE USER WILL ${togTarget.next ? "GAIN" : "LOSE"} ACCESS TO THE HORIZON DASHBOARD.`}
          confirmLabel={togTarget.next ? "ACTIVATE" : "DEACTIVATE"}
          danger={!togTarget.next}
          busy={busy}
          onConfirm={() => applyToggle(togTarget.target, togTarget.next)}
          onCancel={() => setTogTarget(null)}
        />
      )}
    </>
  );
}