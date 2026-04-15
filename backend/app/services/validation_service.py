from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from app.services.preprocess import PEAK_HOURS
from app.services.predictor import PredictorService


class ValidationService:
    def __init__(self, predictor: PredictorService) -> None:
        self.predictor = predictor

    def evaluate_against_dataset(self, dataset_path: str = "data/ride_data.csv", max_rows: int = 2000) -> dict[str, Any]:
        resolved_path = self._resolve_dataset_path(dataset_path)
        dataset = pd.read_csv(resolved_path)

        required_columns = {
            "hour",
            "location",
            "latitude",
            "longitude",
            "demand",
            "supply",
        }
        missing = required_columns - set(dataset.columns)
        if missing:
            raise ValueError(f"Dataset missing required columns: {sorted(missing)}")

        sample = dataset.head(max_rows).copy()
        features = self._build_feature_frame(sample)

        if self.predictor.feature_columns:
            for column in self.predictor.feature_columns:
                if column not in features.columns:
                    features[column] = 0
            features = features[self.predictor.feature_columns]

        demand_pred = pd.Series(self.predictor.demand_model.predict(features), index=sample.index, name="demand")
        supply_pred = pd.Series(self.predictor.supply_model.predict(features), index=sample.index, name="supply")

        predictions = pd.DataFrame({
            "demand": demand_pred.clip(lower=0.0),
            "supply": supply_pred.clip(lower=0.0),
        })

        demand_actual = sample["demand"].astype(float)
        supply_actual = sample["supply"].astype(float)

        demand_pred = predictions["demand"].astype(float)
        supply_pred = predictions["supply"].astype(float)

        demand_mae = float(mean_absolute_error(demand_actual, demand_pred))
        supply_mae = float(mean_absolute_error(supply_actual, supply_pred))
        demand_rmse = float(root_mean_squared_error(demand_actual, demand_pred))
        supply_rmse = float(root_mean_squared_error(supply_actual, supply_pred))

        anomalies = self._detect_anomalies(predictions)

        return {
            "dataset_rows_evaluated": int(sample.shape[0]),
            "metrics": {
                "demand": {"mae": round(demand_mae, 4), "rmse": round(demand_rmse, 4)},
                "supply": {"mae": round(supply_mae, 4), "rmse": round(supply_rmse, 4)},
            },
            "anomalies": anomalies,
        }

    @staticmethod
    def _build_feature_frame(sample: pd.DataFrame) -> pd.DataFrame:
        location = sample["location"].astype(str).str.strip().str.lower()
        latitude = sample["latitude"].astype(float).fillna(0.0)
        longitude = sample["longitude"].astype(float).fillna(0.0)
        hour = sample["hour"].astype(int)
        day_of_week = sample["day_of_week"].astype(int)

        is_weekend = (day_of_week >= 5).astype(int)
        is_peak_hour = hour.isin(PEAK_HOURS).astype(int)

        features = pd.DataFrame(
            {
                "hour": hour,
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_peak_hour": is_peak_hour,
                "hour_sin": np.sin((2 * np.pi * hour) / 24),
                "hour_cos": np.cos((2 * np.pi * hour) / 24),
                "location": location,
                "location_bucket": location.apply(ValidationService._location_bucket),
                "geo_cluster": [f"{round(lat, 1):.1f}_{round(lon, 1):.1f}" for lat, lon in zip(latitude, longitude)],
                "latitude": latitude,
                "longitude": longitude,
            }
        )

        return features

    @staticmethod
    def _location_bucket(location: str) -> str:
        if any(token in location for token in ["airport", "station", "terminal"]):
            return "transit"
        if any(token in location for token in ["downtown", "midtown", "central", "business"]):
            return "core"
        if any(token in location for token in ["suburb", "residential", "outskirts"]):
            return "residential"
        return "other"

    @staticmethod
    def _detect_anomalies(predictions: pd.DataFrame) -> list[str]:
        issues: list[str] = []

        if predictions.empty:
            issues.append("No predictions generated for validation run.")
            return issues

        demand_unique = predictions["demand"].nunique()
        supply_unique = predictions["supply"].nunique()

        if demand_unique <= 2:
            issues.append("Demand predictions appear nearly constant across validation samples.")
        if supply_unique <= 2:
            issues.append("Supply predictions appear nearly constant across validation samples.")

        if (predictions["demand"] > 2000).any() or (predictions["supply"] > 2000).any():
            issues.append("Unrealistic prediction values detected (>2000 rides/drivers).")

        if (predictions["demand"] < 0).any() or (predictions["supply"] < 0).any():
            issues.append("Negative prediction values detected.")

        if not issues:
            issues.append("No critical anomalies detected.")

        return issues

    @staticmethod
    def _resolve_dataset_path(dataset_path: str) -> Path:
        configured = Path(dataset_path)
        if configured.is_absolute():
            if configured.exists():
                return configured
            raise FileNotFoundError(f"Dataset path does not exist: {configured}")

        project_root = Path(__file__).resolve().parents[3]
        backend_root = Path(__file__).resolve().parents[2]

        for candidate in [(project_root / configured).resolve(), (backend_root / configured).resolve()]:
            if candidate.exists():
                return candidate

        raise FileNotFoundError(f"Unable to locate dataset at configured path: {dataset_path}")
