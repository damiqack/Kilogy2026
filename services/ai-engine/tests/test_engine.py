import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.pricing import optimize_price
from app.recommender import CarrierBandit
from app.routing import optimize_routes
from app.scoring import RELIABILITY_COEF, sigmoid, train_reliability

client = TestClient(app)
MTL = {"country": "CA", "city": "Montreal", "postalCode": "H3A1A1"}
LAGOS = {"country": "NG", "city": "Lagos"}


def test_routes_montreal_to_lagos_are_ranked_and_diverse():
    r = optimize_routes(MTL, LAGOS, 10, {"l": 30, "w": 20, "h": 15})
    routes = r["routes"]
    assert len(routes) >= 2
    assert routes == sorted(routes, key=lambda x: x["ai_score"], reverse=True)
    modes = {x["primary_mode"] for x in routes}
    assert "air" in modes and "ocean" in modes
    # Ocean should be far lower carbon but slower than air.
    air = next(x for x in routes if x["primary_mode"] == "air")
    ocean = next(x for x in routes if x["primary_mode"] == "ocean")
    assert ocean["co2_kg"] < air["co2_kg"] / 5
    assert ocean["transit_days"] > air["transit_days"]


def test_carbon_preference_promotes_greener_route():
    green = optimize_routes(MTL, LAGOS, 200, preferences={"cost": 0, "speed": 0, "carbon": 1, "reliability": 0})
    fast = optimize_routes(MTL, LAGOS, 200, preferences={"cost": 0, "speed": 1, "carbon": 0, "reliability": 0})
    assert green["routes"][0]["co2_kg"] <= fast["routes"][0]["co2_kg"]
    assert fast["routes"][0]["transit_days"] <= green["routes"][0]["transit_days"]


def test_volumetric_weight_used_when_larger():
    r = optimize_routes(MTL, LAGOS, 1, {"l": 100, "w": 100, "h": 100})
    assert r["chargeable_weight_kg"] == 200


def test_domestic_route_has_ground_option():
    r = optimize_routes(MTL, {"country": "CA", "city": "Toronto"}, 50)
    assert any(x["primary_mode"] in ("road", "rail") for x in r["routes"])


def test_pricing_margin_within_guardrails():
    p = optimize_price(100.0, 125.0, "standard")
    assert 5.0 <= p["margin_pct"] <= 40.0
    assert p["price_usd"] > 100.0


def test_bandit_learns_from_feedback():
    b = CarrierBandit(seed=1)
    before = b._arm("ups", "NA-AF").mean
    for _ in range(30):
        b.record_outcome("ups", "CA", "NG", True)
    assert b._arm("ups", "NA-AF").mean > before


def test_train_reliability_recovers_signal():
    rng = np.random.default_rng(0)
    X = np.column_stack([np.ones(2000), rng.normal(size=(2000, 5))])
    y = (rng.random(2000) < sigmoid(X @ RELIABILITY_COEF)).astype(float)
    w = train_reliability(X, y)
    assert np.sign(w[1]) == np.sign(RELIABILITY_COEF[1])


def test_api_decide_ranks_options():
    body = {
        "origin": MTL, "destination": LAGOS,
        "package": {"weight_kg": 10, "dimensions": {"l": 30, "w": 20, "h": 15}},
        "service_type": ["express", "standard"], "ai_optimize": True,
        "carrier_rates": [
            {"carrier_id": "dhl", "service": "express", "cost_usd": 180, "transit_days": 3, "mode": "air"},
            {"carrier_id": "fedex", "service": "express", "cost_usd": 170, "transit_days": 4, "mode": "air"},
            {"carrier_id": "ups", "service": "standard", "cost_usd": 95, "transit_days": 21, "mode": "ocean"},
            {"carrier_id": "ups", "service": "economy", "cost_usd": 60, "transit_days": 30, "mode": "ocean"},
        ],
    }
    res = client.post("/v1/decide", json=body)
    assert res.status_code == 200
    opts = res.json()["options"]
    assert len(opts) == 3  # economy filtered out by service_type
    assert opts[0]["rank"] == 1 and "recommended" in opts[0]["tags"]
    assert all(o["price_usd"] > o["pricing"]["carrier_cost_usd"] for o in opts)


def test_api_rejects_unknown_location():
    res = client.post("/v1/route-optimize", json={"origin": {"country": "ZZ"}, "destination": LAGOS, "package": {"weight_kg": 1}})
    assert res.status_code == 422


def test_decide_routes_carrier_through_its_hub():
    body = {
        "origin": MTL, "destination": LAGOS, "package": {"weight_kg": 10},
        "carrier_rates": [
            {"carrier_id": "ethiopian", "service": "standard", "service_name": "Air Freight", "cost_usd": 120, "transit_days": 5, "mode": "air", "via": "ADD"},
            {"carrier_id": "dhl", "service": "express", "cost_usd": 180, "transit_days": 3, "mode": "air"},
        ],
    }
    opts = client.post("/v1/decide", json=body).json()["options"]
    eth = next(o for o in opts if o["carrier_id"] == "ethiopian")
    assert eth["service_name"] == "Air Freight"
    assert any(l["to"] == "ADD" for l in eth["route"]["legs"])


def test_dakar_is_routable():
    r = optimize_routes({"country": "CA", "city": "Ottawa"}, {"country": "SN", "city": "Dakar"}, 5)
    assert r["routes"]
