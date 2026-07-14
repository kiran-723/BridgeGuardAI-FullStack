"""
Bridge health / risk scoring engine.

IMPORTANT (be upfront about this, don't oversell it):
This project's original dataset has no labelled "failure" outcomes to train a
real machine-learning model against, so this is a transparent, explainable
RULE-BASED scoring formula built from the structural fields that ARE in the
data (load ratio, age, stress, crack width, corrosion, vibration). It is
meant to demonstrate the workflow end-to-end (data -> score -> risk ->
recommendation), not to be a validated engineering safety assessment.
If a real trained model is available later, swap this module's `run_prediction`
function for a call to it -- the API/DB layer around it doesn't need to change.
"""
from typing import Dict

from . import models


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def run_prediction(bridge: models.Bridge) -> Dict:
    # ---- load ratio (how close current load is to design capacity) ----
    capacity = bridge.design_capacity_kn or 1.0
    load = bridge.current_load_kn or 0.0
    load_ratio = load / capacity if capacity else 0.0  # 0..1+ typically

    # ---- normalize contributing factors to a 0-100 "penalty" each ----
    load_penalty = _clamp(load_ratio * 100, 0, 100)

    age = bridge.age or 0
    age_penalty = _clamp((age / 80) * 100, 0, 100)  # 80 yrs ~ fully depreciated

    stress = bridge.stress_mpa or 0
    stress_penalty = _clamp((stress / 250) * 100, 0, 100)  # 250 MPa reference ceiling

    crack = bridge.crack_width_mm or 0
    crack_penalty = _clamp((crack / 5) * 100, 0, 100)  # 5mm treated as severe

    vibration = bridge.vibration_hz or 0
    vibration_penalty = _clamp((vibration / 10) * 100, 0, 100)

    corrosion_map = {"Low": 15, "Medium": 50, "High": 85}
    corrosion_penalty = corrosion_map.get((bridge.corrosion or "Low").strip().title(), 30)

    # ---- weighted composite risk (0-100, higher = worse) ----
    weights = {
        "load": 0.28,
        "age": 0.15,
        "stress": 0.20,
        "crack": 0.15,
        "corrosion": 0.15,
        "vibration": 0.07,
    }
    composite_risk = (
        load_penalty * weights["load"]
        + age_penalty * weights["age"]
        + stress_penalty * weights["stress"]
        + crack_penalty * weights["crack"]
        + corrosion_penalty * weights["corrosion"]
        + vibration_penalty * weights["vibration"]
    )
    composite_risk = _clamp(composite_risk, 0, 100)

    health_score = _clamp(100 - composite_risk, 0, 100)
    failure_probability = _clamp(composite_risk * 0.9, 0, 100)  # slightly damped vs raw risk

    # confidence: higher when we have more complete data on this bridge
    fields = [
        bridge.current_load_kn, bridge.design_capacity_kn, bridge.age,
        bridge.stress_mpa, bridge.crack_width_mm, bridge.corrosion, bridge.vibration_hz,
    ]
    completeness = sum(1 for f in fields if f not in (None, "")) / len(fields)
    confidence_score = round(_clamp(60 + completeness * 40, 0, 100), 1)

    # remaining life: simple decay model off health score and age
    max_design_life = 100
    remaining_life = _clamp(
        (health_score / 100) * (max_design_life - age), 0, max_design_life
    )

    if composite_risk < 25:
        risk_level = "Low"
        recommendation = (
            "No immediate action required. Continue routine scheduled inspections."
        )
    elif composite_risk < 50:
        risk_level = "Medium"
        recommendation = (
            "Schedule a detailed inspection within the next 3 months and monitor "
            "load levels."
        )
    elif composite_risk < 75:
        risk_level = "High"
        recommendation = (
            "Prioritize a structural inspection within 30 days. Consider load "
            "restrictions until assessed."
        )
    else:
        risk_level = "Critical"
        recommendation = (
            "Immediate inspection required. Recommend load restriction or closure "
            "pending engineering assessment."
        )

    return {
        "health_score": round(health_score, 1),
        "risk_percentage": round(composite_risk, 1),
        "confidence_score": confidence_score,
        "remaining_life_years": round(remaining_life, 1),
        "failure_probability": round(failure_probability, 1),
        "recommendation": recommendation,
        "risk_level": risk_level,
    }


def status_from_risk(risk_percentage: float) -> str:
    if risk_percentage < 25:
        return "Safe"
    elif risk_percentage < 60:
        return "Warning"
    return "Critical"
