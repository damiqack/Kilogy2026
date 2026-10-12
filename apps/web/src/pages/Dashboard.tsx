import { Alert, Button, Card, Col, List, Row, Statistic, Table, Typography, type TableColumnsType } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusTag } from "../components/StatusTag";
import { useStore } from "../data/store";
import type { Shipment } from "../data/types";
import { date, place } from "../lib/format";
import { cad } from "../lib/money";

const IN_TRANSIT = new Set(["picked_up", "in_transit", "customs", "out_for_delivery", "delayed"]);
const ACTIVE = new Set([...IN_TRANSIT, "booked", "exception"]);

const isToday = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

export function DashboardPage() {
  const { shipments, alerts, dismissAlert } = useStore();
  const navigate = useNavigate();

  const active = shipments.filter((s) => ACTIVE.has(s.status));
  const inTransit = shipments.filter((s) => IN_TRANSIT.has(s.status));
  const onTime = inTransit.length ? Math.round((inTransit.filter((s) => s.status !== "delayed").length / inTransit.length) * 100) : 100;
  const exceptions = shipments.filter((s) => s.status === "exception" || s.status === "delayed");
  const deliveredToday = shipments.filter((s) => s.status === "delivered" && isToday(s.deliveredAt)).length;
  const spend = shipments.reduce((a, s) => a + s.selected.price_usd, 0);
  const co2 = shipments.reduce((a, s) => a + (s.selected.co2_kg ?? 0), 0);
  const [topAlert, ...otherAlerts] = alerts;

  const columns: TableColumnsType<Shipment> = [
    { title: "Tracking #", dataIndex: "trackingId", render: (v: string, s) => <Link to={`/shipments/${s.id}`} className="mono">{v}</Link> },
    { title: "Origin", key: "o", render: (_, s) => place(s.origin) },
    { title: "Destination", key: "d", render: (_, s) => place(s.destination) },
    { title: "Carrier", key: "c", render: (_, s) => s.selected.carrier_name, responsive: ["md"] },
    { title: "Status", dataIndex: "status", render: (v) => <StatusTag status={v} /> },
    { title: "ETA", key: "eta", render: (_, s) => date(s.deliveredAt ?? s.selected.risk.eta.latest) },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        extra={<Button type="primary" onClick={() => navigate("/shipments/new")}>New shipment</Button>}
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8} xl={4}><Statistic title="Active shipments" value={active.length} /></Col>
          <Col xs={12} md={8} xl={4}><Statistic title="Delivered today" value={deliveredToday} /></Col>
          <Col xs={12} md={8} xl={4}><Statistic title="In transit" value={inTransit.length} suffix={<Typography.Text type="secondary" style={{ fontSize: 13 }}>{onTime}% on time</Typography.Text>} /></Col>
          <Col xs={12} md={8} xl={4}><Statistic title="Exceptions" value={exceptions.length} styles={{ content: exceptions.length ? { color: "var(--ant-color-error)" } : undefined }} /></Col>
          <Col xs={12} md={8} xl={4}><Statistic title="Spend (CAD)" value={cad(spend)} /></Col>
          <Col xs={12} md={8} xl={4}><Statistic title="CO₂e (kg)" value={Math.round(co2)} /></Col>
        </Row>
      </Card>

      {topAlert && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={topAlert.title}
          description={
            <>
              {[topAlert.detail, topAlert.recommendation].filter(Boolean).join(" ")}
              {topAlert.cta && (
                <div style={{ marginTop: 8 }}>
                  <Button size="small" onClick={() => navigate(topAlert.cta!.to)}>{topAlert.cta.label}</Button>
                </div>
              )}
            </>
          }
          closable={{ onClose: () => dismissAlert(topAlert.id), "aria-label": "Dismiss" }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card size="small" title="Recent shipments" extra={<Link to="/shipments">View all</Link>}>
            <Table<Shipment> rowKey="id" size="small" columns={columns} dataSource={shipments.slice(0, 8)} pagination={false} scroll={{ x: 600 }} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card size="small" title={`Exceptions (${exceptions.length})`} style={{ marginBottom: 16 }}>
            <List
              size="small"
              dataSource={exceptions}
              locale={{ emptyText: "No exceptions" }}
              renderItem={(s) => (
                <List.Item extra={<StatusTag status={s.status} />}>
                  <List.Item.Meta
                    title={<Link to={`/shipments/${s.id}`} className="mono">{s.trackingId}</Link>}
                    description={`${place(s.origin)} → ${place(s.destination)} · ${s.selected.carrier_name}`}
                  />
                </List.Item>
              )}
            />
          </Card>
          <Card size="small" title="Recommendations">
            <List
              size="small"
              dataSource={otherAlerts}
              locale={{ emptyText: "Nothing to review" }}
              renderItem={(a) => (
                <List.Item>
                  <List.Item.Meta
                    title={a.title}
                    description={
                      <>
                        {a.detail}
                        {a.cta && <div style={{ marginTop: 4 }}><Link to={a.cta.to}>{a.cta.label}</Link></div>}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
