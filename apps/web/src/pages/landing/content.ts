/**
 * Homepage copy. Edit text here; layout lives in Landing.tsx and landing.css.
 * Keep claims factual: describe what the product does, not invented customer numbers.
 */

export const HERO = {
  eyebrow: "Canada ⇄ Africa freight",
  title: "One quote. Every carrier. The best route.",
  body:
    "Kilogy compares DHL, FedEx, UPS, Ethiopian Air Cargo and Canada Post on price, transit time, " +
    "delay risk and carbon, then books and tracks the shipment from one screen.",
};

/** Cities offered in the homepage quote box. Values use the "COUNTRY:City" format NewShipment reads. */
export const QUICK_ORIGINS = [
  { value: "CA:Montreal", label: "Montreal, CA" },
  { value: "CA:Toronto", label: "Toronto, CA" },
  { value: "CA:Vancouver", label: "Vancouver, CA" },
  { value: "CA:Calgary", label: "Calgary, CA" },
  { value: "CA:Ottawa", label: "Ottawa, CA" },
];

export const QUICK_DESTINATIONS = [
  { value: "NG:Lagos", label: "Lagos, NG" },
  { value: "NG:Abuja", label: "Abuja, NG" },
  { value: "GH:Accra", label: "Accra, GH" },
  { value: "KE:Nairobi", label: "Nairobi, KE" },
  { value: "SN:Dakar", label: "Dakar, SN" },
  { value: "ZA:Johannesburg", label: "Johannesburg, ZA" },
];

/** Sample quote shown in the hero. Values mirror the prototype's mock engine output. */
export const SAMPLE_QUOTE = {
  route: "Montreal → Lagos · 10 kg parcel",
  rows: [
    { carrier: "DHL Express", service: "Economy Select", days: 7, price: "$96.35", co2: "55 kg", risk: "Medium", pick: "Recommended" },
    { carrier: "Ethiopian Air Cargo", service: "Air Freight via ADD", days: 5, price: "$72.87", co2: "97 kg", risk: "Medium", pick: "Lowest price" },
    { carrier: "DHL Express", service: "International Express", days: 4, price: "$159.50", co2: "55 kg", risk: "Medium", pick: "Fastest" },
  ],
};

export const STEPS = [
  { n: "01", title: "Describe the shipment", body: "Origin, destination, weight and dimensions. Kilogy flags customs and routing issues while you type." },
  { n: "02", title: "Compare ranked options", body: "Every carrier and route is scored on cost, speed, reliability and CO₂. Change the weights and the ranking updates." },
  { n: "03", title: "Book and track", body: "Book in one click. Labels and customs paperwork are generated, and each leg is tracked with a predicted delivery date." },
];

export const CAPABILITIES = [
  { label: "Routing", title: "Multi-carrier, multi-modal routes", body: "Air, ocean and road legs are combined through hubs such as Addis Ababa, Amsterdam and Halifax to find routes a single carrier would not offer." },
  { label: "Risk", title: "Delay prediction before you book", body: "Weather, customs clearance and hand-off counts produce a delay-risk score and an ETA window for each option." },
  { label: "Carbon", title: "Emissions on every quote", body: "CO₂e is estimated per leg and per mode, so the low-carbon option is visible next to price and speed." },
  { label: "Documents", title: "Labels and customs paperwork", body: "Commercial invoices, labels and customs forms are created from the shipment record and stored with it." },
  { label: "Payments", title: "Pay and reconcile in one place", body: "Each booking carries its payment status, so finance sees what is paid, pending or refunded." },
  { label: "API", title: "API-first from day one", body: "Everything in the dashboard is available over REST with API keys and webhooks, so it can sit inside your own systems." },
];

export const API_SAMPLE = `curl -X POST https://api.kilogy.io/v1/quotes \\
  -H "Authorization: Bearer $KILOGY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "origin":      { "country": "CA", "city": "Montreal" },
    "destination": { "country": "NG", "city": "Lagos" },
    "package":     { "weight_kg": 10 },
    "preferences": { "cost": 0.3, "speed": 0.3, "carbon": 0.3, "reliability": 0.1 }
  }'`;
