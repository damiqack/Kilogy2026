import { useStore } from "../data/store";
import { kg, usd } from "../lib/format";

// Analytics Service placeholder (production: GraphQL analytics layer over ClickHouse).
export function Analytics() {
  const { shipments } = useStore();
  const lanes = shipments.reduce<Record<string, { n: number; spend: number; co2: number; days: number }>>((m, s) => {
    const k = `${s.origin.city} → ${s.destination.city}`;
    const v = m[k] ?? { n: 0, spend: 0, co2: 0, days: 0 };
    m[k] = { n: v.n + 1, spend: v.spend + s.selected.price_usd, co2: v.co2 + (s.selected.co2_kg ?? 0), days: v.days + s.selected.transit_days };
    return m;
  }, {});
  const carriers = shipments.reduce<Record<string, number>>((m, s) => ((m[s.selected.carrier_name] = (m[s.selected.carrier_name] ?? 0) + 1), m), {});
  const max = Math.max(...Object.values(carriers), 1);
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const volume = [18, 22, 27, 31, 38, 44];
  const vmax = Math.max(...volume);

  return (
    <>
      <div className="page-head">
        <div><h1>Analytics</h1><p>Lane performance, carrier mix and volume trend. The Demand Forecaster model will feed the forecast here.</p></div>
      </div>
      <div className="grid g-2">
        <div className="card">
          <div className="card-head"><h2>Monthly volume</h2><span className="small faint">shipments · sample data</span></div>
          <div className="card-pad" style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 200 }}>
            {volume.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span className="small num faint">{v}</span>
                <div style={{ width: "100%", maxWidth: 36, height: `${(v / vmax) * 140}px`, background: "var(--primary)", borderRadius: "4px 4px 0 0" }} />
                <span className="small muted">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Carrier mix</h2></div>
          <div className="card-pad stack" style={{ gap: 12 }}>
            {Object.entries(carriers).sort((a, b) => b[1] - a[1]).map(([name, n]) => (
              <div key={name} className="stack" style={{ gap: 4 }}>
                <div className="row-between small"><span>{name}</span><span className="num faint">{n}</span></div>
                <div className="bar"><span style={{ width: `${(n / max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h2>Lane performance</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Lane</th><th>Shipments</th><th>Spend</th><th>Avg transit</th><th>Total CO₂e</th><th>CO₂e / shipment</th></tr></thead>
            <tbody>
              {Object.entries(lanes).map(([lane, v]) => (
                <tr key={lane}>
                  <td>{lane}</td><td className="num">{v.n}</td><td className="num">{usd(v.spend)}</td>
                  <td className="num">{(v.days / v.n).toFixed(1)} days</td><td className="num">{kg(v.co2)}</td><td className="num">{kg(v.co2 / v.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
