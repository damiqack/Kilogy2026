"""ML scoring for routes.

Reliability comes from a logistic model over route features. The coefficients are hand-set to
plausible values for the prototype; `train_reliability` fits them on labeled shipments once
historical data exists (see tests for an example).

The final AI score is a preference-weighted blend of normalized cost, speed, carbon and
reliability scores (0-100, higher is better).
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from .network import MODE_RELIABILITY

DEFAULT_PREFERENCES = {"cost": 0.35, "speed": 0.30, "carbon": 0.20, "reliability": 0.15}

# Logistic coefficients: [bias, handoffs, border, ocean_share, air_share, log_distance]
RELIABILITY_COEF = np.array([3.2, -0.35, -0.25, -0.9, 0.2, -0.12])


@dataclass
class RouteFeatures:
    cost_usd: float
    transit_hours: float
    co2_kg: float
    distance_km: float
    handoffs: int
    modes: list[str]
    crosses_border: bool

    def vector(self) -> np.ndarray:
        n = max(len(self.modes), 1)
        return np.array([
            1.0,
            self.handoffs,
            1.0 if self.crosses_border else 0.0,
            self.modes.count("ocean") / n,
            self.modes.count("air") / n,
            math.log1p(self.distance_km / 1000),
        ])


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def predict_reliability(f: RouteFeatures, coef: np.ndarray = RELIABILITY_COEF) -> float:
    model = float(sigmoid(f.vector() @ coef))
    prior = float(np.prod([MODE_RELIABILITY[m] for m in f.modes])) ** (1 / max(len(f.modes), 1))
    return round(0.6 * model + 0.4 * prior, 3)


def train_reliability(X: np.ndarray, y: np.ndarray, lr: float = 0.1, epochs: int = 2000, l2: float = 1e-3) -> np.ndarray:
    """Fit logistic-regression coefficients with gradient descent."""
    w = np.zeros(X.shape[1])
    for _ in range(epochs):
        p = sigmoid(X @ w)
        grad = X.T @ (p - y) / len(y) + l2 * w
        w -= lr * grad
    return w


def _normalize_inverse(values: list[float]) -> list[float]:
    """Lower is better: map min->100, max->0 (log scale to soften outliers)."""
    logs = [math.log1p(v) for v in values]
    lo, hi = min(logs), max(logs)
    if hi - lo < 1e-9:
        return [100.0] * len(values)
    return [100.0 * (hi - v) / (hi - lo) for v in logs]


def normalize_preferences(prefs: dict) -> dict:
    merged = {k: float(prefs.get(k, v)) for k, v in DEFAULT_PREFERENCES.items()}
    total = sum(max(v, 0) for v in merged.values()) or 1.0
    return {k: max(v, 0) / total for k, v in merged.items()}


def score_routes(features: list[RouteFeatures], preferences: dict) -> list[dict]:
    if not features:
        return []
    prefs = normalize_preferences(preferences)
    cost_s = _normalize_inverse([f.cost_usd for f in features])
    speed_s = _normalize_inverse([f.transit_hours for f in features])
    carbon_s = _normalize_inverse([f.co2_kg for f in features])
    out = []
    for i, f in enumerate(features):
        rel = predict_reliability(f)
        rel_s = 100.0 * rel
        ai = (prefs["cost"] * cost_s[i] + prefs["speed"] * speed_s[i]
              + prefs["carbon"] * carbon_s[i] + prefs["reliability"] * rel_s)
        out.append({
            "reliability": rel,
            "scores": {
                "cost": round(cost_s[i], 1), "speed": round(speed_s[i], 1),
                "carbon": round(carbon_s[i], 1), "reliability": round(rel_s, 1),
            },
            "ai_score": round(ai, 1),
        })
    return out
