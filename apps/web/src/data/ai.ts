import { approxDistanceKm, chargeableKg, EMISSION_FACTORS, mockCarrierRates, type CarrierRate } from "./carriers";
import type { Quote, QuoteRequest, RankedOption } from "./types";

export const AI_ENGINE_URL: string = import.meta.env.VITE_AI_ENGINE_URL ?? "http://localhost:4200";

export async function aiEngineHealthy(timeoutMs = 1200): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${AI_ENGINE_URL}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

const newId = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * Decision Engine call (architecture flow steps 4-9).
 * Uses the live Python AI engine when it's running; otherwise a local mock that produces the
 * same response shape, so the UI works standalone.
 */
export async function requestQuote(req: QuoteRequest): Promise<Quote> {
  const rates = mockCarrierRates(req.origin, req.destination, req.package);
  if (await aiEngineHealthy()) {
    try {
      const res = await fetch(`${AI_ENGINE_URL}/v1/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req, carrier_rates: rates }),
      });
      if (res.ok) {
        const body = await res.json();
        return {
          id: newId("qt"), createdAt: new Date().toISOString(), request: req,
          options: body.options, chargeable_weight_kg: body.chargeable_weight_kg, source: "ai-engine",
        };
      }
    } catch {
      /* fall through to mock */
    }
  }
  return mockDecide(req, rates);
}

// Nearest gateway hub for mock routes (the live engine computes these itself).
const CITY_HUB: Record<string, string> = {
  montreal: "YUL", ottawa: "YUL", toronto: "YYZ", london: "YYZ", vancouver: "YVR", calgary: "YVR", halifax: "HAL",
  lagos: "LOS", abuja: "LOS", accra: "ACC", kumasi: "ACC", nairobi: "NBO", mombasa: "NBO", dakar: "DKR",
  johannesburg: "JNB", "cape town": "JNB", cairo: "CAI", "addis ababa": "ADD",
};
const COUNTRY_HUB: Record<string, string> = {
  CA: "YYZ", US: "JFK", NG: "LOS", GH: "ACC", KE: "NBO", SN: "DKR", ZA: "JNB", EG: "CAI", ET: "ADD",
  GB: "LHR", FR: "CDG", DE: "FRA", NL: "AMS", AE: "DXB",
};
const hubFor = (l: { country: string; city?: string }) =>
  CITY_HUB[(l.city ?? "").trim().toLowerCase()] ?? COUNTRY_HUB[l.country] ?? l.country;

function mockDecide(req: QuoteRequest, all: CarrierRate[]): Quote {
  const rates = all.filter((r) => req.service_type.includes(r.service));
  const km = approxDistanceKm(req.origin, req.destination);
  const kg = req.package.weight_kg;
  const p = normalize(req.preferences);
  const inv = (vals: number[]) => {
    const lo = Math.min(...vals), hi = Math.max(...vals);
    return vals.map((v) => (hi === lo ? 100 : (100 * (hi - v)) / (hi - lo)));
  };
  const priced = rates.map((r) => {
    const margin = req.ai_optimize ? (r.service === "express" ? 0.22 : r.service === "standard" ? 0.17 : 0.12) : 0;
    const co2 = (EMISSION_FACTORS[r.mode] * (kg / 1000) * km * 1.15) / 1000;
    const risk = Math.min(0.9, 0.08 + (r.mode === "ocean" ? 0.18 : 0) + (req.origin.country !== req.destination.country ? 0.1 : 0));
    const reliability = ({ dhl: 0.94, fedex: 0.92, ups: 0.91, ethiopian: 0.9, canadapost: 0.86 } as Record<string, number>)[r.carrier_id] ?? 0.85;
    return { r, price: Math.round(r.cost_usd * (1 + margin) * 100) / 100, margin, co2, risk, reliability: reliability * (1 - risk / 2) };
  });
  const cs = inv(priced.map((x) => x.price));
  const ss = inv(priced.map((x) => x.r.transit_days));
  const es = inv(priced.map((x) => x.co2));
  const today = new Date();
  const iso = (d: number) => new Date(today.getTime() + d * 864e5).toISOString().slice(0, 10);

  const options: RankedOption[] = priced.map((x, i) => {
    const rs = 100 * x.reliability;
    const o = req.origin.city ?? req.origin.country;
    const d = req.destination.city ?? req.destination.country;
    const h1 = hubFor(req.origin), h2 = hubFor(req.destination);
    const hubs = x.r.via ? [h1, x.r.via, h2] : [h1, h2];
    const lineKm = Math.round(km * 1.1);
    const legs = [
      { from: o, to: h1, mode: "road" as const, distance_km: 35, transit_hours: 3, co2_kg: +(0.062 * kg * 0.035).toFixed(3) },
      ...hubs.slice(1).map((h, j) => ({
        from: hubs[j], to: h, mode: x.r.mode, distance_km: Math.round(lineKm / (hubs.length - 1)),
        transit_hours: (x.r.transit_days * 20) / (hubs.length - 1), co2_kg: +(x.co2 / (hubs.length - 1)).toFixed(2),
      })),
      { from: h2, to: d, mode: "road" as const, distance_km: 28, transit_hours: 4, co2_kg: +(0.062 * kg * 0.028).toFixed(3) },
    ];
    return {
      rank: 0, carrier_id: x.r.carrier_id, carrier_name: x.r.carrier_name, service: x.r.service, service_name: x.r.service_name,
      price_usd: x.price, transit_days: x.r.transit_days, co2_kg: +x.co2.toFixed(2), reliability: +x.reliability.toFixed(3),
      ai_scores: { cost: +cs[i].toFixed(1), speed: +ss[i].toFixed(1), carbon: +es[i].toFixed(1), reliability: +rs.toFixed(1) },
      ai_score: +(p.cost * cs[i] + p.speed * ss[i] + p.carbon * es[i] + p.reliability * rs).toFixed(1),
      route: { summary: [o, ...hubs, d].join(" → "), primary_mode: x.r.mode, legs },
      risk: {
        score: +x.risk.toFixed(3), level: x.risk < 0.25 ? "low" : x.risk < 0.55 ? "medium" : "high",
        eta: { earliest: iso(Math.floor(x.r.transit_days)), latest: iso(Math.ceil(x.r.transit_days * 1.25 + 1)) },
        factors: [{ factor: "customs_clearance", impact: 0.45 }, { factor: "transport_mode", impact: 0.35 }, { factor: "weather", impact: 0.2 }],
      },
      pricing: { carrier_cost_usd: x.r.cost_usd, margin_pct: +(x.margin * 100).toFixed(1) },
    };
  });
  options.sort((a, b) => b.ai_score - a.ai_score);
  options.forEach((o, i) => (o.rank = i + 1));
  if (options.length) {
    options[0].tags = ["recommended"];
    const tag = (key: "price_usd" | "transit_days" | "co2_kg", t: string) => {
      const best = options.reduce((m, o) => ((o[key] ?? Infinity) < (m[key] ?? Infinity) ? o : m));
      best.tags = [...(best.tags ?? []), t];
    };
    tag("price_usd", "cheapest"); tag("transit_days", "fastest"); tag("co2_kg", "greenest");
  }
  return {
    id: newId("qt"), createdAt: new Date().toISOString(), request: req, options,
    chargeable_weight_kg: +chargeableKg(req.package).toFixed(2), source: "mock",
  };
}

function normalize(p: QuoteRequest["preferences"]) {
  const total = p.cost + p.speed + p.carbon + p.reliability || 1;
  return { cost: p.cost / total, speed: p.speed / total, carbon: p.carbon / total, reliability: p.reliability / total };
}

const AFRICA = new Set(["NG", "GH", "KE", "ZA", "EG", "ET", "SN"]);

/**
 * Inline AI suggestions for the shipment form (spec 3.2). Rule-based in the prototype;
 * production calls the Routing Engine and Load Matcher as the user types.
 */
export function inlineSuggestions(req: Pick<QuoteRequest, "origin" | "destination" | "package">): string[] {
  const tips: string[] = [];
  const { origin, destination } = req;
  const pkg = req.package;
  const actual = pkg.weight_kg || 0;
  const chargeable = chargeableKg(pkg);
  if (origin.country === "CA" && AFRICA.has(destination.country)) {
    tips.push("Based on package dimensions, consider multi-modal air + road via the Ethiopian Airlines cargo hub in Addis Ababa (ADD). It is usually the lowest-cost air option into Africa.");
  }
  if (chargeable > actual * 1.3 && chargeable > 2) {
    tips.push(`Billed as ${chargeable.toFixed(1)} kg dimensional weight (actual ${actual} kg). A smaller box could lower the price.`);
  }
  if (chargeable >= 70 && origin.country !== destination.country) {
    tips.push("At this weight, ocean LCL via Halifax can cut cost by about 60% and CO₂ by about 95%, with 3–4 extra weeks in transit.");
  }
  return tips;
}
