import { defineProvider } from "../define";

/**
 * Canada Post: free developer registration; rating calls are free and labels are charged postage.
 * Contract shipping (negotiated rates) needs a parcel agreement.
 */
export default defineProvider({
  manifest: {
    id: "canada-post",
    name: "Canada Post",
    category: "canadian",
    modes: ["air", "road", "parcel"],
    regions: ["*"],
    origins: ["CA"],
    capabilities: ["rates", "booking", "tracking", "documents", "pickup", "cancellation"],
    phase: 1,
    access: "account_required",
    credentials: ["HUB_CANADAPOST_API_KEY", "HUB_CANADAPOST_CUSTOMER_NUMBER"],
    docsUrl: "https://www.canadapost-postescanada.ca/cpc/en/business/ecommerce/integrate-apis.page",
    limits: { maxKg: 30 },
  },
  refPrefix: "CP",
  sandbox: {
    services: [
      { service: "express", name: "Priority Worldwide", mode: "air", baseUsd: 40, perKgUsd: 8.5, transit: [3, 6] },
      { service: "standard", name: "Tracked Packet International", mode: "air", baseUsd: 18, perKgUsd: 4.2, transit: [6, 10] },
      { service: "economy", name: "International Surface", mode: "road", baseUsd: 12, perKgUsd: 2.6, transit: [20, 40] },
    ],
  },
});
