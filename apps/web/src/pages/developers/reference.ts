/** API v1 endpoint list (docs/ARCHITECTURE.md, section 2.2). Generate from the OpenAPI spec once it exists. */
export const ENDPOINTS = [
  { group: "Shipments", method: "POST", path: "/api/v1/shipments", description: "Create shipment" },
  { group: "Shipments", method: "GET", path: "/api/v1/shipments/:id", description: "Get shipment" },
  { group: "Shipments", method: "PUT", path: "/api/v1/shipments/:id", description: "Update shipment" },
  { group: "Shipments", method: "DELETE", path: "/api/v1/shipments/:id", description: "Cancel shipment" },
  { group: "Shipments", method: "GET", path: "/api/v1/shipments/:id/track", description: "Tracking events" },
  { group: "Quotes", method: "POST", path: "/api/v1/quotes", description: "Multi-carrier quotes" },
  { group: "Quotes", method: "GET", path: "/api/v1/quotes/:id", description: "Get quote" },
  { group: "Quotes", method: "POST", path: "/api/v1/quotes/:id/book", description: "Book quote" },
  { group: "Routing", method: "POST", path: "/api/v1/ai/route-optimize", description: "Optimize route" },
  { group: "Routing", method: "POST", path: "/api/v1/ai/carrier-recommend", description: "Carrier recommendation" },
  { group: "Routing", method: "GET", path: "/api/v1/ai/predictions/:id", description: "Delay prediction" },
  { group: "Carriers", method: "GET", path: "/api/v1/carriers", description: "List carriers" },
  { group: "Carriers", method: "GET", path: "/api/v1/carriers/:id/rates", description: "Carrier rates" },
  { group: "Documents", method: "POST", path: "/api/v1/documents/customs", description: "Customs documents" },
  { group: "Documents", method: "POST", path: "/api/v1/documents/invoice", description: "Invoice" },
  { group: "Documents", method: "GET", path: "/api/v1/documents/:id", description: "Download document" },
  { group: "Payments", method: "POST", path: "/api/v1/payments/charge", description: "Charge" },
  { group: "Payments", method: "GET", path: "/api/v1/payments/:id", description: "Payment status" },
];

export const SDK_SAMPLE = `npm install @kilogy/sdk

const { KilogyClient } = require('@kilogy/sdk');
const client = new KilogyClient({ apiKey: process.env.KILOGY_API_KEY });

const quotes = await client.quotes.create({
  origin: { country: 'CA', city: 'Montreal' },
  destination: { country: 'GH', city: 'Accra' },
  package: { weight_kg: 5, length: 20, width: 15, height: 10 },
});`;
