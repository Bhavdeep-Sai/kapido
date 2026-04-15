from datetime import datetime, timedelta, timezone
from typing import Any

from app.db.mongo import get_collection
from app.models.schemas import StorePredictionRequest


class HistoryService:
    def store_prediction(self, payload: StorePredictionRequest) -> dict[str, str]:
        document: dict[str, Any] = payload.model_dump()
        timestamp = document.get("timestamp")
        if isinstance(timestamp, datetime):
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
        else:
            timestamp = datetime.now(timezone.utc)

        document["timestamp"] = timestamp

        # Avoid duplicate inserts for identical prediction payloads emitted within a short window.
        signature_filter = {
            "hour": document.get("hour"),
            "location": document.get("location"),
            "demand": document.get("demand"),
            "supply": document.get("supply"),
            "gap": document.get("gap"),
            "severity": document.get("severity"),
            "latitude": document.get("latitude"),
            "longitude": document.get("longitude"),
        }
        existing = get_collection().find_one(
            {
                **signature_filter,
                "timestamp": {
                    "$gte": timestamp - timedelta(seconds=30),
                    "$lte": timestamp + timedelta(seconds=30),
                },
            },
            {"_id": 1},
        )
        if existing:
            return {"message": "Prediction already stored recently"}

        try:
            get_collection().insert_one(document)
        except Exception as exc:  # pragma: no cover - driver-specific failures
            raise RuntimeError("Failed to store prediction in MongoDB") from exc
        return {"message": "Prediction stored successfully"}

    def get_history(self, limit: int = 100) -> list[dict[str, Any]]:
        try:
            docs = (
                get_collection()
                .find({}, {"_id": 0})
                .sort("timestamp", -1)
                .limit(limit)
            )
            return list(docs)
        except Exception as exc:  # pragma: no cover - driver-specific failures
            raise RuntimeError("Failed to load prediction history") from exc
