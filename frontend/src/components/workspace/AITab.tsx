"use client";

import { useEffect, useRef, useState } from "react";
import { askAssistant } from "@/lib/api";
import type { WorkspaceResponse } from "@/types/analysis";
import { toast } from "sonner";

interface Props {
  workspace: WorkspaceResponse;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

export function AITab({ workspace }: Props) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Why is TensorRT unsupported?",
    "Explain CUDA APIs",
    "Suggest Docker fixes",
    "Show HIP alternatives",
    "Explain dependency graph",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [conversation]);

  async function send() {
    if (!message.trim()) return;

    const question = message;

    setConversation((prev) => [
      ...prev,
      {
        role: "user",
        text: question,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const result = await askAssistant({
        analysis_id: workspace.analysis.analysis_id,
        question,
      });

      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result.answer,
          sources: result.sources,
        },
      ]);

      toast.success("AI response received");
    } catch {
      toast.error("Unable to get AI response");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10">
      <div className="space-y-6">

        <div>
          <h2 className="text-2xl font-bold text-white">
            Repository Migration Assistant
          </h2>

          <p className="mt-2 text-zinc-400">
            Ask repository-specific questions and receive AMD ROCm migration
            guidance powered by the repository analysis and curated AMD
            knowledge base.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((question) => (
            <button
              key={question}
              onClick={() => setMessage(question)}
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition hover:border-red-500 hover:text-white"
            >
              {question}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {conversation.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-8 text-center">
              <p className="text-zinc-400">
                Start a conversation by asking a migration question.
              </p>
            </div>
          ) : (
            <>
              {conversation.map((item, index) => (
                <div
                  key={index}
                  className={`flex ${
                    item.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={
                      item.role === "user"
                        ? "max-w-[80%] rounded-xl bg-blue-600 p-4 text-white"
                        : "max-w-[80%] rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                    }
                  >
                    <div className="whitespace-pre-wrap text-sm leading-7">
                      {item.text}
                    </div>

                    {item.sources && item.sources.length > 0 && (
                      <>
                        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Sources
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.sources.map((source) => (
                            <span
                              key={source}
                              className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300"
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="space-y-4">
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about this repository..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-white outline-none transition focus:border-red-500"
        />

        <div className="flex justify-end">
          <button
            onClick={send}
            disabled={loading || !message.trim()}
            className="rounded-xl bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Ask AI"}
          </button>
        </div>
      </div>
    </div>
  </div>
);
}