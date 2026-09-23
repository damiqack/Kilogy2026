import { PackagePlus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/Badges";
import { ModeIcon } from "../components/RouteLegs";
import { useStore } from "../data/store";
import type { ShipmentStatus } from "../data/types";
import { date, days, kg, place, usd } from "../lib/format";

const FILTERS: { label: string; match: (s: ShipmentStatus) => boolean }[] = [
  { label: "All", match: () => true },
  { label: "In progress", match: (s) => ["booked", "picked_up", "in_transit", "customs", "out_for_delivery"].includes(s) },
  { label: "Exceptions", match: (s) => s === "exception" },
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
          <p>Every shipment from quote to delivery.</p>
        </div>
        <Link to="/quotes/new" className="btn btn-primary"><PackagePlus size={16} /> New shipment</Link>
      </div>
      <div className="card">
        <div className="tabs">
          {FILTERS.map((f, i) => (
            <button key={f.label} className={`tab${i === filter ? " active" : ""}`} onClick={() => setFilter(i)}>
              {f.label} <span className="faint">{shipments.filter((s) => f.match(s.status)).length}</span>
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Reference</th><th>Origin</th><th>Destination</th><th>Carrier</th><th>Service</th><th>Transit</th><th>CO₂e</th><th>Price</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td><Link to={`/shipments/${s.id}`} className="mono">{s.reference}</Link></td>
                  <td>{place(s.origin)}</td>
                  <td>{place(s.destination)}</td>
                  <td><span className="row"><ModeIcon mode={s.selected.route?.primary_mode ?? "air"} /> {s.selected.carrier_name}</span></td>
                  <td style={{ textTransform: "capitalize" }}>{s.selected.service}</td>
                  <td className="num">{days(s.selected.transit_days)}</td>
                  <td className="num">{kg(s.selected.co2_kg)}</td>
                  <td className="num">{usd(s.selected.price_usd)}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="muted">{date(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <div className="empty">No shipments here.</div>}
        </div>
      </div>
    </>
  );
}
