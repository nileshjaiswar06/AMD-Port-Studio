"use client";

import { exportAnalysisJsonUrl, reportHtmlUrl } from "@/lib/api";
import type { AnalyzeResponse } from "@/types/analysis";

interface Props {
  analysis: AnalyzeResponse;
}

export function ArtifactsTab({ analysis }: Props) {
  const docker = analysis.artifacts?.dockerfile ?? "";

  function downloadDocker() {
    const blob = new Blob([docker], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Dockerfile";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <button
        onClick={downloadDocker}
        className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 hover:border-blue-500"
      >
        Download Dockerfile
      </button>

      <a
        href={reportHtmlUrl(analysis.analysis_id)}
        target="_blank"
        className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 hover:border-blue-500"
      >
        HTML Report
      </a>

      <a
        href={exportAnalysisJsonUrl(analysis.analysis_id)}
        target="_blank"
        className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 hover:border-blue-500"
      >
        Export JSON
      </a>
    </div>
  );
}
