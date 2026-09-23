import { Plug } from "lucide-react";
import { ModeIcon } from "../components/RouteLegs";
import { CARRIERS } from "../data/carriers";
import { pct, titleCase } from "../lib/format";

const STATUS_CLASS = { connected: "b-success", sandbox: "b-accent", planned: "b-neutral" } as const;

export function Carriers() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Carriers</h1>
          <p className="sub">Integrated carriers and their API status. Each connects through the Carrier Gateway's <code>ICarrierAdapter</code>.</p>
        </div>
        <button className="btn"><Plug size={16} aria-hidden /> Request integration</button>
      </div>
      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th scope="col">Carrier</th><th scope="col">Services</th><th scope="col">Modes</th><th scope="col" className="hide-sm">Coverage</th>
                <th scope="col" className="right">On-time</th><th scope="col" className="right hide-sm">CO₂e / kg</th><th scope="col">API status</th></tr>
            </thead>
            <tbody>
              {CARRIERS.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <span className="kpi-icon strong" aria-hidden>{c.name.slice(0, 2).toUpperCase()}</span>
                      <span className="strong">{c.name}</span>
                    </div>
                  </td>
                  <td><div className="row wrap" style={{ gap: 4 }}>{c.services.map((s) => <span key={s} className="badge plain b-neutral" style={{ textTransform: "capitalize" }}>{s}</span>)}</div></td>
                  <td><span className="row muted" style={{ gap: 8 }}>{c.modes.map((m) => <span key={m} title={m}><ModeIcon mode={m} /><span className="sr-only">{m}</span></span>)}</span></td>
                  <td className="muted hide-sm">{c.coverage}</td>
                  <td className="num right">{pct(c.onTime)}</td>
                  <td className="num right hide-sm">{c.avgCo2PerKg} kg</td>
                  <td>
                    <div className="stack" style={{ gap: 2 }}>
                      <span className={`badge ${STATUS_CLASS[c.status]}`}>{titleCase(c.status)}</span>
                      {c.apiLatencyMs && <span className="caption">p50 {c.apiLatencyMs} ms</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="caption">Sandbox = mock adapter in the prototype. Planned = identified for integration, adapter not written yet.</p>
    </>
  );
}
