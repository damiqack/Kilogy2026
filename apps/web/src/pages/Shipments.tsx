import { PackagePlus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/Badges";
import { ModeIcon } from "../components/RouteLegs";
import { useStore } from "../data/store";
import type { ShipmentStatus } from "../data/types";
import { date, days, kg, place } from "../lib/format";
import { cad } from "../lib/money";

const FILTERS: { label: string; match: (s: ShipmentStatus) => boolean }[] = [
  { label: "All", match: () => true },
  { label: "In transit", match: (s) => ["booked", "picked_up", "in_transit", "customs", "out_for_delivery"].includes(s) },
  { label: "Incidents", match: (s) => s === "exception" || s === "delayed" },
  { label: "Delivered", match: (s) => s === "delivered" },
  { label: "Cancelled", match: (s) => s === "cancelled" },
];

export function Shipments() {
  const { shipments } = useStore();
  const [filter, setFilter] = useState(0);
  const rows = shipments.filter((s) => FILTERS[filter].match(s.status));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Shipments</h1>
          <p className="sub">Create, track and manage every shipment.</p>
        </div>
        <Link to="/shipments/new" className="btn btn-primary"><PackagePlus size={17} aria-hidden /> New Shipment</Link>
      </div>
      <section className="card">
        <div className="tabs" role="tablist" aria-label="Filter shipments">
          {FILTERS.map((f, i) => (
            <button key={f.label} role="tab" aria-selected={i === filter} className="tab" onClick={() => setFilter(i)}>
              {f.label} <span className="faint">({shipments.filter((s) => f.match(s.status)).length})</span>
            </button>
          ))}
        </div>
        <div className="table-wrap" role="tabpanel">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Tracking #</th><th scope="col">Origin</th><th scope="col">Destination</th><th scope="col">Carrier</th>
                <th scope="col" className="hide-sm">Service</th><th scope="col" className="hide-sm">Transit</th><th scope="col" className="hide-sm">CO₂e</th>
                <th scope="col" className="right">Price (CAD)</th><th scope="col">Status</th><th scope="col">ETA</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td><Link to={`/shipments/${s.id}`} className="track-id">{s.trackingId}</Link></td>
                  <td>{place(s.origin)}</td>
                  <td>{place(s.destination)}</td>
                  <td><span className="row" style={{ gap: 6 }}><ModeIcon mode={s.selected.route?.primary_mode ?? "air"} size={14} /> {s.selected.carrier_name}</span></td>
                  <td className="hide-sm">{s.selected.service_name ?? s.selected.service}</td>
                  <td className="num hide-sm">{days(Math.round(s.selected.transit_days))}</td>
                  <td className="num hide-sm">{kg(s.selected.co2_kg)}</td>
                  <td className="num right">{cad(s.selected.price_usd)}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="num">{date(s.deliveredAt ?? s.selected.risk.eta.latest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <div className="empty">No shipments in this view.</div>}
        </div>
      </section>
    </>
  );
}
