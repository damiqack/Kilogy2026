// Shapes mirror the /api/v1 contract in docs/ARCHITECTURE.md and services/api/src/types.ts.

export interface Location {
  country: string;
  city?: string;
  postalCode?: string;
}

export interface PackageSpec {
  weight_kg: number;
  dimensions?: { l: number; w: number; h: number };
  description?: string;
  value_usd?: number;
}

export type ServiceLevel = "express" | "standard" | "economy";
export type Mode = "air" | "ocean" | "road" | "rail";

export interface Preferences {
  cost: number;
  speed: number;
  carbon: number;
  reliability: number;
}

export interface QuoteRequest {
  origin: Location;
  destination: Location;
  package: PackageSpec;
  service_type: ServiceLevel[];
  ai_optimize: boolean;
  preferences: Preferences;
}

export interface RouteLeg {
  from: string;
  to: string;
  mode: Mode;
  distance_km: number;
  transit_hours: number;
  cost_usd?: number;
  co2_kg: number;
}

export interface RankedOption {
  rank: number;
  carrier_id: string;
  carrier_name: string;
  service: ServiceLevel;
  service_name?: string; // carrier's product name, e.g. "International Express"
  price_usd: number;
  transit_days: number;
  co2_kg: number | null;
  reliability: number;
  ai_score: number;
  ai_scores: { cost: number; speed: number; carbon: number; reliability: number };
  tags?: string[];
  route: { summary: string; primary_mode: Mode; legs: RouteLeg[] } | null;
  risk: { score: number; level: "low" | "medium" | "high"; eta: { earliest: string; latest: string }; factors: { factor: string; impact: number }[] };
  pricing: { carrier_cost_usd: number; margin_pct: number };
}

export interface Quote {
  id: string;
  createdAt: string;
  request: QuoteRequest;
  options: RankedOption[];
  chargeable_weight_kg: number;
  source: "ai-engine" | "mock";
}

export type ShipmentStatus =
  | "created" | "booked" | "picked_up" | "in_transit" | "customs"
  | "out_for_delivery" | "delivered" | "delayed" | "exception" | "cancelled";

/** One row of the tracking timeline (spec 3.4). Upcoming steps carry an estimated time. */
export interface TimelineStep {
  title: string;
  location: string;
  time: string;
  state: "done" | "current" | "upcoming" | "issue";
}

export interface Shipment {
  id: string;
  /** KILOGY tracking ID, format KLG-YYYYMMDD-NNN */
  trackingId: string;
  createdAt: string;
  status: ShipmentStatus;
  origin: Location;
  destination: Location;
  package: PackageSpec;
  selected: RankedOption;
  /** The carrier's own tracking number */
  carrierTracking: string;
  timeline: TimelineStep[];
  deliveredAt?: string;
  street?: { origin?: string; destination?: string };
  commodity?: string;
}

export interface Carrier {
  id: string;
  name: string;
  services: ServiceLevel[];
  modes: Mode[];
  coverage: string;
  onTime: number;
  avgCo2PerKg: number;
  status: "connected" | "sandbox" | "planned";
  apiLatencyMs?: number;
}

export interface AiAlert {
  id: string;
  severity: "warning" | "critical" | "info";
  title: string;
  detail: string;
  recommendation?: string;
  cta?: { label: string; to: string };
}

export interface DocumentRecord {
  id: string;
  type: "customs" | "invoice" | "label";
  shipmentId: string;
  filename: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  shipmentId: string;
  amount_usd: number;
  status: "succeeded" | "pending" | "failed";
  method: string;
  createdAt: string;
}
