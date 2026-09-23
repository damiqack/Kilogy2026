# Kilogy2026

A prototype of **KILOGY**, an AI-powered logistics operating system. Built by the Cal Poly
Humboldt software/AI team (Team 2) for CS 453, Fall 2026, working alongside the Fanshawe College
operations team (Team 1).

**Goal:** a working AI routing engine that ranks shipping options by cost, speed, reliability and
**carbon emissions**, behind the API-first architecture Kilogy specified.

📄 **Architecture spec:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Team

| Member | Role |
|---|---|
| Damian | TBD |
| Landon Sacrey | TBD |
| Joseph Verdin | TBD |
| Alex Coney | TBD |

## Status

| Area | Component | Status |
|---|---|---|
| AI Engine (Layer 4) | Routing Engine: Dijkstra + ML scoring, CO₂ per route | ✅ Working, tested |
| | Carrier Recommender: Thompson-sampling bandit | ✅ Working, tested |
| | Incident Predictor: risk score + ETA (LSTM placeholder) | ✅ Working, tested |
| | Pricing Engine: margin optimization (XGBoost placeholder) | ✅ Working, tested |
| | Decision Engine: aggregates and ranks options | ✅ Working, tested |
| | Load Matcher, Demand Forecaster | ⬜ Not started |
| API Gateway (Layer 2) | Auth (API keys + JWT), tiered rate limiting | 🚧 In progress |
| Microservices (Layer 3) | Shipments, quotes, carriers, documents, payments, tracking | 🚧 In progress |
| Carrier Gateway | `ICarrierAdapter` + mock DHL / FedEx / UPS / Canada Post | 🚧 Interface done |
| Clients (Layer 1) | `@kilogy/sdk`, UI/UX dashboard | ⬜ Not started |
| Data (Layer 5) | Postgres, Mongo, Redis, Kafka | ⬜ In-memory stand-ins for now |
| DevOps | Docker Compose ✅ · GitHub Actions, Terraform, EKS ⬜ | |

## Repo layout

```
Kilogy2026/
├── docs/ARCHITECTURE.md    Kilogy's technical architecture v1.0
├── services/
│   ├── ai-engine/          Python + FastAPI AI engine (port 4200)
│   │   ├── app/
│   │   │   ├── network.py      hub & lane graph, emission factors
│   │   │   ├── routing.py      Dijkstra over multiple objective profiles
│   │   │   ├── scoring.py      reliability model + preference-weighted AI score
│   │   │   ├── recommender.py  carrier bandit
│   │   │   ├── predictor.py    incident / delay risk
│   │   │   ├── pricing.py      margin optimization
│   │   │   ├── decision.py     decision engine (flow steps 5–8)
│   │   │   └── main.py         HTTP API
│   │   └── tests/
│   └── api/                Node + TypeScript API gateway & services (port 4100), in progress
└── docker-compose.yml
```

## Run the AI engine

Requires Python 3.11+.

```bash
cd services/ai-engine
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest                                  # 9 tests
uvicorn app.main:app --port 4200        # interactive docs at http://localhost:4200/docs
```

Example: optimize Montreal → Lagos for a 10 kg parcel:

```bash
curl -X POST http://localhost:4200/v1/route-optimize -H 'Content-Type: application/json' -d '{
  "origin": { "country": "CA", "city": "Montreal" },
  "destination": { "country": "NG", "city": "Lagos" },
  "package": { "weight_kg": 10, "dimensions": { "l": 30, "w": 20, "h": 15 } },
  "preferences": { "cost": 0.3, "speed": 0.3, "carbon": 0.3, "reliability": 0.1 }
}'
```

The response lists ranked routes (for example air via JFK vs ocean via Halifax → Tema), each with
legs, cost, transit days, CO₂ kg, reliability and an overall `ai_score`. Raise the `carbon`
preference to push the lower-emission routes up the ranking.

## Prototype vs production

| Architecture component | Prototype | Production target |
|---|---|---|
| Kong / AWS API Gateway | Express middleware | Kong / AWS API Gateway |
| Keycloak auth | bcrypt-hashed API keys + 15-min JWT | Keycloak, OAuth 2.0 |
| Kafka | In-process event bus | Apache Kafka |
| Postgres / Mongo / Redis | In-memory stores + TTL cache | Managed services |
| GraphHopper | Seed hub/lane network | GraphHopper + carrier lane DB |
| LSTM / XGBoost models | Interpretable placeholder models | Trained on Team 1 shipment data via MLflow |

Every placeholder sits behind the same function signature as the real component, so it can be
replaced without changing the API.

## Contributing

1. Clone the repo and create a branch: `git checkout -b feature/<name>`
2. Keep tests passing (`pytest` in `services/ai-engine`)
3. Open a pull request into `main`, and have one teammate review it

Keep secrets out of the repo. Copy `.env.example` to `.env` locally; `.env` is git-ignored.
