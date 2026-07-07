import type { AnalyzeResponse } from "@/types/analysis";

import { ExecutiveSummary } from "./AI/ExecutiveSummary";
import { MigrationPlan } from "./AI/MigrationPlan";
import { RiskAnalysis } from "./AI/RiskAnalysis";
import { Timeline } from "./AI/Timeline";
import { PromptCard } from "./AI/PromptCard";

interface AiPlannerProps {
  data: AnalyzeResponse;
}

export function AiPlanner({ data }: AiPlannerProps) {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          AI Planner
        </p>

        <h2 className="mt-2 text-3xl font-bold text-white">
          AI Migration Planner
        </h2>

        <p className="mt-2 max-w-3xl text-zinc-400">
          Personalized migration strategy generated from repository analysis.
          This planner combines deterministic analysis with AI insights to
          produce an execution plan for migrating from NVIDIA CUDA to AMD ROCm.
        </p>
      </header>

      <ExecutiveSummary data={data} />
      <MigrationPlan data={data} />
      <Timeline data={data} />
      <RiskAnalysis data={data} />
      <PromptCard analysisId={data.analysis_id} />
    </section>
  );
}