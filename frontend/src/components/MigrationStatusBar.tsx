"use client";

import type { MigrationStatus } from "@/types/analysis";

const STAGES: { key: keyof MigrationStatus; label: string }[] = [
  { key: "analysis", label: "Analysis" },
  { key: "planning", label: "Planning" },
  { key: "docker", label: "Docker" },
  { key: "migrate", label: "Migrate" },
  { key: "validate", label: "Validate" },
  { key: "benchmark", label: "Benchmark" },
  { key: "productionReady", label: "Production" },
  { key: "maintain", label: "Maintain" },
];

interface MigrationStatusBarProps {
  status: MigrationStatus;
}

export function MigrationStatusBar({ status }: MigrationStatusBarProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Migration pipeline
      </h3>
      <ol className="mt-4 flex flex-wrap gap-2">
        {STAGES.map(({ key, label }) => {
          const done = status[key];
          return (
            <li
              key={key}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                done
                  ? "border-emerald-800/40 bg-emerald-950/30 text-emerald-300"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500"
              }`}
            >
              <span aria-hidden>{done ? "✔" : "⬜"}</span>
              {label}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
