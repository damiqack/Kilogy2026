# KILOGY API Integration Hub — Feasibility Assessment and Roadmap

November 2026. Shared version for Kilogy: [Claude Doc](https://claude.ai/artifact/4xURfi2fe9CHata7fxXaUY).

## Summary

The KILOGY API Integration Hub is technically feasible. All 15 target providers can be reached by API, but only about half can be turned on self-serve today; the rest need a customer account, a signed agreement or a partner review. That paperwork, not engineering, sets the pace of the roadmap.

- **Ready to build now (developer key or shipping account):** Maersk, ZIM, Hapag-Lloyd, CMA CGM, DHL, FedEx, UPS, Canada Post, Purolator. Booking and labels still need a KILOGY shipping account with each.
- **Needs an agreement first:** MSC (onboarding form, possible setup fees), ONE (registration and approval), project44 and FourKites (paid licences), Freightos booking (partner only).
- **Not confirmed:** Ship4WD (a ZIM subsidiary) publishes no developer API. Get written confirmation before committing.
- **Standards help:** all six ocean carriers have adopted DCSA Track & Trace, so one connector serves tracking for all of them.

## Provider assessment

| Provider | Category | What the API covers | Access | Sandbox | Cost to use the API | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| Maersk | Ocean | Offers (rates), bookings, schedules, tracking, bill of lading, VGM | Self-serve key at developer.maersk.com; booking needs a customer account | Yes | Portal free; spot quotes usage-based | 1 |
| ZIM | Ocean | Schedules, tracking, DCSA APIs | Apply at api.zim.com; reviewed; OAuth 2.0 | Yes | Public APIs free | 1 |
| Hapag-Lloyd | Ocean | Offers, contract specs, schedules, tracking, live position | API portal sign-up | Not stated | Not stated | 1 |
| MSC | Ocean | Tracking, schedules, booking, shipping instructions, VGM, B/L data, invoices | Direct Integration request form, then onboarding | In development | Setup and maintenance fees may apply | 2 |
| CMA CGM | Ocean | Tracking, schedules, quotation, booking request, invoices | Sign-up at api-portal.cma-cgm.com; private tracking needs verified booking party | Not stated | Not stated | 2 |
| ONE | Ocean | Tracking (DCSA), schedules, booking | Registration and approval | Not stated | Not stated | 2 |
| DHL Express | Air and express | Rates, shipments and labels, pickups, tracking, proof of delivery | Portal app; test access via DHL Express support; account number | Yes, then technical acceptance | Not stated; tracking key starts at 250 calls/day | 1 |
| FedEx | Air and express | Rate, ship, track, pickup, address validation, customs documents | Portal project; account number; label certification for Ship | Yes | Not stated; 10 requests/s | 1 |
| UPS | Air and express | Rating, shipping, tracking, address validation, time in transit, pickup, void | Portal app; shipper number; OAuth 2.0 | Yes (CIE) | Not stated | 2 |
| Canada Post | Canadian | Rating, contract and non-contract shipping, tracking, pickup, returns | Free registration; contract shipping needs a parcel agreement | Yes | Rating free; labels charge postage | 1 |
| Purolator | Canadian | Estimates, shipping, tracking, pickups, returns | Development key, then production key requested by the account holder | Yes | Not stated | 2 |
| Ship4WD | Forwarding | No public API found | Ask Ship4WD for written confirmation | No | Unknown | 2 (if confirmed) |
| project44 | Multi-carrier | Multi-modal tracking, LTL and multi-modal rating and booking, webhooks | Customer tenant and OAuth client; public docs | Yes | Licence | 3 |
| Freightos | Multi-carrier | Rate estimates, calculator, CO2; booking and tracking via WebCargo | Calculator open; booking partner only | Not stated | Calculator free; booking enterprise | 3 |
| FourKites | Multi-carrier | Shipment tracking, ETAs, webhooks | Customer licence; docs gated | Not stated | Licence | 3 |

## Architecture

```
KILOGY dashboards (quotes, bookings, tracking, documents, reports, AI routing engine)
        │ one request
KILOGY API Hub — unchanged when a partner is added
   Unified API · Provider registry · Normalizer · Webhook receiver
        │ fans out in parallel, with a time limit per provider
Connectors — one file per provider (services/api/src/hub/providers)
   Ocean (shared DCSA tracking) · Air and express · Canadian · Freight networks
        │ each provider's own format
Provider APIs
```

Code: `services/api/src/hub`.

- `types.ts` — the connector contract (`ProviderConnector`), the provider manifest and the normalized shapes (`HubRate`, `HubBooking`, `HubTrackingEvent`, `HubSchedule`, `HubDocument`).
- `registry.ts` — registers connectors and checks each one implements every capability its manifest declares.
- `hub.ts` — `IntegrationHub`: routes by capability, mode, countries and weight, calls providers in parallel with a timeout, reports failures without blocking other results, and publishes to the event bus.
- `define.ts` — `defineProvider()`: a working sandbox for every declared capability, replaced by live calls once the provider's credentials are set.
- `dcsa.ts`, `normalize.ts` — shared live DCSA Track & Trace client (API key header or OAuth 2.0) and event mapping.
- `router.ts` — HTTP routes under `/v1/hub`: `GET /providers`, `POST /rates`, `POST /bookings`, `POST /bookings/:provider/:ref/cancel`, `GET /tracking/:provider/:ref`, `GET /schedules/:provider`, `GET /documents/:provider/:ref/:type`, `POST /pickups`, `POST /webhooks/:provider`.
- `providers/` — the 15 connectors. Run on its own with `npm run hub` (port 4110); tests in `services/api/test/hub.test.ts`.

### Adding a partner

1. Create `providers/<id>.ts` with `defineProvider()`: manifest plus the provider's request and response mapping.
2. Add it to `providers/index.ts` (and to `apps/web/src/config/integrations.ts` for the admin page); set its credentials in `.env`.
3. Run the contract tests against the provider's sandbox, then switch it to live.

## Roadmap

| Stage | Providers | Starts when | Delivers |
| --- | --- | --- | --- |
| Hub core | — | Built in the prototype | Connector contract, registry, normalizer, webhooks, admin page; all providers in sandbox |
| Phase 1 — Foundation | Maersk, ZIM, Hapag-Lloyd, DHL, FedEx, Canada Post | Business model chosen; sandbox accounts open | Live quotes, booking, labels and tracking |
| Phase 2 — Network expansion | MSC, CMA CGM, ONE, UPS, Purolator, Ship4WD | Phase 1 passes contract tests; MSC, ONE and Ship4WD agreements signed | More ocean, Canadian and forwarding options |
| Phase 3 — Intelligence | project44, Freightos, FourKites (EasyPost or Shippo optional) | Platform licences budgeted and signed | Unified visibility and predictive ETAs |

## Risks and decisions

| Risk | Mitigation |
| --- | --- |
| Booking and labels need a shipping account per carrier | Launch quotes and tracking first; book as accounts open |
| MSC, ONE and Ship4WD access is by agreement | Request onboarding now, in parallel with Phase 1 |
| Platform licences are paid | Use them only for gaps direct connectors cannot cover |
| Provider APIs change versions | Contract tests per connector |
| Some webhooks are unsigned (FourKites) | HTTPS, secret credentials, IP allow-lists, duplicate checks |
| Rate limits (DHL tracking starts at 250 calls/day) | Prefer webhooks; cache and batch polling |

Decisions for Kilogy: operating model (technology platform, marketplace or hybrid); which carrier accounts KILOGY holds or will open; written confirmation from Ship4WD; approval to request MSC and ONE onboarding now; a budget ceiling for Phase 3 licences.

## Sources

Maersk API catalogue ([apis.io](https://apis.io/providers/maersk-line/)) · [MSC Direct Integrations](https://prelive.msccargo.cn/en/solutions/digital-solutions/direct-integrations) · [ZIM API](https://www.zim.com/tools/zim-api) · [CMA CGM API catalogue](https://apis.io/providers/cma-cgm/) · [Hapag-Lloyd APIs](https://www.hapag-lloyd.com/content/dam/website/downloads/pdf/API.pdf) · [DCSA adoption](https://splash247.com/?p=139733) · [Carrier API access comparison](https://blog.shipmnts.com/ocean-carrier-track-and-trace-apis-integration-guide) · [MyDHL API](https://www.dhl.de/en/geschaeftskunden/express/business-loesungen/mydhlapi.html) · [DHL Shipment Tracking API](https://developer.dhl.com/api-reference/shipment-tracking) · [FedEx getting started](https://developer.fedex.com/api/en-bd/get-started.html) · [FedEx API guide](https://atoship.com/blog/fedex-shipping-api-developer-tools-guide) · [UPS API guide](https://atoship.com/blog/ups-shipping-api-integration-developer-guide) · [Canada Post APIs](https://www.canadapost-postescanada.ca/cpc/en/business/ecommerce/integrate-apis.page) · [Canada Post API catalogue](https://providers.apievangelist.com/providers/canada-post/) · [Purolator development process](https://eship.purolator.com/Site/content/developmentprocess.aspx) · [Ship4WD launch (ZIM)](https://investors.zim.com/news/news-details/2021/ZIM-Establishes-Ship4wd-a-New-Digital-Freight-Forwarding-Company/default.aspx) · [project44 API docs](https://developers.project44.com/api-reference/api-docs) · [Freightos API catalogue](https://apis.io/providers/freightos/) · [FourKites API report](https://supergood.ai/api-report-card/fourkites) · [FourKites webhooks](https://hookdeck.com/webhooks/platforms/guide-to-fourkites-webhooks-features-and-best-practices)
