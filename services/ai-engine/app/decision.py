"""Decision Engine: steps 5-8 of the architecture's request flow.

Input: shipment details plus the raw carrier rates fetched in parallel by the Carrier Gateway.
  5. AI Pricing Engine applies margin optimization to each carrier rate
  6. Routing Engine scores routes by cost / speed / carbon / reliability
  7. Incident Predictor runs risk analysis on the matched routes
  8. Scores are aggregated and options ranked
"""
from __future__ import annotations

from . import predictor, pricing
from .recommender import CarrierBandit
from .routing import optimize_routes
from .scoring import normalize_preferences


def _match_route(routes: list[dict], mode: str, via: str | None = None) -> dict | None:
    if via:
        for r in routes:
            if any(l["from"] == via or l["to"] == via for l in r["legs"]):
                return r
    for r in routes:
        if r["primary_mode"] == mode:
            return r
    return routes[0] if routes else None


def decide(req: dict, bandit: CarrierBandit) -> dict:
    origin, dest, pkg = req["origin"], req["destination"], req["package"]
    prefs = normalize_preferences(req.get("preferences") or {})
    rates = req.get("carrier_rates", [])
    vias = sorted({r["via"] for r in rates if r.get("via")})
    route_result = optimize_routes(origin, dest, pkg["weight_kg"], pkg.get("dimensions"), prefs, max_results=12, via=vias)
    routes = route_result["routes"]

    services = set(req.get("service_type") or [])
    if services:
        rates = [r for r in rates if r["service"] in services]

    market = {}
    for r in rates:  # market reference = median cost for the service level
        market.setdefault(r["service"], []).append(r["cost_usd"])
    market_ref = {k: sorted(v)[len(v) // 2] * 1.2 for k, v in market.items()}

    bandit_rank = {
        b["carrier_id"]: b for b in bandit.recommend(
            [{"carrier_id": r["carrier_id"], "price_usd": r["cost_usd"], "transit_days": r["transit_days"]} for r in rates],
            origin["country"], dest["country"], explore=False,
        )
    }

    options = []
    for r in rates:
        route = _match_route(routes, r.get("mode", "air"), r.get("via"))
        price = pricing.optimize_price(r["cost_usd"], market_ref.get(r["service"]), r["service"]) if req.get("ai_optimize", True) \
            else {"price_usd": r["cost_usd"], "margin_pct": 0.0}
        # Use the carrier's quoted transit time; the matched route supplies the legs and modes.
        risk_input = {"legs": route["legs"] if route else [], "transit_days": r["transit_days"]}
        risk = predictor.predict(risk_input, origin["country"], dest["country"], req.get("ship_date"))
        perf = bandit_rank.get(r["carrier_id"], {}).get("expected_success_rate", 0.8)
        reliability = perf * (1 - 0.5 * risk["risk_score"])
        options.append({
            "carrier_id": r["carrier_id"],
            "carrier_name": r.get("carrier_name", r["carrier_id"]),
            "service": r["service"],
            "service_name": r.get("service_name"),
            "price_usd": price["price_usd"],
            "currency": "USD",
            "transit_days": r["transit_days"],
            "co2_kg": route["co2_kg"] if route else None,
            "route": {"summary": route["summary"], "primary_mode": route["primary_mode"], "legs": route["legs"]} if route else None,
            "reliability": round(reliability, 3),
            "risk": {"score": risk["risk_score"], "level": risk["risk_level"], "eta": risk["eta"], "factors": risk["factors"][:3]},
            "pricing": {"carrier_cost_usd": r["cost_usd"], "margin_pct": price["margin_pct"]},
        })

    if options:
        def inv(vals):
            lo, hi = min(vals), max(vals)
            return [100.0 if hi == lo else 100 * (hi - v) / (hi - lo) for v in vals]
        cs = inv([o["price_usd"] for o in options])
        ss = inv([o["transit_days"] for o in options])
        es = inv([o["co2_kg"] or 0 for o in options])
        for o, c, s, e in zip(options, cs, ss, es):
            rs = 100 * o["reliability"]
            o["ai_scores"] = {"cost": round(c, 1), "speed": round(s, 1), "carbon": round(e, 1), "reliability": round(rs, 1)}
            o["ai_score"] = round(prefs["cost"] * c + prefs["speed"] * s + prefs["carbon"] * e + prefs["reliability"] * rs, 1)
        options.sort(key=lambda o: o["ai_score"], reverse=True)
        for i, o in enumerate(options):
            o["rank"] = i + 1
        _tag(options)

    return {
        "chargeable_weight_kg": route_result["chargeable_weight_kg"],
        "preferences": {k: round(v, 3) for k, v in prefs.items()},
        "options": options,
        "alternative_routes": routes[:3],
    }


def _tag(options: list[dict]) -> None:
    options[0].setdefault("tags", []).append("recommended")
    for key, tag in (("price_usd", "cheapest"), ("transit_days", "fastest"), ("co2_kg", "greenest")):
        vals = [o[key] for o in options if o[key] is not None]
        if not vals or min(vals) == max(vals):
            continue  # no meaningful winner when every option ties
        best = min(options, key=lambda o: (o[key] if o[key] is not None else float("inf")))
        best.setdefault("tags", []).append(tag)
