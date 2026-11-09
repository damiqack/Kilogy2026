import type { Location, PackageSpec, ServiceLevel, ShipmentStatus } from "../types";

/**
 * KILOGY API Integration Hub: shared types.
 *
 * The dashboards and services only ever see these shapes. Each provider connector maps its own
 * API to them, so adding a provider never changes anything outside its connector file.
 */

/** Operations a provider can support. A connector declares the ones it implements. */
export const CAPABILITIES = [
  "rates", // instant prices for a shipment
  "quotes", // bookable freight quotations with a reference and expiry
  "booking",
  "tracking",
  "schedules", // sailings, flights and departure schedules
  "documents", // labels, bills of lading, invoices, customs paperwork
  "webhooks", // pushed tracking updates
  "cancellation",
  "pickup",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export type ProviderCategory = "ocean" | "air_express" | "canadian" | "forwarding" | "platform";
export type TransportMode = "air" | "ocean" | "road" | "rail" | "parcel";

/** How KILOGY gets production access to the provider. */
export type AccessModel =
  | "self_serve" // developer account and keys, no paperwork
  | "account_required" // keys are free but live calls need a KILOGY shipping account
  | "agreement_required" // onboarding form or signed integration agreement first
  | "license_required" // paid platform licence
  | "unconfirmed"; // no public API found yet

/** Static description of a provider. Lives in the provider's own file. */
export interface ProviderManifest {
  id: string;
  name: string;
  category: ProviderCategory;
  modes: TransportMode[];
  /** ISO country codes the provider can rate and book between, or "*" for worldwide. */
  regions: string[];
  /** Countries shipments must start in, when narrower than regions (e.g. Canada Post: CA). */
  origins?: string[];
  capabilities: Capability[];
  /** Roadmap phase from the integration plan. */
  phase: 1 | 2 | 3;
  access: AccessModel;
  /** Environment variables that must be set before live calls are made. */
  credentials: string[];
  standards?: "DCSA"[];
  docsUrl?: string;
  /** Shipments this provider can take, by chargeable weight. */
  limits?: { minKg?: number; maxKg?: number };
}

export type DataSource = "sandbox" | "live";

export interface RateRequest {
  origin: Location;
  destination: Location;
  package: PackageSpec;
  mode?: TransportMode;
  services?: ServiceLevel[];
  /** ISO date the cargo is ready. */
  readyDate?: string;
}

export interface HubRate {
  providerId: string;
  providerName: string;
  service: ServiceLevel;
  serviceName: string;
  mode: TransportMode;
  amount: number;
  currency: "USD";
  transitDays: { min: number; max: number };
  /** Present when the rate is a bookable quotation. */
  quoteRef?: string;
  validUntil: string;
  source: DataSource;
}

export interface BookingRequest extends RateRequest {
  service: ServiceLevel;
  quoteRef?: string;
  /** The customer's own reference, e.g. a KILOGY shipment id. */
  reference: string;
}

export interface HubBooking {
  providerId: string;
  bookingRef: string;
  trackingRef: string;
  status: "confirmed" | "requested";
  source: DataSource;
}

export interface HubTrackingEvent {
  providerId: string;
  ref: string;
  status: ShipmentStatus;
  description: string;
  location: string;
  timestamp: string;
  /** The provider's own event code, kept for support and audits. */
  providerCode?: string;
  source: DataSource;
}

export interface ScheduleRequest {
  from: string; // UN/LOCODE or IATA code
  to: string;
  departAfter?: string;
}

export interface HubSchedule {
  providerId: string;
  mode: TransportMode;
  voyage: string;
  from: string;
  to: string;
  departs: string;
  arrives: string;
  transitDays: number;
  source: DataSource;
}

export type DocumentType = "label" | "bill_of_lading" | "commercial_invoice" | "customs_declaration";

export interface HubDocument {
  providerId: string;
  ref: string;
  type: DocumentType;
  filename: string;
  contentType: string;
  content: Buffer;
  source: DataSource;
}

export interface PickupRequest {
  bookingRef: string;
  address: Location;
  date: string;
  window?: { from: string; to: string };
}

export interface HubPickup {
  providerId: string;
  pickupRef: string;
  date: string;
  source: DataSource;
}

export interface CancelResult {
  providerId: string;
  bookingRef: string;
  cancelled: boolean;
  reason?: string;
  source: DataSource;
}

export interface WebhookInput {
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

/** What every call into a connector receives. */
export interface CallContext {
  signal: AbortSignal;
  fetch: typeof fetch;
  env: Record<string, string | undefined>;
}

/**
 * The contract every provider implements. Only the methods for the capabilities in its manifest
 * are required; the registry checks this when the connector is registered.
 */
export interface ProviderConnector {
  readonly manifest: ProviderManifest;
  /** Where each capability's data comes from right now. */
  sourceFor(capability: Capability): DataSource;
  getRates?(req: RateRequest, ctx: CallContext): Promise<HubRate[]>;
  book?(req: BookingRequest, ctx: CallContext): Promise<HubBooking>;
  track?(ref: string, ctx: CallContext): Promise<HubTrackingEvent[]>;
  getSchedules?(req: ScheduleRequest, ctx: CallContext): Promise<HubSchedule[]>;
  getDocument?(ref: string, type: DocumentType, ctx: CallContext): Promise<HubDocument>;
  cancel?(bookingRef: string, ctx: CallContext): Promise<CancelResult>;
  schedulePickup?(req: PickupRequest, ctx: CallContext): Promise<HubPickup>;
  parseWebhook?(input: WebhookInput, ctx: CallContext): Promise<HubTrackingEvent[]>;
}

/** Which connector method implements each capability. */
export const CAPABILITY_METHOD: Record<Capability, keyof ProviderConnector> = {
  rates: "getRates",
  quotes: "getRates",
  booking: "book",
  tracking: "track",
  schedules: "getSchedules",
  documents: "getDocument",
  webhooks: "parseWebhook",
  cancellation: "cancel",
  pickup: "schedulePickup",
};
