import type { ShipmentStatus } from "../data/types";
import { Indicator, type Tone } from "./Indicator";

const STATUS: Record<ShipmentStatus, { tone: Tone; label: string }> = {
  created: { tone: "neutral", label: "Created" },
  booked: { tone: "info", label: "Booked" },
  picked_up: { tone: "info", label: "Picked up" },
  in_transit: { tone: "info", label: "In transit" },
  customs: { tone: "warning", label: "In customs" },
  out_for_delivery: { tone: "info", label: "Out for delivery" },
  delivered: { tone: "success", label: "Delivered" },
  delayed: { tone: "warning", label: "Delayed" },
  exception: { tone: "error", label: "Exception" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

export const statusLabel = (s: ShipmentStatus) => STATUS[s].label;

export function StatusTag({ status }: { status: ShipmentStatus }) {
  return <Indicator tone={STATUS[status].tone}>{STATUS[status].label}</Indicator>;
}

export function RiskTag({ level, score }: { level: "low" | "medium" | "high"; score?: number }) {
  const tone: Tone = level === "low" ? "success" : level === "medium" ? "warning" : "error";
  return <Indicator tone={tone}>{level.charAt(0).toUpperCase() + level.slice(1)}{score != null ? ` ${Math.round(score * 100)}` : ""}</Indicator>;
}
