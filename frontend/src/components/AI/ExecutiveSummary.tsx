import type { AnalyzeResponse } from "@/types/analysis";

interface ExecutiveSummaryProps {
  data: AnalyzeResponse;
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  const analysis = data.analysis;

  const compatibility =
    data.findings?.compatibility?.score ??
    analysis?.compatibilityScore ??
    data.explainability?.compatibility?.score ??
    0;

  const metrics = data.metrics;

  const hours = analysis?.estimatedHours ?? 0;

  const readiness =
    metrics?.readinessScore ??
    compatibility;

  const success =
    metrics?.successProbability ??
    compatibility;

  const cost =
    metrics?.estimatedCost ??
    hours * 110;

  const developerDays =
    metrics?.developerDays ??
    Number((hours / 8).toFixed(1));

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Executive Summary
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            Migration Assessment
          </h3>
        </div>
        <div className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
          {success}% Success Probability
        </div>
      </div>
      <p className="mt-5 leading-7 text-zinc-300">
        {analysis?.summary ??
          "No AI summary available. Deterministic migration analysis was used instead."}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <MetricCard
          title="Compatibility"
          value={`${compatibility}%`}
        />

        <MetricCard
          title="Readiness"
          value={`${readiness}%`}
        />

        <MetricCard
          title="Developer Days"
          value={`${developerDays}`}
        />

        <MetricCard
          title="Estimated Cost"
          value={`$${cost}`}
        />

      </div>
    </section>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
}

function MetricCard({title, value,}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}