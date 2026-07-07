"use client";

import {
  LayoutDashboard,
  ShieldCheck,
  Boxes,
  CheckSquare,
  Container,
  Rocket,
  GitPullRequest,
  FileArchive,
  Bot,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "compatibility", label: "Compatibility", icon: ShieldCheck },
  { id: "dependencies", label: "Dependencies", icon: Boxes },
  { id: "checklist", label: "Checklist", icon: CheckSquare },
  { id: "docker", label: "Docker", icon: Container },
  { id: "deploy", label: "Deploy", icon: Rocket },
  { id: "patches", label: "Patches", icon: GitPullRequest },
  { id: "artifacts", label: "Artifacts", icon: FileArchive },
  { id: "ai", label: "AI", icon: Bot },
];

interface Props {
  activeTab: string;
  onChange(tab: string): void;
}

export function WorkspaceTabs({activeTab, onChange}: Props) {
  return (
    <div className="border-b border-zinc-800 bg-zinc-900 px-8">
      <div className="flex gap-3 overflow-x-auto py-4 scrollbar-thin scrollbar-thumb-zinc-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200
              ${isActive
                  ? "border-red-500 bg-red-500/10 text-red-400 shadow-md shadow-red-500/10"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-lg border border-red-500" />
                  <div className="absolute bottom-0 left-2 right-2 h-1 rounded-full bg-red-500" />
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}