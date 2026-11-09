import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import type { IntegrationHub } from "./hub";
import { CAPABILITIES } from "./types";

const location = z.object({ country: z.string().length(2).transform((c) => c.toUpperCase()), city: z.string().optional(), postalCode: z.string().optional(), address: z.string().optional() });
const pkg = z.object({
  weight_kg: z.number().positive(),
  dimensions: z.object({ l: z.number().positive(), w: z.number().positive(), h: z.number().positive() }).optional(),
  description: z.string().optional(),
  value_usd: z.number().nonnegative().optional(),
  hs_code: z.string().optional(),
});
const service = z.enum(["express", "standard", "economy"]);
const rateRequest = z.object({
  origin: location,
  destination: location,
  package: pkg,
  mode: z.enum(["air", "ocean", "road", "rail", "parcel"]).optional(),
  services: z.array(service).optional(),
  readyDate: z.string().optional(),
  providers: z.array(z.string()).optional(),
});
const bookingRequest = rateRequest.extend({ providerId: z.string(), service, quoteRef: z.string().optional(), reference: z.string().min(1) });
const pickupRequest = z.object({ providerId: z.string(), bookingRef: z.string(), address: location, date: z.string(), window: z.object({ from: z.string(), to: z.string() }).optional() });
const docType = z.enum(["label", "bill_of_lading", "commercial_invoice", "customs_declaration"]);

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ApiError(400, "invalid_request", "Request body is invalid", r.error.issues);
  return r.data;
}

/**
 * HTTP surface of the Integration Hub, mounted at /v1/hub. Every route is provider-neutral:
 * the provider is a path or body parameter, never a separate endpoint.
 */
export function createHubRouter(hub: IntegrationHub) {
  const r = express.Router();
  r.use(express.json({ limit: "1mb" }));

  r.get("/providers", (req, res) => {
    const capability = typeof req.query.capability === "string" ? req.query.capability : undefined;
    if (capability && !(CAPABILITIES as readonly string[]).includes(capability)) throw new ApiError(400, "invalid_request", `Unknown capability "${capability}"`);
    res.json({ providers: hub.providers({ capability: capability as never, category: req.query.category as never }) });
  });

  r.post("/rates", async (req, res) => {
    const { providers, ...body } = parse(rateRequest, req.body);
    res.json(await hub.rates(body, providers));
  });

  r.post("/bookings", async (req, res) => {
    const { providerId, ...body } = parse(bookingRequest, req.body);
    res.status(201).json(await hub.book(providerId, body));
  });

  r.post("/bookings/:providerId/:bookingRef/cancel", async (req, res) => {
    res.json(await hub.cancel(req.params.providerId as string, req.params.bookingRef as string));
  });

  r.get("/tracking/:providerId/:ref", async (req, res) => {
    res.json({ events: await hub.track(req.params.providerId as string, req.params.ref as string) });
  });

  r.get("/schedules/:providerId", async (req, res) => {
    const q = parse(z.object({ from: z.string().min(2), to: z.string().min(2), departAfter: z.string().optional() }), req.query);
    res.json({ schedules: await hub.schedules(req.params.providerId as string, q) });
  });

  r.get("/documents/:providerId/:ref/:type", async (req, res) => {
    const doc = await hub.document(req.params.providerId as string, req.params.ref as string, parse(docType, req.params.type));
    res.setHeader("Content-Type", doc.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.filename}"`);
    res.setHeader("X-Data-Source", doc.source);
    res.send(doc.content);
  });

  r.post("/pickups", async (req, res) => {
    const { providerId, ...body } = parse(pickupRequest, req.body);
    res.status(201).json(await hub.pickup(providerId, body));
  });

  r.post("/webhooks/:providerId", async (req, res) => {
    const events = await hub.webhook(req.params.providerId as string, { headers: req.headers, body: req.body });
    res.status(202).json({ accepted: events.length });
  });

  r.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    res.status(500).json({ error: { code: "internal", message: "Unexpected error" } });
  });
  return r;
}
