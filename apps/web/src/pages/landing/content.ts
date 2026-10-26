/**
 * Homepage copy. Edit text here; layout lives in Landing.tsx and landing.css.
 * Keep claims to what the prototype does today; add coverage or partner figures only once Kilogy confirms them.
 */

export const NAV = [
  { label: "How it works", href: "#how" },
  { label: "Quotes", href: "#quotes" },
  { label: "Tracking", href: "#tracking" },
  { label: "Developers", href: "/developers" },
];

export const HERO = {
  eyebrow: "Logistics operating system",
  title: "Ship across borders without juggling carriers.",
  body: "Kilogy compares air, ocean and road options in one quote, books the one you pick, and keeps you posted until it lands.",
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
export const CARGO_TYPES = ["General cargo", "Electronics", "Documents", "Apparel", "Auto parts", "Medical supplies"];

export const STEPS = [
  { title: "Quote", body: "Enter a lane and a package once. Kilogy asks every connected carrier and ranks the answers by price, speed and reliability." },
  { title: "Book", body: "Pick an option and book it in one step. Labels, documents and payment stay attached to the shipment." },
  { title: "Track", body: "Follow every leg on one timeline, with delay risk flagged before it turns into a missed delivery." },
];

/** Sample rows for the quote preview (illustrative). */
export const RATE_SAMPLE: { name: string; modes: ("air" | "ocean")[]; transit: string; price: string; reliability: string; tag?: string }[] = [
  { name: "Express air", modes: ["air"], transit: "5–7 days", price: "$1,245", reliability: "92%", tag: "Fastest" },
  { name: "Air + ocean", modes: ["air", "ocean"], transit: "12–15 days", price: "$950", reliability: "94%", tag: "Best value" },
  { name: "Ocean LCL", modes: ["ocean"], transit: "22–28 days", price: "$685", reliability: "95%", tag: "Cheapest" },
];

export const QUOTE_POINTS = [
  "Air, ocean and road options side by side",
  "Each option shows price, transit time and on-time record",
  "The AI engine explains why it ranked an option first",
];
export const TRACK_POINTS = [
  "One timeline across every carrier on the route",
  "Delay risk from weather, customs and carrier history",
  "Alerts when a shipment needs a decision",
];

/** Footer link columns. Every link points at a page or section that exists in the prototype. */
export const FOOTER_COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  { title: "Product", links: [
    { label: "Get a quote", to: "/shipments/new" },
    { label: "Live tracking", to: "/tracking" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Carriers", to: "/carriers" },
  ] },
  { title: "Learn", links: [
    { label: "How it works", to: "#how" },
    { label: "Quotes", to: "#quotes" },
    { label: "Tracking", to: "#tracking" },
  ] },
  { title: "Developers", links: [
    { label: "API keys", to: "/developers" },
    { label: "API reference", to: "/developers?tab=reference" },
    { label: "Architecture", to: "/developers?tab=architecture" },
  ] },
];

export const FOOTER_LANES = "Montreal · Toronto · Vancouver → Lagos · Accra · Kinshasa · Nairobi";
