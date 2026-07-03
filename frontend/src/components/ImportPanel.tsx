"use client";

import { useRef, useState } from "react";

const EXAMPLE_REPOS = [
  { label: "PyTorch Examples", url: "https://github.com/pytorch/examples" },
  { label: "Hugging Face Transformers", url: "https://github.com/huggingface/transformers" },
];

interface ImportPanelProps {
  loading: boolean;
  disabled?: boolean;
  onGithubSubmit: (url: string) => void;
  onZipSubmit: (file: File) => void;
}

export function ImportPanel({
  loading,
  disabled = false,
  onGithubSubmit,
  onZipSubmit,
}: ImportPanelProps) {
  const [tab, setTab] = useState<"github" | "zip">("github");
  const [githubUrl, setGithubUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGithub = () => {
    const trimmed = githubUrl.trim();
    if (trimmed) onGithubSubmit(trimmed);
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onZipSubmit(file);
    e.target.value = "";
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl shadow-black/20">
      <div className="flex gap-2 border-b border-zinc-800 pb-4">
        {(["github", "zip"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === value
                ? "bg-red-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {value === "github" ? "GitHub URL" : "ZIP upload"}
          </button>
        ))}
      </div>

      {tab === "github" ? (
        <div className="mt-4">
          <label htmlFor="github-url" className="block text-sm font-medium text-zinc-300">
            Repository URL
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="github-url"
              type="url"
              placeholder="https://github.com/owner/repository"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleGithub()}
              disabled={loading || disabled}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleGithub}
              disabled={loading || disabled}
              className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              Analyze
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_REPOS.map((repo) => (
              <button
                key={repo.url}
                type="button"
                onClick={() => setGithubUrl(repo.url)}
                disabled={loading}
                className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-700"
              >
                {repo.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-zinc-400">
            Upload a ZIP of your project (max 50MB). Files are extracted temporarily for scanning.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            onChange={handleZipChange}
            disabled={loading || disabled}
            className="mt-4 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-red-500 disabled:opacity-50"
          />
        </div>
      )}
    </section>
  );
}
