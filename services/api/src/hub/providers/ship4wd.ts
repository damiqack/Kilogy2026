import { defineProvider } from "../define";

/**
 * Ship4WD: ZIM's digital freight forwarder for US and Canadian small businesses. No public API has
 * been found; this connector stays in sandbox until Ship4WD confirms an API in writing.
 */
export default defineProvider({
  manifest: {
    id: "ship4wd",
    name: "Ship4WD",
    category: "forwarding",
    modes: ["ocean", "air", "road"],
    regions: ["CA", "US", "CN", "VN", "IL"],
    capabilities: ["rates", "quotes", "booking", "tracking"],
    phase: 2,
    access: "unconfirmed",
    credentials: ["HUB_SHIP4WD_API_KEY"],
    docsUrl: "https://ship4wd.com",
    limits: { minKg: 50 },
  },
  refPrefix: "S4W",
  sandbox: {
    services: [
      { service: "economy", name: "Ocean LCL door to door", mode: "ocean", baseUsd: 220, perKgUsd: 0.95, transit: [28, 40] },
      { service: "standard", name: "Air freight door to door", mode: "air", baseUsd: 120, perKgUsd: 5.5, transit: [5, 9] },
    ],
  },
});
