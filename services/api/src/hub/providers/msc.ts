import { dcsaTracking } from "../dcsa";
import { defineProvider } from "../define";

/**
 * MSC: access through the Direct Integration request form, then onboarding (fees may apply).
 * The auth header is confirmed during onboarding; the DCSA tracking mapping is shared.
 */
export default defineProvider({
  manifest: {
    id: "msc",
    name: "MSC",
    category: "ocean",
    modes: ["ocean"],
    regions: ["*"],
    capabilities: ["booking", "tracking", "schedules", "documents", "webhooks"],
    phase: 2,
    access: "agreement_required",
    credentials: ["HUB_MSC_API_KEY", "HUB_MSC_TRACKING_URL"],
    standards: ["DCSA"],
    docsUrl: "https://www.msc.com/en/solutions/digital-solutions/direct-integrations",
  },
  refPrefix: "MSCU",
  sandbox: { services: [{ service: "economy", name: "MSC ocean", mode: "ocean", baseUsd: 165, perKgUsd: 0.88, transit: [26, 38] }] },
  live: (env) => dcsaTracking(env, { providerId: "msc", baseUrlVar: "HUB_MSC_TRACKING_URL", auth: { kind: "header", header: "Authorization", keyVar: "HUB_MSC_API_KEY" } }),
});
