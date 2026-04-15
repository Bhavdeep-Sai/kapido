"use client";

import { InfoTooltip } from "@/components/InfoTooltip";

type Point = {
  label: string;
  value: number;
};

type MultiSeriesPoint = {
  label: string;
  a: number;
  b: number;
};

type BarChartProps = {
  title: string;
  points: Point[];
  color?: string;
};

type DualLineChartProps = {
  title: string;
  seriesAName: string;
  seriesBName: string;
  points: MultiSeriesPoint[];
};

type LineChartProps = {
  title: string;
  points: Point[];
  color?: string;
};

function chartY(value: number, max: number, height: number): number {
  if (max <= 0) return height;
  return Math.max(0, Math.min(height, height - (value / max) * height));
}

function chartYWithBounds(value: number, min: number, max: number, height: number): number {
  if (max <= min) return height / 2;
  return Math.max(0, Math.min(height, height - ((value - min) / (max - min)) * height));
}

const BAR_MARGIN = { top: 16, right: 12, bottom: 28, left: 36 };
const LINE_MARGIN = { top: 16, right: 12, bottom: 20, left: 24 };

function toSafeNumber(value: number | undefined | null): number {
  return Number.isFinite(value ?? Number.NaN) ? Number(value) : 0;
}

function buildYTicks(max: number): number[] {
  const steps = 4;
  const safeMax = Math.max(max, 1);
  return Array.from({ length: steps + 1 }, (_, index) => Math.round((safeMax * index) / steps));
}

function buildXTickIndexes(length: number): number[] {
  if (length === 0) {
    return [];
  }

  if (length <= 1) {
    return [0];
  }

  const quarter = Math.floor((length - 1) / 4);
  const mid = Math.floor((length - 1) / 2);
  const threeQuarter = Math.floor(((length - 1) * 3) / 4);
  const last = length - 1;
  const indexes = [0, quarter, mid, threeQuarter, last];
  return Array.from(new Set(indexes));
}

function buildNiceRange(values: number[]): { min: number; max: number; ticks: number[] } {
  if (values.length === 0) {
    return { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(rawMax - rawMin, 1);
  const padding = Math.max(span * 0.2, Math.abs(rawMax) * 0.08, 1);
  const min = Math.floor((rawMin - padding) * 10) / 10;
  const max = Math.ceil((rawMax + padding) * 10) / 10;
  const steps = 4;
  const ticks = Array.from({ length: steps + 1 }, (_, index) => min + ((max - min) * index) / steps);
  return { min, max, ticks };
}

export function BarTrendChart({ title, points, color = "#b91c1c" }: BarChartProps) {
  const width = 680;
  const height = 260;
  const plotWidth = width - BAR_MARGIN.left - BAR_MARGIN.right;
  const plotHeight = height - BAR_MARGIN.top - BAR_MARGIN.bottom;
  const max = Math.max(...points.map((p) => Math.max(p.value, 0)), 1);
  const barWidth = plotWidth / Math.max(points.length, 1);

  const infoText =
    title === "Average Gap by Hour"
      ? "Shows the average demand-supply gap for each hour of the day from stored prediction history."
      : title === "Gap Distribution Buckets"
        ? "Shows how many stored predictions fall into each gap bucket so you can see shortage spread."
        : "Shows grouped values as bars so you can compare categories at a glance.";

  return (
    <article className="relative rounded-2xl border border-slate-200 bg-white p-4 pr-12 shadow-sm">
      <InfoTooltip label={`About ${title}`} content={infoText} />
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label={title}>
        {points.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="14" fill="#64748b">
            No data available yet
          </text>
        )}
        {buildYTicks(max).map((tickValue) => {
          const y = BAR_MARGIN.top + chartY(tickValue, max, plotHeight);
          return (
            <g key={tickValue}>
              <line
                x1={BAR_MARGIN.left}
                y1={y}
                x2={width - BAR_MARGIN.right}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text x={BAR_MARGIN.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
                {tickValue}
              </text>
            </g>
          );
        })}
        <line x1={BAR_MARGIN.left} y1={BAR_MARGIN.top + plotHeight} x2={width - BAR_MARGIN.right} y2={BAR_MARGIN.top + plotHeight} stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={BAR_MARGIN.left} y1={BAR_MARGIN.top} x2={BAR_MARGIN.left} y2={BAR_MARGIN.top + plotHeight} stroke="#94a3b8" strokeWidth="1.5" />
        {points.map((point, index) => {
          const x = BAR_MARGIN.left + index * barWidth + barWidth * 0.12;
          const h = (Math.max(point.value, 0) / max) * plotHeight;
          const y = BAR_MARGIN.top + plotHeight - h;
          return (
            <g key={`${point.label}-${index}`}>
              <rect x={x} y={y} width={barWidth * 0.7} height={h} fill={color} opacity={0.85} rx={4} />
              <text x={x + barWidth * 0.35} y={height - 8} textAnchor="middle" fontSize="10" fill="#334155">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </article>
  );
}

export function LineTrendChart({ title, points, color = "#0f766e" }: LineChartProps) {
  const width = 680;
  const height = 240;
  const plotWidth = width - LINE_MARGIN.left - LINE_MARGIN.right;
  const plotHeight = height - LINE_MARGIN.top - LINE_MARGIN.bottom;
  const yRange = buildNiceRange(points.map((point) => point.value));

  const path = points
    .map((point, index) => {
      const x = LINE_MARGIN.left + (index / Math.max(points.length - 1, 1)) * plotWidth;
      const y = LINE_MARGIN.top + chartYWithBounds(point.value, yRange.min, yRange.max, plotHeight);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const infoText =
    title === "Gap vs Time"
      ? "Shows how the average gap changes across hourly records in the latest dataset window."
      : title === "Average Gap by Day of Week"
        ? "Shows the average gap grouped by weekday so you can compare demand pressure across the week."
        : title === "Recent Live Gap Timeline"
          ? "Shows the most recent stored gap values in chronological order from the prediction history."
          : "Shows a line view of one measured value over time or sequence.";

  return (
    <article className="relative rounded-2xl border border-slate-200 bg-white p-4 pr-12 shadow-sm">
      <InfoTooltip label={`About ${title}`} content={infoText} />
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label={title}>
        {points.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="14" fill="#64748b">
            No data available yet
          </text>
        )}
        {yRange.ticks.map((tickValue) => {
          const y = LINE_MARGIN.top + chartYWithBounds(tickValue, yRange.min, yRange.max, plotHeight);
          return (
            <g key={tickValue}>
              <line
                x1={LINE_MARGIN.left}
                y1={y}
                x2={width - LINE_MARGIN.right}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text x={LINE_MARGIN.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
                {tickValue}
              </text>
            </g>
          );
        })}
        <line x1={LINE_MARGIN.left} y1={LINE_MARGIN.top + plotHeight} x2={width - LINE_MARGIN.right} y2={LINE_MARGIN.top + plotHeight} stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={LINE_MARGIN.left} y1={LINE_MARGIN.top} x2={LINE_MARGIN.left} y2={LINE_MARGIN.top + plotHeight} stroke="#94a3b8" strokeWidth="1.5" />
        <path d={path} fill="none" stroke={color} strokeWidth="3" />
        {buildXTickIndexes(points.length).map((index) => {
          const point = points[index];
          const x = LINE_MARGIN.left + (index / Math.max(points.length - 1, 1)) * plotWidth;
          return (
            <text
              key={`${point.label}-${index}`}
              x={x}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {point.label}
            </text>
          );
        })}
        {points.map((point, index) => {
          const x = LINE_MARGIN.left + (index / Math.max(points.length - 1, 1)) * plotWidth;
          const y = LINE_MARGIN.top + chartYWithBounds(point.value, yRange.min, yRange.max, plotHeight);
          return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="3.5" fill={color} />;
        })}
      </svg>
    </article>
  );
}

export function DualLineTrendChart({ title, seriesAName, seriesBName, points }: DualLineChartProps) {
  const width = 680;
  const height = 260;
  const plotWidth = width - LINE_MARGIN.left - LINE_MARGIN.right;
  const plotHeight = height - LINE_MARGIN.top - LINE_MARGIN.bottom;
  const yRange = buildNiceRange(points.flatMap((point) => [point.a, point.b]));

  const pathA = points
    .map((point, index) => {
      const x = LINE_MARGIN.left + (index / Math.max(points.length - 1, 1)) * plotWidth;
      const y = LINE_MARGIN.top + chartYWithBounds(point.a, yRange.min, yRange.max, plotHeight);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const pathB = points
    .map((point, index) => {
      const x = LINE_MARGIN.left + (index / Math.max(points.length - 1, 1)) * plotWidth;
      const y = LINE_MARGIN.top + chartYWithBounds(point.b, yRange.min, yRange.max, plotHeight);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const infoText =
    title === "Demand vs Supply Over Time"
      ? "Compares average demand and supply across the same hourly buckets so shortages are easier to spot."
      : "Shows two related line series on the same scale for direct comparison.";

  return (
    <article className="relative rounded-2xl border border-slate-200 bg-white p-4 pr-12 shadow-sm">
      <InfoTooltip label={`About ${title}`} content={infoText} />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <div className="flex gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-600" />{seriesAName}</span>
          <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-600" />{seriesBName}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label={title}>
        {points.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="14" fill="#64748b">
            No data available yet
          </text>
        )}
        {yRange.ticks.map((tickValue) => {
          const y = LINE_MARGIN.top + chartYWithBounds(tickValue, yRange.min, yRange.max, plotHeight);
          return (
            <g key={tickValue}>
              <line
                x1={LINE_MARGIN.left}
                y1={y}
                x2={width - LINE_MARGIN.right}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text x={LINE_MARGIN.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
                {tickValue}
              </text>
            </g>
          );
        })}
        <line x1={LINE_MARGIN.left} y1={LINE_MARGIN.top + plotHeight} x2={width - LINE_MARGIN.right} y2={LINE_MARGIN.top + plotHeight} stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={LINE_MARGIN.left} y1={LINE_MARGIN.top} x2={LINE_MARGIN.left} y2={LINE_MARGIN.top + plotHeight} stroke="#94a3b8" strokeWidth="1.5" />
        <path d={pathA} fill="none" stroke="#0284c7" strokeWidth="3" />
        <path d={pathB} fill="none" stroke="#059669" strokeWidth="3" />
        {buildXTickIndexes(points.length).map((index) => {
          const point = points[index];
          const x = LINE_MARGIN.left + (index / Math.max(points.length - 1, 1)) * plotWidth;
          return (
            <text
              key={`${point.label}-${index}`}
              x={x}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </article>
  );
}

export function completeHourlyPoints(points: Point[]): Point[] {
  const byHour = new Map<number, number>();

  points.forEach((point) => {
    const hour = Number.parseInt(point.label, 10);
    if (!Number.isNaN(hour)) {
      byHour.set(hour, toSafeNumber(point.value));
    }
  });

  return Array.from({ length: 24 }, (_, hour) => ({
    label: String(hour).padStart(2, "0"),
    value: byHour.get(hour) ?? 0,
  }));
}
