import express from "express";
import { createHub, createHubRouter } from "./hub";
import "./config"; // loads the repo's .env

/**
 * Runs the Integration Hub on its own (npm run hub). When the main API server is merged, mount the
 * same router there instead: app.use("/v1/hub", createHubRouter(createHub())).
 */
const port = Number(process.env.HUB_PORT ?? 4110);
const hub = createHub();
const app = express();
app.get("/health", (_req, res) => {
  res.json({ ok: true, providers: hub.providers().length });
});
app.use("/v1/hub", createHubRouter(hub));
app.listen(port, () => {
  const live = hub.providers().filter((p) => p.live).map((p) => p.id);
  console.log(`KILOGY Integration Hub on http://localhost:${port}/v1/hub (live: ${live.join(", ") || "none, all sandbox"})`);
});
