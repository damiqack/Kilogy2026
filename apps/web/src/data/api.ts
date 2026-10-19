/**
 * Client for the Node API gateway (services/api on :4100).
 * Prefer this over calling the AI engine directly.
 */
import type { Preferences, Quote, QuoteRequest, RankedOption } from "./types";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:4100";

/** API response shape from POST/GET /v1/quotes */
interface ApiQuote {
  id: string;
  createdAt: string;
  origin: QuoteRequest["origin"];
  destination: QuoteRequest["destination"];
  package: QuoteRequest["package"];
  options: RankedOption[];
  chargeable_weight_kg: number;
  expiresAt: string;
  status: "open" | "booked" | "expired";
  ai_optimized: boolean;
  preferences: Partial<Preferences>;
}

function toUiQuote(q: ApiQuote, source: Quote["source"] = "ai-engine"): Quote {
  return {
    id: q.id,
    createdAt: q.createdAt,
    request: {
      origin: q.origin,
      destination: q.destination,
      package: q.package,
      service_type: ["express", "standard", "economy"],
      ai_optimize: q.ai_optimized,
      preferences: {
        cost: q.preferences.cost ?? 0.25,
        speed: q.preferences.speed ?? 0.25,
        carbon: q.preferences.carbon ?? 0.25,
        reliability: q.preferences.reliability ?? 0.25,
      },
    },
    options: q.options,
    chargeable_weight_kg: q.chargeable_weight_kg,
    source,
  };
}

/** Normalize UI weights (0–100) to API weights (0–1). */
function prefsForApi(p: Preferences) {
  const total = p.cost + p.speed + p.carbon + p.reliability || 1;
  return {
    cost: p.cost / total,
    speed: p.speed / total,
    carbon: p.carbon / total,
    reliability: p.reliability / total,
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message || `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Health check for the API gateway */
export async function apiHealthy(timeoutMs = 1200): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${API_URL}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/** POST /v1/quotes — create + rank a quote via carrier mocks + AI engine */
export async function createQuote(req: QuoteRequest): Promise<Quote> {
  const body = {
    origin: req.origin,
    destination: req.destination,
    package: req.package,
    service_type: req.service_type,
    ai_optimize: req.ai_optimize,
    preferences: prefsForApi(req.preferences),
  };
  const q = await apiFetch<ApiQuote>("/v1/quotes", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return toUiQuote(q, "ai-engine");
}

/** GET /v1/quotes — list this account's quotes */
export async function listQuotes(): Promise<Quote[]> {
  const res = await apiFetch<{ data: ApiQuote[] }>("/v1/quotes");
  return res.data.map((q) => toUiQuote(q));
}

/** GET /v1/quotes/:id */
export async function getQuote(id: string): Promise<Quote> {
  const q = await apiFetch<ApiQuote>(`/v1/quotes/${id}`);
  return toUiQuote(q);
}