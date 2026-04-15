"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { PredictionCard } from "@/components/PredictionCard";
import { BarTrendChart, DualLineTrendChart, LineTrendChart } from "@/components/TrendCharts";
import {
  getDayOfWeekTrends,
  getGapDistribution,
  getHistory,
  getHourlyTrends,
  getLocationTrends,
  getModelValidation,
  getPrediction,
  getTimeSeries,
  storePrediction,
} from "@/lib/api";
import type {
  DayOfWeekTrendsResponse,
  GapDistributionResponse,
  HourlyTrendsResponse,
  LocationTrendsResponse,
  PredictionRecord,
  ModelValidationResponse,
  PredictionResult,
  TimeSeriesResponse,
} from "@/lib/types";
import type { MapPoint } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView").then((mod) => mod.MapView), {
  ssr: false,
});

function toTimestampMillis(rawTimestamp: string): number {
  if (!rawTimestamp) {
    return Date.now();
  }

  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(rawTimestamp);
  const normalized = hasTimezone ? rawTimestamp : `${rawTimestamp}Z`;
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function formatHistoryTime(rawTimestamp: string): string {
  const date = new Date(toTimestampMillis(rawTimestamp));
  return date.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const processedRunKeyRef = useRef<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [hourly, setHourly] = useState<HourlyTrendsResponse | null>(null);
  const [locationTrends, setLocationTrends] = useState<LocationTrendsResponse | null>(null);
  const [dayOfWeekTrends, setDayOfWeekTrends] = useState<DayOfWeekTrendsResponse | null>(null);
  const [gapDistribution, setGapDistribution] = useState<GapDistributionResponse | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesResponse | null>(null);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [validation, setValidation] = useState<ModelValidationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const hour = Number(searchParams.get("hour"));
  const location = (searchParams.get("location") ?? "").trim().toLowerCase();
  const latitude = searchParams.get("latitude") ? Number(searchParams.get("latitude")) : undefined;
  const longitude = searchParams.get("longitude") ? Number(searchParams.get("longitude")) : undefined;

  useEffect(() => {
    if (!location || Number.isNaN(hour)) {
      setLoading(false);
      setError("Missing inputs. Start from the homepage to run an analysis.");
      return;
    }

    const runKey = `${hour}|${location}|${latitude ?? "na"}|${longitude ?? "na"}`;
    if (processedRunKeyRef.current === runKey) {
      return;
    }
    processedRunKeyRef.current = runKey;

    async function runPrediction() {
      try {
        setLoading(true);
        setError("");

        const prediction = await getPrediction({ hour, location, latitude, longitude });
        setResult(prediction);

        await storePrediction({
          timestamp: new Date().toISOString(),
          hour,
          location,
          latitude,
          longitude,
          demand: prediction.demand,
          supply: prediction.supply,
          gap: prediction.gap,
          severity: prediction.severity,
          explanations: prediction.explanations,
          recommendations: prediction.recommendations,
        });

        const [hourlyResult, locationResult, dayOfWeekResult, distributionResult, timeSeriesResult, historyResult] = await Promise.all([
          getHourlyTrends(24),
          getLocationTrends(2),
          getDayOfWeekTrends(),
          getGapDistribution(5000),
          getTimeSeries(500),
          getHistory(20),
        ]);

        setHourly(hourlyResult);
        setLocationTrends(locationResult);
        setDayOfWeekTrends(dayOfWeekResult);
        setGapDistribution(distributionResult);
        setTimeSeries(timeSeriesResult);
        setHistory(historyResult);

        void (async () => {
          try {
            const validationResult = await getModelValidation(150);
            setValidation(validationResult);
          } catch (validationError) {
            console.warn("Validation metrics unavailable:", validationError);
            setValidation(null);
          }
        })();
      } catch (err) {
        console.error(err);
        setError("Failed to load prediction analytics from backend APIs.");
      } finally {
        setLoading(false);
      }
    }

    void runPrediction();
  }, [hour, location, latitude, longitude]);

  const mapPoints: MapPoint[] = useMemo(() => {
    if (!result) {
      return [];
    }

    const currentPoint: MapPoint[] =
      typeof latitude === "number" && typeof longitude === "number"
        ? [
            {
              latitude,
              longitude,
              location,
              gap: result.gap,
              severity: result.severity,
            },
          ]
        : [];

    const hotspotPoints = (locationTrends?.hotspots ?? [])
      .filter((hotspot) => hotspot.latitude != null && hotspot.longitude != null)
      .map((hotspot) => ({
        latitude: Number(hotspot.latitude),
        longitude: Number(hotspot.longitude),
        location: hotspot.location,
        gap: hotspot.avg_gap,
        severity: hotspot.severity,
      }));

    return [...currentPoint, ...hotspotPoints];
  }, [result, location, latitude, longitude, locationTrends]);

  const center: [number, number] | undefined = mapPoints[0]
    ? [mapPoints[0].latitude, mapPoints[0].longitude]
    : undefined;

  const gapByHour = (hourly?.data ?? []).map((item) => ({
    label: String(item.hour),
    value: item.avg_gap,
  }));

  const gapTimeline = (hourly?.data ?? []).map((item) => ({
    label: String(item.hour).padStart(2, "0"),
    value: item.avg_gap,
  }));

  const demandSupplyTimeline = (hourly?.data ?? []).map((item) => ({
    label: String(item.hour).padStart(2, "0"),
    a: item.avg_demand,
    b: item.avg_supply,
  }));

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeekGap = (dayOfWeekTrends?.data ?? []).map((item) => ({
    label: dayLabels[item.day_of_week] ?? String(item.day_of_week),
    value: item.avg_gap,
  }));

  const liveGapTimeline = (timeSeries?.data ?? []).slice(-60).map((point) => ({
    label: new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value: point.gap,
  }));

  const gapBucketPoints = (gapDistribution?.buckets ?? []).map((bucket) => ({
    label: bucket.bucket,
    value: bucket.count,
  }));

  const dedupedHistory = useMemo(() => {
    const recentBySignature = new Map<string, number>();
    const rows: PredictionRecord[] = [];

    for (const record of history) {
      const signature = [
        record.location.trim().toLowerCase(),
        record.hour,
        record.demand.toFixed(2),
        record.supply.toFixed(2),
        record.gap.toFixed(2),
        record.severity ?? "na",
      ].join("|");

      const timestampMillis = toTimestampMillis(record.timestamp);
      const latestSeen = recentBySignature.get(signature);

      if (typeof latestSeen === "number" && Math.abs(latestSeen - timestampMillis) <= 120000) {
        continue;
      }

      recentBySignature.set(signature, timestampMillis);
      rows.push(record);
    }

    return rows;
  }, [history]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 overflow-hidden">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Kapido Analytics Console</p>
          <h1 className="text-3xl font-bold text-slate-900">Demand-Supply Mismatch Intelligence</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/workflow"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Workflow
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            New Analysis
          </Link>
        </div>
      </header>

      {loading && <p className="rounded-xl bg-white/80 p-4 text-slate-700">Running prediction and analytics...</p>}

      {!loading && error && <p className="rounded-xl bg-rose-100 p-4 font-medium text-rose-700">{error}</p>}

      {!loading && !error && result && (
        <section className="space-y-6">
          <PredictionCard result={result} />

          <section className="rounded-2xl border border-white/30 bg-white/85 p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Hotspot Heatmap</h2>
            <p className="mt-1 text-sm text-slate-600">
              Red zones indicate high persistent shortages. Green zones are balanced areas.
            </p>
            <div className="mt-4">
              <MapView points={mapPoints} center={center} />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <BarTrendChart title="Average Gap by Hour" points={gapByHour} color="#b91c1c" />
            <LineTrendChart title="Gap vs Time" points={gapTimeline} color="#0f766e" />
            <DualLineTrendChart
              title="Demand vs Supply Over Time"
              seriesAName="Demand"
              seriesBName="Supply"
              points={demandSupplyTimeline}
            />

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800">Shortage Insights</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Peak shortage hours:</span>{" "}
                  {(hourly?.peak_shortage_hours ?? []).length > 0
                    ? hourly?.peak_shortage_hours.join(", ")
                    : "Insufficient data"}
                </p>
                <p>
                  <span className="font-semibold">Frequent shortage zones:</span>{" "}
                  {(hourly?.frequent_shortage_zones ?? []).length > 0
                    ? hourly?.frequent_shortage_zones.join(", ")
                    : "Insufficient data"}
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Top hotspot recommendations</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {(locationTrends?.hotspots ?? []).slice(0, 3).map((hotspot) => (
                    <li key={hotspot.location}>
                      {hotspot.severity === "high" ? "🔴" : hotspot.severity === "balanced" ? "🟢" : "🟠"} {hotspot.location}: increase incentives and shift drivers for avg gap {hotspot.avg_gap.toFixed(1)}.
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <LineTrendChart title="Average Gap by Day of Week" points={dayOfWeekGap} color="#7c3aed" />
            <BarTrendChart title="Gap Distribution Buckets" points={gapBucketPoints} color="#1d4ed8" />
            <LineTrendChart title="Recent Live Gap Timeline" points={liveGapTimeline} color="#b45309" />

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800">Distribution Summary</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>Total analyzed samples: {gapDistribution?.total_samples ?? 0}</p>
                <p>Shortage records (gap &gt; 0): {gapDistribution?.shortage_count ?? 0}</p>
                <p>Balanced/surplus records: {gapDistribution?.balanced_or_surplus_count ?? 0}</p>
                <p>
                  Gap percentiles: P50 {gapDistribution?.p50_gap.toFixed(2) ?? "0.00"}, P90 {gapDistribution?.p90_gap.toFixed(2) ?? "0.00"}, P95 {gapDistribution?.p95_gap.toFixed(2) ?? "0.00"}
                </p>
              </div>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800">Frequent Shortage Zones</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {(locationTrends?.data ?? []).slice(0, 6).map((zone) => (
                  <li key={zone.location} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="font-semibold capitalize">{zone.location}</span> · avg gap {zone.avg_gap.toFixed(2)} · severity {zone.severity}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800">Model Validation Monitor</h3>
              {validation ? (
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>Rows evaluated: {validation.dataset_rows_evaluated}</p>
                  <p>
                    Demand metrics: MAE {validation.metrics.demand.mae.toFixed(3)}, RMSE {validation.metrics.demand.rmse.toFixed(3)}
                  </p>
                  <p>
                    Supply metrics: MAE {validation.metrics.supply.mae.toFixed(3)}, RMSE {validation.metrics.supply.rmse.toFixed(3)}
                  </p>
                  <ul className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {validation.anomalies.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Validation metrics unavailable.</p>
              )}
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">Recent Prediction History</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Time</th>
                    <th className="px-2 py-2">Location</th>
                    <th className="px-2 py-2">Hour</th>
                    <th className="px-2 py-2">Demand</th>
                    <th className="px-2 py-2">Supply</th>
                    <th className="px-2 py-2">Gap</th>
                    <th className="px-2 py-2">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {dedupedHistory.slice(0, 10).map((record, index) => (
                    <tr key={`${record.timestamp}-${record.location}-${index}`} className="border-t border-slate-100">
                      <td className="px-2 py-2">{formatHistoryTime(record.timestamp)}</td>
                      <td className="px-2 py-2 capitalize">{record.location}</td>
                      <td className="px-2 py-2">{record.hour}</td>
                      <td className="px-2 py-2">{record.demand.toFixed(2)}</td>
                      <td className="px-2 py-2">{record.supply.toFixed(2)}</td>
                      <td className="px-2 py-2">{record.gap.toFixed(2)}</td>
                      <td className="px-2 py-2">{record.severity ?? "n/a"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">Loading dashboard...</main>}>
      <DashboardContent />
    </Suspense>
  );
}
