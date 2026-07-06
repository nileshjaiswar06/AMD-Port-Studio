import type { AnalyzeResponse } from "@/types/analysis";
import { ArrowRight } from "lucide-react";

interface TimelineProps {
  data: AnalyzeResponse;
}

export function Timeline({ data }: TimelineProps) {
  const timeline = data.metrics?.timeline;

  const phases = [
    {
      title: "Preparation",
      value: timeline?.preparation ?? 0,
    },
    {
      title: "Docker",
      value: timeline?.docker ?? 0,
    },
    {
      title: "Dependencies",
      value: timeline?.dependencies ?? 0,
    },
    {
      title: "CUDA / HIP",
      value: timeline?.cuda_kernels ?? 0,
    },
    {
      title: "Validation",
      value: timeline?.validation ?? 0,
    },
  ];

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        Timeline
      </p>

      <h3 className="mt-2 text-2xl font-bold text-white">
        Estimated Migration Timeline
      </h3>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {phases.map((phase, index) => (
          <div
            key={phase.title}
            className="flex items-center gap-3"
          >
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4 min-w-[150px]">
              <p className="text-sm text-zinc-400">
                {phase.title}
              </p>

              <p className="mt-2 text-xl font-bold text-white">
                {phase.value} hrs
              </p>
            </div>
            {index !== phases.length - 1 && (
              <ArrowRight className="text-zinc-600" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-sm text-zinc-500">
          Total Estimated Time
        </p>

        <p className="mt-2 text-3xl font-bold text-white">
          {timeline?.total ?? 0} hrs
        </p>
      </div>
    </section>
  );
}