"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CommandCenter } from "@/components/CommandCenter";
import { getAnalysis } from "@/lib/api";
import type { AnalyzeResponse } from "@/types/analysis";

interface CenterPageProps {
  params: Promise<{ id: string }>;
}

export default function CenterPage({ params }: CenterPageProps) {
  const router = useRouter();
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => setAnalysisId(id));
  }, [params]);

  useEffect(() => {
    if (!analysisId) return;

    setLoading(true);
    setError(null);
    getAnalysis(analysisId)
      .then(setData)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load analysis");
      })
      .finally(() => setLoading(false));
  }, [analysisId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading command center…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
        <p className="text-red-400">{error ?? "Analysis not found"}</p>
        <Link href="/" className="text-sm text-red-400 hover:text-red-300">
          ← Back to import
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex w-full items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white">
              AMD
            </div>
            <span className="text-sm font-semibold text-white">Port Studio</span>
          </Link>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            New analysis
          </button>
        </div>
      </header>
      <CommandCenter data={data} />
    </div>
  );
}
