from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "model.pkl"

PEAK_HOURS = {7, 8, 9, 10, 17, 18, 19, 20, 21}


def location_bucket(location: str) -> str:
    normalized = location.strip().lower()
    if any(token in normalized for token in ["airport", "station", "terminal"]):
        return "transit"
    if any(token in normalized for token in ["downtown", "midtown", "central", "business"]):
        return "core"
    if any(token in normalized for token in ["suburb", "residential", "outskirts"]):
        return "residential"
    return "other"


def geo_cluster(latitude: float, longitude: float) -> str:
    return f"{round(float(latitude), 1):.1f}_{round(float(longitude), 1):.1f}"


def predict_gap(hour: int, day_of_week: int, location: str, latitude: float, longitude: float) -> dict[str, float]:
    artifact = joblib.load(MODEL_PATH)
    normalized_location = location.strip().lower()
    features = pd.DataFrame(
        [
            {
                "hour": hour,
                "day_of_week": day_of_week,
                "is_weekend": int(day_of_week >= 5),
                "is_peak_hour": int(hour in PEAK_HOURS),
                "hour_sin": float(np.sin((2 * np.pi * hour) / 24)),
                "hour_cos": float(np.cos((2 * np.pi * hour) / 24)),
                "location": normalized_location,
                "location_bucket": location_bucket(normalized_location),
                "geo_cluster": geo_cluster(latitude, longitude),
                "latitude": latitude,
                "longitude": longitude,
            }
        ]
    )

    feature_columns = list(artifact.get("feature_columns", []))
    if feature_columns:
        for col in feature_columns:
            if col not in features.columns:
                features[col] = None
        features = features[feature_columns]

    demand = float(artifact["demand_model"].predict(features)[0])
    supply = float(artifact["supply_model"].predict(features)[0])

    demand = max(0.0, demand)
    supply = max(0.0, supply)
    return {
        "demand": round(demand, 2),
        "supply": round(supply, 2),
        "gap": round(demand - supply, 2),
    }
