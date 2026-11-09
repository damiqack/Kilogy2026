import dayjs, { type Dayjs } from "dayjs";
import type { SignInRecord, StaffUser } from "../../data/auth";
import type { DocumentRecord, Payment, PaymentMethod, Quote, Shipment } from "../../data/types";
import { USD_TO_CAD } from "../money";
import {
  CATEGORY_LABEL, type Cell, type Kpi, type PeriodType, type Report, type ReportParams, type ReportSection, type ReportTable,
} from "./types";

/** Everything a report can draw on. In production these come from the reporting API. */
export interface ReportData {
  shipments: Shipment[];
  payments: Payment[];
  paymentMethods: PaymentMethod[];
  quotes: Quote[];
  documents: DocumentRecord[];
  team: StaffUser[];
  signIns: Record<string, SignInRecord[]>;
  inquiries: { ref: string; at: string; topic?: string }[];
  generatedBy: string;
}

const cadOf = (usd: number) => Math.round(usd * USD_TO_CAD * 100) / 100;
const fmtMoney = (cad: number) => cad.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const pct = (n: number, d: number) => (d ? Math.round((1000 * n) / d) / 10 : 0);
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);
const change = (now: number, before: number): number | null => (before ? Math.round((1000 * (now - before)) / before) / 10 : now ? null : 0);
const modeOf = (s: Shipment) => s.selected.route?.primary_mode ?? "air";
const MODE_LABEL: Record<string, string> = { air: "Air", ocean: "Ocean", road: "Road", rail: "Rail" };
const STATUS_LABEL: Record<string, string> = {
  created: "Created", booked: "Booked", picked_up: "Picked up", in_transit: "In transit", customs: "In customs",
  out_for_delivery: "Out for delivery", delivered: "Delivered", delayed: "Delayed", exception: "Exception", cancelled: "Cancelled",
};
const isException = (s: Shipment) => s.status === "delayed" || s.status === "exception";
const isOpen = (s: Shipment) => !["delivered", "cancelled"].includes(s.status);

/** Period presets for each report type, from a date the user picked. */
export function periodFor(type: PeriodType, anchor: Dayjs, customEnd?: Dayjs): { from: Dayjs; to: Dayjs; label: string } {
  if (type === "weekly") {
    const start = anchor.subtract((anchor.day() + 6) % 7, "day").startOf("day"); // Monday
    const end = start.add(6, "day");
    return { from: start, to: end, label: `Week of ${start.format("MMM D")} – ${end.format("MMM D, YYYY")}` };
  }
  if (type === "monthly") return { from: anchor.startOf("month"), to: anchor.endOf("month").startOf("day"), label: anchor.format("MMMM YYYY") };
  if (type === "annual") return { from: anchor.startOf("year"), to: anchor.endOf("year").startOf("day"), label: `Year ${anchor.format("YYYY")}` };
  const end = customEnd ?? anchor;
  return { from: anchor.startOf("day"), to: end.startOf("day"), label: `${anchor.format("MMM D, YYYY")} – ${end.format("MMM D, YYYY")}` };
}

function inRange(iso: string, from: Dayjs, to: Dayjs) {
  const t = dayjs(iso);
  return !t.isBefore(from.startOf("day")) && !t.isAfter(to.endOf("day"));
}

/** Buckets for trend tables: days for short periods, weeks for a month or so, months for longer. */
function buckets(from: Dayjs, to: Dayjs) {
  const days = to.diff(from, "day") + 1;
  const unit: "day" | "week" | "month" = days <= 14 ? "day" : days <= 92 ? "week" : "month";
  const out: { label: string; from: Dayjs; to: Dayjs }[] = [];
  let cur = unit === "week" ? from.subtract((from.day() + 6) % 7, "day") : from.startOf(unit);
  while (!cur.isAfter(to)) {
    const end = unit === "week" ? cur.add(6, "day") : cur.endOf(unit);
    const a = cur.isBefore(from) ? from : cur, b = end.isAfter(to) ? to : end;
    out.push({ label: unit === "day" ? a.format("ddd MMM D") : unit === "week" ? `${a.format("MMM D")} – ${b.format("MMM D")}` : a.format("MMM YYYY"), from: a, to: b });
    cur = unit === "week" ? cur.add(7, "day") : cur.add(1, unit).startOf(unit);
  }
  return out;
}

function groupCount<T>(xs: T[], key: (x: T) => string) {
  const m = new Map<string, T[]>();
  xs.forEach((x) => m.set(key(x), [...(m.get(key(x)) ?? []), x]));
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
}

export function buildReport(data: ReportData, params: ReportParams, periodLabel: string): Report {
  const from = dayjs(params.from), to = dayjs(params.to);
  const len = to.diff(from, "day") + 1;
  // Calendar periods compare with the previous calendar period (October for November, 2025 for 2026);
  // weekly and custom ranges compare with the same number of days just before.
  const unit = params.periodType === "monthly" ? "month" : params.periodType === "annual" ? "year" : null;
  const pFrom = unit ? from.subtract(1, unit).startOf(unit) : from.subtract(len, "day");
  const pTo = unit ? pFrom.endOf(unit).startOf("day") : from.subtract(1, "day");
  const f = params.filters;

  const matches = (s: Shipment) =>
    (!f.carriers.length || f.carriers.includes(s.selected.carrier_name))
    && (!f.modes.length || f.modes.includes(modeOf(s)))
    && (!f.destinations.length || f.destinations.includes(s.destination.country));
  const scoped = data.shipments.filter(matches);
  const ids = new Set(scoped.map((s) => s.id));
  const ship = scoped.filter((s) => inRange(s.createdAt, from, to));
  const prevShip = scoped.filter((s) => inRange(s.createdAt, pFrom, pTo));
  const pay = data.payments.filter((p) => ids.has(p.shipmentId) && inRange(p.createdAt, from, to));
  const prevPay = data.payments.filter((p) => ids.has(p.shipmentId) && inRange(p.createdAt, pFrom, pTo));
  const quotes = data.quotes.filter((q) => inRange(q.createdAt, from, to));

  const revenue = (xs: Shipment[]) => cadOf(sum(xs.filter((s) => s.status !== "cancelled"), (s) => s.selected.price_usd));
  const margin = (xs: Shipment[]) => cadOf(sum(xs.filter((s) => s.status !== "cancelled"), (s) => s.selected.price_usd - (s.selected.pricing?.carrier_cost_usd ?? s.selected.price_usd)));
  const collected = (xs: Payment[]) => cadOf(sum(xs.filter((p) => p.status === "succeeded"), (p) => p.amount_usd));
  const delivered = (xs: Shipment[]) => xs.filter((s) => s.status === "delivered").length;
  const onTimeRate = (xs: Shipment[]) => { const closed = xs.filter((s) => s.status === "delivered" || isException(s)); return closed.length ? pct(closed.filter((s) => s.status === "delivered").length, closed.length) : 0; };
  const co2 = (xs: Shipment[]) => Math.round(sum(xs, (s) => s.selected.co2_kg ?? 0));

  const kpi = (label: string, now: number, before: number | null, show: (n: number) => string, invert = false): Kpi =>
    ({ label, value: now, display: show(now), change: before == null ? null : change(now, before), previousDisplay: before == null ? "—" : show(before), invert });
  const count = (n: number) => n.toLocaleString("en-CA");
  const kpis: Kpi[] = [
    kpi("Shipments booked", ship.length, prevShip.length, count),
    kpi("Delivered", delivered(ship), delivered(prevShip), count),
    kpi("On-time rate", onTimeRate(ship), null, (n) => `${n}%`),
    kpi("Exceptions", ship.filter(isException).length, prevShip.filter(isException).length, count, true),
    kpi("Booking value", revenue(ship), revenue(prevShip), fmtMoney),
    kpi("Payments collected", collected(pay), collected(prevPay), fmtMoney),
    kpi("Gross margin", margin(ship), margin(prevShip), fmtMoney),
    kpi("CO₂e emitted", co2(ship), co2(prevShip), (n) => `${n.toLocaleString("en-CA")} kg`, true),
  ];

  const summary: string[] = [];
  const k = (i: number) => kpis[i];
  // Very large swings (usually from a near-empty previous period) read better as "up from X".
  const dir = (c: number | null, before = "") => (c == null ? "" : c > 300 ? ` (up from ${before} in the previous period)` : c > 0 ? ` (up ${c}% on the previous period)` : c < 0 ? ` (down ${Math.abs(c)}% on the previous period)` : " (unchanged on the previous period)");
  summary.push(ship.length
    ? `${ship.length} shipment${ship.length === 1 ? "" : "s"} booked${dir(k(0).change, k(0).previousDisplay)}, worth ${k(4).display}${dir(k(4).change, k(4).previousDisplay)}.`
    : "No shipments were booked in this period with the selected filters.");
  if (ship.length) {
    summary.push(`${k(1).display} delivered and ${k(3).display} with a delay or exception; on-time rate ${k(2).display} of completed shipments.`);
    const topCarrier = groupCount(ship, (s) => s.selected.carrier_name)[0];
    const topLane = groupCount(ship, (s) => `${s.origin.city ?? s.origin.country} → ${s.destination.city ?? s.destination.country}`)[0];
    summary.push(`Busiest carrier: ${topCarrier[0]} (${topCarrier[1].length} shipments). Busiest lane: ${topLane[0]} (${topLane[1].length}).`);
    const outstanding = cadOf(sum(pay.filter((p) => p.status === "pending"), (p) => p.amount_usd));
    summary.push(`${k(5).display} collected${outstanding ? `, ${fmtMoney(outstanding)} outstanding` : ", nothing outstanding"}; gross margin ${k(6).display}.`);
  }

  const sections: ReportSection[] = [];
  const want = (c: ReportSection["id"]) => params.categories.includes(c);
  const T = (t: ReportTable) => t;

  if (want("operations")) {
    const byStatus = groupCount(ship, (s) => s.status);
    const byMode = groupCount(ship, modeOf);
    const lanes = groupCount(ship, (s) => `${s.origin.city ?? s.origin.country} → ${s.destination.city ?? s.destination.country}`).slice(0, 10);
    sections.push({ id: "operations", title: CATEGORY_LABEL.operations, intro: "Shipment volumes by status, transport mode and lane, plus every shipment that needs attention.", tables: [
      T({ title: "Shipments by status", columns: ["Status", "Shipments", "Share"], kinds: ["text", "int", "pct"],
        rows: byStatus.map(([st, xs]) => [STATUS_LABEL[st] ?? st, xs.length, pct(xs.length, ship.length)]), total: ["Total", ship.length, ship.length ? 100 : 0] }),
      T({ title: "Shipments by transport mode", columns: ["Mode", "Shipments", "Share", "Avg transit (days)", "CO₂e (kg)"], kinds: ["text", "int", "pct", "num", "int"],
        rows: byMode.map(([m, xs]) => [MODE_LABEL[m] ?? m, xs.length, pct(xs.length, ship.length), Math.round(10 * sum(xs, (s) => s.selected.transit_days) / xs.length) / 10, co2(xs)]) }),
      T({ title: "Top lanes", columns: ["Lane", "Shipments", "Booking value", "Avg transit (days)", "Exceptions"], kinds: ["text", "int", "money", "num", "int"],
        rows: lanes.map(([lane, xs]) => [lane, xs.length, revenue(xs), Math.round(10 * sum(xs, (s) => s.selected.transit_days) / xs.length) / 10, xs.filter(isException).length]) }),
      T({ title: "Shipments needing attention", columns: ["Tracking #", "Lane", "Carrier", "Status", "Booked"], kinds: ["text", "text", "text", "text", "text"],
        rows: ship.filter(isException).map((s) => [s.trackingId, `${s.origin.city} → ${s.destination.city}`, s.selected.carrier_name, STATUS_LABEL[s.status], dayjs(s.createdAt).format("YYYY-MM-DD")]),
        note: ship.filter(isException).length ? undefined : "No delayed or exception shipments in this period." }),
    ] });
  }

  if (want("orders")) {
    const booked = ship.length;
    sections.push({ id: "orders", title: CATEGORY_LABEL.orders, intro: "Quotes requested, bookings made from them, and booking volume over the period.", tables: [
      T({ title: "Quote to booking", columns: ["Measure", "Value"], kinds: ["text", "text"], rows: [
        ["Quotes requested", String(quotes.length)],
        ["Bookings", String(booked)],
        ["Quote-to-booking rate", quotes.length ? `${pct(booked, quotes.length)}%` : "No quotes saved in this period"],
        ["Avg options per quote", quotes.length ? String(Math.round(10 * sum(quotes, (q) => q.options.length) / quotes.length) / 10) : "—"],
        ["Quotes from the routing engine", quotes.length ? `${quotes.filter((q) => q.source === "ai-engine").length} of ${quotes.length}` : "—"],
        ["Open orders (not delivered or cancelled)", String(ship.filter(isOpen).length)],
        ["Cancelled orders", String(ship.filter((s) => s.status === "cancelled").length)],
      ] }),
      T({ title: "Bookings over time", columns: ["Period", "Bookings", "Booking value"], kinds: ["text", "int", "money"],
        rows: buckets(from, to).map((b) => { const xs = ship.filter((s) => inRange(s.createdAt, b.from, b.to)); return [b.label, xs.length, revenue(xs)]; }) }),
    ] });
  }

  if (want("carriers")) {
    const rows = groupCount(ship, (s) => s.selected.carrier_name).map(([c, xs]): Cell[] => {
      const closed = xs.filter((s) => s.status === "delivered" || isException(s));
      return [c, xs.length, pct(xs.length, ship.length), closed.length ? pct(closed.filter((s) => s.status === "delivered").length, closed.length) : "—",
        Math.round(10 * sum(xs, (s) => s.selected.transit_days) / xs.length) / 10, revenue(xs), co2(xs)];
    });
    sections.push({ id: "carriers", title: CATEGORY_LABEL.carriers, intro: "Volume, reliability, speed, spend and emissions for each carrier used in the period.", tables: [
      T({ title: "Carrier scorecard", columns: ["Carrier", "Shipments", "Share", "On-time", "Avg transit (days)", "Booking value", "CO₂e (kg)"],
        kinds: ["text", "int", "pct", "pct", "num", "money", "int"], rows }),
    ] });
  }

  if (want("transactions")) {
    const byStatus = groupCount(pay, (p) => p.status);
    const byMethod = groupCount(pay, (p) => p.method);
    const shipById = new Map(data.shipments.map((s) => [s.id, s]));
    sections.push({ id: "transactions", title: CATEGORY_LABEL.transactions, intro: "Payments recorded in the period by status and payment method, with the full transaction list.", tables: [
      T({ title: "Payments by status", columns: ["Status", "Transactions", "Amount"], kinds: ["text", "int", "money"],
        rows: byStatus.map(([st, xs]) => [st === "succeeded" ? "Paid" : st === "pending" ? "Pending" : "Failed", xs.length, cadOf(sum(xs, (p) => p.amount_usd))]),
        total: ["Total", pay.length, cadOf(sum(pay, (p) => p.amount_usd))] }),
      T({ title: "Payments by method", columns: ["Method", "Transactions", "Amount"], kinds: ["text", "int", "money"],
        rows: byMethod.map(([m, xs]) => [m, xs.length, cadOf(sum(xs, (p) => p.amount_usd))]) }),
      T({ title: "Transaction list", columns: ["Date", "Payment ID", "Shipment", "Method", "Status", "Amount"], kinds: ["text", "text", "text", "text", "text", "money"],
        rows: [...pay].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((p) => [dayjs(p.createdAt).format("YYYY-MM-DD"), p.id, shipById.get(p.shipmentId)?.trackingId ?? p.shipmentId, p.method,
          p.status === "succeeded" ? "Paid" : p.status === "pending" ? "Pending" : "Failed", cadOf(p.amount_usd)]) }),
    ] });
  }

  if (want("financial")) {
    const active = ship.filter((s) => s.status !== "cancelled");
    const cost = cadOf(sum(active, (s) => s.selected.pricing?.carrier_cost_usd ?? s.selected.price_usd));
    sections.push({ id: "financial", title: CATEGORY_LABEL.financial, intro: "Booking value, carrier cost and margin, collections, and how they moved through the period.", tables: [
      T({ title: "Financial summary", columns: ["Measure", "This period", "Previous period", "Change"], kinds: ["text", "money", "money", "pct"], rows: [
        ["Booking value", revenue(ship), revenue(prevShip), change(revenue(ship), revenue(prevShip)) ?? 0],
        ["Carrier cost", cost, cadOf(sum(prevShip.filter((s) => s.status !== "cancelled"), (s) => s.selected.pricing?.carrier_cost_usd ?? s.selected.price_usd)), 0],
        ["Gross margin", margin(ship), margin(prevShip), change(margin(ship), margin(prevShip)) ?? 0],
        ["Payments collected", collected(pay), collected(prevPay), change(collected(pay), collected(prevPay)) ?? 0],
        ["Outstanding", cadOf(sum(pay.filter((p) => p.status === "pending"), (p) => p.amount_usd)), cadOf(sum(prevPay.filter((p) => p.status === "pending"), (p) => p.amount_usd)), 0],
        ["Average shipment value", active.length ? Math.round(100 * revenue(ship) / active.length) / 100 : 0, prevShip.length ? Math.round(100 * revenue(prevShip) / Math.max(1, prevShip.filter((s) => s.status !== "cancelled").length)) / 100 : 0, 0],
      ].map((r) => { const [label, now, before] = r as [string, number, number]; return [label, now, before, change(now, before) ?? 0]; }),
        note: `Margin uses the carrier cost recorded on each booking. Amounts in CAD at the prototype rate of ${USD_TO_CAD} CAD per USD.` }),
      T({ title: "Revenue over time", columns: ["Period", "Booking value", "Gross margin", "Collected"], kinds: ["text", "money", "money", "money"],
        rows: buckets(from, to).map((b) => {
          const xs = ship.filter((s) => inRange(s.createdAt, b.from, b.to));
          const ps = pay.filter((p) => inRange(p.createdAt, b.from, b.to));
          return [b.label, revenue(xs), margin(xs), collected(ps)];
        }) }),
    ] });
  }

  if (want("users")) {
    const signIns = data.team.map((u) => [u, (data.signIns[u.id] ?? []).filter((r) => inRange(r.at, from, to))] as const);
    const inq = data.inquiries.filter((i) => inRange(i.at, from, to));
    sections.push({ id: "users", title: CATEGORY_LABEL.users, intro: "Staff accounts and their sign-ins, plus contact and quote requests received through the website.", tables: [
      T({ title: "Staff accounts", columns: ["Name", "Email", "Role", "Sign-ins in period", "Last sign-in"], kinds: ["text", "text", "text", "int", "text"],
        rows: signIns.map(([u, rs]) => [u.name, u.email, u.role === "admin" ? "Administrator" : "Developer", rs.length, (data.signIns[u.id] ?? [])[0] ? dayjs(data.signIns[u.id][0].at).format("YYYY-MM-DD HH:mm") : "Never"]) }),
      T({ title: "Website inquiries", columns: ["Topic", "Requests"], kinds: ["text", "int"],
        rows: groupCount(inq, (i) => i.topic ?? "other").map(([t, xs]) => [t === "quote" ? "Logistics quote" : t[0].toUpperCase() + t.slice(1), xs.length]),
        note: inq.length ? undefined : "No contact or quote requests were received in this period." }),
    ] });
  }

  if (want("system")) {
    const docs = data.documents.filter((d) => ids.has(d.shipmentId) && inRange(d.createdAt, from, to));
    const methods = data.paymentMethods.filter((m) => inRange(m.createdAt, from, to));
    sections.push({ id: "system", title: CATEGORY_LABEL.system, intro: "Platform activity: documents generated, payment methods added and how quotes were produced.", tables: [
      T({ title: "Activity", columns: ["Activity", "Count"], kinds: ["text", "int"], rows: [
        ["Shipping documents generated", docs.length],
        ["…labels", docs.filter((d) => d.type === "label").length],
        ["…customs documents", docs.filter((d) => d.type === "customs").length],
        ["…invoices", docs.filter((d) => d.type === "invoice").length],
        ["Payment methods added", methods.length],
        ["Quotes ranked by the routing engine", quotes.filter((q) => q.source === "ai-engine").length],
        ["Quotes using sample rates (engine offline)", quotes.filter((q) => q.source !== "ai-engine").length],
      ] }),
    ] });
  }

  const filtersLabel = [
    f.carriers.length ? `Carriers: ${f.carriers.join(", ")}` : "",
    f.modes.length ? `Modes: ${f.modes.map((m) => MODE_LABEL[m] ?? m).join(", ")}` : "",
    f.destinations.length ? `Destinations: ${f.destinations.join(", ")}` : "",
  ].filter(Boolean);

  return {
    title: `KILOGY ${params.periodType === "custom" ? "custom" : params.periodType} report`,
    periodLabel,
    previousLabel: `${pFrom.format("MMM D, YYYY")} – ${pTo.format("MMM D, YYYY")}`,
    from: params.from, to: params.to,
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy,
    filtersLabel: filtersLabel.length ? filtersLabel : ["All carriers, modes and destinations"],
    currency: "CAD",
    kpis, summary, sections,
  };
}

/** Value as shown in tables (preview, PDF, DOCX, CSV). XLSX keeps raw numbers instead. */
export function formatCell(v: Cell, kind: NonNullable<ReportTable["kinds"]>[number] = "text"): string {
  if (typeof v === "string") return v;
  if (kind === "money") return fmtMoney(v);
  if (kind === "pct") return `${v}%`;
  if (kind === "num") return v.toLocaleString("en-CA", { maximumFractionDigits: 1 });
  return v.toLocaleString("en-CA");
}
