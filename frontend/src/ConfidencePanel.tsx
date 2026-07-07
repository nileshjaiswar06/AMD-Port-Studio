"use client";

import type { Confidence } from "@/types/analysis";

interface Props {
  confidence?: Confidence;
}

function ConfidenceCard({
  title,
  value,
  score,
  reason,
}: {
  title: string;
  value: string;
  score: number;
  reason: string;
}) {
  const color =
    value === "high"
      ? "bg-green-600/20 text-green-300"
      : value === "medium"
      ? "bg-yellow-600/20 text-yellow-300"
      : "bg-red-600/20 text-red-300";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>

        <span className={`rounded px-2 py-1 text-xs font-medium ${color}`}>
          {value.toUpperCase()}
        </span>
      </div>

      <div className="mt-4 text-3xl font-bold">
        {score}%
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        {reason}
      </p>
    </div>
  );
}

export function ConfidencePanel({
  confidence,
}: Props) {
  if (!confidence) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          Analysis Confidence
        </h2>

        <p className="text-sm text-zinc-500">
          Confidence for each stage of the migration analysis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ConfidenceCard
          title="CUDA Detection"
          {...confidence.cuda}
        />

        <ConfidenceCard
          title="Dependencies"
          {...confidence.dependencies}
        />

        <ConfidenceCard
          title="Docker"
          {...confidence.docker}
        />

        <ConfidenceCard
          title="Compatibility"
          {...confidence.compatibility}
        />

        <ConfidenceCard
          title="Recommendations"
          {...confidence.recommendations}
        />

        <ConfidenceCard
          title="Overall"
          {...confidence.overall}
        />
      </div>
    </section>
  );
}