"use client";

import { useState } from "react";
import type { AnalyzeResponse } from "@/types/analysis";
import { ScoreRing } from "./ScoreRing";
import { ConfidenceBadge } from "./ConfidenceBadge";

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

function formatAiProviderLabel(provider: string): string {
  if (!provider) return "AI";
  return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
}

function downloadHtmlReport(html: string, repoName: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${repoName.replace("/", "_")}-migration-report.html`;
  a.click();
  URL.revokeObjectURL(url);
}

const EMPTY_FINDINGS = {
  dependencies: {
    manifests_found: [],
    packages: [],
    frameworks: [],
    nvidia_packages: [],
    package_count: 0,
  },
  cuda: {
    summary: {
      api_hit_count: 0,
      cu_file_count: 0,
      python_files_scanned: 0,
      uses_torch_cuda: false,
      uses_tensorrt: false,
      uses_cupy: false,
      has_cuda_source: false,
    },
    api_hits: [],
    cu_files: [],
  },
  docker: {
    dockerfiles_found: [],
    findings: [],
    uses_nvidia_docker: false,
  },
  compatibility: {
    score: 0,
    tier: "Unknown",
    effort_score: 0,
    components: [],
  },
} satisfies NonNullable<AnalyzeResponse["findings"]>;

const EMPTY_ANALYSIS = {
  compatibilityScore: 0,
  migrationDifficulty: "Unknown",
  riskLevel: "Unknown",
  estimatedHours: 0,
  summary: "No analysis summary available.",
  unsupportedLibraries: [],
  recommendedAlternatives: [],
  migrationSteps: [],
} satisfies NonNullable<AnalyzeResponse["analysis"]>;

export function AnalysisResults({ data, analyzedAt }: AnalysisResultsProps) {
  const { repository,  artifacts } = data;
  const analysis = data.analysis ?? EMPTY_ANALYSIS;
  const findings = data.findings ?? EMPTY_FINDINGS;
  const [dockerCopied, setDockerCopied] = useState(false);
  const repoDisplayName = repository.name.replace(/_/g, "/");
  const cudaSummary = findings.cuda.summary;
  const cuFilesPreview = findings.cuda.cu_files.slice(0, 20);
  const cuFilesRemaining = findings.cuda.cu_files.length - cuFilesPreview.length;

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
          <div className="flex shrink-0 gap-3">
            <StatBox value={repository.file_count} label="files scanned" />
            <StatBox
              value={repository.files_skipped}
              label="files skipped"
            />
          </div>
        </div>
      </div>

      {/* GPU / CUDA summary */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          GPU / CUDA summary
        </h3>
        {data.confidence?.cuda && (
             <ConfidenceBadge value={data.confidence.cuda.value} />
        )}
        <ul className="mt-4 flex flex-wrap gap-2">
          <li>
            <Badge variant="default">
              API hits: {cudaSummary.api_hit_count.toLocaleString()}
            </Badge>
          </li>
          <li>
            <Badge variant={cudaSummary.cu_file_count > 0 ? "warning" : "default"}>
              .cu files: {cudaSummary.cu_file_count.toLocaleString()}
            </Badge>
          </li>
          <li>
            <YesNoBadge label="torch.cuda" value={cudaSummary.uses_torch_cuda} />
          </li>
          <li>
            <YesNoBadge label="TensorRT" value={cudaSummary.uses_tensorrt} />
          </li>
          <li>
            <YesNoBadge
              label="NVIDIA Docker"
              value={findings.docker.uses_nvidia_docker}
            />
          </li>
        </ul>
      </section>

      {/* CUDA API hits */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            CUDA API hits
          </h3>
          <span className="text-xs text-zinc-600">
            {findings.cuda.api_hits.length} shown
          </span>
        </div>
        {findings.cuda.api_hits.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-180 text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">File</th>
                  <th className="px-4 py-3 font-medium text-right">Line</th>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {findings.cuda.api_hits.map((hit, index) => (
                  <tr key={`${hit.file}-${hit.line}-${hit.symbol}-${index}`} className="bg-zinc-950/40">
                    <td
                      className="max-w-50 truncate px-4 py-2.5 font-mono text-xs text-zinc-300"
                      title={hit.file}
                    >
                      {hit.file}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">
                      {hit.line ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-amber-300">
                      {hit.symbol}
                    </td>
                    <td
                      className="max-w-md truncate px-4 py-2.5 text-xs text-zinc-400"
                      title={hit.snippet}
                    >
                      {hit.snippet}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No CUDA API hits detected</p>
        )}
      </section>

      {/* CUDA source files */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          CUDA source files
        </h3>
        {findings.cuda.cu_files.length > 0 ? (
          <>
            <ul className="mt-4 space-y-2">
              {cuFilesPreview.map((file) => (
                <li
                  key={file.file}
                  className="flex items-center gap-2 rounded-md border border-amber-900/30 bg-amber-950/20 px-3 py-2 font-mono text-xs text-amber-200"
                >
                  <span className="shrink-0 rounded bg-amber-900/40 px-1.5 py-0.5 text-[10px] uppercase text-amber-400">
                    {file.symbol}
                  </span>
                  <span className="truncate" title={file.file}>
                    {file.file}
                  </span>
                </li>
              ))}
            </ul>
            {cuFilesRemaining > 0 && (
              <p className="mt-3 text-xs text-zinc-500">
                and {cuFilesRemaining.toLocaleString()} more
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No .cu / .cuh source files found</p>
        )}
      </section>

      {/* Dependencies */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Dependencies
        </h3>
        {data.confidence?.dependencies && (
            <ConfidenceBadge value={data.confidence.dependencies.value} />
        )}
        <div className="mt-4 space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
              Frameworks
            </p>
            {findings.dependencies.frameworks.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {findings.dependencies.frameworks.map((fw) => (
                  <li
                    key={fw}
                    className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 font-mono text-sm text-zinc-200"
                  >
                    {fw}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">None detected</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
              NVIDIA packages
            </p>
            {findings.dependencies.nvidia_packages.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {findings.dependencies.nvidia_packages.map((pkg) => (
                  <li
                    key={`${pkg.name}-${pkg.manifest ?? pkg.source ?? ""}`}
                    className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-1.5 font-mono text-sm text-red-300"
                    title={pkg.manifest ?? pkg.source}
                  >
                    {pkg.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">None detected</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
              Manifests found
            </p>
            {findings.dependencies.manifests_found.length > 0 ? (
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {findings.dependencies.manifests_found.map((manifest) => (
                  <li
                    key={manifest}
                    className="truncate rounded-md bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-400"
                    title={manifest}
                  >
                    {manifest}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">No dependency manifests found</p>
            )}
          </div>
        </div>
      </section>

      {/* ROCm compatibility */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            ROCm compatibility
          </h3>
          {data.confidence?.compatibility && (
              <ConfidenceBadge value={data.confidence.compatibility.value} />
          )}
          <Badge variant="warning">{findings.compatibility.tier}</Badge>
        </div>
        {findings.compatibility.components.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-180 text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">Component</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Alternative</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {findings.compatibility.components.map((component) => (
                  <tr key={component.id} className="bg-zinc-950/40">
                    <td className="px-4 py-2.5 text-zinc-200">
                      {component.name ?? component.label ?? component.id}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={component.status} />
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {component.alternative || "—"}
                    </td>
                    <td
                      className="max-w-md px-4 py-2.5 text-xs text-zinc-500"
                      title={component.notes}
                    >
                      {component.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No compatibility components evaluated</p>
        )}
      </section>

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

      {artifacts && (
        <>
          <div>
            {artifacts.aiUsed ? (
              <Badge variant="success">
                AI Planner · {formatAiProviderLabel(artifacts.aiProvider)}
              </Badge>
            ) : (
              <Badge variant="default">Deterministic summary (AI unavailable)</Badge>
            )}
          </div>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                Generated ROCm Dockerfile
              </h3>
              {data.confidence?.docker && (
                <ConfidenceBadge value={data.confidence.docker.value} />
              )}
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(artifacts.dockerfile);
                  setDockerCopied(true);
                  setTimeout(() => setDockerCopied(false), 2000);
                }}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
              >
                {dockerCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300">
              {artifacts.dockerfile}
            </pre>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Deployment guide
            </h3>
            <ol className="mt-4 space-y-3">
              {artifacts.deployGuide.map((step, index) => (
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                downloadHtmlReport(artifacts.htmlReport, repoDisplayName)
              }
              className="inline-flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-2.5 text-sm font-medium text-red-300 transition-colors hover:border-red-700 hover:bg-red-950/60 hover:text-red-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download HTML report
            </button>
          </div>
        </>
      )}

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

      {/* Language breakdown */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Language breakdown
        </h3>
        {Object.keys(repository.languages).length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {Object.entries(repository.languages)
              .sort(([, a], [, b]) => b - a)
              .map(([language, count]) => (
                <li key={language}>
                  <LanguageBadge language={language} count={count} />
                </li>
              ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No languages detected</p>
        )}
      </section>

      {/* File inventory */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            File inventory
          </h3>
          <span className="text-xs text-zinc-600">
            showing {repository.files.length} of {repository.file_count}
          </span>
        </div>
        {repository.files.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Language</th>
                  <th className="px-4 py-3 font-medium text-right">Size</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {repository.files.map((file) => (
                  <tr
                    key={file.path}
                    className={
                      file.priority === "high"
                        ? "border-l-2 border-l-amber-500 bg-amber-950/20"
                        : "bg-zinc-950/40"
                    }
                  >
                    <td
                      className="max-w-xs truncate px-4 py-2.5 font-mono text-xs text-zinc-300"
                      title={file.path}
                    >
                      {file.path}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">{file.language}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">
                      {formatBytes(file.size_bytes)}
                    </td>
                    <td className="px-4 py-2.5">
                      <PriorityBadge priority={file.priority} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No files indexed</p>
        )}
      </section>

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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { variant: "default" | "warning" | "danger" | "success"; label: string }> = {
    supported: { variant: "success", label: "supported" },
    partial: { variant: "warning", label: "partial" },
    unsupported: { variant: "danger", label: "unsupported" },
    unknown: { variant: "default", label: "unknown" },
  };

  const config = styles[status] ?? styles.unknown;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function YesNoBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <Badge variant={value ? "warning" : "default"}>
      {label}: {value ? "yes" : "no"}
    </Badge>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950 px-6 py-4">
      <span className="text-2xl font-bold tabular-nums text-white">
        {value.toLocaleString()}
      </span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

function LanguageBadge({ language, count }: { language: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs font-medium text-zinc-300">
      <span className="font-mono text-zinc-200">{language}</span>
      <span className="text-zinc-500">·</span>
      <span className="tabular-nums text-zinc-400">{count.toLocaleString()}</span>
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: "border-amber-800/50 bg-amber-950/60 text-amber-300",
    normal: "border-zinc-700 bg-zinc-800 text-zinc-300",
    low: "border-zinc-800 bg-zinc-900 text-zinc-500",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles[priority] ?? styles.normal}`}
    >
      {priority}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
