import { dcsaTracking } from "../dcsa";
import { defineProvider } from "../define";

/** Hapag-Lloyd: API portal with offers, contract specifications, schedules, DCSA tracking and live position. */
export default defineProvider({
  manifest: {
    id: "hapag-lloyd",
    name: "Hapag-Lloyd",
    category: "ocean",
    modes: ["ocean"],
    regions: ["*"],
    capabilities: ["rates", "quotes", "tracking", "schedules", "webhooks"],
    phase: 1,
    access: "account_required",
    credentials: ["HUB_HAPAG_CLIENT_ID", "HUB_HAPAG_TRACKING_URL"],
    standards: ["DCSA"],
    docsUrl: "https://www.hapag-lloyd.com/en/online-business.html",
    limits: { minKg: 100 },
  },
  refPrefix: "HLCU",
  sandbox: { services: [{ service: "economy", name: "Quick Quotes (FCL/LCL)", mode: "ocean", baseUsd: 175, perKgUsd: 0.95, transit: [25, 35] }] },
  live: (env) => dcsaTracking(env, { providerId: "hapag-lloyd", baseUrlVar: "HUB_HAPAG_TRACKING_URL", auth: { kind: "header", header: "X-IBM-Client-Id", keyVar: "HUB_HAPAG_CLIENT_ID" } }),
});
