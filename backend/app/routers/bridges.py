from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import models, schemas, auth, csv_import
from ..database import get_db
from ..prediction_engine import status_from_risk

router = APIRouter(prefix="/bridges", tags=["bridges"])

SORTABLE_FIELDS = {
    "bridge_id": models.Bridge.bridge_id,
    "location": models.Bridge.location,
    "material": models.Bridge.material,
    "age": models.Bridge.age,
    "status": models.Bridge.status,
    "year_built": models.Bridge.year_built,
    "design_capacity_kn": models.Bridge.design_capacity_kn,
}


@router.get("", response_model=schemas.PaginatedBridges)
def list_bridges(
    search: Optional[str] = Query(None, description="matches bridge_id, name, or location"),
    material: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    sort_by: str = Query("bridge_id"),
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    query = db.query(models.Bridge)

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                models.Bridge.bridge_id.ilike(like),
                models.Bridge.name.ilike(like),
                models.Bridge.location.ilike(like),
            )
        )
    if material:
        query = query.filter(models.Bridge.material == material)
    if status_filter:
        query = query.filter(models.Bridge.status == status_filter)

    total = query.count()

    sort_col = SORTABLE_FIELDS.get(sort_by, models.Bridge.bridge_id)
    query = query.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())

    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return schemas.PaginatedBridges(total=total, page=page, page_size=page_size, items=items)


@router.get("/{bridge_pk}", response_model=schemas.BridgeOut)
def get_bridge(bridge_pk: int, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    bridge = db.query(models.Bridge).filter(models.Bridge.id == bridge_pk).first()
    if not bridge:
        raise HTTPException(status_code=404, detail="Bridge not found")
    return bridge


@router.post("", response_model=schemas.BridgeOut, status_code=201)
def create_bridge(
    payload: schemas.BridgeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_roles("admin", "inspector")),
):
    existing = db.query(models.Bridge).filter(models.Bridge.bridge_id == payload.bridge_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="A bridge with this Bridge ID already exists")
    bridge = models.Bridge(**payload.model_dump())
    db.add(bridge)
    db.commit()
    db.refresh(bridge)
    return bridge


@router.put("/{bridge_pk}", response_model=schemas.BridgeOut)
def update_bridge(
    bridge_pk: int,
    payload: schemas.BridgeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_roles("admin", "inspector")),
):
    bridge = db.query(models.Bridge).filter(models.Bridge.id == bridge_pk).first()
    if not bridge:
        raise HTTPException(status_code=404, detail="Bridge not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(bridge, field, value)
    db.commit()
    db.refresh(bridge)
    return bridge


@router.delete("/{bridge_pk}", status_code=204)
def delete_bridge(
    bridge_pk: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_roles("admin")),
):
    bridge = db.query(models.Bridge).filter(models.Bridge.id == bridge_pk).first()
    if not bridge:
        raise HTTPException(status_code=404, detail="Bridge not found")
    db.delete(bridge)
    db.commit()
    return None


@router.post("/csv/upload", response_model=schemas.CSVUploadResult)
def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_roles("admin", "inspector")),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    content = file.file.read()
    try:
        df, parse_errors = csv_import.parse_csv_bytes(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    inserted, updated, skipped, errors = csv_import.upsert_bridges_from_dataframe(db, df)

    # recompute status for every touched bridge using the prediction engine's
    # risk bucketing so the dashboard/map reflect the freshly uploaded data
    from ..prediction_engine import run_prediction
    for bridge in db.query(models.Bridge).all():
        result = run_prediction(bridge)
        bridge.status = status_from_risk(result["risk_percentage"])
    db.commit()

    notif = models.Notification(
        title="CSV dataset uploaded",
        message=f"{inserted} bridge(s) added, {updated} updated, {skipped} row(s) skipped.",
        level="info" if not errors else "warning",
    )
    db.add(notif)
    db.commit()

    return schemas.CSVUploadResult(
        inserted=inserted, updated=updated, skipped_rows=skipped, errors=(parse_errors + errors)
    )
