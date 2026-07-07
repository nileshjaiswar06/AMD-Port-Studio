"use client";

import { useState } from "react";

import type { WorkspaceResponse } from "@/types/analysis";

import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceStatus } from "./WorkspaceStatus";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { OverviewTab } from "./OverviewTab";
import { ChecklistTab } from "./ChecklistTab";
import { DockerTab } from "./DockerTab";
import { PatchesTab } from "./PatchesTab";
import { AITab } from "./AITab";
import { CompatibilityTab } from "./CompatibilityTab";
import { DependenciesTab } from "./DependenciesTab";
import { DeployTab } from "./DeployTab";
import { ArtifactsTab } from "./ArtifactsTab";

export function WorkspaceLayout({workspace}:{workspace: WorkspaceResponse}){
    const [tab,setTab]=useState("overview");
    const checklist = workspace.checklist;
    const completed = checklist.filter(item => item.completed).length;
    const migrateDone = checklist.length > 0 && completed === checklist.length;
    const validateDone = checklist.length > 0 && completed >= Math.ceil(checklist.length * 0.8);
    const workspaceStatus = {...workspace.analysis.migrationStatus!, migrate: migrateDone,validate: validateDone};

    return(
        <div className="min-h-screen bg-zinc-950 text-white">
            <WorkspaceHeader analysis={workspace.analysis}/>
            <WorkspaceStatus status={workspaceStatus}/>
            <WorkspaceTabs activeTab={tab} onChange={setTab}/>

          <div className="p-8">
              {tab === "overview" && ( <OverviewTab analysis={workspace.analysis}/>)}
              {tab==="compatibility" && (<CompatibilityTab analysis={workspace.analysis}/>)}
              {tab==="dependencies" && (<DependenciesTab analysis={workspace.analysis}/>)}
              {tab==="deploy" && (<DeployTab analysis={workspace.analysis}/>)}
              {tab==="artifacts" && (<ArtifactsTab analysis={workspace.analysis}/>)}
              {tab === "checklist" && (<ChecklistTab workspace={workspace}/>)}
              {tab === "docker" && (<DockerTab analysis={workspace.analysis}/>)}
              {tab === "patches" && (<PatchesTab workspace={workspace}/>)}
              {tab === "ai" && (<AITab workspace={workspace}/>)}
          </div>

        </div>
    )
}