"""Routing Engine: Dijkstra over the lane network, then ML scoring.

1. Attach origin and destination to nearby hubs with road first/last-mile legs.
2. Run Dijkstra once per objective profile (cost, speed, carbon, balanced) and for a few
   mode-restricted variants. This produces a diverse candidate set.
3. Compute cost, transit time, CO2 and reliability for each candidate, then rank with the
   scoring model using the client's preferences.
"""
from __future__ import annotations

import heapq
import itertools
from dataclasses import dataclass, field

from . import network as net
from .scoring import RouteFeatures, score_routes

ORIGIN, DEST = "__ORIGIN__", "__DEST__"

# Per-edge weight profiles for Dijkstra (applied to normalized edge metrics).
PROFILES: dict[str, dict[str, float]] = {
    "cheapest": {"cost": 1.0, "time": 0.05, "co2": 0.05},
    "fastest": {"cost": 0.05, "time": 1.0, "co2": 0.0},
    "greenest": {"cost": 0.1, "time": 0.05, "co2": 1.0},
    "balanced": {"cost": 0.4, "time": 0.35, "co2": 0.25},
}


@dataclass
class Leg:
    src: str
    dst: str
    mode: str
    distance_km: float
    transit_hours: float
    cost_usd: float
    co2_kg: float

    def as_dict(self) -> dict:
        return {
            "from": self.src, "to": self.dst, "mode": self.mode,
            "distance_km": round(self.distance_km, 1),
            "transit_hours": round(self.transit_hours, 1),
            "cost_usd": round(self.cost_usd, 2),
            "co2_kg": round(self.co2_kg, 3),
        }


@dataclass
class Route:
    legs: list[Leg]
    profile: str
    metrics: dict = field(default_factory=dict)

    @property
    def signature(self) -> tuple:
        return tuple((l.src, l.dst, l.mode) for l in self.legs)


def leg_metrics(mode: str, distance_km: float, chargeable_kg: float, actual_kg: float) -> tuple[float, float, float]:
    hours = distance_km / net.MODE_SPEED_KMH[mode] + net.MODE_HANDLING_H[mode]
    cost = max(net.MODE_MIN_CHARGE[mode], net.MODE_COST_PER_KG_1000KM[mode] * chargeable_kg * distance_km / 1000)
    co2 = net.EMISSION_FACTORS[mode] * (actual_kg / 1000) * distance_km / 1000  # kg CO2e
    return hours, cost, co2


def _graph_for(origin: tuple[float, float, str], dest: tuple[float, float, str]):
    """Adjacency plus virtual origin/destination nodes."""
    adj: dict[str, list[net.Lane]] = {k: list(v) for k, v in net.ADJACENCY.items()}
    adj[ORIGIN], adj[DEST] = [], []
    olat, olon, ocountry = origin
    dlat, dlon, dcountry = dest
    for hub, d in net.nearest_hubs(olat, olon, ocountry, k=3):
        adj[ORIGIN].append(net.Lane(ORIGIN, hub.code, "road", max(d, 5.0)))
    for hub, d in net.nearest_hubs(dlat, dlon, dcountry, k=3):
        adj[hub.code].append(net.Lane(hub.code, DEST, "road", max(d, 5.0)))
    # Short domestic trips: allow a direct road leg.
    direct = net.haversine_km(olat, olon, dlat, dlon) * net.ROUTING_FACTOR["road"]
    if direct < 1500:
        adj[ORIGIN].append(net.Lane(ORIGIN, DEST, "road", direct))
    return adj


def dijkstra(adj, weight_fn, allowed_modes: set[str] | None = None) -> list[net.Lane] | None:
    counter = itertools.count()
    heap = [(0.0, next(counter), ORIGIN, None)]
    best: dict[str, float] = {ORIGIN: 0.0}
    prev: dict[str, net.Lane] = {}
    visited = set()
    while heap:
        dist, _, node, _ = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)
        if node == DEST:
            break
        for lane in adj.get(node, []):
            if allowed_modes and lane.mode not in allowed_modes and lane.src != ORIGIN and lane.dst != DEST:
                continue
            nd = dist + weight_fn(lane)
            if nd < best.get(lane.dst, float("inf")):
                best[lane.dst] = nd
                prev[lane.dst] = lane
                heapq.heappush(heap, (nd, next(counter), lane.dst, lane))
    if DEST not in prev:
        return None
    path, node = [], DEST
    while node != ORIGIN:
        lane = prev[node]
        path.append(lane)
        node = lane.src
    return list(reversed(path))


def _label(code: str, origin_label: str, dest_label: str) -> str:
    if code == ORIGIN:
        return origin_label
    if code == DEST:
        return dest_label
    return code


def optimize_routes(
    origin: dict, destination: dict, weight_kg: float, dimensions: dict | None = None,
    preferences: dict | None = None, max_results: int = 5,
) -> dict:
    o = net.geocode(origin.get("country"), origin.get("city"))
    d = net.geocode(destination.get("country"), destination.get("city"))
    if not o or not d:
        missing = "origin" if not o else "destination"
        raise ValueError(f"Unsupported {missing} location")

    volumetric = 0.0
    if dimensions:
        volumetric = dimensions.get("l", 0) * dimensions.get("w", 0) * dimensions.get("h", 0) / 5000.0
    chargeable = max(weight_kg, volumetric)

    adj = _graph_for((o[0], o[1], origin["country"]), (d[0], d[1], destination["country"]))

    # Normalization scales so the profile weights are comparable.
    def weight_fn_for(profile: dict[str, float]):
        def w(lane: net.Lane) -> float:
            h, c, e = leg_metrics(lane.mode, lane.distance_km, chargeable, weight_kg)
            return profile["cost"] * c / 50.0 + profile["time"] * h / 24.0 + profile["co2"] * e / 5.0
        return w

    candidates: dict[tuple, Route] = {}
    mode_sets = [None, {"air", "road"}, {"ocean", "road", "rail"}, {"road", "rail"}]
    for (pname, pweights), modes in itertools.product(PROFILES.items(), mode_sets):
        path = dijkstra(adj, weight_fn_for(pweights), modes)
        if not path:
            continue
        legs = []
        for lane in path:
            h, c, e = leg_metrics(lane.mode, lane.distance_km, chargeable, weight_kg)
            legs.append(Leg(
                _label(lane.src, origin.get("city") or origin["country"], destination.get("city") or destination["country"]),
                _label(lane.dst, origin.get("city") or origin["country"], destination.get("city") or destination["country"]),
                lane.mode, lane.distance_km, h, c, e,
            ))
        route = Route(legs, pname)
        candidates.setdefault(route.signature, route)

    routes = list(candidates.values())
    features = []
    for r in routes:
        modes = [l.mode for l in r.legs]
        features.append(RouteFeatures(
            cost_usd=sum(l.cost_usd for l in r.legs),
            transit_hours=sum(l.transit_hours for l in r.legs),
            co2_kg=sum(l.co2_kg for l in r.legs),
            distance_km=sum(l.distance_km for l in r.legs),
            handoffs=len(r.legs) - 1,
            modes=modes,
            crosses_border=origin["country"].upper() != destination["country"].upper(),
        ))
    scored = score_routes(features, preferences or {})

    results = []
    for r, f, s in zip(routes, features, scored):
        primary = max(set(f.modes), key=lambda m: sum(l.distance_km for l in r.legs if l.mode == m))
        results.append({
            "route_id": "rt_" + "-".join(f"{l.src[:3]}{l.mode[0]}" for l in r.legs).lower().replace(" ", ""),
            "summary": " → ".join([r.legs[0].src] + [l.dst for l in r.legs]),
            "primary_mode": primary,
            "legs": [l.as_dict() for l in r.legs],
            "total_cost_usd": round(f.cost_usd, 2),
            "transit_days": round(f.transit_hours / 24, 1),
            "co2_kg": round(f.co2_kg, 2),
            "distance_km": round(f.distance_km, 0),
            "reliability": s["reliability"],
            "scores": s["scores"],
            "ai_score": s["ai_score"],
            "found_by": r.profile,
        })
    results.sort(key=lambda x: x["ai_score"], reverse=True)
    results = results[:max_results]

    # Carbon savings vs the fastest option, useful for the emissions KPI.
    if results:
        worst = max(x["co2_kg"] for x in results)
        for x in results:
            x["co2_saved_vs_worst_kg"] = round(worst - x["co2_kg"], 2)

    return {
        "chargeable_weight_kg": round(chargeable, 2),
        "routes": results,
    }
