import { Plane, Ship, TrainFront, Truck } from "lucide-react";
import type { Mode, RouteLeg } from "../data/types";

export const ModeIcon = ({ mode, size = 14 }: { mode: Mode; size?: number }) =>
  mode === "air" ? <Plane size={size} /> : mode === "ocean" ? <Ship size={size} /> : mode === "rail" ? <TrainFront size={size} /> : <Truck size={size} />;

export function RouteLegs({ legs }: { legs: RouteLeg[] }) {
  return (
    <div className="legs">
      <span className="leg-chip">{legs[0]?.from}</span>
      {legs.map((l, i) => (
        <span className="row" key={i} style={{ gap: 4 }}>
          <span className="faint row" style={{ gap: 3 }} title={`${l.mode} · ${Math.round(l.distance_km)} km`}>
            — <ModeIcon mode={l.mode} size={13} /> —
          </span>
          <span className="leg-chip">{l.to}</span>
        </span>
      ))}
    </div>
  );
}
