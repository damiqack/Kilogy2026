import { Card, Table } from "antd";
import { Indicator, type Tone } from "../../components/Indicator";

type Status = "built" | "in progress" | "planned";
const TONE: Record<Status, Tone> = { built: "success", "in progress": "info", planned: "neutral" };

const COMPONENTS: { layer: string; component: string; status: Status; notes?: string }[] = [
  { layer: "1. Client", component: "Web dashboard", status: "built", notes: "apps/web" },
  { layer: "1. Client", component: "Mobile app", status: "planned" },
  { layer: "1. Client", component: "SDK (@kilogy/sdk)", status: "planned" },
  { layer: "2. API gateway", component: "Auth (API keys, JWT)", status: "in progress", notes: "services/api" },
  { layer: "2. API gateway", component: "Rate limiting, /api/v1 routing", status: "in progress" },
  { layer: "3. Services", component: "Shipment, pricing, tracking", status: "in progress" },
  { layer: "3. Services", component: "Carrier gateway (adapters)", status: "in progress", notes: "Interface defined; mock rates" },
  { layer: "3. Services", component: "Payments, notifications, documents", status: "planned" },
  { layer: "4. AI engine", component: "Routing, pricing, delay prediction, carrier recommender", status: "built", notes: "services/ai-engine" },
  { layer: "4. AI engine", component: "Load matching, demand forecasting", status: "planned" },
  { layer: "5. Data", component: "PostgreSQL, MongoDB, Redis, Kafka", status: "planned", notes: "In-memory stand-ins today" },
];

const MODELS = [
  { module: "Pricing", target: "XGBoost regression", current: "Logistic acceptance model" },
  { module: "Routing", target: "Dijkstra + ML scoring", current: "Dijkstra with weighted scoring, CO₂ per leg" },
  { module: "Delay prediction", target: "LSTM time series", current: "Feature-based logistic model" },
  { module: "Carrier recommendation", target: "Multi-armed bandit", current: "Thompson sampling" },
  { module: "Load matching", target: "Collaborative filtering", current: "Not started" },
  { module: "Demand forecasting", target: "Prophet", current: "Not started" },
];

export function ArchitectureTab() {
  return (
    <>
      <Card size="small" title="Build status by layer (docs/ARCHITECTURE.md)" style={{ marginBottom: 16 }}>
        <Table size="small" rowKey="component" pagination={false} dataSource={COMPONENTS} scroll={{ x: 700 }}
          columns={[
            { title: "Layer", dataIndex: "layer", onCell: (r, i) => ({ rowSpan: i !== undefined && i > 0 && COMPONENTS[i - 1].layer === r.layer ? 0 : COMPONENTS.filter((c) => c.layer === r.layer).length }) },
            { title: "Component", dataIndex: "component" },
            { title: "Status", dataIndex: "status", render: (s: Status) => <Indicator tone={TONE[s]}>{s}</Indicator> },
            { title: "Notes", dataIndex: "notes" },
          ]} />
      </Card>
      <Card size="small" title="Model registry">
        <Table size="small" rowKey="module" pagination={false} dataSource={MODELS} scroll={{ x: 600 }}
          columns={[
            { title: "Module", dataIndex: "module" },
            { title: "Target algorithm", dataIndex: "target" },
            { title: "Current implementation", dataIndex: "current" },
          ]} />
      </Card>
    </>
  );
}
