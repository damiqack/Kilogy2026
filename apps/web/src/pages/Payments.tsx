import { BankOutlined, CreditCardOutlined, FileTextOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, Popconfirm, Row, Statistic, Table, Tag } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AddPaymentMethod } from "../components/AddPaymentMethod";
import { Indicator } from "../components/Indicator";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import type { Payment, PaymentMethod } from "../data/types";
import { date } from "../lib/format";
import { cad } from "../lib/money";
import "./payments.css";

const STATUS = { succeeded: { tone: "success", label: "Paid" }, pending: { tone: "warning", label: "Pending" }, failed: { tone: "error", label: "Failed" } } as const;
const ICON = { card: <CreditCardOutlined />, bank: <BankOutlined />, invoice: <FileTextOutlined /> };

function describe(m: PaymentMethod) {
  if (m.kind === "card") return `Expires ${m.expiry}`;
  if (m.kind === "bank") return `Pre-authorized debit · institution ${m.institution}`;
  return "Billed monthly, due 30 days after invoice";
}

export function PaymentsPage() {
  const { payments, shipments, paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } = useStore();
  const { message } = App.useApp();
  const [adding, setAdding] = useState(false);
  const byId = new Map(shipments.map((s) => [s.id, s]));
  const total = (status: Payment["status"]) => payments.filter((p) => p.status === status).reduce((a, p) => a + p.amount_usd, 0);

  return (
    <>
      <PageHeader title="Payments" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAdding(true)}>Add payment method</Button>} />
      <Card size="small" className="kpi-strip" style={{ marginBottom: 16 }}>
        <Row>
          <Col className="kpi-cell" xs={12} md={8}><Statistic title="Paid (CAD)" value={cad(total("succeeded"))} /></Col>
          <Col className="kpi-cell" xs={12} md={8}><Statistic title="Outstanding (CAD)" value={cad(total("pending"))} /></Col>
          <Col className="kpi-cell" xs={24} md={8}><Statistic title="Transactions" value={payments.length} /></Col>
        </Row>
      </Card>

      <Card size="small" title="Payment methods" style={{ marginBottom: 16 }}
        extra={<span className="ktiny">New bookings are charged to the default method.</span>}>
        <ul className="kpm-list">
          {paymentMethods.map((m) => (
            <li key={m.id} className={m.isDefault ? "is-default" : ""}>
              <span className={`kpm-icon is-${m.kind}`} aria-hidden>{ICON[m.kind]}</span>
              <div className="kpm-body">
                <div className="kpm-title">
                  <b>{m.label}</b>
                  {m.nickname && <span className="kpm-nick">{m.nickname}</span>}
                  {m.isDefault && <Tag color="blue">Default</Tag>}
                </div>
                <div className="ktiny">{m.holder} · {describe(m)}</div>
              </div>
              <div className="kpm-actions">
                {!m.isDefault && (
                  <Button size="small" type="link" onClick={() => { setDefaultPaymentMethod(m.id); message.success(`${m.label} is now your default`); }}>Make default</Button>
                )}
                <Popconfirm title={`Remove ${m.label}?`} description={m.isDefault && paymentMethods.length > 1 ? "Another method will become the default." : undefined}
                  okText="Remove" okButtonProps={{ danger: true }} cancelText="Keep" onConfirm={() => { removePaymentMethod(m.id); message.success("Payment method removed"); }}>
                  <Button size="small" type="link" danger aria-label={`Remove ${m.label}`}>Remove</Button>
                </Popconfirm>
              </div>
            </li>
          ))}
          <li className="kpm-add">
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setAdding(true)}>Add a card or bank account</Button>
          </li>
        </ul>
        {paymentMethods.length === 0 && <p className="kpm-empty">No payment methods yet. Add one so new bookings can be charged.</p>}
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

      <AddPaymentMethod open={adding} hasMethods={paymentMethods.length > 0} onClose={() => setAdding(false)}
        onAdd={(m) => { addPaymentMethod(m); message.success(`${m.label} added`); }} />
    </>
  );
}
