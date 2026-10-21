import {
  ApiOutlined, AppstoreOutlined, ArrowRightOutlined, BulbOutlined, CalendarOutlined, DesktopOutlined, DownOutlined,
  EnvironmentOutlined, EyeOutlined, GlobalOutlined, SafetyCertificateOutlined, SettingOutlined, StarFilled,
} from "@ant-design/icons";
import { Button, DatePicker, Input, Select } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KilogyLogo } from "../../components/KilogyLogo";
import { ModeIcon } from "../../components/ModeIcon";
import { WorldMap } from "../../components/WorldMap";
import { COORDS } from "../../config/geo";
import { isDelayed, isDelivered, isInTransit } from "../../data/insights";
import { useStore } from "../../data/store";
import { BAND, CARGO_TYPES, DESTINATIONS, FEATURES, HERO, NAV, ORIGINS, PARTNERS, RATE_SAMPLE } from "./content";
import "./landing.css";

const FEATURE_ICONS = [<ModeIcon key="m" mode="ocean" size={26} />, <BulbOutlined key="b" />, <GlobalOutlined key="g" />, <EyeOutlined key="e" />, <SafetyCertificateOutlined key="s" />, <AppstoreOutlined key="a" />];
const BAND_ICONS = [<ApiOutlined key="a" />, <BulbOutlined key="b" />, <DesktopOutlined key="d" />, <SettingOutlined key="s" />];

// Bright arcs for the hero map: a web of major trade lanes.
const HUBS = ["Montreal", "Toronto", "New York", "London", "Rotterdam", "Dubai", "Shanghai", "Lagos", "Kinshasa", "Johannesburg", "Nairobi", "Vancouver", "Istanbul"];
const LANES: [string, string][] = [
  ["Montreal", "Kinshasa"], ["Montreal", "Lagos"], ["Toronto", "London"], ["New York", "Rotterdam"], ["London", "Dubai"],
  ["Dubai", "Shanghai"], ["Rotterdam", "Lagos"], ["Dubai", "Nairobi"], ["Shanghai", "Johannesburg"], ["Vancouver", "Shanghai"],
  ["Istanbul", "Kinshasa"], ["New York", "Lagos"], ["London", "Johannesburg"],
];

/** Public homepage at "/", matched to Kilogy's homepage mockup. */
export function LandingPage() {
  const navigate = useNavigate();
  const { shipments } = useStore();
  const [from, setFrom] = useState(ORIGINS[0].value);
  const [to, setTo] = useState(DESTINATIONS[0].value);
  const [cargo, setCargo] = useState(CARGO_TYPES[0]);
  const [weight, setWeight] = useState("500 kg / 3 m³");
  const [when, setWhen] = useState(dayjs().add(3, "day"));
  const findOptions = () => navigate(`/shipments/new?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

  const active = shipments.filter((s) => !isDelivered(s) && s.status !== "cancelled");
  const onTime = shipments.length ? (100 * shipments.filter((s) => !isDelayed(s)).length) / shipments.length : 100;
  const tracked = shipments.find(isInTransit) ?? shipments[0];

  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-hero-map" aria-hidden>
          <WorldMap variant="glow" label="Trade lanes"
            arcs={LANES.map(([a, b]) => ({ from: COORDS[a], to: COORDS[b] }))}
            points={HUBS.map((h) => ({ at: COORDS[h], color: "#e0f2fe", r: 3 }))} />
        </div>

        <header className="lp-nav lp-wrap">
          <Link to="/" aria-label="Kilogy home page"><KilogyLogo onDark height={46} /></Link>
          <nav aria-label="Main">
            {NAV.map((n, i) => (
              <a key={n} href={n === "Platform" ? "#platform" : n === "Integrations" ? "#partners" : "#features"}>{n}{i < 5 && i !== 2 && i !== 5 ? <DownOutlined /> : null}</a>
            ))}
          </nav>
          <div className="lp-nav-actions">
            <Button ghost size="large" onClick={() => navigate("/dashboard")}>Login</Button>
            <Button type="primary" size="large" onClick={() => navigate("/shipments/new")}>Get Started</Button>
          </div>
        </header>

        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            <h1>{HERO.title[0]}<br />{HERO.title[1]}<span>{HERO.title[2]}</span><br /><span>{HERO.title[3]}</span></h1>
            <p>{HERO.body}</p>
            <div className="lp-hero-ctas">
              <Button type="primary" size="large" onClick={() => navigate("/shipments/new")}>Request a Demo <ArrowRightOutlined /></Button>
              <Button ghost size="large" onClick={() => navigate("/dashboard")}>Explore Platform</Button>
            </div>
          </div>

          <form className="lp-advisor" aria-label="AI Logistics Advisor" onSubmit={(e) => { e.preventDefault(); findOptions(); }}>
            <h2><StarFilled /> AI Logistics Advisor</h2>
            <p>Find the optimal logistics solution</p>
            <label className="lp-field"><span>From</span><Select aria-label="From" value={from} onChange={setFrom} options={ORIGINS} variant="borderless" suffixIcon={<EnvironmentOutlined />} /></label>
            <label className="lp-field"><span>To</span><Select aria-label="To" value={to} onChange={setTo} options={DESTINATIONS} variant="borderless" suffixIcon={<EnvironmentOutlined />} /></label>
            <label className="lp-field"><span>Cargo Type</span><Select aria-label="Cargo type" value={cargo} onChange={setCargo} options={CARGO_TYPES.map((c) => ({ value: c, label: c }))} variant="borderless" /></label>
            <label className="lp-field"><span>Weight / Volume</span><Input aria-label="Weight and volume" value={weight} onChange={(e) => setWeight(e.target.value)} variant="borderless" /></label>
            <label className="lp-field"><span>Preferred Date</span><DatePicker aria-label="Preferred date" value={when} onChange={(d) => d && setWhen(d)} format="D MMM YYYY" variant="borderless" allowClear={false} suffixIcon={<CalendarOutlined />} /></label>
            <Button type="primary" htmlType="submit" size="large" block>Find Best Options <ArrowRightOutlined /></Button>
          </form>
        </div>
      </section>

      <section className="lp-wrap lp-features" id="features" aria-label="Capabilities">
        {FEATURES.map((f, i) => (
          <div key={f.title}><span className="lp-fico">{FEATURE_ICONS[i]}</span><div><b>{f.title}</b><span>{f.body}</span></div></div>
        ))}
      </section>

      <section className="lp-wrap lp-cards" id="platform">
        <article className="lp-card lp-card-dark">
          <div className="lp-card-head"><h3>Live Shipment Overview</h3><Link to="/tracking">View All</Link></div>
          <div className="lp-stats">
            <div><b>{shipments.length}</b><span>Total Shipments</span></div>
            <div><b>{active.length}</b><span>In Transit</span></div>
            <div><b>{shipments.filter(isDelayed).length}</b><span>Delayed</span></div>
            <div><b>{onTime.toFixed(1)}%</b><span>On-Time Delivery</span></div>
          </div>
          <div className="lp-minimap" aria-hidden>
            <WorldMap variant="glow" label="Active shipment lanes"
              arcs={LANES.slice(0, 8).map(([a, b]) => ({ from: COORDS[a], to: COORDS[b] }))}
              points={HUBS.map((h) => ({ at: COORDS[h], color: "#e0f2fe", r: 3 }))} />
          </div>
        </article>

        <article className="lp-card">
          <div className="lp-card-head"><h3>Smart Rate Comparison</h3><Link to="/shipments/new">View All</Link></div>
          <ul className="lp-rates">
            {RATE_SAMPLE.map((r) => (
              <li key={r.name}>
                <span className="lp-rate-ico">{r.modes.map((m) => <ModeIcon key={m} mode={m} size={20} />)}</span>
                <div className="lp-rate-name"><b>{r.name}</b><small>Transit Time</small><span>{r.transit}</span></div>
                <div><small>Price</small><span>{r.price}</span></div>
                <div><small>Reliability</small><span>{r.reliability}</span></div>
                <Button type="primary" size="small" onClick={() => navigate("/shipments/new")}>Select</Button>
              </li>
            ))}
          </ul>
          <Link to="/shipments/new" className="lp-more">Compare more providers <ArrowRightOutlined /></Link>
        </article>

        <article className="lp-card">
          <div className="lp-card-head"><h3>Real-Time Tracking</h3><Link to="/shipments">View All</Link></div>
          {tracked && (
            <>
              <ol className="lp-track">
                {tracked.timeline.slice(0, 5).map((t) => (
                  <li key={t.title + t.time} className={`is-${t.state}`}>
                    <span className="dot" aria-hidden />
                    <div><b>{t.location}</b><span>{t.title}</span></div>
                    <time>{dayjs(t.time).format("MMM D, HH:mm")}</time>
                  </li>
                ))}
              </ol>
              <div className="lp-track-foot">
                <span>Tracking ID: <Link to={`/shipments/${tracked.id}`} className="mono">{tracked.trackingId}</Link></span>
                <Link to={`/shipments/${tracked.id}`}>View Details <ArrowRightOutlined /></Link>
              </div>
            </>
          )}
        </article>
      </section>

      <section className="lp-wrap lp-partners" id="partners" aria-label="Carrier network">
        <span>Trusted by global leaders</span>
        {PARTNERS.map((p) => <b key={p}>{p}</b>)}
        <span>and more...</span>
      </section>

      <section className="lp-wrap lp-band">
        {BAND.map((b, i) => (
          <div key={b.title}><span className="lp-bico">{BAND_ICONS[i]}</span><div><b>{b.title}</b><span>{b.body}</span></div></div>
        ))}
      </section>

      <footer className="lp-wrap lp-foot">
        <KilogyLogo height={26} />
        <span>One Platform. Every Carrier. Every Shipment.</span>
        <span>© {new Date().getFullYear()} Kilogy · prototype</span>
      </footer>
    </div>
  );
}
