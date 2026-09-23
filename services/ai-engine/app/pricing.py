"""AI Pricing Engine: margin optimization on top of carrier cost.

The target model is XGBoost regression predicting acceptance probability from route, weight,
carrier and time features. This prototype uses a logistic acceptance curve against a market
reference price and picks the margin that maximizes expected profit:

    expected_profit(m) = P(accept | price(m)) * (price(m) - cost)
"""
from __future__ import annotations

import math

MIN_MARGIN, MAX_MARGIN = 0.05, 0.40
# Price sensitivity by service level (higher = more price sensitive).
ELASTICITY = {"express": 6.0, "standard": 9.0, "economy": 12.0}


def acceptance_probability(price: float, market_price: float, service: str) -> float:
    k = ELASTICITY.get(service, 9.0)
    ratio = price / max(market_price, 0.01)
    return 1 / (1 + math.exp(k * (ratio - 1.05)))


def optimize_price(carrier_cost: float, market_price: float | None = None, service: str = "standard") -> dict:
    """Return the price that maximizes expected margin, within guardrails."""
    market = market_price if market_price else carrier_cost * 1.25
    best = None
    steps = 71
    for i in range(steps):
        m = MIN_MARGIN + (MAX_MARGIN - MIN_MARGIN) * i / (steps - 1)
        price = carrier_cost * (1 + m)
        p = acceptance_probability(price, market, service)
        ev = p * (price - carrier_cost)
        if best is None or ev > best["expected_profit"]:
            best = {"margin": m, "price": price, "acceptance": p, "expected_profit": ev}
    return {
        "carrier_cost_usd": round(carrier_cost, 2),
        "price_usd": round(best["price"], 2),
        "margin_pct": round(best["margin"] * 100, 1),
        "acceptance_probability": round(best["acceptance"], 3),
        "expected_profit_usd": round(best["expected_profit"], 2),
        "model": "logistic-acceptance-v0 (XGBoost placeholder)",
    }
