from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..prediction_engine import run_prediction, status_from_risk

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("/run", response_model=schemas.PredictionOut)
def run(
    payload: schemas.PredictionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_roles("admin", "inspector")),
):
    bridge = db.query(models.Bridge).filter(models.Bridge.id == payload.bridge_id).first()
    if not bridge:
        raise HTTPException(status_code=404, detail="Bridge not found")

    result = run_prediction(bridge)

    prediction = models.Prediction(bridge_id=bridge.id, **result)
    db.add(prediction)

    bridge.status = status_from_risk(result["risk_percentage"])

    if result["risk_level"] in ("High", "Critical"):
        db.add(models.Notification(
            title=f"{result['risk_level']} risk detected",
            message=f"Bridge {bridge.bridge_id} ({bridge.location or 'unknown location'}) "
                    f"scored {result['risk_percentage']}% risk.",
            level="critical" if result["risk_level"] == "Critical" else "warning",
        ))

    db.commit()
    db.refresh(prediction)
    return prediction


@router.get("/history", response_model=List[schemas.PredictionOut])
def history(
    bridge_id: Optional[int] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    query = db.query(models.Prediction)
    if bridge_id:
        query = query.filter(models.Prediction.bridge_id == bridge_id)
    return query.order_by(models.Prediction.created_at.desc()).limit(limit).all()
