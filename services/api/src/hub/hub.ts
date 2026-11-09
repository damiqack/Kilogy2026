import { ApiError } from "../lib/errors";
import { bus } from "../lib/eventBus";
import { ProviderRegistry, type ProviderFilter } from "./registry";
import {
  CAPABILITIES, CAPABILITY_METHOD, type BookingRequest, type CallContext, type Capability, type DocumentType,
  type HubRate, type PickupRequest, type ProviderConnector, type RateRequest, type ScheduleRequest, type WebhookInput,
} from "./types";

export interface HubOptions {
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
  /** Longest wait for one provider before it is reported as timed out. */
  timeoutMs?: number;
}

export interface ProviderFailure {
  providerId: string;
  code: "timeout" | "provider_error";
  message: string;
}

export interface RatesResult {
  rates: HubRate[];
  /** Providers that were asked but failed; the others' rates are still returned. */
  failures: ProviderFailure[];
  asked: string[];
}

/**
 * The KILOGY API Integration Hub. Routes each request to the providers that declare the needed
 * capability, calls them with a time limit, and returns one normalized shape. It never names a
 * provider: everything provider-specific lives in the connectors held by the registry.
 */
export class IntegrationHub {
  readonly registry: ProviderRegistry;
  private env: Record<string, string | undefined>;
  private fetchImpl: typeof fetch;
  private timeoutMs: number;

  constructor(registry: ProviderRegistry, opts: HubOptions = {}) {
    this.registry = registry;
    this.env = opts.env ?? {};
    this.fetchImpl = opts.fetch ?? fetch;
    this.timeoutMs = opts.timeoutMs ?? 8000;
  }

  /** Provider list for the admin Integration Hub page and the API. */
  providers(filter: ProviderFilter = {}) {
    return this.registry.list(filter).map((c) => ({
      ...c.manifest,
      sources: Object.fromEntries(c.manifest.capabilities.map((cap) => [cap, c.sourceFor(cap)])) as Partial<Record<Capability, "sandbox" | "live">>,
      live: c.manifest.capabilities.some((cap) => c.sourceFor(cap) === "live"),
    }));
  }

  /** Asks every eligible provider for rates in parallel. Slow or failing providers never block the rest. */
  async rates(req: RateRequest, only?: string[]): Promise<RatesResult> {
    const eligible = this.registry.eligibleForRates(req).filter((c) => !only || only.includes(c.manifest.id));
    const settled = await Promise.allSettled(eligible.map((c) => this.run(c, (ctx) => c.getRates!(req, ctx))));
    const rates: HubRate[] = [];
    const failures: ProviderFailure[] = [];
    settled.forEach((s, i) => {
      const id = eligible[i].manifest.id;
      if (s.status === "fulfilled") rates.push(...s.value);
      else failures.push({ providerId: id, code: s.reason instanceof ApiError && s.reason.code === "timeout" ? "timeout" : "provider_error", message: s.reason instanceof Error ? s.reason.message : String(s.reason) });
    });
    rates.sort((a, b) => a.amount - b.amount);
    return { rates, failures, asked: eligible.map((c) => c.manifest.id) };
  }

  async book(providerId: string, req: BookingRequest) {
    const c = this.require(providerId, "booking");
    const booking = await this.run(c, (ctx) => c.book!(req, ctx));
    bus.publish("shipment.booked", req.reference, "hub", booking);
    return booking;
  }

  async track(providerId: string, ref: string) {
    const c = this.require(providerId, "tracking");
    return this.run(c, (ctx) => c.track!(ref, ctx));
  }

  async schedules(providerId: string, req: ScheduleRequest) {
    const c = this.require(providerId, "schedules");
    return this.run(c, (ctx) => c.getSchedules!(req, ctx));
  }

  async document(providerId: string, ref: string, type: DocumentType) {
    const c = this.require(providerId, "documents");
    const doc = await this.run(c, (ctx) => c.getDocument!(ref, type, ctx));
    bus.publish("document.generated", ref, "hub", { providerId, ref, type, filename: doc.filename });
    return doc;
  }

  async cancel(providerId: string, bookingRef: string) {
    const c = this.require(providerId, "cancellation");
    const result = await this.run(c, (ctx) => c.cancel!(bookingRef, ctx));
    if (result.cancelled) bus.publish("shipment.cancelled", bookingRef, "hub", result);
    return result;
  }

  async pickup(providerId: string, req: PickupRequest) {
    const c = this.require(providerId, "pickup");
    return this.run(c, (ctx) => c.schedulePickup!(req, ctx));
  }

  /** Turns a provider's pushed update into hub tracking events and publishes them. */
  async webhook(providerId: string, input: WebhookInput) {
    const c = this.require(providerId, "webhooks");
    const events = await this.run(c, (ctx) => c.parseWebhook!(input, ctx));
    for (const e of events) bus.publish("tracking.event", e.ref, "hub", e);
    return events;
  }

  private require(providerId: string, cap: Capability): ProviderConnector {
    const c = this.registry.get(providerId);
    if (!c.manifest.capabilities.includes(cap)) {
      throw new ApiError(422, "capability_not_supported", `${c.manifest.name} does not support ${cap}`, {
        supported: CAPABILITIES.filter((x) => c.manifest.capabilities.includes(x)),
      });
    }
    if (typeof c[CAPABILITY_METHOD[cap]] !== "function") throw new ApiError(500, "connector_incomplete", `${providerId} is missing ${cap}`);
    return c;
  }

  /** Calls a connector with an abort signal and a time limit, and wraps unexpected errors. */
  private async run<T>(c: ProviderConnector, call: (ctx: CallContext) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new ApiError(504, "timeout", `${c.manifest.name} did not answer within ${this.timeoutMs} ms`));
      }, this.timeoutMs);
    });
    try {
      return await Promise.race([call({ signal: controller.signal, fetch: this.fetchImpl, env: this.env }), timeout]);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, "provider_error", `${c.manifest.name}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
