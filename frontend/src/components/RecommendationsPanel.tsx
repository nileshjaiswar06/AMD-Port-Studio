"use client";

import type { Recommendation } from "@/types/analysis";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function priorityStyles(priority: string): string {
  switch (priority.toLowerCase()) {
    case "critical":
      return "text-red-400";
    case "high":
      return "text-orange-400";
    case "medium":
      return "text-amber-400";
    default:
      return "text-zinc-400";
  }
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
}

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  const sorted = [...recommendations].sort(
    (a, b) =>
      (PRIORITY_ORDER[a.priority.toLowerCase()] ?? 9) -
      (PRIORITY_ORDER[b.priority.toLowerCase()] ?? 9),
  );

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
        Recommendations
      </h3>
      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No recommendations.</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {sorted.map((rec, index) => (
            <li key={`${rec.priority}-${rec.action}`} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
                {index + 1}
              </span>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${priorityStyles(rec.priority)}`}>
                  {rec.priority}
                </p>
                <p className="mt-1 text-sm font-medium text-white">{rec.action}</p>
                <p className="mt-1 text-sm text-zinc-400">{rec.rationale}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
