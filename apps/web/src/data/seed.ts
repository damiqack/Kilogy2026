import { hubName, serviceName } from "./carriers";
import type { AiAlert, DocumentRecord, Location, Mode, Payment, RankedOption, ServiceLevel, Shipment, ShipmentStatus, TimelineStep } from "./types";

// Sample data so every screen has something to show. All shipments and numbers are fictional.

const DAY = 864e5;
const at = (daysFromNow: number, hour = 9, min = 0) => {
  const d = new Date(Date.now() + daysFromNow * DAY);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};
const isoDate = (daysFromNow: number) => at(daysFromNow, 12).slice(0, 10);

/** KILOGY tracking ID: KLG-YYYYMMDD-NNN */
export function trackingId(createdAt: string, seq: number) {
  const d = new Date(createdAt);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `KLG-${ymd}-${String(seq).padStart(3, "0")}`;
}

interface SeedSpec {
  seq: number;
  status: ShipmentStatus;
  origin: Location;
  dest: Location;
  carrier: [string, string];
  service: ServiceLevel;
  mode: Mode;
  hubs: string[];
  priceUsd: number;
  days: number;
  co2: number;
  kg: number;
  createdDaysAgo: number;
  risk: number;
  timeline: [string, string, number, TimelineStep["state"]][]; // title, location, day offset, state
}

function option(s: SeedSpec): RankedOption {
  const { origin: o, dest: d, hubs } = s;
  const legs = [
    { from: o.city!, to: hubs[0], mode: "road" as const, distance_km: 30, transit_hours: 2.5, co2_kg: 0.02 },
    ...hubs.slice(1).map((h, i) => ({ from: hubs[i], to: h, mode: s.mode, distance_km: 5200, transit_hours: 9, co2_kg: +(s.co2 / (hubs.length - 1)).toFixed(2) })),
    { from: hubs[hubs.length - 1], to: d.city!, mode: "road" as const, distance_km: 25, transit_hours: 3, co2_kg: 0.02 },
  ];
  const level = s.risk < 0.25 ? "low" : s.risk < 0.55 ? "medium" : "high";
  return {
    rank: 1, carrier_id: s.carrier[0], carrier_name: s.carrier[1], service: s.service, service_name: serviceName(s.carrier[0], s.service),
    price_usd: s.priceUsd, transit_days: s.days, co2_kg: s.co2, reliability: 0.92, ai_score: Math.round(97 - s.risk * 20),
    ai_scores: { cost: 74, speed: 88, carbon: s.mode === "ocean" ? 96 : 42, reliability: 92 },
    tags: ["recommended"],
    route: { summary: [o.city, ...hubs, d.city].join(" → "), primary_mode: s.mode, legs },
    risk: {
      score: s.risk, level,
      eta: { earliest: isoDate(-s.createdDaysAgo + s.days), latest: isoDate(-s.createdDaysAgo + s.days + (level === "low" ? 0 : 2)) },
      factors: [{ factor: "weather", impact: 0.45 }, { factor: "customs_clearance", impact: 0.35 }, { factor: "handoffs", impact: 0.2 }],
    },
    pricing: { carrier_cost_usd: +(s.priceUsd / 1.18).toFixed(2), margin_pct: 18 },
  };
}

function build(s: SeedSpec): Shipment {
  const createdAt = at(-s.createdDaysAgo, 8, 30);
  const t0 = +new Date(createdAt);
  const timeline: TimelineStep[] = s.timeline.map(([title, location, off, state]) => {
    // Completed steps can't be in the future; round to 5 minutes for realistic timestamps.
    const t = Math.min(t0 + off * DAY, state === "upcoming" ? Infinity : Date.now() - 20 * 60e3);
    return { title, location, state, time: new Date(Math.round(t / 3e5) * 3e5).toISOString() };
  });
  const last = timeline.filter((t) => t.state === "done").pop();
  return {
    id: `shp_seed${s.seq}`, trackingId: trackingId(createdAt, s.seq), createdAt, status: s.status,
    origin: s.origin, destination: s.dest, commodity: "Consumer electronics accessories",
    package: { weight_kg: s.kg, dimensions: { l: 40, w: 30, h: 25 }, description: "Consumer electronics accessories", value_usd: 450 },
    selected: option(s), carrierTracking: `${s.carrier[0].toUpperCase()}${4820019300 + s.seq * 7919}`,
    timeline, deliveredAt: s.status === "delivered" ? last?.time : undefined,
  };
}

const C = {
  MTL: { country: "CA", city: "Montreal" }, TOR: { country: "CA", city: "Toronto" }, VAN: { country: "CA", city: "Vancouver" },
  OTT: { country: "CA", city: "Ottawa" }, CAL: { country: "CA", city: "Calgary" },
  LOS: { country: "NG", city: "Lagos" }, ABV: { country: "NG", city: "Abuja" }, ACC: { country: "GH", city: "Accra" },
  NBO: { country: "KE", city: "Nairobi" }, DKR: { country: "SN", city: "Dakar" }, JNB: { country: "ZA", city: "Johannesburg" },
};
const DHL: [string, string] = ["dhl", "DHL Express"];
const FDX: [string, string] = ["fedex", "FedEx International"];
const UPS: [string, string] = ["ups", "UPS Worldwide"];
const ETH: [string, string] = ["ethiopian", "Ethiopian Air Cargo"];
const CPC: [string, string] = ["canadapost", "Canada Post"];

/** Standard air timeline: pickup → origin hub → gateway departures → arrival → delivery. */
function airTimeline(o: Location, d: Location, hubs: string[], days: number, progress: number, issueAt?: number): SeedSpec["timeline"] {
  const steps: [string, string][] = [
    ["Package picked up", `${o.city} Depot`],
    ...hubs.slice(0, -1).map((h, i): [string, string] => [i === 0 ? "Departed" : "In transit", hubName(h)]),
    ["Customs cleared", hubName(hubs[hubs.length - 1])],
    ["Arriving", hubName(hubs[hubs.length - 1])],
    ["Out for delivery", d.city!],
    ["Final delivery", d.city!],
  ];
  return steps.map(([t, loc], i) => {
    const off = (days * i) / (steps.length - 1);
    const state: TimelineStep["state"] = issueAt === i ? "issue" : i < progress ? "done" : i === progress ? "current" : "upcoming";
    const title = state === "issue" ? `${t}: delayed` : t;
    return [title, loc, off, state];
  });
}

const SPECS: SeedSpec[] = [
  // The four rows from the spec wireframe (3.1) come first.
  { seq: 1, status: "in_transit", origin: C.MTL, dest: C.LOS, carrier: DHL, service: "express", mode: "air", hubs: ["YUL", "YYZ", "AMS", "LOS"], priceUsd: 181, days: 4, co2: 58.1, kg: 10, createdDaysAgo: 1.2, risk: 0.12,
    timeline: [
      ["Package picked up", "Montreal Depot", 0, "done"], ["Customs cleared", "Toronto Hub", 0.4, "done"],
      ["Departed", "Toronto Pearson (YYZ)", 0.75, "done"], ["In transit", "Amsterdam Hub (AMS)", 1.2, "current"],
      ["Arriving", "Lagos Murtala Airport", 3, "upcoming"], ["Final delivery", "Lagos", 4, "upcoming"],
    ] },
  { seq: 2, status: "in_transit", origin: C.TOR, dest: C.ACC, carrier: ETH, service: "standard", mode: "air", hubs: ["YYZ", "ADD", "ACC"], priceUsd: 138, days: 6, co2: 61.4, kg: 12, createdDaysAgo: 2, risk: 0.18, timeline: [] },
  { seq: 3, status: "delayed", origin: C.VAN, dest: C.NBO, carrier: FDX, service: "express", mode: "air", hubs: ["YVR", "YYZ", "LHR", "NBO"], priceUsd: 214, days: 5, co2: 79.2, kg: 11, createdDaysAgo: 3, risk: 0.58, timeline: [] },
  { seq: 4, status: "delivered", origin: C.OTT, dest: C.DKR, carrier: UPS, service: "express", mode: "air", hubs: ["YUL", "CDG", "DKR"], priceUsd: 197, days: 4, co2: 44.6, kg: 8, createdDaysAgo: 7, risk: 0.1, timeline: [] },
  { seq: 5, status: "customs", origin: C.TOR, dest: C.LOS, carrier: DHL, service: "standard", mode: "air", hubs: ["YYZ", "FRA", "LOS"], priceUsd: 128, days: 6, co2: 44.2, kg: 7, createdDaysAgo: 4, risk: 0.34, timeline: [] },
  { seq: 6, status: "exception", origin: C.MTL, dest: C.ABV, carrier: UPS, service: "standard", mode: "air", hubs: ["YUL", "JFK", "LOS"], priceUsd: 133, days: 7, co2: 46.8, kg: 9, createdDaysAgo: 5, risk: 0.62, timeline: [] },
  { seq: 7, status: "delivered", origin: C.MTL, dest: C.ACC, carrier: CPC, service: "economy", mode: "ocean", hubs: ["HAL", "TEM"], priceUsd: 96, days: 24, co2: 3.1, kg: 42, createdDaysAgo: 27, risk: 0.2, timeline: [] },
  { seq: 8, status: "out_for_delivery", origin: C.CAL, dest: C.JNB, carrier: FDX, service: "standard", mode: "air", hubs: ["YVR", "FRA", "JNB"], priceUsd: 176, days: 6, co2: 70.3, kg: 10, createdDaysAgo: 5.6, risk: 0.16, timeline: [] },
  { seq: 9, status: "picked_up", origin: C.TOR, dest: C.NBO, carrier: ETH, service: "standard", mode: "air", hubs: ["YYZ", "ADD", "NBO"], priceUsd: 151, days: 6, co2: 66.9, kg: 12, createdDaysAgo: 0.3, risk: 0.14, timeline: [] },
  { seq: 10, status: "delivered", origin: C.MTL, dest: C.LOS, carrier: DHL, service: "express", mode: "air", hubs: ["YUL", "AMS", "LOS"], priceUsd: 176, days: 4, co2: 55.2, kg: 9, createdDaysAgo: 4, risk: 0.12, timeline: [] },
  { seq: 11, status: "booked", origin: C.OTT, dest: C.ACC, carrier: UPS, service: "standard", mode: "air", hubs: ["YUL", "JFK", "ACC"], priceUsd: 142, days: 7, co2: 49.6, kg: 8, createdDaysAgo: 0.1, risk: 0.2, timeline: [] },
  { seq: 12, status: "in_transit", origin: C.VAN, dest: C.LOS, carrier: FDX, service: "express", mode: "air", hubs: ["YVR", "YYZ", "LHR", "LOS"], priceUsd: 226, days: 5, co2: 82.4, kg: 12, createdDaysAgo: 2.1, risk: 0.22, timeline: [] },
];

const PROGRESS: Partial<Record<ShipmentStatus, number>> = {
  booked: -1, picked_up: 0, in_transit: 2, customs: 3, out_for_delivery: 5, delivered: 99, delayed: 2, exception: 3,
};

export function seedShipments(): Shipment[] {
  return SPECS.map((s) => {
    if (s.timeline.length) return build(s);
    const issue = s.status === "delayed" ? 2 : s.status === "exception" ? 3 : undefined;
    const steps = airTimeline(s.origin, s.dest, s.hubs, s.days, PROGRESS[s.status] ?? 0, issue);
    const tl = s.status === "booked" ? [["Shipment booked", `${s.origin.city}`, 0, "current"] as SeedSpec["timeline"][number], ...steps.map((x) => [x[0], x[1], x[2] + 0.3, "upcoming"] as SeedSpec["timeline"][number])] : steps;
    return build({ ...s, timeline: tl });
  });
}

export function seedAlerts(): AiAlert[] {
  return [
    {
      id: "al_1", severity: "warning",
      title: "Weather delay risk on Montreal–Lagos route (72 hrs).",
      detail: "Storm system over the Gulf of Guinea is forecast to disrupt Lagos arrivals.",
      recommendation: "Recommended alternate: Air via Addis Ababa.",
      cta: { label: "Compare alternate", to: "/shipments/new?from=CA:Montreal&to=NG:Lagos" },
    },
    {
      id: "al_2", severity: "critical",
      title: "Customs hold in Abuja.",
      detail: "Commercial invoice requested before release. Predicted delay: 2–3 days.",
      cta: { label: "Generate invoice", to: "/documents" },
    },
    {
      id: "al_3", severity: "info",
      title: "Switch non-urgent Canada → Ghana freight to ocean via Halifax → Tema.",
      detail: "About 95% less CO₂ and 40% cheaper, with 3 extra weeks in transit.",
    },
  ];
}

export function seedPayments(): Payment[] {
  return seedShipments().map((s, i) => ({
    id: `pay_seed${i + 1}`, shipmentId: s.id, amount_usd: s.selected.price_usd,
    status: s.status === "exception" ? "pending" : "succeeded", method: i % 2 ? "Visa •••• 4242" : "Invoice (Net 30)", createdAt: s.createdAt,
  }));
}

export function seedDocuments(): DocumentRecord[] {
  return seedShipments().flatMap((s, i) => {
    const docs: DocumentRecord[] = [{ id: `doc_l${i}`, type: "label", shipmentId: s.id, filename: `label-${s.trackingId}.pdf`, createdAt: s.createdAt }];
    if (i % 2 === 0) docs.push({ id: `doc_c${i}`, type: "customs", shipmentId: s.id, filename: `customs-${s.trackingId}.pdf`, createdAt: s.createdAt });
    if (s.status === "delivered") docs.push({ id: `doc_i${i}`, type: "invoice", shipmentId: s.id, filename: `invoice-${s.trackingId}.pdf`, createdAt: s.createdAt });
    return docs;
  });
}
