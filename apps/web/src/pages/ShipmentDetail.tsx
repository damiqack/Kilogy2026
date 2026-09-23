import { ArrowLeft, Check, FileText, Leaf, Play, Radio, TriangleAlert, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { RiskBadge, StatusBadge } from "../components/Badges";
import { Info } from "../components/Info";
import { ModeIcon, RouteLegs } from "../components/RouteLegs";
import { AiScore, ScoreBars } from "../components/ScoreBars";
import { hubName } from "../data/carriers";
import { useStore } from "../data/store";
import type { TimelineStep } from "../data/types";
import { kg, place, titleCase } from "../lib/format";
import { cad } from "../lib/money";

const longDate = (iso: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso)
  .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const stamp = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

/** Shipment Tracking screen (spec 3.4). */
export function ShipmentDetail() {
  const { id } = useParams();
  const { shipments, documents, payments, cancel, generateDocument } = useStore();
  const s = shipments.find((x) => x.id === id);
  if (!s) return <div className="card empty">Shipment not found. <Link to="/shipments">Back to shipments</Link></div>;

  const o = s.selected;
  const docs = documents.filter((d) => d.shipmentId === s.id);
  const pay = payments.find((p) => p.shipmentId === s.id);
  const cancellable = ["created", "booked"].includes(s.status);
  const eta = s.status === "delivered" && s.deliveredAt ? s.deliveredAt : o.risk.eta.latest;

  return (
    <>
      <Link to="/shipments" className="small row" style={{ gap: 6 }}><ArrowLeft size={15} aria-hidden /> All shipments</Link>

      <div className="page-head">
        <div>
          <div className="row wrap" style={{ gap: 12 }}>
            <h1>Tracking ID: <span className="mono" style={{ fontSize: "0.82em", fontWeight: 600 }}>{s.trackingId}</span></h1>
            <StatusBadge status={s.status} />
          </div>
          <p className="sub" style={{ fontSize: 16 }}>{place(s.origin)} &nbsp;→&nbsp; {place(s.destination)}</p>
        </div>
        <div className="row wrap">
          <button className="btn" onClick={() => generateDocument(s.id, "customs")}><FileText size={16} aria-hidden /> Customs docs</button>
          <button className="btn" disabled={!cancellable} onClick={() => cancel(s.id)} title={cancellable ? undefined : "Only shipments not yet picked up can be cancelled"}>
            <XCircle size={16} aria-hidden /> Cancel
          </button>
        </div>
      </div>

      <section className="card" aria-label="Shipment summary">
        <div className="info-grid">
          <Info label="Carrier" value={o.carrier_name} sub={<>{o.service_name ?? titleCase(o.service)} · <span className="mono">{s.carrierTracking}</span></>} />
          <Info label={s.status === "delivered" ? "Delivered" : "AI Predicted ETA"} value={longDate(eta)} sub={s.status === "delivered" ? undefined : o.risk.eta.earliest === o.risk.eta.latest ? "On schedule" : `Window ${longDate(o.risk.eta.earliest)} – ${longDate(o.risk.eta.latest)}`} />
          <Info label="AI Risk Score" value={<RiskBadge level={o.risk.level} score={o.risk.score} />} sub={o.risk.factors[0] ? `Main factor: ${titleCase(o.risk.factors[0].factor)}` : undefined} />
          <Info label="Emissions" value={<span className="row" style={{ gap: 6 }}><Leaf size={17} color="var(--success)" aria-hidden />{kg(o.co2_kg)} CO₂e</span>} sub={`${titleCase(o.route?.primary_mode ?? "air")} · ${s.package.weight_kg} kg`} />
        </div>
      </section>

      <div className="grid g-main">
        <section className="card" aria-labelledby="tl-h">
          <div className="card-head">
            <h2 id="tl-h">Tracking Timeline</h2>
            <span className="badge b-accent plain row"><Radio size={13} aria-hidden /> Real-time via WebSocket (planned)</span>
          </div>
          <div className="card-pad">
            <ol className="timeline">
              {s.timeline.map((t, i) => <TimelineRow key={i} step={t} />)}
            </ol>
          </div>
        </section>

        <div className="stack" style={{ gap: 20 }}>
          <section className="card" aria-labelledby="route-h">
            <div className="card-head"><h2 id="route-h">Route</h2></div>
            <div className="card-pad stack" style={{ gap: 14 }}>
              {o.route && <RouteLegs legs={o.route.legs} />}
              <ul className="stack small" style={{ listStyle: "none", margin: 0, padding: 0, gap: 8 }}>
                {o.route?.legs.map((l, i) => (
                  <li key={i} className="row-between">
                    <span className="row" style={{ gap: 6 }}><ModeIcon mode={l.mode} size={14} /> {hubName(l.from)} → {hubName(l.to)}</span>
                    <span className="num faint" style={{ whiteSpace: "nowrap" }}>{kg(l.co2_kg)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="card" aria-labelledby="ai-h">
            <div className="card-head"><h2 id="ai-h">AI assessment</h2><AiScore value={o.ai_score} /></div>
            <div className="card-pad stack" style={{ gap: 14 }}>
              <div className="stack" style={{ gap: 8 }}>
                <span className="label">Risk factors</span>
                {o.risk.factors.map((f) => (
                  <div key={f.factor} className="stack" style={{ gap: 4 }}>
                    <div className="row-between small"><span>{titleCase(f.factor)}</span><span className="num faint">{Math.round(f.impact * 100)}%</span></div>
                    <div className="meter"><span style={{ width: `${f.impact * 100}%`, background: "var(--warning)" }} /></div>
                  </div>
                ))}
              </div>
              <ScoreBars scores={o.ai_scores} />
            </div>
          </section>

          <section className="card" aria-labelledby="doc-h">
            <div className="card-head"><h2 id="doc-h">Documents &amp; billing</h2></div>
            <div className="card-pad stack small" style={{ gap: 10 }}>
              {docs.map((d) => (
                <div key={d.id} className="row-between">
                  <span className="row"><FileText size={15} aria-hidden /> <span className="mono">{d.filename}</span></span>
                  <span className="badge plain b-neutral">{titleCase(d.type)}</span>
                </div>
              ))}
              {pay && <div className="row-between"><span className="muted">Payment</span><span>{cad(pay.amount_usd)} · {titleCase(pay.status)}</span></div>}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function TimelineRow({ step }: { step: TimelineStep }) {
  const icon = step.state === "done" ? <Check size={15} strokeWidth={3} /> : step.state === "current" ? <Play size={12} fill="currentColor" /> : step.state === "issue" ? <TriangleAlert size={14} /> : null;
  const label = { done: "Completed", current: "Current", upcoming: "Upcoming", issue: "Issue" }[step.state];
  return (
    <li className={step.state} aria-current={step.state === "current" ? "step" : undefined}>
      <span className="t-dot" aria-hidden>{icon}</span>
      <div>
        <div className="t-title"><span className="sr-only">{label}: </span>{step.title} — {step.location}</div>
      </div>
      <span className="t-time">{step.state === "upcoming" ? `Est. ${new Date(step.time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : stamp(step.time)}</span>
    </li>
  );
}
