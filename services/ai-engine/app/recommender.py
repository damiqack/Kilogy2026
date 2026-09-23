"""Carrier Recommender: contextual Thompson-sampling multi-armed bandit.

Each (carrier, lane_region, service_level) arm keeps a Beta(alpha, beta) posterior over the
probability of a "successful" shipment (on time, no incident, within quoted cost). Recommendation
samples from each posterior and combines the sample with the client's cost/SLA preferences.
Delivered-shipment outcomes are fed back through `record_outcome`.
"""
from __future__ import annotations

import threading
from dataclasses import dataclass

import numpy as np

REGIONS = {
    "CA": "NA", "US": "NA", "MX": "NA",
    "GB": "EU", "FR": "EU", "DE": "EU", "NL": "EU", "TR": "EU",
    "NG": "AF", "GH": "AF", "KE": "AF", "ZA": "AF", "EG": "AF", "ET": "AF",
    "AE": "ME", "IN": "AS", "CN": "AS", "HK": "AS", "SG": "AS", "JP": "AS",
    "AU": "OC", "BR": "SA",
}

# Prior beliefs (alpha, beta) per carrier and region. Values are placeholders until real
# performance data is available.
PRIORS: dict[str, dict[str, tuple[float, float]]] = {
    "dhl": {"AF": (18, 3), "EU": (20, 3), "NA": (16, 4), "*": (17, 4)},
    "fedex": {"NA": (22, 3), "EU": (16, 4), "AF": (11, 5), "*": (15, 4)},
    "ups": {"NA": (21, 3), "EU": (17, 4), "AF": (10, 6), "*": (14, 5)},
    "canadapost": {"NA": (14, 5), "*": (8, 6)},
}


def lane_region(origin_country: str, dest_country: str) -> str:
    return f"{REGIONS.get(origin_country.upper(), 'XX')}-{REGIONS.get(dest_country.upper(), 'XX')}"


@dataclass
class Arm:
    alpha: float
    beta: float

    @property
    def mean(self) -> float:
        return self.alpha / (self.alpha + self.beta)


class CarrierBandit:
    def __init__(self, seed: int | None = None):
        self._arms: dict[tuple[str, str], Arm] = {}
        self._lock = threading.Lock()
        self._rng = np.random.default_rng(seed)

    def _arm(self, carrier: str, region: str) -> Arm:
        key = (carrier, region)
        if key not in self._arms:
            dest_region = region.split("-")[-1]
            prior = PRIORS.get(carrier, {}).get(dest_region) or PRIORS.get(carrier, {}).get("*") or (2, 2)
            self._arms[key] = Arm(*prior)
        return self._arms[key]

    def recommend(self, carriers: list[dict], origin_country: str, dest_country: str,
                  preferences: dict | None = None, explore: bool = True) -> list[dict]:
        """carriers: [{carrier_id, price_usd, transit_days, sla_days?}]"""
        prefs = {"cost": 0.4, "sla": 0.3, "performance": 0.3, **(preferences or {})}
        region = lane_region(origin_country, dest_country)
        if not carriers:
            return []
        prices = [c["price_usd"] for c in carriers]
        days = [c["transit_days"] for c in carriers]
        pmin, pmax = min(prices), max(prices)
        ranked = []
        with self._lock:
            for c in carriers:
                arm = self._arm(c["carrier_id"], region)
                perf = float(self._rng.beta(arm.alpha, arm.beta)) if explore else arm.mean
                cost_score = 1.0 if pmax == pmin else (pmax - c["price_usd"]) / (pmax - pmin)
                sla = c.get("sla_days")
                if sla:
                    sla_score = 1.0 if c["transit_days"] <= sla else max(0.0, 1 - (c["transit_days"] - sla) / sla)
                else:
                    dmin, dmax = min(days), max(days)
                    sla_score = 1.0 if dmax == dmin else (dmax - c["transit_days"]) / (dmax - dmin)
                total = prefs["cost"] * cost_score + prefs["sla"] * sla_score + prefs["performance"] * perf
                ranked.append({
                    "carrier_id": c["carrier_id"],
                    "score": round(100 * total, 1),
                    "expected_success_rate": round(arm.mean, 3),
                    "observations": int(arm.alpha + arm.beta),
                    "components": {
                        "cost": round(cost_score, 3), "sla": round(sla_score, 3), "performance_sample": round(perf, 3),
                    },
                })
        ranked.sort(key=lambda r: r["score"], reverse=True)
        return ranked

    def record_outcome(self, carrier: str, origin_country: str, dest_country: str, success: bool) -> dict:
        region = lane_region(origin_country, dest_country)
        with self._lock:
            arm = self._arm(carrier, region)
            if success:
                arm.alpha += 1
            else:
                arm.beta += 1
            return {"carrier_id": carrier, "region": region, "alpha": arm.alpha, "beta": arm.beta, "mean": round(arm.mean, 4)}
