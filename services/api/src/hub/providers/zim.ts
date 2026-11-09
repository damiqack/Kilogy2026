import { dcsaTracking } from "../dcsa";
import { defineProvider } from "../define";

/** ZIM: api.zim.com. Schedules and DCSA tracking; OAuth 2.0 client credentials; public APIs are free. */
export default defineProvider({
  manifest: {
    id: "zim",
    name: "ZIM",
    category: "ocean",
    modes: ["ocean"],
    regions: ["*"],
    capabilities: ["tracking", "schedules", "webhooks"],
    phase: 1,
    access: "self_serve",
    credentials: ["HUB_ZIM_CLIENT_ID", "HUB_ZIM_CLIENT_SECRET", "HUB_ZIM_TOKEN_URL", "HUB_ZIM_TRACKING_URL"],
    standards: ["DCSA"],
    docsUrl: "https://www.zim.com/tools/zim-api",
  },
  refPrefix: "ZIMU",
  sandbox: { services: [{ service: "economy", name: "ZIM ocean", mode: "ocean", baseUsd: 170, perKgUsd: 0.85, transit: [26, 36] }] },
  live: (env) => dcsaTracking(env, {
    providerId: "zim",
    baseUrlVar: "HUB_ZIM_TRACKING_URL",
    auth: { kind: "oauth", tokenUrlVar: "HUB_ZIM_TOKEN_URL", clientIdVar: "HUB_ZIM_CLIENT_ID", clientSecretVar: "HUB_ZIM_CLIENT_SECRET" },
  }),
});
