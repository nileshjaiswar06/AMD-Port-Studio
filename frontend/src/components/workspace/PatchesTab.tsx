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
      {patches.map((patch) => (
        <div
          key={patch.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {patch.title}
              </h2>
              <p className="text-sm text-zinc-500">
                {patch.type}
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(patch.after);
                toast.success("Patch copied");
              }}
              className="rounded bg-blue-600 px-4 py-2 transition-all duration-200 hover:scale-105 hover:bg-blue-500"
            >
              Copy
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-red-400">
                Before
              </h3>
              <pre className="overflow-auto rounded bg-zinc-950 p-4 text-xs">
                {patch.before}
              </pre>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-green-400">
                After
              </h3>
              <pre className="overflow-auto rounded bg-zinc-950 p-4 text-xs">
                {patch.after}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
