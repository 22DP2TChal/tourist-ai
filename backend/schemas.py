from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    epasts: EmailStr
    parole: str
    valoda: str = "en"


class UserLogin(BaseModel):
    epasts: EmailStr
    parole: str


class UserResponse(BaseModel):
    id: int
    epasts: str
    valoda: str
    registracijas_datums: datetime
    is_admin: int

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class MessageCreate(BaseModel):
    saturs: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


class MessageResponse(BaseModel):
    id: int
    saturs: str
    nosutisanas_laiks: datetime
    zinaojuma_tips: str
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    id: int
    izveides_datums: datetime
    statuss: str
    zinojumi: List[MessageResponse] = []

    model_config = {"from_attributes": True}


class ChatListItem(BaseModel):
    id: int
    izveides_datums: datetime
    statuss: str
    message_count: int = 0
    last_message: Optional[str] = None

    model_config = {"from_attributes": True}


class ObjectCreate(BaseModel):
    nosaukums: str
    iss_apraksts: Optional[str] = None
    lokacijas_vieta: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    kategorija: str = "attraction"


class ObjectResponse(BaseModel):
    id: int
    nosaukums: str
    iss_apraksts: Optional[str] = None
    lokacijas_vieta: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    kategorija: str

    model_config = {"from_attributes": True}


class CountryCreate(BaseModel):
    name:        str
    code:        str
    prompt:      str = ""
    description: str = ""


class CountryResponse(BaseModel):
    id:          int
    name:        str
    code:        str
    prompt:      str = ""
    description: str = ""
    created_at:  datetime

    model_config = {"from_attributes": True}


class AdminStats(BaseModel):
    total_users: int
    total_chats: int
    total_messages: int
    active_chats: int


class AdminUserResponse(BaseModel):
    id: int
    epasts: str
    valoda: str
    registracijas_datums: datetime
    is_admin: int
    chat_count: int = 0

    model_config = {"from_attributes": True}
