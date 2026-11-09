import { defineProvider } from "../define";

/** Purolator E-Ship Web Services: development key for testing, production key requested by the account holder. */
export default defineProvider({
  manifest: {
    id: "purolator",
    name: "Purolator",
    category: "canadian",
    modes: ["air", "road", "parcel"],
    regions: ["CA", "US"],
    origins: ["CA"],
    capabilities: ["rates", "booking", "tracking", "documents", "pickup", "cancellation"],
    phase: 2,
    access: "account_required",
    credentials: ["HUB_PUROLATOR_KEY", "HUB_PUROLATOR_PASSWORD", "HUB_PUROLATOR_ACCOUNT_NUMBER"],
    docsUrl: "https://eship.purolator.com/Site/content/developmentprocess.aspx",
    limits: { maxKg: 68 },
  },
  refPrefix: "PUR",
  sandbox: {
    services: [
      { service: "express", name: "Purolator Express", mode: "air", baseUsd: 30, perKgUsd: 5.2, transit: [1, 2] },
      { service: "standard", name: "Purolator Ground", mode: "road", baseUsd: 16, perKgUsd: 2.1, transit: [2, 5] },
    ],
  },
});
