"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type {
  DependencyGraph as DependencyGraphType,
  GraphNode,
  GraphEdge,
} from "@/types/analysis";

import { layoutGraph } from "@/lib/graphLayout";
import { useState } from "react";

interface DependencyGraphProps {
  graph: DependencyGraphType;
}

export function DependencyGraph({
  graph,
}: DependencyGraphProps) {

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState("all");

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
        No dependency graph available.
      </div>
    );
  }

  let filteredNodes = graph.nodes;

  if (filter === "frameworks") {
    filteredNodes = graph.nodes.filter(
      (node) =>
        node.id === "frameworks" ||
        node.data.label.toLowerCase().includes("torch") ||
        node.data.label.toLowerCase().includes("transformers") ||
        node.data.label.toLowerCase().includes("accelerate")
    );
  }

  if (filter === "cuda") {
    filteredNodes = graph.nodes.filter(
      (node) =>
        node.id === "cuda" ||
        node.data.label.toLowerCase().includes("cuda") ||
        node.data.label.toLowerCase().includes("hip")
    );
  }

  if (filter === "docker") {
    filteredNodes = graph.nodes.filter(
      (node) =>
        node.id === "docker" ||
        node.data.label.toLowerCase().includes("docker")
    );
  }

  if (filter === "unsupported") {
    filteredNodes = graph.nodes.filter(
      (node) => node.data.status === "unsupported"
    );
  }

  const styledNodes = filteredNodes.map((node) => ({
    ...node,
    style: {
      background: node.data.color,
      color: "#fff",
      border: "2px solid #27272a",
      borderRadius: "12px",
      padding: "12px",
      minWidth: 220,
      maxWidth: 260,
      fontSize: "13px",
      fontWeight: 600,
      textAlign: "center",
      whiteSpace: "normal",
      wordBreak: "break-word",
      overflowWrap: "break-word",
      lineHeight: "18px",
    },
  }));

  const nodes = layoutGraph(
    styledNodes,
    graph.edges
  );

  const visibleIds = new Set(
    styledNodes.map((n) => n.id)
  );

  const edges = graph.edges
    .filter(
      (edge) =>
        visibleIds.has(edge.source) &&
        visibleIds.has(edge.target)
    )
    .map((edge) => ({
      ...edge,
      animated: true,
      style: {
        stroke:
          styledNodes.find((n) => n.id === edge.target)?.data.status ===
          "supported"
            ? "#22c55e"
            : styledNodes.find((n) => n.id === edge.target)?.data.status ===
                "partial"
              ? "#f59e0b"
              : styledNodes.find((n) => n.id === edge.target)?.data.status ===
                  "unsupported"
                ? "#ef4444"
                : "#94a3b8",

        strokeWidth: 2,
      },
    }));

  return (
    <div className="relative h-[85vh] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="mb-5 flex flex-wrap gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-4 py-2 ${
            filter === "all" ? "bg-red-600" : "bg-zinc-800"
          }`}
        >
          All
        </button>

        <button
          onClick={() => setFilter("frameworks")}
          className={`rounded-lg px-4 py-2 ${
            filter === "frameworks" ? "bg-red-600" : "bg-zinc-800"
          }`}
        >
          Frameworks
        </button>

        <button
          onClick={() => setFilter("cuda")}
          className={`rounded-lg px-4 py-2 ${
            filter === "cuda" ? "bg-red-600" : "bg-zinc-800"
          }`}
        >
          CUDA
        </button>

        <button
          onClick={() => setFilter("docker")}
          className={`rounded-lg px-4 py-2 ${
            filter === "docker" ? "bg-red-600" : "bg-zinc-800"
          }`}
        >
          Docker
        </button>

        <button
          onClick={() => setFilter("unsupported")}
          className={`rounded-lg px-4 py-2 ${
            filter === "unsupported" ? "bg-red-600" : "bg-zinc-800"
          }`}
        >
          Unsupported
        </button>
      </div>
      <div className="mb-4 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          Supported
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          Partial
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          Unsupported
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => setSelectedNode(node)}
        fitView
        proOptions={{ hideAttribution: true }}

        fitViewOptions={{
          padding: 0.6,
          minZoom: 0.9,
          maxZoom: 1.2,
        }}
    
        defaultViewport={{
          x: 0,
          y: 0,
          zoom: 1,
        }}
      >
        <Controls
          position="top-right"
          showInteractive={false}
          style={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 8,
          }}
        />
        <Background />
      </ReactFlow>

      {selectedNode && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-5 text-xl font-bold">Node Details</h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Label
              </p>
              <p className="text-lg font-semibold">
                {selectedNode.data.label}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Status
              </p>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  selectedNode.data.status === "supported"
                    ? "bg-green-900 text-green-300"
                    : selectedNode.data.status === "partial"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-red-900 text-red-300"
                }`}
              >
                {selectedNode.data.status}
              </span>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Alternative
              </p>
              <p>{selectedNode.data.alternative || "None"}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Difficulty
              </p>
              <p>{selectedNode.data.difficulty || "Unknown"}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Notes
              </p>
              <p>{selectedNode.data.notes || "No notes available."}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Node ID
              </p>
              <p className="font-mono text-sm">{selectedNode.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}