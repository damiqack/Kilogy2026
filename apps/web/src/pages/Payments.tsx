import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../data/store";
import { date, titleCase, usd } from "../lib/format";

export function Payments() {
  const { payments, shipments } = useStore();
  const ref = (id: string) => shipments.find((s) => s.id === id)?.reference ?? id;
  const paid = payments.filter((p) => p.status === "succeeded").reduce((a, p) => a + p.amount_usd, 0);
  const pending = payments.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount_usd, 0);

  return (
    <>
      <div className="page-head">
        <div><h1>Payments</h1><p>Charges, invoices and settlements from the Payment Service.</p></div>
      </div>
      <div className="grid g-3">
        <div className="card kpi"><div className="kpi-label">Paid</div><div className="kpi-value">{usd(paid)}</div></div>
        <div className="card kpi"><div className="kpi-label">Pending</div><div className="kpi-value">{usd(pending)}</div></div>
        <div className="card kpi">
          <div className="kpi-label"><ShieldCheck size={15} /> PCI-DSS</div>
          <div className="small muted">Card data is tokenized by the payment provider. KILOGY never stores raw card numbers.</div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Payment</th><th>Shipment</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="mono small">{p.id}</td>
                  <td><Link to={`/shipments/${p.shipmentId}`} className="mono">{ref(p.shipmentId)}</Link></td>
                  <td>{p.method}</td>
                  <td className="num">{usd(p.amount_usd)}</td>
                  <td><span className={`badge ${p.status === "succeeded" ? "b-green" : p.status === "pending" ? "b-amber" : "b-red"}`}>{titleCase(p.status)}</span></td>
                  <td className="muted">{date(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
