import { Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";

const ENDPOINTS: { group: string; items: [string, string, string][] }[] = [
  { group: "Shipment Management", items: [
    ["POST", "/api/v1/shipments", "Create new shipment"], ["GET", "/api/v1/shipments/:id", "Get shipment details"],
    ["PUT", "/api/v1/shipments/:id", "Update shipment"], ["DELETE", "/api/v1/shipments/:id", "Cancel shipment"],
    ["GET", "/api/v1/shipments/:id/track", "Real-time tracking"],
  ] },
  { group: "Pricing & Quotes", items: [
    ["POST", "/api/v1/quotes", "Get multi-carrier quotes"], ["GET", "/api/v1/quotes/:id", "Retrieve quote"],
    ["POST", "/api/v1/quotes/:id/book", "Book selected quote"],
  ] },
  { group: "AI Routing", items: [
    ["POST", "/api/v1/ai/route-optimize", "Optimize route"], ["POST", "/api/v1/ai/carrier-recommend", "AI carrier selection"],
    ["GET", "/api/v1/ai/predictions/:id", "Get incident predictions"],
  ] },
  { group: "Carriers", items: [["GET", "/api/v1/carriers", "List integrated carriers"], ["GET", "/api/v1/carriers/:id/rates", "Carrier-specific rates"]] },
  { group: "Documents", items: [
    ["POST", "/api/v1/documents/customs", "Generate customs docs"], ["POST", "/api/v1/documents/invoice", "Generate invoice"],
    ["GET", "/api/v1/documents/:id", "Download document"],
  ] },
  { group: "Payments", items: [["POST", "/api/v1/payments/charge", "Process payment"], ["GET", "/api/v1/payments/:id", "Payment status"]] },
];

const SDK = `npm install @kilogy/sdk

const { KilogyClient } = require('@kilogy/sdk');
const client = new KilogyClient({ apiKey: 'YOUR_API_KEY' });

const quotes = await client.quotes.create({
  origin: { country: 'CA', city: 'Montreal' },
  destination: { country: 'GH', city: 'Accra' },
  package: { weight_kg: 5, length: 20, width: 15, height: 10 }
});

console.log(quotes.data); // Ranked carrier options with AI scores`;

const CURL = `curl -X POST https://api.kilogy.co/v1/quotes \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "origin": { "country": "CA", "city": "Montreal", "postalCode": "H3A1A1" },
    "destination": { "country": "NG", "city": "Lagos" },
    "package": { "weight_kg": 10, "dimensions": { "l": 30, "w": 20, "h": 15 } },
    "service_type": ["express", "standard"],
    "ai_optimize": true
  }'`;

export function Developers() {
  const [show, setShow] = useState(false);
  const [tab, setTab] = useState<"sdk" | "curl">("sdk");
  const key = "kg_test_dev_key_123";
  const used = 3412, limit = 10000;

  return (
    <>
      <div className="page-head">
        <div><h1>Developer portal</h1><p>API keys, usage and reference for the KILOGY REST API. Full docs will live at docs.kilogy.co.</p></div>
      </div>

      <div className="grid g-2">
        <div className="card">
          <div className="card-head"><h2 className="row"><KeyRound size={16} /> API keys</h2><button className="btn btn-sm">Create key</button></div>
          <div className="card-pad stack" style={{ gap: 12 }}>
            <div className="row-between">
              <div>
                <div style={{ fontWeight: 600 }}>Development key <span className="badge b-blue">test</span></div>
                <div className="mono small muted">{show ? key : "kg_test_••••••••••••"}</div>
              </div>
              <div className="row">
                <button className="btn btn-sm" onClick={() => setShow(!show)} aria-label="Toggle key">{show ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(key)} aria-label="Copy key"><Copy size={13} /></button>
              </div>
            </div>
            <div className="small faint">Keys are hashed with bcrypt before storage. Exchange a key for a 15-minute JWT at <code>POST /api/v1/auth/token</code>.</div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>Usage this hour</h2><span className="badge b-teal">Pro tier</span></div>
          <div className="card-pad stack" style={{ gap: 12 }}>
            <div className="row-between"><span className="kpi-value">{used.toLocaleString()}</span><span className="muted">of {limit.toLocaleString()} requests</span></div>
            <div className="bar" style={{ height: 8 }}><span style={{ width: `${(used / limit) * 100}%` }} /></div>
            <table className="table small">
              <thead><tr><th>Tier</th><th>Limit</th></tr></thead>
              <tbody>
                <tr><td>Free</td><td>100 req/hr</td></tr>
                <tr><td>Pro</td><td>10,000 req/hr</td></tr>
                <tr><td>Enterprise</td><td>Custom</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={`tab${tab === "sdk" ? " active" : ""}`} onClick={() => setTab("sdk")}>Node.js SDK</button>
          <button className={`tab${tab === "curl" ? " active" : ""}`} onClick={() => setTab("curl")}>cURL</button>
        </div>
        <div className="card-pad"><pre className="code">{tab === "sdk" ? SDK : CURL}</pre></div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Endpoints · v1</h2><span className="small faint">REST · GraphQL (analytics) · WebSocket (tracking)</span></div>
        {ENDPOINTS.map((g) => (
          <div key={g.group}>
            <div className="section-title" style={{ padding: "12px 16px 4px" }}>{g.group}</div>
            <table className="table">
              <tbody>
                {g.items.map(([m, path, desc]) => (
                  <tr key={m + path}>
                    <td style={{ width: 90 }}><span className={`method m-${m}`}>{m}</span></td>
                    <td className="mono" style={{ width: "45%" }}>{path}</td>
                    <td className="muted">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}
