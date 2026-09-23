"""Logistics lane network used by the Routing Engine.

Nodes are gateway hubs (airports / seaports / road hubs). Edges are transport lanes with a mode.
Origins and destinations are attached to the nearest hub(s) with a road first/last-mile leg.

This is a seed network for the prototype. In production it is loaded from the carrier lane
database and GraphHopper for road segments.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

# Emission factors in grams CO2e per tonne-km (GLEC Framework-style averages).
EMISSION_FACTORS = {"air": 602.0, "ocean": 16.0, "road": 62.0, "rail": 22.0}
# Average speed in km/h including handling, used for transit time.
MODE_SPEED_KMH = {"air": 650.0, "ocean": 30.0, "road": 55.0, "rail": 45.0}
# Fixed handling hours per leg (terminal time, customs staging).
MODE_HANDLING_H = {"air": 10.0, "ocean": 72.0, "road": 2.0, "rail": 12.0}
# Linehaul cost in USD per chargeable kg per 1000 km.
MODE_COST_PER_KG_1000KM = {"air": 0.55, "ocean": 0.03, "road": 0.12, "rail": 0.06}
# Minimum charge per leg in USD.
MODE_MIN_CHARGE = {"air": 25.0, "ocean": 60.0, "road": 8.0, "rail": 20.0}
# Baseline on-time reliability per mode.
MODE_RELIABILITY = {"air": 0.93, "ocean": 0.82, "road": 0.95, "rail": 0.88}


@dataclass(frozen=True)
class Hub:
    code: str
    city: str
    country: str
    lat: float
    lon: float
    kind: str  # "air", "sea", "multi"


HUBS: dict[str, Hub] = {h.code: h for h in [
    Hub("YUL", "Montreal", "CA", 45.47, -73.74, "multi"),
    Hub("YYZ", "Toronto", "CA", 43.68, -79.63, "multi"),
    Hub("YVR", "Vancouver", "CA", 49.19, -123.18, "multi"),
    Hub("HAL", "Halifax", "CA", 44.65, -63.57, "sea"),
    Hub("JFK", "New York", "US", 40.64, -73.78, "multi"),
    Hub("ORD", "Chicago", "US", 41.97, -87.91, "air"),
    Hub("LAX", "Los Angeles", "US", 33.94, -118.41, "multi"),
    Hub("SFO", "San Francisco", "US", 37.62, -122.38, "multi"),
    Hub("LHR", "London", "GB", 51.47, -0.45, "air"),
    Hub("FXT", "Felixstowe", "GB", 51.96, 1.35, "sea"),
    Hub("CDG", "Paris", "FR", 49.01, 2.55, "air"),
    Hub("FRA", "Frankfurt", "DE", 50.04, 8.56, "air"),
    Hub("RTM", "Rotterdam", "NL", 51.95, 4.14, "sea"),
    Hub("AMS", "Amsterdam", "NL", 52.31, 4.76, "air"),
    Hub("DXB", "Dubai", "AE", 25.25, 55.36, "multi"),
    Hub("IST", "Istanbul", "TR", 41.26, 28.74, "air"),
    Hub("ADD", "Addis Ababa", "ET", 8.98, 38.80, "air"),
    Hub("LOS", "Lagos", "NG", 6.58, 3.32, "multi"),
    Hub("ACC", "Accra", "GH", 5.61, -0.17, "multi"),
    Hub("TEM", "Tema", "GH", 5.63, 0.01, "sea"),
    Hub("DKR", "Dakar", "SN", 14.67, -17.07, "multi"),
    Hub("NBO", "Nairobi", "KE", -1.32, 36.93, "air"),
    Hub("MBA", "Mombasa", "KE", -4.04, 39.67, "sea"),
    Hub("JNB", "Johannesburg", "ZA", -26.14, 28.25, "air"),
    Hub("DUR", "Durban", "ZA", -29.87, 31.03, "sea"),
    Hub("CAI", "Cairo", "EG", 30.12, 31.41, "air"),
    Hub("GRU", "Sao Paulo", "BR", -23.43, -46.47, "multi"),
    Hub("MEX", "Mexico City", "MX", 19.44, -99.07, "air"),
    Hub("HKG", "Hong Kong", "HK", 22.31, 113.91, "multi"),
    Hub("SHA", "Shanghai", "CN", 31.14, 121.81, "multi"),
    Hub("SIN", "Singapore", "SG", 1.36, 103.99, "multi"),
    Hub("BOM", "Mumbai", "IN", 19.09, 72.87, "multi"),
    Hub("NRT", "Tokyo", "JP", 35.77, 140.39, "air"),
    Hub("SYD", "Sydney", "AU", -33.95, 151.18, "multi"),
]}

# Known city coordinates for geocoding (prototype gazetteer; production uses a geocoder).
CITIES: dict[tuple[str, str], tuple[float, float]] = {
    ("CA", "montreal"): (45.50, -73.57), ("CA", "toronto"): (43.65, -79.38),
    ("CA", "vancouver"): (49.28, -123.12), ("CA", "ottawa"): (45.42, -75.70),
    ("CA", "london"): (42.98, -81.25), ("CA", "halifax"): (44.65, -63.58),
    ("CA", "calgary"): (51.05, -114.07),
    ("US", "new york"): (40.71, -74.01), ("US", "chicago"): (41.88, -87.63),
    ("US", "los angeles"): (34.05, -118.24), ("US", "san francisco"): (37.77, -122.42),
    ("US", "arcata"): (40.87, -124.08), ("US", "eureka"): (40.80, -124.16),
    ("GB", "london"): (51.51, -0.13), ("FR", "paris"): (48.86, 2.35),
    ("DE", "frankfurt"): (50.11, 8.68), ("DE", "berlin"): (52.52, 13.40),
    ("NL", "amsterdam"): (52.37, 4.90), ("NL", "rotterdam"): (51.92, 4.48),
    ("AE", "dubai"): (25.20, 55.27), ("TR", "istanbul"): (41.01, 28.98),
    ("NG", "lagos"): (6.52, 3.38), ("NG", "abuja"): (9.08, 7.40),
    ("GH", "accra"): (5.60, -0.19), ("GH", "kumasi"): (6.69, -1.62),
    ("SN", "dakar"): (14.72, -17.47),
    ("KE", "nairobi"): (-1.29, 36.82), ("KE", "mombasa"): (-4.04, 39.67),
    ("ZA", "johannesburg"): (-26.20, 28.05), ("ZA", "cape town"): (-33.92, 18.42),
    ("EG", "cairo"): (30.04, 31.24), ("ET", "addis ababa"): (9.03, 38.74),
    ("BR", "sao paulo"): (-23.55, -46.63), ("MX", "mexico city"): (19.43, -99.13),
    ("CN", "shanghai"): (31.23, 121.47), ("HK", "hong kong"): (22.32, 114.17),
    ("SG", "singapore"): (1.35, 103.82), ("IN", "mumbai"): (19.08, 72.88),
    ("JP", "tokyo"): (35.68, 139.69), ("AU", "sydney"): (-33.87, 151.21),
}

# Undirected lanes: (hub_a, hub_b, mode). Distance is computed from coordinates.
_LANES: list[tuple[str, str, str]] = [
    # North America domestic / transborder
    ("YUL", "YYZ", "road"), ("YUL", "YYZ", "rail"), ("YYZ", "ORD", "road"), ("YUL", "JFK", "road"),
    ("YUL", "HAL", "rail"), ("YYZ", "YVR", "air"), ("YYZ", "YVR", "rail"), ("YVR", "SFO", "road"),
    ("SFO", "LAX", "road"), ("JFK", "ORD", "air"), ("ORD", "LAX", "air"), ("LAX", "MEX", "air"),
    ("YUL", "YYZ", "air"), ("JFK", "LAX", "air"),
    # Transatlantic air
    ("YUL", "LHR", "air"), ("YUL", "CDG", "air"), ("YYZ", "LHR", "air"), ("YYZ", "FRA", "air"),
    ("JFK", "LHR", "air"), ("JFK", "CDG", "air"), ("JFK", "FRA", "air"), ("JFK", "AMS", "air"),
    ("YYZ", "ADD", "air"), ("JFK", "ACC", "air"), ("JFK", "LOS", "air"), ("GRU", "JNB", "air"),
    # Transatlantic ocean
    ("HAL", "RTM", "ocean"), ("HAL", "FXT", "ocean"), ("JFK", "RTM", "ocean"),
    ("HAL", "TEM", "ocean"), ("JFK", "LOS", "ocean"), ("RTM", "LOS", "ocean"), ("RTM", "TEM", "ocean"),
    ("RTM", "DUR", "ocean"), ("RTM", "MBA", "ocean"),
    # Europe
    ("LHR", "CDG", "road"), ("CDG", "FRA", "road"), ("FRA", "AMS", "road"), ("AMS", "RTM", "road"),
    ("FXT", "LHR", "road"), ("LHR", "FRA", "air"),
    # Europe / Middle East -> Africa
    ("LHR", "LOS", "air"), ("LHR", "ACC", "air"), ("LHR", "NBO", "air"), ("LHR", "JNB", "air"),
    ("CDG", "LOS", "air"), ("CDG", "ACC", "air"), ("FRA", "LOS", "air"), ("FRA", "JNB", "air"),
    ("AMS", "LOS", "air"), ("AMS", "ACC", "air"), ("AMS", "NBO", "air"), ("IST", "LOS", "air"),
    ("IST", "ACC", "air"), ("IST", "NBO", "air"), ("DXB", "LOS", "air"), ("DXB", "ACC", "air"),
    ("DXB", "NBO", "air"), ("DXB", "JNB", "air"), ("ADD", "LOS", "air"), ("ADD", "ACC", "air"),
    ("ADD", "NBO", "air"), ("ADD", "JNB", "air"), ("CAI", "NBO", "air"), ("FRA", "IST", "air"),
    ("LHR", "DXB", "air"), ("FRA", "DXB", "air"), ("YYZ", "DXB", "air"), ("CDG", "CAI", "air"),
    ("JFK", "DKR", "air"), ("CDG", "DKR", "air"), ("ADD", "DKR", "air"), ("IST", "DKR", "air"),
    ("RTM", "DKR", "ocean"), ("HAL", "DKR", "ocean"),
    # Intra-Africa
    ("LOS", "ACC", "road"), ("LOS", "ACC", "air"), ("ACC", "TEM", "road"), ("NBO", "MBA", "road"),
    ("JNB", "DUR", "road"), ("NBO", "JNB", "air"), ("LOS", "NBO", "air"), ("DKR", "ACC", "air"), ("DKR", "LOS", "air"),
    ("YUL", "ADD", "air"),
    # Asia-Pacific
    ("YVR", "HKG", "air"), ("YVR", "NRT", "air"), ("LAX", "SHA", "air"), ("SFO", "HKG", "air"),
    ("YVR", "SHA", "ocean"), ("LAX", "SHA", "ocean"), ("SHA", "HKG", "air"), ("HKG", "SIN", "air"),
    ("SIN", "BOM", "air"), ("BOM", "DXB", "air"), ("SIN", "SYD", "air"), ("HKG", "DXB", "air"),
    ("SIN", "RTM", "ocean"), ("SHA", "RTM", "ocean"), ("SIN", "MBA", "ocean"), ("DXB", "BOM", "ocean"),
    ("NRT", "HKG", "air"), ("LAX", "SYD", "air"), ("BOM", "NBO", "air"),
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


# Real routes are longer than great-circle distance.
ROUTING_FACTOR = {"air": 1.08, "ocean": 1.30, "road": 1.25, "rail": 1.20}


@dataclass(frozen=True)
class Lane:
    src: str
    dst: str
    mode: str
    distance_km: float


def build_adjacency() -> dict[str, list[Lane]]:
    adj: dict[str, list[Lane]] = {code: [] for code in HUBS}
    for a, b, mode in _LANES:
        ha, hb = HUBS[a], HUBS[b]
        d = haversine_km(ha.lat, ha.lon, hb.lat, hb.lon) * ROUTING_FACTOR[mode]
        adj[a].append(Lane(a, b, mode, d))
        adj[b].append(Lane(b, a, mode, d))
    return adj


ADJACENCY = build_adjacency()


def geocode(country: str, city: str | None) -> tuple[float, float] | None:
    country = (country or "").upper()
    if city:
        hit = CITIES.get((country, city.strip().lower()))
        if hit:
            return hit
    # Fall back to the first hub in the country.
    for hub in HUBS.values():
        if hub.country == country and (not city or hub.city.lower() == city.strip().lower()):
            return (hub.lat, hub.lon)
    for hub in HUBS.values():
        if hub.country == country:
            return (hub.lat, hub.lon)
    return None


def nearest_hubs(lat: float, lon: float, country: str, k: int = 2, max_km: float = 900.0) -> list[tuple[Hub, float]]:
    """Hubs reachable by road first/last mile, preferring the same country."""
    scored = []
    for hub in HUBS.values():
        d = haversine_km(lat, lon, hub.lat, hub.lon) * ROUTING_FACTOR["road"]
        if d <= max_km:
            penalty = 0 if hub.country == country.upper() else 400  # border crossing
            scored.append((d + penalty, hub, d))
    scored.sort(key=lambda t: t[0])
    return [(hub, d) for _, hub, d in scored[:k]]
