import json
import math
from pathlib import Path
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="SmartVenues API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).parent / "data" / "venues.json"


def load_venues():
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/venues")
def get_venues(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    min_capacity: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
):
    data = load_venues()
    features = data["features"]

    if category:
        features = [f for f in features if f["properties"]["category"] == category]

    if region:
        features = [f for f in features if f["properties"]["region"].lower() == region.lower()]

    if min_capacity is not None:
        features = [f for f in features if f["properties"]["capacity"] >= min_capacity]

    if search:
        q = search.lower()
        features = [
            f for f in features
            if q in f["properties"]["name"].lower()
            or q in f["properties"]["city"].lower()
            or q in f["properties"]["region"].lower()
        ]

    return {"type": "FeatureCollection", "features": features}


@app.get("/api/venues/{venue_id}")
def get_venue(venue_id: int):
    data = load_venues()
    for feature in data["features"]:
        if feature["properties"]["id"] == venue_id:
            return feature
    return {"error": "Not found"}, 404


@app.get("/api/categories")
def get_categories():
    data = load_venues()
    categories = list(set(
        f["properties"]["category"] for f in data["features"]
    ))
    return {"categories": sorted(categories)}


@app.get("/api/regions")
def get_regions():
    data = load_venues()
    regions = list(set(
        f["properties"]["region"] for f in data["features"]
    ))
    return {"regions": sorted(regions)}


@app.get("/api/stats")
def get_stats():
    data = load_venues()
    features = data["features"]
    by_category: dict = {}
    for f in features:
        cat = f["properties"]["category"]
        by_category[cat] = by_category.get(cat, 0) + 1
    return {
        "total": len(features),
        "by_category": by_category,
        "total_capacity": sum(f["properties"]["capacity"] for f in features),
    }


# ─── Drone Logistics API ──────────────────────────────────────────────────────

DRONE_HUBS = [
    {"id": "HUB-CT-01", "name": "Hub Catania Zona Industriale", "shortName": "CT Zona Ind.", "type": "primary", "city": "Catania", "coords": [37.4940, 15.0628], "dailyCapacity": 250, "droneCount": 25, "isSmartVenue": True},
    {"id": "HUB-CT-02", "name": "Hub Aeroporto Fontanarossa", "shortName": "Aeroporto CT", "type": "primary", "city": "Catania", "coords": [37.4668, 15.0669], "dailyCapacity": 320, "droneCount": 32, "isSmartVenue": True},
    {"id": "HUB-CT-03", "name": "Hub Porto di Catania", "shortName": "Porto CT", "type": "primary", "city": "Catania", "coords": [37.5011, 15.1065], "dailyCapacity": 200, "droneCount": 20, "isSmartVenue": False},
    {"id": "HUB-ACI-04", "name": "Hub Acireale", "shortName": "Acireale", "type": "secondary", "city": "Acireale", "coords": [37.6110, 15.1661], "dailyCapacity": 80, "droneCount": 8, "isSmartVenue": True},
    {"id": "HUB-GIA-05", "name": "Hub Giarre-Riposto", "shortName": "Giarre", "type": "secondary", "city": "Giarre", "coords": [37.7273, 15.1813], "dailyCapacity": 90, "droneCount": 9, "isSmartVenue": False},
    {"id": "HUB-PAT-06", "name": "Hub Paternò", "shortName": "Paternò", "type": "secondary", "city": "Paternò", "coords": [37.5671, 14.9044], "dailyCapacity": 70, "droneCount": 7, "isSmartVenue": False},
    {"id": "HUB-ADR-07", "name": "Hub Adrano", "shortName": "Adrano", "type": "secondary", "city": "Adrano", "coords": [37.6620, 14.8307], "dailyCapacity": 55, "droneCount": 6, "isSmartVenue": False},
    {"id": "HUB-BRO-08", "name": "Hub Bronte", "shortName": "Bronte", "type": "secondary", "city": "Bronte", "coords": [37.7896, 14.8305], "dailyCapacity": 45, "droneCount": 5, "isSmartVenue": False},
    {"id": "HUB-RAN-09", "name": "Hub Randazzo", "shortName": "Randazzo", "type": "secondary", "city": "Randazzo", "coords": [37.8757, 14.9498], "dailyCapacity": 35, "droneCount": 4, "isSmartVenue": False},
    {"id": "HUB-CAL-10", "name": "Hub Caltagirone", "shortName": "Caltagirone", "type": "secondary", "city": "Caltagirone", "coords": [37.2357, 14.5148], "dailyCapacity": 65, "droneCount": 7, "isSmartVenue": True},
    {"id": "HUB-LEN-11", "name": "Hub Lentini", "shortName": "Lentini", "type": "secondary", "city": "Lentini", "coords": [37.2805, 14.9996], "dailyCapacity": 55, "droneCount": 6, "isSmartVenue": False},
    {"id": "HUB-MIL-12", "name": "Hub Militello Val di Catania", "shortName": "Militello", "type": "micro", "city": "Militello V.C.", "coords": [37.2730, 14.7913], "dailyCapacity": 30, "droneCount": 3, "isSmartVenue": False},
    {"id": "HUB-SCO-13", "name": "Hub Scordia", "shortName": "Scordia", "type": "micro", "city": "Scordia", "coords": [37.2989, 14.8445], "dailyCapacity": 40, "droneCount": 4, "isSmartVenue": False},
    {"id": "HUB-NIC-14", "name": "Hub Nicolosi (Etna Sud)", "shortName": "Nicolosi/Etna", "type": "micro", "city": "Nicolosi", "coords": [37.6086, 15.0195], "dailyCapacity": 25, "droneCount": 3, "isSmartVenue": True},
]

DRONE_MODELS = [
    {"id": "dji-flycart30", "name": "DJI FlyCart 30", "manufacturer": "DJI", "maxPayloadKg": 30, "maxRangeKm": 28, "cruiseSpeedKmh": 54, "energyKwhPerKm": 0.45, "costPerUnitEur": 18000, "noiseLevelDB": 68, "lifespanYears": 5},
    {"id": "wingcopter-198", "name": "Wingcopter 198", "manufacturer": "Wingcopter", "maxPayloadKg": 6, "maxRangeKm": 110, "cruiseSpeedKmh": 140, "energyKwhPerKm": 0.12, "costPerUnitEur": 50000, "noiseLevelDB": 58, "lifespanYears": 7},
    {"id": "zipline-p2", "name": "Zipline Platform 2", "manufacturer": "Zipline", "maxPayloadKg": 2.5, "maxRangeKm": 160, "cruiseSpeedKmh": 128, "energyKwhPerKm": 0.10, "costPerUnitEur": 35000, "noiseLevelDB": 55, "lifespanYears": 6},
    {"id": "manna-gen3", "name": "Manna Gen3", "manufacturer": "Manna Aero", "maxPayloadKg": 1.5, "maxRangeKm": 8, "cruiseSpeedKmh": 80, "energyKwhPerKm": 0.06, "costPerUnitEur": 25000, "noiseLevelDB": 55, "lifespanYears": 5},
]


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@app.get("/api/drone/hubs")
def get_drone_hubs(hub_type: Optional[str] = Query(None), smart_venue_only: bool = Query(False)):
    hubs = DRONE_HUBS
    if hub_type:
        hubs = [h for h in hubs if h["type"] == hub_type]
    if smart_venue_only:
        hubs = [h for h in hubs if h["isSmartVenue"]]
    return {"hubs": hubs, "total": len(hubs)}


@app.get("/api/drone/hubs/{hub_id}")
def get_drone_hub(hub_id: str):
    for hub in DRONE_HUBS:
        if hub["id"] == hub_id:
            return hub
    return {"error": "Hub not found"}, 404


@app.get("/api/drone/models")
def get_drone_models():
    return {"models": DRONE_MODELS}


@app.get("/api/drone/network")
def get_drone_network():
    """Return the full drone logistics network as a GeoJSON FeatureCollection."""
    features = []
    # Hub points
    for hub in DRONE_HUBS:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [hub["coords"][1], hub["coords"][0]]},
            "properties": {**hub, "featureType": "hub"},
        })
    # Route lines between primary hubs
    primary_hubs = [h for h in DRONE_HUBS if h["type"] == "primary"]
    for i, h1 in enumerate(DRONE_HUBS):
        for h2 in DRONE_HUBS[i+1:]:
            dist = haversine(h1["coords"][0], h1["coords"][1], h2["coords"][0], h2["coords"][1])
            if dist <= 100:
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [h1["coords"][1], h1["coords"][0]],
                            [h2["coords"][1], h2["coords"][0]],
                        ],
                    },
                    "properties": {
                        "featureType": "route",
                        "from": h1["id"],
                        "to": h2["id"],
                        "distanceKm": round(dist, 2),
                    },
                })
    return {"type": "FeatureCollection", "features": features}


class SimulateRequest(BaseModel):
    drone_model_id: str = "dji-flycart30"
    origin_hub_id: str = "HUB-CT-01"
    destination_hub_id: str = "HUB-ACI-04"
    payload_kg: float = 10.0
    deliveries_per_day: int = 30
    working_days: int = 250
    electricity_source: str = "mixed"   # grid | mixed | renewable


@app.post("/api/drone/simulate")
def simulate_route(req: SimulateRequest):
    drone = next((d for d in DRONE_MODELS if d["id"] == req.drone_model_id), DRONE_MODELS[0])
    origin = next((h for h in DRONE_HUBS if h["id"] == req.origin_hub_id), DRONE_HUBS[0])
    dest = next((h for h in DRONE_HUBS if h["id"] == req.destination_hub_id), DRONE_HUBS[1])

    dist_km = haversine(origin["coords"][0], origin["coords"][1], dest["coords"][0], dest["coords"][1])
    road_dist = dist_km * 1.35

    # Time
    flight_min = (dist_km / drone["cruiseSpeedKmh"]) * 60
    drone_total_min = flight_min + 8 + 4
    truck_total_min = (road_dist / 32) * 60 * 1.35 + 10 + 6

    # Costs
    electricity_co2 = {"grid": 232, "mixed": 120, "renewable": 22}.get(req.electricity_source, 120)
    energy_kwh = dist_km * drone["energyKwhPerKm"]
    drone_cost = energy_kwh * 0.22 + dist_km * 0.18 + (drone["costPerUnitEur"] / (drone["lifespanYears"] * req.working_days * req.deliveries_per_day)) + 28000 / (req.deliveries_per_day * req.working_days) + 0.30
    truck_cost = road_dist * 0.14 + (truck_total_min / 60) * 18 + road_dist * 0.09 + 2200 / (req.deliveries_per_day * req.working_days) + 0.50

    # CO2
    drone_co2_kg = (energy_kwh * electricity_co2) / 1000
    truck_co2_kg = (road_dist * 185) / 1000

    annual = req.deliveries_per_day * req.working_days

    return {
        "route": {
            "straightDistanceKm": round(dist_km, 2),
            "roadDistanceKm": round(road_dist, 2),
            "droneFlightTimeMin": round(drone_total_min),
            "truckRoadTimeMin": round(truck_total_min),
            "timeSavingMin": round(truck_total_min - drone_total_min),
        },
        "costsPerDelivery": {
            "drone": round(drone_cost, 2),
            "truck": round(truck_cost, 2),
            "savings": round(truck_cost - drone_cost, 2),
            "savingsPercent": round((truck_cost - drone_cost) / max(truck_cost, 0.01) * 100, 1),
        },
        "annualCosts": {
            "drone": round(drone_cost * annual),
            "truck": round(truck_cost * annual),
            "savings": round((truck_cost - drone_cost) * annual),
        },
        "environmental": {
            "droneCo2PerDeliveryKg": round(drone_co2_kg, 4),
            "truckCo2PerDeliveryKg": round(truck_co2_kg, 4),
            "co2SavingPercent": round((truck_co2_kg - drone_co2_kg) / max(truck_co2_kg, 0.001) * 100, 1),
            "annualCo2SavingTons": round((truck_co2_kg - drone_co2_kg) * annual / 1000, 2),
        },
        "drone": drone["name"],
        "origin": origin["name"],
        "destination": dest["name"],
    }
