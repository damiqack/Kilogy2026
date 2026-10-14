import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { collectRates } from "../src/carriers";
import { ApiError } from "../src/lib/errors";
import type { DecideFn, DecideInput } from "../src/services/aiEngine";
import type { RankedOption } from "../src/types";

const MONTREAL_TO_LAGOS = {
  origin: { country: "CA", city: "Montreal" },
  destination: { country: "NG", city: "Lagos" },
  package: { weight_kg: 10, dimensions: { l: 30, w: 20, h: 15 } },
};

/** Stand-in for the Python engine: ranks the carrier rates it receives by price. */
const fakeDecide: DecideFn = async (input: DecideInput) => ({
  chargeable_weight_kg: input.package.weight_kg,
  preferences: { cost: 0.35, speed: 0.3, carbon: 0.2, reliability: 0.15 },
  options: [...input.carrier_rates]
    .sort((a, b) => a.cost_usd - b.cost_usd)
    .map((r, i): RankedOption => ({
      rank: i + 1,
      carrier_id: r.carrier_id,
      carrier_name: r.carrier_name,
      service: r.service,
      service_name: r.service_name,
      price_usd: Math.round(r.cost_usd * 1.18 * 100) / 100,
      currency: "USD",
      transit_days: r.transit_days,
      co2_kg: 50,
      reliability: 0.9,
      ai_score: 90 - i,
      ai_scores: { cost: 80, speed: 70, carbon: 40, reliability: 90 },
      route: null,
      risk: { score: 0.2, level: "low", eta: { earliest: "2026-11-01", latest: "2026-11-03" }, factors: [] },
      pricing: { carrier_cost_usd: r.cost_usd, margin_pct: 18 },
    })),
});

describe("carrier rates", () => {
  it("includes Ethiopian via Addis Ababa only for African destinations", async () => {
    const africa = await collectRates(MONTREAL_TO_LAGOS);
    const europe = await collectRates({ ...MONTREAL_TO_LAGOS, destination: { country: "GB", city: "London" } });
    expect(africa.find((r) => r.carrier_id === "ethiopian")?.via).toBe("ADD");
    expect(europe.some((r) => r.carrier_id === "ethiopian")).toBe(false);
  });

  it("filters by requested service level", async () => {
    const rates = await collectRates({ ...MONTREAL_TO_LAGOS, services: ["express"] });
    expect(rates.length).toBeGreaterThan(0);
    expect(rates.every((r) => r.service === "express")).toBe(true);
  });
});

describe("POST /v1/quotes", () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => {
    app = createApp({ decide: fakeDecide });
  });

  it("returns a saved quote with ranked options", async () => {
    const res = await request(app).post("/v1/quotes").send(MONTREAL_TO_LAGOS).expect(201);
    expect(res.body.id).toMatch(/^qt_/);
    expect(res.body.status).toBe("open");
    expect(res.body.options.length).toBeGreaterThan(0);
    expect(res.body.options[0].rank).toBe(1);

    const again = await request(app).get(`/v1/quotes/${res.body.id}`).expect(200);
    expect(again.body.options).toEqual(res.body.options);
  });

  it("sends every carrier rate to the AI engine", async () => {
    const spy = vi.fn(fakeDecide);
    app = createApp({ decide: spy });
    await request(app).post("/v1/quotes").send({ ...MONTREAL_TO_LAGOS, service_type: ["standard"] }).expect(201);
    const sent = spy.mock.calls[0][0];
    expect(sent.carrier_rates.length).toBeGreaterThan(0);
    expect(sent.carrier_rates.every((r) => r.service === "standard")).toBe(true);
  });

  it("rejects an invalid request with a 400", async () => {
    const res = await request(app)
      .post("/v1/quotes")
      .send({ ...MONTREAL_TO_LAGOS, package: { weight_kg: -1 } })
      .expect(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("reports the AI engine being down as a 503", async () => {
    app = createApp({
      decide: async () => {
        throw new ApiError(503, "ai_engine_unavailable", "AI engine not reachable");
      },
    });
    const res = await request(app).post("/v1/quotes").send(MONTREAL_TO_LAGOS).expect(503);
    expect(res.body.error.code).toBe("ai_engine_unavailable");
  });

  it("returns 404 for an unknown quote", async () => {
    await request(app).get("/v1/quotes/qt_missing").expect(404);
  });
});
