import { defineProvider } from "../define";

/** FourKites: real-time visibility, predictive ETAs and callbacks (webhooks). Customer licence; docs are gated. */
export default defineProvider({
  manifest: {
    id: "fourkites",
    name: "FourKites",
    category: "platform",
    modes: ["road", "ocean", "air", "rail"],
    regions: ["*"],
    capabilities: ["tracking", "webhooks"],
    phase: 3,
    access: "license_required",
    credentials: ["HUB_FOURKITES_API_KEY"],
    docsUrl: "https://developer.fourkites.com",
  },
  refPrefix: "FK",
  sandbox: { services: [] },
});
