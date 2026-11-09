import type { PackageSpec } from "../types";

/**
 * Helpers for sandbox mode: the deterministic stand-in every connector uses until its provider's
 * credentials are configured. Same input, same output, so screens and tests are stable.
 */

/** Air/courier convention: the greater of actual weight and volume (cm³ / 5000). */
export function chargeableKg(pkg: PackageSpec): number {
  const d = pkg.dimensions;
  const volumetric = d ? (d.l * d.w * d.h) / 5000 : 0;
  return Math.max(pkg.weight_kg, volumetric);
}

/** Small stable hash (FNV-1a) used to vary sandbox values by provider, lane and reference. */
export function stableHash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const addDays = (from: Date, days: number) => new Date(from.getTime() + days * 86_400_000);

/** A one-page PDF with the given lines, so sandbox documents open in any viewer. */
export function simplePdf(lines: string[]): Buffer {
  const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`).replace(/[^\x20-\x7e]/g, "?");
  const text = lines.map((l, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 56 ${760 - i * 22} Td (${esc(l)}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(body));
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}
