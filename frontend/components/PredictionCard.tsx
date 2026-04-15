import type { PredictionResult } from "@/lib/types";

type PredictionCardProps = {
  result: PredictionResult;
};

export function PredictionCard({ result }: PredictionCardProps) {
  const isShortage = result.gap > 0;
  const severityTone =
    result.severity === "high"
      ? "bg-rose-100 text-rose-800"
      : result.severity === "medium"
        ? "bg-orange-100 text-orange-800"
        : result.severity === "low"
          ? "bg-amber-100 text-amber-800"
          : "bg-emerald-100 text-emerald-800";
  const statusText = isShortage ? "🔴 Shortage" : "🟢 Balanced";

  return (
    <section className="rounded-2xl border border-white/30 bg-white/85 p-6 shadow-xl backdrop-blur">
      <h2 className="text-xl font-bold text-slate-900">Prediction Summary</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBlock label="Demand" value={result.demand} tone="text-indigo-700" />
        <StatBlock label="Supply" value={result.supply} tone="text-emerald-700" />
        <StatBlock
          label="Gap (Demand - Supply)"
          value={result.gap}
          tone={isShortage ? "text-rose-700" : "text-emerald-700"}
        />
      </div>
      <div className="mt-4 space-y-3">
        <p className={`rounded-xl px-3 py-2 text-sm font-semibold ${severityTone}`}>
          {statusText} · Severity: {result.severity}
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Why this happened</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {result.explanations.map((explanation) => (
                <li key={explanation}>• {explanation}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Recommended actions</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {result.recommendations.map((recommendation) => (
                <li key={recommendation}>• {recommendation}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

function StatBlock({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value.toFixed(2)}</p>
    </div>
  );
}
