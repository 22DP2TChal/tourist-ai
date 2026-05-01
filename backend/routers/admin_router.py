from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Chat, Message
from ..schemas import AdminStats, AdminUserResponse, ChatResponse
from ..auth import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


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
