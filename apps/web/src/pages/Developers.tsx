import { Copy, Eye, EyeOff, KeyRound, Webhook } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArchitecturePanel } from "./SystemArchitecture";

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

const TABS = [["keys", "API keys"], ["webhooks", "Webhooks"], ["explorer", "API explorer"], ["architecture", "Architecture"]] as const;
type TabId = (typeof TABS)[number][0];

export function Developers() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find(([id]) => id === params.get("tab"))?.[0] ?? "keys") as TabId;

  return (
    <>
      <div className="page-head">
        <div><h1>Dev / API</h1><p className="sub">API keys, webhooks and reference for the KILOGY REST API. Full docs will live at docs.kilogy.co.</p></div>
      </div>
      <div className="card">
        <div className="tabs" role="tablist" aria-label="Developer sections">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`} aria-selected={tab === id} className="tab"
              onClick={() => setParams(id === "keys" ? {} : { tab: id }, { replace: true })}>{label}</button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="stack" style={{ gap: 20 }}>
        {tab === "keys" && <KeysPanel />}
        {tab === "webhooks" && <WebhooksPanel />}
        {tab === "explorer" && <ExplorerPanel />}
        {tab === "architecture" && <ArchitecturePanel />}
      </div>
    </>
  );
}

function KeysPanel() {
  const [show, setShow] = useState(false);
  const key = "kg_test_dev_key_123";
  const used = 3412, limit = 10000;
  return (
    <div className="grid g-2">
      <section className="card" aria-labelledby="k-h">
        <div className="card-head"><h2 id="k-h" className="row"><KeyRound size={18} aria-hidden /> Key manager</h2><button className="btn btn-sm">Create key</button></div>
        <div className="card-pad stack" style={{ gap: 12 }}>
          <div className="row-between">
            <div className="stack" style={{ gap: 4 }}>
              <div className="row"><span className="strong">Development key</span> <span className="badge plain b-accent">test</span></div>
              <span className="mono muted">{show ? key : "kg_test_••••••••••••"}</span>
            </div>
            <div className="row">
              <button className="icon-btn" onClick={() => setShow(!show)} aria-label={show ? "Hide key" : "Reveal key"} aria-pressed={show}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              <button className="icon-btn" onClick={() => navigator.clipboard?.writeText(key)} aria-label="Copy key"><Copy size={16} /></button>
            </div>
          </div>
          <p className="caption" style={{ margin: 0 }}>Keys are hashed with bcrypt before storage. Exchange a key for a 15-minute JWT at <code>POST /api/v1/auth/token</code>.</p>
        </div>
      </section>
      <section className="card" aria-labelledby="u-h">
        <div className="card-head"><h2 id="u-h">Usage this hour</h2><span className="badge plain b-accent">Pro tier</span></div>
        <div className="card-pad stack" style={{ gap: 12 }}>
          <div className="row-between"><span className="kpi-value" style={{ marginTop: 0 }}>{used.toLocaleString()}</span><span className="muted">of {limit.toLocaleString()} requests</span></div>
          <div className="meter" style={{ height: 8 }} role="meter" aria-label="Rate limit used" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit}><span style={{ width: `${(used / limit) * 100}%` }} /></div>
          <table className="table">
            <thead><tr><th scope="col">Tier</th><th scope="col">Limit</th></tr></thead>
            <tbody><tr><td>Free</td><td>100 req/hr</td></tr><tr><td>Pro</td><td>10,000 req/hr</td></tr><tr><td>Enterprise</td><td>Custom</td></tr></tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function WebhooksPanel() {
  const hooks = [
    { url: "https://example-shipper.ca/hooks/kilogy", events: ["shipment.booked", "tracking.event", "shipment.delivered"], ok: true },
    { url: "https://erp.example.com/kilogy/payments", events: ["payment.succeeded", "payment.failed"], ok: false },
  ];
  return (
    <section className="card" aria-labelledby="wh-h">
      <div className="card-head"><h2 id="wh-h" className="row"><Webhook size={18} aria-hidden /> Webhook endpoints</h2><button className="btn btn-sm">Add endpoint</button></div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th scope="col">Endpoint</th><th scope="col">Events</th><th scope="col">Last delivery</th></tr></thead>
          <tbody>
            {hooks.map((h) => (
              <tr key={h.url}>
                <td className="mono">{h.url}</td>
                <td><div className="row wrap" style={{ gap: 4 }}>{h.events.map((e) => <code key={e} className="leg-chip">{e}</code>)}</div></td>
                <td><span className={`badge ${h.ok ? "b-success" : "b-error"}`}>{h.ok ? "200 OK" : "Failed · retrying"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExplorerPanel() {
  const [tab, setTab] = useState<"sdk" | "curl">("sdk");
  return (
    <>
      <section className="card">
        <div className="tabs" role="tablist" aria-label="Code sample language">
          <button role="tab" aria-selected={tab === "sdk"} className="tab" onClick={() => setTab("sdk")}>Node.js SDK</button>
          <button role="tab" aria-selected={tab === "curl"} className="tab" onClick={() => setTab("curl")}>cURL</button>
        </div>
        <div className="card-pad"><pre className="code" tabIndex={0} aria-label="Code sample">{tab === "sdk" ? SDK : CURL}</pre></div>
      </section>
      <section className="card" aria-labelledby="ep-h">
        <div className="card-head"><h2 id="ep-h">Endpoints · v1</h2><span className="caption">REST · GraphQL (analytics) · WebSocket (tracking)</span></div>
        {ENDPOINTS.map((g) => (
          <div key={g.group}>
            <h3 className="info-label" style={{ padding: "14px 20px 6px" }}>{g.group}</h3>
            <table className="table">
              <tbody>
                {g.items.map(([m, path, desc]) => (
                  <tr key={m + path}>
                    <td style={{ width: 96 }}><span className={`method m-${m}`}>{m}</span></td>
                    <td className="mono" style={{ width: "45%" }}>{path}</td>
                    <td className="muted">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </>
  );
}
