"use client";

import { useEffect, useState } from "react";
import { getWorkspace } from "@/lib/api";
import type { WorkspaceResponse } from "@/types/analysis";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { Skeleton } from "@/components/workspace/Skeleton";

interface Props {
  params: Promise<{
    analysisId: string;
  }>;
}

export default function WorkspacePage({ params }: Props) {
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { analysisId } = await params;
      const data = await getWorkspace(analysisId);
      setWorkspace(data);
      setLoading(false);
    }
    load();
  }, [params]);

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-28" />
        <Skeleton className="h-12" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!workspace) {
    return <div>Workspace not found.</div>;
  }

  return <WorkspaceLayout workspace={workspace} />;
}
