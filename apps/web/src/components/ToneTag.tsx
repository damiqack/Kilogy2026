import { Tag } from "antd";
import type { ReactNode } from "react";

export type Tone = "success" | "warning" | "error" | "info" | "neutral";

/**
 * Status tag with text colors that meet WCAG AA contrast in light and dark mode.
 * Colors live in global.css (.tone-*), so they can be changed in one place.
 */
export function ToneTag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <Tag className={`tone tone-${tone}`}>{children}</Tag>;
}
