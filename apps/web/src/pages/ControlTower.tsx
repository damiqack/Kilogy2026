import {
  BulbOutlined, CalendarOutlined, CarOutlined, CheckCircleFilled, ClockCircleOutlined, CloudOutlined,
  CodeSandboxOutlined, DollarOutlined, ReloadOutlined, ThunderboltOutlined, WarningOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Segmented, Table, type TableColumnsType } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Progress } from "../components/Charts";
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

/** Tracking page: live map, shipment list and the risks that need attention. */
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

  // Destination weather risk for shipments still moving, from the AI engine's risk factors.
  const weather = list.filter((s) => !isDelivered(s)).map((s) => {
    const f = s.selected.risk.factors.find((x) => x.factor === "weather")?.impact ?? 0;
    return { s, risk: Math.round(f * s.selected.risk.score * 100) };
  }).sort((a, b) => b.risk - a.risk).filter((w, i, arr) => arr.findIndex((x) => x.s.destination.city === w.s.destination.city) === i).slice(0, 2);

  const columns: TableColumnsType<Shipment> = [
    { title: "Tracking #", dataIndex: "trackingId", render: (v: string, s) => <Link to={`/shipments/${s.id}`} className="mono">{v}</Link> },
    { title: "Lane", key: "r", render: (_, s) => `${place(s.origin)} → ${place(s.destination)}` },
    { title: "Mode", key: "m", render: (_, s) => <ModeLabel mode={primaryMode(s)} /> },
    { title: "Carrier", key: "c", render: (_, s) => <CarrierMark id={s.selected.carrier_id} name={s.selected.carrier_name} /> },
    { title: "Status", dataIndex: "status", render: (v) => <StatusTag status={v} /> },
    { title: "ETA", key: "eta", render: (_, s) => date(s.deliveredAt ?? s.selected.risk.eta.latest) },
    { title: "Progress", key: "p", width: 170, render: (_, s) => <Progress value={progress(s)} color={isDelayed(s) ? "#f97316" : "#2563eb"} /> },
  ];

  const best = [...CARRIERS].sort((a, b) => b.onTime - a.onTime)[0];

  return (
    <div className="ktower">
      <div className="ktower-title">
        <div>
          <h1>Live operations</h1>
          <p>Every active shipment, carrier and risk in one view.</p>
        </div>
        <div className="ktower-filters">
          <Segmented aria-label="Transport mode" value={mode} onChange={(v) => setMode(v as Mode | "all")}
            options={[{ value: "all", label: "All" }, { value: "ocean", label: "Ocean" }, { value: "air", label: "Air" }, { value: "road", label: "Road" }]} />
          <DatePicker.RangePicker value={range} allowClear={false} aria-label="Date range"
            onChange={(v) => v?.[0] && v[1] && setRange([v[0], v[1]])} format="MMM D" suffixIcon={<CalendarOutlined />} />
          <Button icon={<ReloadOutlined />} aria-label="Refresh" onClick={() => setRange([range[0], dayjs()])} />
        </div>
      </div>

      <div className="kstat-grid ktower-kpis">
        <StatCard label="Shipments" value={list.length} icon={<CodeSandboxOutlined />} color="#0b1f4d" delta={delta(shipments, () => true, days)} caption={`last ${days} days`} />
        <StatCard label="In transit" value={list.filter(isInTransit).length} icon={<CarOutlined />} color="#2563eb" delta={delta(shipments, isInTransit, days)} caption={`last ${days} days`} />
        <StatCard label="Delivered" value={list.filter(isDelivered).length} icon={<CheckCircleFilled />} color="#16a34a" delta={delta(shipments, isDelivered, days)} caption={`last ${days} days`} />
        <StatCard label="Delayed" value={list.filter(isDelayed).length} icon={<ClockCircleOutlined />} color="#ea580c" invert delta={delta(shipments, isDelayed, days)} caption={`last ${days} days`} />
        <StatCard label="Spend" value={`$${spend.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} icon={<DollarOutlined />} color="#0d9488" caption="USD, booked price" />
      </div>

      <div className="ktower-main">
        <section className="kcard kdark ktower-map">
          <WorldMap
            label="Live map of shipment routes"
            arcs={list.flatMap((s) => {
              const p = routePoints(s);
              return p.slice(1).map((to, i) => ({ from: p[i], to, color: statusColor(s), dashed: primaryMode(s) === "ocean", width: s === selected ? 3 : 1.4 }));
            })}
            points={list.flatMap((s) => routePoints(s).map((at) => ({ at, color: statusColor(s), r: 3.5 })))}
          />
          <div className="ktower-legend" aria-label="Legend">
            <span><i style={{ background: "#60a5fa" }} />Moving</span>
            <span><i style={{ background: "#22c55e" }} />Delivered</span>
            <span><i style={{ background: "#f97316" }} />Delayed</span>
            <span><i style={{ background: "#ef4444" }} />Exception</span>
            <span className="dash">- - Ocean leg</span>
          </div>
          {selected && (
            <div className="ktower-pop">
              <div className="row"><Link to={`/shipments/${selected.id}`} className="mono">{selected.trackingId}</Link><StatusTag status={selected.status} /></div>
              <dl>
                <dt>Lane</dt><dd>{place(selected.origin)} → {place(selected.destination)}</dd>
                <dt>Carrier</dt><dd>{selected.selected.carrier_name}</dd>
                <dt>Mode</dt><dd><ModeLabel mode={primaryMode(selected)} /></dd>
                <dt>ETA</dt><dd>{date(selected.selected.risk.eta.latest)}</dd>
              </dl>
              <Progress value={progress(selected)} color={isDelayed(selected) ? "#f97316" : "#2563eb"} />
            </div>
          )}
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Shipments</h2><span className="ktiny">Select a row to show it on the map</span></div>
          <div className="kcard-body">
            <Table<Shipment> rowKey="id" size="small" columns={columns} dataSource={list.slice(0, 8)} pagination={false} scroll={{ x: 820 }}
              onRow={(s) => ({ onClick: () => setSelectedId(s.id), style: { cursor: "pointer" } })}
              rowClassName={(s) => (s.id === selected?.id ? "ant-table-row-selected" : "")} />
            <Link to="/shipments" className="ktower-more">See all shipments →</Link>
          </div>
        </section>
      </div>

      <aside className="ktower-side">
        <section className="kcard">
          <div className="kcard-head"><h2>Needs attention</h2><span className="kcount">{alerts.length}</span></div>
          <ul className="kalerts kcard-body">
            {alerts.map((a) => (
              <li key={a.id} className={a.severity === "critical" ? "is-high" : "is-med"}>
                <div className="kalerts-head"><WarningOutlined /><b>{a.title}</b></div>
                <p>{a.detail}</p>
                {a.recommendation && <p className="kalerts-rec"><BulbOutlined /> {a.recommendation}</p>}
                {a.cta && <Button size="small" onClick={() => navigate(a.cta!.to)}>{a.cta.label}</Button>}
              </li>
            ))}
            <li className="is-ok">
              <div className="kalerts-head"><ThunderboltOutlined /><b>Most reliable carrier</b></div>
              <p>{best.name} is on time {Math.round(best.onTime * 100)}% of the time.</p>
            </li>
          </ul>
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Weather watch</h2><CloudOutlined style={{ color: "#64748b" }} /></div>
          <ul className="kweather kcard-body">
            {weather.map(({ s, risk }) => (
              <li key={s.id}>
                <span>{place(s.destination)}</span>
                <span className="kweather-bar" aria-hidden><i style={{ width: `${Math.min(100, risk * 2)}%`, background: risk >= 15 ? "#ea580c" : "#16a34a" }} /></span>
                <b style={{ color: risk >= 15 ? "#c2410c" : "#15803d" }}>{risk}%</b>
              </li>
            ))}
            <li className="ktiny">Chance of a weather delay at the destination.</li>
          </ul>
        </section>

        <section className="kcard">
          <div className="kcard-head"><h2>Carrier connections</h2><Link to="/carriers">Manage</Link></div>
          <ul className="kproviders kcard-body">
            {CARRIERS.map((c) => (
              <li key={c.id}>
                <CarrierMark id={c.id} name={c.name} />
                <span className={c.status === "planned" ? "off" : "on"}>{c.status === "planned" ? "Planned" : "Connected"}</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
