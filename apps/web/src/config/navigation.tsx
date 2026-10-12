import {
  ApiOutlined, AppstoreOutlined, BarChartOutlined, CarOutlined, CreditCardOutlined,
  FileTextOutlined, FileSearchOutlined, InboxOutlined, SettingOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

export interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

/** Sidebar sections (Kilogy UI/UX spec, section 4). Add a page here and in app/routes.tsx. */
export const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Dashboard", icon: <AppstoreOutlined /> },
  { path: "/shipments", label: "Shipments", icon: <InboxOutlined /> },
  { path: "/quotes", label: "Quotes", icon: <FileSearchOutlined /> },
  { path: "/carriers", label: "Carriers", icon: <CarOutlined /> },
  { path: "/analytics", label: "Analytics", icon: <BarChartOutlined /> },
  { path: "/documents", label: "Documents", icon: <FileTextOutlined /> },
  { path: "/payments", label: "Payments", icon: <CreditCardOutlined /> },
  { path: "/settings", label: "Settings", icon: <SettingOutlined /> },
  { path: "/developers", label: "Dev / API", icon: <ApiOutlined /> },
];

/** The nav item a URL belongs to, e.g. /shipments/123 → /shipments. */
export function activeNavPath(pathname: string): string {
  const match = NAV_ITEMS.filter((n) => n.path !== "/" && pathname.startsWith(n.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.path ?? "/";
}
