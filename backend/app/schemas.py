import datetime as dt
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


# ---------- Auth ----------

class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    username: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    full_name: str
    role: str


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str = ""
    role: str = "viewer"


# ---------- Bridges ----------

class BridgeBase(BaseModel):
    bridge_id: str
    name: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    material: Optional[str] = None
    age: Optional[int] = None
    span_m: Optional[float] = None
    width_m: Optional[float] = None
    current_load_kn: Optional[float] = None
    design_capacity_kn: Optional[float] = None
    year_built: Optional[int] = None
    no_of_spans: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    stress_mpa: Optional[float] = None
    strain_micro: Optional[float] = None
    vibration_hz: Optional[float] = None
    crack_width_mm: Optional[float] = None
    corrosion: Optional[str] = None
    last_inspection: Optional[str] = None
    next_inspection: Optional[str] = None
    status: Optional[str] = "Safe"
    image_path: Optional[str] = None


class BridgeCreate(BridgeBase):
    pass


class BridgeUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    material: Optional[str] = None
    age: Optional[int] = None
    span_m: Optional[float] = None
    width_m: Optional[float] = None
    current_load_kn: Optional[float] = None
    design_capacity_kn: Optional[float] = None
    year_built: Optional[int] = None
    no_of_spans: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    stress_mpa: Optional[float] = None
    strain_micro: Optional[float] = None
    vibration_hz: Optional[float] = None
    crack_width_mm: Optional[float] = None
    corrosion: Optional[str] = None
    last_inspection: Optional[str] = None
    next_inspection: Optional[str] = None
    status: Optional[str] = None
    image_path: Optional[str] = None


class BridgeOut(BridgeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: dt.datetime
    updated_at: dt.datetime


class PaginatedBridges(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[BridgeOut]


# ---------- Predictions ----------

class PredictionRequest(BaseModel):
    bridge_id: int


class PredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    bridge_id: int
    health_score: float
    risk_percentage: float
    confidence_score: float
    remaining_life_years: float
    failure_probability: float
    recommendation: str
    risk_level: str
    created_at: dt.datetime


# ---------- Analytics ----------

class AnalyticsSummary(BaseModel):
    total_bridges: int
    status_counts: dict
    material_counts: dict
    type_counts: dict
    corrosion_counts: dict
    avg_health_score: float
    avg_risk_percentage: float
    avg_load_capacity: float
    age_distribution: dict
    total_predictions: int


# ---------- Notifications ----------

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    message: str
    level: str
    is_read: int
    created_at: dt.datetime


# ---------- CSV upload ----------

class CSVUploadResult(BaseModel):
    inserted: int
    updated: int
    skipped_rows: int
    errors: List[str]
