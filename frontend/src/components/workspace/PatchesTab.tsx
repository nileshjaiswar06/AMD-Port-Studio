"use client";

import { useEffect, useState } from "react";
import { getPatchSuggestions } from "@/lib/api";
import type {
  WorkspaceResponse,
  PatchSuggestion,
} from "@/types/analysis";
import { toast } from "sonner";
import { Skeleton } from "@/components/workspace/Skeleton";

interface Props {
  workspace: WorkspaceResponse;
}

export function PatchesTab({ workspace }: Props) {
  const [patches, setPatches] = useState<PatchSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"diff" | "split">("diff");

  useEffect(() => {
    async function load() {
      const data = await getPatchSuggestions(
        workspace.analysis.analysis_id
      );
      setPatches(data.patches);
      setLoading(false);
    }
    load();
  }, [workspace.analysis.analysis_id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (patches.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 text-center">
        <h2 className="text-xl font-semibold text-green-400">
          No migration patches required
        </h2>
        <p className="mt-2 text-zinc-400">
          Repository appears AMD compatible.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-lg font-semibold">
          Suggested Migration Patches
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-zinc-950 p-4">
            <p className="text-sm text-zinc-400">Total</p>
            <p className="text-2xl font-bold">{patches.length}</p>
          </div>

          <div className="rounded-lg bg-zinc-950 p-4">
            <p className="text-sm text-zinc-400">High Confidence</p>
            <p className="text-2xl font-bold text-green-400">
              {patches.filter(p => p.confidence === "High").length}
            </p>
          </div>

          <div className="rounded-lg bg-zinc-950 p-4">
            <p className="text-sm text-zinc-400">Manual Review</p>
            <p className="text-2xl font-bold text-yellow-400">
              {
                patches.filter(
                  p => p.confidence !== "High"
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      {patches.map((patch) => (
        <div
          key={patch.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10"
        >
          <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {patch.title}
            </h2>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded bg-blue-600/20 px-2 py-1 text-xs text-blue-300">
                {patch.type}
              </span>

              <span
                className={`rounded px-2 py-1 text-xs ${
                  patch.confidence === "High"
                    ? "bg-green-600/20 text-green-300"
                    : patch.confidence === "Medium"
                    ? "bg-yellow-600/20 text-yellow-300"
                    : "bg-red-600/20 text-red-300"
                }`}
              >
                {patch.confidence} Confidence
              </span>

              <span
                className={`rounded px-2 py-1 text-xs ${
                  patch.difficulty === "Easy"
                    ? "bg-green-600/20 text-green-300"
                    : patch.difficulty === "Moderate"
                    ? "bg-yellow-600/20 text-yellow-300"
                    : "bg-red-600/20 text-red-300"
                }`}
              >
                {patch.difficulty}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  patch.diff
                );
                toast.success("Patch copied");
              }}
              className="rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500">
              Copy Patch
            </button>

            <button
              onClick={() =>
                setExpanded(
                  expanded === patch.id
                    ? null
                    : patch.id
                )
              }
              className="rounded bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">
              {expanded === patch.id ? "Hide" : "Preview"}
            </button>
            </div>
          </div>

          <p className="mt-4 text-sm text-zinc-400">
            {patch.reason}
          </p>

          {patch.files.length > 0 && (
            <div className="mt-4">

              <p className="mb-2 text-sm font-medium">
                Affected Files
              </p>

              <div className="flex flex-wrap gap-2">
                {patch.files.map(file => (
                  <span key={file} className="rounded bg-zinc-800 px-2 py-1 text-xs">
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setViewMode("diff")}
              className={`rounded px-3 py-2 text-sm transition ${
                viewMode === "diff"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              Unified Diff
            </button>

            <button
              onClick={() => setViewMode("split")}
              className={`rounded px-3 py-2 text-sm transition ${
                viewMode === "split"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              Before / After
            </button>
          </div>

          {expanded === patch.id && (
            <div className="mt-6">
              {/* <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setViewMode("diff")}
                  className={`rounded px-3 py-2 text-sm transition ${viewMode === "diff" ? "bg-blue-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"}`}
                >
                  Unified Diff
                </button>
                <button
                  onClick={() => setViewMode("split")}
                  className={`rounded px-3 py-2 text-sm transition ${viewMode === "split" ? "bg-blue-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"}`}
                >
                  Before / After
                </button>
              </div> */}

              {viewMode === "diff" ? (
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Patch Preview</h3>
                  <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs">
                    {patch.diff.split("\n").map((line, index) => {
                      let className = "text-zinc-300";
                      if (line.startsWith("+")) className = "text-green-400";
                      else if (line.startsWith("-")) className = "text-red-400";
                      else if (line.startsWith("@@")) className = "text-yellow-400";
                      else if (line.startsWith("---") || line.startsWith("+++")) className = "text-blue-400";
                      return (
                        <div key={index} className={`${className} font-mono`}>
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-red-400">Before</h3>
                    <pre className="overflow-auto rounded-lg bg-zinc-950 p-4 text-xs">
                      {patch.before}
                    </pre>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-green-400">After</h3>
                    <pre className="overflow-auto rounded-lg bg-zinc-950 p-4 text-xs">
                      {patch.after}
                    </pre>
                  </div>
                </div>
              )}

              {patch.references.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-semibold">References</h3>
                  <ul className="space-y-1">
                    {patch.references.map(ref => (
                      <li key={ref}>
                        <a
                          href={ref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {ref}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="rounded-lg border border-yellow-600/30 bg-yellow-600/10 p-4">
        <p className="text-sm text-yellow-300">
          These patches are deterministic migration suggestions.
          Review and test each change before applying it to production code.
        </p>
      </div>
    </div>
  );
}
