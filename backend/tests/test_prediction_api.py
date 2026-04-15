from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.services.predictor import get_predictor_service


class _FakePredictor:
    def predict(self, hour: int, location: str, latitude: float | None, longitude: float | None) -> dict:
        return {
            "demand": 100.0,
            "supply": 70.0,
            "gap": 30.0,
            "severity": "high",
            "explanations": ["High demand during peak commuting hours."],
            "recommendations": ["Deploy more drivers during peak commute windows."],
        }


def test_predict_endpoint_returns_explanations_and_recommendations() -> None:
    app.dependency_overrides[get_predictor_service] = lambda: _FakePredictor()

    client = TestClient(app)
    response = client.get(
        "/predict",
        params={"hour": 18, "location": "downtown", "latitude": 12.9, "longitude": 77.6},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["gap"] == 30.0
    assert payload["severity"] == "high"
    assert len(payload["explanations"]) > 0
    assert len(payload["recommendations"]) > 0


def test_analytics_hourly_endpoint_shape(monkeypatch) -> None:
    from app.routes import prediction as prediction_routes

    class _FakeAnalyticsService:
        def __init__(self, *args, **kwargs) -> None:
            pass

        def get_hourly_trends(self, limit_hours: int = 24) -> dict:
            return {
                "generated_at": datetime.utcnow(),
                "data": [
                    {
                        "hour": 18,
                        "avg_demand": 120.0,
                        "avg_supply": 80.0,
                        "avg_gap": 40.0,
                        "sample_size": 12,
                        "shortage_rate": 0.75,
                    }
                ],
                "peak_shortage_hours": [18],
                "frequent_shortage_zones": ["downtown"],
            }

    monkeypatch.setattr(prediction_routes, "AnalyticsService", _FakeAnalyticsService)

    client = TestClient(app)
    response = client.get("/analytics/hourly-trends")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"][0]["hour"] == 18
    assert payload["peak_shortage_hours"] == [18]


def test_analytics_day_of_week_endpoint_shape(monkeypatch) -> None:
    from app.routes import prediction as prediction_routes

    class _FakeAnalyticsService:
        def __init__(self, *args, **kwargs) -> None:
            pass

        def get_day_of_week_trends(self) -> dict:
            return {
                "generated_at": datetime.utcnow(),
                "data": [
                    {
                        "day_of_week": 1,
                        "avg_demand": 100.0,
                        "avg_supply": 80.0,
                        "avg_gap": 20.0,
                        "sample_size": 10,
                        "shortage_rate": 0.6,
                    }
                ],
                "peak_shortage_days": [1],
            }

    monkeypatch.setattr(prediction_routes, "AnalyticsService", _FakeAnalyticsService)

    client = TestClient(app)
    response = client.get("/analytics/day-of-week")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"][0]["day_of_week"] == 1
    assert payload["peak_shortage_days"] == [1]


def test_analytics_gap_distribution_endpoint_shape(monkeypatch) -> None:
    from app.routes import prediction as prediction_routes

    class _FakeAnalyticsService:
        def __init__(self, *args, **kwargs) -> None:
            pass

        def get_gap_distribution(self, limit: int = 10000) -> dict:
            return {
                "generated_at": datetime.utcnow(),
                "total_samples": 100,
                "shortage_count": 62,
                "balanced_or_surplus_count": 38,
                "p50_gap": 7.5,
                "p90_gap": 24.1,
                "p95_gap": 31.7,
                "buckets": [
                    {"bucket": "<= -10", "count": 3},
                    {"bucket": "-10 to 0", "count": 35},
                    {"bucket": "0 to 15", "count": 33},
                    {"bucket": "15 to 30", "count": 21},
                    {"bucket": "> 30", "count": 8},
                ],
            }

    monkeypatch.setattr(prediction_routes, "AnalyticsService", _FakeAnalyticsService)

    client = TestClient(app)
    response = client.get("/analytics/gap-distribution", params={"limit": 1000})

    assert response.status_code == 200
    payload = response.json()
    assert payload["total_samples"] == 100
    assert payload["shortage_count"] == 62
    assert len(payload["buckets"]) == 5
