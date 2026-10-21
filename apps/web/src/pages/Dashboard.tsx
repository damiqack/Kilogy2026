import {
  BarChartOutlined, CalendarOutlined, CheckCircleFilled, ClockCircleOutlined, CodeSandboxOutlined,
  CarOutlined, EnvironmentOutlined, FileTextOutlined, SwapOutlined, ArrowRightOutlined, WarningFilled,
} from "@ant-design/icons";
import { Button, Segmented, Select, Table, type TableColumnsType } from "antd";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Donut, type Slice } from "../components/Charts";
import { KilogyLogo } from "../components/KilogyLogo";
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

const CARRIER_PALETTE = ["#2563eb", "#f59e0b", "#7c3aed", "#10b981", "#ef4444", "#0ea5e9", "#94a3b8"];
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
    { title: "ID", dataIndex: "trackingId", render: (v: string, s) => <Link to={`/shipments/${s.id}`} className="mono">{v}</Link> },
    { title: "Origin → Destination", key: "r", render: (_, s) => `${s.origin.city ?? s.origin.country} → ${s.destination.city ?? s.destination.country}` },
    { title: "Carrier", key: "c", render: (_, s) => <CarrierMark id={s.selected.carrier_id} name={s.selected.carrier_name} /> },
    { title: "Status", dataIndex: "status", render: (v) => <StatusTag status={v} /> },
    { title: "ETA", key: "eta", render: (_, s) => date(s.deliveredAt ?? s.selected.risk.eta.latest) },
    { title: "Actions", key: "a", render: (_, s) => <Button size="small" onClick={() => navigate(`/shipments/${s.id}`)}>{isDelivered(s) ? "View" : "Track"}</Button> },
  ];

  const m = METRICS[metric];

  return (
    <div className="kdash">
      <div className="kdash-head">
        <div>
          <h1 className="kdash-greet">{greeting()}, {DEMO_USER.name.split(" ")[0]}</h1>
          <p className="kdash-sub">Here's what's happening with your global logistics operations today.</p>
        </div>
        <div className="kdash-date">
          <CalendarOutlined style={{ fontSize: 18, marginTop: 2 }} />
          <span>{now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}<br />{now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
        </div>
      </div>

      <aside className="kdash-right">
        <Select aria-label="Date range" value={range} onChange={setRange} size="large"
          options={[{ value: 7, label: "Last 7 days" }, { value: 30, label: "Last 30 days" }, { value: 90, label: "Last 90 days" }]} />

        <section className="kcard">
          <div className="kcard-head"><h2>Recent Activity</h2><Link to="/shipments">View All →</Link></div>
          <ul className="klist kcard-body">
            {recentActivity(shipments).map(({ s, t }) => (
              <li key={s.id + t.title + t.time}>
                <span className="kicon-round" style={{ color: t.state === "issue" ? "#ea580c" : "#16a34a", background: t.state === "issue" ? "#fff7ed" : "#ecfdf3" }}>
                  {t.state === "issue" ? <WarningFilled /> : <CheckCircleFilled />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>Shipment <Link to={`/shipments/${s.id}`} className="mono">{s.trackingId}</Link></div>
                  <div className="ktiny">{t.title} ({t.location})</div>
                </div>
                <span className="ktiny" style={{ whiteSpace: "nowrap" }}>{timeAgo(t.time)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Quick Actions</h2></div>
          <div className="kcard-body kquick">
            <Link to="/shipments/new"><CalendarOutlined />Create Booking</Link>
            <Link to="/shipments/new"><FileTextOutlined />Request Quote</Link>
            <Link to="/tracking"><EnvironmentOutlined />Track Shipment</Link>
            <Link to="/quotes"><SwapOutlined />Compare Rates</Link>
            <Link to="/carriers"><CarOutlined />Manage Carriers</Link>
            <Link to="/analytics"><BarChartOutlined />View Reports</Link>
          </div>
        </section>

        <section className="kpromo">
          <span className="kpromo-logo"><KilogyLogo onDark height={22} /></span>
          <h3>Smarter Logistics.<br />Greater Possibilities.</h3>
          <p>KILOGY connects all your logistics providers, powers your operations with AI, and gives you complete visibility from origin to final delivery.</p>
          <Button type="primary" onClick={() => navigate("/shipments/new")}>Optimize Your Supply Chain <ArrowRightOutlined /></Button>
        </section>
      </aside>

      <div className="kstat-grid kdash-kpis">
        <StatCard label="Total Shipments" value={list.length} icon={<CodeSandboxOutlined />} color="#2563eb" delta={delta(shipments, () => true, range)} caption={`vs. previous ${range} days`} />
        <StatCard label="In Transit" value={list.filter(isInTransit).length} icon={<CarOutlined />} color="#2563eb" delta={delta(shipments, isInTransit, range)} caption={`vs. previous ${range} days`} />
        <StatCard label="Delayed" value={list.filter(isDelayed).length} icon={<ClockCircleOutlined />} color="#dc2626" invert delta={delta(shipments, isDelayed, range)} caption={`vs. previous ${range} days`} />
        <StatCard label="Delivered" value={list.filter(isDelivered).length} icon={<CheckCircleFilled />} color="#16a34a" delta={delta(shipments, isDelivered, range)} caption={`vs. previous ${range} days`} />
        <StatCard label="CO₂ Saved" value={saved >= 1000 ? `${(saved / 1000).toFixed(1)} t` : `${Math.round(saved)} kg`} icon={<LeafIcon />} color="#16a34a" caption="vs. all-air routing" />
      </div>

      <section className="kcard kdark kdash-map">
        <div className="kcard-head">
          <h2>Global Shipment Overview</h2>
          <div className="klegend" aria-label="Legend"><span><i style={{ background: "#60a5fa" }} />In Transit</span><span><i style={{ background: "#22c55e" }} />Delivered</span><span><i style={{ background: "#f97316" }} />Delayed</span></div>
        </div>
        <div className="kcard-sub">Live tracking across all carriers and providers</div>
        <div className="kmap-wrap">
          <div className="kmap-canvas">
            <WorldMap
              label="Map of shipment routes"
              arcs={list.flatMap((s) => {
                const p = routePoints(s);
                return p.slice(1).map((to, i) => ({ from: p[i], to, color: statusColor(s), dashed: primaryMode(s) === "ocean" }));
              })}
              points={list.flatMap((s) => routePoints(s).slice(-1).map((at) => ({ at, color: statusColor(s) })))}
            >
              {(project) => byRegion.filter(([r]) => REGION_COORDS[r]).map(([r, n]) => {
                const [x, y] = project(REGION_COORDS[r]);
                return (
                  <g key={r} transform={`translate(${x},${y})`}>
                    <rect x="-8" y="-20" width="132" height="40" rx="10" fill="rgba(11,31,77,0.88)" stroke="rgba(147,197,253,0.5)" />
                    <circle cx="10" cy="0" r="9" fill="#2563eb" stroke="#bfdbfe" strokeWidth="2" />
                    <text x="26" y="-3" fontSize="13" fontWeight="600" fill="#fff">{r}</text>
                    <text x="26" y="13" fontSize="11.5" fill="rgba(255,255,255,0.8)">{n} shipment{n === 1 ? "" : "s"}</text>
                  </g>
                );
              })}
            </WorldMap>
          </div>
          <div className="kmap-modes">
            {MODES.filter((x) => x.mode !== "rail" || byMode.get("rail")).map(({ mode, label }) => {
              const n = byMode.get(mode) ?? 0;
              return (
                <div key={mode} className="kmap-mode">
                  <ModeIcon mode={mode} size={26} />
                  <div><b>{label}</b><span>{n} ({list.length ? Math.round((100 * n) / list.length) : 0}%)</span></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="kdash-mid" style={{ gridRow: "span 2" }}>
        <section className="kcard">
          <div className="kcard-head"><h2>Shipments by Carrier</h2><Link to="/carriers">View All →</Link></div>
          <div className="kcard-body kcarriers">
            <Donut slices={slices} centerValue={String(list.length)} centerLabel="Total Shipments" />
            <ul>
              {slices.map((s) => (
                <li key={s.label}><i style={{ background: s.color }} /><span>{s.label}</span><span>{s.value} ({Math.round((100 * s.value) / Math.max(1, list.length))}%)</span></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Top Routes</h2><Link to="/analytics">View All →</Link></div>
          <div className="kcard-body">
            <table className="kroutes">
              <thead><tr><th>Route</th><th>Shipments</th><th>Avg. Transit Time</th></tr></thead>
              <tbody>
                {topRoutes(list).slice(0, 5).map((r) => (
                  <tr key={r.route}><td><EnvironmentOutlined style={{ marginRight: 8 }} />{r.route}</td><td>{r.count}</td><td>{Math.round(r.avgDays)} days</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Performance Metrics</h2><Link to="/analytics">View Details →</Link></div>
          <div className="kcard-body">
            <Segmented block value={metric} onChange={(v) => setMetric(v as keyof typeof METRICS)} options={Object.keys(METRICS)} style={{ marginBottom: 12 }} />
            <LineChart format={m.fmt} series={[{ label: metric === "Cost" ? "Total cost (CAD)" : metric, color: "#2563eb", points: weekly(list, m.value, m.agg) }]} />
            <div className="ktiny">Weekly, by booking date</div>
          </div>
        </section>
      </div>

      <section className="kcard" style={{ gridColumn: 1 }}>
        <div className="kcard-head"><h2>Recent Shipments</h2><Link to="/shipments">View All →</Link></div>
        <div className="kcard-body">
          <Table<Shipment> rowKey="id" size="small" columns={columns} dataSource={list.slice(0, 6)} pagination={false} scroll={{ x: 640 }} />
        </div>
      </section>
    </div>
  );
}

