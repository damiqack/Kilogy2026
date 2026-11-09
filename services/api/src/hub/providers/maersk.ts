import { dcsaTracking } from "../dcsa";
import { defineProvider } from "../define";

/** Maersk: developer.maersk.com. Offers, bookings, schedules, DCSA tracking, B/L and VGM APIs. */
export default defineProvider({
  manifest: {
    id: "maersk",
    name: "Maersk",
    category: "ocean",
    modes: ["ocean", "road"],
    regions: ["*"],
    capabilities: ["rates", "quotes", "booking", "tracking", "schedules", "documents", "webhooks", "cancellation"],
    phase: 1,
    access: "account_required",
    credentials: ["HUB_MAERSK_CONSUMER_KEY", "HUB_MAERSK_TRACKING_URL"],
    standards: ["DCSA"],
    docsUrl: "https://developer.maersk.com",
    limits: { minKg: 100 },
  },
  refPrefix: "MAEU",
  sandbox: { services: [{ service: "economy", name: "Maersk Spot (LCL)", mode: "ocean", baseUsd: 180, perKgUsd: 0.9, transit: [24, 34] }] },
  live: (env) => dcsaTracking(env, { providerId: "maersk", baseUrlVar: "HUB_MAERSK_TRACKING_URL", auth: { kind: "header", header: "Consumer-Key", keyVar: "HUB_MAERSK_CONSUMER_KEY" } }),
});
