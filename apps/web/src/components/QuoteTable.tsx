import { Button, Descriptions, Table, type TableColumnsType } from "antd";
import type { RankedOption } from "../data/types";
import { date, kg } from "../lib/format";
import { cad } from "../lib/money";
import { modeLabel, RouteText } from "./RouteText";
import { RiskTag } from "./StatusTag";
import { ToneTag, type Tone } from "./ToneTag";

interface Props {
  options: RankedOption[];
  onBook?: (option: RankedOption) => void;
}

const TAG_TONES: Record<string, Tone> = { recommended: "info", cheapest: "success", fastest: "warning", greenest: "success" };
const TAG_LABELS: Record<string, string> = { recommended: "Recommended", cheapest: "Lowest price", fastest: "Fastest", greenest: "Lowest CO₂" };

/** Carrier options ranked by the decision engine (Kilogy UI/UX spec, section 3.3). Rows expand to show the score breakdown. */
export function QuoteTable({ options, onBook }: Props) {
  const columns: TableColumnsType<RankedOption> = [
    { title: "#", dataIndex: "rank", width: 48 },
    {
      title: "Carrier",
      key: "carrier",
      render: (_, o) => (
        <>
          <div style={{ fontWeight: 600 }}>{o.carrier_name}</div>
          {o.tags?.map((t) => <span key={t} style={{ display: "inline-block", marginTop: 4 }}><ToneTag tone={TAG_TONES[t] ?? "neutral"}>{TAG_LABELS[t] ?? t}</ToneTag></span>)}
        </>
      ),
    },
    { title: "Service", key: "service", render: (_, o) => o.service_name ?? o.service },
    { title: "Mode", key: "mode", width: 80, render: (_, o) => modeLabel(o.route?.primary_mode ?? "air"), responsive: ["md"] },
    { title: "Price (CAD)", dataIndex: "price_usd", align: "right", sorter: (a, b) => a.price_usd - b.price_usd, render: (v: number) => cad(v) },
    { title: "Transit (days)", dataIndex: "transit_days", align: "right", sorter: (a, b) => a.transit_days - b.transit_days, render: (v: number) => Math.round(v) },
    { title: "CO₂e (kg)", dataIndex: "co2_kg", align: "right", sorter: (a, b) => (a.co2_kg ?? 0) - (b.co2_kg ?? 0), render: (v: number | null) => (v == null ? "–" : v.toFixed(1)), responsive: ["md"] },
    { title: "Delay risk", key: "risk", render: (_, o) => <RiskTag level={o.risk.level} score={o.risk.score} />, responsive: ["lg"] },
    { title: "AI score", dataIndex: "ai_score", align: "right", defaultSortOrder: "descend", sorter: (a, b) => a.ai_score - b.ai_score, render: (v: number) => <strong>{Math.round(v)}</strong> },
    ...(onBook
      ? [{ title: "", key: "book", width: 80, render: (_: unknown, o: RankedOption) => <Button type="primary" size="small" onClick={() => onBook(o)}>Book</Button> }]
      : []),
  ];

  return (
    <Table<RankedOption>
      rowKey={(o) => `${o.carrier_id}-${o.service}`}
      size="small"
      columns={columns}
      dataSource={options}
      pagination={false}
      scroll={{ x: 760 }}
      expandable={{
        expandedRowRender: (o) => (
          <Descriptions size="small" column={{ xs: 1, md: 2, xl: 3 }} bordered
            items={[
              { key: "route", label: "Route", span: "filled", children: o.route ? <RouteText legs={o.route.legs} /> : "–" },
              { key: "eta", label: "Predicted delivery", children: `${date(o.risk.eta.earliest)} – ${date(o.risk.eta.latest)}` },
              { key: "co2", label: "Emissions", children: kg(o.co2_kg) },
              { key: "cost", label: "Cost score", children: Math.round(o.ai_scores.cost) },
              { key: "speed", label: "Speed score", children: Math.round(o.ai_scores.speed) },
              { key: "carbon", label: "Carbon score", children: Math.round(o.ai_scores.carbon) },
              { key: "rel", label: "Reliability score", children: Math.round(o.ai_scores.reliability) },
              { key: "carrier", label: "Carrier cost", children: cad(o.pricing.carrier_cost_usd) },
              { key: "margin", label: "Margin", children: `${o.pricing.margin_pct}%` },
            ]}
          />
        ),
      }}
    />
  );
}
