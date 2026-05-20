from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    epasts = Column(String(100), unique=True, index=True, nullable=False)
    parole = Column(String(255), nullable=False)
    valoda = Column(String(20), default="en")
    registracijas_datums = Column(DateTime, server_default=func.now())
    is_admin = Column(Integer, default=0)

    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    zinojumi = relationship("Message", back_populates="user")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    lietotajs_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    izveides_datums = Column(DateTime, server_default=func.now())
    statuss = Column(String(20), default="active")

    user = relationship("User", back_populates="chats")
    zinojumi = relationship("Message", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chats_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    lietotajs_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    saturs = Column(Text, nullable=False)
    nosutisanas_laiks = Column(DateTime, server_default=func.now())
    zinaojuma_tips = Column(String(20), default="user")  # "user" or "ai"
    image_url = Column(String(255), nullable=True)

    chat = relationship("Chat", back_populates="zinojumi")
    user = relationship("User", back_populates="zinojumi")


class Country(Base):
    __tablename__ = "countries"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(150), nullable=False)
    code        = Column(String(10),  unique=True, index=True, nullable=False)  # ISO 3166-1 alpha-2, e.g. "lv"
    prompt      = Column(Text, default="")       # admin-written prompt for AI generation
    description = Column(Text, default="")       # AI-generated country description shown to users
    created_at  = Column(DateTime, server_default=func.now())


class TouristObject(Base):
    __tablename__ = "objects"

    id = Column(Integer, primary_key=True, index=True)
    nosaukums = Column(String(150), nullable=False)
    iss_apraksts = Column(Text)
    lokacijas_vieta = Column(String(255))
    latitude = Column(String(30))
    longitude = Column(String(30))
    kategorija = Column(String(50), default="attraction")


class AppSettings(Base):
    __tablename__ = "app_settings"
    id               = Column(Integer, primary_key=True)
    default_category = Column(String(50), default="sights")   # POI category: food/sights/shopping/hotels/""
    default_city     = Column(String(150), default="Riga, Latvia")
    default_lat      = Column(Float, default=56.953218)
    default_lng      = Column(Float, default=24.104180)
    updated_at       = Column(DateTime, server_default=func.now(), onupdate=func.now())
