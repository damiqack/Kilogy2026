import { ArrowLeft, FileText, Leaf, Radio, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { RiskBadge, StatusBadge } from "../components/Badges";
import { ModeIcon, RouteLegs } from "../components/RouteLegs";
import { ScoreBars } from "../components/ScoreBars";
import { useStore } from "../data/store";
import type { ShipmentStatus } from "../data/types";
import { date, dateTime, days, kg, place, titleCase, usd } from "../lib/format";

const STEPS: ShipmentStatus[] = ["booked", "picked_up", "in_transit", "customs", "out_for_delivery", "delivered"];

export function ShipmentDetail() {
  const { id } = useParams();
  const { shipments, documents, payments, cancel, generateDocument } = useStore();
  const s = shipments.find((x) => x.id === id);
  if (!s) return <div className="card empty">Shipment not found. <Link to="/shipments">Back to shipments</Link></div>;

  const o = s.selected;
  const docs = documents.filter((d) => d.shipmentId === s.id);
  const pay = payments.filter((p) => p.shipmentId === s.id);
  const reached = new Set(s.events.map((e) => e.status));
  const cancellable = ["created", "booked"].includes(s.status);

  return (
    <>
      <Link to="/shipments" className="small row"><ArrowLeft size={14} /> Shipments</Link>
      <div className="page-head">
        <div>
          <div className="row"><h1 className="mono">{s.reference}</h1><StatusBadge status={s.status} /></div>
          <p>{place(s.origin)} → {place(s.destination)} · {o.carrier_name} {titleCase(o.service)} · Tracking <span className="mono">{s.trackingNumber}</span></p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => generateDocument(s.id, "customs")}><FileText size={15} /> Customs docs</button>
          <button className="btn" disabled={!cancellable} onClick={() => cancel(s.id)} title={cancellable ? "" : "Only shipments not yet picked up can be cancelled"}>
            <XCircle size={15} /> Cancel
          </button>
        </div>
      </div>

      <div className="card card-pad">
        <div className="row" style={{ gap: 0 }}>
          {STEPS.map((st, i) => (
            <div key={st} style={{ flex: 1 }} className="stack">
              <div className="row" style={{ gap: 0 }}>
                <span className={`dot${reached.has(st) ? " done" : ""}`} />
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: reached.has(STEPS[i + 1]) ? "var(--primary)" : "var(--border)" }} />}
              </div>
              <span className="small muted">{titleCase(st)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid g-main">
        <div className="stack" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-head">
              <h2>Route</h2>
              <span className="row small muted"><Leaf size={14} color="var(--green)" /> {kg(o.co2_kg)} CO₂e</span>
            </div>
            <div className="card-pad stack" style={{ gap: 14 }}>
              {o.route && <RouteLegs legs={o.route.legs} />}
              <table className="table">
                <thead><tr><th>Leg</th><th>Mode</th><th>Distance</th><th>Time</th><th>CO₂e</th></tr></thead>
                <tbody>
                  {o.route?.legs.map((l, i) => (
                    <tr key={i}>
                      <td>{l.from} → {l.to}</td>
                      <td><span className="row" style={{ textTransform: "capitalize" }}><ModeIcon mode={l.mode} /> {l.mode}</span></td>
                      <td className="num">{Math.round(l.distance_km).toLocaleString()} km</td>
                      <td className="num">{Math.round(l.transit_hours)} h</td>
                      <td className="num">{kg(l.co2_kg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Tracking</h2>
              <span className="badge b-teal row"><Radio size={12} /> Live via WebSocket (planned)</span>
            </div>
            <div className="card-pad">
              <ul className="timeline">
                {[...s.events].reverse().map((e, i) => (
                  <li key={i}>
                    <span className={`dot${i === 0 ? " done" : ""}`} style={e.status === "exception" ? { background: "var(--red)", borderColor: "var(--red)" } : undefined} />
                    <div>
                      <div style={{ fontWeight: 550 }}>{e.description}</div>
                      <div className="small faint">{e.location}{e.location ? " · " : ""}{dateTime(e.timestamp)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-head"><h2>AI prediction</h2><RiskBadge level={o.risk.level} score={o.risk.score} /></div>
            <div className="card-pad stack" style={{ gap: 12 }}>
              <div className="row-between"><span className="muted">Predicted delivery</span><strong>{date(o.risk.eta.earliest)} – {date(o.risk.eta.latest)}</strong></div>
              <div className="stack" style={{ gap: 6 }}>
                <span className="small muted">Top risk factors</span>
                {o.risk.factors.map((f) => (
                  <div key={f.factor} className="stack" style={{ gap: 3 }}>
                    <div className="row-between small"><span>{titleCase(f.factor)}</span><span className="num faint">{Math.round(f.impact * 100)}%</span></div>
                    <div className="bar"><span style={{ width: `${f.impact * 100}%`, background: "var(--accent)" }} /></div>
                  </div>
                ))}
              </div>
              <div className="stack" style={{ gap: 6 }}>
                <span className="small muted">Why this option was chosen · AI score {o.ai_score}</span>
                <ScoreBars scores={o.ai_scores} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2>Details</h2></div>
            <div className="card-pad stack small" style={{ gap: 8 }}>
              <Detail k="Weight" v={`${s.package.weight_kg} kg`} />
              {s.package.dimensions && <Detail k="Dimensions" v={`${s.package.dimensions.l} × ${s.package.dimensions.w} × ${s.package.dimensions.h} cm`} />}
              <Detail k="Transit" v={days(o.transit_days)} />
              <Detail k="Price" v={usd(o.price_usd)} />
              <Detail k="Carrier cost" v={`${usd(o.pricing.carrier_cost_usd)} (${o.pricing.margin_pct}% margin)`} />
              {pay.map((p) => <Detail key={p.id} k="Payment" v={`${titleCase(p.status)} · ${p.method}`} />)}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2>Documents</h2></div>
            <div className="card-pad stack small" style={{ gap: 8 }}>
              {docs.length ? docs.map((d) => (
                <div key={d.id} className="row-between">
                  <span className="row"><FileText size={14} /> {d.filename}</span>
                  <span className="badge">{titleCase(d.type)}</span>
                </div>
              )) : <span className="faint">No documents yet.</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const Detail = ({ k, v }: { k: string; v: string }) => (
  <div className="row-between"><span className="muted">{k}</span><span className="num">{v}</span></div>
);
