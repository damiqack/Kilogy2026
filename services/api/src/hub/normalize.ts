import type { ShipmentStatus } from "../types";
import type { HubTrackingEvent } from "./types";

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "created", "booked", "picked_up", "in_transit", "customs", "out_for_delivery", "delivered", "exception", "cancelled",
];

/** A DCSA Track & Trace event (v2.2). Only the fields the hub reads are listed. */
export interface DcsaEvent {
  eventID?: string;
  eventType: "TRANSPORT" | "EQUIPMENT" | "SHIPMENT";
  eventClassifierCode?: "ACT" | "PLN" | "EST";
  eventDateTime: string;
  transportEventTypeCode?: string; // ARRI, DEPA
  equipmentEventTypeCode?: string; // LOAD, DISC, GTIN, GTOT, STUF, STRP, PICK, DROP
  shipmentEventTypeCode?: string; // RECE, CONF, ISSU, HOLD, RELS, ...
  equipmentReference?: string;
  eventLocation?: { locationName?: string; UNLocationCode?: string };
  transportCall?: { UNLocationCode?: string; location?: { locationName?: string; UNLocationCode?: string } };
}

const DCSA_CODES: Record<string, { status: ShipmentStatus; text: string }> = {
  "SHIPMENT:RECE": { status: "booked", text: "Booking received" },
  "SHIPMENT:CONF": { status: "booked", text: "Booking confirmed" },
  "SHIPMENT:ISSU": { status: "booked", text: "Transport document issued" },
  "SHIPMENT:HOLD": { status: "exception", text: "Shipment on hold" },
  "SHIPMENT:RELS": { status: "customs", text: "Cargo released" },
  "SHIPMENT:CANC": { status: "cancelled", text: "Booking cancelled" },
  "EQUIPMENT:STUF": { status: "picked_up", text: "Container stuffed" },
  "EQUIPMENT:GTIN": { status: "picked_up", text: "Gated in at terminal" },
  "EQUIPMENT:LOAD": { status: "in_transit", text: "Loaded on vessel" },
  "EQUIPMENT:DISC": { status: "in_transit", text: "Discharged from vessel" },
  "EQUIPMENT:GTOT": { status: "out_for_delivery", text: "Gated out for delivery" },
  "EQUIPMENT:STRP": { status: "delivered", text: "Container stripped at destination" },
  "EQUIPMENT:DROP": { status: "delivered", text: "Container dropped at consignee" },
  "TRANSPORT:DEPA": { status: "in_transit", text: "Vessel departed" },
  "TRANSPORT:ARRI": { status: "in_transit", text: "Vessel arrived" },
};

/**
 * Maps DCSA events to hub events. Planned and estimated events are skipped (they are not facts),
 * and codes the hub does not know are kept as in-transit updates with the raw code.
 */
export function fromDcsa(providerId: string, ref: string, events: DcsaEvent[]): HubTrackingEvent[] {
  return events
    .filter((e) => (e.eventClassifierCode ?? "ACT") === "ACT")
    .map((e): HubTrackingEvent => {
      const code = e.transportEventTypeCode ?? e.equipmentEventTypeCode ?? e.shipmentEventTypeCode ?? "";
      const known = DCSA_CODES[`${e.eventType}:${code}`];
      const loc = e.eventLocation ?? e.transportCall?.location;
      return {
        providerId,
        ref: e.equipmentReference ?? ref,
        status: known?.status ?? "in_transit",
        description: known?.text ?? `Carrier event ${e.eventType} ${code}`.trim(),
        location: loc?.locationName ?? loc?.UNLocationCode ?? e.transportCall?.UNLocationCode ?? "",
        timestamp: e.eventDateTime,
        providerCode: `${e.eventType}:${code}`,
        source: "live",
      };
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/** Container numbers (ISO 6346) are four letters and seven digits; anything else is a booking reference. */
export const isContainerNumber = (ref: string) => /^[A-Z]{4}\d{7}$/.test(ref.toUpperCase());
