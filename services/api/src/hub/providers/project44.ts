import { defineProvider } from "../define";

/** project44: developers.project44.com. Multi-modal tracking, LTL and multi-modal rating and booking, webhooks. Licensed. */
export default defineProvider({
  manifest: {
    id: "project44",
    name: "project44",
    category: "platform",
    modes: ["ocean", "air", "road", "rail", "parcel"],
    regions: ["CA", "US", "MX"],
    capabilities: ["rates", "booking", "tracking", "webhooks"],
    phase: 3,
    access: "license_required",
    credentials: ["HUB_P44_CLIENT_ID", "HUB_P44_CLIENT_SECRET"],
    docsUrl: "https://developers.project44.com",
    limits: { minKg: 70 },
  },
  refPrefix: "P44",
  sandbox: { services: [{ service: "standard", name: "LTL (carrier network)", mode: "road", baseUsd: 140, perKgUsd: 0.35, transit: [3, 7] }] },
});
