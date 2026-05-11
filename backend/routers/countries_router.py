from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from openai import OpenAI

from ..database import get_db
from ..models import Country
from ..schemas import CountryCreate, CountryResponse
from ..auth import get_current_user, get_admin_user
from ..models import User
from ..config import settings

router = APIRouter(prefix="/api/countries", tags=["countries"])
client = OpenAI(api_key=settings.OPENAI_API_KEY)


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("/by-code/{code}", response_model=CountryResponse)
def get_country_by_code(code: str, db: Session = Depends(get_db)):
    """Called by the frontend to get the description for the user's detected country."""
    country = db.query(Country).filter(Country.code == code.lower()).first()
    if not country or not country.description:
        raise HTTPException(status_code=404, detail="No description for this country")
    return country


# ── Admin CRUD ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[CountryResponse])
def list_countries(
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    return db.query(Country).order_by(Country.name).all()


@router.post("", response_model=CountryResponse)
def create_country(
    data:  CountryCreate,
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user),
):
    existing = db.query(Country).filter(Country.code == data.code.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Country code already exists")
    country = Country(**{**data.model_dump(), "code": data.code.lower()})
    db.add(country)
    db.commit()
    db.refresh(country)
    return country


@router.put("/{country_id}", response_model=CountryResponse)
def update_country(
    country_id: int,
    data:       CountryCreate,
    db:         Session = Depends(get_db),
    admin:      User    = Depends(get_admin_user),
):
    country = db.query(Country).filter(Country.id == country_id).first()
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    for key, value in data.model_dump().items():
        setattr(country, key, value.lower() if key == "code" else value)
    db.commit()
    db.refresh(country)
    return country


@router.delete("/{country_id}")
def delete_country(
    country_id: int,
    db:         Session = Depends(get_db),
    admin:      User    = Depends(get_admin_user),
):
    country = db.query(Country).filter(Country.id == country_id).first()
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    db.delete(country)
    db.commit()
    return {"message": "Deleted"}


# ── AI generation ─────────────────────────────────────────────────────────────

@router.post("/{country_id}/generate", response_model=CountryResponse)
def generate_description(
    country_id: int,
    db:         Session = Depends(get_db),
    admin:      User    = Depends(get_admin_user),
):
    country = db.query(Country).filter(Country.id == country_id).first()
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    if not country.prompt:
        raise HTTPException(status_code=400, detail="Prompt is empty — add a prompt first")

    system = (
        "You are a travel writer. Write an engaging, friendly welcome description "
        "for tourists visiting this country. Be informative but concise (3-5 sentences). "
        "Include a cultural highlight and a practical tip."
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": country.prompt},
        ],
        temperature=0.8,
        max_tokens=300,
    )

    country.description = response.choices[0].message.content.strip()
    db.commit()
    db.refresh(country)
    return country
