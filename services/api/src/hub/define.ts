import type { ServiceLevel, ShipmentStatus } from "../types";
import { addDays, chargeableKg, round2, simplePdf, stableHash } from "./sandbox";
import {
  CAPABILITY_METHOD, type BookingRequest, type CallContext, type Capability, type DataSource, type DocumentType,
  type HubRate, type HubTrackingEvent, type ProviderConnector, type ProviderManifest, type RateRequest,
  type TransportMode, type WebhookInput,
} from "./types";
import { SHIPMENT_STATUSES } from "./normalize";

/** A service the provider sells, used to price sandbox rates. */
export interface SandboxService {
  service: ServiceLevel;
  name: string;
  mode: TransportMode;
  baseUsd: number;
  perKgUsd: number;
  transit: [min: number, max: number];
}

type LiveMethods = Partial<Pick<ProviderConnector,
  "getRates" | "book" | "track" | "getSchedules" | "getDocument" | "cancel" | "schedulePickup" | "parseWebhook">>;

export interface ProviderSpec {
  manifest: ProviderManifest;
  /** Short code used in sandbox references, e.g. "MAEU" for Maersk. */
  refPrefix: string;
  sandbox: { services: SandboxService[] };
  /** Real API calls. Each one is used once every variable in manifest.credentials is set. */
  live?: (env: Record<string, string | undefined>) => LiveMethods;
}

/** A provider as it is listed in providers/index.ts: its manifest plus a way to connect it. */
export interface ProviderDefinition {
  manifest: ProviderManifest;
  connect(env: Record<string, string | undefined>): ProviderConnector;
}

const TRACK_STEPS: Record<string, { status: ShipmentStatus; text: string }[]> = {
  ocean: [
    { status: "booked", text: "Booking confirmed" },
    { status: "picked_up", text: "Full container gated in at origin terminal" },
    { status: "in_transit", text: "Loaded on vessel and departed" },
    { status: "in_transit", text: "Arrived at port of discharge" },
    { status: "customs", text: "Import customs clearance" },
    { status: "delivered", text: "Container delivered to consignee" },
  ],
  parcel: [
    { status: "booked", text: "Shipment information received" },
    { status: "picked_up", text: "Picked up" },
    { status: "in_transit", text: "Departed origin facility" },
    { status: "customs", text: "Clearance processing complete" },
    { status: "out_for_delivery", text: "Out for delivery" },
    { status: "delivered", text: "Delivered" },
  ],
};

/**
 * Builds a provider definition from its spec. Every declared capability gets a working sandbox
 * implementation; a live implementation replaces it once the provider's credentials are set.
 */
export function defineProvider(spec: ProviderSpec): ProviderDefinition {
  const { manifest: m, refPrefix } = spec;
  const ref = (kind: string, seed: string) => `${refPrefix}-${kind}${String(stableHash(`${m.id}:${seed}`) % 10_000_000).padStart(7, "0")}`;
  const isOcean = m.category === "ocean" || m.category === "forwarding";

  const sandbox: Required<LiveMethods> = {
    async getRates(req: RateRequest) {
      const kg = chargeableKg(req.package);
      const intl = req.origin.country !== req.destination.country;
      const lane = `${req.origin.country}-${req.origin.city ?? ""}>${req.destination.country}-${req.destination.city ?? ""}`;
      const quoted = m.capabilities.includes("quotes");
      return spec.sandbox.services
        .filter((s) => (!req.services || req.services.includes(s.service)) && (!req.mode || req.mode === s.mode))
        .map((s): HubRate => {
          const factor = 0.85 + (stableHash(`${m.id}:${s.service}:${lane}`) % 40) / 100;
          return {
            providerId: m.id,
            providerName: m.name,
            service: s.service,
            serviceName: s.name,
            mode: s.mode,
            amount: round2((s.baseUsd + s.perKgUsd * kg) * (intl ? 1 : 0.55) * factor),
            currency: "USD",
            transitDays: { min: intl ? s.transit[0] : Math.max(1, Math.round(s.transit[0] / 2)), max: intl ? s.transit[1] : Math.max(1, Math.round(s.transit[1] / 2)) },
            quoteRef: quoted ? ref("Q", `${lane}:${s.service}:${kg}`) : undefined,
            validUntil: addDays(new Date(), quoted ? 7 : 1).toISOString(),
            source: "sandbox",
          };
        });
    },
    async book(req: BookingRequest) {
      return {
        providerId: m.id,
        bookingRef: ref("B", req.reference),
        trackingRef: ref("T", req.reference),
        status: isOcean ? "requested" : "confirmed",
        source: "sandbox",
      };
    },
    async track(trackingRef: string) {
      const steps = isOcean ? TRACK_STEPS.ocean : TRACK_STEPS.parcel;
      const reached = 1 + (stableHash(trackingRef) % steps.length);
      const spacing = isOcean ? 4 : 1;
      const now = Date.now();
      return steps.slice(0, reached).map((s, i): HubTrackingEvent => ({
        providerId: m.id,
        ref: trackingRef,
        status: s.status,
        description: s.text,
        location: i === 0 ? "Origin" : i >= reached - 1 && reached === steps.length ? "Destination" : "In network",
        timestamp: new Date(now - (reached - 1 - i) * spacing * 86_400_000).toISOString(),
        source: "sandbox",
      }));
    },
    async getSchedules(req) {
      const start = req.departAfter ? new Date(req.departAfter) : new Date();
      const s = spec.sandbox.services[0];
      const transit = Math.round((s.transit[0] + s.transit[1]) / 2);
      const offset = stableHash(`${m.id}:${req.from}:${req.to}`) % 7;
      return [0, 1, 2].map((week) => {
        const departs = addDays(start, offset + week * 7);
        return {
          providerId: m.id,
          mode: s.mode,
          voyage: `${refPrefix}${100 + ((stableHash(req.from + req.to) + week) % 900)}`,
          from: req.from,
          to: req.to,
          departs: departs.toISOString(),
          arrives: addDays(departs, transit).toISOString(),
          transitDays: transit,
          source: "sandbox" as DataSource,
        };
      });
    },
    async getDocument(docRef: string, type: DocumentType) {
      const title = { label: "Shipping label", bill_of_lading: "Bill of lading", commercial_invoice: "Commercial invoice", customs_declaration: "Customs declaration" }[type];
      return {
        providerId: m.id,
        ref: docRef,
        type,
        filename: `${m.id}-${type}-${docRef}.pdf`,
        contentType: "application/pdf",
        content: simplePdf([`${m.name} - ${title}`, `Reference: ${docRef}`, "SANDBOX DOCUMENT - not valid for shipping"]),
        source: "sandbox",
      };
    },
    async cancel(bookingRef: string) {
      return { providerId: m.id, bookingRef, cancelled: true, source: "sandbox" };
    },
    async schedulePickup(req) {
      return { providerId: m.id, pickupRef: ref("P", `${req.bookingRef}:${req.date}`), date: req.date, source: "sandbox" };
    },
    /** Sandbox webhooks use KILOGY's own event shape: { events: [{ ref, status, description, location, timestamp }] }. */
    async parseWebhook(input: WebhookInput) {
      const body = input.body as { events?: unknown[] } | null;
      const list = Array.isArray(body?.events) ? body.events : body ? [body] : [];
      return list.flatMap((e): HubTrackingEvent[] => {
        const x = e as Record<string, unknown>;
        if (typeof x.ref !== "string" || !SHIPMENT_STATUSES.includes(x.status as ShipmentStatus)) return [];
        return [{
          providerId: m.id,
          ref: x.ref,
          status: x.status as ShipmentStatus,
          description: String(x.description ?? x.status),
          location: String(x.location ?? ""),
          timestamp: typeof x.timestamp === "string" ? x.timestamp : new Date().toISOString(),
          source: "sandbox",
        }];
      });
    },
  };

  return {
    manifest: m,
    connect(env) {
      const ready = m.credentials.length > 0 && m.credentials.every((k) => !!env[k]);
      const live: LiveMethods = ready && spec.live ? spec.live(env) : {};
      const sourceFor = (cap: Capability): DataSource => (live[CAPABILITY_METHOD[cap] as keyof LiveMethods] ? "live" : "sandbox");
      const connector: ProviderConnector = { manifest: m, sourceFor };
      const target = connector as unknown as Record<string, unknown>;
      for (const cap of m.capabilities) {
        const method = CAPABILITY_METHOD[cap] as keyof LiveMethods;
        target[method] = live[method] ?? sandbox[method];
      }
      return connector;
    },
  };
}

export type { CallContext };
