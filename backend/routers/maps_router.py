from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import math
from ..database import get_db
from ..models import TouristObject
from ..schemas import ObjectCreate, ObjectResponse
from ..auth import get_current_user, get_admin_user
from ..models import User

router = APIRouter(prefix="/api/objects", tags=["maps"])


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
