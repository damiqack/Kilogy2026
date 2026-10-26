import { geoNaturalEarth1, geoPath } from "d3-geo";
import { useMemo, type ReactNode } from "react";
import { feature } from "topojson-client";
import land110 from "world-atlas/land-110m.json";

/**
 * World map drawn from Natural Earth land shapes (world-atlas), with route arcs and points.
 * Coordinates are [longitude, latitude]. Used by the dashboard, tracking page and homepage.
 */
export interface MapArc {
  from: [number, number];
  to: [number, number];
  color?: string;
  dashed?: boolean;
  width?: number;
}
export interface MapPoint {
  at: [number, number];
  color?: string;
  r?: number;
  glow?: boolean;
}

const W = 960;
const H = 500;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND = feature(land110 as any, (land110 as any).objects.land);

export function WorldMap({
  arcs = [], points = [], variant = "dark", children, label,
}: {
  arcs?: MapArc[];
  points?: MapPoint[];
  /** dark = solid continents on navy; light = pale continents on white; glow = dotted continents (homepage) */
  variant?: "dark" | "light" | "glow";
  children?: (project: (c: [number, number]) => [number, number]) => ReactNode;
  label: string;
}) {
  const { landPath, project } = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], LAND as never);
    const path = geoPath(projection);
    return {
      landPath: path(LAND as never) ?? "",
      project: (c: [number, number]) => (projection(c) ?? [0, 0]) as [number, number],
    };
  }, []);

  const arcPath = (a: MapArc) => {
    const [x1, y1] = project(a.from);
    const [x2, y2] = project(a.to);
    const dx = x2 - x1, dy = y2 - y1, dist = Math.hypot(dx, dy);
    const mx = (x1 + x2) / 2 - dy * 0.18, my = (y1 + y2) / 2 + dx * 0.18 - dist * 0.12;
    return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
  };

  const glow = variant === "glow";
  const light = variant === "light";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="kmap" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="kmap-dots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.1" fill="rgba(147,197,253,0.55)" />
        </pattern>
        <filter id="kmap-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={landPath} fill={glow ? "url(#kmap-dots)" : light ? "#e4eaf4" : "#1b3363"} stroke={glow ? "none" : light ? "#d3dceb" : "#28467f"} strokeWidth="0.6" />
      <g fill="none" strokeLinecap="round" filter={glow ? "url(#kmap-glow)" : undefined}>
        {arcs.map((a, i) => (
          <path key={i} d={arcPath(a)} stroke={a.color ?? (glow ? "#bfdbfe" : light ? "#2563eb" : "#60a5fa")} strokeWidth={a.width ?? (glow ? 1.4 : 1.6)}
            strokeDasharray={a.dashed ? "5 5" : undefined} opacity={glow ? 0.85 : 0.95} />
        ))}
      </g>
      <g filter={light ? undefined : "url(#kmap-glow)"}>
        {points.map((p, i) => {
          const [x, y] = project(p.at);
          return <circle key={i} cx={x} cy={y} r={p.r ?? 3.5} fill={p.color ?? "#93c5fd"} stroke={light ? "#fff" : "#0b1f4d"} strokeWidth={light ? 1.5 : 1} />;
        })}
      </g>
      {children?.(project)}
    </svg>
  );
}
