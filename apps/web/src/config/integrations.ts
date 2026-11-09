/**
 * KILOGY API Integration Hub catalogue, shown on /integrations.
 *
 * The connectors themselves live in services/api/src/hub/providers (one file per provider). Keep
 * id, capabilities, phase and credentials here in step with each provider's manifest there.
 * Access, cost and sandbox notes come from the feasibility assessment (November 2026).
 */

export const CAPABILITIES = ["rates", "quotes", "booking", "tracking", "schedules", "documents", "webhooks", "cancellation", "pickup"] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABEL: Record<Capability, string> = {
  rates: "Rates", quotes: "Quotes", booking: "Booking", tracking: "Tracking", schedules: "Schedules",
  documents: "Documents", webhooks: "Webhooks", cancellation: "Cancellation", pickup: "Pickup",
};
export const CAPABILITY_HINT: Record<Capability, string> = {
  rates: "Instant shipping prices",
  quotes: "Bookable freight quotations with a reference and expiry",
  booking: "Book shipments",
  tracking: "Shipment events and status",
  schedules: "Sailing, flight and departure schedules",
  documents: "Labels, bills of lading, invoices and customs paperwork",
  webhooks: "Pushed tracking updates",
  cancellation: "Cancel eligible bookings",
  pickup: "Schedule cargo collection",
};

export type Category = "ocean" | "air_express" | "canadian" | "forwarding" | "platform";
export const CATEGORY_LABEL: Record<Category, string> = {
  ocean: "Ocean freight", air_express: "Air and express", canadian: "Canadian delivery", forwarding: "Freight forwarding", platform: "Multi-carrier platform",
};
export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export type Access = "self_serve" | "account_required" | "agreement_required" | "license_required" | "unconfirmed";
export const ACCESS_LABEL: Record<Access, string> = {
  self_serve: "Self-serve",
  account_required: "Shipping account",
  agreement_required: "Agreement first",
  license_required: "Paid licence",
  unconfirmed: "Unconfirmed",
};

export interface Provider {
  id: string;
  name: string;
  category: Category;
  modes: string[];
  capabilities: Capability[];
  phase: 1 | 2 | 3;
  access: Access;
  accessNote: string;
  sandbox: string;
  cost: string;
  nextStep: string;
  docsUrl?: string;
  /** Environment variables the API service needs before this provider goes live. */
  credentials: string[];
  dcsa?: boolean;
}

export const PROVIDERS: Provider[] = [
  {
    id: "maersk", name: "Maersk", category: "ocean", modes: ["ocean", "road"], phase: 1, access: "account_required", dcsa: true,
    capabilities: ["rates", "quotes", "booking", "tracking", "schedules", "documents", "webhooks", "cancellation"],
    accessNote: "Self-serve keys at developer.maersk.com; bookings need a Maersk customer account.",
    sandbox: "Yes", cost: "Portal free; spot quotes usage-based",
    nextStep: "Register an app and request the Track & Trace and Offers products.",
    docsUrl: "https://developer.maersk.com", credentials: ["HUB_MAERSK_CONSUMER_KEY", "HUB_MAERSK_TRACKING_URL"],
  },
  {
    id: "msc", name: "MSC", category: "ocean", modes: ["ocean"], phase: 2, access: "agreement_required", dcsa: true,
    capabilities: ["booking", "tracking", "schedules", "documents", "webhooks"],
    accessNote: "Direct Integration request form, then an onboarding call.",
    sandbox: "In development", cost: "Setup and maintenance fees may apply",
    nextStep: "Submit the Direct Integration request form.",
    docsUrl: "https://www.msc.com/en/solutions/digital-solutions/direct-integrations", credentials: ["HUB_MSC_API_KEY", "HUB_MSC_TRACKING_URL"],
  },
  {
    id: "zim", name: "ZIM", category: "ocean", modes: ["ocean"], phase: 1, access: "self_serve", dcsa: true,
    capabilities: ["tracking", "schedules", "webhooks"],
    accessNote: "Apply at api.zim.com for a token; requests are reviewed. OAuth 2.0 client credentials.",
    sandbox: "Yes", cost: "Public APIs free",
    nextStep: "Apply for an API token and complete sandbox testing.",
    docsUrl: "https://www.zim.com/tools/zim-api", credentials: ["HUB_ZIM_CLIENT_ID", "HUB_ZIM_CLIENT_SECRET", "HUB_ZIM_TOKEN_URL", "HUB_ZIM_TRACKING_URL"],
  },
  {
    id: "cma-cgm", name: "CMA CGM", category: "ocean", modes: ["ocean"], phase: 2, access: "account_required", dcsa: true,
    capabilities: ["rates", "quotes", "booking", "tracking", "schedules", "documents", "cancellation", "webhooks"],
    accessNote: "Sign up at api-portal.cma-cgm.com; private tracking needs a verified booking party.",
    sandbox: "Not stated", cost: "Not stated",
    nextStep: "Create a portal account and subscribe to Track & Trace and Quotation.",
    docsUrl: "https://api-portal.cma-cgm.com", credentials: ["HUB_CMACGM_API_KEY", "HUB_CMACGM_TRACKING_URL"],
  },
  {
    id: "hapag-lloyd", name: "Hapag-Lloyd", category: "ocean", modes: ["ocean"], phase: 1, access: "account_required", dcsa: true,
    capabilities: ["rates", "quotes", "tracking", "schedules", "webhooks"],
    accessNote: "API portal sign-up; offers and contract APIs need a customer account.",
    sandbox: "Not stated", cost: "Not stated",
    nextStep: "Register on the API portal; confirm sandbox access with sales.",
    docsUrl: "https://www.hapag-lloyd.com/en/online-business.html", credentials: ["HUB_HAPAG_CLIENT_ID", "HUB_HAPAG_TRACKING_URL"],
  },
  {
    id: "one", name: "ONE (Ocean Network Express)", category: "ocean", modes: ["ocean"], phase: 2, access: "agreement_required", dcsa: true,
    capabilities: ["booking", "tracking", "schedules", "documents", "webhooks"],
    accessNote: "Registration and approval before API access.",
    sandbox: "Not stated", cost: "Not stated",
    nextStep: "Request API onboarding through ONE's e-commerce team.",
    docsUrl: "https://www.one-line.com/en/standard-page/ecommerce-applications", credentials: ["HUB_ONE_API_KEY", "HUB_ONE_TRACKING_URL"],
  },
  {
    id: "dhl", name: "DHL Express", category: "air_express", modes: ["air", "parcel"], phase: 1, access: "account_required",
    capabilities: ["rates", "booking", "tracking", "documents", "pickup", "cancellation"],
    accessNote: "Developer portal app; test access through DHL Express support; DHL account number.",
    sandbox: "Yes, then technical acceptance", cost: "Not stated; tracking key starts at 250 calls a day",
    nextStep: "Create a portal app and ask DHL Express support for test credentials.",
    docsUrl: "https://developer.dhl.com/api-reference/dhl-express-mydhl-api", credentials: ["HUB_DHL_API_KEY", "HUB_DHL_API_SECRET", "HUB_DHL_ACCOUNT_NUMBER"],
  },
  {
    id: "fedex", name: "FedEx", category: "air_express", modes: ["air", "parcel"], phase: 1, access: "account_required",
    capabilities: ["rates", "booking", "tracking", "documents", "pickup", "cancellation", "webhooks"],
    accessNote: "Developer portal project; FedEx account number; label certification before live shipping.",
    sandbox: "Yes", cost: "Not stated; 10 requests a second",
    nextStep: "Create a project, then start label certification (1 to 3 weeks).",
    docsUrl: "https://developer.fedex.com", credentials: ["HUB_FEDEX_CLIENT_ID", "HUB_FEDEX_CLIENT_SECRET", "HUB_FEDEX_ACCOUNT_NUMBER"],
  },
  {
    id: "ups", name: "UPS", category: "air_express", modes: ["air", "road", "parcel"], phase: 2, access: "account_required",
    capabilities: ["rates", "booking", "tracking", "documents", "pickup", "cancellation"],
    accessNote: "Developer portal app with OAuth 2.0; UPS shipper number.",
    sandbox: "Yes (CIE)", cost: "Not stated",
    nextStep: "Create an app and link a UPS shipper number.",
    docsUrl: "https://developer.ups.com", credentials: ["HUB_UPS_CLIENT_ID", "HUB_UPS_CLIENT_SECRET", "HUB_UPS_SHIPPER_NUMBER"],
  },
  {
    id: "canada-post", name: "Canada Post", category: "canadian", modes: ["air", "road", "parcel"], phase: 1, access: "account_required",
    capabilities: ["rates", "booking", "tracking", "documents", "pickup", "cancellation"],
    accessNote: "Free developer registration; contract shipping needs a parcel agreement.",
    sandbox: "Yes", cost: "Rating free; labels charge postage",
    nextStep: "Register on the developer portal and confirm KILOGY's parcel agreement.",
    docsUrl: "https://www.canadapost-postescanada.ca/cpc/en/business/ecommerce/integrate-apis.page", credentials: ["HUB_CANADAPOST_API_KEY", "HUB_CANADAPOST_CUSTOMER_NUMBER"],
  },
  {
    id: "purolator", name: "Purolator", category: "canadian", modes: ["air", "road", "parcel"], phase: 2, access: "account_required",
    capabilities: ["rates", "booking", "tracking", "documents", "pickup", "cancellation"],
    accessNote: "Development key for testing; the account holder requests the production key.",
    sandbox: "Yes", cost: "Not stated",
    nextStep: "Request a development key from E-Ship Web Services.",
    docsUrl: "https://eship.purolator.com/Site/content/developmentprocess.aspx", credentials: ["HUB_PUROLATOR_KEY", "HUB_PUROLATOR_PASSWORD", "HUB_PUROLATOR_ACCOUNT_NUMBER"],
  },
  {
    id: "ship4wd", name: "Ship4WD", category: "forwarding", modes: ["ocean", "air", "road"], phase: 2, access: "unconfirmed",
    capabilities: ["rates", "quotes", "booking", "tracking"],
    accessNote: "No public API found. ZIM subsidiary for US and Canadian small businesses.",
    sandbox: "No", cost: "Unknown",
    nextStep: "Ask Ship4WD for written confirmation of an API, sandbox and booking endpoints.",
    docsUrl: "https://ship4wd.com", credentials: ["HUB_SHIP4WD_API_KEY"],
  },
  {
    id: "project44", name: "project44", category: "platform", modes: ["ocean", "air", "road", "rail", "parcel"], phase: 3, access: "license_required",
    capabilities: ["rates", "booking", "tracking", "webhooks"],
    accessNote: "Public docs; a customer tenant and OAuth client are needed to call the API.",
    sandbox: "Yes, for sandbox tenants", cost: "Licence, quote on request",
    nextStep: "Request a demo and a sandbox tenant.",
    docsUrl: "https://developers.project44.com", credentials: ["HUB_P44_CLIENT_ID", "HUB_P44_CLIENT_SECRET"],
  },
  {
    id: "freightos", name: "Freightos", category: "platform", modes: ["ocean", "air", "road"], phase: 3, access: "agreement_required",
    capabilities: ["rates", "quotes", "booking", "tracking"],
    accessNote: "Rate calculator is open; booking and tracking through WebCargo are partner only.",
    sandbox: "Not stated", cost: "Calculator free; booking enterprise",
    nextStep: "Use the open calculator; apply for WebCargo partnership for booking.",
    docsUrl: "https://developers.freightos.com", credentials: ["HUB_FREIGHTOS_API_KEY"],
  },
  {
    id: "fourkites", name: "FourKites", category: "platform", modes: ["road", "ocean", "air", "rail"], phase: 3, access: "license_required",
    capabilities: ["tracking", "webhooks"],
    accessNote: "Customer licence; docs gated; webhooks are set up with FourKites.",
    sandbox: "Not stated", cost: "Licence",
    nextStep: "Request pricing and sample callback payloads.",
    docsUrl: "https://developer.fourkites.com", credentials: ["HUB_FOURKITES_API_KEY"],
  },
];

export const PHASES = [
  { phase: 1 as const, name: "Foundation", gate: "Business model chosen and sandbox accounts open", outcome: "Live quotes, booking, labels and tracking" },
  { phase: 2 as const, name: "Network expansion", gate: "Phase 1 passes contract tests; MSC, ONE and Ship4WD agreements signed", outcome: "More ocean, Canadian and forwarding options" },
  { phase: 3 as const, name: "Intelligence", gate: "Platform licences budgeted and signed", outcome: "Unified visibility and predictive ETAs" },
];
