"""KILOGY AI Engine — internal service called by the API gateway (not exposed publicly)."""
from __future__ import annotations

from typing import Literal

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import decision, predictor, pricing
from .recommender import CarrierBandit
from .routing import optimize_routes

app = FastAPI(title="KILOGY AI Engine", version="0.1.0")
bandit = CarrierBandit(seed=42)

# Allow the local web dashboard (apps/web) to call the engine during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class Location(BaseModel):
    country: str = Field(min_length=2, max_length=2)
    city: str | None = None
    postalCode: str | None = None


class Dimensions(BaseModel):
    l: float = Field(gt=0)
    w: float = Field(gt=0)
    h: float = Field(gt=0)


class Package(BaseModel):
    weight_kg: float = Field(gt=0, le=30000)
    dimensions: Dimensions | None = None


class Preferences(BaseModel):
    cost: float | None = None
    speed: float | None = None
    carbon: float | None = None
    reliability: float | None = None


class RouteRequest(BaseModel):
    origin: Location
    destination: Location
    package: Package
    preferences: Preferences | None = None
    max_results: int = Field(default=5, ge=1, le=10)


class CarrierOption(BaseModel):
    carrier_id: str
    price_usd: float
    transit_days: float
    sla_days: float | None = None


class RecommendRequest(BaseModel):
    origin: Location
    destination: Location
    carriers: list[CarrierOption]
    preferences: dict[str, float] | None = None


class FeedbackRequest(BaseModel):
    carrier_id: str
    origin_country: str
    destination_country: str
    success: bool


class PredictRequest(BaseModel):
    route: dict
    origin_country: str
    destination_country: str
    ship_date: str | None = None


class PriceRequest(BaseModel):
    carrier_cost_usd: float = Field(gt=0)
    market_price_usd: float | None = None
    service: Literal["express", "standard", "economy"] = "standard"


class CarrierRate(BaseModel):
    carrier_id: str
    carrier_name: str | None = None
    service: str
    service_name: str | None = None
    cost_usd: float
    transit_days: float
    mode: str = "air"
    via: str | None = None  # hub code the carrier routes through


class DecideRequest(BaseModel):
    origin: Location
    destination: Location
    package: Package
    service_type: list[str] | None = None
    ai_optimize: bool = True
    preferences: Preferences | None = None
    ship_date: str | None = None
    carrier_rates: list[CarrierRate]


def _prefs(p: Preferences | None) -> dict:
    return {k: v for k, v in (p.model_dump() if p else {}).items() if v is not None}


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-engine"}


@app.post("/v1/route-optimize")
def route_optimize(req: RouteRequest):
    try:
        return optimize_routes(
            req.origin.model_dump(), req.destination.model_dump(), req.package.weight_kg,
            req.package.dimensions.model_dump() if req.package.dimensions else None,
            _prefs(req.preferences), req.max_results,
        )
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.post("/v1/carrier-recommend")
def carrier_recommend(req: RecommendRequest):
    ranked = bandit.recommend([c.model_dump() for c in req.carriers], req.origin.country, req.destination.country, req.preferences)
    return {"recommendations": ranked, "algorithm": "thompson-sampling"}


@app.post("/v1/carrier-feedback")
def carrier_feedback(req: FeedbackRequest):
    return bandit.record_outcome(req.carrier_id, req.origin_country, req.destination_country, req.success)


@app.post("/v1/predict-incident")
def predict_incident(req: PredictRequest):
    return predictor.predict(req.route, req.origin_country, req.destination_country, req.ship_date)


@app.post("/v1/price")
def price(req: PriceRequest):
    return pricing.optimize_price(req.carrier_cost_usd, req.market_price_usd, req.service)


@app.post("/v1/decide")
def decide(req: DecideRequest):
    payload = req.model_dump()
    payload["preferences"] = _prefs(req.preferences)
    try:
        return decision.decide(payload, bandit)
    except ValueError as e:
        raise HTTPException(422, str(e))
