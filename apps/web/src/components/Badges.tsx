import type { ShipmentStatus } from "../data/types";
import { titleCase } from "../lib/format";

const STATUS: Record<ShipmentStatus, [string, string]> = {
  created: ["b-neutral", "Created"], booked: ["b-accent", "Booked"], picked_up: ["b-accent", "Picked Up"],
  in_transit: ["b-accent", "In Transit"], customs: ["b-warning", "In Customs"], out_for_delivery: ["b-accent", "Out for Delivery"],
  delivered: ["b-success", "Delivered"], delayed: ["b-warning", "Delayed"], exception: ["b-error", "Incident"], cancelled: ["b-neutral", "Cancelled"],
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const [cls, label] = STATUS[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

/** Risk shown as LEVEL (score/100), per spec 3.4. */
export function RiskBadge({ level, score }: { level: "low" | "medium" | "high"; score?: number }) {
  const cls = level === "low" ? "b-success" : level === "medium" ? "b-warning" : "b-error";
  return (
    <span className={`badge ${cls}`} aria-label={`AI risk ${level}${score != null ? `, ${Math.round(score * 100)} out of 100` : ""}`}>
      {level.toUpperCase()}{score != null ? ` (${Math.round(score * 100)}/100)` : ""}
    </span>
  );
}

const TAG_CLASS: Record<string, string> = { recommended: "b-accent", cheapest: "b-success", fastest: "b-warning", greenest: "b-success" };

export function Tag({ tag }: { tag: string }) {
  return <span className={`badge plain ${TAG_CLASS[tag] ?? "b-neutral"}`}>{titleCase(tag)}</span>;
}
