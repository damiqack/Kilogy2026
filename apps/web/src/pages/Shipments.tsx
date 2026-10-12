import { Typography, Button, Card, Flex, Input, Segmented, Table, type TableColumnsType } from "antd";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { modeLabel } from "../components/RouteText";
import { statusLabel, StatusTag } from "../components/StatusTag";
import { useStore } from "../data/store";
import type { Shipment, ShipmentStatus } from "../data/types";
import { date, place } from "../lib/format";
import { cad } from "../lib/money";

const VIEWS: Record<string, (s: ShipmentStatus) => boolean> = {
  All: () => true,
  Active: (s) => ["booked", "picked_up", "in_transit", "customs", "out_for_delivery"].includes(s),
  Exceptions: (s) => s === "exception" || s === "delayed",
  Delivered: (s) => s === "delivered",
  Cancelled: (s) => s === "cancelled",
};

export function ShipmentsPage() {
  const { shipments } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState("All");
  const q = (params.get("q") ?? "").toLowerCase();

  const rows = useMemo(() => shipments.filter((s) => VIEWS[view](s.status) && (!q || [
    s.trackingId, s.carrierTracking, s.origin.city, s.destination.city, s.selected.carrier_name,
  ].some((v) => v?.toLowerCase().includes(q)))), [shipments, view, q]);

  const carriers = [...new Set(shipments.map((s) => s.selected.carrier_name))];

  const columns: TableColumnsType<Shipment> = [
    { title: "Tracking #", dataIndex: "trackingId", fixed: "left", width: 170, render: (v: string, s) => <Link to={`/shipments/${s.id}`} className="mono">{v}</Link> },
    { title: "Origin", key: "o", render: (_, s) => place(s.origin) },
    { title: "Destination", key: "d", render: (_, s) => place(s.destination) },
    {
      title: "Carrier / service", key: "c", width: 210,
      render: (_, s) => (
        <>
          {s.selected.carrier_name}
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{s.selected.service_name ?? s.selected.service}</Typography.Text>
        </>
      ),
      filters: carriers.map((c) => ({ text: c, value: c })), onFilter: (v, s) => s.selected.carrier_name === v,
    },
    { title: "Mode", key: "mode", render: (_, s) => modeLabel(s.selected.route?.primary_mode ?? "air") },
    { title: "Days", key: "t", align: "right", render: (_, s) => Math.round(s.selected.transit_days) },
    { title: "CO₂e (kg)", key: "co2", align: "right", render: (_, s) => s.selected.co2_kg?.toFixed(1) ?? "–" },
    { title: "Price (CAD)", key: "p", align: "right", sorter: (a, b) => a.selected.price_usd - b.selected.price_usd, render: (_, s) => cad(s.selected.price_usd) },
    {
      title: "Status", dataIndex: "status", width: 130, render: (v) => <StatusTag status={v} />,
      filters: (Object.keys({ booked: 1, picked_up: 1, in_transit: 1, customs: 1, out_for_delivery: 1, delivered: 1, delayed: 1, exception: 1, cancelled: 1 }) as ShipmentStatus[]).map((s) => ({ text: statusLabel(s), value: s })),
      onFilter: (v, s) => s.status === v,
    },
    { title: "ETA", key: "eta", sorter: (a, b) => +new Date(a.selected.risk.eta.latest) - +new Date(b.selected.risk.eta.latest), render: (_, s) => date(s.deliveredAt ?? s.selected.risk.eta.latest) },
    { title: "Created", dataIndex: "createdAt", defaultSortOrder: "descend", sorter: (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt), render: (v: string) => date(v) },
  ];

  return (
    <>
      <PageHeader title="Shipments" extra={<Button type="primary" onClick={() => navigate("/shipments/new")}>New shipment</Button>} />
      <Card size="small">
        <Flex gap={12} wrap justify="space-between" style={{ marginBottom: 12 }}>
          <Segmented options={Object.keys(VIEWS).map((v) => ({ value: v, label: `${v} (${shipments.filter((s) => VIEWS[v](s.status)).length})` }))} value={view} onChange={(v) => setView(String(v))} />
          <Input.Search
            allowClear
            placeholder="Search tracking #, city, carrier"
            defaultValue={params.get("q") ?? ""}
            onSearch={(v) => setParams(v ? { q: v } : {})}
            style={{ maxWidth: 320 }}
          />
        </Flex>
        <Table<Shipment> rowKey="id" size="small" columns={columns} dataSource={rows} pagination={{ pageSize: 20, hideOnSinglePage: true }} scroll={{ x: 1320 }} />
      </Card>
    </>
  );
}
