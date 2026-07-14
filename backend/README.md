# BridgeGuard AI — Backend (FastAPI)

REST API for the Bridge Load Capacity Prediction & Structural Health
Monitoring system. SQLite by default (swap `DATABASE_URL` for a Postgres/MySQL
connection string to move to a real database — the code doesn't change).

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then edit SECRET_KEY at minimum
uvicorn app.main:app --reload --port 8000
```

On first run the app automatically:
- creates `bridgeguard.db` (SQLite file) with all tables
- creates a default admin user: **username `admin` / password `Admin@123`** — change this immediately in a real deployment
- loads `seed_bridge_data.csv` into the database so there's real data to explore

API docs (interactive): http://localhost:8000/docs

## Key endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Get a JWT access token |
| GET | `/auth/me` | Current user info |
| GET | `/bridges` | List bridges (search, filter, sort, paginate) |
| POST | `/bridges` | Create a bridge |
| PUT | `/bridges/{id}` | Update a bridge |
| DELETE | `/bridges/{id}` | Delete a bridge |
| POST | `/bridges/csv/upload` | Upload a CSV to bulk-add/update bridges |
| POST | `/predictions/run` | Run the risk/health scoring engine for a bridge |
| GET | `/predictions/history` | Past predictions |
| GET | `/analytics/summary` | Aggregate stats for charts |
| GET | `/notifications` | Recent notifications |

## About the "prediction" engine

There's no labelled failure dataset to train a real ML classifier on, so
`app/prediction_engine.py` implements a transparent, documented rule-based
scoring formula from the structural fields in the CSV (load ratio, age,
stress, crack width, corrosion, vibration). It's wired through the same API
shape a trained model would use — swapping in a real model later only means
changing the inside of `run_prediction()`, not the API or frontend.

## Roles

- **admin** — full access, including delete and user management
- **inspector** — can create/update bridges, upload CSV, run predictions
- **viewer** — read-only

## CSV format

The uploader is tolerant of header naming (case/spacing insensitive) and
matches the original dashboard's columns: `BridgeID, Location, Type, Age,
Span_m, Width_m, Material, CurrentLoad_kN, DesignCapacity_kN, YearBuilt,
NoOfSpans, Latitude, Longitude, Temperature_C, Humidity_pct, Stress_MPa,
Strain_micro, Vibration_Hz, CrackWidth_mm, Corrosion, LastInspection,
NextInspection`. Only `BridgeID` is required — everything else is optional.
