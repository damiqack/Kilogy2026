import { ArrowRightOutlined, CalendarOutlined, CheckOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Select } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KilogyLogo } from "../../components/KilogyLogo";
import { ModeIcon } from "../../components/ModeIcon";
import { WorldMap } from "../../components/WorldMap";
import { COORDS } from "../../config/geo";
import { CARRIERS } from "../../data/carriers";
import { isDelayed, isDelivered, isInTransit } from "../../data/insights";
import { useStore } from "../../data/store";
import { CARGO_TYPES, DESTINATIONS, HERO, NAV, ORIGINS, QUOTE_POINTS, RATE_SAMPLE, STEPS, TRACK_POINTS } from "./content";
import "./landing.css";

// Lanes drawn on the hero map: Kilogy's Canada–Africa focus plus a few connecting hubs.
const HUBS = ["Montreal", "Toronto", "Vancouver", "London", "Rotterdam", "Dubai", "Lagos", "Accra", "Kinshasa", "Nairobi", "Johannesburg", "Dakar"];
const LANES: [string, string][] = [
  ["Montreal", "Kinshasa"], ["Montreal", "Lagos"], ["Toronto", "Accra"], ["Toronto", "London"], ["London", "Lagos"],
  ["Rotterdam", "Dakar"], ["Dubai", "Nairobi"], ["Vancouver", "Johannesburg"], ["Montreal", "Rotterdam"], ["Dubai", "Johannesburg"],
];

/** Public homepage at "/". */
export function LandingPage() {
  const navigate = useNavigate();
  const { shipments } = useStore();
  const [from, setFrom] = useState(ORIGINS[0].value);
  const [to, setTo] = useState(DESTINATIONS[0].value);
  const [cargo, setCargo] = useState(CARGO_TYPES[0]);
  const [weight, setWeight] = useState("500 kg");
  const [when, setWhen] = useState(dayjs().add(3, "day"));
  const findOptions = () => navigate(`/shipments/new?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

  const onTime = shipments.length ? (100 * shipments.filter((s) => !isDelayed(s)).length) / shipments.length : 100;
  const tracked = shipments.find(isInTransit) ?? shipments[0];
  const connected = CARRIERS.filter((c) => c.status !== "planned").length;

  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-hero-map" aria-hidden>
          <WorldMap variant="glow" label="Shipping lanes"
            arcs={LANES.map(([a, b]) => ({ from: COORDS[a], to: COORDS[b] }))}
            points={HUBS.map((h) => ({ at: COORDS[h], color: "#e0f2fe", r: 3 }))} />
        </div>

        <header className="lp-nav lp-wrap">
          <Link to="/" aria-label="Kilogy home page"><KilogyLogo onDark height={38} /></Link>
          <nav aria-label="Main">
            {NAV.map((n) => (n.href.startsWith("/") ? <Link key={n.label} to={n.href}>{n.label}</Link> : <a key={n.label} href={n.href}>{n.label}</a>))}
          </nav>
          <div className="lp-nav-actions">
            <Link to="/dashboard" className="lp-signin">Sign in</Link>
            <Button type="primary" onClick={() => navigate("/shipments/new")}>Get a quote</Button>
          </div>
        </header>

        <div className="lp-wrap lp-hero-copy">
          <span className="lp-eyebrow">{HERO.eyebrow}</span>
          <h1>{HERO.title}</h1>
          <p>{HERO.body}</p>
          <div className="lp-hero-ctas">
            <Button type="primary" size="large" onClick={() => navigate("/shipments/new")}>Start a quote <ArrowRightOutlined /></Button>
            <Button ghost size="large" onClick={() => navigate("/dashboard")}>Open the dashboard</Button>
          </div>
        </div>
      </section>

      <div className="lp-wrap">
        <form className="lp-quote" aria-label="Quick quote" onSubmit={(e) => { e.preventDefault(); findOptions(); }}>
          <label><span>From</span><Select aria-label="From" value={from} onChange={setFrom} options={ORIGINS} variant="borderless" /></label>
          <label><span>To</span><Select aria-label="To" value={to} onChange={setTo} options={DESTINATIONS} variant="borderless" /></label>
          <label><span>Cargo</span><Select aria-label="Cargo type" value={cargo} onChange={setCargo} options={CARGO_TYPES.map((c) => ({ value: c, label: c }))} variant="borderless" /></label>
          <label><span>Weight</span><Input aria-label="Weight" value={weight} onChange={(e) => setWeight(e.target.value)} variant="borderless" /></label>
          <label><span>Ship date</span><DatePicker aria-label="Ship date" value={when} onChange={(d) => d && setWhen(d)} format="MMM D" variant="borderless" allowClear={false} suffixIcon={<CalendarOutlined />} /></label>
          <Button type="primary" htmlType="submit" size="large">Compare options</Button>
        </form>
      </div>

      <section className="lp-wrap lp-section" id="how">
        <h2 className="lp-h2">From quote to doorstep in three steps</h2>
        <ol className="lp-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}><span className="lp-step-n">{String(i + 1).padStart(2, "0")}</span><h3>{s.title}</h3><p>{s.body}</p></li>
          ))}
        </ol>
      </section>

      <section className="lp-wrap lp-split" id="quotes">
        <div className="lp-split-copy">
          <span className="lp-eyebrow is-dark">Quotes</span>
          <h2 className="lp-h2">See every option before you commit.</h2>
          <ul className="lp-checks">{QUOTE_POINTS.map((p) => <li key={p}><CheckOutlined />{p}</li>)}</ul>
          <Link to="/shipments/new" className="lp-link">Try a quote <ArrowRightOutlined /></Link>
        </div>
        <div className="lp-panel">
          <div className="lp-panel-head"><b>Montreal → Kinshasa</b><span>500 kg · general cargo</span></div>
          <ul className="lp-rates">
            {RATE_SAMPLE.map((r) => (
              <li key={r.name}>
                <span className="lp-rate-ico">{r.modes.map((m) => <ModeIcon key={m} mode={m} size={18} />)}</span>
                <div><b>{r.name}</b>{r.tag && <em>{r.tag}</em>}<small>{r.transit} · {r.reliability} on time</small></div>
                <strong>{r.price}</strong>
              </li>
            ))}
          </ul>
          <p className="lp-panel-note">Sample prices for illustration.</p>
        </div>
      </section>

      <section className="lp-wrap lp-split is-reversed" id="tracking">
        <div className="lp-split-copy">
          <span className="lp-eyebrow is-dark">Tracking</span>
          <h2 className="lp-h2">Know where every box is, and what could slow it down.</h2>
          <ul className="lp-checks">{TRACK_POINTS.map((p) => <li key={p}><CheckOutlined />{p}</li>)}</ul>
          <Link to="/tracking" className="lp-link">See live tracking <ArrowRightOutlined /></Link>
        </div>
        {tracked && (
          <div className="lp-panel">
            <div className="lp-panel-head"><Link to={`/shipments/${tracked.id}`} className="mono">{tracked.trackingId}</Link><span>{tracked.selected.carrier_name}</span></div>
            <ol className="lp-track">
              {tracked.timeline.slice(0, 5).map((t) => (
                <li key={t.title + t.time} className={`is-${t.state}`}>
                  <div><b>{t.title}</b><span>{t.location}</span></div>
                  <time>{dayjs(t.time).format("MMM D, HH:mm")}</time>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="lp-wrap lp-numbers" aria-label="Prototype data">
        <div><b>{shipments.length}</b><span>shipments in the demo</span></div>
        <div><b>{shipments.filter(isInTransit).length}</b><span>moving right now</span></div>
        <div><b>{shipments.filter(isDelivered).length}</b><span>delivered</span></div>
        <div><b>{Math.round(onTime)}%</b><span>on schedule</span></div>
        <div><b>{connected}</b><span>carriers connected</span></div>
      </section>

      <section className="lp-wrap">
        <div className="lp-cta">
          <div>
            <h2>Moving goods between Canada and Africa?</h2>
            <p>Run a quote on a real lane and see how Kilogy ranks the options.</p>
          </div>
          <Button size="large" onClick={() => navigate("/shipments/new")}>Start a quote <ArrowRightOutlined /></Button>
        </div>
      </section>

      <footer className="lp-wrap lp-foot">
        <KilogyLogo height={24} />
        <span>One platform. Every carrier. Every shipment.</span>
        <span>© {new Date().getFullYear()} Kilogy · prototype</span>
      </footer>
    </div>
  );
}
