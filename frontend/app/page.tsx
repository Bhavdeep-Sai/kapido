"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

const InputForm = dynamic(() => import("@/components/InputForm").then((mod) => mod.InputForm), {
  ssr: false,
  loading: () => <div className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-xl backdrop-blur">Loading map and form...</div>,
});

export default function Home() {
  const router = useRouter();

  const handleSubmit = ({
    hour,
    location,
    latitude,
    longitude,
  }: {
    hour: number;
    location: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const params = new URLSearchParams({
      hour: String(hour),
      location,
    });

    if (typeof latitude === "number" && !Number.isNaN(latitude)) {
      params.set("latitude", String(latitude));
    }
    if (typeof longitude === "number" && !Number.isNaN(longitude)) {
      params.set("longitude", String(longitude));
    }

    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 overflow-hidden">
      <section className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <p className="inline-flex rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 shadow">
            Kapido · Ride Intelligence
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Predict demand, estimate supply, and reveal shortage hotspots.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
            Kapido analyzes hourly ride demand-supply mismatch and visualizes pressure zones on a city map so ops teams can rebalance drivers faster.
          </p>

          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat value="Demand" detail="Forecasted ride requests" />
            <Stat value="Supply" detail="Estimated active drivers" />
            <Stat value="Gap" detail="Demand - Supply signal" />
          </div>

          <div className="pt-1">
            <Link
              href="/workflow"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              View Product Workflow
            </Link>
          </div>
        </div>

        <InputForm onSubmit={handleSubmit} />
      </section>
    </main>
  );
}

function Stat({ value, detail }: { value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-white/50 bg-white/80 p-4 shadow">
      <p className="text-sm font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{detail}</p>
    </div>
  );
}
