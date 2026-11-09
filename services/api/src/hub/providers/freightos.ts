import { defineProvider } from "../define";

/** Freightos: open rate calculator; booking and tracking through WebCargo are partner only. */
export default defineProvider({
  manifest: {
    id: "freightos",
    name: "Freightos",
    category: "platform",
    modes: ["ocean", "air", "road"],
    regions: ["*"],
    capabilities: ["rates", "quotes", "booking", "tracking"],
    phase: 3,
    access: "agreement_required",
    credentials: ["HUB_FREIGHTOS_API_KEY"],
    docsUrl: "https://developers.freightos.com",
    limits: { minKg: 45 },
  },
  refPrefix: "FRT",
  sandbox: {
    services: [
      { service: "economy", name: "Marketplace ocean (LCL)", mode: "ocean", baseUsd: 160, perKgUsd: 0.8, transit: [25, 40] },
      { service: "standard", name: "Marketplace air", mode: "air", baseUsd: 90, perKgUsd: 4.8, transit: [4, 8] },
    ],
  },
});
