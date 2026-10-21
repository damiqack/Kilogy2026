/** Small dependency-free SVG charts used on the dashboard. */

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function Donut({ slices, centerValue, centerLabel, size = 190 }: { slices: Slice[]; centerValue: string; centerLabel: string; size?: number }) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = 70, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 190 190" role="img" aria-label={`${centerLabel}: ${centerValue}`}>
      <g transform="rotate(-90 95 95)">
        <circle cx="95" cy="95" r={r} fill="none" stroke="#eef2f7" strokeWidth="26" />
        {slices.map((s) => {
          const len = (s.value / total) * c;
          const el = <circle key={s.label} cx="95" cy="95" r={r} fill="none" stroke={s.color} strokeWidth="26" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
      </g>
      <text x="95" y="92" textAnchor="middle" fontSize="26" fontWeight="700" fill="#0f172a">{centerValue}</text>
      <text x="95" y="114" textAnchor="middle" fontSize="12" fill="#64748b">{centerLabel}</text>
    </svg>
  );
}

export interface Series {
  label: string;
  color: string;
  points: { x: string; y: number }[];
}

export function LineChart({ series, format, height = 200 }: { series: Series[]; format: (v: number) => string; height?: number }) {
  const W = 560, H = height, L = 52, R = 12, T = 12, B = 28;
  const xs = series[0]?.points.map((p) => p.x) ?? [];
  const all = series.flatMap((s) => s.points.map((p) => p.y));
  const max = Math.max(1, ...all) * 1.1;
  const X = (i: number) => L + (xs.length <= 1 ? 0 : (i * (W - L - R)) / (xs.length - 1));
  const Y = (v: number) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={series.map((s) => s.label).join(", ")}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="#eef2f7" />
          <text x={L - 8} y={Y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">{format(t)}</text>
        </g>
      ))}
      {xs.map((x, i) => (i % Math.ceil(xs.length / 6) === 0 || i === xs.length - 1) && (
        <text key={x} x={X(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">{x}</text>
      ))}
      {series.map((s) => (
        <g key={s.label}>
          <polyline fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" points={s.points.map((p, i) => `${X(i)},${Y(p.y)}`).join(" ")} />
          {s.points.map((p, i) => <circle key={i} cx={X(i)} cy={Y(p.y)} r="3" fill="#fff" stroke={s.color} strokeWidth="2" />)}
        </g>
      ))}
    </svg>
  );
}

/** Horizontal progress bar with a percentage label. */
export function Progress({ value, color = "#2563eb" }: { value: number; color?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <span className="kprogress" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={`${v}% complete`}>
      <span className="kprogress-track"><span className="kprogress-fill" style={{ width: `${v}%`, background: color }} /></span>
      <span className="kprogress-label">{v}%</span>
    </span>
  );
}
