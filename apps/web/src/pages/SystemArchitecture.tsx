import { useAiStatus } from "../components/Layout";

type S = "ok" | "wip" | "planned";
const LAYERS: { n: number; name: string; desc: string; items: [string, S][] }[] = [
  { n: 1, name: "Client Interface", desc: "Web app, mobile app, developer portal, integrations", items: [["Web dashboard (this app)", "ok"], ["Mobile app", "planned"], ["Developer portal", "wip"], ["@kilogy/sdk", "planned"]] },
  { n: 2, name: "API Gateway", desc: "Rate limiting, authentication, routing, validation", items: [["API keys + JWT auth", "wip"], ["Tiered rate limiting", "wip"], ["/api/v1 versioning", "wip"], ["OpenAPI 3.0 docs", "planned"]] },
  { n: 3, name: "Microservices", desc: "Independently deployable services on an event bus", items: [["Shipment", "wip"], ["Pricing", "wip"], ["Routing", "ok"], ["Tracking", "wip"], ["Carrier Gateway", "wip"], ["Payment", "planned"], ["Notification", "planned"], ["Document", "planned"], ["Auth", "wip"], ["Analytics", "planned"]] },
  { n: 4, name: "AI Engine", desc: "ML models coordinated by the Decision Engine", items: [["Decision Engine", "ok"], ["Routing Engine", "ok"], ["Pricing Engine", "ok"], ["Incident Predictor", "ok"], ["Carrier Recommender", "ok"], ["Load Matcher", "planned"], ["Demand Forecaster", "planned"]] },
  { n: 5, name: "Data Infrastructure", desc: "Streaming, warehouse, caching, persistence", items: [["PostgreSQL", "planned"], ["MongoDB", "planned"], ["Redis", "planned"], ["Kafka", "planned"], ["S3", "planned"], ["Elasticsearch", "planned"], ["ClickHouse", "planned"]] },
];

const MODELS = [
  ["Pricing Engine", "XGBoost regression", "Route, weight, carrier, time", "Optimal price + margin", "Logistic acceptance placeholder"],
  ["Routing Engine", "Dijkstra + ML scoring", "Origin, dest, package, time", "Ranked route options", "Working, with CO₂ per leg"],
  ["Incident Predictor", "LSTM time series", "Historical delays, weather, customs", "Risk score + ETA", "Feature-based placeholder"],
  ["Load Matcher", "Collaborative filtering", "Cargo specs, carrier capacity", "Matched carrier list", "Not started"],
  ["Carrier Recommender", "Multi-armed bandit", "Route, SLA, cost preferences", "Recommended carrier", "Thompson sampling, working"],
  ["Demand Forecaster", "Prophet time series", "Historical booking patterns", "Volume forecast", "Not started"],
];

const FLOW = [
  "Client sends shipment request → API Gateway", "Auth Service validates API key / JWT", "Shipment Service creates shipment record",
  "Pricing Service fetches rates from all carriers (parallel)", "AI Pricing Engine applies margin optimization",
  "AI Routing Engine scores routes by cost / speed / reliability", "Incident Predictor runs risk analysis on top routes",
  "Decision Engine aggregates scores → ranks options", "Response returned with ranked recommendations",
  "Client selects → Shipment Service books via Carrier Gateway", "Tracking Service starts real-time monitoring", "Notification Service sends confirmation",
];

const LABEL: Record<S, string> = { ok: "Built", wip: "In progress", planned: "Planned" };

export function ArchitecturePanel() {
  const live = useAiStatus();
  return (
    <>
      <div className="row-between wrap">
        <p className="muted" style={{ margin: 0 }}>The five KILOGY layers and how far the prototype has built each one. Source: <code>docs/ARCHITECTURE.md</code></p>
        <div className="row small muted" style={{ gap: 14 }}>
          {(["ok", "wip", "planned"] as S[]).map((s) => <span key={s} className="row"><span className={`status-dot ${s}`} aria-hidden /> {LABEL[s]}</span>)}
        </div>
      </div>

      <div className={`banner${live ? " ok" : ""}`}>
        {live ? "AI engine is running. Quotes use live Decision Engine results." : "AI engine not detected on localhost:4200. The UI is using mock AI results. Start services/ai-engine to go live."}
      </div>

      <div className="card">
        {LAYERS.map((l) => (
          <div key={l.n} className="layer">
            <div>
              <div className="small faint">Layer {l.n}</div>
              <h3>{l.name}</h3>
              <div className="small muted">{l.desc}</div>
            </div>
            <div className="chips">
              {l.items.map(([name, s]) => <span key={name} className="chip" title={LABEL[s]}><span className={`status-dot ${s}`} aria-hidden /> {name}<span className="sr-only"> ({LABEL[s]})</span></span>)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid g-main">
        <div className="card">
          <div className="card-head"><h2 style={{ fontSize: 17 }}>AI model registry</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Module</th><th>Algorithm</th><th>Input</th><th>Output</th><th>Prototype</th></tr></thead>
              <tbody>
                {MODELS.map((m) => <tr key={m[0]}>{m.map((c, i) => <td key={i} className={i === 0 ? "" : "muted"} style={i === 0 ? { fontWeight: 600 } : undefined}>{c}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2 style={{ fontSize: 17 }}>Decision Engine flow</h2></div>
          <div className="card-pad">
            <ol className="stack small" style={{ margin: 0, paddingLeft: 20, gap: 6 }}>
              {FLOW.map((f, i) => <li key={i} className={i >= 3 && i <= 8 ? "" : "muted"}>{f}</li>)}
            </ol>
            <div className="small faint" style={{ marginTop: 10 }}>Steps 4–9 run in the AI engine today (<code>/v1/decide</code>).</div>
          </div>
        </div>
      </div>
    </>
  );
}
