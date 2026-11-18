import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { config } from "./config";
import { createHub, createHubRouter, type IntegrationHub } from "./hub";
import { ApiError } from "./lib/errors";
import { Collection } from "./lib/store";
import { quotesRouter } from "./routes/quotes";
import { decide as liveDecide, type DecideFn } from "./services/aiEngine";
import type { Quote } from "./types";

/** Account used until the auth middleware (API keys + JWT) is in place. */
export const DEV_ACCOUNT_ID = "acct_dev";

export interface AppDeps {
  decide?: DecideFn;
  quotes?: Collection<Quote>;
  hub?: IntegrationHub;
}

/**
 * Builds the Express app. Dependencies can be passed in so tests run without the
 * Python AI engine.
 */
export function createApp(deps: AppDeps = {}) {
  const app = express();
  const quotes = deps.quotes ?? new Collection<Quote>();

  // Let the web app (Vite dev server and preview) call the API from the browser.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && config.corsOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "1mb" }));

  // Placeholder for auth: every request belongs to the dev account for now.
  app.use((_req, res, next) => {
    res.locals.accountId = DEV_ACCOUNT_ID;
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "api" });
  });

  app.use("/v1/quotes", quotesRouter({ decide: deps.decide ?? liveDecide, quotes }));
  // KILOGY API Integration Hub: rates, bookings, tracking, documents and webhooks across providers.
  app.use("/v1/hub", createHubRouter(deps.hub ?? createHub()));

  app.use((req, _res, next) => next(new ApiError(404, "not_found", `No route for ${req.method} ${req.path}`)));

  // Every error leaves the API in the same shape: { error: { code, message, details? } }
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: { code: "validation_error", message: "Invalid request body", details: err.issues } });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: { code: "invalid_json", message: "Request body is not valid JSON" } });
      return;
    }
    console.error(err);
    res.status(500).json({ error: { code: "internal", message: "Unexpected server error" } });
  });

  return app;
}
