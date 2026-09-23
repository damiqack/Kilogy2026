import { AlertTriangle, ArrowRight, Boxes, Clock, Leaf, PackagePlus, Sparkles, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { RiskBadge, StatusBadge } from "../components/Badges";
import { ModeIcon } from "../components/RouteLegs";
import { EMISSION_FACTORS } from "../data/carriers";
import { useStore } from "../data/store";
import type { Mode } from "../data/types";
import { date, kg, place, usd } from "../lib/format";

const ACTIVE = new Set(["booked", "picked_up", "in_transit", "customs", "out_for_delivery", "exception"]);

export function Dashboard() {
  const { shipments } = useStore();
  const live = shipments.filter((s) => s.status !== "cancelled");
  const active = live.filter((s) => ACTIVE.has(s.status));
  const delivered = live.filter((s) => s.status === "delivered");
  const exceptions = live.filter((s) => s.status === "exception");
  const spend = live.reduce((a, s) => a + s.selected.price_usd, 0);
  const co2 = live.reduce((a, s) => a + (s.selected.co2_kg ?? 0), 0);
  // Baseline: the same shipments sent as all-air express.
  const airBaseline = live.reduce((a, s) => {
    const dist = s.selected.route?.legs.reduce((d, l) => d + l.distance_km, 0) ?? 9000;
    return a + (EMISSION_FACTORS.air * (s.package.weight_kg / 1000) * dist) / 1000;
  }, 0);
  const saved = Math.max(0, airBaseline - co2);

  const byMode = live.reduce<Record<string, { n: number; co2: number }>>((m, s) => {
    const k = s.selected.route?.primary_mode ?? "air";
    m[k] = { n: (m[k]?.n ?? 0) + 1, co2: (m[k]?.co2 ?? 0) + (s.selected.co2_kg ?? 0) };
    return m;
  }, {});
  const maxCo2 = Math.max(...Object.values(byMode).map((v) => v.co2), 1);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Good morning, Damian</h1>
          <p>Here's how your shipments are moving today.</p>
        </div>
        <Link to="/quotes/new" className="btn btn-primary"><PackagePlus size={16} /> New AI quote</Link>
      </div>

      <div className="grid g-4">
        <Kpi icon={<Boxes size={15} />} label="Active shipments" value={String(active.length)} delta={`${live.length} total`} />
        <Kpi icon={<Clock size={15} />} label="On-time delivery" value="94%" delta="▲ 3 pts vs last month" up />
        <Kpi icon={<Leaf size={15} />} label="CO₂ saved vs all-air" value={kg(saved)} delta={`${airBaseline ? Math.round((saved / airBaseline) * 100) : 0}% lower emissions`} up />
        <Kpi icon={<Wallet size={15} />} label="Shipping spend" value={usd(spend)} delta="This month" />
      </div>

      <div className="grid g-main">
        <div className="card">
          <div className="card-head">
            <h2>Recent shipments</h2>
            <Link to="/shipments" className="small row">View all <ArrowRight size={13} /></Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Reference</th><th>Lane</th><th>Carrier</th><th>Status</th><th>ETA</th></tr></thead>
              <tbody>
                {live.slice(0, 6).map((s) => (
                  <tr key={s.id}>
                    <td><Link to={`/shipments/${s.id}`} className="mono">{s.reference}</Link></td>
                    <td>{place(s.origin)} → {place(s.destination)}</td>
                    <td><span className="row"><ModeIcon mode={s.selected.route?.primary_mode ?? "air"} /> {s.selected.carrier_name}</span></td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="muted">{s.status === "delivered" ? "Delivered" : date(s.selected.risk.eta.latest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-head"><h2 className="row"><Sparkles size={16} color="var(--primary)" /> AI insights</h2></div>
            <div className="card-pad stack" style={{ gap: 12 }}>
              {exceptions.map((s) => (
                <div key={s.id} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                  <AlertTriangle size={16} color="var(--red)" style={{ marginTop: 2 }} />
                  <div>
                    <div><Link to={`/shipments/${s.id}`} className="mono">{s.reference}</Link> is on customs hold in {s.destination.city}.</div>
                    <div className="small muted">Upload a commercial invoice to release it. Predicted delay: 2–3 days.</div>
                  </div>
                </div>
              ))}
              <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                <Leaf size={16} color="var(--green)" style={{ marginTop: 2 }} />
                <div>
                  <div>Switch non-urgent Canada → Ghana freight to ocean via Halifax → Tema.</div>
                  <div className="small muted">About 95% less CO₂ and 40% cheaper, with 3 extra weeks of transit.</div>
                </div>
              </div>
              <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                <RiskBadge level="medium" />
                <div className="small muted">West Africa rainy season lifts delay risk on Lagos routes through September.</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2>Emissions by mode</h2><span className="small faint">kg CO₂e</span></div>
            <div className="card-pad stack" style={{ gap: 12 }}>
              {(Object.entries(byMode) as [Mode, { n: number; co2: number }][]).map(([mode, v]) => (
                <div key={mode} className="stack" style={{ gap: 4 }}>
                  <div className="row-between small">
                    <span className="row" style={{ textTransform: "capitalize" }}><ModeIcon mode={mode} /> {mode} · {v.n} shipments</span>
                    <span className="num">{kg(v.co2)}</span>
                  </div>
                  <div className="bar"><span style={{ width: `${(v.co2 / maxCo2) * 100}%`, background: mode === "ocean" ? "var(--green)" : undefined }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="small faint">Delivered this period: {delivered.length}. KPI definitions are placeholders until the Fanshawe operations team finalizes them.</div>
    </>
  );
}

function Kpi({ icon, label, value, delta, up }: { icon: React.ReactNode; label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className="card kpi">
      <div className="kpi-label">{icon} {label}</div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-delta ${up ? "up" : "faint"}`}>{delta}</div>
    </div>
  );
}
