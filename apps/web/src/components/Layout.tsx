import {
  BarChart3, Boxes, Code2, CreditCard, FileText, LayoutDashboard, Layers, PackagePlus, Search, Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { aiEngineHealthy } from "../data/ai";

const NAV = [
  { label: "Operate", items: [
    { to: "/", icon: LayoutDashboard, text: "Dashboard", end: true },
    { to: "/quotes/new", icon: PackagePlus, text: "New quote" },
    { to: "/shipments", icon: Boxes, text: "Shipments" },
  ] },
  { label: "Network", items: [
    { to: "/carriers", icon: Truck, text: "Carriers" },
    { to: "/analytics", icon: BarChart3, text: "Analytics" },
  ] },
  { label: "Finance", items: [
    { to: "/documents", icon: FileText, text: "Documents" },
    { to: "/payments", icon: CreditCard, text: "Payments" },
  ] },
  { label: "Build", items: [
    { to: "/developers", icon: Code2, text: "Developer portal" },
    { to: "/system", icon: Layers, text: "System architecture" },
  ] },
];

export function useAiStatus() {
  const [live, setLive] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    const check = () => aiEngineHealthy().then((ok) => alive && setLive(ok));
    check();
    const t = setInterval(check, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return live;
}

export function Layout() {
  const live = useAiStatus();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">K</div>
          <div>
            <div className="brand-name">KILOGY</div>
            <div className="brand-sub">Logistics OS · prototype</div>
          </div>
        </div>
        {NAV.map((g) => (
          <nav className="nav-group" key={g.label}>
            <div className="nav-label">{g.label}</div>
            {g.items.map(({ to, icon: Icon, text, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                <Icon size={16} /> {text}
              </NavLink>
            ))}
          </nav>
        ))}
        <div className="sidebar-foot">
          <div className="row"><span className={`status-dot ${live ? "ok" : "wip"}`} /> AI engine: {live == null ? "checking…" : live ? "live" : "mock mode"}</div>
          <div style={{ marginTop: 4 }}>v0.1 · CS 453 Team 2</div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="search"><Search size={15} /><input placeholder="Search shipments, tracking numbers, references…" /></div>
          <div className="topbar-right">
            <span className="badge b-teal">Pro tier</span>
            <div className="avatar">DA</div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
