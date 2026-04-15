import axios from "axios";

import type {
  DayOfWeekTrendsResponse,
  GapDistributionResponse,
  HourlyTrendsResponse,
  LocationTrendsResponse,
  ModelValidationResponse,
  PredictRequest,
  PredictionRecord,
  PredictionResult,
  StorePredictionPayload,
  TimeSeriesResponse,
} from "./types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL. Set it in frontend/.env.local (or deployment env vars).");
}

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

export async function getPrediction(input: PredictRequest): Promise<PredictionResult> {
  const { data } = await api.get<PredictionResult>("/predict", {
    params: {
      hour: input.hour,
      location: input.location,
      latitude: input.latitude,
      longitude: input.longitude,
    },
  });
  return data;
}

export async function storePrediction(payload: StorePredictionPayload): Promise<void> {
  await api.post("/store-prediction", payload);
}

export async function getHistory(limit = 200): Promise<PredictionRecord[]> {
  const { data } = await api.get<PredictionRecord[]>("/history", {
    params: { limit },
  });
  return data;
}

export async function getHourlyTrends(limitHours = 24): Promise<HourlyTrendsResponse> {
  const { data } = await api.get<HourlyTrendsResponse>("/analytics/hourly-trends", {
    params: { limit_hours: limitHours },
  });
  return data;
}

export async function getLocationTrends(minOccurrences = 2): Promise<LocationTrendsResponse> {
  const { data } = await api.get<LocationTrendsResponse>("/analytics/location-trends", {
    params: { min_occurrences: minOccurrences },
  });
  return data;
}

export async function getTimeSeries(limit = 500): Promise<TimeSeriesResponse> {
  const { data } = await api.get<TimeSeriesResponse>("/analytics/time-series", {
    params: { limit },
  });
  return data;
}

export async function getDayOfWeekTrends(): Promise<DayOfWeekTrendsResponse> {
  const { data } = await api.get<DayOfWeekTrendsResponse>("/analytics/day-of-week");
  return data;
}

export async function getGapDistribution(limit = 10000): Promise<GapDistributionResponse> {
  const { data } = await api.get<GapDistributionResponse>("/analytics/gap-distribution", {
    params: { limit },
  });
  return data;
}

export async function getModelValidation(maxRows = 1500): Promise<ModelValidationResponse> {
  const { data } = await api.get<ModelValidationResponse>("/analytics/model-validation", {
    params: { max_rows: maxRows },
    timeout: 30000,
  });
  return data;
}
