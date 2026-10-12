import { Card, Col, Row, Statistic, Table } from "antd";
import { Indicator } from "../components/Indicator";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import type { Payment } from "../data/types";
import { date } from "../lib/format";
import { cad } from "../lib/money";

const STATUS = { succeeded: { tone: "success", label: "Paid" }, pending: { tone: "warning", label: "Pending" }, failed: { tone: "error", label: "Failed" } } as const;

export function PaymentsPage() {
  const { payments, shipments } = useStore();
  const byId = new Map(shipments.map((s) => [s.id, s]));
  const total = (status: Payment["status"]) => payments.filter((p) => p.status === status).reduce((a, p) => a + p.amount_usd, 0);

  return (
    <>
      <PageHeader title="Payments" />
      <Card size="small" className="kpi-strip" style={{ marginBottom: 16 }}>
        <Row>
          <Col className="kpi-cell" xs={12} md={8}><Statistic title="Paid (CAD)" value={cad(total("succeeded"))} /></Col>
          <Col className="kpi-cell" xs={12} md={8}><Statistic title="Outstanding (CAD)" value={cad(total("pending"))} /></Col>
          <Col className="kpi-cell" xs={24} md={8}><Statistic title="Transactions" value={payments.length} /></Col>
        </Row>
      </Card>
      <Card size="small" title="Ledger">
        <Table<Payment>
          rowKey="id"
          size="small"
          dataSource={payments}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          scroll={{ x: 700 }}
          columns={[
            { title: "Payment ID", dataIndex: "id", render: (v: string) => <span className="mono">{v}</span> },
            { title: "Shipment", dataIndex: "shipmentId", render: (v: string) => <Link to={`/shipments/${v}`} className="mono">{byId.get(v)?.trackingId ?? v}</Link> },
            { title: "Method", dataIndex: "method" },
            { title: "Amount (CAD)", dataIndex: "amount_usd", align: "right", render: (v: number) => cad(v) },
            { title: "Status", dataIndex: "status", render: (v: Payment["status"]) => <Indicator tone={STATUS[v].tone}>{STATUS[v].label}</Indicator> },
            { title: "Date", dataIndex: "createdAt", render: date, defaultSortOrder: "descend", sorter: (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt) },
          ]}
        />
      </Card>
    </>
  );
}
