import { MOCK_CARRIERS } from "./mock";
import type { ICarrierAdapter, RateRequest, RateResponse } from "./types";

/**
 * Carrier registry. Swap a mock for a real adapter here when its sandbox is connected,
 * e.g. replace the "dhl" mock with `new DhlAdapter(config.dhl)`.
 */
export const carriers: ICarrierAdapter[] = [...MOCK_CARRIERS];

export const getCarrier = (id: string) => carriers.find((c) => c.id === id);

/**
 * Ask every carrier for rates in parallel. A carrier that errors is skipped so one bad
 * integration never blocks a quote.
 */
export async function collectRates(req: RateRequest): Promise<RateResponse[]> {
  const results = await Promise.allSettled(carriers.map((c) => c.getRates(req)));
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
