"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalyzeResponse } from "@/types/analysis";
import { exportAnalysisJsonUrl, reportHtmlUrl, downloadPdf } from "@/lib/api";
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
import { AiPlanner } from "./AiPlanner";

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
  function SettingRow({label, value,}: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <dt className="text-zinc-500">
          {label}
        </dt>
        <dd className="max-w-sm break-all text-right text-zinc-200">
          {value}
        </dd>
      </div>
    );
  }

  const [section, setSection] = useState<CommandCenterSection>("overview");

  const analysis = data.analysis;
  const repository = data.repository;
  const compatibilityScore =
    data.findings?.compatibility?.score ??
    analysis?.compatibilityScore ??
    data.explainability?.compatibility?.score ??
    0;
  const estimatedHours = analysis?.estimatedHours ?? 0;
  const DEFAULT_HOURLY_RATE = 110;
  const metrics = data.metrics ?? {
    readinessScore: compatibilityScore,
    successProbability: compatibilityScore,
    developerDays: estimatedHours / 8,
    hourlyRate: DEFAULT_HOURLY_RATE,
    estimatedCost: estimatedHours * DEFAULT_HOURLY_RATE,
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
        <div className="flex-1">
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

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/workspace/${data.analysis_id}`}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-500"
              >
                Open Migration Workspace
              </Link>
              <a
                href={reportHtmlUrl(data.analysis_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-700 px-5 py-2 text-sm hover:border-zinc-500"
              >
                HTML Report
              </a>

              <a
                href={exportAnalysisJsonUrl(data.analysis_id)}
                download
                className="rounded-lg border border-zinc-700 px-5 py-2 text-sm hover:border-zinc-500"
              >
                Export JSON
              </a>

              <button
                onClick={() => downloadPdf(data.analysis_id)}
                className="rounded-lg border border-zinc-700 px-5 py-2 text-sm hover:border-zinc-500 cursor-pointer"
              >
                Download PDF
              </button>
          </div>
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
          <MetricsOverview compatibilityScore={compatibilityScore} metrics={metrics} explainability={data.explainability}/>
          <div className="grid gap-6 xl:grid-cols-2">
            <BlockersPanel blockers={blockers} />
            <RecommendationsPanel recommendations={recommendations} />
          </div>
          <TimelinePanel metrics={metrics} />
          {/* {data.explainability && (
            <ExplainabilityPanel explainability={data.explainability} />
          )} */}
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

      {section === "ai" && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            AI Planner
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            This view turns the analysis into an execution-oriented migration plan.
            It combines the deterministic facts with AI-generated guidance when available.
          </p>
          <div className="mt-6 max-w-5xl">
            <AiPlanner data={data} />
          </div>
        </section>
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
            <button
              onClick={() => downloadPdf(data.analysis_id)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 hover:border-zinc-600 cursor-pointer"
            >
              Download PDF migration report
            </button>
          </ul>
        </section>
      )}

      {section === "settings" && (
        <section className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              AI Configuration
            </h3>

            <dl className="mt-6 space-y-4">
              <SettingRow label="Provider" value={data.artifacts?.aiUsed ? data.artifacts.aiProvider : "Deterministic" }/>
              <SettingRow label="AI Status" value={data.artifacts?.aiUsed ? "Enabled" : "Disabled" }/>
              <SettingRow label="Mode" value={data.artifacts?.aiUsed ? "AI Assisted" : "Rule Engine" }/>
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Migration Configuration
            </h3>

            <dl className="mt-6 space-y-4">
              <SettingRow label="Hourly Rate" value={`$${metrics.hourlyRate} / hr`}/>
              <SettingRow label="Developer Days" value={`${metrics.developerDays}`}/>
              <SettingRow label="Estimated Cost" value={`$${metrics.estimatedCost}`}/>
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Analysis
            </h3>

            <dl className="mt-6 space-y-4">
              <SettingRow label="Repository" value={projectName}/>
              <SettingRow label="Analysis ID" value={data.analysis_id}/>
              <SettingRow label="Compatibility" value={`${compatibilityScore}%`}/>
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Generated Artifacts
            </h3>

            <dl className="mt-6 space-y-4">
              <SettingRow label="Dockerfile" value={data.artifacts ? "Generated" : "Unavailable"}/>
              <SettingRow label="Deploy Guide" value={data.artifacts ? "Generated" : "Unavailable"}/>
              <SettingRow label="HTML Report" value={data.artifacts ? "Generated" : "Unavailable"}/>
            </dl>
          </div>
        </section>
      )}
    </CommandCenterLayout>
  );
}