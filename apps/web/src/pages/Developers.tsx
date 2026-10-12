import { Button, Card, Col, Input, Progress, Row, Table, Tabs, Typography } from "antd";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Indicator, type Tone } from "../components/Indicator";
import { ArchitectureTab } from "./developers/ArchitectureTab";
import { ENDPOINTS, SDK_SAMPLE } from "./developers/reference";

const METHOD_TONE: Record<string, Tone> = { GET: "info", POST: "success", PUT: "warning", DELETE: "error" };

function KeysTab() {
  const used = 3412, limit = 10000;
  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} lg={14}>
        <Card size="small" title="API keys" extra={<Button size="small">Create key</Button>}>
          <Table size="small" rowKey="name" pagination={false}
            dataSource={[{ name: "Development", env: "test", key: "kg_test_dev_key_123", created: "2026-09-22", lastUsed: "Today" }]}
            columns={[
              { title: "Name", dataIndex: "name" },
              { title: "Environment", dataIndex: "env", render: (v: string) => <Indicator tone="neutral">{v}</Indicator> },
              { title: "Key", dataIndex: "key", render: (v: string) => <Input.Password value={v} readOnly size="small" style={{ maxWidth: 220 }} aria-label="API key" /> },
              { title: "Created", dataIndex: "created" },
              { title: "Last used", dataIndex: "lastUsed" },
            ]} />
          <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
            Keys are hashed with bcrypt before storage. Exchange a key for a 15-minute JWT at POST /api/v1/auth/token.
          </Typography.Paragraph>
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card size="small" title="Usage this hour" extra={<Indicator tone="info">Pro</Indicator>}>
          <Progress aria-label="Requests used this hour" percent={Math.round((used / limit) * 100)} format={() => `${used.toLocaleString()} / ${limit.toLocaleString()}`} />
          <Table size="small" rowKey="tier" pagination={false} style={{ marginTop: 12 }}
            dataSource={[{ tier: "Free", limit: "100 / hour" }, { tier: "Pro", limit: "10,000 / hour" }, { tier: "Enterprise", limit: "Custom" }]}
            columns={[{ title: "Tier", dataIndex: "tier" }, { title: "Rate limit", dataIndex: "limit" }]} />
        </Card>
      </Col>
    </Row>
  );
}

function WebhooksTab() {
  return (
    <Card size="small" title="Webhook endpoints" extra={<Button size="small">Add endpoint</Button>}>
      <Table size="small" rowKey="url" pagination={false} scroll={{ x: 700 }}
        dataSource={[
          { url: "https://example-shipper.ca/hooks/kilogy", events: ["shipment.booked", "tracking.event", "shipment.delivered"], ok: true },
          { url: "https://erp.example.com/kilogy/payments", events: ["payment.succeeded", "payment.failed"], ok: false },
        ]}
        columns={[
          { title: "Endpoint", dataIndex: "url", render: (v: string) => <span className="mono">{v}</span> },
          { title: "Events", dataIndex: "events", render: (v: string[]) => v.map((e) => <Indicator key={e} tone="neutral">{e}</Indicator>) },
          { title: "Last delivery", dataIndex: "ok", render: (ok: boolean) => <Indicator tone={ok ? "success" : "error"}>{ok ? "200 OK" : "Failed, retrying"}</Indicator> },
        ]} />
    </Card>
  );
}

function ReferenceTab() {
  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} xl={14}>
        <Card size="small" title="Endpoints (v1)">
          <Table size="small" rowKey={(r) => r.method + r.path} pagination={false} dataSource={ENDPOINTS} scroll={{ x: 600 }}
            columns={[
              { title: "Group", dataIndex: "group", onCell: (r, i) => ({ rowSpan: i !== undefined && i > 0 && ENDPOINTS[i - 1].group === r.group ? 0 : ENDPOINTS.filter((e) => e.group === r.group).length }) },
              { title: "Method", dataIndex: "method", width: 90, render: (v: string) => <Indicator tone={METHOD_TONE[v]}>{v}</Indicator> },
              { title: "Path", dataIndex: "path", render: (v: string) => <span className="mono">{v}</span> },
              { title: "Description", dataIndex: "description" },
            ]} />
        </Card>
      </Col>
      <Col xs={24} xl={10}>
        <Card size="small" title="Node.js SDK">
          <Typography.Paragraph copyable={{ text: SDK_SAMPLE }} style={{ marginBottom: 0 }}>
            <pre style={{ margin: 0, fontSize: 12, overflowX: "auto" }}>{SDK_SAMPLE}</pre>
          </Typography.Paragraph>
        </Card>
      </Col>
    </Row>
  );
}

const TABS = [
  { key: "keys", label: "API keys", children: <KeysTab /> },
  { key: "webhooks", label: "Webhooks", children: <WebhooksTab /> },
  { key: "reference", label: "API reference", children: <ReferenceTab /> },
  { key: "architecture", label: "Architecture", children: <ArchitectureTab /> },
];

export function DevelopersPage() {
  const [params, setParams] = useSearchParams();
  const active = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab")! : "keys";
  return (
    <>
      <PageHeader title="Dev / API" />
      <Tabs activeKey={active} onChange={(k) => setParams(k === "keys" ? {} : { tab: k }, { replace: true })} items={TABS} />
    </>
  );
}
