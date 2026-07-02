"use client";

import type { AnalyzeResponse } from "@/types/analysis";
import { ScoreRing } from "./ScoreRing";

interface AnalysisResultsProps {
  data: AnalyzeResponse;
  analyzedAt: Date;
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "warning" | "danger" | "success";
}) {
  const styles = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700",
    warning: "bg-amber-950/60 text-amber-300 border-amber-800/50",
    danger: "bg-red-950/60 text-red-300 border-red-800/50",
    success: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function difficultyVariant(difficulty: string): "default" | "warning" | "danger" {
  const d = difficulty.toLowerCase();
  if (d === "low" || d === "easy") return "default";
  if (d === "high" || d === "hard") return "danger";
  return "warning";
}

function riskVariant(risk: string): "default" | "warning" | "danger" | "success" {
  const r = risk.toLowerCase();
  if (r === "low") return "success";
  if (r === "high") return "danger";
  return "warning";
}

export function AnalysisResults({ data, analyzedAt }: AnalysisResultsProps) {
  const { repository, analysis } = data;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Analysis complete</h2>
        <time className="text-xs text-zinc-500" dateTime={analyzedAt.toISOString()}>
          {analyzedAt.toLocaleTimeString()}
        </time>
      </div>

      {/* Repository header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Repository
            </p>
            <h3 className="mt-1 truncate text-xl font-semibold text-white">
              {repository.name.replace(/_/g, "/")}
            </h3>
            <a
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              {repository.url}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <div className="flex shrink-0 flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950 px-6 py-4">
            <span className="text-2xl font-bold tabular-nums text-white">
              {repository.file_count.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500">files scanned</span>
          </div>
        </div>
      </div>

      {/* Score + metrics grid */}
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <ScoreRing score={analysis.compatibilityScore} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Migration difficulty"
            value={analysis.migrationDifficulty}
          >
            <Badge variant={difficultyVariant(analysis.migrationDifficulty)}>
              {analysis.migrationDifficulty}
            </Badge>
          </MetricCard>
          <MetricCard label="Risk level" value={analysis.riskLevel}>
            <Badge variant={riskVariant(analysis.riskLevel)}>
              {analysis.riskLevel}
            </Badge>
          </MetricCard>
          <MetricCard
            label="Estimated effort"
            value={`${analysis.estimatedHours} hours`}
          >
            <span className="text-lg font-semibold text-white">
              {analysis.estimatedHours}h
            </span>
          </MetricCard>
        </div>
      </div>

      {/* Summary */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Summary
        </h3>
        <p className="mt-3 leading-relaxed text-zinc-300">{analysis.summary}</p>
      </section>

      {/* Migration steps + libraries */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Migration steps
          </h3>
          <ol className="mt-4 space-y-3">
            {analysis.migrationSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600/20 text-xs font-bold text-red-400">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm leading-relaxed text-zinc-300">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Unsupported libraries
            </h3>
            {analysis.unsupportedLibraries.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {analysis.unsupportedLibraries.map((lib) => (
                  <li
                    key={lib}
                    className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-1.5 font-mono text-sm text-red-300"
                  >
                    {lib}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">None detected</p>
            )}
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Recommended alternatives
            </h3>
            <ul className="mt-3 space-y-2">
              {analysis.recommendedAlternatives.map((alt) => (
                <li
                  key={alt}
                  className="flex items-center gap-2 text-sm text-emerald-300"
                >
                  <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {alt}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Sample files */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Sample files
          </h3>
          <span className="text-xs text-zinc-600">
            showing {repository.sample_files.length} of {repository.file_count}
          </span>
        </div>
        <ul className="mt-4 grid gap-1 sm:grid-cols-2">
          {repository.sample_files.map((file) => (
            <li
              key={file}
              className="truncate rounded-md bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-400"
              title={file}
            >
              {file}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <div className="mt-2" aria-label={value}>
        {children}
      </div>
    </div>
  );
}
