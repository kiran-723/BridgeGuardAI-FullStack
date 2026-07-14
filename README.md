# BridgeGuard AI — Bridge Load Capacity Prediction & Structural Health Monitoring

A full-stack rebuild of the original static HTML/CSS/JS dashboard:

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Python + FastAPI
- **Database:** SQLite (file-based; swap the connection string for Postgres/MySQL later without touching app code)
- **Auth:** JWT-based login with role-based access (admin / inspector / viewer)
- **CSV:** upload replaces/updates data in the database — nothing is hardcoded in the frontend

## Quick start

Two servers, run in separate terminals.

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 and log in with `admin` / `Admin@123` (change this immediately for anything beyond a demo).

## What's included in this pass

- Login (JWT), session handling, logout, role-based permissions
- Dashboard with live KPI cards and charts
- Bridge Management: search, filter, sort, pagination, add/edit/delete, CSV upload
- Structural Health Monitoring: per-bridge sensor reading cards
- Prediction: risk/health scoring engine, result display, print-to-PDF, history log
- Analytics: charts generated dynamically from whatever is in the database
- Notification Center: auto-generated on CSV upload and high-risk predictions
- Responsive layout, loading/skeleton states, empty states

## What's honestly NOT included yet

The original brief asked for a much larger surface area (landing page, help/FAQ,
about/contact pages, Google Maps integration, PDF/Excel export, dark mode,
bridge photo galleries, forgot-password email flow, multi-tenant org
management, etc.). Building all of that to genuine production quality in one
pass wasn't realistic, so this delivers a solid, working core end-to-end
instead of a large surface of half-finished pages. Happy to build out any of
the above in a follow-up — the architecture (DB models, auth, API structure)
is already in place to extend from.

There's also no real trained machine-learning model behind the "prediction" —
the original dataset has no labelled outcomes to train one against. Instead,
`backend/app/prediction_engine.py` is a transparent, documented rule-based
formula over the structural fields (load ratio, age, stress, crack width,
corrosion, vibration). It's wired through the same API shape a real model
would use, so swapping one in later is a contained change.

## A note on how this was built

This was built and syntax-checked in a sandboxed environment without internet
access, so I could not run `pip install` / `npm install` or boot the servers
to test them live end-to-end here. The code has been reviewed carefully and
passed static syntax checks (Python `py_compile` on every backend file,
`esbuild` parse checks on every frontend file), but you should still run
through the Quick Start steps above yourself and let me know if anything
breaks — I'm glad to fix it. If you'd rather I run and test it directly, you
can enable network access for this environment and I can install
dependencies and boot both servers here.
## Installation

### Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python -m uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

### Open in Browser

Frontend:
http://localhost:5173

Backend API:
http://127.0.0.1:8000/docs