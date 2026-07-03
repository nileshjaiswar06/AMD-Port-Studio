"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImportPanel } from "@/components/ImportPanel";
import { LoadingStages } from "@/components/LoadingStages";
import { checkApiHealth, getAnalysisJob, startRepositoryAnalysis, startZipAnalysis } from "@/lib/api";
import type { AnalysisJobStage } from "@/types/analysis";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [stage, setStage] = useState<AnalysisJobStage | null>(null);

  useEffect(() => {
    checkApiHealth().then(setApiOnline);
  }, []);

  const handleSuccess = useCallback(
    (analysisId: string) => {
      router.push(`/center/${analysisId}`);
    },
    [router],
  );

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let cancelled = false;

    const pollJob = async () => {
      try {
        const job = await getAnalysisJob(jobId);
        if (cancelled) {
          return;
        }

        setStage(job.stage);

        if (job.status === "completed" && job.analysis_id) {
          setLoading(false);
          setJobId(null);
          handleSuccess(job.analysis_id);
          return;
        }

        if (job.status === "failed") {
          setError(job.error ?? "Analysis failed.");
          setLoading(false);
          setJobId(null);
          return;
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load analysis progress.");
        setLoading(false);
        setJobId(null);
      }
    };

    void pollJob();
    const interval = window.setInterval(() => {
      void pollJob();
    }, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [handleSuccess, jobId]);

  const runGithub = useCallback(
    async (url: string) => {
      if (!url.includes("github.com")) {
        setError("Only GitHub URLs are supported.");
        return;
      }
      setLoading(true);
      setError(null);
      setStage(null);
      try {
        const job = await startRepositoryAnalysis(url);
        setJobId(job.id);
        setStage(job.stage);
        if (job.status === "completed" && job.analysis_id) {
          setLoading(false);
          setJobId(null);
          handleSuccess(job.analysis_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed.");
        setLoading(false);
      }
    },
    [handleSuccess],
  );

  const runZip = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      setStage(null);
      try {
        const job = await startZipAnalysis(file);
        setJobId(job.id);
        setStage(job.stage);
        if (job.status === "completed" && job.analysis_id) {
          setLoading(false);
          setJobId(null);
          handleSuccess(job.analysis_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed.");
        setLoading(false);
      }
    },
    [handleSuccess],
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 font-bold text-white text-sm">
              AMD
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">
                Migration Command Center
              </h1>
              <p className="text-xs text-zinc-500">CUDA → ROCm migration analyzer</p>
            </div>
          </div>
          <ApiStatus online={apiOnline} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Import a project
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400 leading-relaxed">
            Analyze a GitHub repository or upload a ZIP to scan dependencies, estimate ROCm
            compatibility, and open the command center dashboard.
          </p>
        </section>

        <ImportPanel
          loading={loading}
          disabled={apiOnline === false}
          onGithubSubmit={runGithub}
          onZipSubmit={runZip}
        />

        {loading && (
          <div className="mt-6">
            <LoadingStages active stage={stage} />
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

function ApiStatus({ online }: { online: boolean | null }) {
  if (online === null) {
    return <span className="text-xs text-zinc-500">Checking API…</span>;
  }
  return (
    <span className="flex items-center gap-2 text-xs">
      <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-red-500"}`} />
      <span className={online ? "text-zinc-400" : "text-red-400"}>
        API {online ? "online" : "offline"}
      </span>
    </span>
  );
}
