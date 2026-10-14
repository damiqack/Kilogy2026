import { Button, Card, Table } from "antd";
import { Indicator } from "../components/Indicator";
import { PageHeader } from "../components/PageHeader";
import { modeLabel } from "../components/RouteText";
import { CARRIERS } from "../data/carriers";
import type { Carrier } from "../data/types";
import { pct, titleCase } from "../lib/format";

const STATUS_TONE = { connected: "success", sandbox: "info", planned: "neutral" } as const;

export function CarriersPage() {
  return (
    <>
      <PageHeader title="Carriers" subtitle="Integrations through the carrier gateway." extra={<Button>Request integration</Button>} />
      <Card size="small">
        <Table<Carrier>
          rowKey="id"
          size="small"
          dataSource={CARRIERS}
          pagination={false}
          scroll={{ x: 900 }}
          columns={[
            { title: "Carrier", dataIndex: "name", render: (v: string) => <strong>{v}</strong> },
            { title: "Services", dataIndex: "services", render: (v: string[]) => v.map(titleCase).join(", ") },
            { title: "Modes", dataIndex: "modes", render: (v: string[]) => v.map(modeLabel).join(", ") },
            { title: "Coverage", dataIndex: "coverage" },
            { title: "On-time", dataIndex: "onTime", align: "right", sorter: (a, b) => a.onTime - b.onTime, render: pct },
            { title: "CO₂e / kg", dataIndex: "avgCo2PerKg", align: "right", sorter: (a, b) => a.avgCo2PerKg - b.avgCo2PerKg, render: (v: number) => `${v} kg` },
            { title: "API latency (p50)", dataIndex: "apiLatencyMs", align: "right", render: (v?: number) => (v ? `${v} ms` : "–") },
            { title: "Integration", dataIndex: "status", render: (v: Carrier["status"]) => <Indicator tone={STATUS_TONE[v]}>{titleCase(v)}</Indicator> },
          ]}
        />
      </Card>
    </>
  );
}
