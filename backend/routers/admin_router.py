from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..database import get_db, engine as _db_engine
from ..models import User, Chat, Message, AppSettings
from ..schemas import AdminStats, AdminUserResponse, ChatResponse
from ..auth import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── App Settings helpers ───────────────────────────────────────────────────────

class SettingsUpdate(BaseModel):
    default_category: str = ""
    default_city: str = "Riga, Latvia"
    default_lat: float = 56.953218
    default_lng: float = 24.104180

# Create app_settings table if missing (works for PostgreSQL + SQLite)
try:
    with _db_engine.begin() as _conn:
        AppSettings.__table__.create(_conn, checkfirst=True)
except Exception:
    pass


def get_or_create_settings(db: Session) -> AppSettings:
    try:
        s = db.query(AppSettings).first()
    except Exception:
        db.rollback()
        s = db.query(AppSettings).first()
    if not s:
        s = AppSettings()
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    """Public — map.js and admin read default settings."""
    return get_or_create_settings(db)


@router.put("/settings")
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


@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return AdminStats(
        total_users=db.query(User).count(),
        total_chats=db.query(Chat).count(),
        total_messages=db.query(Message).count(),
        active_chats=db.query(Chat).filter(Chat.statuss == "active").count(),
    )


@router.get("/users", response_model=List[AdminUserResponse])
def get_users(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    users = db.query(User).all()
    result = []
    for u in users:
        result.append(AdminUserResponse(
            id=u.id,
            epasts=u.epasts,
            valoda=u.valoda,
            registracijas_datums=u.registracijas_datums,
            is_admin=u.is_admin,
            chat_count=len(u.chats),
        ))
    return result


@router.put("/users/{user_id}/toggle-admin")
def toggle_admin(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own admin status")
    user.is_admin = 0 if user.is_admin else 1
    db.commit()
    return {"is_admin": user.is_admin}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/chats", response_model=List[ChatResponse])
def get_all_chats(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    return (
        db.query(Chat)
        .order_by(Chat.izveides_datums.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
