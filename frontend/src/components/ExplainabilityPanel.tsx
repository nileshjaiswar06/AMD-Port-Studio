"use client";

import { useState } from "react";
import type { Explainability } from "@/types/analysis";

function statusColor(status: string): string {
  switch (status) {
    case "supported":
      return "text-emerald-400";
    case "partial":
      return "text-amber-400";
    case "unsupported":
      return "text-red-400";
    default:
      return "text-zinc-400";
  }
}

interface ExplainabilityPanelProps {
  explainability: Explainability;
}

export function ExplainabilityPanel({ explainability }: ExplainabilityPanelProps) {
  const [open, setOpen] = useState(false);
  const { compatibility } = explainability;
  const { cuda, docker } = compatibility.signals;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Explainability
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            Why {compatibility.score}%? Deterministic rules — no AI.
          </p>
        </div>
        <span className="text-sm text-red-400">{open ? "Hide" : "Why?"}</span>
      </button>

      {open && (
        <div className="mt-6 space-y-6 border-t border-zinc-800 pt-6">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Components
            </h4>
            <ul className="mt-3 space-y-2">
              {compatibility.components.map((component) => (
                <li
                  key={component.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-200">
                      {component.name ?? component.label ?? component.id}
                    </span>
                    <span className={`font-medium ${statusColor(component.status)}`}>
                      {component.status}
                    </span>
                  </div>
                  {component.notes && (
                    <p className="mt-1 text-xs text-zinc-500">{component.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              CUDA signals
            </h4>
            <ul className="mt-3 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
              <li>API hits: {cuda.api_hit_count}</li>
              <li>.cu files: {cuda.cu_file_count}</li>
              <li>torch.cuda: {cuda.uses_torch_cuda ? "yes" : "no"}</li>
              <li>TensorRT: {cuda.uses_tensorrt ? "yes" : "no"}</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Docker signals
            </h4>
            <ul className="mt-3 text-sm text-zinc-400">
              <li>NVIDIA Docker: {docker.uses_nvidia_docker ? "yes" : "no"}</li>
              <li>Dockerfiles: {docker.dockerfiles_found.length}</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
