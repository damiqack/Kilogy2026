import { defineProvider } from "../define";

/** FedEx: developer.fedex.com. Rate, Ship, Track, Pickup, Address Validation, trade documents. Ship needs label certification. */
export default defineProvider({
  manifest: {
    id: "fedex",
    name: "FedEx",
    category: "air_express",
    modes: ["air", "parcel"],
    regions: ["*"],
    capabilities: ["rates", "booking", "tracking", "documents", "pickup", "cancellation", "webhooks"],
    phase: 1,
    access: "account_required",
    credentials: ["HUB_FEDEX_CLIENT_ID", "HUB_FEDEX_CLIENT_SECRET", "HUB_FEDEX_ACCOUNT_NUMBER"],
    docsUrl: "https://developer.fedex.com",
    limits: { maxKg: 1000 },
  },
  refPrefix: "FDX",
  sandbox: {
    services: [
      { service: "express", name: "International Priority", mode: "air", baseUsd: 48, perKgUsd: 9.9, transit: [2, 4] },
      { service: "standard", name: "International Economy", mode: "air", baseUsd: 38, perKgUsd: 7.1, transit: [4, 6] },
      { service: "economy", name: "International Connect Plus", mode: "air", baseUsd: 30, perKgUsd: 5.9, transit: [5, 8] },
    ],
  },
});
