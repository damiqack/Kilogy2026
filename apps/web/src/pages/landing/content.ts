import inventory from "../../assets/photos/slide-inventory.webp";
import lastMile from "../../assets/photos/slide-last-mile.webp";
import multimodal from "../../assets/photos/slide-multimodal.webp";
import ocean from "../../assets/photos/slide-ocean.webp";
import port from "../../assets/photos/slide-port.webp";
import warehouse from "../../assets/photos/slide-warehouse.webp";
import type { Slide } from "../../components/PhotoCarousel";

/**
 * Homepage copy. Edit text here; layout lives in Landing.tsx and landing.css.
 * Keep claims to what the prototype does today; add coverage or partner figures only once Kilogy confirms them.
 */

export const NAV = [
  { label: "How it works", href: "#how" },
  { label: "Quotes", href: "#quotes" },
  { label: "Tracking", href: "#tracking" },
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
    { label: "Carriers", to: "/carriers" },
  ] },
  { title: "Learn", links: [
    { label: "How it works", to: "#how" },
    { label: "Quotes", to: "#quotes" },
    { label: "Tracking", to: "#tracking" },
  ] },
];

export const FOOTER_LANES = "Montreal · Toronto · Vancouver → Lagos · Accra · Kinshasa · Nairobi";

export const NETWORK = {
  title: "Carriers in the Kilogy network",
  note: "Integrations in testing and planned. Live connections roll out as each carrier approves access.",
};

/** Network carousel. Photos live in src/assets/photos; replace them with licensed or Kilogy-owned photos before launch. */
export const SLIDES: Slide[] = [
  { src: multimodal, title: "Air, ocean and road in one quote", body: "Kilogy compares every mode for your lane and ranks the options by price, speed and CO₂.",
    alt: "Container ship, truck and cargo plane at a port at night" },
  { src: ocean, title: "Ocean freight", body: "The lower-cost, lower-emission choice for shipments that can wait a few weeks.",
    alt: "Loaded container ship at sea with a plane overhead" },
  { src: port, title: "Port handoffs", body: "Follow containers through the port and see customs holds before they cause a delay.",
    alt: "Stacked shipping containers under port cranes" },
  { src: warehouse, title: "Warehousing", body: "Pickup, storage and dispatch on the same shipment record.", tag: "Coming soon",
    alt: "Two workers walking down a warehouse aisle carrying a box" },
  { src: inventory, title: "Consolidation", body: "Group cartons into fewer, fuller shipments to cut cost per kilogram.", tag: "Coming soon",
    alt: "Pallets of cardboard cartons stacked in a warehouse" },
  { src: lastMile, title: "Last-mile delivery", body: "Hand off to local partners and confirm delivery at the door.",
    alt: "Courier carrying two boxes to a delivery van" },
];
