import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../data/store";
import { date, titleCase } from "../lib/format";
import { cad } from "../lib/money";

export function Payments() {
  const { payments, shipments } = useStore();
  const tid = (id: string) => shipments.find((s) => s.id === id)?.trackingId ?? id;
  const paid = payments.filter((p) => p.status === "succeeded").reduce((a, p) => a + p.amount_usd, 0);
  const pending = payments.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount_usd, 0);

  return (
    <>
      <div className="page-head"><div><h1>Payments</h1><p className="sub">Billing, invoices and the payment ledger.</p></div></div>
      <section className="grid g-3" aria-label="Payment totals">
        <div className="card kpi"><div className="kpi-label">Paid</div><div className="kpi-value">{cad(paid)}</div></div>
        <div className="card kpi"><div className="kpi-label">Outstanding</div><div className="kpi-value">{cad(pending)}</div><div className="kpi-delta warn">{payments.filter((p) => p.status === "pending").length} invoice(s) due</div></div>
        <div className="card kpi">
          <div className="kpi-label"><ShieldCheck size={16} color="var(--success)" aria-hidden /> PCI-DSS</div>
          <p className="small muted" style={{ margin: "8px 0 0" }}>Card data is tokenized by the payment provider. KILOGY never stores raw card numbers.</p>
        </div>
      </section>
      <section className="card" aria-labelledby="led-h">
        <div className="card-head"><h2 id="led-h">Ledger</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Payment ID</th><th scope="col">Tracking #</th><th scope="col">Method</th><th scope="col" className="right">Amount (CAD)</th><th scope="col">Status</th><th scope="col">Date</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.id}</td>
                  <td><Link to={`/shipments/${p.shipmentId}`} className="track-id">{tid(p.shipmentId)}</Link></td>
                  <td>{p.method}</td>
                  <td className="num right">{cad(p.amount_usd)}</td>
                  <td><span className={`badge ${p.status === "succeeded" ? "b-success" : p.status === "pending" ? "b-warning" : "b-error"}`}>{titleCase(p.status === "succeeded" ? "paid" : p.status)}</span></td>
                  <td className="num">{date(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
