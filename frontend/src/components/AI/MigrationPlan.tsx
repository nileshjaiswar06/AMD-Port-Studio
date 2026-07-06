import type { AnalyzeResponse } from "@/types/analysis";
import { CheckCircle2, Circle, Clock3, ArrowDown } from "lucide-react";

interface MigrationPlanProps {
  data: AnalyzeResponse;
}

export function MigrationPlan({ data }: MigrationPlanProps) {
  const timeline = data.metrics?.timeline;

  const phases = [
    {
      title: "Environment Preparation",
      description: "Install ROCm, verify AMD GPU, prepare build environment.",
      hours: timeline?.preparation ?? 0,
      completed: true,
    },
    {
      title: "Docker Migration",
      description: "Replace NVIDIA images and update Docker configuration.",
      hours: timeline?.docker ?? 0,
      completed: true,
    },
    {
      title: "Dependencies",
      description: "Replace CUDA-specific libraries with ROCm compatible alternatives.",
      hours: timeline?.dependencies ?? 0,
      completed: false,
    },
    {
      title: "CUDA → HIP Migration",
      description: "Update CUDA APIs, kernels and unsupported NVIDIA code.",
      hours: timeline?.cuda_kernels ?? 0,
      completed: false,
    },
    {
      title: "Validation & Benchmark",
      description: "Run correctness tests and benchmark against baseline.",
      hours: timeline?.validation ?? 0,
      completed: false,
    },
  ];

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Migration Plan
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            Recommended Execution Strategy
          </h3>
        </div>

        <div className="rounded-lg bg-zinc-950 px-4 py-3">
          <p className="text-xs uppercase text-zinc-500">
            Total Estimated Time
          </p>
          <p className="mt-1 text-xl font-bold text-white">
            {timeline?.total ?? 0} hrs
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {phases.map((phase, index) => (
          <div key={phase.title}>
            <div className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="pt-1">
                {phase.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ) : (
                  <Circle className="h-6 w-6 text-zinc-500" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h4 className="text-lg font-semibold text-white">
                    {phase.title}
                  </h4>
                  <div className="flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300">
                    <Clock3 className="h-4 w-4" />
                    {phase.hours} hrs
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {phase.description}
                </p>
              </div>
            </div>
            {index < phases.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowDown className="h-5 w-5 text-zinc-600" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}