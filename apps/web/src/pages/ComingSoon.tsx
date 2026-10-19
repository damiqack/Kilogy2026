import { Button, Result } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../config/navigation";

const EXTRA: Record<string, string> = { "/assistant": "AI Logistics Assistant" };

/** Placeholder for menu items in Kilogy's mockups that are not built yet (see config/navigation.tsx). */
export function ComingSoonPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const name = NAV_ITEMS.find((n) => n.path === pathname)?.label ?? EXTRA[pathname] ?? "This page";
  return (
    <div className="kcard" style={{ padding: 32 }}>
      <Result
        status="info"
        title={`${name} is coming soon`}
        subTitle="This page is part of the Kilogy design and is planned for a later sprint."
        extra={<Button type="primary" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>}
      />
    </div>
  );
}
