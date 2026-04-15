from datetime import datetime

import numpy as np
import pandas as pd


PEAK_HOURS = {7, 8, 9, 10, 17, 18, 19, 20, 21}


def _location_bucket(location: str) -> str:
    normalized = location.strip().lower()
    if any(token in normalized for token in ["airport", "station", "terminal"]):
        return "transit"
    if any(token in normalized for token in ["downtown", "midtown", "central", "business"]):
        return "core"
    if any(token in normalized for token in ["suburb", "residential", "outskirts"]):
        return "residential"
    return "other"


def _geo_cluster(latitude: float, longitude: float) -> str:
    return f"{round(latitude, 1):.1f}_{round(longitude, 1):.1f}"


def build_features(hour: int, location: str, latitude: float | None, longitude: float | None) -> pd.DataFrame:
    now = datetime.utcnow()
    safe_location = location.strip().lower()
    lat = latitude if latitude is not None else 0.0
    lon = longitude if longitude is not None else 0.0
    day_of_week = now.weekday()
    is_weekend = int(day_of_week >= 5)
    is_peak_hour = int(hour in PEAK_HOURS)

    return pd.DataFrame(
        [
            {
                "hour": hour,
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_peak_hour": is_peak_hour,
                "hour_sin": float(np.sin((2 * np.pi * hour) / 24)),
                "hour_cos": float(np.cos((2 * np.pi * hour) / 24)),
                "location": safe_location,
                "location_bucket": _location_bucket(safe_location),
                "geo_cluster": _geo_cluster(lat, lon),
                "latitude": lat,
                "longitude": lon,
            }
        ]
    )
