"use client";

import type { AnalyzeResponse } from "@/types/analysis";
import { DependencyGraph } from "@/components/DependencyGraph";

export function DependenciesTab({ analysis }: { analysis: AnalyzeResponse }) {
  const deps = analysis.findings?.dependencies;

  return (
    <div className="space-y-6">

<section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
  <div className="mb-4">
    <h2 className="text-xl font-bold">
      Dependency Graph
    </h2>

    <p className="mt-2 text-sm text-zinc-400">
      Interactive visualization of detected frameworks,
      compatibility components, and recommended ROCm
      alternatives.
    </p>
  </div>

  {analysis.graph ? (
    <DependencyGraph graph={analysis.graph} />
  ) : (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-500">
      Dependency graph unavailable.
    </div>
  )}
</section>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10">
        <h2 className="text-xl font-bold">Frameworks</h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {deps?.frameworks.map((framework) => (
            <span
              key={framework}
              className="rounded bg-blue-700 px-3 py-2"
            >
              {framework}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10">
        <h2 className="text-xl font-bold">NVIDIA Packages</h2>

        <div className="mt-4 space-y-2">
          {deps?.nvidia_packages.length === 0 ? (
            <div className="rounded-xl border border-green-700 bg-green-950/20 p-8 text-center">
              <h2 className="text-xl font-semibold text-green-400">
                No NVIDIA-specific dependencies found.
              </h2>
              <p className="mt-2 text-zinc-400">
                Repository appears AMD compatible.
              </p>
            </div>
          ) : (
            deps?.nvidia_packages.map((pkg) => (
              <div key={pkg.name} className="rounded bg-zinc-800 p-3">
                {pkg.name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
