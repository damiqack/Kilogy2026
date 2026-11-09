import { dcsaTracking } from "../dcsa";
import { defineProvider } from "../define";

/** CMA CGM: api-portal.cma-cgm.com. Quotation, booking request, schedules, invoices and DCSA tracking. */
export default defineProvider({
  manifest: {
    id: "cma-cgm",
    name: "CMA CGM",
    category: "ocean",
    modes: ["ocean"],
    regions: ["*"],
    capabilities: ["rates", "quotes", "booking", "tracking", "schedules", "documents", "cancellation", "webhooks"],
    phase: 2,
    access: "account_required",
    credentials: ["HUB_CMACGM_API_KEY", "HUB_CMACGM_TRACKING_URL"],
    standards: ["DCSA"],
    docsUrl: "https://api-portal.cma-cgm.com",
    limits: { minKg: 100 },
  },
  refPrefix: "CMDU",
  sandbox: { services: [{ service: "economy", name: "SpotOn ocean", mode: "ocean", baseUsd: 170, perKgUsd: 0.9, transit: [26, 36] }] },
  live: (env) => dcsaTracking(env, { providerId: "cma-cgm", baseUrlVar: "HUB_CMACGM_TRACKING_URL", auth: { kind: "header", header: "KeyId", keyVar: "HUB_CMACGM_API_KEY" } }),
});
