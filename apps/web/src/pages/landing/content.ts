/**
 * Homepage copy, taken from Kilogy's homepage mockup. Edit text here; layout lives in
 * Landing.tsx and landing.css.
 *
 * Marketing figures (countries, offices, partner names) come from Kilogy's mockup and must be
 * confirmed by Kilogy before the page is public.
 */

export const NAV = ["Solutions", "Platform", "Integrations", "Resources", "Company", "Pricing"];

export const HERO = {
  title: ["The AI-Powered", "Global ", "Logistics", "Operating System"],
  body: "Connect. Orchestrate. Optimize. Every shipment, every carrier, every location — in one intelligent platform.",
};

export const ORIGINS = [
  { value: "CA:Montreal", label: "Montreal, Canada" },
  { value: "CA:Toronto", label: "Toronto, Canada" },
  { value: "CA:Vancouver", label: "Vancouver, Canada" },
  { value: "CA:Calgary", label: "Calgary, Canada" },
  { value: "CA:Ottawa", label: "Ottawa, Canada" },
];
export const DESTINATIONS = [
  { value: "CD:Kinshasa", label: "Kinshasa, DRC" },
  { value: "NG:Lagos", label: "Lagos, Nigeria" },
  { value: "GH:Accra", label: "Accra, Ghana" },
  { value: "KE:Nairobi", label: "Nairobi, Kenya" },
  { value: "SN:Dakar", label: "Dakar, Senegal" },
  { value: "ZA:Johannesburg", label: "Johannesburg, South Africa" },
];
export const CARGO_TYPES = ["General Cargo", "Consumer Electronics", "Documents", "Apparel & Textiles", "Auto Parts", "Medical Supplies"];

export const FEATURES = [
  { title: "Multi-Modal Solutions", body: "Ocean, Air, Road & Last-Mile" },
  { title: "AI Optimization", body: "Smart routing, pricing & risk" },
  { title: "Global Coverage", body: "186+ countries, 2600+ offices" },
  { title: "Real-Time Visibility", body: "Track every shipment live" },
  { title: "Secure & Compliant", body: "Data security & global compliance" },
  { title: "Unified Platform", body: "One system. All logistics." },
];

/** Sample rows for the "Smart Rate Comparison" card (illustrative, from the mockup). */
export const RATE_SAMPLE: { name: string; modes: ("air" | "ocean")[]; transit: string; price: string; reliability: string }[] = [
  { name: "DHL Express", modes: ["air"], transit: "5–7 days", price: "$1,245", reliability: "92%" },
  { name: "Maersk Ocean", modes: ["ocean"], transit: "22–28 days", price: "$685", reliability: "95%" },
  { name: "Air + Ocean", modes: ["air", "ocean"], transit: "12–15 days", price: "$950", reliability: "94%" },
];

export const PARTNERS = ["DHL", "MAERSK", "Hapag-Lloyd", "ZIM", "FedEx", "UPS", "aramex"];

export const BAND = [
  { title: "API-Powered Integration", body: "Connect with 100+ logistics providers via our unified API hub." },
  { title: "AI Decision Engine", body: "Get the best routes, rates & reliability with AI-powered insights." },
  { title: "End-to-End Visibility", body: "From booking to delivery, see everything in real time." },
  { title: "Automate & Scale", body: "Automate workflows, reduce costs, and scale globally." },
];
