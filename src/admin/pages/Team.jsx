import { useCallback, useState } from "react";
import { addTeamMember, deleteTeamMember, fetchTeam, fetchTeamNextOrder, humanizeAdminError, updateTeamMember } from "../lib/adminDb";
import { humanizeUploadError, uploadAdminImage } from "../lib/upload";
import { TEAM_ORDER, normalizeTeam, formatTeamName } from "../../lib/teamMembers";
import { COLUMN_BUILDERS, runExport } from "../lib/exports";
import { boolStatus, fmtDate, fmtDateTime } from "../lib/format";
import { useAdminData, useSelection, selectedRows } from "../lib/useAdminData";
import { useRealtimeTeamMembers } from "../lib/realtime";
import { toastError, toastSuccess } from "../lib/toast";
import {
  Avatar,
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
  Textarea,
} from "../components/ui";

const EMPTY_FORM = {
  name: "",
  designation: "",
  team: "TECH TEAM",
  photo_url: "",
  bio: "",
  linkedin_url: "",
  github_url: "",
  instagram_url: "",
  display_order: 0,
  is_active: true,
};

const TEAM_OPTIONS = TEAM_ORDER.map((t) => ({ value: t, label: t }));
TEAM_OPTIONS.push({ value: "OTHER", label: "OTHER / UNCLASSIFIED" });

export default function AdminTeam() {
  const fetchFn = useCallback(
    (opts) =>
      fetchTeam({
        ...opts,
        search: opts.search ?? "",
        team: opts.team ?? "ALL",
        active: opts.active ?? "ALL",
      }),
    []
  );

  const table = useAdminData(fetchFn, { initialFilters: { sortBy: "display_order", sortDir: "asc" }, pageSize: 20 });
  const { data, count, loading, error, filters } = table;
  const sel = useSelection(data, (r) => r.id);

  useRealtimeTeamMembers(() => table.load());

  const [editing, setEditing] = useState(null); // row | "new"
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const openNew = async () => {
    const { value } = await fetchTeamNextOrder();
    setEditing("new");
    setForm({ ...EMPTY_FORM, display_order: value });
    setSaveErr("");
    setUploadErr("");
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      designation: row.designation || "",
      team: normalizeTeam(row.team),
      photo_url: row.photo_url || "",
      bio: row.bio || "",
      linkedin_url: row.linkedin_url || "",
      github_url: row.github_url || "",
      instagram_url: row.instagram_url || "",
      display_order: Number(row.display_order) || 0,
      is_active: row.is_active !== false,
    });
    setSaveErr("");
    setUploadErr("");
  };

  const pickImage = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadErr("");
    try {
      const url = await uploadAdminImage(file, "fhc/team");
      setForm((f) => ({ ...f, photo_url: url }));
    } catch (err) {
      setUploadErr(humanizeUploadError(err));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      setSaveErr("NAME IS REQUIRED");
      return;
    }
    setBusy(true);
    setSaveErr("");
    const payload = {
      ...form,
      name: form.name.trim(),
      designation: form.designation.trim(),
      team: form.team.trim(),
      photo_url: form.photo_url.trim() || null,
      bio: form.bio.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      github_url: form.github_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      display_order: Number(form.display_order) || 0,
      is_active: form.is_active !== false,
    };
    const { error } = editing === "new" ? await addTeamMember(payload) : await updateTeamMember(editing.id, payload);
    setBusy(false);
    if (error) {
      const op = editing === "new" ? "INSERT" : "UPDATE";
      const detail = String(error.message || "RECORD NOT RETURNED").toUpperCase();
      setSaveErr(`${op} FAILED — ${detail}`);
      toastError(humanizeAdminError(error), `TEAM MEMBER ${op} REJECTED`);
      return;
    }
    toastSuccess(`${payload.name.toUpperCase()} — ${editing === "new" ? "ADDED" : "UPDATED"} ON TEAM`);
    setEditing(null);
    table.load();
  };

  const doDelete = async () => {
    setBusy(true);
    const { error } = await deleteTeamMember(deleting.id, deleting.name);
    setBusy(false);
    if (error) {
      toastError(humanizeAdminError(error), "TEAM MEMBER DELETE REJECTED");
      table.load();
      return;
    }
    toastSuccess(`${(deleting.name || "").toUpperCase()} REMOVED FROM TEAM`);
    setDeleting(null);
    table.load();
  };

  const doExport = async (format) => {
    const { data: all } = await fetchTeam({
      ...filters,
      search: filters.search ?? "",
      team: filters.team ?? "ALL",
      active: filters.active ?? "ALL",
      sortBy: table.sortBy,
      sortDir: table.sortDir,
      page: 1,
      pageSize: 5000,
    });
    const rowsForExport = (all || []).map((r) => ({
      name: r.name,
      designation: r.designation,
      team: r.team,
      display_order: r.display_order,
      is_active: r.is_active ? "ACTIVE" : "INACTIVE",
      created_at: r.created_at,
    }));
    const filterDesc = ["ALL"];
    if (filters.team && filters.team !== "ALL") filterDesc.push(`TEAM: ${filters.team}`);
    runExport(format, {
      filename: `fhc-team-${new Date().toISOString().slice(0, 10)}`,
      title: "FHC // TEAM ROSTER REPORT",
      generated: fmtDateTime(new Date().toISOString()),
      filters: filterDesc,
      columns: COLUMN_BUILDERS.team,
      rows: rowsForExport,
    });
  };

  const activeFilterCount = (filters.search ? 1 : 0) + (filters.team && filters.team !== "ALL" ? 1 : 0) + (filters.active && filters.active !== "ALL" ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <>
      <PageHeader
        kicker="// DATA NODE // TEAM ROSTER"
        title="TEAM"
        sub="THE FHC ROSTER. SORTED BY SECTOR THEN DISPLAY ORDER ON THE PUBLIC SITE."
      >
        <Btn variant="pink" onClick={openNew}>+ ADD MEMBER</Btn>
        <ExportBar onExport={doExport} disabled={count === 0} />
      </PageHeader>

      <Panel>
        <div className="ad-toolbar">
          <DebouncedSearch value={filters.search || ""} onChange={(v) => table.updateFilters({ search: v })} placeholder="SEARCH NAME / DESIGNATION..." />
          <Select
            value={filters.team || "ALL"}
            onChange={(e) => table.updateFilters({ team: e.target.value })}
            options={[{ value: "ALL", label: "ALL TEAMS" }, ...TEAM_OPTIONS]}
            aria-label="Filter by team"
          />
          <Select
            value={filters.active || "ALL"}
            onChange={(e) => table.updateFilters({ active: e.target.value })}
            options={[
              { value: "ALL", label: "ALL STATUSES" },
              { value: "active", label: "ACTIVE" },
              { value: "inactive", label: "INACTIVE" },
            ]}
            aria-label="Filter by status"
          />
          <ClearFilters count={activeFilterCount} onClear={table.clearFilters} />
        </div>

        <RangeBar from={table.from} to={table.to} total={count} pageSize={table.pageSize} onPageSize={table.setPageSize} />

        {loading && <LoadingState label="READING ROSTER" />}
        {!loading && error && <ErrorState title="TEAM DATA UNAVAILABLE" sub={String(error?.message || "").toUpperCase()} onRetry={table.retry} />}
        {!loading && !error && data.length === 0 && (
          <EmptyState
            title={hasActiveFilters ? "NO MATCHING PLAYERS" : "NO TEAM MEMBERS FOUND"}
            sub={hasActiveFilters ? "NO ROSTER ENTRIES MATCH THE CURRENT SEARCH / FILTERS." : "ADD THE FIRST MEMBER TO THE FHC ROSTER."}
            icon="☺"
          />
        )}
        {!loading && !error && data.length > 0 && (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <SortTh label="PLAYER" sortKey="name" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="DESIGNATION" sortKey="designation" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="TEAM / SECTOR" sortKey="team" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="ORDER" sortKey="display_order" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="STATUS" sortKey="is_active" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <SortTh label="ADDED" sortKey="created_at" active={table.sortBy} dir={table.sortDir} onSort={table.sort} />
                  <th className="ad-th-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="ad-cell-user">
                        <Avatar seed={r.name} url={r.photo_url} size={32} />
                        <div style={{ minWidth: 0 }}>
                          <div className="ad-track" style={{ color: "var(--ad-cream)", fontSize: 12 }}>{r.name}</div>
                          <div className="ad-track ad-muted" style={{ fontSize: 10 }}>{r.bio ? r.bio.slice(0, 46) : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="ad-track ad-muted">{r.designation || "—"}</td>
                    <td><span className="ad-badge ad-badge--cyan">{formatTeamName(r.team)}</span></td>
                    <td className="ad-track ad-muted">{r.display_order ?? "—"}</td>
                    <td><span className={`ad-badge ${boolStatus(r.is_active).cls}`}>{boolStatus(r.is_active).token}</span></td>
                    <td className="ad-track ad-muted">{fmtDate(r.created_at)}</td>
                    <td>
                      <div className="ad-row ad-gap-s">
                        <Btn sm variant="cyan" onClick={() => openEdit(r)}>EDIT</Btn>
                        <Btn sm variant="danger" onClick={() => setDeleting(r)}>DEL</Btn>
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

      {editing && (
        <Drawer
          title={editing === "new" ? "ADD TEAM MEMBER" : "EDIT TEAM MEMBER"}
          kicker={`TEAM // ${formatTeamName(form.team)}`}
          onClose={() => setEditing(null)}
          width={620}
          footer={
            <div style={{ width: "100%" }}>
              {saveErr && <div className="ad-form-error ad-track">{saveErr}</div>}
              <div className="ad-row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <Btn variant="ghost" onClick={() => setEditing(null)}>CANCEL</Btn>
                <Btn variant="cyan" onClick={save} disabled={busy}>{busy ? "SAVING..." : "SAVE MEMBER"}</Btn>
              </div>
            </div>
          }
        >
          <div className="ad-drawer-avatar">
            <Avatar seed={form.name || "FHC"} url={form.photo_url} size={76} />
            <button
              type="button"
              className="ad-upload-btn ad-track"
              disabled={uploading}
              onClick={() => document.getElementById("ad-team-photo").click()}
            >
              {uploading ? "UPLOADING..." : "⬆ UPLOAD PHOTO"}
            </button>
            <input
              id="ad-team-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => pickImage(e.target.files?.[0])}
            />
            {uploadErr && <div className="ad-form-error ad-track">{uploadErr}</div>}
          </div>
          <Field label="FULL NAME">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="PLAYER NAME" />
          </Field>
          <div className="ad-grid-2">
            <Field label="DESIGNATION">
              <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. PRESIDENT / CORE" />
            </Field>
            <Field label="TEAM / SECTOR">
              <Select
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
                options={TEAM_OPTIONS}
                aria-label="Team"
              />
            </Field>
          </div>
          <div className="ad-grid-2">
            <Field label="DISPLAY ORDER" hint="LOWER = EARLIER ON THE PUBLIC PAGE">
              <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="ACTIVE ON PUBLIC SITE">
              <Select
                value={String(form.is_active)}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}
                options={[
                  { value: "true", label: "ACTIVE" },
                  { value: "false", label: "HIDDEN" },
                ]}
                aria-label="Active status"
              />
            </Field>
          </div>
          <Field label="PHOTO URL" hint="AUTO-FILLED WHEN YOU UPLOAD. PASTE A URL TO OVERRIDE.">
            <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://res.cloudinary.com/..." />
          </Field>
          <Field label="BIO">
            <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </Field>
          <div className="ad-grid-2">
            <Field label="LINKEDIN URL">
              <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="GITHUB URL">
              <Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." />
            </Field>
          </div>
          <Field label="INSTAGRAM URL">
            <Input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="https://instagram.com/..." />
          </Field>
        </Drawer>
      )}

      {deleting && (
        <ConfirmModal
          open
          title="REMOVE TEAM MEMBER"
          prose={`PERMANENTLY REMOVE ${deleting.name.toUpperCase()} FROM THE FHC ROSTER? THIS CANNOT BE UNDONE.`}
          confirmLabel="REMOVE MEMBER"
          danger
          busy={busy}
          onConfirm={doDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}