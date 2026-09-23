import { Leaf } from "lucide-react";
import { useStore } from "../data/store";
import { kg } from "../lib/format";
import { cad } from "../lib/money";

// Analytics Service placeholder (production: GraphQL analytics layer over ClickHouse).
export function Analytics() {
  const { shipments } = useStore();
  const lanes = Object.entries(shipments.reduce<Record<string, { n: number; spend: number; co2: number; days: number }>>((m, s) => {
    const k = `${s.origin.city} → ${s.destination.city}`;
    const v = m[k] ?? { n: 0, spend: 0, co2: 0, days: 0 };
    m[k] = { n: v.n + 1, spend: v.spend + s.selected.price_usd, co2: v.co2 + (s.selected.co2_kg ?? 0), days: v.days + s.selected.transit_days };
    return m;
  }, {})).sort((a, b) => b[1].spend - a[1].spend);
  const carriers = Object.entries(shipments.reduce<Record<string, number>>((m, s) => ((m[s.selected.carrier_name] = (m[s.selected.carrier_name] ?? 0) + s.selected.price_usd), m), {})).sort((a, b) => b[1] - a[1]);
  const maxC = Math.max(...carriers.map((c) => c[1]), 1);
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const volume = [18, 22, 27, 31, 38, 44];
  const vmax = Math.max(...volume);
  const totalSpend = shipments.reduce((a, s) => a + s.selected.price_usd, 0);
  const totalCo2 = shipments.reduce((a, s) => a + (s.selected.co2_kg ?? 0), 0);

  return (
    <>
      <div className="page-head"><div><h1>Analytics</h1><p className="sub">KPIs, cost analysis and CO₂ performance. The Demand Forecaster model will add a forecast here.</p></div></div>
      <section className="grid g-3" aria-label="Totals">
        <div className="card kpi"><div className="kpi-label">Shipping spend</div><div className="kpi-value">{cad(totalSpend)}</div><div className="kpi-delta">{shipments.length} shipments</div></div>
        <div className="card kpi"><div className="kpi-label">Avg cost / shipment</div><div className="kpi-value">{cad(totalSpend / Math.max(shipments.length, 1))}</div><div className="kpi-delta up">▼ 6% vs last month</div></div>
        <div className="card kpi"><div className="kpi-label"><Leaf size={15} color="var(--success)" aria-hidden /> Total CO₂e</div><div className="kpi-value">{kg(totalCo2)}</div><div className="kpi-delta up">{kg(totalCo2 / Math.max(shipments.length, 1))} per shipment</div></div>
      </section>
      <div className="grid g-2">
        <section className="card" aria-labelledby="vol-h">
          <div className="card-head"><h2 id="vol-h">Monthly volume</h2><span className="caption">shipments · sample data</span></div>
          <div className="bar-chart" role="img" aria-label={`Monthly volume: ${months.map((m, i) => `${m} ${volume[i]}`).join(", ")}`}>
            {volume.map((v, i) => (
              <div key={i} className="bar-col">
                <span className="small num faint">{v}</span>
                <div className="bar-fill" style={{ height: `${(v / vmax) * 150}px` }} />
                <span className="small muted">{months[i]}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card" aria-labelledby="mix-h">
          <div className="card-head"><h2 id="mix-h">Spend by carrier</h2><span className="caption">CAD</span></div>
          <div className="card-pad stack" style={{ gap: 14 }}>
            {carriers.map(([name, v]) => (
              <div key={name} className="stack" style={{ gap: 5 }}>
                <div className="row-between small"><span>{name}</span><span className="num strong">{cad(v)}</span></div>
                <div className="meter"><span style={{ width: `${(v / maxC) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="card" aria-labelledby="lane-h">
        <div className="card-head"><h2 id="lane-h">Lane performance</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Lane</th><th scope="col" className="right">Shipments</th><th scope="col" className="right">Spend (CAD)</th><th scope="col" className="right">Avg transit</th><th scope="col" className="right">CO₂e</th><th scope="col" className="right">CO₂e / shipment</th></tr></thead>
            <tbody>
              {lanes.map(([lane, v]) => (
                <tr key={lane}>
                  <td className="strong">{lane}</td><td className="num right">{v.n}</td><td className="num right">{cad(v.spend)}</td>
                  <td className="num right">{(v.days / v.n).toFixed(1)} days</td><td className="num right">{kg(v.co2)}</td><td className="num right">{kg(v.co2 / v.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
