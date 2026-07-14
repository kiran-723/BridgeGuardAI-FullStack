import datetime as dt

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    full_name = Column(String(128), nullable=False, default="")
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, default="admin")  # admin | inspector | viewer
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=dt.datetime.utcnow)


class Bridge(Base):
    __tablename__ = "bridges"

    id = Column(Integer, primary_key=True, index=True)
    bridge_id = Column(String(64), unique=True, index=True, nullable=False)  # e.g. B-1024
    name = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    type = Column(String(64), nullable=True)          # Beam Bridge, Suspension, Arch, ...
    material = Column(String(64), nullable=True)
    age = Column(Integer, nullable=True)
    span_m = Column(Float, nullable=True)
    width_m = Column(Float, nullable=True)
    current_load_kn = Column(Float, nullable=True)
    design_capacity_kn = Column(Float, nullable=True)
    year_built = Column(Integer, nullable=True)
    no_of_spans = Column(Integer, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    stress_mpa = Column(Float, nullable=True)
    strain_micro = Column(Float, nullable=True)
    vibration_hz = Column(Float, nullable=True)
    crack_width_mm = Column(Float, nullable=True)
    corrosion = Column(String(32), nullable=True)      # Low / Medium / High
    last_inspection = Column(String(32), nullable=True)
    next_inspection = Column(String(32), nullable=True)
    status = Column(String(32), nullable=True, default="Safe")  # Safe / Warning / Critical
    image_path = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    predictions = relationship("Prediction", back_populates="bridge", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    bridge_id = Column(Integer, ForeignKey("bridges.id"), nullable=False)

    health_score = Column(Float, nullable=False)
    risk_percentage = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    remaining_life_years = Column(Float, nullable=False)
    failure_probability = Column(Float, nullable=False)
    recommendation = Column(Text, nullable=False)
    risk_level = Column(String(32), nullable=False)  # Low / Medium / High / Critical

    created_at = Column(DateTime, default=dt.datetime.utcnow)

    bridge = relationship("Bridge", back_populates="predictions")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    level = Column(String(32), nullable=False, default="info")  # info | warning | critical
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
