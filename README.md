# AI Tourist

Kvalifikācijas darba projekts. Tīmekļa lietotne, kas ļauj tūristiem izpētīt pilsētu ar mākslīgā intelekta palīdzību — interaktīva karte, GPS un čats ar AI.

---

## Izmantotās tehnoloģijas

**Backend:** Python 3.13, FastAPI, SQLAlchemy, PostgreSQL, bcrypt, JWT  
**Frontend:** HTML, CSS, JavaScript  
**API:** OpenAI (gpt-4o-mini), Google Maps JavaScript API  
**Infrastruktūra:** Docker (PostgreSQL konteiners)

---

## Kas nepieciešams pirms sākšanas

- [Python 3.11+](https://www.python.org/downloads/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Instalācija

### 1. Lejupielādēt projektu

```bash
git clone https://github.com/TeodorChaly/ai-tourist.git
cd ai-tourist
```

### 2. Izveidot Python vidi un instalēt pakotnes

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### 3. Izveidot .env failu

```bash
cp .env.example .env
```

Atvērt `.env` un aizpildīt:

```env
DATABASE_URL=postgresql://postgres:password@localhost/ai_tourist
SECRET_KEY=               # ģenerēt: python3 -c "import secrets; print(secrets.token_hex(32))"
OPENAI_API_KEY=           # platform.openai.com → API Keys
GOOGLE_MAPS_API_KEY=      # console.cloud.google.com → Maps JavaScript API
```

### 4. Palaist datu bāzi

Docker Desktop ir jābūt atvērtam.

```bash
docker-compose up db -d
```

### 5. Palaist serveri

```bash
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Atvērt: **http://localhost:8000**

Pirmajā palaišanā automātiski tiek izveidotas tabulas un pievienoti demo objekti (Rīgas apskates vietas).  
Pirmais reģistrētais lietotājs automātiski saņem administratora tiesības.

---

## Ikdienas palaišana

```bash
docker-compose up db -d
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Apstādināt serveri: `Ctrl + C`

---

## Projekta struktūra

```
final_project/
├── backend/
│   ├── main.py              # galvenā lietotne
│   ├── models.py            # datu bāzes tabulas
│   ├── auth.py              # autentifikācija (JWT + bcrypt)
│   ├── routers/
│   │   ├── auth_router.py   # reģistrācija, pieteikšanās
│   │   ├── chat_router.py   # čats ar AI
│   │   ├── maps_router.py   # tūrisma objekti
│   │   └── admin_router.py  # administratora funkcijas
│   └── requirements.txt
├── frontend/
│   ├── index.html           # galvenā lapa (karte + čats)
│   ├── login.html
│   ├── register.html
│   ├── history.html
│   ├── admin.html
│   ├── css/style.css
│   └── js/
│       ├── i18n.js          # EN/LV tulkojumi
│       ├── api.js
│       ├── chat.js
│       └── map.js
├── .env.example
├── docker-compose.yml
└── start.sh
```

---

## Biežākās problēmas

**`Address already in use`** — ports 8000 jau ir aizņemts:
```bash
lsof -ti:8000 | xargs kill -9
```

**Docker nedarbojas** — jāatver Docker Desktop lietotne un jāgaida kamēr palaiž.

**Pārlūks rāda vecu versiju** — `Cmd+Shift+R` (Mac) vai `Ctrl+Shift+R` (Windows).
