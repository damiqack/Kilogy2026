import {
  BarChart3, Bell, Code2, CreditCard, FileText, LayoutDashboard, Menu, MoreHorizontal, Package, Receipt, Search, Settings, Truck, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { aiEngineHealthy } from "../data/ai";
import { useStore } from "../data/store";

/** Information architecture from spec section 4 (8 sections + Settings). */
export const NAV = [
  { to: "/", icon: LayoutDashboard, text: "Dashboard", end: true },
  { to: "/shipments", icon: Package, text: "Shipments" },
  { to: "/quotes", icon: Receipt, text: "Quotes" },
  { to: "/carriers", icon: Truck, text: "Carriers" },
  { to: "/analytics", icon: BarChart3, text: "Analytics" },
  { to: "/documents", icon: FileText, text: "Documents" },
  { to: "/payments", icon: CreditCard, text: "Payments" },
  { to: "/settings", icon: Settings, text: "Settings" },
  { to: "/developers", icon: Code2, text: "Dev / API" },
];
const TABS = NAV.slice(0, 4); // mobile bottom tabs; the rest live under "More"

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
  const { alerts } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [more, setMore] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setExpanded(false); setMore(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setExpanded(false); setMore(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const moreActive = NAV.slice(4).some((n) => pathname.startsWith(n.to));

  return (
    <div className={`shell${expanded ? " expanded" : ""}`}>
      <a href="#main" className="skip-link">Skip to main content</a>

      <aside className="sidebar" aria-label="Primary">
        <button className="rail-toggle" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-label={expanded ? "Collapse navigation" : "Expand navigation"}>
          {expanded ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className="brand">
          <div className="brand-mark" aria-hidden>K</div>
          <span className="brand-name">KILOGY</span>
        </div>
        <nav className="nav" aria-label="Main navigation">
          {NAV.map(({ to, icon: Icon, text, end }, i) => (
            <div key={to}>
              {i === 7 && <div className="nav-divider" role="separator" />}
              <NavLink to={to} end={end} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} title={text}>
                <Icon size={19} aria-hidden /> <span className="nav-text">{text}</span>
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="sidebar-foot" role="status" aria-live="polite">
          <div className="row">
            <span className={`status-dot ${live ? "live" : "off"}`} aria-hidden />
            <span className="foot-text">AI engine: {live == null ? "checking…" : live ? "live" : "mock mode"}</span>
          </div>
          <span className="foot-text" style={{ opacity: 0.7 }}>v0.2 · CS 453 Team 2</span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="brand-mark mobile-only" aria-hidden>K</div>
          <label className="search">
            <Search size={16} aria-hidden />
            <span className="sr-only">Search</span>
            <input type="search" placeholder="Search tracking #, city, carrier…" />
          </label>
          <div className="topbar-right">
            <button className="icon-btn" aria-label={`Notifications, ${alerts.length} AI alerts`}>
              <Bell size={18} aria-hidden />
              {alerts.length > 0 && <span className="notif-dot" />}
            </button>
            <div className="avatar" role="img" aria-label="Signed in as Damian">DA</div>
          </div>
        </header>
        <main id="main" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* Mobile: bottom tab navigation replaces the sidebar (spec 5) */}
      {more && (
        <div className="more-sheet" role="dialog" aria-label="More sections">
          {NAV.slice(4).map(({ to, icon: Icon, text }) => (
            <NavLink key={to} to={to}><Icon size={20} aria-hidden /> {text}</NavLink>
          ))}
        </div>
      )}
      <nav className="tabbar" aria-label="Main navigation">
        {TABS.map(({ to, icon: Icon, text, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon size={21} aria-hidden /> {text}
          </NavLink>
        ))}
        <button className={moreActive || more ? "active" : ""} onClick={() => setMore(!more)} aria-expanded={more}>
          <MoreHorizontal size={21} aria-hidden /> More
        </button>
      </nav>
    </div>
  );
}
