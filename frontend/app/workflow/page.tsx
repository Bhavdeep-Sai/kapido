import Link from "next/link";

import { WorkflowDiagram } from "@/components/workflow/WorkflowDiagram";
import {
  workflowDiagramEdges,
  workflowDiagramNodes,
  workflowEndpoints,
  workflowHighlights,
  workflowModules,
  workflowSteps,
} from "@/lib/workflow-content";

export const metadata = {
  title: "Workflow | Kapido",
  description: "Interactive, code-backed explanation of how Kapido routes predictions, analytics, storage, and model training.",
};

export default function WorkflowPage() {
  const runtimeSteps = workflowSteps.slice(0, 7);
  const offlineStep = workflowSteps[7];

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white/90 px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_34%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
              Workflow blueprint
            </p>
            <h1 className="max-w-xl text-xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Kapido system flow, explained as one clear operational story.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
              This page shows how one analysis request moves from the input form, through prediction and persistence, into analytics,
              validation, and dashboard visualization.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                Back to home
              </Link>
              <Link
                href="/dashboard?hour=8&location=chittoor&latitude=13.2172&longitude=79.1003"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Run live analysis
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard value={`${runtimeSteps.length}`} label="Runtime stages" />
            <MetricCard value={`${workflowEndpoints.length}`} label="Backend routes" />
            <MetricCard value={`${workflowModules.length}`} label="System modules" />
            <MetricCard value="1" label="Offline training lane" />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-xl border border-slate-200 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">Live request path</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            The sequence below focuses on what happens during a real dashboard analysis run.
          </p>

          <div className="mt-6 space-y-4">
            {runtimeSteps.map((step, index) => (
              <article key={step.title} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="absolute left-4 top-4 rounded-lg bg-slate-900 px-2 py-1 text-xs font-black text-white">
                  {index + 1}
                </div>
                <div className="ml-12">
                  <h3 className="text-lg font-black text-slate-950">{step.title.replace(/^\d+\.\s*/, "")}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{step.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.endpoints.length > 0
                      ? step.endpoints.map((endpoint) => <Tag key={endpoint} tone="emerald" text={endpoint} />)
                      : <Tag tone="slate" text="No direct API call" />}
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    {step.functions.slice(0, 4).join(" • ")}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="rounded-xl h-200 border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">What to look for</h2>
          <div className="mt-4 space-y-3">
            {workflowHighlights.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>

          {offlineStep && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Offline lane</p>
              <p className="mt-2 text-sm leading-6 text-amber-900">{offlineStep.summary}</p>
            </div>
          )}
        </aside>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Interactive system map</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              Explore the full architecture graph. Pan, zoom, and inspect how runtime and offline parts connect.
            </p>
          </div>
          <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
            Input to insight pipeline
          </p>
        </div>

        <div className="mt-6">
          <WorkflowDiagram nodes={workflowDiagramNodes} edges={workflowDiagramEdges} />
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border border-slate-200 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">API contracts</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Endpoints currently available in the FastAPI backend and their usage in the live dashboard.
          </p>

          <div className="mt-5 space-y-3">
            {workflowEndpoints.map((endpoint) => (
              <article key={endpoint.path} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                    {endpoint.method} {endpoint.path}
                  </p>
                  <Tag tone={endpoint.status === "used in dashboard" ? "emerald" : "slate"} text={endpoint.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{endpoint.purpose}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">Module ownership</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Where each responsibility lives in the codebase, with a clear runtime vs offline split.
          </p>

          <div className="mt-5 space-y-4">
            {workflowModules.map((module) => (
              <article key={module.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-base font-black text-slate-950">{module.title}</h3>
                  <Tag tone="blue" text={module.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{module.summary}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {module.files.slice(0, 6).map((file) => (
                    <p key={file} className="rounded-lg border border-white bg-white px-3 py-2 text-xs font-semibold text-slate-600 break-all whitespace-normal">
                      {file}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function Tag({ text, tone }: { text: string; tone: "emerald" | "blue" | "slate" }) {
  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
  } as const;

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${toneClasses[tone]}`}>
      {text}
    </span>
  );
}
