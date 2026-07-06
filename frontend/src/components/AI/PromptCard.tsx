import { Bot, Sparkles, ArrowRight} from "lucide-react";

export function PromptCard() {
  return (
    <section className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/80 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-red-500/10 p-3">
          <Bot className="h-6 w-6 text-red-400" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-red-400" />
            <h3 className="text-xl font-bold text-white">
              AI Repository Assistant
            </h3>
          </div>

          <p className="mt-3 leading-7 text-zinc-400">
            Ask questions about this repository, understand migration
            decisions, generate patches, and receive AMD ROCm guidance.
          </p>

          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="font-medium text-zinc-300">
              Coming Soon
            </p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>• Explain any migration recommendation</li>
              <li>• Generate HIP migration patches</li>
              <li>• Explain unsupported CUDA APIs</li>
              <li>• Generate Docker fixes</li>
              <li>• Answer repository-specific questions</li>
            </ul>
          </div>

          <button disabled className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-3 text-sm text-zinc-500"
          >
            Ask AI
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}