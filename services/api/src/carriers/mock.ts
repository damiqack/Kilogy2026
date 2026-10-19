import { newId } from "../lib/ids";
import type { Location, PackageSpec, ServiceLevel, TrackingEvent } from "../types";
import type {
  BookingRequest, BookingResponse, CancelResponse, DateRange, ICarrierAdapter, RateRequest, RateResponse,
} from "./types";

/**
 * Mock carrier adapters. They return believable, deterministic rates so the API works end to end
 * before any carrier sandbox is connected. A real adapter (e.g. DHL) implements the same
 * ICarrierAdapter interface and replaces its mock in carriers/index.ts.
 */

type Mode = RateResponse["mode"];

// Rough country centroids, used only to size mock prices and transit times.
const CENTROIDS: Record<string, [number, number]> = {
  CA: [45.5, -73.6], US: [40.7, -74.0], MX: [19.4, -99.1], GB: [51.5, -0.1], FR: [48.9, 2.4],
  DE: [50.1, 8.7], NL: [52.4, 4.9], NG: [6.5, 3.4], GH: [5.6, -0.2], KE: [-1.3, 36.8],
  ZA: [-26.2, 28.0], SN: [14.7, -17.5], ET: [9.0, 38.7], EG: [30.0, 31.2], AE: [25.2, 55.3],
  IN: [19.1, 72.9], CN: [31.2, 121.5],
};

export function approxDistanceKm(a: Location, b: Location): number {
  const p = CENTROIDS[a.country] ?? [0, 0];
  const q = CENTROIDS[b.country] ?? [0, 0];
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(q[0] - p[0]) / 2) ** 2 +
    Math.cos(rad(p[0])) * Math.cos(rad(q[0])) * Math.sin(rad(q[1] - p[1]) / 2) ** 2;
  return Math.max(300, 2 * 6371 * Math.asin(Math.sqrt(h)));
}

/** Billable weight: the greater of actual weight and volumetric weight (L×W×H / 5000). */
export function chargeableKg(pkg: PackageSpec): number {
  const d = pkg.dimensions;
  return Math.max(pkg.weight_kg, d ? (d.l * d.w * d.h) / 5000 : 0);
}

const AFRICA = new Set(["NG", "GH", "KE", "ZA", "EG", "ET", "SN"]);

interface MockProfile {
  id: string;
  name: string;
  services: ServiceLevel[];
  serviceNames: Partial<Record<ServiceLevel, string>>;
  priceMultiplier: number;
  speedMultiplier: number;
  ocean: boolean;
  via?: string;
  /** Lanes the carrier serves; false = skip this request. */
  serves: (origin: Location, destination: Location) => boolean;
}

export class MockCarrierAdapter implements ICarrierAdapter {
  readonly id: string;
  readonly name: string;
  readonly coverage = ["*"];
  readonly services: ServiceLevel[];

  constructor(private profile: MockProfile) {
    this.id = profile.id;
    this.name = profile.name;
    this.services = profile.services;
  }

  async getRates({ origin, destination, package: pkg, services }: RateRequest): Promise<RateResponse[]> {
    const p = this.profile;
    if (!p.serves(origin, destination)) return [];
    const km = approxDistanceKm(origin, destination);
    const kg = chargeableKg(pkg);
    const intl = origin.country !== destination.country;
    const wanted = p.services.filter((s) => !services || services.includes(s));

    return wanted.map((service) => {
      let base: number, days: number, mode: Mode;
      if (service === "express") {
        base = 28 + kg * km * 0.00062;
        days = (intl ? 2.5 : 1) + km / 6000;
        mode = "air";
      } else if (service === "standard") {
        base = 18 + kg * km * 0.00041;
        days = (intl ? 5 : 2.5) + km / 3000;
        mode = intl ? "air" : "road";
      } else {
        const ocean = intl && km > 3000 && p.ocean;
        base = 12 + kg * km * (ocean ? 0.00012 : 0.00028);
        days = ocean ? 18 + km / 900 : (intl ? 9 : 5) + km / 2000;
        mode = ocean ? "ocean" : intl ? "air" : "road";
      }
      if (p.via) days = (intl ? 4 : 2) + km / 6000;

      return {
        carrier_id: p.id,
        carrier_name: p.name,
        service,
        service_name: p.serviceNames[service] ?? service,
        cost_usd: Math.round(base * p.priceMultiplier * 100) / 100,
        transit_days: Math.round(days * p.speedMultiplier * 10) / 10,
        mode,
        ...(p.via ? { via: p.via } : {}),
      };
    });
  }

  async bookShipment(_req: BookingRequest): Promise<BookingResponse> {
    return {
      carrierBookingId: newId(`${this.id}_bk`),
      trackingNumber: `${this.id.toUpperCase()}${Math.floor(1e9 + Math.random() * 9e9)}`,
    };
  }

  async trackShipment(_trackingId: string): Promise<TrackingEvent[]> {
    return [];
  }

  async cancelShipment(_shipmentId: string): Promise<CancelResponse> {
    return { cancelled: true };
  }

  async generateLabel(shipmentId: string): Promise<Buffer> {
    return Buffer.from(`Mock ${this.name} label for ${shipmentId}\n`);
  }

  async estimateDelivery(origin: Location, dest: Location): Promise<DateRange> {
    const days = Math.ceil(5 + approxDistanceKm(origin, dest) / 3000);
    const at = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
    return { earliest: at(days), latest: at(days + 2) };
  }
}

const anywhere = () => true;

export const MOCK_CARRIERS: MockCarrierAdapter[] = [
  new MockCarrierAdapter({
    id: "dhl", name: "DHL Express", services: ["express", "standard"],
    serviceNames: { express: "International Express", standard: "Economy Select" },
    priceMultiplier: 1.12, speedMultiplier: 0.9, ocean: false, serves: anywhere,
  }),
  new MockCarrierAdapter({
    id: "fedex", name: "FedEx International", services: ["express", "standard", "economy"],
    serviceNames: { express: "International Priority", standard: "International Economy", economy: "International Connect" },
    priceMultiplier: 1.05, speedMultiplier: 1.0, ocean: false, serves: anywhere,
  }),
  new MockCarrierAdapter({
    id: "ups", name: "UPS Worldwide", services: ["express", "standard", "economy"],
    serviceNames: { express: "UPS Express", standard: "UPS Expedited", economy: "UPS Standard" },
    priceMultiplier: 1.0, speedMultiplier: 1.05, ocean: true, serves: anywhere,
  }),
  new MockCarrierAdapter({
    id: "ethiopian", name: "Ethiopian Air Cargo", services: ["standard"],
    serviceNames: { standard: "Air Freight" },
    priceMultiplier: 0.72, speedMultiplier: 1.0, ocean: false, via: "ADD",
    serves: (_o, d) => AFRICA.has(d.country),
  }),
  new MockCarrierAdapter({
    id: "canadapost", name: "Canada Post", services: ["standard", "economy"],
    serviceNames: { standard: "Tracked Packet International", economy: "International Surface" },
    priceMultiplier: 0.82, speedMultiplier: 1.35, ocean: true,
    serves: (o) => o.country === "CA",
  }),
];
