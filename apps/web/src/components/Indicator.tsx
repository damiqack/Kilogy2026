import type { ReactNode } from "react";

export type Tone = "success" | "warning" | "error" | "info" | "neutral";

/**
 * Status indicator: a small colored square followed by plain text.
 * The text stays in the normal text color, so contrast never depends on the tone.
 * Square colors live in global.css (.ind-*).
 */
export function Indicator({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`ind ind-${tone}`}>
      <span className="ind-mark" aria-hidden />
      {children}
    </span>
  );
}
