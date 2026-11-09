import { Button } from "antd";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FOOTER_COLUMNS, FOOTER_LANES, LEGAL_LINKS, NAV } from "../pages/landing/content";
import { KilogyLogo } from "./KilogyLogo";

/** Scrolls to the top on page change, or to the #section in the URL when there is one. */
export function useScrollOnNavigate() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" }), 50);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
}

/** Top navigation for the public site. On the homepage it sits over the hero photo. */
export function PublicHeader({ overHero = false }: { overHero?: boolean }) {
  const navigate = useNavigate();
  const header = (
    <header className="lp-nav lp-wrap">
      <Link to="/" aria-label="Kilogy home page"><KilogyLogo onDark height={38} /></Link>
      <nav aria-label="Main">
        {NAV.map((n) => <Link key={n.label} to={`/${n.href}`}>{n.label}</Link>)}
      </nav>
      <div className="lp-nav-actions">
        <Button type="primary" onClick={() => navigate("/shipments/new")}>Get a quote</Button>
      </div>
    </header>
  );
  return overHero ? header : <div className="pub-bar">{header}</div>;
}

/** Footer for the public site: brand, link columns and legal links. */
export function PublicFooter() {
  return (
    <footer className="lp-foot">
      <div className="lp-wrap lp-foot-top">
        <div className="lp-foot-brand">
          <Link to="/" aria-label="Kilogy home page"><KilogyLogo onDark height={34} /></Link>
          <p>One platform. Every carrier. Every shipment.</p>
          <p className="lp-foot-lanes"><span>Lanes we focus on</span>{FOOTER_LANES}</p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2>{col.title}</h2>
            <ul>
              {col.links.map((l) => <li key={l.label}><Link to={l.to}>{l.label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="lp-wrap">
        <div className="lp-foot-bottom">
          <span>© {new Date().getFullYear()} Kilogy. All rights reserved.</span>
          <nav aria-label="Legal" className="lp-foot-legal">
            {LEGAL_LINKS.map((l) => <Link key={l.label} to={l.to}>{l.label}</Link>)}
          </nav>
        </div>
      </div>
    </footer>
  );
}
