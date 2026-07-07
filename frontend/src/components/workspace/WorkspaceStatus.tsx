"use client";

import type { MigrationStatus } from "@/types/analysis";

interface Props {
  status: MigrationStatus;
}

const labels: [keyof MigrationStatus, string][] = [
  ["analysis", "Analysis"],
  ["planning", "Planning"],
  ["docker", "Docker"],
  ["migrate", "Migrate"],
  ["validate", "Validate"],
  ["benchmark", "Benchmark"],
  ["productionReady", "Production"],
  ["maintain", "Maintain"],
];

export function WorkspaceStatus({ status }: Props) {
  return (
    <div className="border-b border-zinc-800 bg-zinc-950 px-8 py-4">
      <div className="flex flex-wrap gap-4">
        {labels.map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 rounded-md border border-zinc-800 px-3 py-2"
          >
            <div
              className={`h-2 w-2 rounded-full ${status[key] ? "bg-green-500" : "bg-zinc-600"}`}
            />
            <span className="text-sm">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}