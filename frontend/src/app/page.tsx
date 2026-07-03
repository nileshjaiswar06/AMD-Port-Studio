"use client";

import { useCallback, useEffect, useState } from "react";
import { AnalysisResults } from "@/components/AnalysisResults";
import { analyzeRepository, checkApiHealth } from "@/lib/api";
import type { AnalyzeResponse } from "@/types/analysis";

const EXAMPLE_REPOS = [
  { label: "PyTorch Examples", url: "https://github.com/pytorch/examples" },
  { label: "Hugging Face Transformers", url: "https://github.com/huggingface/transformers" },
  { label: "llama.cpp", url: "https://github.com/ggerganov/llama.cpp" },
];

export default function Home() {
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<Date | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkApiHealth().then(setApiOnline);
  }, []);

  const handleAnalyze = useCallback(async () => {
    const trimmed = githubUrl.trim();
    if (!trimmed) {
      setError("Enter a GitHub repository URL.");
      return;
    }

    if (!trimmed.includes("github.com")) {
      setError("Only GitHub URLs are supported.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeRepository(trimmed);
      setResult(data);
      setAnalyzedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }, [githubUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 font-bold text-white text-sm">
              AMD
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">
                Port Studio
              </h1>
              <p className="text-xs text-zinc-500">CUDA → ROCm migration analyzer</p>
            </div>
          </div>
          <ApiStatus online={apiOnline} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Hero */}
        <section className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Analyze your GPU workload
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-400 leading-relaxed">
            Paste a GitHub repository URL to scan dependencies, estimate ROCm
            compatibility, and get a migration roadmap for AMD hardware.
          </p>
        </section>

        {/* Input card */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl shadow-black/20">
          <label htmlFor="github-url" className="block text-sm font-medium text-zinc-300">
            GitHub repository URL
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg className="h-5 w-5 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="github-url"
                type="url"
                placeholder="https://github.com/owner/repository"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || apiOnline === false}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
            >
              {loading ? (
                <>
                  <Spinner />
                  Analyzing…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Analyze
                </>
              )}
            </button>
          </div>

          {/* Quick examples */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-600">Try:</span>
            {EXAMPLE_REPOS.map((repo) => (
              <button
                key={repo.url}
                type="button"
                onClick={() => setGithubUrl(repo.url)}
                disabled={loading}
                className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
              >
                {repo.label}
              </button>
            ))}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-300"
          >
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-red-200">Analysis failed</p>
              <p className="mt-1 text-red-300/90">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-8 space-y-4">
            <div className="h-6 w-48 animate-pulse rounded bg-zinc-800" />
            <div className="h-32 animate-pulse rounded-xl bg-zinc-900" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-48 animate-pulse rounded-xl bg-zinc-900" />
              <div className="h-48 animate-pulse rounded-xl bg-zinc-900" />
            </div>
            <p className="text-center text-sm text-zinc-500">
              Cloning repository and scanning files — this may take a minute…
            </p>
          </div>
        )}

        {/* Results */}
        {result && analyzedAt && !loading && (
          <div className="mt-8">
            <AnalysisResults data={result} analyzedAt={analyzedAt} />
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <svg className="h-8 w-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              Results will appear here after analysis
            </p>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-600">
        AMD Port Studio · Day 3 — Real dependency & CUDA detection · Migration scoring still stubbed (Day 4–5)
      </footer>
    </div>
  );
}

function ApiStatus({ online }: { online: boolean | null }) {
  if (online === null) {
    return (
      <span className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600" />
        Checking API…
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-red-500"}`}
      />
      <span className={online ? "text-zinc-400" : "text-red-400"}>
        API {online ? "online" : "offline"}
      </span>
    </span>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
