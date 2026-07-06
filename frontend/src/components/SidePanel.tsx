"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

interface SidePanelProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export function SidePanel({ open, title, subtitle, onClose, children,}: SidePanelProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose}/>

      {/* Drawer */}
      <aside
        className="
          fixed
          right-0
          top-0
          z-50
          h-screen
          w-full
          max-w-xl
          border-l
          border-zinc-800
          bg-zinc-950
          shadow-2xl
          animate-in
          slide-in-from-right
          duration-300
        "
      >
        <header className="flex items-start justify-between border-b border-zinc-800 p-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Inspector
            </p>

            <h2 className="mt-1 text-xl font-bold text-white">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-2 text-sm text-zinc-400">
                {subtitle}
              </p>
            )}
          </div>

          <button onClick={onClose} className="rounded-lg p-2 hover:bg-zinc-800">
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </header>

        <div className="h-[calc(100vh-120px)] overflow-y-auto p-6">
          {children}
        </div>
      </aside>
    </>
  );
}