# @kilogy/web — dashboard prototype

The Layer 1 client (web app) for KILOGY: a clickable UI prototype for the team and Kilogy to
review.

```bash
cd apps/web
npm install
npm run dev          # http://localhost:5173
```

It runs standalone with sample data. To get **live AI results**, also start the AI engine in a
second terminal:

```bash
cd services/ai-engine
source .venv/bin/activate
uvicorn app.main:app --port 4200
```

The sidebar footer shows `AI engine: live` once it connects. Quotes then come from the real
Decision Engine (`POST /v1/decide`) instead of the built-in mock.

## Screens

| Route | Screen | Architecture piece |
|---|---|---|
| `/` | Dashboard: KPIs, CO₂ saved, AI insights | Analytics Service |
| `/quotes/new` | Quote form + AI-ranked carrier options, **Book** | Pricing, Routing, Decision Engine |
| `/shipments` | Shipment list with status filters | Shipment Service |
| `/shipments/:id` | Route legs, tracking timeline, AI risk prediction, docs | Tracking, Incident Predictor |
| `/carriers` | Integrated carriers | Carrier Gateway (`ICarrierAdapter`) |
| `/analytics` | Volume, carrier mix, lane performance | Analytics Service |
| `/documents` | Labels, customs, invoices | Document Service |
| `/payments` | Charges and status | Payment Service |
| `/developers` | API keys, rate-limit tiers, SDK, endpoint reference | Developer portal |
| `/system` | The 5 layers with build status, model registry, decision flow | Whole architecture |

## Code map

```
src/
├── data/
│   ├── types.ts      shapes that mirror the /api/v1 contract
│   ├── carriers.ts   carrier list + mock Carrier Gateway rates
│   ├── ai.ts         calls the AI engine, falls back to a local mock
│   ├── store.tsx     client-side stand-in for the Shipment, Document and Payment services
│   └── seed.ts       sample shipments (fictional)
├── components/       layout, badges, score bars, route legs
├── pages/            one file per screen
└── styles.css        design tokens (light + dark) and components
```

Bookings you make are saved in the browser's localStorage. Clear site data to reset to the
sample data.

When `services/api` is ready, replace the functions in `data/ai.ts` and `data/store.tsx` with
calls to `/api/v1/...`. The pages won't need to change.
