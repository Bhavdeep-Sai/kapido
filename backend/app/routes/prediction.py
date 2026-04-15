from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query

from app.models.schemas import (
    DayOfWeekTrendsResponse,
    GapDistributionResponse,
    HourlyTrendsResponse,
    LocationTrendsResponse,
    ModelValidationResponse,
    PredictionResponse,
    StorePredictionRequest,
    TimeSeriesResponse,
)
from app.services.analytics_service import AnalyticsService
from app.services.history_service import HistoryService
from app.services.insights_service import InsightService
from app.services.predictor import PredictorService, get_predictor_service
from app.services.validation_service import ValidationService

router = APIRouter(tags=["predictions"])


@router.get("/predict", response_model=PredictionResponse)
def predict(
    hour: int = Query(..., ge=0, le=23),
    location: str = Query(..., min_length=1),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
    predictor: PredictorService = Depends(get_predictor_service),
) -> PredictionResponse:
    result = predictor.predict(hour=hour, location=location, latitude=latitude, longitude=longitude)
    return PredictionResponse(**result)


@router.post("/store-prediction")
def store_prediction(payload: StorePredictionRequest) -> dict[str, str]:
    service = HistoryService()
    if payload.timestamp is None:
        payload.timestamp = datetime.now(timezone.utc)
    if not payload.explanations or not payload.recommendations:
        insights = InsightService().generate(
            hour=payload.hour,
            location=payload.location,
            demand=payload.demand,
            supply=payload.supply,
            gap=payload.gap,
            is_weekend=False,
        )
        payload.severity = insights.severity
        payload.explanations = insights.explanations
        payload.recommendations = insights.recommendations
    return service.store_prediction(payload)


@router.get("/history")
def history(limit: int = Query(default=100, ge=1, le=500)) -> list[dict]:
    service = HistoryService()
    return service.get_history(limit=limit)


@router.get("/analytics/hourly-trends", response_model=HourlyTrendsResponse)
def hourly_trends(limit_hours: int = Query(default=24, ge=1, le=24)) -> HourlyTrendsResponse:
    service = AnalyticsService()
    return HourlyTrendsResponse(**service.get_hourly_trends(limit_hours=limit_hours))


@router.get("/analytics/location-trends", response_model=LocationTrendsResponse)
def location_trends(min_occurrences: int = Query(default=2, ge=1, le=1000)) -> LocationTrendsResponse:
    service = AnalyticsService()
    return LocationTrendsResponse(**service.get_location_trends(min_occurrences=min_occurrences))


@router.get("/analytics/day-of-week", response_model=DayOfWeekTrendsResponse)
def day_of_week_trends() -> DayOfWeekTrendsResponse:
    service = AnalyticsService()
    return DayOfWeekTrendsResponse(**service.get_day_of_week_trends())


@router.get("/analytics/gap-distribution", response_model=GapDistributionResponse)
def gap_distribution(limit: int = Query(default=10000, ge=100, le=50000)) -> GapDistributionResponse:
    service = AnalyticsService()
    return GapDistributionResponse(**service.get_gap_distribution(limit=limit))


@router.get("/analytics/time-series", response_model=TimeSeriesResponse)
def time_series(limit: int = Query(default=500, ge=10, le=5000)) -> TimeSeriesResponse:
    service = AnalyticsService()
    return TimeSeriesResponse(**service.get_time_series(limit=limit))


@router.get("/analytics/model-validation", response_model=ModelValidationResponse)
def model_validation(
    max_rows: int = Query(default=1500, ge=100, le=50000),
    predictor: PredictorService = Depends(get_predictor_service),
) -> ModelValidationResponse:
    service = ValidationService(predictor=predictor)
    return ModelValidationResponse(**service.evaluate_against_dataset(max_rows=max_rows))
