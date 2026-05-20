from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import AppSettings
from ..auth import get_admin_user
from ..models import User

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    default_category: str
    default_city: str
    default_lat: float
    default_lng: float

def get_or_create_settings(db: Session) -> AppSettings:
    s = db.query(AppSettings).first()
    if not s:
        s = AppSettings()
        db.add(s)
        db.commit()
        db.refresh(s)
    return s

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    """Public — frontend reads this to get defaults"""
    return get_or_create_settings(db)

@router.put("")
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    s = get_or_create_settings(db)
    s.default_category = data.default_category
    s.default_city = data.default_city
    s.default_lat = data.default_lat
    s.default_lng = data.default_lng
    db.commit()
    db.refresh(s)
    return s
