import type { Location, PackageSpec, ServiceLevel, TrackingEvent } from "../types";

export interface RateRequest {
  origin: Location;
  destination: Location;
  package: PackageSpec;
  services?: ServiceLevel[];
}

export interface RateResponse {
  carrier_id: string;
  carrier_name: string;
  service: ServiceLevel;
  /** Carrier's product name, e.g. "International Express". */
  service_name?: string;
  cost_usd: number;
  transit_days: number;
  mode: "air" | "ocean" | "road" | "rail";
  /** Hub the carrier routes through, e.g. "ADD" for Ethiopian via Addis Ababa. */
  via?: string;
}

export interface BookingRequest {
  shipmentId: string;
  service: ServiceLevel;
  origin: Location;
  destination: Location;
  package: PackageSpec;
}

export interface BookingResponse {
  carrierBookingId: string;
  trackingNumber: string;
}

export interface CancelResponse {
  cancelled: boolean;
  reason?: string;
}

export interface DateRange {
  earliest: string;
  latest: string;
}

/** Standard adapter every carrier integration implements (architecture section 5.1). */
export interface ICarrierAdapter {
  readonly id: string;
  readonly name: string;
  readonly coverage: string[]; // ISO country codes, or "*"
  readonly services: ServiceLevel[];
  getRates(payload: RateRequest): Promise<RateResponse[]>;
  bookShipment(payload: BookingRequest): Promise<BookingResponse>;
  trackShipment(trackingId: string): Promise<TrackingEvent[]>;
  cancelShipment(shipmentId: string): Promise<CancelResponse>;
  generateLabel(shipmentId: string): Promise<Buffer>;
  estimateDelivery(origin: Location, dest: Location): Promise<DateRange>;
}
