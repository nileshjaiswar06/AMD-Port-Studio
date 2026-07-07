"use client";

import type { AnalyzeResponse } from "@/types/analysis";
import { Skeleton } from "@/components/workspace/Skeleton";

export function OverviewTab({
  analysis,
}: {
  analysis: AnalyzeResponse;
}) {
  if (!analysis.analysis?.summary) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10">
      <h2 className="mb-4 text-xl font-semibold">
        Overview
      </h2>
      <p>{analysis.analysis.summary}</p>
    </div>
  );
}
