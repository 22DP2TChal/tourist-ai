from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
import os

from .database import engine, Base
from .models import User, Chat, Message, TouristObject, AppSettings
from .routers import auth_router, chat_router, maps_router, admin_router, voice_router, planner_router
from .routers.maps_router import places_router
from .routers import countries_router, settings_router
from .config import settings

Base.metadata.create_all(bind=engine)

# Add image_url column if upgrading from older version
from sqlalchemy import text
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE messages ADD COLUMN image_url VARCHAR(255)"))
        conn.commit()
except Exception:
    pass  # column already exists

app = FastAPI(title="AI Tourist API", version="1.0.0")

_frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    # API routes keep JSON errors
    if request.url.path.startswith("/api"):
        return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
    # All other 404s → custom page
    if exc.status_code == 404:
        page_404 = os.path.join(_frontend_path, "404.html")
        if os.path.exists(page_404):
            return FileResponse(page_404, status_code=404)
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(chat_router.router)
app.include_router(maps_router.router)
app.include_router(places_router)
app.include_router(admin_router.router)
app.include_router(voice_router.router)
app.include_router(countries_router.router)
app.include_router(planner_router.router)
app.include_router(settings_router.router)


@app.get("/api/config")
def get_config():
    return {"google_maps_key": settings.GOOGLE_MAPS_API_KEY}


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


# Seed demo Riga attractions if database is empty
@app.on_event("startup")
def seed_data():
    from .database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(TouristObject).count() == 0:
            demo_objects = [
                TouristObject(nosaukums="Brīvības piemineklis", iss_apraksts="Freedom Monument — the symbol of Latvia's independence, built in 1935. The 42-meter monument features the allegorical figure 'Milda' holding three stars.", lokacijas_vieta="Brīvības bulvāris, Rīga", latitude="56.9513", longitude="24.1134", kategorija="monument"),
                TouristObject(nosaukums="Rīgas Doms", iss_apraksts="Riga Cathedral — one of the largest medieval churches in the Baltic states, founded in 1211. Houses one of the largest pipe organs in the world.", lokacijas_vieta="Doma laukums 1, Rīga", latitude="56.9490", longitude="24.1035", kategorija="church"),
                TouristObject(nosaukums="Melngalvju nams", iss_apraksts="House of the Blackheads — a magnificent Gothic building rebuilt in 2001. Originally built in the 14th century for the Brotherhood of Blackheads, a guild of unmarried merchants.", lokacijas_vieta="Rātslaukums 7, Rīga", latitude="56.9477", longitude="24.1063", kategorija="historic"),
                TouristObject(nosaukums="Sv. Pētera baznīca", iss_apraksts="St. Peter's Church — one of the tallest medieval buildings in Europe. The 123-meter spire offers a panoramic view of Riga's Old Town.", lokacijas_vieta="Skarņu iela 19, Rīga", latitude="56.9470", longitude="24.1074", kategorija="church"),
                TouristObject(nosaukums="Rīgas pils", iss_apraksts="Riga Castle — built in 1330 by the Livonian Order. Today serves as the official residence of the President of Latvia.", lokacijas_vieta="Pils laukums 3, Rīga", latitude="56.9512", longitude="24.1013", kategorija="castle"),
                TouristObject(nosaukums="Alberta iela", iss_apraksts="Alberta Street — world-famous Art Nouveau street, one of the finest collections of Jugendstil architecture in Europe, designed by Mikhail Eisenstein.", lokacijas_vieta="Alberta iela, Rīga", latitude="56.9598", longitude="24.1202", kategorija="street"),
                TouristObject(nosaukums="Centrāltirgus", iss_apraksts="Riga Central Market — one of the largest markets in Europe, built in former zeppelin hangars in 1930. A UNESCO World Heritage Site.", lokacijas_vieta="Nēģu iela 7, Rīga", latitude="56.9435", longitude="24.1147", kategorija="market"),
                TouristObject(nosaukums="Latvijas Nacionālā opera", iss_apraksts="Latvian National Opera — built in 1782, one of the oldest opera houses in Northern Europe. A neoclassical landmark in the heart of Riga.", lokacijas_vieta="Aspazijas bulvāris 3, Rīga", latitude="56.9509", longitude="24.1107", kategorija="theater"),
                TouristObject(nosaukums="Trīs brāļi", iss_apraksts="Three Brothers — the oldest complex of residential buildings in Riga, representing architecture from the 15th to the 17th century.", lokacijas_vieta="Mazā Pils iela 17-21, Rīga", latitude="56.9500", longitude="24.1030", kategorija="historic"),
                TouristObject(nosaukums="Latvijas Nacionālais mākslas muzejs", iss_apraksts="Latvian National Museum of Art — founded in 1905, the largest art museum in Latvia with over 52,000 works of art.", lokacijas_vieta="K. Valdemāra iela 10a, Rīga", latitude="56.9555", longitude="24.1143", kategorija="museum"),
            ]
            db.add_all(demo_objects)
            db.commit()
    finally:
        db.close()


# Serve uploaded images
uploads_path = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

# Serve frontend static files
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

    @app.get("/")
    def serve_root():
        return FileResponse(os.path.join(frontend_path, "index.html"))

    @app.get("/{page}.html")
    def serve_page(page: str):
        file_path = os.path.join(frontend_path, f"{page}.html")
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_path, "404.html"), status_code=404)
