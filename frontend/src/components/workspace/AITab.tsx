"use client";

import { useState } from "react";
import { chatWorkspace } from "@/lib/api";
import type { WorkspaceResponse } from "@/types/analysis";
import { toast } from "sonner";

interface Props {
  workspace: WorkspaceResponse;
}

export function AITab({ workspace }: Props) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!message.trim()) return;

    setLoading(true);

    try {
      const result = await chatWorkspace(
        workspace.analysis.analysis_id,
        message,
      );

      setConversation(prev => [
        ...prev,
        `You: ${message}`,
        `AI: ${result.response}`,
      ]);

      toast.success("AI response received");
      setMessage("");
    } catch {
      toast.error("Unable to get AI response");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10">
        <div className="space-y-4">
          {conversation.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
              <h2 className="text-xl font-semibold">
                Repository Assistant
              </h2>
              <p className="mt-4 text-zinc-400">
                Ask questions about:
              </p>
              <ul className="mt-4 list-disc pl-6 text-zinc-400">
                <li>CUDA APIs</li>
                <li>HIP migration</li>
                <li>Docker</li>
                <li>Dependencies</li>
                <li>Deployment</li>
              </ul>
            </div>
          ) : (
            conversation.map((item, index) => (
              <div
                key={index}
                className="rounded bg-zinc-800 p-3"
              >
                {item}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Ask about this repository..."
          className="flex-1 rounded bg-zinc-900 px-4 py-3"
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded bg-blue-600 px-6"
        >
          Send
        </button>
      </div>
    </div>
  );
}
