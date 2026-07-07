"use client";

import { useState } from "react";
import { saveChecklist } from "@/lib/api";
import type { WorkspaceResponse, ChecklistItem } from "@/types/analysis";
import { toast } from "sonner";

interface Props {
  workspace: WorkspaceResponse;
}

export function ChecklistTab({ workspace }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>(
    workspace.checklist.length
      ? workspace.checklist
      : [
          { id: "docker", completed: false },
          { id: "hip", completed: false },
          { id: "dependencies", completed: false },
          { id: "validation", completed: false },
          { id: "benchmark", completed: false },
        ]
  );
  const [saving, setSaving] = useState(false);

  async function toggle(id: string) {
    try {
      const updated = items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      setItems(updated);
      setSaving(true);
      await saveChecklist(workspace.analysis.analysis_id, updated);
      setSaving(false);
      toast.success("Checklist saved");
    } catch {
      toast.error("Unable to save checklist");
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10">
      <h2 className="mb-6 text-xl font-semibold">Migration Checklist</h2>
      <div className="space-y-3">
        {items.map(item => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 p-3 hover:bg-zinc-800"
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggle(item.id)}
            />
            <span className="capitalize">{item.id}</span>
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        {saving ? "Saving..." : "All changes saved"}
      </p>
    </div>
  );
}
