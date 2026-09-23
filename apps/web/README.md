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

Navigation follows the UI/UX spec's information architecture. Styling follows the KILOGY design
system; see [`docs/DESIGN_SYSTEM.md`](../../docs/DESIGN_SYSTEM.md).

| Route | Screen | Spec |
|---|---|---|
| `/` | Overview Dashboard: KPIs, AI Alert, recent shipments, AI insights | 3.1 |
| `/shipments/new` | New Shipment: 4 steps (addresses → package + inline AI suggestion → AI quote comparison → review & book) | 3.2, 3.3 |
| `/shipments/:id` | Shipment Tracking: AI predicted ETA, risk score, timeline | 3.4 |
| `/shipments` | Shipment history with filters | 4 |
| `/quotes`, `/quotes/:id` | Past quote requests and their comparison tables | 4 |
| `/carriers` | Carrier list and API status | 4 |
| `/analytics` | Spend, CO₂ and lane performance | 4 |
| `/documents` | Document generator and archive | 4 |
| `/payments` | Payment ledger | 4 |
| `/settings` | Organization and notifications | 3.1 nav |
| `/developers` | Dev / API: key manager, webhooks, API explorer, architecture status | 4 |

## Code map

```
src/
├── data/
│   ├── types.ts      shapes that mirror the /api/v1 contract
│   ├── carriers.ts   carrier list + mock Carrier Gateway rates
│   ├── ai.ts         calls the AI engine, falls back to a local mock
│   ├── store.tsx     client-side stand-in for the Shipment, Document and Payment services
│   └── seed.ts       sample shipments (fictional)
├── components/       layout (sidebar / rail / bottom tabs), QuoteTable, badges, score bars
├── design/tokens.json  design tokens (Figma Tokens format)
├── lib/money.ts      USD → CAD display
├── pages/            one file per screen
└── styles.css        design tokens (light + dark) and components
```

Bookings you make are saved in the browser's localStorage. Clear site data to reset to the
sample data.

When `services/api` is ready, replace the functions in `data/ai.ts` and `data/store.tsx` with
calls to `/api/v1/...`. The pages won't need to change.
