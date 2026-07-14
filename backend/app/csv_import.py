"""
CSV -> Bridge row mapping.

The uploaded CSV is expected to (roughly) match the original dashboard's
column names, but this mapper is deliberately tolerant: it matches column
names case-insensitively and with common separator variants, and any column
it can't recognize is simply ignored rather than raising an error. Missing
optional columns are fine; only BridgeID needs to be present and non-empty.
"""
import io
from typing import Dict, List, Tuple

import pandas as pd
from sqlalchemy.orm import Session

from . import models

# maps: canonical field -> list of acceptable header spellings (lowercased, no separators)
COLUMN_ALIASES = {
    "bridge_id": ["bridgeid", "bridge_id", "id"],
    "name": ["name", "bridgename"],
    "location": ["location"],
    "type": ["type", "bridgetype"],
    "material": ["material"],
    "age": ["age"],
    "span_m": ["spanm", "span"],
    "width_m": ["widthm", "width"],
    "current_load_kn": ["currentloadkn", "currentload"],
    "design_capacity_kn": ["designcapacitykn", "designcapacity", "capacity"],
    "year_built": ["yearbuilt"],
    "no_of_spans": ["noofspans", "numberofspans"],
    "latitude": ["latitude", "lat"],
    "longitude": ["longitude", "lng", "lon"],
    "temperature_c": ["temperaturec", "temperature"],
    "humidity_pct": ["humiditypct", "humidity"],
    "stress_mpa": ["stressmpa", "stress"],
    "strain_micro": ["strainmicro", "strain"],
    "vibration_hz": ["vibrationhz", "vibration"],
    "crack_width_mm": ["crackwidthmm", "crackwidth"],
    "corrosion": ["corrosion"],
    "last_inspection": ["lastinspection"],
    "next_inspection": ["nextinspection"],
}

NUMERIC_FIELDS = {
    "age", "span_m", "width_m", "current_load_kn", "design_capacity_kn",
    "year_built", "no_of_spans", "latitude", "longitude", "temperature_c",
    "humidity_pct", "stress_mpa", "strain_micro", "vibration_hz", "crack_width_mm",
}


def _normalize_header(h: str) -> str:
    return "".join(ch for ch in h.lower() if ch.isalnum())


def _build_header_map(columns: List[str]) -> Dict[str, str]:
    """Return {actual_csv_column_name: canonical_field_name}."""
    normalized_to_actual = {_normalize_header(c): c for c in columns}
    header_map = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized_to_actual:
                header_map[normalized_to_actual[alias]] = canonical
                break
    return header_map


def parse_csv_bytes(content: bytes) -> Tuple[pd.DataFrame, List[str]]:
    errors: List[str] = []
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Could not parse CSV: {exc}")

    header_map = _build_header_map(list(df.columns))
    if "bridge_id" not in header_map.values():
        raise ValueError(
            "CSV must contain a BridgeID column (or an equivalent 'ID' column)."
        )

    df = df.rename(columns=header_map)
    # keep only recognized columns
    keep_cols = [c for c in df.columns if c in COLUMN_ALIASES.keys()]
    df = df[keep_cols]
    return df, errors


def upsert_bridges_from_dataframe(db: Session, df: pd.DataFrame) -> Tuple[int, int, int, List[str]]:
    inserted = 0
    updated = 0
    skipped = 0
    errors: List[str] = []

    for idx, row in df.iterrows():
        raw_id = row.get("bridge_id")
        if raw_id is None or (isinstance(raw_id, float) and pd.isna(raw_id)) or str(raw_id).strip() == "":
            skipped += 1
            errors.append(f"Row {idx + 2}: missing BridgeID, skipped.")
            continue

        bridge_id = str(raw_id).strip()
        values = {}
        for field in COLUMN_ALIASES.keys():
            if field == "bridge_id" or field not in row.index:
                continue
            val = row[field]
            if pd.isna(val):
                continue
            if field in NUMERIC_FIELDS:
                try:
                    val = float(val)
                    if field in ("age", "year_built", "no_of_spans"):
                        val = int(val)
                except (ValueError, TypeError):
                    errors.append(f"Row {idx + 2}: bad numeric value for {field}, ignored.")
                    continue
            else:
                val = str(val).strip()
            values[field] = val

        existing = db.query(models.Bridge).filter(models.Bridge.bridge_id == bridge_id).first()
        if existing:
            for k, v in values.items():
                setattr(existing, k, v)
            updated += 1
        else:
            bridge = models.Bridge(bridge_id=bridge_id, **values)
            db.add(bridge)
            inserted += 1

    db.commit()
    return inserted, updated, skipped, errors
