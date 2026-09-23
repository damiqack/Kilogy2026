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
  const tid = (id: string) => shipments.find((s) => s.id === id)?.trackingId ?? id;

  return (
    <>
      <div className="page-head"><div><h1>Documents</h1><p className="sub">Generate customs declarations and invoices; find every label and document in the archive.</p></div></div>
      <section className="card card-pad" aria-labelledby="gen-h">
        <h2 id="gen-h" style={{ marginBottom: 14 }}>Document generator</h2>
        <form className="row wrap" style={{ gap: 12, alignItems: "flex-end" }} onSubmit={(e) => { e.preventDefault(); if (shipmentId) generateDocument(shipmentId, type); }}>
          <div className="field" style={{ minWidth: 260, flex: 1 }}>
            <label htmlFor="doc-shp">Shipment</label>
            <select id="doc-shp" className="select" value={shipmentId} onChange={(e) => setShipmentId(e.target.value)}>
              {shipments.map((s) => <option key={s.id} value={s.id}>{s.trackingId} · {s.origin.city} → {s.destination.city}</option>)}
            </select>
          </div>
          <div className="field" style={{ minWidth: 200 }}>
            <label htmlFor="doc-type">Document type</label>
            <select id="doc-type" className="select" value={type} onChange={(e) => setType(e.target.value as DocumentRecord["type"])}>
              <option value="customs">Customs declaration</option>
              <option value="invoice">Commercial invoice</option>
            </select>
          </div>
          <button className="btn btn-primary"><FileText size={16} aria-hidden /> Generate</button>
        </form>
      </section>
      <section className="card" aria-labelledby="arc-h">
        <div className="card-head"><h2 id="arc-h">Archive</h2><span className="caption">{documents.length} documents</span></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">File</th><th scope="col">Type</th><th scope="col">Tracking #</th><th scope="col">Created</th><th scope="col"><span className="sr-only">Download</span></th></tr></thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td><span className="row"><FileText size={15} aria-hidden /> <span className="mono">{d.filename}</span></span></td>
                  <td><span className="badge plain b-neutral">{titleCase(d.type)}</span></td>
                  <td><Link to={`/shipments/${d.shipmentId}`} className="track-id">{tid(d.shipmentId)}</Link></td>
                  <td className="num">{date(d.createdAt)}</td>
                  <td className="right"><button className="btn btn-sm" disabled title="PDF generation arrives with the Document Service" aria-label={`Download ${d.filename} (not available yet)`}><Download size={14} aria-hidden /> PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
