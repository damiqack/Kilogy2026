import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createHub, createHubRouter, defineProvider, ProviderRegistry, type ProviderConnector, type ProviderManifest, type RateRequest } from "../src/hub";
import type { ProviderDefinition } from "../src/hub/define";
import { PROVIDERS } from "../src/hub/providers";
import { bus } from "../src/lib/eventBus";

const parcel: RateRequest = { origin: { country: "CA", city: "Montreal" }, destination: { country: "NG", city: "Lagos" }, package: { weight_kg: 5 } };
const container: RateRequest = { ...parcel, package: { weight_kg: 800 }, mode: "ocean" };

describe("provider catalogue", () => {
  it("registers all 15 initial providers across the five categories", () => {
    const hub = createHub({ env: {} });
    const list = hub.providers();
    expect(list).toHaveLength(15);
    expect(new Set(list.map((p) => p.category))).toEqual(new Set(["ocean", "air_express", "canadian", "forwarding", "platform"]));
    expect(list.every((p) => !p.live)).toBe(true); // no credentials: everything runs in sandbox
  });

  it("rejects a connector that declares a capability it does not implement", () => {
    const broken = { manifest: { ...PROVIDERS[0].manifest, id: "broken", capabilities: ["booking"] }, sourceFor: () => "sandbox" } as unknown as ProviderConnector;
    expect(() => new ProviderRegistry().register(broken)).toThrow(/does not implement book/);
  });

  it("adds a new partner without changing the core", async () => {
    const acme = defineProvider({
      manifest: { id: "acme-freight", name: "Acme Freight", category: "forwarding", modes: ["air"], regions: ["*"], capabilities: ["rates", "tracking"], phase: 3, access: "self_serve", credentials: [] },
      refPrefix: "ACME",
      sandbox: { services: [{ service: "standard", name: "Acme Air", mode: "air", baseUsd: 1, perKgUsd: 1, transit: [3, 5] }] },
    });
    const hub = createHub({ env: {}, providers: [...PROVIDERS, acme] });
    const { rates } = await hub.rates(parcel);
    expect(rates.some((r) => r.providerId === "acme-freight")).toBe(true);
    expect((await hub.track("acme-freight", "ACME123")).length).toBeGreaterThan(0);
  });
});

describe("rates", () => {
  it("asks only providers that fit the shipment and returns the cheapest first", async () => {
    const { rates, asked, failures } = await createHub({ env: {} }).rates(parcel);
    expect(asked).toEqual(expect.arrayContaining(["dhl", "fedex", "ups", "canada-post"]));
    expect(asked).not.toContain("maersk"); // below the ocean minimum
    expect(asked).not.toContain("purolator"); // Canada and US only
    expect(failures).toEqual([]);
    expect(rates.map((r) => r.amount)).toEqual([...rates.map((r) => r.amount)].sort((a, b) => a - b));
    expect(rates.every((r) => r.source === "sandbox" && r.currency === "USD")).toBe(true);
  });

  it("filters by mode and is stable between calls", async () => {
    const hub = createHub({ env: {} });
    const a = await hub.rates(container);
    const b = await hub.rates(container);
    expect(a.asked).toEqual(expect.arrayContaining(["maersk", "hapag-lloyd", "cma-cgm", "freightos"]));
    expect(a.asked).not.toContain("dhl");
    expect(a.rates.map((r) => r.amount)).toEqual(b.rates.map((r) => r.amount));
    expect(a.rates.find((r) => r.providerId === "maersk")?.quoteRef).toMatch(/^MAEU-Q\d{7}$/);
  });

  it("reports slow and failing providers without blocking the others", async () => {
    const mk = (id: string, getRates: ProviderConnector["getRates"]): ProviderDefinition => {
      const manifest: ProviderManifest = { id, name: id, category: "platform", modes: ["air"], regions: ["*"], capabilities: ["rates"], phase: 3, access: "self_serve", credentials: [] };
      return { manifest, connect: () => ({ manifest, sourceFor: () => "sandbox", getRates }) };
    };
    const hub = createHub({
      env: {},
      timeoutMs: 50,
      providers: [PROVIDERS.find((p) => p.manifest.id === "dhl")!, mk("down", async () => { throw new Error("HTTP 503"); }), mk("slow", () => new Promise(() => {}))],
    });
    const { rates, failures } = await hub.rates(parcel);
    expect(rates.length).toBeGreaterThan(0);
    expect(failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerId: "down", code: "provider_error" }),
      expect.objectContaining({ providerId: "slow", code: "timeout" }),
    ]));
  });
});

describe("operations", () => {
  const hub = createHub({ env: {} });

  it("books, tracks, documents, cancels and schedules pickups through one interface", async () => {
    const booking = await hub.book("fedex", { ...parcel, service: "express", reference: "KLG-1001" });
    expect(booking).toMatchObject({ providerId: "fedex", status: "confirmed", source: "sandbox" });
    expect((await hub.track("fedex", booking.trackingRef))[0].status).toBe("booked");
    const doc = await hub.document("fedex", booking.bookingRef, "label");
    expect(doc.content.subarray(0, 5).toString()).toBe("%PDF-");
    expect((await hub.cancel("fedex", booking.bookingRef)).cancelled).toBe(true);
    expect((await hub.pickup("fedex", { bookingRef: booking.bookingRef, address: { country: "CA" }, date: "2026-11-12" })).pickupRef).toMatch(/^FDX-P/);
  });

  it("returns clear errors for unknown providers and unsupported operations", async () => {
    await expect(hub.track("nope", "X")).rejects.toMatchObject({ status: 404, code: "provider_not_found" });
    await expect(hub.book("zim", { ...container, service: "economy", reference: "R1" })).rejects.toMatchObject({ status: 422, code: "capability_not_supported" });
  });

  it("publishes webhook events to the event bus", async () => {
    const seen: unknown[] = [];
    const off = bus.subscribe("tracking.event", (e) => seen.push(e.payload));
    const events = await hub.webhook("fedex", { headers: {}, body: { events: [{ ref: "FDX-T1", status: "delivered", location: "Lagos" }, { ref: "x", status: "teleported" }] } });
    off();
    expect(events).toHaveLength(1);
    expect(seen).toEqual([expect.objectContaining({ ref: "FDX-T1", status: "delivered" })]);
  });
});

describe("live DCSA tracking", () => {
  const dcsaEvents = [
    { eventType: "EQUIPMENT", eventClassifierCode: "ACT", equipmentEventTypeCode: "LOAD", eventDateTime: "2026-11-02T10:00:00Z", equipmentReference: "MSKU1234567", eventLocation: { locationName: "Montreal" } },
    { eventType: "EQUIPMENT", eventClassifierCode: "ACT", equipmentEventTypeCode: "GTIN", eventDateTime: "2026-11-01T08:00:00Z", equipmentReference: "MSKU1234567", eventLocation: { locationName: "Montreal" } },
    { eventType: "TRANSPORT", eventClassifierCode: "PLN", transportEventTypeCode: "ARRI", eventDateTime: "2026-11-30T08:00:00Z" },
  ];

  it("calls the carrier's DCSA endpoint with its key and maps the events", async () => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const fakeFetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, headers: init?.headers as Record<string, string> });
      return new Response(JSON.stringify(dcsaEvents), { status: 200 });
    }) as typeof fetch;
    const hub = createHub({ env: { HUB_MAERSK_CONSUMER_KEY: "k-123", HUB_MAERSK_TRACKING_URL: "https://carrier.test/track/v2/" }, fetch: fakeFetch });
    const maersk = hub.providers().find((p) => p.id === "maersk")!;
    expect(maersk.sources).toMatchObject({ tracking: "live", rates: "sandbox" });

    const events = await hub.track("maersk", "MSKU1234567");
    expect(calls[0].url).toBe("https://carrier.test/track/v2/events?equipmentReference=MSKU1234567");
    expect(calls[0].headers["Consumer-Key"]).toBe("k-123");
    expect(events.map((e) => [e.status, e.description, e.providerCode])).toEqual([
      ["picked_up", "Gated in at terminal", "EQUIPMENT:GTIN"],
      ["in_transit", "Loaded on vessel", "EQUIPMENT:LOAD"],
    ]); // planned arrival skipped, oldest first
  });

  it("gets and reuses an OAuth token for carriers that need one", async () => {
    let tokenCalls = 0;
    const fakeFetch = (async (url: string, init?: RequestInit) => {
      if (url === "https://auth.zim.test/token") {
        tokenCalls++;
        return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
      }
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
      return new Response(JSON.stringify({ events: dcsaEvents }), { status: 200 });
    }) as typeof fetch;
    const hub = createHub({ env: { HUB_ZIM_CLIENT_ID: "id", HUB_ZIM_CLIENT_SECRET: "s", HUB_ZIM_TOKEN_URL: "https://auth.zim.test/token", HUB_ZIM_TRACKING_URL: "https://zim.test" }, fetch: fakeFetch });
    await hub.track("zim", "ZIMB0001");
    await hub.track("zim", "ZIMB0002");
    expect(tokenCalls).toBe(1);
  });

  it("turns a carrier error into a provider error", async () => {
    const hub = createHub({ env: { HUB_MAERSK_CONSUMER_KEY: "k", HUB_MAERSK_TRACKING_URL: "https://x.test" }, fetch: (async () => new Response("", { status: 500 })) as typeof fetch });
    await expect(hub.track("maersk", "MSKU1234567")).rejects.toMatchObject({ status: 502, code: "provider_error" });
  });
});

describe("HTTP routes", () => {
  const app = express().use("/v1/hub", createHubRouter(createHub({ env: {} })));

  it("lists providers and filters by capability", async () => {
    expect((await request(app).get("/v1/hub/providers")).body.providers).toHaveLength(15);
    const tracking = (await request(app).get("/v1/hub/providers?capability=pickup")).body.providers.map((p: { id: string }) => p.id);
    expect(tracking).toEqual(expect.arrayContaining(["dhl", "fedex", "ups", "canada-post", "purolator"]));
    expect(tracking).not.toContain("maersk");
  });

  it("validates and answers rate requests", async () => {
    expect((await request(app).post("/v1/hub/rates").send({ origin: { country: "CA" } })).status).toBe(400);
    const ok = await request(app).post("/v1/hub/rates").send({ ...parcel, origin: { country: "ca", city: "Montreal" } });
    expect(ok.status).toBe(200);
    expect(ok.body.rates.length).toBeGreaterThan(3);
  });

  it("serves documents and accepts webhooks", async () => {
    const doc = await request(app).get("/v1/hub/documents/dhl/DHL-B1/label");
    expect(doc.headers["content-type"]).toBe("application/pdf");
    expect(doc.headers["x-data-source"]).toBe("sandbox");
    const hook = await request(app).post("/v1/hub/webhooks/fedex").send({ ref: "FDX-T9", status: "in_transit" });
    expect(hook.status).toBe(202);
    expect(hook.body.accepted).toBe(1);
    expect((await request(app).post("/v1/hub/webhooks/dhl").send({})).status).toBe(422);
  });
});
