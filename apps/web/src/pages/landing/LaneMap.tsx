/**
 * Schematic lane map: Canadian origins → transit hubs → African destinations.
 * Pure SVG, no map library. Edit the node lists to change the lanes shown.
 */

const ORIGINS = [
  { code: "YVR", name: "Vancouver" },
  { code: "YYZ", name: "Toronto" },
  { code: "YUL", name: "Montreal" },
  { code: "HAL", name: "Halifax (port)" },
];
const HUBS = [
  { code: "JFK", name: "New York" },
  { code: "LHR", name: "London" },
  { code: "AMS", name: "Amsterdam" },
  { code: "ADD", name: "Addis Ababa" },
];
const DESTS = [
  { code: "DKR", name: "Dakar" },
  { code: "ACC", name: "Accra / Tema" },
  { code: "LOS", name: "Lagos" },
  { code: "NBO", name: "Nairobi" },
  { code: "JNB", name: "Johannesburg" },
];

/** Lanes drawn as [origin, hub, destination]; the first one is highlighted. */
const LANES: [string, string, string][] = [
  ["YUL", "ADD", "ACC"],
  ["YUL", "JFK", "LOS"],
  ["YYZ", "AMS", "LOS"],
  ["YYZ", "ADD", "NBO"],
  ["YVR", "LHR", "NBO"],
  ["YVR", "AMS", "JNB"],
  ["YUL", "LHR", "DKR"],
  ["HAL", "AMS", "ACC"],
];

const W = 900, H = 340, X = [130, 440, 730];
const ys = (n: number) => Array.from({ length: n }, (_, i) => 50 + (i * (H - 100)) / Math.max(n - 1, 1));

export function LaneMap() {
  const pos: Record<string, [number, number]> = {};
  [ORIGINS, HUBS, DESTS].forEach((col, ci) => ys(col.length).forEach((y, i) => (pos[col[i].code] = [X[ci], y])));
  const curve = (a: string, b: string) => {
    const [x1, y1] = pos[a], [x2, y2] = pos[b], mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };

  return (
    <svg className="lp-lanes" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Lane map: Canadian origins route through New York, London, Amsterdam or Addis Ababa to Dakar, Accra, Lagos, Nairobi and Johannesburg">
      {["Origin", "Transit hub", "Destination"].map((t, i) => (
        <text key={t} x={X[i]} y={18} className="lp-lanes-head" textAnchor="middle">{t.toUpperCase()}</text>
      ))}
      {LANES.slice(1).map(([o, h, d]) => (
        <g key={o + h + d} className="lp-lane">
          <path d={curve(o, h)} />
          <path d={curve(h, d)} />
        </g>
      ))}
      <g className="lp-lane is-hot">
        <path d={curve(LANES[0][0], LANES[0][1])} />
        <path d={curve(LANES[0][1], LANES[0][2])} />
      </g>
      {[ORIGINS, HUBS, DESTS].map((col, ci) =>
        col.map((n) => {
          const [x, y] = pos[n.code];
          const anchor = ci === 0 ? "end" : ci === 2 ? "start" : "middle";
          const dx = ci === 0 ? -14 : ci === 2 ? 14 : 0;
          const dy = ci === 1 ? -14 : 0;
          return (
            <g key={n.code} className="lp-node">
              <rect x={x - 5} y={y - 5} width={10} height={10} />
              <text x={x + dx} y={y + dy + 4} textAnchor={anchor}>
                <tspan className="lp-node-code">{n.code}</tspan>
                <tspan className="lp-node-name" dx={6}>{n.name}</tspan>
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}
