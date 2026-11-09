import { defineProvider } from "../define";

/** UPS: developer.ups.com. Rating, Shipping, Tracking, Address Validation, Time in Transit, Pickup; OAuth 2.0. */
export default defineProvider({
  manifest: {
    id: "ups",
    name: "UPS",
    category: "air_express",
    modes: ["air", "road", "parcel"],
    regions: ["*"],
    capabilities: ["rates", "booking", "tracking", "documents", "pickup", "cancellation"],
    phase: 2,
    access: "account_required",
    credentials: ["HUB_UPS_CLIENT_ID", "HUB_UPS_CLIENT_SECRET", "HUB_UPS_SHIPPER_NUMBER"],
    docsUrl: "https://developer.ups.com",
    limits: { maxKg: 1000 },
  },
  refPrefix: "1Z",
  sandbox: {
    services: [
      { service: "express", name: "UPS Worldwide Express", mode: "air", baseUsd: 46, perKgUsd: 9.6, transit: [2, 4] },
      { service: "standard", name: "UPS Worldwide Expedited", mode: "air", baseUsd: 36, perKgUsd: 7.0, transit: [3, 6] },
      { service: "economy", name: "UPS Standard", mode: "road", baseUsd: 22, perKgUsd: 3.9, transit: [5, 9] },
    ],
  },
});
