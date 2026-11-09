import dayjs from "dayjs";
import logoUrl from "../../assets/brand/kilogy-logo.png";
import { formatCell } from "./build";
import type { Report, ReportTable } from "./types";

/**
 * Report downloads. Each format's library is loaded only when someone downloads that format,
 * so the app's main bundle stays small.
 */
export type ExportFormat = "pdf" | "xlsx" | "docx" | "csv" | "json";

export const FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
  { value: "pdf", label: "PDF", hint: "Formatted report for sharing and printing" },
  { value: "xlsx", label: "Excel (XLSX)", hint: "One sheet per table, numbers ready to analyse" },
  { value: "docx", label: "Word (DOCX)", hint: "Editable report document" },
  { value: "csv", label: "CSV", hint: "Plain tables for any spreadsheet or BI tool" },
  { value: "json", label: "JSON", hint: "Raw report data for integrations" },
];

const NAVY = "0B1F4D";
export const fileName = (r: Report, ext: string) => `kilogy-report-${r.from}_to_${r.to}.${ext}`;

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const generatedLine = (r: Report) => `Generated ${dayjs(r.generatedAt).format("MMM D, YYYY h:mm A")} by ${r.generatedBy}`;
const changeText = (k: Report["kpis"][number]) =>
  k.change == null ? "—" : Math.abs(k.change) > 300 ? `from ${k.previousDisplay}` : `${k.change > 0 ? "+" : ""}${k.change}%`;
const cells = (t: ReportTable, row: (string | number)[]) => row.map((v, i) => formatCell(v, t.kinds?.[i]));

async function logoDataUrl(): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const blob = await (await fetch(logoUrl)).blob();
    const data = await new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsDataURL(blob); });
    return { data, w: 612, h: 226 };
  } catch {
    return null;
  }
}

/** jsPDF's built-in fonts only cover Latin-1, so swap the few characters they can't draw. */
const pdfSafe = (r: Report): Report => JSON.parse(JSON.stringify(r).replace(/₂/g, "2").replace(/→/g, "->").replace(/≥/g, ">=").replace(/≤/g, "<="));

async function toPdf(input: Report) {
  const r = pdfSafe(input);
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth(), M = 48;
  const logo = await logoDataUrl();
  if (logo) doc.addImage(logo.data, "PNG", M, 36, 110, (110 * logo.h) / logo.w);
  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(11, 31, 77).text(r.title.replace(/^KILOGY /, "").replace(/^\w/, (c) => c.toUpperCase()), M, 100);
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(51, 65, 85);
  doc.text(r.periodLabel, M, 118);
  doc.setFontSize(9).setTextColor(100, 116, 139).text([generatedLine(r), `Compared with ${r.previousLabel}`, r.filtersLabel.join(" · ")], M, 134);

  autoTable(doc, {
    startY: 170, margin: { left: M, right: M }, theme: "grid",
    head: [["Key indicator", "Value", "vs previous period"]],
    body: r.kpis.map((k) => [k.label, k.display, changeText(k)]),
    headStyles: { fillColor: [11, 31, 77] }, styles: { fontSize: 9.5 }, columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(11, 31, 77).text("Summary", M, y);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(51, 65, 85);
  y += 16;
  for (const s of r.summary) {
    const lines = doc.splitTextToSize(`• ${s}`, W - 2 * M);
    doc.text(lines, M, y);
    y += lines.length * 13 + 3;
  }

  for (const sec of r.sections) {
    doc.addPage();
    y = 56;
    doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(11, 31, 77).text(sec.title, M, y);
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(100, 116, 139);
    const intro = doc.splitTextToSize(sec.intro, W - 2 * M);
    doc.text(intro, M, y + 16);
    y += 16 + intro.length * 12 + 10;
    for (const t of sec.tables) {
      doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(15, 23, 42).text(t.title, M, y);
      autoTable(doc, {
        startY: y + 6, margin: { left: M, right: M }, theme: "striped",
        head: [t.columns], body: t.rows.length ? t.rows.map((row) => cells(t, row)) : [[{ content: t.note ?? "No data for this period.", colSpan: t.columns.length }]],
        foot: t.total ? [cells(t, t.total)] : undefined,
        headStyles: { fillColor: [11, 31, 77] }, footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42] },
        styles: { fontSize: 8.5, cellPadding: 4 },
        columnStyles: Object.fromEntries((t.kinds ?? []).map((k, i) => [i, { halign: k === "text" ? "left" : "right" }])),
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      if (t.note && t.rows.length) { doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(100, 116, 139).text(doc.splitTextToSize(t.note, W - 2 * M), M, y + 4); y += 14; }
      y += 16;
      if (y > doc.internal.pageSize.getHeight() - 100) { doc.addPage(); y = 56; }
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(148, 163, 184);
    doc.text("KILOGY · Internal use only", M, doc.internal.pageSize.getHeight() - 24);
    doc.text(`Page ${i} of ${pages}`, W - M, doc.internal.pageSize.getHeight() - 24, { align: "right" });
  }
  return doc.output("blob");
}

async function toXlsx(r: Report) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = r.generatedBy;
  wb.created = new Date(r.generatedAt);
  const header = (row: import("exceljs").Row) => {
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${NAVY}` } };
  };

  const s = wb.addWorksheet("Summary");
  s.columns = [{ width: 34 }, { width: 22 }, { width: 22 }];
  s.addRow([r.title.toUpperCase()]).font = { bold: true, size: 16, color: { argb: `FF${NAVY}` } };
  s.addRow([r.periodLabel]).font = { size: 12 };
  s.addRow([generatedLine(r)]);
  s.addRow([`Compared with ${r.previousLabel}`]);
  s.addRow([r.filtersLabel.join(" · ")]);
  s.addRow([]);
  header(s.addRow(["Key indicator", "Value", "vs previous period"]));
  r.kpis.forEach((k) => s.addRow([k.label, k.display, changeText(k)]));
  s.addRow([]);
  s.addRow(["Summary"]).font = { bold: true };
  r.summary.forEach((line) => s.addRow([line]));

  const used = new Set<string>(["Summary"]);
  for (const sec of r.sections) {
    for (const t of sec.tables) {
      let name = t.title.replace(/[\\/?*[\]:]/g, "").slice(0, 31);
      for (let n = 2; used.has(name); n++) name = `${t.title.slice(0, 27)} (${n})`;
      used.add(name);
      const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 3 }] });
      ws.addRow([`${sec.title}: ${t.title}`]).font = { bold: true, size: 13, color: { argb: `FF${NAVY}` } };
      ws.addRow([r.periodLabel]);
      header(ws.addRow(t.columns));
      t.rows.forEach((row) => ws.addRow(row.map((v, i) => (t.kinds?.[i] === "pct" && typeof v === "number" ? v / 100 : v))));
      if (t.total) ws.addRow(t.total.map((v, i) => (t.kinds?.[i] === "pct" && typeof v === "number" ? v / 100 : v))).font = { bold: true };
      if (!t.rows.length) ws.addRow([t.note ?? "No data for this period."]);
      else if (t.note) ws.addRow([t.note]).font = { italic: true, color: { argb: "FF64748B" } };
      t.columns.forEach((c, i) => {
        const col = ws.getColumn(i + 1);
        col.width = Math.min(48, Math.max(12, c.length + 4, ...t.rows.map((row) => String(row[i] ?? "").length + 2)));
        const k = t.kinds?.[i];
        if (k === "money") col.numFmt = '"$"#,##0.00';
        if (k === "pct") col.numFmt = "0.0%";
        if (k === "int") col.numFmt = "#,##0";
        if (k === "num") col.numFmt = "#,##0.0";
      });
    }
  }
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function toDocx(r: Report) {
  const d = await import("docx");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ShadingType, Footer, PageNumber, ImageRun, BorderStyle } = d;
  const WIDTH = 9360; // 6.5" in DXA
  const border = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const table = (columns: string[], rows: string[][], aligns: ("left" | "right")[], total?: string[]) => {
    const w = Math.floor(WIDTH / columns.length);
    const cell = (text: string, i: number, opts: { head?: boolean; bold?: boolean } = {}) => new TableCell({
      width: { size: w, type: WidthType.DXA }, borders,
      shading: opts.head ? { type: ShadingType.CLEAR, color: "auto", fill: NAVY } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ alignment: aligns[i] === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text, bold: opts.head || opts.bold, color: opts.head ? "FFFFFF" : "0F172A", size: 18, font: "Calibri" })] })],
    });
    return new Table({
      width: { size: w * columns.length, type: WidthType.DXA }, columnWidths: columns.map(() => w),
      rows: [
        new TableRow({ tableHeader: true, children: columns.map((c, i) => cell(c, i, { head: true })) }),
        ...rows.map((row) => new TableRow({ children: row.map((c, i) => cell(c, i)) })),
        ...(total ? [new TableRow({ children: total.map((c, i) => cell(c, i, { bold: true })) })] : []),
      ],
    });
  };
  const p = (text: string, o: { size?: number; color?: string; bold?: boolean; italic?: boolean; after?: number } = {}) =>
    new Paragraph({ spacing: { after: o.after ?? 80 }, children: [new TextRun({ text, size: o.size ?? 20, color: o.color ?? "334155", bold: o.bold, italics: o.italic, font: "Calibri" })] });

  const logo = await logoDataUrl();
  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];
  if (logo) {
    const bin = Uint8Array.from(atob(logo.data.split(",")[1]), (c) => c.charCodeAt(0));
    children.push(new Paragraph({ spacing: { after: 160 }, children: [new ImageRun({ type: "png", data: bin, transformation: { width: 130, height: 48 } })] }));
  }
  children.push(new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 60 }, children: [new TextRun({ text: r.title.replace(/^KILOGY /, "").replace(/^\w/, (c) => c.toUpperCase()), bold: true, size: 40, color: NAVY, font: "Calibri" })] }));
  children.push(p(r.periodLabel, { size: 24, color: "0F172A" }));
  children.push(p(generatedLine(r), { size: 18, color: "64748B" }), p(`Compared with ${r.previousLabel} · ${r.filtersLabel.join(" · ")}`, { size: 18, color: "64748B", after: 240 }));
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 120 }, children: [new TextRun({ text: "Key indicators", bold: true, size: 28, color: NAVY, font: "Calibri" })] }));
  children.push(table(["Key indicator", "Value", "vs previous period"], r.kpis.map((k) => [k.label, k.display, changeText(k)]), ["left", "right", "right"]));
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: "Summary", bold: true, size: 28, color: NAVY, font: "Calibri" })] }));
  r.summary.forEach((s) => children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: s, size: 20, font: "Calibri" })] })));

  for (const sec of r.sections) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 80 }, children: [new TextRun({ text: sec.title, bold: true, size: 30, color: NAVY, font: "Calibri" })] }));
    children.push(p(sec.intro, { color: "64748B", after: 200 }));
    for (const t of sec.tables) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t.title, bold: true, size: 22, color: "0F172A", font: "Calibri" })] }));
      const aligns = t.columns.map((_, i) => ((t.kinds?.[i] ?? "text") === "text" ? "left" : "right") as "left" | "right");
      if (t.rows.length) children.push(table(t.columns, t.rows.map((row) => cells(t, row)), aligns, t.total ? cells(t, t.total) : undefined));
      if (t.note) children.push(p(t.note, { italic: true, size: 17, color: "64748B" }));
    }
  }

  const doc = new Document({
    creator: r.generatedBy, title: r.title,
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ children: ["KILOGY · Internal use only · Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 16, color: "94A3B8", font: "Calibri" })] })] }) },
      children,
    }],
  });
  return Packer.toBlob(doc);
}

function toCsv(r: Report) {
  const esc = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines: string[] = [];
  const row = (xs: (string | number)[]) => lines.push(xs.map(esc).join(","));
  row([r.title]); row([r.periodLabel]); row([generatedLine(r)]); row([r.filtersLabel.join(" · ")]); lines.push("");
  row(["Section", "Table", "Key indicator", "Value", "Change vs previous (%)"]);
  r.kpis.forEach((k) => row(["Summary", "Key indicators", k.label, k.value, k.change ?? ""]));
  for (const sec of r.sections) {
    for (const t of sec.tables) {
      lines.push("");
      row(["Section", "Table", ...t.columns]);
      t.rows.forEach((x) => row([sec.title, t.title, ...x]));
      if (t.total) row([sec.title, `${t.title} (total)`, ...t.total]);
    }
  }
  // Byte-order mark so Excel opens the file as UTF-8 (keeps "CO₂" and "→" intact).
  return new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
}

export async function exportReport(r: Report, format: ExportFormat) {
  const blob =
    format === "pdf" ? await toPdf(r)
    : format === "xlsx" ? await toXlsx(r)
    : format === "docx" ? await toDocx(r)
    : format === "csv" ? toCsv(r)
    : new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
  save(blob, fileName(r, format));
}
