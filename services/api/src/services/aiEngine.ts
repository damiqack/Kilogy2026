import type { RateResponse } from "../carriers/types";
import { config } from "../config";
import { ApiError } from "../lib/errors";
import type { Location, PackageSpec, Preferences, RankedOption, ServiceLevel } from "../types";

/** Request body for the AI engine's Decision Engine (POST /v1/decide). */
export interface DecideInput {
  origin: Location;
  destination: Location;
  package: PackageSpec;
  service_type?: ServiceLevel[];
  ai_optimize: boolean;
  preferences?: Preferences;
  carrier_rates: RateResponse[];
}

export interface DecideResult {
  options: RankedOption[];
  chargeable_weight_kg: number;
  preferences: Preferences;
}

export type DecideFn = (input: DecideInput) => Promise<DecideResult>;

/**
 * Calls the Python AI engine. Errors are turned into ApiErrors so the client gets a clear
 * 502/503 instead of a stack trace.
 */
export const decide: DecideFn = async (input) => {
  let res: Response;
  try {
    res = await fetch(`${config.aiEngineUrl}/v1/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError(503, "ai_engine_unavailable", `AI engine not reachable at ${config.aiEngineUrl}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ApiError(502, "ai_engine_error", `AI engine returned ${res.status}`, detail.slice(0, 500));
  }
  return (await res.json()) as DecideResult;
};
