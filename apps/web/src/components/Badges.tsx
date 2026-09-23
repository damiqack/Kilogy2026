import type { ShipmentStatus } from "../data/types";
import { titleCase } from "../lib/format";

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  created: "", booked: "b-blue", picked_up: "b-blue", in_transit: "b-teal", customs: "b-amber",
  out_for_delivery: "b-teal", delivered: "b-green", exception: "b-red", cancelled: "",
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{titleCase(status)}</span>;
}

export function RiskBadge({ level, score }: { level: "low" | "medium" | "high"; score?: number }) {
  const cls = level === "low" ? "b-green" : level === "medium" ? "b-amber" : "b-red";
  return (
    <span className={`badge ${cls}`}>
      {titleCase(level)} risk{score != null ? ` · ${Math.round(score * 100)}%` : ""}
    </span>
  );
}

const TAG_CLASS: Record<string, string> = { recommended: "b-teal", cheapest: "b-blue", fastest: "b-amber", greenest: "b-green" };

export function Tag({ tag }: { tag: string }) {
  return <span className={`badge ${TAG_CLASS[tag] ?? ""}`}>{titleCase(tag)}</span>;
}
