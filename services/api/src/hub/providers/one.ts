import { dcsaTracking } from "../dcsa";
import { defineProvider } from "../define";

/** Ocean Network Express (ONE): API access after registration and approval; DCSA tracking. */
export default defineProvider({
  manifest: {
    id: "one",
    name: "ONE (Ocean Network Express)",
    category: "ocean",
    modes: ["ocean"],
    regions: ["*"],
    capabilities: ["booking", "tracking", "schedules", "documents", "webhooks"],
    phase: 2,
    access: "agreement_required",
    credentials: ["HUB_ONE_API_KEY", "HUB_ONE_TRACKING_URL"],
    standards: ["DCSA"],
    docsUrl: "https://www.one-line.com/en/standard-page/ecommerce-applications",
  },
  refPrefix: "ONEY",
  sandbox: { services: [{ service: "economy", name: "ONE ocean", mode: "ocean", baseUsd: 168, perKgUsd: 0.9, transit: [25, 37] }] },
  live: (env) => dcsaTracking(env, { providerId: "one", baseUrlVar: "HUB_ONE_TRACKING_URL", auth: { kind: "header", header: "Authorization", keyVar: "HUB_ONE_API_KEY" } }),
});
