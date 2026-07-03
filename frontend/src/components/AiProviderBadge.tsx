"use client";

import type { Artifacts } from "@/types/analysis";

interface AiProviderBadgeProps {
  artifacts: Artifacts;
}

function formatProvider(provider: string): string {
  if (!provider) return "Unknown";
  return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
}

export function AiProviderBadge({ artifacts }: AiProviderBadgeProps) {
  if (!artifacts.aiUsed) {
    return (
      <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
        Deterministic summary
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-emerald-800/50 bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-300">
      AI advisor · {formatProvider(artifacts.aiProvider)}
    </span>
  );
}
