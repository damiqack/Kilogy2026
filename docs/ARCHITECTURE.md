# KILOGY — Technical Architecture

Developer Documentation | API Stack & AI Engine — Version 1.0 | kilogy.co

> Source architecture document from Kilogy. The prototype in this repo implements it
> incrementally; see the status table in the main README.

## 1. System Overview

KILOGY is built as a cloud-native, API-first, microservices architecture. The platform is organized into five core layers:

| Layer | Name | Contents |
|---|---|---|
| 1 | Client Interface Layer | Web app, mobile app, developer portal, third-party integrations |
| 2 | API Gateway Layer | Rate limiting, authentication, routing, request validation |
| 3 | Microservices Layer | Shipment, pricing, routing, tracking, payments, notifications |
| 4 | AI Engine Layer | ML models, decision engine, predictive systems, NLP |
| 5 | Data Infrastructure Layer | Event streaming, data warehouse, caching, persistence |

## 2. API Gateway Architecture

### 2.1 Technology Stack

| Component | Technology |
|---|---|
| API Gateway | Kong API Gateway / AWS API Gateway — routing, rate limiting, auth |
| Authentication | OAuth 2.0 + JWT tokens; API Keys for developer access |
| Protocol | REST (primary) + GraphQL (analytics layer) + WebSocket (real-time tracking) |
| Rate Limiting | Tiered: Free (100 req/hr), Pro (10,000 req/hr), Enterprise (custom) |
| API Versioning | URL versioning: /api/v1/, /api/v2/ — backward compatibility guaranteed |
| Documentation | OpenAPI 3.0 spec; auto-generated via Swagger UI at docs.kilogy.co |

### 2.2 Core API Endpoints

```
// Shipment Management
POST   /api/v1/shipments              // Create new shipment
GET    /api/v1/shipments/:id          // Get shipment details
PUT    /api/v1/shipments/:id          // Update shipment
DELETE /api/v1/shipments/:id          // Cancel shipment
GET    /api/v1/shipments/:id/track    // Real-time tracking

// Pricing & Quotes
POST   /api/v1/quotes                 // Get multi-carrier quotes
GET    /api/v1/quotes/:id             // Retrieve quote
POST   /api/v1/quotes/:id/book        // Book selected quote

// AI Routing
POST   /api/v1/ai/route-optimize      // Optimize route
POST   /api/v1/ai/carrier-recommend   // AI carrier selection
GET    /api/v1/ai/predictions/:id     // Get incident predictions

// Carriers
GET    /api/v1/carriers               // List integrated carriers
GET    /api/v1/carriers/:id/rates     // Carrier-specific rates

// Documents
POST   /api/v1/documents/customs      // Generate customs docs
POST   /api/v1/documents/invoice      // Generate invoice
GET    /api/v1/documents/:id          // Download document

// Payments
POST   /api/v1/payments/charge        // Process payment
GET    /api/v1/payments/:id           // Payment status
```

### 2.3 Authentication Example

```bash
curl -X POST https://api.kilogy.co/v1/quotes \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "origin": { "country": "CA", "city": "Montreal", "postalCode": "H3A1A1" },
    "destination": { "country": "NG", "city": "Lagos" },
    "package": { "weight_kg": 10, "dimensions": { "l": 30, "w": 20, "h": 15 } },
    "service_type": ["express", "standard"],
    "ai_optimize": true
  }'
```

## 3. Microservices Architecture

Each service is independently deployable, containerized (Docker), orchestrated by Kubernetes, and communicates via an internal event bus (Apache Kafka).

| Service | Responsibility | Tech Stack |
|---|---|---|
| Shipment Service | Lifecycle management of shipments | Node.js, PostgreSQL |
| Pricing Service | Rate fetching and AI pricing | Python, Redis cache |
| Routing Service | Route optimization & selection | Python, GraphHopper |
| Tracking Service | Real-time carrier tracking | Node.js, WebSocket, MongoDB |
| Carrier Gateway | External carrier API adapters | Node.js, REST adapters |
| Payment Service | Billing, invoicing, settlements | Node.js, Stripe/Kimance |
| Notification Service | Email/SMS/webhook alerts | Node.js, Twilio, SendGrid |
| Document Service | Customs & invoice generation | Python, PDF generation |
| Auth Service | Identity, OAuth, API keys | Node.js, Keycloak |
| Analytics Service | KPI dashboards, reporting | Python, Apache Spark |

## 4. AI Engine Stack

KILOGY's AI layer is a collection of ML models and rule-based engines coordinated by a central Decision Engine. All models are trained on historical shipment data and retrained continuously via MLflow.

### 4.2 Model Registry

| AI Module | Algorithm | Input | Output |
|---|---|---|---|
| Pricing Engine | XGBoost regression | Route, weight, carrier, time | Optimal price + margin |
| Routing Engine | Dijkstra + ML scoring | Origin, dest, package, time | Ranked route options |
| Incident Predictor | LSTM time series | Historical delays, weather, customs | Risk score + ETA |
| Load Matcher | Collaborative filtering | Cargo specs, carrier capacity | Matched carrier list |
| Carrier Recommender | Multi-armed bandit | Route, SLA, cost preferences | Recommended carrier |
| Demand Forecaster | Prophet time series | Historical booking patterns | Volume forecast |

### 4.3 Decision Engine Flow

1. Client sends shipment request → API Gateway
2. Auth Service validates API key/JWT token
3. Shipment Service creates shipment record
4. Pricing Service fetches rates from all carriers (parallel async)
5. AI Pricing Engine applies margin optimization
6. AI Routing Engine scores routes by cost / speed / reliability
7. Incident Predictor runs risk analysis on top routes
8. Decision Engine aggregates scores → ranks options
9. Response returned to client with ranked recommendations
10. Client selects → Shipment Service books via Carrier Gateway
11. Tracking Service initializes real-time monitoring
12. Notification Service sends confirmation

## 5. External Carrier Integration Layer

Each carrier is wrapped in a standardized adapter implementing the `ICarrierAdapter` interface, which ensures consistent behavior regardless of underlying carrier API differences.

```ts
interface ICarrierAdapter {
  getRates(payload: RateRequest): Promise<RateResponse[]>;
  bookShipment(payload: BookingRequest): Promise<BookingResponse>;
  trackShipment(trackingId: string): Promise<TrackingEvent[]>;
  cancelShipment(shipmentId: string): Promise<CancelResponse>;
  generateLabel(shipmentId: string): Promise<Buffer>;
  estimateDelivery(origin: Location, dest: Location): Promise<DateRange>;
}

class DHLAdapter implements ICarrierAdapter {
  async getRates(payload) {
    return this.client.post('/rates', this.mapToDHLFormat(payload));
  }
  // ... (all methods implemented)
}
```

## 6. Data Infrastructure

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary relational DB — shipments, users, carriers, pricing records |
| MongoDB | Unstructured data — tracking events, document storage, logs |
| Redis | Caching — carrier rates (TTL 15min), session data, API rate limits |
| Apache Kafka | Event streaming — shipment events, carrier updates, payment events |
| Amazon S3 | File storage — shipping labels, customs documents, invoices |
| Elasticsearch | Full-text search — shipment history, carrier discovery |
| Apache Spark | Batch analytics — reporting, AI training data pipelines |
| ClickHouse | OLAP analytics — real-time dashboard queries at scale |

## 7. Cloud Infrastructure & DevOps

KILOGY is deployed on AWS (primary) with multi-cloud readiness:

- Container orchestration: Kubernetes (EKS) with Helm charts
- CI/CD: GitHub Actions → Docker build → ECR → EKS deployment
- Infrastructure as Code: Terraform for all AWS resource provisioning
- Service mesh: Istio for inter-service communication and observability
- Monitoring: Prometheus + Grafana dashboards; PagerDuty for alerting
- Logging: ELK stack (Elasticsearch, Logstash, Kibana)
- CDN: CloudFront for static assets and API caching

## 8. Security Architecture

- All API communications over TLS 1.3 — no plaintext endpoints
- JWT tokens with 15-min expiry + refresh token rotation
- API keys hashed with bcrypt before storage
- Row-level security in PostgreSQL for multi-tenant data isolation
- WAF (Web Application Firewall) via AWS Shield
- PCI-DSS compliance for payment data — no raw card data stored
- SOC 2 Type II certification roadmap — Q3 Year 2
- GDPR compliance for EU shippers; PIPEDA compliance for Canada

## 9. Developer Onboarding

```js
// npm install @kilogy/sdk
const { KilogyClient } = require('@kilogy/sdk');
const client = new KilogyClient({ apiKey: 'YOUR_API_KEY' });

const quotes = await client.quotes.create({
  origin: { country: 'CA', city: 'Montreal' },
  destination: { country: 'GH', city: 'Accra' },
  package: { weight_kg: 5, length: 20, width: 15, height: 10 }
});

console.log(quotes.data); // Ranked carrier options with AI scores
```

SDK available for: Node.js, Python, PHP, Java, Go — all open-source on GitHub.
