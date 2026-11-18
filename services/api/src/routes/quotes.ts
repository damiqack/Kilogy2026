import { Router } from "express";
import { z } from "zod";
import { collectRates } from "../carriers";
import { config } from "../config";
import { ApiError, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { Collection } from "../lib/store";
import type { DecideFn } from "../services/aiEngine";
import type { Quote } from "../types";

const location = z.object({
  country: z.string().length(2).transform((c) => c.toUpperCase()),
  city: z.string().min(1).optional(),
  postalCode: z.string().optional(),
  address: z.string().optional(),
});

const weight = z.number().min(0).max(1);

export const quoteRequestSchema = z.object({
  origin: location,
  destination: location,
  package: z.object({
    weight_kg: z.number().positive().max(30000),
    dimensions: z.object({ l: z.number().positive(), w: z.number().positive(), h: z.number().positive() }).optional(),
    description: z.string().optional(),
    value_usd: z.number().nonnegative().optional(),
    hs_code: z.string().optional(),
  }),
  service_type: z.array(z.enum(["express", "standard", "economy"])).min(1).optional(),
  ai_optimize: z.boolean().default(true),
  preferences: z.object({ cost: weight, speed: weight, carbon: weight, reliability: weight }).partial().optional(),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export function quotesRouter(deps: { decide: DecideFn; quotes: Collection<Quote> }) {
  const router = Router();

  /** Create a quote: collect carrier rates, rank them with the AI engine, save the result. */
  router.post("/", async (req, res) => {
    const body = quoteRequestSchema.parse(req.body);
    const accountId: string = res.locals.accountId;

    const rates = await collectRates({
      origin: body.origin,
      destination: body.destination,
      package: body.package,
      services: body.service_type,
    });
    if (rates.length === 0) {
      throw new ApiError(422, "no_rates", "No carrier serves this lane for the requested services");
    }

    const result = await deps.decide({
      origin: body.origin,
      destination: body.destination,
      package: body.package,
      service_type: body.service_type,
      ai_optimize: body.ai_optimize,
      preferences: body.preferences,
      carrier_rates: rates,
    });

    const quote = deps.quotes.insert({
      id: newId("qt"),
      accountId,
      origin: body.origin,
      destination: body.destination,
      package: body.package,
      options: result.options,
      chargeable_weight_kg: result.chargeable_weight_kg,
      preferences: result.preferences,
      expiresAt: new Date(Date.now() + config.quoteValiditySeconds * 1000).toISOString(),
      status: "open",
      ai_optimized: body.ai_optimize,
    });

    res.status(201).json(quote);
  });

  /** Fetch a saved quote. Quotes past their expiry are reported as expired. */
  router.get("/:id", (req, res) => {
    const quote = deps.quotes.get(res.locals.accountId, req.params.id);
    if (!quote) throw notFound("Quote");
    const expired = quote.status === "open" && Date.parse(quote.expiresAt) < Date.now();
    res.json(expired ? { ...quote, status: "expired" } : quote);
  });

  /** List this account's quotes, newest first. */
  router.get("/", (_req, res) => {
    const list = deps.quotes.list(res.locals.accountId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ data: list });
  });

  return router;
}
