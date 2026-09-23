import type { Tenanted } from "./lib/store";

export interface Location {
  country: string;
  city?: string;
  postalCode?: string;
  address?: string;
}

export interface Dimensions {
  l: number;
  w: number;
  h: number;
}

export interface PackageSpec {
  weight_kg: number;
  dimensions?: Dimensions;
  description?: string;
  value_usd?: number;
  hs_code?: string;
}

export type ServiceLevel = "express" | "standard" | "economy";

export interface RankedOption {
  rank: number;
  carrier_id: string;
  carrier_name: string;
  service: ServiceLevel;
  price_usd: number;
  currency: string;
  transit_days: number;
  co2_kg: number | null;
  reliability: number;
  ai_score: number;
  ai_scores: Record<string, number>;
  tags?: string[];
  route: { summary: string; primary_mode: string; legs: unknown[] } | null;
  risk: { score: number; level: string; eta: { earliest: string; latest: string }; factors: unknown[] };
  pricing: { carrier_cost_usd: number; margin_pct: number };
}

export interface Quote extends Tenanted {
  origin: Location;
  destination: Location;
  package: PackageSpec;
  options: RankedOption[];
  chargeable_weight_kg: number;
  expiresAt: string;
  status: "open" | "booked" | "expired";
  shipmentId?: string;
  ai_optimized: boolean;
}

export type ShipmentStatus =
  | "created"
  | "booked"
  | "picked_up"
  | "in_transit"
  | "customs"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "cancelled";

export interface TrackingEvent {
  status: ShipmentStatus;
  description: string;
  location: string;
  timestamp: string;
}

export interface Shipment extends Tenanted {
  status: ShipmentStatus;
  origin: Location;
  destination: Location;
  package: PackageSpec;
  reference?: string;
  quoteId?: string;
  selected?: RankedOption;
  carrierId?: string;
  carrierBookingId?: string;
  trackingNumber?: string;
  labelDocumentId?: string;
  events: TrackingEvent[];
}

export interface DocumentRecord extends Tenanted {
  type: "customs" | "invoice" | "label";
  shipmentId?: string;
  filename: string;
  contentType: string;
  content: Buffer;
  meta?: Record<string, unknown>;
}

export interface Payment extends Tenanted {
  shipmentId?: string;
  amount_usd: number;
  currency: string;
  status: "succeeded" | "failed" | "pending";
  provider: string;
  providerChargeId?: string;
  method: { type: string; last4?: string };
  failureReason?: string;
}
