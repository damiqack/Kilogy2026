import { Typography } from "antd";
import type { RouteLeg } from "../data/types";

const MODE_LABEL: Record<string, string> = { air: "Air", ocean: "Ocean", road: "Road", rail: "Rail" };
export const modeLabel = (m: string) => MODE_LABEL[m] ?? m;

/** Compact route string, e.g. "Montreal › YUL › AMS › LOS › Lagos". */
export function RouteText({ legs }: { legs: RouteLeg[] }) {
  if (!legs.length) return null;
  const stops = [legs[0].from, ...legs.map((l) => l.to)];
  return <Typography.Text className="mono" style={{ fontSize: 12 }}>{stops.join(" › ")}</Typography.Text>;
}
