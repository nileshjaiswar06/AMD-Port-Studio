"use client";

import type { AnalyzeResponse } from "@/types/analysis";

interface Props {
  analysis: AnalyzeResponse;
}

export function CompatibilityTab({ analysis }: Props) {
  const components =
    analysis.findings?.compatibility.components ?? [];

  if (components.length === 0) {
    return (
      <div className="rounded-xl border border-green-700 bg-green-950/20 p-8 text-center">
        
        <h2 className="text-xl font-semibold text-green-400">
          No compatibility issues detected.
        </h2>
        <p className="mt-2 text-zinc-400">
          Repository appears AMD compatible.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        Compatibility Report
      </h2>

      {components.map((component) => (
        <div
          key={component.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {component.label ??
                  component.name ??
                  component.id}
              </h3>
              <p className="text-sm text-zinc-500">
                {component.type}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold border
              ${component.status==="supported" ? "border-green-500 bg-green-500/10 text-green-400" : component.status==="partial"
              ? "border-yellow-500 bg-yellow-500/10 text-yellow-300" : "border-red-500 bg-red-500/10 text-red-400"
              }`}>
            {component.status.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs text-zinc-500">
                Alternative
              </div>
              <div>{component.alternative}</div>
            </div>

            <div>
              <div className="text-xs text-zinc-500">
                Difficulty
              </div>
              <div>{component.difficulty}</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-zinc-400">
            {component.notes}
          </div>
        </div>
      ))}
    </div>
  );
}
