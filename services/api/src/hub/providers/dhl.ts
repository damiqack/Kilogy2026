import { defineProvider } from "../define";

/**
 * DHL Express (MyDHL API): developer.dhl.com. Rates, shipments and labels, pickups, tracking.
 * Test access comes from DHL Express support; production follows DHL's technical acceptance.
 */
export default defineProvider({
  manifest: {
    id: "dhl",
    name: "DHL Express",
    category: "air_express",
    modes: ["air", "parcel"],
    regions: ["*"],
    capabilities: ["rates", "booking", "tracking", "documents", "pickup", "cancellation"],
    phase: 1,
    access: "account_required",
    credentials: ["HUB_DHL_API_KEY", "HUB_DHL_API_SECRET", "HUB_DHL_ACCOUNT_NUMBER"],
    docsUrl: "https://developer.dhl.com/api-reference/dhl-express-mydhl-api",
    limits: { maxKg: 1000 },
  },
  refPrefix: "DHL",
  sandbox: {
    services: [
      { service: "express", name: "Express Worldwide", mode: "air", baseUsd: 45, perKgUsd: 9.5, transit: [2, 4] },
      { service: "standard", name: "Economy Select", mode: "air", baseUsd: 35, perKgUsd: 6.8, transit: [4, 7] },
    ],
  },
});
