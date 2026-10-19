import {
  AimOutlined, BulbOutlined, CalendarOutlined, CheckCircleFilled, ClockCircleOutlined, CloudOutlined,
  CodeSandboxOutlined, DollarOutlined, ExpandOutlined, FileTextOutlined, GlobalOutlined, PlusOutlined,
  ReloadOutlined, SafetyCertificateOutlined, SettingOutlined, ThunderboltOutlined, CarOutlined, WarningOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Select, Table, Tag, type TableColumnsType } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Progress } from "../components/Charts";
import { KilogyLogo } from "../components/KilogyLogo";
import { CarrierMark, ModeLabel } from "../components/ModeIcon";
import { StatCard } from "../components/StatCard";
import { StatusTag } from "../components/StatusTag";
import { WorldMap } from "../components/WorldMap";
import { CARRIERS } from "../data/carriers";
import { delta, isDelayed, isDelivered, isInTransit, primaryMode, progress, routePoints, statusColor } from "../data/insights";
import { useStore } from "../data/store";
import type { Mode, Shipment } from "../data/types";
import { date, place } from "../lib/format";
import "./tracking.css";

const TILES = [
  { to: "/shipments/new", title: "Get Instant Quote", sub: "Compare rates in seconds", icon: <FileTextOutlined />, color: "#4f46e5" },
  { to: "/shipments/new", title: "Book Shipment", sub: "Ocean, Air, Road, Courier", icon: <CodeSandboxOutlined />, color: "#16a34a" },
  { to: "/shipments", title: "Track Shipment", sub: "Real-time visibility", icon: <EnvironmentOutlined />, color: "#2563eb" },
  { to: "/shipments/new", title: "AI Optimize", sub: "Find best route & cost", icon: <AimOutlined />, color: "#7c3aed" },
];

/** Tracking page: the "Logistics Control Tower" from Kilogy's mockup. */
export function ControlTowerPage() {
  const { shipments, alerts } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode | "all">("all");
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(30, "day"), dayjs()]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useMemo(
    () => shipments.filter((s) => (mode === "all" || primaryMode(s) === mode)
      && dayjs(s.createdAt).isAfter(range[0].startOf("day")) && dayjs(s.createdAt).isBefore(range[1].endOf("day"))),
    [shipments, mode, range],
  );
  const days = Math.max(1, range[1].diff(range[0], "day"));
  const selected = list.find((s) => s.id === selectedId) ?? list.find(isInTransit) ?? list[0];
  const spend = list.reduce((a, s) => a + s.selected.price_usd, 0);
  const [top, ...rest] = alerts;

  // Destination weather risk for shipments still moving, from the AI engine's risk factors.
  const weather = list.filter((s) => !isDelivered(s)).map((s) => {
    const f = s.selected.risk.factors.find((x) => x.factor === "weather")?.impact ?? 0;
    return { s, risk: Math.round(f * s.selected.risk.score * 100) };
  }).sort((a, b) => b.risk - a.risk).filter((w, i, arr) => arr.findIndex((x) => x.s.destination.city === w.s.destination.city) === i).slice(0, 2);

  const columns: TableColumnsType<Shipment> = [
    { title: "Shipment ID", dataIndex: "trackingId", render: (v: string, s) => <Link to={`/shipments/${s.id}`} className="mono">{v}</Link> },
    { title: "Origin → Destination", key: "r", render: (_, s) => `${place(s.origin)} → ${place(s.destination)}` },
    { title: "Mode", key: "m", render: (_, s) => <ModeLabel mode={primaryMode(s)} /> },
    { title: "Carrier", key: "c", render: (_, s) => <CarrierMark id={s.selected.carrier_id} name={s.selected.carrier_name} /> },
    { title: "Status", dataIndex: "status", render: (v) => <StatusTag status={v} /> },
    { title: "ETA", key: "eta", render: (_, s) => date(s.deliveredAt ?? s.selected.risk.eta.latest) },
    { title: "Progress", key: "p", width: 170, render: (_, s) => <Progress value={progress(s)} color={isDelayed(s) ? "#f97316" : "#2563eb"} /> },
  ];

  return (
    <div className="ktower">
      <div className="ktower-main">
        <div className="ktiles">
          {TILES.map((t) => (
            <Link key={t.title} to={t.to} className="ktile">
              <span className="ktile-ico" style={{ background: t.color }}>{t.icon}</span>
              <div><b>{t.title}</b><span>{t.sub}</span></div>
            </Link>
          ))}
        </div>

        <div className="ktower-title">
          <div>
            <h1>Logistics Control Tower</h1>
            <p>Real-time overview of your global operations</p>
          </div>
          <div className="ktower-filters">
            <Select aria-label="Transport mode" value={mode} onChange={setMode} style={{ width: 160 }} size="large"
              options={[{ value: "all", label: "All Modes" }, { value: "ocean", label: "Ocean" }, { value: "air", label: "Air" }, { value: "road", label: "Road" }]} />
            <DatePicker.RangePicker size="large" value={range} allowClear={false} aria-label="Date range"
              onChange={(v) => v?.[0] && v[1] && setRange([v[0], v[1]])} format="MMM D, YYYY" suffixIcon={<CalendarOutlined />} />
            <Button size="large" icon={<ReloadOutlined />} aria-label="Refresh" onClick={() => setRange([range[0], dayjs()])} />
          </div>
        </div>

        <div className="kstat-grid" style={{ margin: 0 }}>
          <StatCard label="Total Shipments" value={list.length} icon={<CodeSandboxOutlined />} color="#7c3aed" delta={delta(shipments, () => true, days)} caption={`vs last ${days} days`} />
          <StatCard label="In Transit" value={list.filter(isInTransit).length} icon={<CarOutlined />} color="#2563eb" delta={delta(shipments, isInTransit, days)} caption={`vs last ${days} days`} />
          <StatCard label="Delivered" value={list.filter(isDelivered).length} icon={<CheckCircleFilled />} color="#16a34a" delta={delta(shipments, isDelivered, days)} caption={`vs last ${days} days`} />
          <StatCard label="Delayed" value={list.filter(isDelayed).length} icon={<ClockCircleOutlined />} color="#f97316" invert delta={delta(shipments, isDelayed, days)} caption={`vs last ${days} days`} />
          <StatCard label="Total Spend (USD)" value={`$${spend.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} icon={<DollarOutlined />} color="#7c3aed" caption="booked price" />
        </div>

        <section className="kcard kdark ktower-map">
          <h2>Global Shipments Live Map</h2>
          <div className="ktower-legend" aria-label="Legend">
            <span><i style={{ background: "#22c55e" }} />Delivered</span>
            <span><i style={{ background: "#60a5fa" }} />In Transit</span>
            <span><i style={{ background: "#f97316" }} />Delayed</span>
            <span><i style={{ background: "#ef4444" }} />Exception</span>
          </div>
          <WorldMap
            label="Live map of shipment routes"
            arcs={list.flatMap((s) => {
              const p = routePoints(s);
              return p.slice(1).map((to, i) => ({ from: p[i], to, color: statusColor(s), dashed: primaryMode(s) === "ocean", width: s === selected ? 3 : 1.6 }));
            })}
            points={list.flatMap((s) => routePoints(s).map((at) => ({ at, color: statusColor(s), r: 4 })))}
          />
          {selected && (
            <div className="ktower-pop">
              <div className="row"><b className="mono">{selected.trackingId}</b><StatusTag status={selected.status} /></div>
              <p>{place(selected.origin)} → {place(selected.destination)}</p>
              <p>ETA: {date(selected.selected.risk.eta.latest)} · <ModeLabel mode={primaryMode(selected)} /></p>
              <p>{selected.selected.carrier_name} · {selected.package.weight_kg} kg</p>
              <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/shipments/${selected.id}`)}>View Details</Button>
            </div>
          )}
          <Button className="ktower-full" icon={<ExpandOutlined />} onClick={() => navigate("/shipments")}>View All Shipments</Button>
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Recent Shipments</h2><Link to="/shipments">View All Shipments →</Link></div>
          <div className="kcard-body">
            <Table<Shipment> rowKey="id" size="small" columns={columns} dataSource={list.slice(0, 8)} pagination={false} scroll={{ x: 900 }}
              onRow={(s) => ({ onClick: () => setSelectedId(s.id), style: { cursor: "pointer" } })}
              rowClassName={(s) => (s.id === selected?.id ? "ant-table-row-selected" : "")} />
          </div>
        </section>
      </div>

      <aside className="ktower-side">
        <section className="kcard">
          <div className="kcard-head"><h2>KILOGY AI Recommendations</h2><Link to="/dashboard">View all</Link></div>
          <div className="kcard-body">
            {top && (
              <div className="kreco">
                <div className="kreco-head"><span><BulbOutlined /> {top.title}</span><Tag className={top.severity === "critical" ? "ktag-high" : "ktag-med"}>{top.severity === "critical" ? "High Impact" : "Medium Impact"}</Tag></div>
                <p>{top.detail}</p>
                {top.recommendation && <p><b>{top.recommendation}</b></p>}
                {top.cta && <Button size="small" onClick={() => navigate(top.cta!.to)}>{top.cta.label}</Button>}
              </div>
            )}
            <ul className="klist">
              {rest.map((a) => (
                <li key={a.id}>
                  <span className="kicon-round" style={{ color: "#c2410c", background: "#fff7ed" }}><WarningOutlined /></span>
                  <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</div><div className="ktiny">{a.detail}</div></div>
                </li>
              ))}
              <li>
                <span className="kicon-round" style={{ color: "#16a34a", background: "#ecfdf3" }}><ThunderboltOutlined /></span>
                <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>Performance Insight</div>
                  <div className="ktiny">{[...CARRIERS].sort((a, b) => b.onTime - a.onTime)[0].name} on-time performance: {Math.round([...CARRIERS].sort((a, b) => b.onTime - a.onTime)[0].onTime * 100)}%</div></div>
              </li>
            </ul>
          </div>
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Connected Providers</h2><Link to="/carriers">View all</Link></div>
          <div className="kcard-body kproviders">
            {CARRIERS.map((c) => (
              <div key={c.id} className="kprovider" title={`${c.name}: ${c.status}`}>
                {c.name.replace(/ (Express|International|Worldwide|Air Cargo|\(LCL ocean\)|Logistics)$/, "")}
                <span className="on" style={{ background: c.status === "planned" ? "#cbd5e1" : "#22c55e" }} role="img" aria-label={c.status === "planned" ? "planned" : "connected"} />
              </div>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => navigate("/carriers")} style={{ height: "auto", minHeight: 58 }}>Add New</Button>
          </div>
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Route Weather Alerts</h2><Link to="/shipments">View all</Link></div>
          <div className="kcard-body kweather">
            {weather.map(({ s, risk }) => (
              <div key={s.id}>
                <span>{place(s.destination)}</span>
                <b><CloudOutlined /> {risk}%</b>
                <span>Weather delay risk</span>
                <div className="ktiny" style={{ color: risk >= 15 ? "#b91c1c" : "#15803d", fontWeight: 600 }}>{risk >= 15 ? "High impact on deliveries" : "Low impact"}</div>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <footer className="kband">
        <div><span className="ico"><SettingOutlined /></span><div><b>One Platform</b><span>All carriers. All modes. One integration.</span></div></div>
        <div><span className="ico"><BulbOutlined /></span><div><b>AI Powered</b><span>Smarter decisions, lower costs, better performance.</span></div></div>
        <div><span className="ico"><AimOutlined /></span><div><b>Real-time Visibility</b><span>End-to-end tracking across the supply chain.</span></div></div>
        <div><span className="ico"><SafetyCertificateOutlined /></span><div><b>Secure &amp; Compliant</b><span>Your data is protected and always compliant.</span></div></div>
        <div><span className="ico"><GlobalOutlined /></span><div><b>Global Coverage</b><span>Canada–Africa lanes today, more to come.</span></div></div>
        <div className="kband-brand"><KilogyLogo onDark height={34} /><span style={{ marginTop: 8 }}>One Platform. Every Carrier. Every Shipment.</span></div>
      </footer>
    </div>
  );
}
