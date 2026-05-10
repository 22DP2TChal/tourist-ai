from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import Response as FastAPIResponse
from openai import OpenAI
from pydantic import BaseModel
from io import BytesIO
from typing import Optional
import base64, math, re
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..models import User, TouristObject
from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/api", tags=["voice"])


def get_openai_client():
    if not settings.OPENAI_API_KEY:
        return None
    return OpenAI(api_key=settings.OPENAI_API_KEY)


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    client = get_openai_client()
    if not client:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    # Determine a safe filename with correct extension for Whisper
    mime = audio.content_type or "audio/webm"
    if "ogg" in mime:
        ext = "ogg"
    elif "mp4" in mime or "m4a" in mime:
        ext = "mp4"
    elif "wav" in mime:
        ext = "wav"
    else:
        ext = "webm"   # Chrome default

    filename = f"voice.{ext}"

    try:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, BytesIO(audio_bytes), mime),
        )
        return {"text": transcript.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")


# ── Live AI: analyze camera frame ────────────────────────────────────────────

def _nearby_info(lat: float, lng: float, db: Session) -> str:
    objects = db.query(TouristObject).all()
    near = []
    for obj in objects:
        if obj.latitude and obj.longitude:
            dlat = math.radians(float(obj.latitude) - lat)
            dlon = math.radians(float(obj.longitude) - lng)
            a = (math.sin(dlat / 2) ** 2
                 + math.cos(math.radians(lat))
                 * math.cos(math.radians(float(obj.latitude)))
                 * math.sin(dlon / 2) ** 2)
            dist = 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            if dist <= 1.0:
                near.append(f"- {obj.nosaukums} ({dist:.2f} km): {obj.iss_apraksts or ''}")
    return "\n".join(near)


@router.post("/live-analyze")
async def live_analyze(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(default=None),
    longitude: Optional[float] = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = get_openai_client()
    if not client:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image")

    mime = image.content_type or "image/jpeg"
    image_b64 = base64.b64encode(image_bytes).decode()

    # Build context-aware system prompt
    location_block = ""
    nearby_block = ""
    if latitude and longitude:
        location_block = f"User GPS: {latitude:.6f}, {longitude:.6f}\n"
        nearby = _nearby_info(latitude, longitude, db)
        if nearby:
            nearby_block = f"Landmarks within 1 km:\n{nearby}\n"

    system = (
        "You are an AI tourist guide with vision. "
        "The user is pointing their camera at something. "
        "Identify what you see and give brief, engaging tourist information "
        "(2-4 sentences). If it's a landmark, building, street, or natural feature — "
        "share its history or significance. If it's something ordinary, just describe it helpfully. "
        f"{location_block}{nearby_block}"
        "Respond in the same language the surroundings suggest, "
        "or default to English."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": [
                    {"type": "text", "text": "What do you see? Give me tourist info."},
                    {"type": "image_url", "image_url": {
                        "url": f"data:{mime};base64,{image_b64}",
                        "detail": "low",
                    }},
                ]},
            ],
            max_tokens=350,
            temperature=0.6,
        )
        return {"text": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


# ── TTS: OpenAI text-to-speech ────────────────────────────────────────────────

class TTSRequest(BaseModel):
    text: str
    voice: str = "nova"   # alloy | echo | fable | onyx | nova | shimmer


def _strip_markdown(text: str) -> str:
    """Remove markdown so it isn't read aloud by TTS."""
    text = re.sub(r'#{1,6}\s', '', text)
    text = re.sub(r'[*_`~]', '', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'\n{2,}', '. ', text)
    text = re.sub(r'\n', ' ', text)
    return text.strip()


@router.post("/tts")
async def text_to_speech(
    req: TTSRequest,
    current_user: User = Depends(get_current_user),
):
    client = get_openai_client()
    if not client:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")

    clean = _strip_markdown(req.text)
    if not clean:
        raise HTTPException(status_code=400, detail="Empty text")

    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice=req.voice,
            input=clean,
        )
        return FastAPIResponse(
            content=response.content,
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-store"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")
