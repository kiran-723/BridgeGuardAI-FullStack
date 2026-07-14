from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _age_bucket(age):
    if age is None:
        return "Unknown"
    if age < 10:
        return "0-9"
    if age < 20:
        return "10-19"
    if age < 30:
        return "20-29"
    if age < 40:
        return "30-39"
    if age < 50:
        return "40-49"
    return "50+"


@router.get("/summary", response_model=schemas.AnalyticsSummary)
def summary(db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    bridges = db.query(models.Bridge).all()
    predictions = db.query(models.Prediction).all()

    total_bridges = len(bridges)

    status_counts = Counter((b.status or "Unknown") for b in bridges)
    material_counts = Counter((b.material or "Unknown") for b in bridges)
    type_counts = Counter((b.type or "Unknown") for b in bridges)
    corrosion_counts = Counter((b.corrosion or "Unknown") for b in bridges)
    age_distribution = Counter(_age_bucket(b.age) for b in bridges)

    latest_by_bridge = {}
    for p in predictions:
        if p.bridge_id not in latest_by_bridge or p.created_at > latest_by_bridge[p.bridge_id].created_at:
            latest_by_bridge[p.bridge_id] = p

    latest_scores = [p.health_score for p in latest_by_bridge.values()]
    latest_risks = [p.risk_percentage for p in latest_by_bridge.values()]

    avg_health_score = round(sum(latest_scores) / len(latest_scores), 1) if latest_scores else 0.0
    avg_risk_percentage = round(sum(latest_risks) / len(latest_risks), 1) if latest_risks else 0.0

    capacities = [b.design_capacity_kn for b in bridges if b.design_capacity_kn]
    avg_load_capacity = round(sum(capacities) / len(capacities), 1) if capacities else 0.0

    return schemas.AnalyticsSummary(
        total_bridges=total_bridges,
        status_counts=dict(status_counts),
        material_counts=dict(material_counts),
        type_counts=dict(type_counts),
        corrosion_counts=dict(corrosion_counts),
        avg_health_score=avg_health_score,
        avg_risk_percentage=avg_risk_percentage,
        avg_load_capacity=avg_load_capacity,
        age_distribution=dict(age_distribution),
        total_predictions=len(predictions),
    )
