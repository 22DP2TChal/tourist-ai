from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import math
import asyncio
import httpx
from ..database import get_db
from ..models import TouristObject
from ..schemas import ObjectCreate, ObjectResponse
from ..auth import get_current_user, get_admin_user
from ..models import User
from ..config import settings

router = APIRouter(prefix="/api/objects", tags=["maps"])

# ── Google Places Nearby Search proxy ─────────────────────────────────────────

# Maps our categories to Google Places API types
PLACES_TYPE_MAP = {
    # food sub-filters
    "food_all":        ["restaurant", "cafe", "bar", "bakery"],
    "food_restaurant": ["restaurant"],
    "food_cafe":       ["cafe", "bakery"],
    "food_bar":        ["bar"],
    "food_fastfood":   ["meal_takeaway"],
    # shopping sub-filters
    "shopping_all":         ["shopping_mall", "department_store", "supermarket", "clothing_store",
                             "electronics_store", "furniture_store", "shoe_store", "book_store",
                             "jewelry_store", "hardware_store", "convenience_store", "store"],
    "shopping_mall":        ["shopping_mall", "department_store"],
    "shopping_grocery":     ["supermarket", "convenience_store", "grocery_or_supermarket"],
    "shopping_fashion":     ["clothing_store", "shoe_store"],
    "shopping_electronics": ["electronics_store"],
    "shopping_home":        ["furniture_store", "hardware_store", "home_goods_store"],
    # other categories
    "sights":  ["tourist_attraction", "museum", "art_gallery"],
    "hotels":  ["lodging"],
}

places_router = APIRouter(prefix="/api", tags=["places"])


@places_router.get("/places")
async def get_nearby_places(
    lat: float = Query(...),
    lng: float = Query(...),
    category: str = Query(...),
    sub: str = Query("all"),
    radius: int = Query(1000, ge=100, le=50000),
    current_user: User = Depends(get_current_user),
):
    """Proxy Google Places Nearby Search — keeps the API key server-side."""
    key = settings.GOOGLE_MAPS_API_KEY
    if not key or key.startswith("AIza...") or len(key) < 10:
        raise HTTPException(status_code=503, detail="Google Maps API key not configured")

    # Resolve type list — food and shopping have sub-filters
    SUB_CATS = {"food", "shopping"}
    map_key = f"{category}_{sub}" if category in SUB_CATS else category
    place_types = PLACES_TYPE_MAP.get(map_key, [])
    if not place_types:
        raise HTTPException(status_code=400, detail=f"Unknown category: {category}")

    # Fetch each type in parallel (deduplicate by place_id)
    async def fetch_type(client: httpx.AsyncClient, ptype: str):
        r = await client.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            params={
                "location": f"{lat},{lng}",
                "radius": radius,
                "type": ptype,
                "key": key,
            },
            timeout=10,
        )
        return r.json().get("results", [])

    async with httpx.AsyncClient() as client:
        results_list = await asyncio.gather(*[fetch_type(client, t) for t in place_types])

    # Merge & deduplicate
    seen = set()
    merged = []
    for results in results_list:
        for place in results:
            pid = place.get("place_id")
            if pid and pid not in seen:
                seen.add(pid)
                merged.append(place)

    # Normalise to a simple shape the frontend can use
    def normalise(p):
        loc = p.get("geometry", {}).get("location", {})
        hours = p.get("opening_hours", {})
        return {
            "name":      p.get("name", ""),
            "lat":       loc.get("lat"),
            "lng":       loc.get("lng"),
            "address":   p.get("vicinity", ""),
            "rating":    p.get("rating"),
            "open_now":  hours.get("open_now"),
            "types":     p.get("types", []),
            "place_id":  p.get("place_id", ""),
            "icon":      p.get("icon", ""),
        }

    return [normalise(p) for p in merged if normalise(p)["lat"]]


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in km between two GPS coordinates."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("", response_model=List[ObjectResponse])
def get_objects(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: float = 5.0,
    db: Session = Depends(get_db),
):
    objects = db.query(TouristObject).all()

    if lat is not None and lng is not None:
        nearby = []
        for obj in objects:
            if obj.latitude and obj.longitude:
                dist = haversine_distance(lat, lng, float(obj.latitude), float(obj.longitude))
                if dist <= radius:
                    nearby.append(obj)
        return nearby

    return objects


@router.get("/{object_id}", response_model=ObjectResponse)
def get_object(object_id: int, db: Session = Depends(get_db)):
    obj = db.query(TouristObject).filter(TouristObject.id == object_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Object not found")
    return obj


@router.post("", response_model=ObjectResponse)
def create_object(
    data: ObjectCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    obj = TouristObject(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{object_id}", response_model=ObjectResponse)
def update_object(
    object_id: int,
    data: ObjectCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    obj = db.query(TouristObject).filter(TouristObject.id == object_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Object not found")
    for key, value in data.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{object_id}")
def delete_object(
    object_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    obj = db.query(TouristObject).filter(TouristObject.id == object_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Object not found")
    db.delete(obj)
    db.commit()
    return {"message": "Deleted"}
