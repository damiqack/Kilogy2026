import { Card, Col, Progress, Row, Statistic, Table } from "antd";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import { cad } from "../lib/money";

interface LaneRow { lane: string; n: number; spend: number; co2: number; days: number }

// Sample monthly volumes until the analytics service is connected.
const VOLUME = [
  { month: "Apr", n: 18 }, { month: "May", n: 22 }, { month: "Jun", n: 27 },
  { month: "Jul", n: 31 }, { month: "Aug", n: 38 }, { month: "Sep", n: 44 },
];

export function AnalyticsPage() {
  const { shipments } = useStore();
  const lanes = Object.values(shipments.reduce<Record<string, LaneRow>>((m, s) => {
    const lane = `${s.origin.city} → ${s.destination.city}`;
    const r = m[lane] ?? { lane, n: 0, spend: 0, co2: 0, days: 0 };
    m[lane] = { lane, n: r.n + 1, spend: r.spend + s.selected.price_usd, co2: r.co2 + (s.selected.co2_kg ?? 0), days: r.days + s.selected.transit_days };
    return m;
  }, {}));
  const byCarrier = Object.entries(shipments.reduce<Record<string, number>>((m, s) => ((m[s.selected.carrier_name] = (m[s.selected.carrier_name] ?? 0) + s.selected.price_usd), m), {}))
    .map(([carrier, spend]) => ({ carrier, spend })).sort((a, b) => b.spend - a.spend);
  const totalSpend = shipments.reduce((a, s) => a + s.selected.price_usd, 0);
  const totalCo2 = shipments.reduce((a, s) => a + (s.selected.co2_kg ?? 0), 0);
  const maxVol = Math.max(...VOLUME.map((v) => v.n));

  return (
    <>
      <PageHeader title="Analytics" />
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={12} md={6}><Statistic title="Shipments" value={shipments.length} /></Col>
          <Col xs={12} md={6}><Statistic title="Spend (CAD)" value={cad(totalSpend)} /></Col>
          <Col xs={12} md={6}><Statistic title="Avg cost / shipment" value={cad(totalSpend / Math.max(shipments.length, 1))} /></Col>
          <Col xs={12} md={6}><Statistic title="CO₂e (kg)" value={Math.round(totalCo2)} /></Col>
        </Row>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Monthly volume (sample)">
            <Table size="small" rowKey="month" pagination={false} dataSource={VOLUME}
              columns={[
                { title: "Month", dataIndex: "month", width: 80 },
                { title: "Shipments", dataIndex: "n", render: (v: number) => <Progress aria-label="Shipments" percent={(v / maxVol) * 100} format={() => v} size="small" /> },
              ]} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Spend by carrier">
            <Table size="small" rowKey="carrier" pagination={false} dataSource={byCarrier}
              columns={[
                { title: "Carrier", dataIndex: "carrier" },
                { title: "Spend (CAD)", dataIndex: "spend", align: "right", render: (v: number) => cad(v) },
                { title: "Share", key: "share", width: 160, render: (_, r) => <Progress aria-label={`${r.carrier} share of spend`} percent={Math.round((r.spend / totalSpend) * 100)} size="small" /> },
              ]} />
          </Card>
        </Col>
        <Col span={24}>
          <Card size="small" title="Lane performance">
            <Table<LaneRow> size="small" rowKey="lane" pagination={false} dataSource={lanes} scroll={{ x: 700 }}
              columns={[
                { title: "Lane", dataIndex: "lane" },
                { title: "Shipments", dataIndex: "n", align: "right", sorter: (a, b) => a.n - b.n },
                { title: "Spend (CAD)", dataIndex: "spend", align: "right", defaultSortOrder: "descend", sorter: (a, b) => a.spend - b.spend, render: (v: number) => cad(v) },
                { title: "Avg transit (days)", key: "t", align: "right", render: (_, r) => (r.days / r.n).toFixed(1) },
                { title: "CO₂e (kg)", dataIndex: "co2", align: "right", sorter: (a, b) => a.co2 - b.co2, render: (v: number) => v.toFixed(1) },
                { title: "CO₂e / shipment (kg)", key: "per", align: "right", render: (_, r) => (r.co2 / r.n).toFixed(1) },
              ]} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
