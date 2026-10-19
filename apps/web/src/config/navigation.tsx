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
}

/**
 * Sidebar menu, in the order of Kilogy's dashboard mockup. Add a page here and in app/routes.tsx.
 * Items marked comingSoon route to pages/ComingSoon.tsx until they are built.
 */
export const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: <HomeOutlined /> },
  { path: "/shipments", label: "Shipments", icon: <CodeSandboxOutlined /> },
  { path: "/quotes", label: "Quotes", icon: <FileSearchOutlined /> },
  { path: "/bookings", label: "Bookings", icon: <CalendarOutlined />, comingSoon: true },
  { path: "/carriers", label: "Carriers & Providers", icon: <CarOutlined /> },
  { path: "/ai-optimization", label: "AI Optimization", icon: <AimOutlined />, comingSoon: true },
  { path: "/tracking", label: "Tracking", icon: <EnvironmentOutlined /> },
  { path: "/warehouses", label: "Warehouses", icon: <BankOutlined />, comingSoon: true },
  { path: "/customs", label: "Customs", icon: <SafetyCertificateOutlined />, comingSoon: true },
  { path: "/documents", label: "Documents", icon: <FileTextOutlined /> },
  { path: "/payments", label: "Payments", icon: <CreditCardOutlined /> },
  { path: "/analytics", label: "Reports & Analytics", icon: <BarChartOutlined /> },
  { path: "/settings", label: "Settings", icon: <SettingOutlined /> },
];

export const COMING_SOON = NAV_ITEMS.filter((n) => n.comingSoon);

/** The nav item a URL belongs to, e.g. /shipments/123 → /shipments. */
export function activeNavPath(pathname: string): string {
  const match = NAV_ITEMS.filter((n) => pathname.startsWith(n.path)).sort((a, b) => b.path.length - a.path.length)[0];
  return match?.path ?? "/dashboard";
}

/** Signed-in user shown in the header and greeting. Replace when real login exists. */
export const DEMO_USER = { name: "Yannick Nkayilu", role: "Administrator" };
