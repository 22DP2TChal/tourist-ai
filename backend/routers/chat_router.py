from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from openai import OpenAI
from ..database import get_db
from ..models import Chat, Message, TouristObject
from ..schemas import MessageCreate, MessageResponse, ChatResponse, ChatListItem
from ..auth import get_current_user
from ..models import User
from ..config import settings

router = APIRouter(prefix="/api/chats", tags=["chat"])


def get_openai_client() -> Optional[OpenAI]:
    if not settings.OPENAI_API_KEY:
        return None
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def build_system_prompt(lat: Optional[float], lng: Optional[float], db: Session) -> str:
    location_info = ""
    nearby_objects = ""

    if lat and lng:
        location_info = f"User GPS location: {lat:.6f}, {lng:.6f}\n"
        objects = db.query(TouristObject).all()
        near = []
        import math

        for obj in objects:
            if obj.latitude and obj.longitude:
                dlat = math.radians(float(obj.latitude) - lat)
                dlon = math.radians(float(obj.longitude) - lng)
                a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat)) * math.cos(math.radians(float(obj.latitude))) * math.sin(dlon / 2) ** 2
                dist = 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                if dist <= 5:
                    near.append(f"- {obj.nosaukums} ({dist:.2f}km): {obj.iss_apraksts or ''}")
        if near:
            nearby_objects = "Nearby attractions:\n" + "\n".join(near) + "\n"

    return f"""You are "AI Tourist", a friendly and knowledgeable travel guide assistant.
You help tourists discover and learn about places, history, architecture, and culture.
{location_info}{nearby_objects}
Answer questions about places, streets, history, and attractions.
Be concise, engaging, and informative. Respond in the language the user writes in."""


@router.get("", response_model=List[ChatListItem])
def list_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chats = (
        db.query(Chat)
        .filter(Chat.lietotajs_id == current_user.id)
        .order_by(Chat.izveides_datums.desc())
        .all()
    )
    result = []
    for chat in chats:
        msgs = chat.zinojumi
        last = msgs[-1].saturs[:60] + "..." if msgs and len(msgs[-1].saturs) > 60 else (msgs[-1].saturs if msgs else None)
        result.append(ChatListItem(
            id=chat.id,
            izveides_datums=chat.izveides_datums,
            statuss=chat.statuss,
            message_count=len(msgs),
            last_message=last,
        ))
    return result


@router.post("", response_model=ChatResponse)
def create_chat(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = Chat(lietotajs_id=current_user.id)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


@router.get("/{chat_id}", response_model=ChatResponse)
def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.lietotajs_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.delete("/{chat_id}")
def delete_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.lietotajs_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    db.delete(chat)
    db.commit()
    return {"message": "Chat deleted"}


@router.post("/{chat_id}/messages", response_model=List[MessageResponse])
def send_message(
    chat_id: int,
    msg: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.lietotajs_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if not msg.saturs.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    user_msg = Message(
        chats_id=chat_id,
        lietotajs_id=current_user.id,
        saturs=msg.saturs,
        zinaojuma_tips="user",
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    client = get_openai_client()
    if not client:
        ai_text = "⚠️ OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file."
    else:
        history = (
            db.query(Message)
            .filter(Message.chats_id == chat_id)
            .order_by(Message.nosutisanas_laiks)
            .all()
        )
        messages = [{"role": "system", "content": build_system_prompt(msg.latitude, msg.longitude, db)}]
        for m in history[:-1]:  # exclude the message we just saved
            role = "user" if m.zinaojuma_tips == "user" else "assistant"
            messages.append({"role": role, "content": m.saturs})
        messages.append({"role": "user", "content": msg.saturs})

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=800,
                temperature=0.7,
            )
            ai_text = response.choices[0].message.content
        except Exception as e:
            ai_text = f"⚠️ AI error: {str(e)}"

    ai_msg = Message(
        chats_id=chat_id,
        lietotajs_id=current_user.id,
        saturs=ai_text,
        zinaojuma_tips="ai",
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return [user_msg, ai_msg]
