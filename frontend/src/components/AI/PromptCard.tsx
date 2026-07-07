"use client";

import { useState } from "react";
import {
  Bot,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { askAssistant } from "@/lib/api";
import { toast } from "sonner";

interface PromptCardProps { analysisId: string }

export function PromptCard({ analysisId }: PromptCardProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "Why is TensorRT unsupported?",
    "What should I migrate first?",
    "Explain Docker recommendations",
    "Show HIP alternatives",
    "Estimate migration effort",
  ];

  async function ask() {
    if (!question.trim())
        return;
    setLoading(true);

    try {
        const result =
            await askAssistant({
                analysis_id: analysisId,
                question,
            });

        setAnswer(result.answer);
        setSources(result.sources);

        toast.success("Response received");
    } catch {
        toast.error("Assistant unavailable");
    } finally {
        setLoading(false);
    }
}

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

          <div className="mt-6 space-y-4">

        <textarea
            value={question}
            onChange={(e)=>setQuestion(e.target.value)}
            placeholder="Ask about migration strategy..."
            rows={4}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-white outline-none"
        />

        <div className="flex flex-wrap gap-2">
            {suggestions.map((item)=>(
                <button
                    key={item}
                    onClick={()=>setQuestion(item)}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-xs">
                    {item}
                </button>
                ))}
            </div>
        </div>

        <button
        onClick={ask}
        disabled={loading || !question.trim()}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white">
        {loading ? "Thinking..." : "Ask AI"}
        <ArrowRight className="h-4 w-4" />
        </button>

        {answer && (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h4 className="font-semibold">
            Answer
          </h4>
          <p className="mt-4 whitespace-pre-wrap text-zinc-300 leading-7">
            {answer}
          </p>

            <div className="mt-6">
            <p className="text-xs uppercase text-zinc-500">
              Sources
            </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sources.map(source=>(
              <span key={source} className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">
                {source}
              </span>
              ))}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}