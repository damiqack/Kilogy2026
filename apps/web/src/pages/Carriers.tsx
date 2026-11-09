import { SearchOutlined } from "@ant-design/icons";
import { Button, Card, Input, Segmented, Select, Table } from "antd";
import { useNavigate } from "react-router-dom";
import { FilterBar, NoMatches } from "../components/FilterBar";
import { Indicator } from "../components/Indicator";
import { PageHeader } from "../components/PageHeader";
import { modeLabel } from "../components/RouteText";
import { CARRIERS } from "../data/carriers";
import type { Carrier } from "../data/types";
import { pct, titleCase } from "../lib/format";
import { useUrlFilters } from "../lib/useUrlFilters";

const STATUS_TONE = { connected: "success", sandbox: "info", planned: "neutral" } as const;
const STATUSES: Carrier["status"][] = ["connected", "sandbox", "planned"];
const FILTER_KEYS = ["status", "q", "mode", "service", "ontime"] as const;

const MODE_OPTIONS = [...new Set(CARRIERS.flatMap((c) => c.modes))].map((m) => ({ value: m, label: modeLabel(m) }));
const SERVICE_OPTIONS = [...new Set(CARRIERS.flatMap((c) => c.services))].map((s) => ({ value: s, label: titleCase(s) }));
const ON_TIME_OPTIONS = [
  { value: "", label: "Any on-time rate" },
  { value: "85", label: "85% or better" },
  { value: "90", label: "90% or better" },
  { value: "93", label: "93% or better" },
];

export function CarriersPage() {
  const f = useUrlFilters(FILTER_KEYS);
  const navigate = useNavigate();
  const status = STATUSES.includes(f.get("status") as Carrier["status"]) ? f.get("status") : "all";
  const q = f.get("q").trim().toLowerCase();
  const modes = f.getList("mode");
  const services = f.getList("service");
  const minOnTime = Number(f.get("ontime")) / 100 || 0;

  // Every filter except integration status, so the status tabs can show their counts.
  const base = CARRIERS.filter((c) =>
    (!q || `${c.name} ${c.coverage}`.toLowerCase().includes(q))
    && (!modes.length || c.modes.some((m) => modes.includes(m)))
    && (!services.length || c.services.some((s) => services.includes(s)))
    && c.onTime >= minOnTime);
  const rows = base.filter((c) => status === "all" || c.status === status);

  return (
    <>
      <PageHeader title="Carriers" subtitle="Integrations through the carrier gateway." extra={<Button onClick={() => navigate("/integrations")}>Integration Hub</Button>} />
      <Card size="small">
        <FilterBar shown={rows.length} total={CARRIERS.length} noun="carriers" onClear={f.clear} canClear={f.activeCount > 0}>
          <Segmented
            aria-label="Integration status"
            value={status}
            onChange={(v) => f.set("status", v === "all" ? null : String(v))}
            options={[
              { value: "all", label: `All (${base.length})` },
              ...STATUSES.map((s) => ({ value: s, label: `${titleCase(s)} (${base.filter((c) => c.status === s).length})` })),
            ]}
          />
          <Input
            className="kfilters-search"
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Carrier name or coverage"
            aria-label="Filter carriers by text"
            value={f.get("q")}
            onChange={(e) => f.set("q", e.target.value)}
          />
          <Select mode="multiple" allowClear maxTagCount="responsive" aria-label="Transport mode" placeholder="All modes"
            options={MODE_OPTIONS} value={modes} onChange={(v) => f.set("mode", v)} />
          <Select mode="multiple" allowClear maxTagCount="responsive" aria-label="Service level" placeholder="All service levels"
            options={SERVICE_OPTIONS} value={services} onChange={(v) => f.set("service", v)} />
          <Select aria-label="Minimum on-time rate" options={ON_TIME_OPTIONS} value={f.get("ontime")} onChange={(v) => f.set("ontime", v)} />
        </FilterBar>
        <Table<Carrier>
          rowKey="id"
          size="small"
          dataSource={rows}
          pagination={false}
          scroll={{ x: 900 }}
          locale={{ emptyText: <NoMatches noun="carriers" onClear={f.clear} /> }}
          columns={[
            { title: "Carrier", dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name), render: (v: string) => <strong>{v}</strong> },
            { title: "Services", dataIndex: "services", render: (v: string[]) => v.map(titleCase).join(", ") },
            { title: "Modes", dataIndex: "modes", render: (v: string[]) => v.map(modeLabel).join(", ") },
            { title: "Coverage", dataIndex: "coverage" },
            { title: "On-time", dataIndex: "onTime", align: "right", defaultSortOrder: "descend", sorter: (a, b) => a.onTime - b.onTime, render: pct },
            { title: "CO₂e / kg", dataIndex: "avgCo2PerKg", align: "right", sorter: (a, b) => a.avgCo2PerKg - b.avgCo2PerKg, render: (v: number) => `${v} kg` },
            { title: "API latency (p50)", dataIndex: "apiLatencyMs", align: "right", sorter: (a, b) => (a.apiLatencyMs ?? Infinity) - (b.apiLatencyMs ?? Infinity), render: (v?: number) => (v ? `${v} ms` : "–") },
            { title: "Integration", dataIndex: "status", render: (v: Carrier["status"]) => <Indicator tone={STATUS_TONE[v]}>{titleCase(v)}</Indicator> },
          ]}
        />
      </Card>
    </>
  );
}
