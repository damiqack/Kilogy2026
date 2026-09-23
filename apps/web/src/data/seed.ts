import type { DocumentRecord, Location, Mode, Payment, RankedOption, ServiceLevel, Shipment, ShipmentStatus, TrackingEvent } from "./types";

// Sample data so every screen has something to show. All names and numbers are fictional.

const day = 864e5;
const ago = (d: number) => new Date(Date.now() - d * day).toISOString();
const ahead = (d: number) => new Date(Date.now() + d * day).toISOString().slice(0, 10);

function option(carrier_id: string, carrier_name: string, service: ServiceLevel, mode: Mode, price: number, days: number, co2: number, o: Location, d: Location, hub1: string, hub2: string): RankedOption {
  return {
    rank: 1, carrier_id, carrier_name, service, price_usd: price, transit_days: days, co2_kg: co2,
    reliability: 0.9, ai_score: 78,
    ai_scores: { cost: 70, speed: 80, carbon: mode === "ocean" ? 95 : 40, reliability: 90 },
    tags: ["recommended"],
    route: {
      summary: `${o.city} → ${hub1} → ${hub2} → ${d.city}`, primary_mode: mode,
      legs: [
        { from: o.city!, to: hub1, mode: "road", distance_km: 30, transit_hours: 2.5, co2_kg: 0.02 },
        { from: hub1, to: hub2, mode, distance_km: mode === "ocean" ? 9800 : 8900, transit_hours: days * 20, co2_kg: co2 },
        { from: hub2, to: d.city!, mode: "road", distance_km: 25, transit_hours: 3, co2_kg: 0.02 },
      ],
    },
    risk: { score: 0.18, level: "low", eta: { earliest: ahead(2), latest: ahead(4) }, factors: [{ factor: "customs_clearance", impact: 0.5 }] },
    pricing: { carrier_cost_usd: +(price / 1.18).toFixed(2), margin_pct: 18 },
  };
}

const MTL = { country: "CA", city: "Montreal" };
const TOR = { country: "CA", city: "Toronto" };
const LON = { country: "CA", city: "London" };
const LOS = { country: "NG", city: "Lagos" };
const ACC = { country: "GH", city: "Accra" };
const NBO = { country: "KE", city: "Nairobi" };
const ABJ = { country: "NG", city: "Abuja" };

const FLOW: ShipmentStatus[] = ["created", "booked", "picked_up", "in_transit", "customs", "out_for_delivery", "delivered"];
const DESC: Record<ShipmentStatus, string> = {
  created: "Shipment created", booked: "Booked with carrier", picked_up: "Picked up from shipper",
  in_transit: "Departed origin gateway", customs: "Arrived at destination customs", out_for_delivery: "Out for delivery",
  delivered: "Delivered", exception: "Customs hold: documents requested", cancelled: "Cancelled",
};

function events(status: ShipmentStatus, o: Location, d: Location, startDaysAgo: number): TrackingEvent[] {
  const upto = status === "exception" ? FLOW.indexOf("customs") : FLOW.indexOf(status);
  const out: TrackingEvent[] = FLOW.slice(0, upto + 1).map((s, i) => ({
    status: s, description: DESC[s], location: i < 4 ? o.city! : d.city!,
    timestamp: ago(Math.max(0, startDaysAgo - i * (startDaysAgo / Math.max(upto, 1)))),
  }));
  if (status === "exception") out.push({ status: "exception", description: DESC.exception, location: d.city!, timestamp: ago(0.3) });
  return out;
}

function ship(i: number, ref: string, status: ShipmentStatus, o: Location, d: Location, opt: RankedOption, kg: number, started: number): Shipment {
  return {
    id: `shp_seed${i}`, reference: ref, createdAt: ago(started), status, origin: o, destination: d,
    package: { weight_kg: kg, dimensions: { l: 40, w: 30, h: 25 }, description: "Consumer electronics accessories", value_usd: 450 },
    selected: opt, trackingNumber: `${opt.carrier_id.toUpperCase()}${4820019300 + i * 7919}`,
    events: events(status, o, d, started),
  };
}

export function seedShipments(): Shipment[] {
  return [
    ship(1, "KG-240118", "in_transit", MTL, LOS, option("dhl", "DHL Express", "express", "air", 186.4, 3.2, 58.1, MTL, LOS, "JFK", "LOS"), 10, 1.5),
    ship(2, "KG-240121", "customs", TOR, ACC, option("fedex", "FedEx International", "standard", "air", 142.9, 5.8, 49.6, TOR, ACC, "YYZ", "ACC"), 8, 4),
    ship(3, "KG-240125", "delivered", MTL, ACC, option("ups", "UPS Worldwide", "economy", "ocean", 96.2, 24, 3.1, MTL, ACC, "HAL", "TEM"), 42, 26),
    ship(4, "KG-240130", "exception", LON, LOS, option("dhl", "DHL Express", "standard", "air", 128.0, 6.1, 44.2, LON, LOS, "YYZ", "LOS"), 7, 6),
    ship(5, "KG-240133", "booked", TOR, NBO, option("fedex", "FedEx International", "express", "air", 204.7, 3.9, 71.3, TOR, NBO, "YYZ", "NBO"), 12, 0.4),
    ship(6, "KG-240136", "out_for_delivery", MTL, ABJ, option("ups", "UPS Worldwide", "standard", "air", 133.5, 6.4, 46.8, MTL, ABJ, "JFK", "LOS"), 9, 5.5),
    ship(7, "KG-240140", "delivered", MTL, LOS, option("canadapost", "Canada Post", "economy", "ocean", 71.9, 27, 2.4, MTL, LOS, "HAL", "LOS"), 30, 31),
    ship(8, "KG-240142", "picked_up", TOR, ACC, option("dhl", "DHL Express", "express", "air", 171.2, 3.4, 52.7, TOR, ACC, "YYZ", "ACC"), 9, 0.8),
  ];
}

export function seedPayments(): Payment[] {
  return seedShipments().map((s, i) => ({
    id: `pay_seed${i + 1}`, shipmentId: s.id, amount_usd: s.selected.price_usd,
    status: i === 3 ? "pending" : "succeeded", method: i % 2 ? "Visa •••• 4242" : "Invoice (Net 30)", createdAt: s.createdAt,
  }));
}

export function seedDocuments(): DocumentRecord[] {
  return seedShipments().flatMap((s, i) => {
    const docs: DocumentRecord[] = [{ id: `doc_l${i}`, type: "label", shipmentId: s.id, filename: `label-${s.reference}.pdf`, createdAt: s.createdAt }];
    if (i % 2 === 0) docs.push({ id: `doc_c${i}`, type: "customs", shipmentId: s.id, filename: `customs-${s.reference}.pdf`, createdAt: s.createdAt });
    if (s.status === "delivered") docs.push({ id: `doc_i${i}`, type: "invoice", shipmentId: s.id, filename: `invoice-${s.reference}.pdf`, createdAt: s.createdAt });
    return docs;
  });
}
