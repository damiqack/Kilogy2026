import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  /** Icon color; the badge behind it is a 12% tint of the same color. */
  color: string;
  /** Percent change vs the previous period; omitted when there is no previous data. */
  delta?: number | null;
  /** true when a rise is bad (e.g. delays). */
  invert?: boolean;
  caption?: string;
}

export function StatCard({ label, value, icon, color, delta, invert, caption }: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  const good = invert ? !up : up;
  return (
    <div className="kstat">
      <span className="kstat-icon" style={{ color, background: `color-mix(in srgb, ${color} 12%, white)` }} aria-hidden>{icon}</span>
      <div className="kstat-body">
        <div className="kstat-label">{label}</div>
        <div className="kstat-value">{value}</div>
        {delta != null && (
          <div className={`kstat-delta ${good ? "is-good" : "is-bad"}`}>
            {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(Math.round(delta))}%
          </div>
        )}
        {caption && <div className="kstat-caption">{caption}</div>}
      </div>
    </div>
  );
}
