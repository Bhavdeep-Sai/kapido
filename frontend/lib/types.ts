export type PredictRequest = {
  hour: number;
  location: string;
  latitude?: number;
  longitude?: number;
};

export type PredictionResult = {
  demand: number;
  supply: number;
  gap: number;
  severity: "high" | "medium" | "low" | "balanced";
  explanations: string[];
  recommendations: string[];
};

export type PredictionRecord = {
  timestamp: string;
  hour: number;
  location: string;
  demand: number;
  supply: number;
  gap: number;
  severity?: "high" | "medium" | "low" | "balanced";
  explanations?: string[];
  recommendations?: string[];
  latitude?: number;
  longitude?: number;
};

export type StorePredictionPayload = {
  timestamp?: string;
  hour: number;
  location: string;
  demand: number;
  supply: number;
  gap: number;
  severity?: "high" | "medium" | "low" | "balanced";
  explanations?: string[];
  recommendations?: string[];
  latitude?: number;
  longitude?: number;
};

export type HourlyTrend = {
  hour: number;
  avg_demand: number;
  avg_supply: number;
  avg_gap: number;
  sample_size: number;
  shortage_rate: number;
};

export type HourlyTrendsResponse = {
  generated_at: string;
  data: HourlyTrend[];
  peak_shortage_hours: number[];
  frequent_shortage_zones: string[];
};

export type LocationTrend = {
  location: string;
  avg_demand: number;
  avg_supply: number;
  avg_gap: number;
  sample_size: number;
  severity: "high" | "medium" | "low" | "balanced";
  latitude?: number | null;
  longitude?: number | null;
};

export type Hotspot = {
  location: string;
  severity: "high" | "medium" | "low" | "balanced";
  avg_gap: number;
  occurrences: number;
  latitude?: number | null;
  longitude?: number | null;
};

export type LocationTrendsResponse = {
  generated_at: string;
  data: LocationTrend[];
  hotspots: Hotspot[];
};

export type DayOfWeekTrend = {
  day_of_week: number;
  avg_demand: number;
  avg_supply: number;
  avg_gap: number;
  sample_size: number;
  shortage_rate: number;
};

export type DayOfWeekTrendsResponse = {
  generated_at: string;
  data: DayOfWeekTrend[];
  peak_shortage_days: number[];
};

export type GapDistributionBucket = {
  bucket: string;
  count: number;
};

export type GapDistributionResponse = {
  generated_at: string;
  total_samples: number;
  shortage_count: number;
  balanced_or_surplus_count: number;
  p50_gap: number;
  p90_gap: number;
  p95_gap: number;
  buckets: GapDistributionBucket[];
};

export type TimeSeriesPoint = {
  timestamp: string;
  hour: number;
  location: string;
  demand: number;
  supply: number;
  gap: number;
};

export type TimeSeriesResponse = {
  generated_at: string;
  data: TimeSeriesPoint[];
};

export type ModelValidationResponse = {
  dataset_rows_evaluated: number;
  metrics: {
    demand: { mae: number; rmse: number };
    supply: { mae: number; rmse: number };
  };
  anomalies: string[];
};
