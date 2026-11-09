import type { PackageSpec } from "../data/types";

/**
 * Package figures shown while building a quote. Couriers bill on the larger of the actual
 * weight and the volumetric weight (L × W × H in cm ÷ 5000), so a big, light box costs more
 * than its weight suggests.
 */
export const VOLUMETRIC_DIVISOR = 5000;
/** Typical courier limits (DHL, FedEx, UPS); above these a shipment goes as freight. */
export const COURIER_MAX_KG = 70;
export const COURIER_MAX_LENGTH_CM = 120;
export const COURIER_MAX_GIRTH_CM = 300;

export type SizeClass = "Envelope" | "Small parcel" | "Parcel" | "Large parcel" | "Freight";

export interface PackageFacts {
  actualKg: number;
  volumetricKg: number;
  chargeableKg: number;
  billedOn: "actual" | "volumetric";
  volumeL: number;
  longestCm: number;
  /** Length plus girth: longest side + 2 × (the other two sides) */
  lengthPlusGirthCm: number;
  sizeClass: SizeClass;
  overCourierLimits: boolean;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function packageFacts(pkg: PackageSpec): PackageFacts {
  const d = pkg.dimensions ?? { l: 1, w: 1, h: 1 };
  const sides = [d.l, d.w, d.h].sort((a, b) => b - a);
  const volumetricKg = round1((d.l * d.w * d.h) / VOLUMETRIC_DIVISOR);
  const actualKg = round1(pkg.weight_kg);
  const chargeable = Math.max(actualKg, volumetricKg);
  const lengthPlusGirthCm = sides[0] + 2 * (sides[1] + sides[2]);
  const overCourierLimits = chargeable > COURIER_MAX_KG || sides[0] > COURIER_MAX_LENGTH_CM || lengthPlusGirthCm > COURIER_MAX_GIRTH_CM;
  const sizeClass: SizeClass = overCourierLimits ? "Freight"
    : sides[2] <= 3 && actualKg <= 0.5 ? "Envelope"
    : chargeable <= 2 && sides[0] <= 40 ? "Small parcel"
    : chargeable <= 20 && sides[0] <= 80 ? "Parcel"
    : "Large parcel";
  return {
    actualKg, volumetricKg, chargeableKg: round1(chargeable), billedOn: volumetricKg > actualKg ? "volumetric" : "actual",
    volumeL: round1((d.l * d.w * d.h) / 1000), longestCm: sides[0], lengthPlusGirthCm, sizeClass, overCourierLimits,
  };
}

/** Handling notes by commodity. General guidance only; the carrier confirms at booking. */
export const COMMODITY_NOTES: Record<string, string> = {
  "Documents": "Documents usually clear customs without duties, but still need a waybill.",
  "Consumer electronics": "Devices with lithium batteries need dangerous-goods paperwork when flown.",
  "Medical supplies": "The destination may require an import permit for medical goods.",
  "Food (non-perishable)": "Food needs an ingredients list and may need a health certificate.",
  "Auto parts": "Used parts with fluids (engines, shocks) must be drained before shipping.",
  "Apparel & textiles": "List fabric content on the commercial invoice to avoid customs holds.",
};
