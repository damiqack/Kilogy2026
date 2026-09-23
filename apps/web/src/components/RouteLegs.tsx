import { Plane, Ship, TrainFront, Truck } from "lucide-react";
import type { Mode, RouteLeg } from "../data/types";

export const ModeIcon = ({ mode, size = 15 }: { mode: Mode; size?: number }) => {
  const props = { size, "aria-hidden": true as const };
  return mode === "air" ? <Plane {...props} /> : mode === "ocean" ? <Ship {...props} /> : mode === "rail" ? <TrainFront {...props} /> : <Truck {...props} />;
};

export function RouteLegs({ legs }: { legs: RouteLeg[] }) {
  return (
    <div className="legs" aria-label={`Route: ${[legs[0]?.from, ...legs.map((l) => l.to)].join(" to ")}`}>
      <span className="leg-chip">{legs[0]?.from}</span>
      {legs.map((l, i) => (
        <span className="row" key={i} style={{ gap: 6 }}>
          <span className="faint row" style={{ gap: 3 }} title={`${l.mode} · ${Math.round(l.distance_km)} km`}>
            <ModeIcon mode={l.mode} size={13} />
          </span>
          <span className="leg-chip">{l.to}</span>
        </span>
      ))}
    </div>
  );
}
