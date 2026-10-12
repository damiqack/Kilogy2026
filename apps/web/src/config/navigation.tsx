export interface NavItem {
  path: string;
  label: string;
  /** "main" items sit in the top bar; "utility" items sit at the right edge. */
  group: "main" | "utility";
}

/** Top navigation (Kilogy UI/UX spec, section 4). Add a page here and in app/routes.tsx. */
export const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Overview", group: "main" },
  { path: "/shipments", label: "Shipments", group: "main" },
  { path: "/quotes", label: "Quotes", group: "main" },
  { path: "/carriers", label: "Carriers", group: "main" },
  { path: "/analytics", label: "Analytics", group: "main" },
  { path: "/documents", label: "Documents", group: "main" },
  { path: "/payments", label: "Payments", group: "main" },
  { path: "/developers", label: "API", group: "utility" },
  { path: "/settings", label: "Settings", group: "utility" },
];

/** The nav item a URL belongs to, e.g. /shipments/123 → /shipments. The public homepage (/) is not in the app nav. */
export function activeNavPath(pathname: string): string {
  const match = NAV_ITEMS.filter((n) => pathname.startsWith(n.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.path ?? "/dashboard";
}
