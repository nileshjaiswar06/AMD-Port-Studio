"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listAnalyses } from "@/lib/api";
import type { AnalysisSummary } from "@/types/analysis";

interface AnalysisHistoryProps {
  currentId?: string;
  compact?: boolean;
}

function formatRepoName(name: string): string {
  return name.replace(/_/g, "/");
}

function normalizeHistory(items: AnalysisSummary[]): AnalysisSummary[] {
  const latestByRepo = new Map<string, AnalysisSummary>();

  for (const item of items) {
    const repoKey = item.project_slug || item.repository_name;
    if (!repoKey) {
      continue;
    }

    if (!latestByRepo.has(repoKey)) {
      latestByRepo.set(repoKey, item);
    }
  }

  return Array.from(latestByRepo.values());
}

export function AnalysisHistory({ currentId, compact = false }: AnalysisHistoryProps) {
  const [items, setItems] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAnalyses()
      .then((results) => setItems(normalizeHistory(results)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"))
      .finally(() => setLoading(false));
  }, [currentId]);

  if (loading) {
    return <p className="text-xs text-zinc-500">Loading history…</p>;
  }

  if (error) {
    return <p className="text-xs text-red-400">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="text-xs text-zinc-500">No analyses yet.</p>;
  }

  return (
    <ul className={`space-y-1 ${compact ? "" : "mt-2"}`}>
      {items.map((item) => {
        const active = item.id === currentId;
        const label = formatRepoName(item.project_slug || item.repository_name);
        return (
          <li key={item.id}>
            <Link
              href={`/center/${item.id}`}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-red-950/50 text-red-200 ring-1 ring-red-800/50"
                  : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
              }`}
            >
              <span className="block truncate font-medium">{label}</span>
              <span className="mt-0.5 flex items-center justify-between text-[10px] text-zinc-500">
                <span>{item.source_type ?? "github"}</span>
                {item.compatibility_score != null && (
                  <span>{item.compatibility_score}%</span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
