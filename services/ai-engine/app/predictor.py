"""Incident Predictor: risk score and ETA adjustment for a route.

The target model is an LSTM over historical delay sequences, weather and customs data. This
prototype uses a feature-based logistic model with the same interface: route plus ship date in,
risk score, risk factors and adjusted ETA range out. It can be swapped for the LSTM behind
`predict()` later without API changes.
"""
from __future__ import annotations

import math
from datetime import date, datetime, timedelta

# Customs complexity (0 = frictionless, 1 = very complex). Placeholder index.
CUSTOMS_COMPLEXITY = {
    "CA": 0.15, "US": 0.25, "MX": 0.35, "GB": 0.3, "FR": 0.2, "DE": 0.2, "NL": 0.15, "TR": 0.4,
    "NG": 0.75, "GH": 0.55, "SN": 0.5, "KE": 0.55, "ZA": 0.4, "EG": 0.6, "ET": 0.6, "AE": 0.25,
    "IN": 0.5, "CN": 0.4, "HK": 0.1, "SG": 0.1, "JP": 0.2, "AU": 0.3, "BR": 0.65,
}

# Seasonal weather disruption by hemisphere/region and month (1-12).
def weather_risk(country: str, month: int) -> float:
    northern_winter = {"CA": 0.5, "US": 0.3, "GB": 0.25, "DE": 0.3, "NL": 0.25, "FR": 0.2, "TR": 0.2, "JP": 0.25, "CN": 0.2}
    west_africa_rain = {"NG", "GH", "SN"}
    if country in northern_winter and month in (12, 1, 2):
        return northern_winter[country]
    if country in west_africa_rain and month in (6, 7, 8, 9):
        return 0.35
    if country in {"IN", "BOM"} and month in (6, 7, 8, 9):
        return 0.4
    if country in {"HK", "CN", "JP"} and month in (7, 8, 9):
        return 0.3  # typhoon season
    return 0.08


MODE_BASE_RISK = {"air": 0.05, "road": 0.06, "rail": 0.08, "ocean": 0.15}

# Logistic coefficients over the risk features.
COEF = {"bias": -4.2, "customs": 3.2, "weather": 2.5, "handoffs": 0.35, "mode": 4.0, "peak": 0.6}


def _peak_season(d: date) -> bool:
    return (d.month == 11 and d.day >= 15) or d.month == 12


def predict(route: dict, origin_country: str, dest_country: str, ship_date: str | None = None) -> dict:
    d = datetime.fromisoformat(ship_date).date() if ship_date else date.today()
    legs = route.get("legs", [])
    modes = [l["mode"] for l in legs] or ["road"]
    transit_days = route.get("transit_days") or sum(l.get("transit_hours", 0) for l in legs) / 24

    customs = CUSTOMS_COMPLEXITY.get(dest_country.upper(), 0.5)
    if origin_country.upper() == dest_country.upper():
        customs *= 0.1
    weather = max(weather_risk(origin_country.upper(), d.month), weather_risk(dest_country.upper(), d.month))
    handoffs = max(len(legs) - 1, 0)
    mode_risk = max(MODE_BASE_RISK[m] for m in modes)
    peak = 1.0 if _peak_season(d) else 0.0

    z = (COEF["bias"] + COEF["customs"] * customs + COEF["weather"] * weather
         + COEF["handoffs"] * handoffs + COEF["mode"] * mode_risk + COEF["peak"] * peak)
    p = 1 / (1 + math.exp(-z))

    contributions = {
        "customs_clearance": COEF["customs"] * customs,
        "weather": COEF["weather"] * weather,
        "handoffs": COEF["handoffs"] * handoffs,
        "transport_mode": COEF["mode"] * mode_risk,
        "peak_season": COEF["peak"] * peak,
    }
    factors = [
        {"factor": k, "impact": round(v / max(sum(contributions.values()), 1e-9), 3)}
        for k, v in sorted(contributions.items(), key=lambda kv: -kv[1]) if v > 0
    ]

    expected_delay_days = p * (1.5 + 2.5 * customs + (3 if "ocean" in modes else 0))
    eta_start = d + timedelta(days=math.floor(transit_days))
    eta_end = d + timedelta(days=math.ceil(transit_days + expected_delay_days + 0.5))
    level = "low" if p < 0.25 else "medium" if p < 0.55 else "high"

    return {
        "risk_score": round(p, 3),
        "risk_level": level,
        "expected_delay_days": round(expected_delay_days, 1),
        "eta": {"earliest": eta_start.isoformat(), "latest": eta_end.isoformat()},
        "factors": factors,
        "model": "feature-logistic-v0 (LSTM placeholder)",
    }
