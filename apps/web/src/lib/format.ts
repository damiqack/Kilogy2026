export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
export const kg = (n: number | null | undefined) => (n == null ? "—" : `${n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString()} kg`);
export const days = (n: number) => `${n % 1 === 0 ? n : n.toFixed(1)} ${n === 1 ? "day" : "days"}`;
// Date-only strings ("2026-09-25") are treated as local dates, not UTC midnight.
const parse = (iso: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso);
export const date = (iso: string) => parse(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const place = (l: { city?: string; country: string }) => (l.city ? `${l.city}, ${l.country}` : l.country);
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
