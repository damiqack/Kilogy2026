import type { Carrier, Location, Mode, PackageSpec, ServiceLevel } from "./types";

export const CARRIERS: Carrier[] = [
  { id: "dhl", name: "DHL Express", services: ["express", "standard"], modes: ["air", "road"], coverage: "220+ countries", onTime: 0.94, avgCo2PerKg: 5.4, status: "sandbox" },
  { id: "fedex", name: "FedEx International", services: ["express", "standard", "economy"], modes: ["air", "road"], coverage: "220+ countries", onTime: 0.92, avgCo2PerKg: 5.6, status: "sandbox" },
  { id: "ups", name: "UPS Worldwide", services: ["express", "standard", "economy"], modes: ["air", "ocean", "road"], coverage: "200+ countries", onTime: 0.91, avgCo2PerKg: 4.1, status: "sandbox" },
  { id: "canadapost", name: "Canada Post", services: ["standard", "economy"], modes: ["air", "ocean", "road"], coverage: "Canada + intl partners", onTime: 0.86, avgCo2PerKg: 2.9, status: "sandbox" },
  { id: "maersk", name: "Maersk (LCL ocean)", services: ["economy"], modes: ["ocean", "road"], coverage: "Global ports", onTime: 0.83, avgCo2PerKg: 0.4, status: "planned" },
  { id: "gig", name: "GIG Logistics", services: ["standard"], modes: ["road"], coverage: "Nigeria / West Africa last mile", onTime: 0.88, avgCo2PerKg: 0.6, status: "planned" },
];

export const carrierName = (id: string) => CARRIERS.find((c) => c.id === id)?.name ?? id;

export interface CarrierRate {
  carrier_id: string;
  carrier_name: string;
  service: ServiceLevel;
  cost_usd: number;
  transit_days: number;
  mode: Mode;
}

// Rough great-circle distance between known countries, used only for mock rate generation.
const CENTROIDS: Record<string, [number, number]> = {
  CA: [45.5, -73.6], US: [40.7, -74.0], MX: [19.4, -99.1], GB: [51.5, -0.1], FR: [48.9, 2.4],
  DE: [50.1, 8.7], NL: [52.4, 4.9], NG: [6.5, 3.4], GH: [5.6, -0.2], KE: [-1.3, 36.8],
  ZA: [-26.2, 28.0], EG: [30.0, 31.2], AE: [25.2, 55.3], IN: [19.1, 72.9], CN: [31.2, 121.5],
  JP: [35.7, 139.7], AU: [-33.9, 151.2], BR: [-23.6, -46.6], SG: [1.35, 103.8], HK: [22.3, 114.2],
};

export function approxDistanceKm(a: Location, b: Location): number {
  const p = CENTROIDS[a.country] ?? [0, 0];
  const q = CENTROIDS[b.country] ?? [0, 0];
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(q[0] - p[0]);
  const dLon = toRad(q[1] - p[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p[0])) * Math.cos(toRad(q[0])) * Math.sin(dLon / 2) ** 2;
  return Math.max(300, 2 * 6371 * Math.asin(Math.sqrt(h)));
}

export function chargeableKg(pkg: PackageSpec): number {
  const d = pkg.dimensions;
  const vol = d ? (d.l * d.w * d.h) / 5000 : 0;
  return Math.max(pkg.weight_kg, vol);
}

/**
 * Mock Carrier Gateway: what the ICarrierAdapter implementations will return once wired to real
 * carrier sandboxes. Deterministic per carrier so the UI is stable between reloads.
 */
export function mockCarrierRates(origin: Location, destination: Location, pkg: PackageSpec): CarrierRate[] {
  const km = approxDistanceKm(origin, destination);
  const kg = chargeableKg(pkg);
  const intl = origin.country !== destination.country;
  const rates: CarrierRate[] = [];
  const profile: Record<string, { mult: number; speed: number }> = {
    dhl: { mult: 1.12, speed: 0.9 }, fedex: { mult: 1.05, speed: 1.0 },
    ups: { mult: 1.0, speed: 1.05 }, canadapost: { mult: 0.82, speed: 1.35 },
  };
  for (const c of CARRIERS.filter((c) => c.status !== "planned")) {
    if (c.id === "canadapost" && origin.country !== "CA") continue;
    const p = profile[c.id];
    for (const s of c.services) {
      let base: number, days: number, mode: Mode;
      if (s === "express") {
        base = 28 + kg * km * 0.00062; days = (intl ? 2.5 : 1) + km / 6000; mode = "air";
      } else if (s === "standard") {
        base = 18 + kg * km * 0.00041; days = (intl ? 5 : 2.5) + km / 3000; mode = intl ? "air" : "road";
      } else {
        const ocean = intl && km > 3000 && c.modes.includes("ocean");
        base = 12 + kg * km * (ocean ? 0.00012 : 0.00028);
        days = ocean ? 18 + km / 900 : (intl ? 9 : 5) + km / 2000;
        mode = ocean ? "ocean" : intl ? "air" : "road";
      }
      rates.push({
        carrier_id: c.id, carrier_name: c.name, service: s,
        cost_usd: Math.round(base * p.mult * 100) / 100,
        transit_days: Math.round(days * p.speed * 10) / 10,
        mode,
      });
    }
  }
  return rates;
}

export const EMISSION_FACTORS: Record<Mode, number> = { air: 602, ocean: 16, road: 62, rail: 22 };
