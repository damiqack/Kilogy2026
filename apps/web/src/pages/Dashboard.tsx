import { AlertTriangle, ArrowRight, CheckCircle2, Leaf, Package, PackagePlus, Plane, ShieldAlert, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/Badges";
import { useStore } from "../data/store";
import type { AiAlert, Shipment } from "../data/types";
import { date, kg, place } from "../lib/format";

const IN_TRANSIT = new Set(["picked_up", "in_transit", "customs", "out_for_delivery", "delayed"]);
const ACTIVE = new Set([...IN_TRANSIT, "booked", "exception"]);

const sameDay = (iso: string | undefined, offset = 0) => {
  if (!iso) return false;
  const d = new Date(); d.setDate(d.getDate() + offset);
  return new Date(iso).toDateString() === d.toDateString();
};

export function Dashboard() {
  const { shipments, alerts, dismissAlert } = useStore();
  const active = shipments.filter((s) => ACTIVE.has(s.status));
  const inTransit = shipments.filter((s) => IN_TRANSIT.has(s.status));
  const onTrack = inTransit.filter((s) => s.status !== "delayed").length;
  const deliveredToday = shipments.filter((s) => s.status === "delivered" && sameDay(s.deliveredAt)).length;
  const deliveredYesterday = shipments.filter((s) => s.status === "delivered" && sameDay(s.deliveredAt, -1)).length;
  const incidents = shipments.filter((s) => s.status === "exception" || s.status === "delayed");
  const openIncidents = incidents.filter((s) => s.status === "exception").length;
  const co2 = shipments.reduce((a, s) => a + (s.selected.co2_kg ?? 0), 0);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const [primary, ...otherAlerts] = alerts;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview Dashboard <span className="title-meta"><span className="hide-sm">| </span>{today}</span></h1>
        </div>
        <Link to="/shipments/new" className="btn btn-primary"><PackagePlus size={17} aria-hidden /> New Shipment</Link>
      </div>

      <section className="grid g-4 kpis" aria-label="Key metrics">
        <Kpi icon={<Package size={17} />} label="Active Shipments" value={active.length} delta={`+${shipments.filter((s) => Date.now() - +new Date(s.createdAt) < 7 * 864e5).length} this week`} tone="up" />
        <Kpi icon={<CheckCircle2 size={17} />} label="Delivered Today" value={deliveredToday} delta={`${deliveredToday - deliveredYesterday >= 0 ? "+" : ""}${deliveredToday - deliveredYesterday} vs yesterday`} tone="up" />
        <Kpi icon={<Plane size={17} />} label="In Transit" value={inTransit.length} delta={`On track: ${inTransit.length ? Math.round((onTrack / inTransit.length) * 100) : 100}%`} />
        <Kpi icon={<ShieldAlert size={17} />} label="Incidents" value={incidents.length} delta={`${incidents.length - openIncidents} delayed, ${openIncidents} open`} tone={openIncidents ? "bad" : undefined} />
      </section>

      {primary && <AlertBanner alert={primary} onDismiss={() => dismissAlert(primary.id)} />}

      <div className="grid g-main">
        <section className="card" aria-labelledby="recent-h">
          <div className="card-head">
            <h2 id="recent-h">Recent Shipments</h2>
            <Link to="/shipments" className="row small">View all <ArrowRight size={14} aria-hidden /></Link>
          </div>
          <RecentTable rows={shipments.slice(0, 6)} />
        </section>

        <div className="stack" style={{ gap: 20 }}>
          <section className="card" aria-labelledby="ai-h">
            <div className="card-head"><h2 id="ai-h" className="row"><Sparkles size={18} color="var(--accent)" aria-hidden /> AI Insights</h2></div>
            <div className="card-pad stack" style={{ gap: 12 }}>
              {otherAlerts.map((a) => (
                <div key={a.id} className="ai-tip" style={a.severity === "critical" ? { borderLeftColor: "var(--error)", background: "var(--error-soft)" } : undefined}>
                  {a.severity === "critical" ? <AlertTriangle size={18} className="ai-icon" color="var(--error)" aria-hidden /> : <Leaf size={18} className="ai-icon" aria-hidden />}
                  <div className="stack" style={{ gap: 4 }}>
                    <strong>{a.title}</strong>
                    <span className="small muted">{a.detail}</span>
                    {a.cta && <Link to={a.cta.to} className="small">{a.cta.label} →</Link>}
                  </div>
                </div>
              ))}
              {!otherAlerts.length && <span className="muted">No other insights right now.</span>}
            </div>
          </section>
          <section className="card card-pad stack" aria-label="Emissions">
            <div className="kpi-label"><span className="kpi-icon" style={{ color: "var(--success)" }}><Leaf size={17} aria-hidden /></span> CO₂e this period</div>
            <div className="kpi-value">{kg(co2)}</div>
            <Link to="/analytics" className="small">See emissions by lane →</Link>
          </section>
        </div>
      </div>
    </>
  );
}

function AlertBanner({ alert, onDismiss }: { alert: AiAlert; onDismiss: () => void }) {
  return (
    <div className="ai-alert" role="alert">
      <AlertTriangle size={22} className="ai-icon" aria-hidden />
      <div className="ai-alert-body">
        <strong>AI Alert:</strong> {alert.title} {alert.recommendation && <span className="strong">{alert.recommendation}</span>}
      </div>
      {alert.cta && <Link to={alert.cta.to} className="btn btn-sm">{alert.cta.label}</Link>}
      <button className="expand-btn" onClick={onDismiss} aria-label="Dismiss alert"><X size={16} /></button>
    </div>
  );
}

export function RecentTable({ rows }: { rows: Shipment[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Tracking #</th>
            <th scope="col">Origin</th>
            <th scope="col">Destination</th>
            <th scope="col" className="hide-sm">Carrier</th>
            <th scope="col">Status</th>
            <th scope="col">ETA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td><Link to={`/shipments/${s.id}`} className="track-id">{s.trackingId}</Link></td>
              <td>{place(s.origin)}</td>
              <td>{place(s.destination)}</td>
              <td className="hide-sm">{s.selected.carrier_name.replace(" International", "").replace(" Worldwide", "").replace(" Express", "")}</td>
              <td><StatusBadge status={s.status} /></td>
              <td className="num">{date(s.status === "delivered" && s.deliveredAt ? s.deliveredAt : s.selected.risk.eta.latest)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kpi({ icon, label, value, delta, tone }: { icon: React.ReactNode; label: string; value: number; delta: string; tone?: "up" | "bad" }) {
  return (
    <div className="card kpi">
      <div className="kpi-label"><span className="kpi-icon" aria-hidden>{icon}</span>{label}</div>
      <div className="kpi-value">{value.toLocaleString()}</div>
      <div className={`kpi-delta ${tone ?? ""}`}>{delta}</div>
    </div>
  );
}
