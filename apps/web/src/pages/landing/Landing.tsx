import { Button, Select } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_SAMPLE, CAPABILITIES, HERO, QUICK_DESTINATIONS, QUICK_ORIGINS, SAMPLE_QUOTE, STEPS } from "./content";
import { LaneMap } from "./LaneMap";
import "./landing.css";

/** Public homepage at "/". The signed-in app lives under /dashboard, /shipments, etc. */
export function LandingPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(QUICK_ORIGINS[0].value);
  const [to, setTo] = useState(QUICK_DESTINATIONS[0].value);
  const quote = () => navigate(`/shipments/new?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-inner">
          <Link to="/" className="lp-wordmark">KILOGY</Link>
          <nav className="lp-nav-links" aria-label="Homepage sections">
            <a href="#how">How it works</a>
            <a href="#lanes">Lanes</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#developers">Developers</a>
          </nav>
          <div className="lp-nav-actions">
            <Link to="/login" className="lp-signin">Sign in</Link>
            <Button type="primary" onClick={quote}>Get a quote</Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-grid">
            <div>
              <p className="lp-eyebrow">{HERO.eyebrow}</p>
              <h1 className="lp-h1">{HERO.title}</h1>
              <p className="lp-lead">{HERO.body}</p>

              <form className="lp-quick" onSubmit={(e) => { e.preventDefault(); quote(); }} aria-label="Start a quote">
                <div className="lp-quick-field">
                  <label htmlFor="lp-from">Ship from</label>
                  <Select id="lp-from" value={from} onChange={setFrom} options={QUICK_ORIGINS} size="large" />
                </div>
                <div className="lp-quick-field">
                  <label htmlFor="lp-to">Ship to</label>
                  <Select id="lp-to" value={to} onChange={setTo} options={QUICK_DESTINATIONS} size="large" />
                </div>
                <Button type="primary" size="large" htmlType="submit" className="lp-quick-go">Compare carriers</Button>
              </form>
            </div>

            <figure className="lp-sample" aria-label="Example quote">
              <figcaption>
                <span>Example quote</span>
                <span className="lp-mono">{SAMPLE_QUOTE.route}</span>
              </figcaption>
              <table>
                <thead>
                  <tr><th>Carrier</th><th className="r">Days</th><th className="r">Price (CAD)</th><th className="r">CO₂e</th></tr>
                </thead>
                <tbody>
                  {SAMPLE_QUOTE.rows.map((r) => (
                    <tr key={r.carrier + r.service}>
                      <td>
                        <strong>{r.carrier}</strong>
                        <span className="lp-sub">{r.service}</span>
                        <span className="lp-pick">{r.pick}</span>
                      </td>
                      <td className="r">{r.days}</td>
                      <td className="r">{r.price}</td>
                      <td className="r">{r.co2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="lp-sample-note">Ranked on cost, speed, carbon and reliability. Sample data.</p>
            </figure>
          </div>
        </section>

        {/* Facts strip: product facts, not marketing numbers */}
        <section className="lp-facts" aria-label="At a glance">
          <div className="lp-wrap lp-facts-grid">
            <div><b>5</b><span>carriers compared per quote</span></div>
            <div><b>4</b><span>ranking factors you can weight</span></div>
            <div><b>3</b><span>modes: air, ocean and road</span></div>
            <div><b>1</b><span>screen to quote, book and track</span></div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="lp-section">
          <div className="lp-wrap">
            <h2 className="lp-h2">How it works</h2>
            <ol className="lp-steps">
              {STEPS.map((s) => (
                <li key={s.n}>
                  <span className="lp-step-n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Lanes */}
        <section id="lanes" className="lp-section lp-section-alt">
          <div className="lp-wrap">
            <div className="lp-split-head">
              <h2 className="lp-h2">Built for Canada–Africa lanes</h2>
              <p>Direct options are scarce on these routes. Kilogy combines carriers through transit hubs, so a Montreal to Accra shipment can fly via Addis Ababa when that is cheaper and faster.</p>
            </div>
            <div className="lp-lanes-wrap" role="region" aria-label="Lane map" tabIndex={0}>
              <LaneMap />
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section id="capabilities" className="lp-section">
          <div className="lp-wrap">
            <h2 className="lp-h2">What it handles</h2>
            <div className="lp-caps">
              {CAPABILITIES.map((c) => (
                <article key={c.label}>
                  <span className="lp-cap-label">{c.label}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Developers */}
        <section id="developers" className="lp-dev">
          <div className="lp-wrap lp-dev-grid">
            <div>
              <h2 className="lp-h2">For developers</h2>
              <p>Quotes, bookings, tracking and documents are all REST endpoints. Use an API key from the dashboard and subscribe to webhooks for status changes.</p>
              <Link to="/developers?tab=reference" className="lp-dev-link">API reference →</Link>
            </div>
            <pre className="lp-code" aria-label="Example API request" tabIndex={0}><code>{API_SAMPLE}</code></pre>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="lp-cta">
          <div className="lp-wrap lp-cta-inner">
            <h2 className="lp-h2">Price your next shipment</h2>
            <div className="lp-cta-actions">
              <Button type="primary" size="large" onClick={quote}>Get a quote</Button>
              <Link to="/dashboard" className="lp-signin">Open the dashboard</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <span className="lp-wordmark small">KILOGY</span>
          <span>Logistics OS · prototype v0.3</span>
          <span>© 2026 Kilogy</span>
        </div>
      </footer>
    </div>
  );
}
