"use client";

import type { AnalyzeResponse } from "@/types/analysis";
import { toast } from "sonner";
import { Skeleton } from "@/components/workspace/Skeleton";

export function DockerTab({ analysis }: { analysis: AnalyzeResponse }) {
  // If dockerfile is not yet available, show skeleton
  if (!analysis.artifacts?.dockerfile) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <>
      <div className="mb-4 flex gap-3">
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              analysis.artifacts?.dockerfile ?? ""
            );
            toast.success("Dockerfile copied");
          }}
          className="rounded bg-blue-600 px-4 py-2 transition-all duration-200 hover:scale-105 hover:bg-blue-500"
        >
          Copy
        </button>

        <button
          onClick={() => {
            const blob = new Blob(
              [analysis.artifacts?.dockerfile ?? ""],
              { type: "text/plain" }
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Dockerfile";
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Dockerfile downloaded");
          }}
          className="rounded bg-zinc-700 px-4 py-2 transition-all duration-200 hover:scale-105 hover:bg-blue-500"
        >
          Download
        </button>
      </div>

      <textarea
        readOnly
        value={analysis.artifacts?.dockerfile ?? ""}
        className="h-[600px] w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm outline-none transition-all duration-200 focus:border-red-500"
        />
    </>
  );
}
