"use client";

import { useEffect, useState } from "react";
import type { AnalysisJobStage } from "@/types/analysis";

const STAGES = [
  "Cloning repository",
  "Scanning files",
  "Analyzing compatibility",
  "Running AI advisor",
  "Generating artifacts",
] as const;

const STAGE_TO_INDEX: Record<AnalysisJobStage, number> = {
  queued: 0,
  cloning: 0,
  scanning: 1,
  analyzing: 2,
  ai: 3,
  generating: 4,
  completed: 4,
  failed: 4,
};

interface LoadingStagesProps {
  active: boolean;
  stage?: AnalysisJobStage | null;
}

export function LoadingStages({ active, stage }: LoadingStagesProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (stage) {
      setStageIndex(STAGE_TO_INDEX[stage]);
      return;
    }

    if (!active) {
      setStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, STAGES.length - 1));
    }, 2200);

    return () => clearInterval(interval);
  }, [active, stage]);

  if (!active) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <p className="text-sm font-medium text-white">Analysis in progress</p>
      <ul className="mt-4 space-y-3">
        {STAGES.map((stage, index) => {
          const done = index < stageIndex;
          const current = index === stageIndex;
          return (
            <li key={stage} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  done
                    ? "bg-emerald-600 text-white"
                    : current
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className={current ? "text-white" : done ? "text-zinc-400" : "text-zinc-600"}>
                {stage}
                {current && "…"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
