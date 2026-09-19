/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — real export engine (CSV / Excel .xlsx / PDF)
   Every export embeds report metadata and RESPECTS the active filters:
   the rows you pass are the rows that ship — nothing is re-fetched.
   ════════════════════════════════════════════════════════════════════ */

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* ── shared report shape ───────────────────────────────────────────── */
/**
 * @typedef {Object} ReportSpec
 * @property {string} filename   base filename (no extension)
 * @property {string} title      e.g. "FHC // USERS REPORT"
 * @property {string} [subtitle] e.g. "ADMIN CONTROL CENTER"
 * @property {string} generated  timestamp string (already localized)
 * @property {string[]} filters  active filter descriptions
 * @property {{key:string,label:string}[]} columns
 * @property {object[]} rows     already-filtered data rows
 */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function cellValue(row, col) {
  const v = row[col.key];
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function metaLines(spec) {
  const lines = [
    "FISAT HORIZON CLUB",
    spec.subtitle || "ADMIN CONTROL CENTER",
    "Generated: " + spec.generated,
  ];
  if (spec.filters && spec.filters.length) {
    lines.push("Filters: " + spec.filters.join("  |  "));
  } else {
    lines.push("Filters: NONE");
  }
  return lines;
}

/* ════════════════════════════════════════════════════════════════════
   CSV (UTF-8 with BOM so Excel renders FHC accents correctly)
   ════════════════════════════════════════════════════════════════════ */
export function exportCSV(spec) {
  const esc = (s) => {
    const t = String(s ?? "").replace(/"/g, '""');
    return /[",\n\r]/.test(t) ? `"${t}"` : t;
  };

  const lines = [];
  for (const m of metaLines(spec)) lines.push(esc(m));
  lines.push("");
  lines.push(spec.columns.map((c) => esc(c.label)).join(","));
  for (const row of spec.rows) {
    lines.push(spec.columns.map((c) => esc(cellValue(row, c))).join(","));
  }

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${spec.filename}.csv`);
  return `${spec.filename}.csv`;
}

/* ════════════════════════════════════════════════════════════════════
   EXCEL — real .xlsx workbook
   Sheet 1: report metadata + data table (filtered rows only).
   ════════════════════════════════════════════════════════════════════ */
export function exportExcel(spec) {
  const aoa = [];
  const meta = metaLines(spec);
  aoa.push([meta[0], meta[1]]);
  aoa.push([meta[2], ""]);
  for (let i = 3; i < meta.length; i++) aoa.push([meta[i], ""]);
  aoa.push([]);
  aoa.push(spec.columns.map((c) => c.label));
  for (const row of spec.rows) {
    aoa.push(spec.columns.map((c) => cellValue(row, c)));
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  /* Column widths — header col wider, content auto based on longest cell */
  const widths = spec.columns.map((c, idx) => {
    let max = c.label.length;
    for (const row of spec.rows.slice(0, 200)) {
      const v = cellValue(row, c);
      if (v.length > max) max = v.length;
    }
    return { wch: Math.min(Math.max(max + 2, 8), 48) };
  });
  ws["!cols"] = [{ wch: 4 }, ...widths];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "FHC REPORT");
  XLSX.writeFile(wb, `${spec.filename}.xlsx`, { compression: true });
  return `${spec.filename}.xlsx`;
}

/* ════════════════════════════════════════════════════════════════════
   PDF — clean professional FHC-styled report
   ════════════════════════════════════════════════════════════════════ */
export function exportPDF(spec) {
  const CK = "#08090B";
  const PINK = "#FF1687";
  const CYAN = "#1ED7E8";
  const CREAM = "#FFF7E5";
  const MUTED = "#8B93A1";

  const doc = new jsPDF({ orientation: spec.rows.length > 8 ? "landscape" : "portrait" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 12;

  /* header band */
  doc.setFillColor(CK);
  doc.rect(0, 0, W, 26, "F");
  doc.setFillColor(PINK);
  doc.rect(0, 26, W, 1, "F");

  doc.setTextColor(PINK);
  doc.setFont("courier", "bold");
  doc.setFontSize(15);
  doc.text(spec.title, M, 14);

  doc.setTextColor(CREAM);
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.text(spec.subtitle || "FHC // ADMIN CONTROL CENTER", W - M, 14, { align: "right" });

  let y = 40;
  doc.setTextColor(MUTED);
  doc.setFontSize(8.5);
  const meta = metaLines(spec);
  meta.forEach((line, i) => {
    doc.text(i === 0 ? `${line}  //  ${spec.title}` : line, M, y);
    y += 5;
  });
  y += 3;

  const head = spec.columns.map((c) => c.label);
  const body = spec.rows.map((row) => spec.columns.map((c) => cellValue(row, c)));

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    theme: "plain",
    styles: {
      font: "courier",
      fontSize: 8,
      textColor: [120, 126, 138],
      cellPadding: { left: 3, right: 3, top: 2.4, bottom: 2.4 },
      lineColor: [36, 40, 48],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [17, 20, 26],
      textColor: [255, 247, 229],
      fontStyle: "bold",
      fontSize: 7.5,
      valign: "middle",
    },
    alternateRowStyles: { fillColor: [13, 15, 19] },
    margin: { left: M, right: M },
    didDrawPage: () => {
      doc.setTextColor(80, 86, 98);
      doc.setFontSize(7);
      doc.text(`FHC // ADMIN REPORT — ${spec.filename}`, M, H - 7);
      doc.text(`ROW ${spec.rows.length}`, W - M, H - 7, { align: "right" });
    },
  });

  doc.save(`${spec.filename}.pdf`);
  return `${spec.filename}.pdf`;
}

/* ── convenience: 3-way export switch ──────────────────────────────── */
export function runExport(format, spec) {
  if (!spec || !spec.columns?.length) return;
  const cfg = { ...spec, filename: spec.filename || `fhc-admin-export-${Date.now()}` };
  if (format === "csv") return exportCSV(cfg);
  if (format === "xlsx") return exportExcel(cfg);
  if (format === "pdf") return exportPDF(cfg);
  return null;
}

/* ── standard column builders so every page ships the same headers ───
   Mirrors the LIVE schema. Profiles only advertise columns that exist in
   the project today (username / email_verified / last_login_at / bio are
   schemas-only; they appear after a migration, never before). */
export const COLUMN_BUILDERS = {
  user: [
    { key: "full_name", label: "NAME" },
    { key: "role", label: "ROLE" },
    { key: "avatar_url", label: "AVATAR URL" },
    { key: "created_at", label: "MEMBER SINCE" },
    { key: "updated_at", label: "UPDATED" },
  ],
  profile: [
    { key: "full_name", label: "NAME" },
    { key: "role", label: "ROLE" },
    { key: "avatar_url", label: "AVATAR URL" },
    { key: "created_at", label: "MEMBER SINCE" },
    { key: "updated_at", label: "UPDATED" },
  ],
  application: [
    { key: "full_name", label: "FULL NAME" },
    { key: "email", label: "EMAIL" },
    { key: "register_number", label: "REGISTER NUMBER" },
    { key: "year_branch", label: "YEAR & BRANCH" },
    { key: "phone", label: "PHONE" },
    { key: "selected_domain", label: "DOMAIN" },
    { key: "status", label: "STATUS" },
    { key: "created_at", label: "SUBMITTED" },
  ],
  team: [
    { key: "name", label: "NAME" },
    { key: "designation", label: "DESIGNATION" },
    { key: "team", label: "TEAM / SECTOR" },
    { key: "display_order", label: "ORDER" },
    { key: "is_active", label: "ACTIVE" },
    { key: "photo_url", label: "PHOTO URL" },
    { key: "created_at", label: "ADDED" },
  ],
};

/* Comma-separated simplified table for inline PDF body if needed */
export function projectRowsForExport(rows, columns, fn = cellValue) {
  return rows.map((r) => columns.map((c) => fn(r, c)));
}