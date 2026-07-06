"use client";

import type { Metrics, Explainability } from "@/types/analysis";
import { ExplainabilityDrawer } from "./ExplainabilityDrawer";
import { ScoreRing } from "./ScoreRing";

interface MetricsOverviewProps {
  compatibilityScore: number;
  metrics: Metrics;
  explainability?: Explainability;
}

function MetricCard({ label, value, suffix = "", children,}: {
  label: string;
  value: string | number;
  suffix?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tabular-nums text-white">
            {value}
            {suffix && (
              <span className="ml-1 text-sm font-normal text-zinc-500">
                {suffix}
              </span>
            )}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function MetricsOverview({ compatibilityScore, metrics, explainability }: MetricsOverviewProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
        Metrics overview
      </h3>
      <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr]">
        <ScoreRing score={compatibilityScore} size={120} />
        <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Compatibility" value={compatibilityScore} suffix="%">
          {explainability && (
            <ExplainabilityDrawer
              title="Compatibility Score"
              explainability={explainability}
            />
          )}
        </MetricCard>
          <MetricCard label="Readiness" value={metrics.readinessScore} suffix="%" />
          <MetricCard label="Success probability" value={metrics.successProbability} suffix="%" />
        </div>
      </div>
    </section>
  );
}
