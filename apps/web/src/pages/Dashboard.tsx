import {
  BarChartOutlined, CheckCircleFilled, ClockCircleOutlined, CodeSandboxOutlined,
  CarOutlined, EnvironmentOutlined, FileTextOutlined, PlusOutlined, SwapOutlined,
} from "@ant-design/icons";
import { Button, Segmented, Select, Table, type TableColumnsType } from "antd";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, type Slice } from "../components/Charts";
import { CarrierMark, ModeIcon } from "../components/ModeIcon";
import { StatCard } from "../components/StatCard";
import { StatusTag } from "../components/StatusTag";
import { WorldMap } from "../components/WorldMap";
import { DEMO_USER } from "../config/navigation";
import { REGION_COORDS } from "../config/geo";
import {
  co2Saved, countBy, delta, isDelayed, isDelivered, isInTransit, primaryMode, recentActivity, regionOf,
  routePoints, statusColor, timeAgo, topRoutes, weekly,
} from "../data/insights";
import { useStore } from "../data/store";
import type { Mode, Shipment } from "../data/types";
import { date } from "../lib/format";
import "./dashboard.css";

const CARRIER_PALETTE = ["#0b1f4d", "#2563eb", "#7fbde7", "#0d9488", "#f59e0b", "#a855f7", "#94a3b8"];
/** Status colors are tuned for the dark map; these darker shades read better on the light one. */
const LIGHT: Record<string, string> = { "#60a5fa": "#2563eb", "#22c55e": "#16a34a", "#f97316": "#ea580c" };
const MODES: { mode: Mode; label: string }[] = [
  { mode: "ocean", label: "Ocean" }, { mode: "air", label: "Air" }, { mode: "road", label: "Road" }, { mode: "rail", label: "Rail" },
];
const METRICS = {
  Cost: { value: (s: Shipment) => s.selected.price_usd * 1.37, agg: "sum" as const, fmt: (v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}` },
  Time: { value: (s: Shipment) => s.selected.transit_days, agg: "avg" as const, fmt: (v: number) => `${v.toFixed(1)} d` },
  Reliability: { value: (s: Shipment) => s.selected.reliability * 100, agg: "avg" as const, fmt: (v: number) => `${Math.round(v)}%` },
  "CO₂": { value: (s: Shipment) => s.selected.co2_kg ?? 0, agg: "sum" as const, fmt: (v: number) => `${Math.round(v)} kg` },
};

function LeafIcon() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function DashboardPage() {
  const { shipments } = useStore();
  const navigate = useNavigate();
  const [metric, setMetric] = useState<keyof typeof METRICS>("Cost");
  const [range, setRange] = useState(30);

  const list = useMemo(() => shipments.filter((s) => Date.now() - Date.parse(s.createdAt) < range * 864e5), [shipments, range]);
  const saved = co2Saved(list);
  const byCarrier = countBy(list, (s) => s.selected.carrier_name);
  const slices: Slice[] = byCarrier.map(([label, value], i) => ({ label, value, color: CARRIER_PALETTE[i % CARRIER_PALETTE.length] }));
  const byMode = new Map(countBy(list, primaryMode));
  const byRegion = countBy(list.flatMap((s) => [regionOf(s.origin.country), regionOf(s.destination.country)]), (r) => r);
  const now = new Date();

  const columns: TableColumnsType<Shipment> = [
    { title: "Tracking #", dataIndex: "trackingId", render: (v: string, s) => <Link to={`/shipments/${s.id}`} className="mono">{v}</Link> },
    { title: "Lane", key: "r", render: (_, s) => `${s.origin.city ?? s.origin.country} → ${s.destination.city ?? s.destination.country}` },
    { title: "Carrier", key: "c", render: (_, s) => <CarrierMark id={s.selected.carrier_id} name={s.selected.carrier_name} /> },
    { title: "Status", dataIndex: "status", render: (v) => <StatusTag status={v} /> },
    { title: "ETA", key: "eta", render: (_, s) => date(s.deliveredAt ?? s.selected.risk.eta.latest) },
    { title: "", key: "a", align: "right", render: (_, s) => <Link to={`/shipments/${s.id}`}>{isDelivered(s) ? "Details" : "Track"} →</Link> },
  ];

  const m = METRICS[metric];

  return (
    <div className="kdash">
      <div className="kdash-head">
        <div>
          <h1 className="kdash-greet">{greeting()}, {DEMO_USER.name.split(" ")[0]}</h1>
          <p className="kdash-sub">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {list.filter(isInTransit).length} shipments moving, {list.filter(isDelayed).length} need attention
          </p>
        </div>
        <div className="kdash-tools">
          <Segmented aria-label="Date range" value={range} onChange={(v) => setRange(v as number)}
            options={[{ value: 7, label: "7 days" }, { value: 30, label: "30 days" }, { value: 90, label: "90 days" }]} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/shipments/new")}>New shipment</Button>
        </div>
      </div>

      <nav className="kshortcuts" aria-label="Shortcuts">
        <Link to="/shipments/new"><FileTextOutlined />Get a quote</Link>
        <Link to="/tracking"><EnvironmentOutlined />Track a shipment</Link>
        <Link to="/quotes"><SwapOutlined />Compare rates</Link>
        <Link to="/carriers"><CarOutlined />Carriers</Link>
        <Link to="/analytics"><BarChartOutlined />Reports</Link>
      </nav>

      <div className="kstat-grid">
        <StatCard label="Shipments" value={list.length} icon={<CodeSandboxOutlined />} color="#0b1f4d" delta={delta(shipments, () => true, range)} caption={`vs prior ${range} days`} />
        <StatCard label="In transit" value={list.filter(isInTransit).length} icon={<CarOutlined />} color="#2563eb" delta={delta(shipments, isInTransit, range)} caption={`vs prior ${range} days`} />
        <StatCard label="Delayed" value={list.filter(isDelayed).length} icon={<ClockCircleOutlined />} color="#ea580c" invert delta={delta(shipments, isDelayed, range)} caption={`vs prior ${range} days`} />
        <StatCard label="Delivered" value={list.filter(isDelivered).length} icon={<CheckCircleFilled />} color="#16a34a" delta={delta(shipments, isDelivered, range)} caption={`vs prior ${range} days`} />
        <StatCard label="CO₂ avoided" value={saved >= 1000 ? `${(saved / 1000).toFixed(1)} t` : `${Math.round(saved)} kg`} icon={<LeafIcon />} color="#0d9488" caption="compared with shipping all by air" />
      </div>

      <div className="kdash-row">
        <section className="kcard">
          <div className="kcard-head">
            <h2>Shipment map</h2>
            <div className="klegend-light" aria-label="Legend"><span><i style={{ background: "#2563eb" }} />Moving</span><span><i style={{ background: "#16a34a" }} />Delivered</span><span><i style={{ background: "#ea580c" }} />Delayed</span></div>
          </div>
          <div className="kmap-light">
            <WorldMap
              variant="light"
              label="Map of shipment routes"
              arcs={list.flatMap((s) => {
                const p = routePoints(s);
                return p.slice(1).map((to, i) => ({ from: p[i], to, color: LIGHT[statusColor(s)] ?? statusColor(s), dashed: primaryMode(s) === "ocean", width: 1.8 }));
              })}
              points={list.flatMap((s) => routePoints(s).slice(-1).map((at) => ({ at, color: LIGHT[statusColor(s)] ?? statusColor(s), r: 4.5 })))}
            >
              {(project) => byRegion.filter(([r]) => REGION_COORDS[r]).map(([r, n]) => {
                const [x, y] = project(REGION_COORDS[r]);
                return (
                  <g key={r} transform={`translate(${x},${y})`}>
                    <circle r="22" fill="#0b1f4d" opacity="0.9" />
                    <text textAnchor="middle" y="5" fontSize="15" fontWeight="700" fill="#fff">{n}</text>
                    <text textAnchor="middle" y="40" fontSize="13" fontWeight="600" fill="#0b1f4d">{r}</text>
                  </g>
                );
              })}
            </WorldMap>
          </div>
          <div className="kmode-strip">
            {MODES.filter((x) => x.mode !== "rail" || byMode.get("rail")).map(({ mode, label }) => {
              const n = byMode.get(mode) ?? 0;
              const pct = list.length ? Math.round((100 * n) / list.length) : 0;
              return (
                <div key={mode}>
                  <ModeIcon mode={mode} size={18} />
                  <span>{label}</span>
                  <b>{n}</b>
                  <span className="kmode-bar" aria-hidden><i style={{ width: `${pct}%` }} /></span>
                  <span className="ktiny">{pct}%</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Latest updates</h2><Link to="/shipments">All shipments</Link></div>
          <ol className="kfeed kcard-body">
            {recentActivity(shipments).map(({ s, t }) => (
              <li key={s.id + t.title + t.time} className={t.state === "issue" ? "is-issue" : ""}>
                <div>
                  <div className="kfeed-title">{t.title}<span className="ktiny"> · {t.location}</span></div>
                  <Link to={`/shipments/${s.id}`} className="mono">{s.trackingId}</Link>
                </div>
                <time className="ktiny">{timeAgo(t.time)}</time>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="kdash-trio">
        <section className="kcard">
          <div className="kcard-head"><h2>Carrier mix</h2><Link to="/carriers">Carriers</Link></div>
          <div className="kcard-body">
            <div className="kmix" role="img" aria-label={slices.map((s) => `${s.label} ${s.value}`).join(", ")}>
              {slices.map((s) => <i key={s.label} style={{ flex: s.value, background: s.color }} />)}
            </div>
            <ul className="kmix-list">
              {slices.map((s) => (
                <li key={s.label}><i style={{ background: s.color }} /><span>{s.label}</span><b>{s.value}</b><span className="ktiny">{Math.round((100 * s.value) / Math.max(1, list.length))}%</span></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Busiest lanes</h2><Link to="/analytics">Analytics</Link></div>
          <div className="kcard-body">
            <table className="kroutes">
              <thead><tr><th>Lane</th><th>Shipments</th><th>Avg. days</th></tr></thead>
              <tbody>
                {topRoutes(list).slice(0, 5).map((r) => (
                  <tr key={r.route}><td>{r.route}</td><td>{r.count}</td><td>{Math.round(r.avgDays)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="kcard">
          <div className="kcard-head">
            <h2>Trend</h2>
            <Select size="small" aria-label="Trend metric" value={metric} onChange={setMetric} style={{ width: 130 }}
              options={Object.keys(METRICS).map((k) => ({ value: k, label: k }))} />
          </div>
          <div className="kcard-body">
            <LineChart height={170} format={m.fmt} series={[{ label: metric === "Cost" ? "Total cost (CAD)" : metric, color: "#0b1f4d", points: weekly(list, m.value, m.agg) }]} />
            <div className="ktiny">Weekly, by booking date</div>
          </div>
        </section>
      </div>

      <section className="kcard">
        <div className="kcard-head"><h2>Recent shipments</h2><Link to="/shipments">See all</Link></div>
        <div className="kcard-body">
          <Table<Shipment> rowKey="id" size="small" columns={columns} dataSource={list.slice(0, 6)} pagination={false} scroll={{ x: 640 }} />
        </div>
      </section>
    </div>
  );
}

