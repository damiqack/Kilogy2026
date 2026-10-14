import { CheckCircleFilled, ClockCircleOutlined, ExclamationCircleFilled, SyncOutlined } from "@ant-design/icons";
import { Button, Card, Col, Descriptions, Popconfirm, Result, Row, Table, Timeline, Typography } from "antd";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { modeLabel } from "../components/RouteText";
import { RiskTag, StatusTag } from "../components/StatusTag";
import { hubName } from "../data/carriers";
import { useStore } from "../data/store";
import type { RouteLeg, TimelineStep } from "../data/types";
import { date, dateTime, kg, place, titleCase } from "../lib/format";
import { cad } from "../lib/money";

const STEP_ICON: Record<TimelineStep["state"], { color: string; icon?: React.ReactNode }> = {
  done: { color: "green", icon: <CheckCircleFilled /> },
  current: { color: "blue", icon: <SyncOutlined /> },
  upcoming: { color: "gray", icon: <ClockCircleOutlined /> },
  issue: { color: "red", icon: <ExclamationCircleFilled /> },
};

export function ShipmentDetailPage() {
  const { id } = useParams();
  const { shipments, documents, payments, cancel, generateDocument } = useStore();
  const s = shipments.find((x) => x.id === id);

  if (!s) {
    return <Result status="404" title="Shipment not found" extra={<Link to="/shipments">Back to shipments</Link>} />;
  }

  const o = s.selected;
  const docs = documents.filter((d) => d.shipmentId === s.id);
  const pay = payments.find((p) => p.shipmentId === s.id);
  const cancellable = s.status === "created" || s.status === "booked";

  return (
    <>
      <PageHeader
        title={<span className="mono">{s.trackingId}</span>}
        subtitle={`${place(s.origin)} → ${place(s.destination)}`}
        crumbs={[{ title: "Shipments", path: "/shipments" }]}
        extra={
          <>
            <Button onClick={() => generateDocument(s.id, "customs")}>Generate customs docs</Button>
            <Popconfirm title="Cancel this shipment?" okText="Cancel shipment" cancelText="Keep" onConfirm={() => cancel(s.id)} disabled={!cancellable}>
              <Button danger disabled={!cancellable}>Cancel</Button>
            </Popconfirm>
          </>
        }
      />

      <Card size="small" style={{ marginBottom: 12 }}>
        <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }}
          items={[
            { key: "st", label: "Status", children: <StatusTag status={s.status} /> },
            { key: "c", label: "Carrier", children: `${o.carrier_name} · ${o.service_name ?? titleCase(o.service)}` },
            { key: "ct", label: "Carrier tracking #", children: <span className="mono">{s.carrierTracking}</span> },
            { key: "eta", label: s.status === "delivered" ? "Delivered" : "Predicted delivery", children: s.deliveredAt ? date(s.deliveredAt) : `${date(o.risk.eta.earliest)} – ${date(o.risk.eta.latest)}` },
            { key: "risk", label: "Delay risk", children: <RiskTag level={o.risk.level} score={o.risk.score} /> },
            { key: "co2", label: "Emissions", children: `${kg(o.co2_kg)} CO₂e` },
            { key: "pkg", label: "Package", children: `${s.package.weight_kg} kg${s.package.dimensions ? ` · ${s.package.dimensions.l}×${s.package.dimensions.w}×${s.package.dimensions.h} cm` : ""}` },
            { key: "price", label: "Price", children: `${cad(o.price_usd)}${pay ? ` · ${titleCase(pay.status === "succeeded" ? "paid" : pay.status)}` : ""}` },
          ]}
        />
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={10}>
          <Card size="small" title="Tracking">
            <Timeline
              items={s.timeline.map((t) => ({
                color: STEP_ICON[t.state].color,
                icon: STEP_ICON[t.state].icon,
                content: (
                  <>
                    <Typography.Text strong={t.state !== "upcoming"} type={t.state === "upcoming" ? "secondary" : undefined}>{t.title}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {t.location} · {t.state === "upcoming" ? `est. ${date(t.time)}` : dateTime(t.time)}
                    </Typography.Text>
                  </>
                ),
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card size="small" title="Route" style={{ marginBottom: 12 }}>
            <Table<RouteLeg>
              size="small"
              rowKey={(l) => `${l.from}-${l.to}-${l.mode}`}
              pagination={false}
              dataSource={o.route?.legs ?? []}
              columns={[
                { title: "From", dataIndex: "from", render: hubName },
                { title: "To", dataIndex: "to", render: hubName },
                { title: "Mode", dataIndex: "mode", render: modeLabel },
                { title: "Distance (km)", dataIndex: "distance_km", align: "right", render: (v: number) => Math.round(v).toLocaleString() },
                { title: "CO₂e (kg)", dataIndex: "co2_kg", align: "right", render: (v: number) => v.toFixed(1) },
              ]}
              scroll={{ x: 520 }}
            />
          </Card>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Card size="small" title="Risk factors" style={{ marginBottom: 12 }}>
                <Descriptions size="small" column={1}
                  items={o.risk.factors.map((f) => ({ key: f.factor, label: titleCase(f.factor), children: `${Math.round(f.impact * 100)}%` }))} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="Score breakdown" style={{ marginBottom: 12 }}>
                <Descriptions size="small" column={1}
                  items={[
                    { key: "t", label: "AI score", children: <strong>{Math.round(o.ai_score)}</strong> },
                    ...(["cost", "speed", "carbon", "reliability"] as const).map((k) => ({ key: k, label: titleCase(k), children: Math.round(o.ai_scores[k]) })),
                  ]} />
              </Card>
            </Col>
          </Row>
          <Card size="small" title="Documents">
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={docs}
              locale={{ emptyText: "No documents" }}
              columns={[
                { title: "File", dataIndex: "filename", render: (v: string) => <span className="mono">{v}</span> },
                { title: "Type", dataIndex: "type", render: titleCase },
                { title: "Created", dataIndex: "createdAt", render: date },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
