import json
from pathlib import Path
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
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
