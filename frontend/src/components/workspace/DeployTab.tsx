"use client";

import type { AnalyzeResponse } from "@/types/analysis";

interface Props {
  analysis: AnalyzeResponse;
}

export function DeployTab({ analysis }: Props) {
  const steps = analysis.artifacts?.deployGuide ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        Deployment Guide
      </h2>

      {steps.map((step, index) => (
        <div
          key={index}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10"
        >
          <div className="mb-2 text-sm text-zinc-500">
            Step {index + 1}
          </div>

          <div>{step}</div>
        </div>
      ))}
    </div>
  );
}