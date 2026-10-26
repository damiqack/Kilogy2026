import {
  AimOutlined, BankOutlined, BarChartOutlined, CalendarOutlined, CarOutlined, CodeSandboxOutlined,
  CreditCardOutlined, EnvironmentOutlined, FileSearchOutlined, FileTextOutlined, HomeOutlined,
  SafetyCertificateOutlined, SettingOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

export interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  /** true = the page is not built yet; it opens the "coming soon" page. */
  comingSoon?: boolean;
  /** Sidebar section the item is listed under. */
  group: NavGroup;
}

export type NavGroup = "Overview" | "Shipping" | "Network" | "Business";
export const NAV_GROUPS: NavGroup[] = ["Overview", "Shipping", "Network", "Business"];

/**
 * Sidebar menu, grouped by task. Add a page here and in app/routes.tsx.
 * Items marked comingSoon route to pages/ComingSoon.tsx until they are built.
 */
export const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: <HomeOutlined />, group: "Overview" },
  { path: "/tracking", label: "Tracking", icon: <EnvironmentOutlined />, group: "Overview" },
  { path: "/shipments", label: "Shipments", icon: <CodeSandboxOutlined />, group: "Shipping" },
  { path: "/quotes", label: "Quotes", icon: <FileSearchOutlined />, group: "Shipping" },
  { path: "/bookings", label: "Bookings", icon: <CalendarOutlined />, comingSoon: true, group: "Shipping" },
  { path: "/documents", label: "Documents", icon: <FileTextOutlined />, group: "Shipping" },
  { path: "/customs", label: "Customs", icon: <SafetyCertificateOutlined />, comingSoon: true, group: "Shipping" },
  { path: "/carriers", label: "Carriers", icon: <CarOutlined />, group: "Network" },
  { path: "/warehouses", label: "Warehouses", icon: <BankOutlined />, comingSoon: true, group: "Network" },
  { path: "/ai-optimization", label: "Route Optimizer", icon: <AimOutlined />, comingSoon: true, group: "Network" },
  { path: "/payments", label: "Payments", icon: <CreditCardOutlined />, group: "Business" },
  { path: "/analytics", label: "Analytics", icon: <BarChartOutlined />, group: "Business" },
];

/** Pinned to the bottom of the sidebar, below the groups. */
export const SETTINGS_ITEM = { path: "/settings", label: "Settings", icon: <SettingOutlined /> };

export const COMING_SOON = NAV_ITEMS.filter((n) => n.comingSoon);

/** The nav item a URL belongs to, e.g. /shipments/123 → /shipments. */
export function activeNavPath(pathname: string): string {
  const match = [...NAV_ITEMS, SETTINGS_ITEM].filter((n) => pathname.startsWith(n.path)).sort((a, b) => b.path.length - a.path.length)[0];
  return match?.path ?? "/dashboard";
}

/** Signed-in user shown in the header and greeting. Replace when real login exists. */
export const DEMO_USER = { name: "Yannick Nkayilu", role: "Administrator" };
