import { Plug } from "lucide-react";
import { ModeIcon } from "../components/RouteLegs";
import { CARRIERS } from "../data/carriers";
import { pct, titleCase } from "../lib/format";

const STATUS_CLASS = { connected: "b-green", sandbox: "b-blue", planned: "" } as const;

export function Carriers() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Carriers</h1>
          <p>Every carrier connects through the Carrier Gateway using the standard <code>ICarrierAdapter</code> interface.</p>
        </div>
        <button className="btn"><Plug size={15} /> Request integration</button>
      </div>
      <div className="grid g-3">
        {CARRIERS.map((c) => (
          <div key={c.id} className="card card-pad stack" style={{ gap: 12 }}>
            <div className="row-between">
              <div className="row">
                <div className="avatar" style={{ borderRadius: 8, background: "var(--primary-soft)", color: "var(--primary)" }}>{c.name.slice(0, 2).toUpperCase()}</div>
                <div><h3>{c.name}</h3><div className="small faint">{c.coverage}</div></div>
              </div>
              <span className={`badge ${STATUS_CLASS[c.status]}`}>{titleCase(c.status)}</span>
            </div>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {c.services.map((s) => <span key={s} className="badge" style={{ textTransform: "capitalize" }}>{s}</span>)}
            </div>
            <div className="row small muted" style={{ gap: 10 }}>
              {c.modes.map((m) => <span key={m} className="row" style={{ gap: 4, textTransform: "capitalize" }}><ModeIcon mode={m} /> {m}</span>)}
            </div>
            <div className="grid g-2" style={{ gap: 8 }}>
              <div><div className="small faint">On-time rate</div><div className="num" style={{ fontWeight: 600 }}>{pct(c.onTime)}</div></div>
              <div><div className="small faint">Avg CO₂e / kg</div><div className="num" style={{ fontWeight: 600 }}>{c.avgCo2PerKg} kg</div></div>
            </div>
          </div>
        ))}
      </div>
      <div className="small faint">Sandbox = mock adapter in the prototype. Planned = identified for integration, adapter not written yet.</div>
    </>
  );
}
