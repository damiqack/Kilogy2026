import { coordOf, REGION } from "../config/geo";
import { EMISSION_FACTORS } from "./carriers";
import type { Mode, Shipment, ShipmentStatus } from "./types";

/** Derived numbers for the dashboard and tracking pages, all computed from the store. */

export const IN_TRANSIT: ShipmentStatus[] = ["picked_up", "in_transit", "customs", "out_for_delivery"];
export const isInTransit = (s: Shipment) => IN_TRANSIT.includes(s.status);
export const isDelayed = (s: Shipment) => s.status === "delayed" || s.status === "exception";
export const isDelivered = (s: Shipment) => s.status === "delivered";

const DAY = 864e5;
const inWindow = (s: Shipment, fromDaysAgo: number, toDaysAgo: number) => {
  const age = (Date.now() - Date.parse(s.createdAt)) / DAY;
  return age < fromDaysAgo && age >= toDaysAgo;
};

/** % change of a count between the last `days` and the `days` before; null when there is no earlier data. */
export function delta(list: Shipment[], pick: (s: Shipment) => boolean, days = 30): number | null {
  const now = list.filter((s) => inWindow(s, days, 0) && pick(s)).length;
  const before = list.filter((s) => inWindow(s, 2 * days, days) && pick(s)).length;
  return before === 0 ? null : ((now - before) / before) * 100;
}

/** CO₂ avoided vs shipping every leg by air (kg). */
export function co2Saved(list: Shipment[]): number {
  return list.reduce((sum, s) => {
    const legs = s.selected.route?.legs ?? [];
    const kg = s.package.weight_kg;
    const airBaseline = legs.reduce((a, l) => a + (EMISSION_FACTORS.air * (kg / 1000) * l.distance_km) / 1000, 0);
    return sum + Math.max(0, airBaseline - (s.selected.co2_kg ?? 0));
  }, 0);
}

export const primaryMode = (s: Shipment): Mode => s.selected.route?.primary_mode ?? "air";

export function countBy<T>(list: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  list.forEach((t) => m.set(key(t), (m.get(key(t)) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function topRoutes(list: Shipment[]) {
  const m = new Map<string, { route: string; count: number; days: number }>();
  list.forEach((s) => {
    const route = `${s.origin.city ?? s.origin.country} → ${s.destination.city ?? s.destination.country}`;
    const r = m.get(route) ?? { route, count: 0, days: 0 };
    r.count += 1;
    r.days += s.selected.transit_days;
    m.set(route, r);
  });
  return [...m.values()].map((r) => ({ ...r, avgDays: r.days / r.count })).sort((a, b) => b.count - a.count);
}

/** Share of completed tracking steps, 0–100. */
export const progress = (s: Shipment) =>
  s.status === "delivered" ? 100 : Math.round((100 * s.timeline.filter((t) => t.state === "done").length) / Math.max(1, s.timeline.length));

/** Route points [lon, lat] along a shipment's legs. */
export function routePoints(s: Shipment): [number, number][] {
  const legs = s.selected.route?.legs ?? [];
  const names = legs.length ? [legs[0].from, ...legs.map((l) => l.to)] : [s.origin.city ?? "", s.destination.city ?? ""];
  return names.map((n) => coordOf(n)).filter((c): c is [number, number] => !!c);
}

export const statusColor = (s: Shipment) =>
  isDelivered(s) ? "#22c55e" : s.status === "exception" ? "#ef4444" : isDelayed(s) ? "#f97316" : "#60a5fa";

export const regionOf = (country: string) => REGION[country] ?? "Other";

/** Weekly series (oldest first) of a value per shipment, grouped by booking week. */
export function weekly(list: Shipment[], value: (s: Shipment) => number, agg: "sum" | "avg" = "sum", weeks = 6) {
  const out: { x: string; y: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = Date.now() - w * 7 * DAY, start = end - 7 * DAY;
    const inWeek = list.filter((s) => Date.parse(s.createdAt) >= start && Date.parse(s.createdAt) < end);
    const total = inWeek.reduce((a, s) => a + value(s), 0);
    const d = new Date(start);
    out.push({ x: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), y: agg === "avg" ? (inWeek.length ? total / inWeek.length : 0) : total });
  }
  return out;
}

/** Most recent completed tracking events across all shipments. */
export function recentActivity(list: Shipment[], n = 6) {
  return list
    .flatMap((s) => s.timeline.filter((t) => t.state === "done" || t.state === "issue").map((t) => ({ s, t })))
    .sort((a, b) => Date.parse(b.t.time) - Date.parse(a.t.time))
    .slice(0, n);
}

export function timeAgo(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 6e4));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}
