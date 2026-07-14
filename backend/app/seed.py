"""
Runs once on startup:
  1. Creates a default admin user if the users table is empty.
  2. Loads the bundled seed_bridge_data.csv into the bridges table if it's empty,
     so the app has real (if illustrative) data to explore on first run.

This is NOT hardcoded application data baked into the frontend -- it's a
one-time DB seed, same as any real backend would ship a demo dataset. Once
running, all data comes from the database and can be replaced entirely via
CSV upload or the Bridge Management CRUD screens.
"""
import os

from sqlalchemy.orm import Session

from .config import settings
from .database import SessionLocal
from . import models, auth, csv_import
from .prediction_engine import run_prediction, status_from_risk

SEED_CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "seed_bridge_data.csv")


def run_seed_if_needed():
    db: Session = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            admin = models.User(
                username=settings.default_admin_username,
                full_name=settings.default_admin_full_name,
                hashed_password=auth.hash_password(settings.default_admin_password),
                role="admin",
            )
            db.add(admin)
            db.commit()
            print(f"[seed] Created default admin user '{settings.default_admin_username}'.")

        if db.query(models.Bridge).count() == 0 and os.path.exists(SEED_CSV_PATH):
            with open(SEED_CSV_PATH, "rb") as f:
                content = f.read()
            try:
                df, _ = csv_import.parse_csv_bytes(content)
                inserted, updated, skipped, errors = csv_import.upsert_bridges_from_dataframe(db, df)
                for bridge in db.query(models.Bridge).all():
                    result = run_prediction(bridge)
                    bridge.status = status_from_risk(result["risk_percentage"])
                db.commit()
                print(f"[seed] Loaded seed CSV: {inserted} inserted, {updated} updated.")
            except ValueError as exc:
                print(f"[seed] Skipped seed CSV load: {exc}")
    finally:
        db.close()
