"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export type CommandCenterSection = "overview" | "history" | "downloads" | "settings";

interface CommandCenterLayoutProps {
  projectName: string;
  activeSection: CommandCenterSection;
  onSectionChange: (section: CommandCenterSection) => void;
  sidebarFooter?: ReactNode;
  children: ReactNode;
}

const NAV: { id: CommandCenterSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "History" },
  { id: "downloads", label: "Downloads" },
  { id: "settings", label: "Settings" },
];

export function CommandCenterLayout({
  projectName,
  activeSection,
  onSectionChange,
  sidebarFooter,
  children,
}: CommandCenterLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-zinc-800 bg-zinc-950/90 lg:w-56 lg:border-b-0 lg:border-r">
        <div className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Project
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{projectName}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3 lg:pb-4">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                activeSection === item.id
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-5">
          <Link
            href="/"
            className="inline-block text-sm text-red-400 transition hover:text-red-300"
          >
            ← New analysis
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
