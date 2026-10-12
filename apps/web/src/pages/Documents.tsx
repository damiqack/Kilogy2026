import { Button, Card, Form, Select, Table } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import type { DocumentRecord } from "../data/types";
import { date, titleCase } from "../lib/format";

export function DocumentsPage() {
  const { documents, shipments, generateDocument } = useStore();
  const [shipmentId, setShipmentId] = useState(shipments[0]?.id);
  const [type, setType] = useState<DocumentRecord["type"]>("customs");
  const byId = new Map(shipments.map((s) => [s.id, s]));

  return (
    <>
      <PageHeader title="Documents" />
      <Card size="small" title="Generate" style={{ marginBottom: 16 }}>
        <Form layout="inline" onFinish={() => shipmentId && generateDocument(shipmentId, type)}>
          <Form.Item label="Shipment" htmlFor="doc-shipment">
            <Select id="doc-shipment" style={{ width: 300 }} value={shipmentId} onChange={setShipmentId} showSearch optionFilterProp="label"
              options={shipments.map((s) => ({ value: s.id, label: `${s.trackingId} · ${s.origin.city} → ${s.destination.city}` }))} />
          </Form.Item>
          <Form.Item label="Type" htmlFor="doc-type">
            <Select id="doc-type" style={{ width: 200 }} value={type} onChange={setType}
              options={[{ value: "customs", label: "Customs declaration" }, { value: "invoice", label: "Commercial invoice" }]} />
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">Generate</Button></Form.Item>
        </Form>
      </Card>
      <Card size="small" title={`Archive (${documents.length})`}>
        <Table<DocumentRecord>
          rowKey="id"
          size="small"
          dataSource={documents}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          scroll={{ x: 700 }}
          columns={[
            { title: "File", dataIndex: "filename", render: (v: string) => <span className="mono">{v}</span> },
            { title: "Type", dataIndex: "type", render: titleCase, filters: ["label", "customs", "invoice"].map((t) => ({ text: titleCase(t), value: t })), onFilter: (v, d) => d.type === v },
            { title: "Shipment", dataIndex: "shipmentId", render: (v: string) => <Link to={`/shipments/${v}`} className="mono">{byId.get(v)?.trackingId ?? v}</Link> },
            { title: "Created", dataIndex: "createdAt", render: date },
            { title: "", key: "dl", align: "right", render: () => <Button size="small" disabled title="Available when the document service is connected">Download</Button> },
          ]}
        />
      </Card>
    </>
  );
}
