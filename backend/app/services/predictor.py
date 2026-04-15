from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
from fastapi import HTTPException

from app.services.insights_service import InsightService
from app.services.preprocess import build_features


class PredictorService:
    def __init__(self) -> None:
        model_path = os.getenv("MODEL_PATH", "models/model.pkl")
        resolved_path = self._resolve_model_path(model_path)
        self.artifact = joblib.load(resolved_path)
        self.demand_model = self.artifact["demand_model"]
        self.supply_model = self.artifact["supply_model"]
        self.feature_columns = list(self.artifact.get("feature_columns", []))
        self.insight_service = InsightService()

    @staticmethod
    def _resolve_model_path(model_path: str) -> Path:
        configured = Path(model_path)
        if configured.is_absolute():
            if configured.exists():
                return configured
            raise FileNotFoundError(f"MODEL_PATH points to a missing file: {configured}")

        # Support both project-root and backend-root relative values.
        project_root = Path(__file__).resolve().parents[3]
        backend_root = Path(__file__).resolve().parents[2]
        candidates = [
            (project_root / configured).resolve(),
            (backend_root / configured).resolve(),
        ]

        for candidate in candidates:
            if candidate.exists():
                return candidate

        searched = "\n".join(f"- {path}" for path in candidates)
        raise FileNotFoundError(
            "Model artifact not found. Train and save it first (python models/train_model.py). "
            f"Checked paths:\n{searched}"
        )

    def predict(self, hour: int, location: str, latitude: float | None, longitude: float | None) -> dict[str, Any]:
        features = build_features(hour=hour, location=location, latitude=latitude, longitude=longitude)
        if self.feature_columns:
            for col in self.feature_columns:
                if col not in features.columns:
                    features[col] = None
            features = features[self.feature_columns]

        demand = float(self.demand_model.predict(features)[0])
        supply = float(self.supply_model.predict(features)[0])
        demand = max(demand, 0.0)
        supply = max(supply, 0.0)
        gap = round(demand - supply, 2)
        insights = self.insight_service.generate(
            hour=hour,
            location=location,
            demand=demand,
            supply=supply,
            gap=gap,
            is_weekend=bool(features.iloc[0].get("is_weekend", 0)),
        )
        return {
            "demand": round(demand, 2),
            "supply": round(supply, 2),
            "gap": gap,
            "severity": insights.severity,
            "explanations": insights.explanations,
            "recommendations": insights.recommendations,
        }


@lru_cache(maxsize=1)
def get_predictor_service() -> PredictorService:
    try:
        return PredictorService()
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model artifact is not available. Set MODEL_PATH to a valid model.pkl path "
                "or attach persistent disk storage with the trained model."
            ),
        ) from exc
