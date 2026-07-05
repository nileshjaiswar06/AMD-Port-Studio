"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalyzeResponse } from "@/types/analysis";
import { exportAnalysisJsonUrl, reportHtmlUrl } from "@/lib/api";
import { AiProviderBadge } from "./AiProviderBadge";
import { AnalysisHistory } from "./AnalysisHistory";
import { BlockersPanel } from "./BlockersPanel";
import {
  CommandCenterLayout,
  type CommandCenterSection,
} from "./CommandCenterLayout";
import { ExplainabilityPanel } from "./ExplainabilityPanel";
import { MetricsOverview } from "./MetricsOverview";
import { MigrationStatusBar } from "./MigrationStatusBar";
import { RecommendationsPanel } from "./RecommendationsPanel";
import { TimelinePanel } from "./TimelinePanel";

interface CommandCenterProps {
  data: AnalyzeResponse;
}

const DEFAULT_MIGRATION_STATUS = {
  analysis: true,
  planning: true,
  docker: true,
  migrate: false,
  validate: false,
  benchmark: false,
  productionReady: false,
  maintain: false,
};

function formatProjectName(name: string): string {
  return name.replace(/_/g, "/");
}

export function CommandCenter({ data }: CommandCenterProps) {
  const [section, setSection] = useState<CommandCenterSection>("overview");

  const analysis = data.analysis;
  const repository = data.repository;
  const compatibilityScore =
    data.findings?.compatibility?.score ??
    analysis?.compatibilityScore ??
    data.explainability?.compatibility?.score ??
    0;
  const estimatedHours = analysis?.estimatedHours ?? 0;
  const metrics = data.metrics ?? {
    readinessScore: compatibilityScore,
    successProbability: compatibilityScore,
    developerDays: estimatedHours / 8,
    estimatedCost: estimatedHours * 110,
    timeline: {
      preparation: 0,
      docker: 0,
      dependencies: 0,
      cuda_kernels: 0,
      validation: 0,
      total: estimatedHours,
    },
  };
  const migrationStatus = data.migrationStatus ?? DEFAULT_MIGRATION_STATUS;
  const blockers = data.blockers ?? [];
  const recommendations = data.recommendations ?? [];
  const projectName = formatProjectName(repository?.name ?? "unknown");
  const repoUrl = repository?.url ?? "#";
  const isLegacyRecord = !data.findings || !analysis;

  return (
    <CommandCenterLayout
      projectName={projectName}
      activeSection={section}
      onSectionChange={setSection}
      sidebarFooter={<AnalysisHistory currentId={data.analysis_id} compact />}
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Migration Command Center
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Project: {projectName}</h1>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-red-400 hover:text-red-300"
          >
            {repoUrl}
          </a>
        </div>
        {data.artifacts && <AiProviderBadge artifacts={data.artifacts} />}
      </header>

      {isLegacyRecord && (
        <div className="mb-6 rounded-xl border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          This analysis was saved before full payload storage. Re-run analyze from the{" "}
          <Link href="/" className="underline hover:text-amber-100">
            import page
          </Link>{" "}
          for complete metrics, blockers, and explainability.
        </div>
      )}

      {section === "overview" && (
        <div className="space-y-6">
          <MigrationStatusBar status={migrationStatus} />
          <MetricsOverview compatibilityScore={compatibilityScore} metrics={metrics} />
          <div className="grid gap-6 xl:grid-cols-2">
            <BlockersPanel blockers={blockers} />
            <RecommendationsPanel recommendations={recommendations} />
          </div>
          <TimelinePanel metrics={metrics} />
          {data.explainability && (
            <ExplainabilityPanel explainability={data.explainability} />
          )}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Summary
            </h3>
            <p className="mt-3 leading-relaxed text-zinc-300">
              {analysis?.summary ??
                "No summary available. Re-run analysis to generate a full report."}
            </p>
          </section>
        </div>
      )}

      {section === "history" && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Analysis history
          </h3>
          <div className="mt-4 max-w-md">
            <AnalysisHistory currentId={data.analysis_id} />
          </div>
        </section>
      )}

      {section === "downloads" && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Downloads
          </h3>
          <ul className="mt-4 space-y-3">
            <li>
              <a
                href={exportAnalysisJsonUrl(data.analysis_id)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 hover:border-zinc-600"
                download
              >
                Export full analysis (JSON)
              </a>
            </li>
            <li>
              <a
                href={reportHtmlUrl(data.analysis_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 hover:border-zinc-600"
              >
                Open HTML migration report
              </a>
            </li>
          </ul>
        </section>
      )}

      {section === "settings" && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Settings
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-zinc-800 pb-3">
              <dt className="text-zinc-500">AI provider</dt>
              <dd className="text-zinc-200">
                {data.artifacts?.aiUsed
                  ? data.artifacts.aiProvider
                  : "deterministic (no AI)"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-zinc-800 pb-3">
              <dt className="text-zinc-500">Analysis ID</dt>
              <dd className="font-mono text-xs text-zinc-400">{data.analysis_id}</dd>
            </div>
          </dl>
          <p className="mt-6 text-xs text-zinc-600">
            Provider configuration is managed via backend environment variables.
          </p>
        </section>
      )}
    </CommandCenterLayout>
  );
}
