import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import type { CSSProperties, ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  /** Accent color: the bar along the top of the card and the icon tint. */
  color: string;
  /** Percent change vs the previous period; omitted when there is no previous data. */
  delta?: number | null;
  /** true when a rise is bad (e.g. delays). */
  invert?: boolean;
  caption?: string;
}

/** Metric card: label and icon on top, the number, then the change and a caption. */
export function StatCard({ label, value, icon, color, delta, invert, caption }: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  const good = invert ? !up : up;
  return (
    <div className="kstat" style={{ "--accent": color } as CSSProperties}>
      <div className="kstat-top">
        <span className="kstat-label">{label}</span>
        <span className="kstat-icon" aria-hidden>{icon}</span>
      </div>
      <div className="kstat-value">{value}</div>
      {(delta != null || caption) && (
        <div className="kstat-foot">
          {delta != null && (
            <span className={`kstat-delta ${good ? "is-good" : "is-bad"}`}>
              {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{Math.abs(Math.round(delta))}%
            </span>
          )}
          {caption && <span>{caption}</span>}
        </div>
      )}
    </div>
  );
}
