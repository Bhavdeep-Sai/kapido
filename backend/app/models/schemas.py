from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class PredictQuery(BaseModel):
    hour: int = Field(ge=0, le=23)
    location: str = Field(min_length=1, max_length=120)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class PredictionResponse(BaseModel):
    demand: float
    supply: float
    gap: float
    severity: str = "balanced"
    explanations: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class PredictionRecord(BaseModel):
    timestamp: datetime
    hour: int = Field(ge=0, le=23)
    location: str = Field(min_length=1, max_length=120)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    demand: float = Field(ge=0)
    supply: float = Field(ge=0)
    gap: float
    severity: str = "balanced"
    explanations: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

    @field_validator("location")
    @classmethod
    def normalize_location(cls, value: str) -> str:
        return value.strip().lower()


class StorePredictionRequest(BaseModel):
    timestamp: Optional[datetime] = None
    hour: int = Field(ge=0, le=23)
    location: str = Field(min_length=1, max_length=120)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    demand: float = Field(ge=0)
    supply: float = Field(ge=0)
    gap: float
    severity: str = "balanced"
    explanations: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

    @field_validator("location")
    @classmethod
    def normalize_location(cls, value: str) -> str:
        return value.strip().lower()


class HourlyTrend(BaseModel):
    hour: int
    avg_demand: float
    avg_supply: float
    avg_gap: float
    sample_size: int
    shortage_rate: float


class LocationTrend(BaseModel):
    location: str
    avg_demand: float
    avg_supply: float
    avg_gap: float
    sample_size: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: str


class Hotspot(BaseModel):
    location: str
    severity: str
    avg_gap: float
    occurrences: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class HourlyTrendsResponse(BaseModel):
    generated_at: datetime
    data: list[HourlyTrend]
    peak_shortage_hours: list[int]
    frequent_shortage_zones: list[str]


class LocationTrendsResponse(BaseModel):
    generated_at: datetime
    data: list[LocationTrend]
    hotspots: list[Hotspot]


class DayOfWeekTrend(BaseModel):
    day_of_week: int
    avg_demand: float
    avg_supply: float
    avg_gap: float
    sample_size: int
    shortage_rate: float


class DayOfWeekTrendsResponse(BaseModel):
    generated_at: datetime
    data: list[DayOfWeekTrend]
    peak_shortage_days: list[int]


class GapDistributionBucket(BaseModel):
    bucket: str
    count: int


class GapDistributionResponse(BaseModel):
    generated_at: datetime
    total_samples: int
    shortage_count: int
    balanced_or_surplus_count: int
    p50_gap: float
    p90_gap: float
    p95_gap: float
    buckets: list[GapDistributionBucket]


class TimeSeriesPoint(BaseModel):
    timestamp: datetime
    hour: int
    location: str
    demand: float
    supply: float
    gap: float


class TimeSeriesResponse(BaseModel):
    generated_at: datetime
    data: list[TimeSeriesPoint]


class MetricScore(BaseModel):
    mae: float
    rmse: float


class ValidationMetrics(BaseModel):
    demand: MetricScore
    supply: MetricScore


class ModelValidationResponse(BaseModel):
    dataset_rows_evaluated: int
    metrics: ValidationMetrics
    anomalies: list[str]
