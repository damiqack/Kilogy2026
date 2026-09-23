import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../data/store";
import type { DocumentRecord } from "../data/types";
import { date, titleCase } from "../lib/format";

export function Documents() {
  const { documents, shipments, generateDocument } = useStore();
  const [shipmentId, setShipmentId] = useState(shipments[0]?.id ?? "");
  const [type, setType] = useState<DocumentRecord["type"]>("customs");
  const ref = (id: string) => shipments.find((s) => s.id === id)?.reference ?? id;

  return (
    <>
      <div className="page-head">
        <div><h1>Documents</h1><p>Shipping labels, customs declarations and invoices from the Document Service.</p></div>
      </div>
      <div className="card card-pad row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ minWidth: 220 }}>
          <label>Shipment</label>
          <select className="select" value={shipmentId} onChange={(e) => setShipmentId(e.target.value)}>
            {shipments.map((s) => <option key={s.id} value={s.id}>{s.reference} · {s.origin.city} → {s.destination.city}</option>)}
          </select>
        </div>
        <div className="field" style={{ minWidth: 160 }}>
          <label>Document type</label>
          <select className="select" value={type} onChange={(e) => setType(e.target.value as DocumentRecord["type"])}>
            <option value="customs">Customs declaration</option>
            <option value="invoice">Commercial invoice</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => shipmentId && generateDocument(shipmentId, type)}><FileText size={15} /> Generate</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>File</th><th>Type</th><th>Shipment</th><th>Created</th><th /></tr></thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td><span className="row"><FileText size={14} /> {d.filename}</span></td>
                  <td><span className="badge">{titleCase(d.type)}</span></td>
                  <td><Link to={`/shipments/${d.shipmentId}`} className="mono">{ref(d.shipmentId)}</Link></td>
                  <td className="muted">{date(d.createdAt)}</td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-sm" disabled title="PDF generation arrives with the Document Service"><Download size={13} /> PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
