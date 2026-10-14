# @kilogy/api

Node + TypeScript API gateway (port 4100). It sits between the web app and the Python AI engine:
it collects carrier rates, asks the AI engine to rank them, and stores the result.

## Run

Requires Node 20+. Start the AI engine first (`services/ai-engine`, port 4200).

```bash
npm install
npm run dev      # http://localhost:4100
npm test         # unit tests (use a fake AI engine, so Python isn't needed)
```

Set `AI_ENGINE_URL` or `API_PORT` in the repo's `.env` to change the defaults.

## Endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/health` | Liveness check |
| POST | `/v1/quotes` | Get rates from every carrier, rank them with the AI engine, save and return the quote |
| GET | `/v1/quotes/:id` | Fetch a saved quote (status becomes `expired` after 24 h) |
| GET | `/v1/quotes` | List quotes, newest first |

Example:

```bash
curl -X POST localhost:4100/v1/quotes -H 'Content-Type: application/json' -d '{
  "origin": { "country": "CA", "city": "Montreal" },
  "destination": { "country": "NG", "city": "Lagos" },
  "package": { "weight_kg": 10 },
  "service_type": ["express", "standard"],
  "preferences": { "cost": 0.4, "speed": 0.3, "carbon": 0.2, "reliability": 0.1 }
}'
```

Errors always look like `{ "error": { "code", "message", "details?" } }`:
`validation_error` (400), `not_found` (404), `no_rates` (422), `ai_engine_error` (502),
`ai_engine_unavailable` (503).

## Layout

```
src/
├── server.ts            Starts the HTTP server
├── app.ts               Express app, middleware, error handler (createApp is used by tests)
├── config.ts            Ports, URLs, secrets from .env
├── routes/quotes.ts     /v1/quotes endpoints + request validation (zod)
├── services/aiEngine.ts Client for the AI engine's POST /v1/decide
├── carriers/
│   ├── types.ts         ICarrierAdapter: the interface every carrier implements
│   ├── mock.ts          Mock DHL, FedEx, UPS, Ethiopian, Canada Post adapters
│   └── index.ts         Carrier registry; swap a mock for a real adapter here
└── lib/                 Errors, IDs, in-memory store (stands in for Postgres)
tests/                   vitest + supertest
```

## Not done yet

- Auth: every request uses a dev account (`acct_dev`) until API keys + JWT land.
- Storage is in memory and resets on restart until the Postgres schema is in.
- Shipments, tracking, documents and payments endpoints.
