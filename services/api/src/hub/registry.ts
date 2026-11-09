import { ApiError } from "../lib/errors";
import { CAPABILITIES, CAPABILITY_METHOD, type Capability, type ProviderCategory, type ProviderConnector, type RateRequest } from "./types";
import { chargeableKg } from "./sandbox";

export interface ProviderFilter {
  capability?: Capability;
  category?: ProviderCategory;
  phase?: 1 | 2 | 3;
}

/**
 * Holds every registered connector. The hub asks it which providers can serve a request, so the
 * core never names a provider.
 */
export class ProviderRegistry {
  private connectors = new Map<string, ProviderConnector>();

  /** Adds a connector after checking it implements everything its manifest promises. */
  register(connector: ProviderConnector): this {
    const m = connector.manifest;
    if (!/^[a-z0-9-]+$/.test(m.id)) throw new Error(`Provider id "${m.id}" must be lowercase letters, digits and dashes`);
    if (this.connectors.has(m.id)) throw new Error(`Provider "${m.id}" is already registered`);
    for (const cap of m.capabilities) {
      if (!CAPABILITIES.includes(cap)) throw new Error(`${m.id}: unknown capability "${cap}"`);
      const method = CAPABILITY_METHOD[cap];
      if (typeof connector[method] !== "function") {
        throw new Error(`${m.id} declares "${cap}" but does not implement ${String(method)}()`);
      }
    }
    this.connectors.set(m.id, connector);
    return this;
  }

  get(id: string): ProviderConnector {
    const c = this.connectors.get(id);
    if (!c) throw new ApiError(404, "provider_not_found", `No provider "${id}" is registered`);
    return c;
  }

  has(id: string) {
    return this.connectors.has(id);
  }

  list(filter: ProviderFilter = {}): ProviderConnector[] {
    return [...this.connectors.values()].filter(({ manifest: m }) =>
      (!filter.capability || m.capabilities.includes(filter.capability)) &&
      (!filter.category || m.category === filter.category) &&
      (!filter.phase || m.phase === filter.phase));
  }

  /** Providers that can price this shipment: right capability, mode, countries and weight. */
  eligibleForRates(req: RateRequest): ProviderConnector[] {
    const kg = chargeableKg(req.package);
    return this.list().filter(({ manifest: m }) => {
      if (!m.capabilities.includes("rates") && !m.capabilities.includes("quotes")) return false;
      if (req.mode && !m.modes.includes(req.mode)) return false;
      const covers = (country: string) => m.regions.includes("*") || m.regions.includes(country);
      if (!covers(req.origin.country) || !covers(req.destination.country)) return false;
      if (m.origins && !m.origins.includes(req.origin.country)) return false;
      if (m.limits?.minKg && kg < m.limits.minKg) return false;
      if (m.limits?.maxKg && kg > m.limits.maxKg) return false;
      return true;
    });
  }
}
