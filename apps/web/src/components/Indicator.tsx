import type { ReactNode } from "react";

export type Tone = "success" | "warning" | "error" | "info" | "neutral";

/**
 * Status pill (soft background, colored dot and text) as in Kilogy's mockups.
 * Colors live in global.css (.pill-*); text colors meet WCAG AA on their backgrounds.
 */
export function Indicator({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`pill pill-${tone}`}>
      <span className="pill-dot" aria-hidden />
      {children}
    </span>
  );
}
