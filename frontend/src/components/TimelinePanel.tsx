"use client";

import type { Metrics } from "@/types/analysis";

const PHASE_LABELS: Record<string, string> = {
  preparation: "Preparation",
  docker: "Docker",
  dependencies: "Dependencies",
  cuda_kernels: "CUDA kernels",
  validation: "Validation",
};

const DEFAULT_TIMELINE = {
  preparation: 0,
  docker: 0,
  dependencies: 0,
  cuda_kernels: 0,
  validation: 0,
  total: 0,
};

interface TimelinePanelProps {
  metrics: Metrics;
}

export function TimelinePanel({ metrics }: TimelinePanelProps) {
  const timeline = metrics.timeline ?? DEFAULT_TIMELINE;
  const developerDays = metrics.developerDays ?? timeline.total / 8;
  const estimatedCost = metrics.estimatedCost ?? timeline.total * 110;
  const phases = Object.entries(timeline).filter(([key]) => key !== "total");

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Timeline & cost
        </h3>
        <div className="text-right text-sm">
          <p className="text-zinc-400">
            <span className="font-semibold text-white">{developerDays}</span> dev days
          </p>
          <p className="text-zinc-400">
            Est. <span className="font-semibold text-white">${estimatedCost.toLocaleString()}</span>
          </p>
        </div>
      </div>
      <ul className="mt-6 space-y-3">
        {phases.map(([key, hours]) => {
          const pct = timeline.total > 0 ? (hours / timeline.total) * 100 : 0;
          return (
            <li key={key}>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-300">{PHASE_LABELS[key] ?? key}</span>
                <span className="tabular-nums text-zinc-500">{hours}h</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-red-600 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-zinc-500">
        Total estimated effort: {timeline.total} hours
      </p>
    </section>
  );
}
