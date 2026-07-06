"use client";

import { useState } from "react";
import { Info } from "lucide-react";

import type { Explainability } from "@/types/analysis";
import { SidePanel } from "./SidePanel";

interface ExplainabilityDrawerProps {
  title: string;
  explainability: Explainability;
}

function statusColor(status: string) {
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

function Stat({label, value,}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

export function ExplainabilityDrawer({title, explainability,}: ExplainabilityDrawerProps) {
  const [open, setOpen] = useState(false);
  const compatibility = explainability.compatibility;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="
          rounded-md
          border
          border-zinc-700
          px-2
          py-1
          text-xs
          text-zinc-400
          transition
          hover:border-red-500
          hover:text-red-400
        "
      >
        <span className="flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          Why?
        </span>
      </button>

      <SidePanel
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        subtitle="Deterministic compatibility explanation"
      >
        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Compatibility Components
            </h3>
            <div className="mt-4 space-y-3">
              {compatibility.components.map(component => (
                <div key={component.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white"> {component.name ?? component.label ?? component.id} </p>
                    <span className={`text-sm font-medium ${statusColor(component.status)}`}>
                      {component.status}
                    </span>
                  </div>
                  {component.notes && (
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {component.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              CUDA Signals
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat
                label="API Hits"
                value={compatibility.signals.cuda.api_hit_count}
              />
              <Stat
                label=".cu Files"
                value={compatibility.signals.cuda.cu_file_count}
              />
              <Stat
                label="torch.cuda"
                value={
                  compatibility.signals.cuda.uses_torch_cuda ? "Detected" : "Not Detected"
                }
              />

              <Stat
                label="TensorRT"
                value={
                  compatibility.signals.cuda.uses_tensorrt ? "Detected" : "Not Detected"
                }
              />

            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Docker Signals
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat
                label="NVIDIA Docker"
                value={
                  compatibility.signals.docker
                    .uses_nvidia_docker ? "Detected" : "Not Detected"
                }
              />

              <Stat
                label="Dockerfiles"
                value={
                  compatibility.signals.docker.dockerfiles_found.length
                }
              />
            </div>
          </section>
        </div>
      </SidePanel>
    </>
  );
}