"use client";

import type { Blocker } from "@/types/analysis";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

function severityStyles(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "border-red-800/50 bg-red-950/40 text-red-200";
    case "high":
      return "border-orange-800/50 bg-orange-950/40 text-orange-200";
    default:
      return "border-amber-800/50 bg-amber-950/40 text-amber-200";
  }
}

interface BlockersPanelProps {
  blockers: Blocker[];
}

export function BlockersPanel({ blockers }: BlockersPanelProps) {
  const sorted = [...blockers].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity.toLowerCase()] ?? 9) -
      (SEVERITY_ORDER[b.severity.toLowerCase()] ?? 9),
  );

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
        Blockers ({sorted.length})
      </h3>
      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No blockers detected.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {sorted.map((blocker) => (
            <li
              key={`${blocker.source}-${blocker.title}`}
              className={`rounded-lg border p-4 ${severityStyles(blocker.severity)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{blocker.title}</p>
                <span className="shrink-0 text-[10px] uppercase tracking-wider opacity-80">
                  {blocker.severity}
                </span>
              </div>
              <p className="mt-2 text-sm opacity-90">{blocker.detail}</p>
              <p className="mt-2 text-[10px] opacity-60">Source: {blocker.source}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
