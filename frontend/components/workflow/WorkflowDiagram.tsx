"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useMemo } from "react";

import type { WorkflowEdgeSpec, WorkflowNodeCategory, WorkflowNodeData } from "@/lib/workflow-content";

const CATEGORY_STYLES: Record<WorkflowNodeCategory, { border: string; fill: string; accent: string }> = {
  frontend: { border: "#0f766e", fill: "#ecfeff", accent: "#115e59" },
  backend: { border: "#2563eb", fill: "#eff6ff", accent: "#1d4ed8" },
  database: { border: "#7c3aed", fill: "#f5f3ff", accent: "#6d28d9" },
  analytics: { border: "#b45309", fill: "#fff7ed", accent: "#c2410c" },
  offline: { border: "#475569", fill: "#f8fafc", accent: "#334155" },
  external: { border: "#be185d", fill: "#fff1f2", accent: "#be185d" },
};

function WorkflowNode({ data, selected }: NodeProps<Node<WorkflowNodeData>>) {
  const palette = CATEGORY_STYLES[data.category];

  return (
    <div
      className={`group relative w-[260px] rounded-2xl border bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.12)] transition duration-200 ${
        selected ? "scale-[1.02] ring-2 ring-slate-900/20" : "hover:-translate-y-0.5"
      }`}
      style={{ borderColor: palette.border, background: `linear-gradient(180deg, ${palette.fill} 0%, #ffffff 100%)` }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="border-2 border-white"
        style={{ background: palette.border, width: 12, height: 12, borderWidth: 2, borderColor: "#ffffff" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="border-2 border-white"
        style={{ background: palette.border, width: 12, height: 12, borderWidth: 2, borderColor: "#ffffff" }}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: palette.accent }}>
            {data.category}
          </p>
          <h3 className="mt-1 text-base font-black text-slate-900">{data.title}</h3>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
          style={{ backgroundColor: palette.border }}
        >
          live
        </span>
      </div>

      <p className="mt-2 break-words text-sm leading-6 text-slate-700">{data.summary}</p>

      <div className="mt-3 break-all rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600">
        {data.codeRef}
      </div>

      <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
        {data.details.map((detail) => (
          <li key={detail} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: palette.border }} />
            <span className="break-words">{detail}</span>
          </li>
        ))}
      </ul>

      <div
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-72 -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-left text-white opacity-0 shadow-2xl transition duration-200 group-hover:opacity-100"
        style={{ borderColor: `${palette.border}33` }}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: palette.fill }}>
          hover detail
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-200">{data.summary}</p>
      </div>
    </div>
  );
}

const nodeTypes = {
  workflowNode: WorkflowNode,
};

type WorkflowDiagramProps = {
  nodes: Array<Node<WorkflowNodeData>>;
  edges: WorkflowEdgeSpec[];
};

export function WorkflowDiagram({ nodes, edges }: WorkflowDiagramProps) {
  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "smoothstep",
        animated: edge.kind !== "offline",
        style: {
          stroke: edge.kind === "offline" ? "#64748b" : edge.kind === "supporting" ? "#94a3b8" : "#0f766e",
          strokeWidth: edge.kind === "primary" ? 2.5 : 2,
        },
        labelStyle: {
          fontSize: 12,
          fontWeight: 700,
          fill: "#1e293b",
        },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 6,
        labelBgStyle: {
          fill: "#ffffff",
          fillOpacity: 0.98,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: edge.kind === "offline" ? "#64748b" : "#0f766e" },
      })),
    [edges],
  );

  return (
    <section className="space-y-4">
      <div
        className="relative overflow-visible rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
        style={{
          height: 920,
          background:
            "radial-gradient(circle at top left, rgba(15,118,110,0.14), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        }}
      >
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          <LegendChip label="Frontend" tone="emerald" />
          <LegendChip label="Backend" tone="blue" />
          <LegendChip label="Database" tone="violet" />
          <LegendChip label="Analytics" tone="amber" />
          <LegendChip label="Offline" tone="slate" />
          <LegendChip label="External" tone="rose" />
        </div>

        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm text-slate-600 shadow-lg backdrop-blur">
          Drag to pan, scroll to zoom, hover a node for details.
        </div>

        <ReactFlow
          nodes={nodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.08 }}
          minZoom={0.24}
          maxZoom={1.35}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          nodesDraggable
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#cbd5e1" gap={18} size={1} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => {
              const category = (node.data as WorkflowNodeData | undefined)?.category;
              return category ? CATEGORY_STYLES[category].border : "#64748b";
            }}
            className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg"
          />
          <Controls className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg" />
        </ReactFlow>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <LaneCard title="Main runtime" text="InputForm -> /dashboard -> /predict -> prediction output" />
        <LaneCard title="Persistence and analytics" text="storePrediction -> MongoDB -> trends and validation" />
        <LaneCard title="Offline model lifecycle" text="generate_ride_data.js -> train_model.py -> model.pkl" />
        <LaneCard title="External services" text="MongoDB Atlas and OpenStreetMap tiles" />
      </div>
    </section>
  );
}

function LegendChip({ label, tone }: { label: string; tone: "emerald" | "blue" | "violet" | "amber" | "slate" | "rose" }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  } as const;

  return <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${tones[tone]}`}>{label}</span>;
}

function LaneCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-left shadow-lg backdrop-blur">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}
