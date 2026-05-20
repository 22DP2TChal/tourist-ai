from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
from datetime import datetime
import json

from ..config import settings

router = APIRouter(prefix="/api", tags=["planner"])
client = OpenAI(api_key=settings.OPENAI_API_KEY)


class DayPlanRequest(BaseModel):
    lat: float
    lng: float
    address: str
    places: List[str]       # e.g. ["Museums", "Parks", "Landmarks"]
    hours: int              # total hours to spend
    food: str               # e.g. "Local", "Asian", "No preference"
    shopping: str           # "Yes" or "No"
    radius: int             # km: 1, 2, or 5


@router.post("/day-plan")
def generate_day_plan(req: DayPlanRequest):
    now = datetime.now()
    time_str = now.strftime("%H:%M")
    day_str = now.strftime("%A, %B %d %Y")

    places_str = ", ".join(req.places) if req.places else "any interesting spots"
    shopping_str = "Include one shopping stop." if req.shopping == "Yes" else "No shopping needed."
    food_str = (
        f"For meals, the user prefers {req.food} cuisine."
        if req.food != "No preference"
        else "Any type of food/restaurant is fine."
    )

    system_prompt = (
        "You are an expert local tour guide and day-planner. "
        "Given a traveller's current location, current time, and preferences, "
        "create a detailed day itinerary using REAL, well-known places that exist at the given location. "
        "Return ONLY valid JSON — an object with a 'stops' key containing an array of stop objects. "
        "Each stop must have exactly these fields:\n"
        "  time        (string, e.g. '10:30')\n"
        "  name        (string — EXACT real place name as it appears on Google Maps, e.g. 'Brīvības piemineklis' or 'Café Osiris')\n"
        "  address     (string — street address or short description of location, e.g. 'Brīvības bulvāris, Rīga')\n"
        "  type        (one of: 'attraction', 'food', 'shopping', 'transport', 'break')\n"
        "  duration    (string, e.g. '45 min')\n"
        "  description (string — 1-2 sentences about the place)\n"
        "  emoji       (single emoji representing the stop)\n"
        "  tip         (string — a short practical tip for this stop)\n"
        "IMPORTANT: Only use real places that actually exist and can be found on Google Maps. "
        "Use the most commonly known name for each place. "
        "Space stops realistically given walking/transit time. "
        "Always include at least one meal stop. "
        "Output must be a JSON object with a 'stops' array — no markdown, no extra text."
    )

    user_prompt = (
        f"Location: {req.address} (lat {req.lat}, lng {req.lng})\n"
        f"Current time: {time_str} on {day_str}\n"
        f"Available hours: {req.hours} hours\n"
        f"Places of interest: {places_str}\n"
        f"{food_str}\n"
        f"{shopping_str}\n"
        f"Search radius: {req.radius} km from current location\n\n"
        "Create the best possible day itinerary starting from now."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=1200,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content.strip()
        data = json.loads(raw)

        # GPT sometimes wraps array in an object key
        if isinstance(data, dict):
            # try common keys
            for key in ("stops", "itinerary", "plan", "schedule", "day_plan"):
                if key in data and isinstance(data[key], list):
                    data = data[key]
                    break
            else:
                # take the first list value found
                for v in data.values():
                    if isinstance(v, list):
                        data = v
                        break
                else:
                    raise ValueError("No array found in GPT response")

        return {"stops": data}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
