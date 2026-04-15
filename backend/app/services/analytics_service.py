from __future__ import annotations

from datetime import datetime
from typing import Any

import numpy as np

from app.db.mongo import get_collection


class AnalyticsService:
    def __init__(self, shortage_threshold: float = 15.0, high_shortage_threshold: float = 30.0) -> None:
        self.collection = get_collection()
        self.shortage_threshold = shortage_threshold
        self.high_shortage_threshold = high_shortage_threshold

    def get_hourly_trends(self, limit_hours: int = 24) -> dict[str, Any]:
        pipeline = [
            {
                "$group": {
                    "_id": "$hour",
                    "avg_demand": {"$avg": "$demand"},
                    "avg_supply": {"$avg": "$supply"},
                    "avg_gap": {"$avg": "$gap"},
                    "total": {"$sum": 1},
                    "shortages": {
                        "$sum": {
                            "$cond": [{"$gt": ["$gap", self.shortage_threshold]}, 1, 0]
                        }
                    },
                }
            },
            {"$sort": {"_id": 1}},
            {"$limit": limit_hours},
        ]

        rows = list(self.collection.aggregate(pipeline))
        data = [
            {
                "hour": int(row["_id"]),
                "avg_demand": round(float(row["avg_demand"]), 2),
                "avg_supply": round(float(row["avg_supply"]), 2),
                "avg_gap": round(float(row["avg_gap"]), 2),
                "sample_size": int(row["total"]),
                "shortage_rate": round(float(row["shortages"]) / max(float(row["total"]), 1.0), 3),
            }
            for row in rows
        ]

        peak_shortage_hours = [
            item["hour"]
            for item in sorted(data, key=lambda item: item["avg_gap"], reverse=True)
            if item["avg_gap"] > self.shortage_threshold
        ][:3]

        frequent_shortage_zones = [entry["location"] for entry in self.get_location_trends()["data"] if entry["avg_gap"] > self.shortage_threshold][:5]

        return {
            "generated_at": datetime.utcnow(),
            "data": data,
            "peak_shortage_hours": peak_shortage_hours,
            "frequent_shortage_zones": frequent_shortage_zones,
        }

    def get_location_trends(self, min_occurrences: int = 2) -> dict[str, Any]:
        pipeline = [
            {
                "$group": {
                    "_id": "$location",
                    "avg_demand": {"$avg": "$demand"},
                    "avg_supply": {"$avg": "$supply"},
                    "avg_gap": {"$avg": "$gap"},
                    "occurrences": {"$sum": 1},
                    "latitude": {"$avg": "$latitude"},
                    "longitude": {"$avg": "$longitude"},
                }
            },
            {"$match": {"occurrences": {"$gte": min_occurrences}}},
            {"$sort": {"avg_gap": -1}},
        ]

        rows = list(self.collection.aggregate(pipeline))

        data = [
            {
                "location": str(row["_id"]),
                "avg_demand": round(float(row["avg_demand"]), 2),
                "avg_supply": round(float(row["avg_supply"]), 2),
                "avg_gap": round(float(row["avg_gap"]), 2),
                "sample_size": int(row["occurrences"]),
                "latitude": round(float(row["latitude"]), 6) if row.get("latitude") is not None else None,
                "longitude": round(float(row["longitude"]), 6) if row.get("longitude") is not None else None,
                "severity": self._severity(float(row["avg_gap"])),
            }
            for row in rows
        ]

        hotspots = [
            {
                "location": row["location"],
                "severity": row["severity"],
                "avg_gap": row["avg_gap"],
                "occurrences": row["sample_size"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
            }
            for row in data
            if row["avg_gap"] > self.shortage_threshold
        ]

        return {
            "generated_at": datetime.utcnow(),
            "data": data,
            "hotspots": hotspots,
        }

    def get_time_series(self, limit: int = 500) -> dict[str, Any]:
        docs = (
            self.collection.find({}, {"_id": 0})
            .sort("timestamp", 1)
            .limit(limit)
        )
        data = []
        for doc in docs:
            timestamp = doc.get("timestamp")
            if isinstance(timestamp, datetime):
                ts_value = timestamp
            else:
                ts_value = datetime.utcnow()
            data.append(
                {
                    "timestamp": ts_value,
                    "hour": int(doc.get("hour", 0)),
                    "location": str(doc.get("location", "unknown")),
                    "demand": round(float(doc.get("demand", 0.0)), 2),
                    "supply": round(float(doc.get("supply", 0.0)), 2),
                    "gap": round(float(doc.get("gap", 0.0)), 2),
                }
            )

        return {
            "generated_at": datetime.utcnow(),
            "data": data,
        }

    def get_day_of_week_trends(self) -> dict[str, Any]:
        pipeline = [
            {
                "$group": {
                    "_id": "$day_of_week",
                    "avg_demand": {"$avg": "$demand"},
                    "avg_supply": {"$avg": "$supply"},
                    "avg_gap": {"$avg": "$gap"},
                    "total": {"$sum": 1},
                    "shortages": {
                        "$sum": {
                            "$cond": [{"$gt": ["$gap", self.shortage_threshold]}, 1, 0]
                        }
                    },
                }
            },
            {"$match": {"_id": {"$gte": 0, "$lte": 6}}},
            {"$sort": {"_id": 1}},
        ]

        rows = list(self.collection.aggregate(pipeline))
        data = [
            {
                "day_of_week": int(row["_id"]),
                "avg_demand": round(float(row["avg_demand"]), 2),
                "avg_supply": round(float(row["avg_supply"]), 2),
                "avg_gap": round(float(row["avg_gap"]), 2),
                "sample_size": int(row["total"]),
                "shortage_rate": round(float(row["shortages"]) / max(float(row["total"]), 1.0), 3),
            }
            for row in rows
        ]

        peak_shortage_days = [
            item["day_of_week"]
            for item in sorted(data, key=lambda item: item["avg_gap"], reverse=True)
            if item["avg_gap"] > self.shortage_threshold
        ][:3]

        return {
            "generated_at": datetime.utcnow(),
            "data": data,
            "peak_shortage_days": peak_shortage_days,
        }

    def get_gap_distribution(self, limit: int = 10000) -> dict[str, Any]:
        docs = self.collection.find({}, {"_id": 0, "gap": 1}).limit(limit)
        gaps = [float(doc.get("gap", 0.0)) for doc in docs]

        if not gaps:
            return {
                "generated_at": datetime.utcnow(),
                "total_samples": 0,
                "shortage_count": 0,
                "balanced_or_surplus_count": 0,
                "p50_gap": 0.0,
                "p90_gap": 0.0,
                "p95_gap": 0.0,
                "buckets": [
                    {"bucket": "<= -10", "count": 0},
                    {"bucket": "-10 to 0", "count": 0},
                    {"bucket": "0 to 15", "count": 0},
                    {"bucket": "15 to 30", "count": 0},
                    {"bucket": "> 30", "count": 0},
                ],
            }

        shortage_count = sum(1 for gap in gaps if gap > 0)
        buckets = {
            "<= -10": 0,
            "-10 to 0": 0,
            "0 to 15": 0,
            "15 to 30": 0,
            "> 30": 0,
        }

        for gap in gaps:
            if gap <= -10:
                buckets["<= -10"] += 1
            elif gap <= 0:
                buckets["-10 to 0"] += 1
            elif gap <= 15:
                buckets["0 to 15"] += 1
            elif gap <= 30:
                buckets["15 to 30"] += 1
            else:
                buckets["> 30"] += 1

        return {
            "generated_at": datetime.utcnow(),
            "total_samples": len(gaps),
            "shortage_count": shortage_count,
            "balanced_or_surplus_count": len(gaps) - shortage_count,
            "p50_gap": round(float(np.percentile(gaps, 50)), 2),
            "p90_gap": round(float(np.percentile(gaps, 90)), 2),
            "p95_gap": round(float(np.percentile(gaps, 95)), 2),
            "buckets": [{"bucket": key, "count": value} for key, value in buckets.items()],
        }

    def _severity(self, avg_gap: float) -> str:
        if avg_gap >= self.high_shortage_threshold:
            return "high"
        if avg_gap >= self.shortage_threshold:
            return "medium"
        if avg_gap > 0:
            return "low"
        return "balanced"
