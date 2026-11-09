import { SearchOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Input, Segmented, Select, Table, Typography, type TableColumnsType } from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FilterBar, NoMatches } from "../components/FilterBar";
import { PageHeader } from "../components/PageHeader";
import { modeLabel } from "../components/RouteText";
import { StatusTag } from "../components/StatusTag";
import { COUNTRIES } from "../config/reference";
import { useStore } from "../data/store";
import type { Shipment, ShipmentStatus } from "../data/types";
import { date, place } from "../lib/format";
import { cad } from "../lib/money";
import { useUrlFilters } from "../lib/useUrlFilters";

const VIEWS: Record<string, (s: ShipmentStatus) => boolean> = {
  All: () => true,
  Active: (s) => ["created", "booked", "picked_up", "in_transit", "customs", "out_for_delivery"].includes(s),
  Exceptions: (s) => s === "exception" || s === "delayed",
  Delivered: (s) => s === "delivered",
  Cancelled: (s) => s === "cancelled",
};

const FILTER_KEYS = ["view", "q", "carrier", "mode", "dest", "from", "to"] as const;
const COUNTRY_NAME = new Map(COUNTRIES);
const modeOf = (s: Shipment) => s.selected.route?.primary_mode ?? "air";

export function ShipmentsPage() {
  const { shipments } = useStore();
  const navigate = useNavigate();
  const f = useUrlFilters(FILTER_KEYS);

  const view = VIEWS[f.get("view")] ? f.get("view") : "All";
  const q = f.get("q").trim().toLowerCase();
  const carriers = f.getList("carrier");
  const modes = f.getList("mode");
  const dests = f.getList("dest");
  const from = f.get("from") ? dayjs(f.get("from")) : null;
  const to = f.get("to") ? dayjs(f.get("to")) : null;

  // Every filter except the status view, so the view tabs can show how many rows each one would leave.
  const base = useMemo(() => shipments.filter((s) =>
    (!q || [s.trackingId, s.carrierTracking, s.origin.city, s.destination.city, s.selected.carrier_name]
      .some((v) => v?.toLowerCase().includes(q)))
    && (!carriers.length || carriers.includes(s.selected.carrier_name))
    && (!modes.length || modes.includes(modeOf(s)))
    && (!dests.length || dests.includes(s.destination.country))
    && (!from || !dayjs(s.createdAt).isBefore(from.startOf("day")))
    && (!to || !dayjs(s.createdAt).isAfter(to.endOf("day"))),
  ), [shipments, q, carriers.join(), modes.join(), dests.join(), f.get("from"), f.get("to")]);
  const rows = base.filter((s) => VIEWS[view](s.status));

  const options = useMemo(() => ({
    carriers: [...new Set(shipments.map((s) => s.selected.carrier_name))].sort().map((c) => ({ value: c, label: c })),
    modes: [...new Set(shipments.map(modeOf))].sort().map((m) => ({ value: m, label: modeLabel(m) })),
    dests: [...new Set(shipments.map((s) => s.destination.country))].sort()
      .map((c) => ({ value: c, label: COUNTRY_NAME.get(c) ?? c })),
  }), [shipments]);

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
    },
    { title: "Mode", key: "mode", render: (_, s) => modeLabel(modeOf(s)) },
    { title: "Days", key: "t", align: "right", sorter: (a, b) => a.selected.transit_days - b.selected.transit_days, render: (_, s) => Math.round(s.selected.transit_days) },
    { title: "CO₂e (kg)", key: "co2", align: "right", sorter: (a, b) => (a.selected.co2_kg ?? 0) - (b.selected.co2_kg ?? 0), render: (_, s) => s.selected.co2_kg?.toFixed(1) ?? "–" },
    { title: "Price (CAD)", key: "p", align: "right", sorter: (a, b) => a.selected.price_usd - b.selected.price_usd, render: (_, s) => cad(s.selected.price_usd) },
    { title: "Status", dataIndex: "status", width: 130, render: (v) => <StatusTag status={v} /> },
    { title: "ETA", key: "eta", sorter: (a, b) => +new Date(a.selected.risk.eta.latest) - +new Date(b.selected.risk.eta.latest), render: (_, s) => date(s.deliveredAt ?? s.selected.risk.eta.latest) },
    { title: "Created", dataIndex: "createdAt", defaultSortOrder: "descend", sorter: (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt), render: (v: string) => date(v) },
  ];

  return (
    <>
      <PageHeader title="Shipments" extra={<Button type="primary" onClick={() => navigate("/shipments/new")}>New shipment</Button>} />
      <Card size="small">
        <FilterBar shown={rows.length} total={shipments.length} noun="shipments" onClear={f.clear} canClear={f.activeCount > 0}>
          <Segmented
            aria-label="Status"
            value={view}
            onChange={(v) => f.set("view", v === "All" ? null : String(v))}
            options={Object.keys(VIEWS).map((v) => ({ value: v, label: `${v} (${base.filter((s) => VIEWS[v](s.status)).length})` }))}
          />
          <Input
            className="kfilters-search"
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tracking #, city or carrier"
            aria-label="Filter shipments by text"
            value={f.get("q")}
            onChange={(e) => f.set("q", e.target.value)}
          />
          <Select mode="multiple" allowClear maxTagCount="responsive" aria-label="Carrier" placeholder="All carriers"
            options={options.carriers} value={carriers} onChange={(v) => f.set("carrier", v)} />
          <Select mode="multiple" allowClear maxTagCount="responsive" aria-label="Mode" placeholder="All modes"
            options={options.modes} value={modes} onChange={(v) => f.set("mode", v)} />
          <Select mode="multiple" allowClear maxTagCount="responsive" aria-label="Destination country" placeholder="All destinations"
            options={options.dests} value={dests} onChange={(v) => f.set("dest", v)} />
          <DatePicker.RangePicker
            aria-label="Created between"
            placeholder={["Created from", "Created to"]}
            format="MMM D"
            value={[from, to]}
            allowEmpty={[true, true]}
            onChange={(v) => f.setMany({ from: v?.[0]?.format("YYYY-MM-DD"), to: v?.[1]?.format("YYYY-MM-DD") })}
          />
        </FilterBar>
        <Table<Shipment>
          rowKey="id" size="small" columns={columns} dataSource={rows}
          pagination={{ pageSize: 20, hideOnSinglePage: true }} scroll={{ x: 1320 }}
          locale={{ emptyText: <NoMatches noun="shipments" onClear={f.clear} /> }}
        />
      </Card>
    </>
  );
}
