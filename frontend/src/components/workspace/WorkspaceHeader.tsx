"use client";

import type { AnalyzeResponse } from "@/types/analysis";

interface Props {
  analysis: AnalyzeResponse;
}

export function WorkspaceHeader({ analysis }: Props) {
  const compatibility = analysis.findings?.compatibility?.score ?? 0;
  const metrics = analysis.metrics;

  function MetricCard({ title, value }: { title: string; value: string }) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">{title}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </div>
    );
  }

  return (
    <header className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-8 -pt-8">

      
      <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        <div>
        <div className="flex justify-end">
        <button onClick={() => window.history.back()}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm transition-all duration-200 hover:bg-zinc-700">
          ← Back
        </button>
      </div>
          <p className="text-sm uppercase tracking-wider text-zinc-500">Migration Workspace</p>
          <h1 className="mt-2 text-3xl font-bold">{analysis.repository.name}</h1>
          <p className="mt-2 text-zinc-400">{analysis.repository.url}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <MetricCard title="Compatibility" value={`${compatibility}%`} />
          <MetricCard title="Readiness" value={`${metrics?.readinessScore ?? 0}`} />
          <MetricCard title="Success" value={`${metrics?.successProbability ?? 0}%`} />
          <MetricCard title="Days" value={`${metrics?.developerDays ?? 0}`} />
          <MetricCard title="Cost" value={`$${metrics?.estimatedCost ?? 0}`} />
        </div>

        <div className="mt-6 flex justify-end">
          <span
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              analysis.artifacts?.aiProvider === "gemini"
                ? "bg-blue-600/20 text-blue-400 border border-blue-600"
                : analysis.artifacts?.aiProvider === "fireworks"
                ? "bg-orange-600/20 text-orange-400 border border-orange-600"
                : "bg-zinc-700/40 text-zinc-300 border border-zinc-700"
            }`}
          >
            AI Provider: {analysis.artifacts?.aiProvider ?? "Deterministic"}
          </span>
        </div>
      </div>
    </header>
  );
}
