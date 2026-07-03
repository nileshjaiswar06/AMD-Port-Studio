import type {
  AnalyzeError,
  AnalyzeResponse,
  AnalysisJobStatus,
  AnalysisSummary,
} from "@/types/analysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function parseError(response: Response): Promise<never> {
  const error = (await response.json().catch(() => null)) as AnalyzeError | null;
  throw new Error(error?.detail ?? `Request failed (${response.status})`);
}

export async function analyzeRepository(
  githubUrl: string,
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ github_url: githubUrl }),
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json() as Promise<AnalyzeResponse>;
}

export async function startRepositoryAnalysis(
  githubUrl: string,
): Promise<AnalysisJobStatus> {
  const response = await fetch(`${API_URL}/api/analyze/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ github_url: githubUrl }),
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json() as Promise<AnalysisJobStatus>;
}

export async function analyzeZip(file: File): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_URL}/api/analyze/zip`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json() as Promise<AnalyzeResponse>;
}

export async function startZipAnalysis(file: File): Promise<AnalysisJobStatus> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_URL}/api/analyze/jobs/zip`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json() as Promise<AnalysisJobStatus>;
}

export async function listAnalyses(): Promise<AnalysisSummary[]> {
  const response = await fetch(`${API_URL}/api/analyses`, { cache: "no-store" });
  if (!response.ok) {
    await parseError(response);
  }
  return response.json() as Promise<AnalysisSummary[]>;
}

export async function getAnalysis(id: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/analyses/${id}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    await parseError(response);
  }
  const raw = (await response.json()) as AnalyzeResponse & {
    migration_status?: AnalyzeResponse["migrationStatus"];
    project_slug?: string;
    source_url?: string;
  };
  return normalizeStoredAnalysis(raw);
}

export async function getAnalysisJob(id: string): Promise<AnalysisJobStatus> {
  const response = await fetch(`${API_URL}/api/analyze/jobs/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json() as Promise<AnalysisJobStatus>;
}

function normalizeStoredAnalysis(
  raw: AnalyzeResponse & {
    migration_status?: AnalyzeResponse["migrationStatus"];
    project_slug?: string;
    source_url?: string;
  },
): AnalyzeResponse {
  const repoName =
    raw.repository?.name ?? raw.project_slug ?? "unknown";
  const repoUrl =
    raw.repository?.url ?? raw.source_url ?? "";

  return {
    status: raw.status ?? "success",
    analysis_id: raw.analysis_id ?? "",
    repository: raw.repository ?? {
      name: repoName,
      url: repoUrl,
      file_count: 0,
      files_skipped: 0,
      languages: {},
      priority_files: [],
      files: [],
      sample_files: [],
    },
    findings: raw.findings,
    analysis: raw.analysis,
    artifacts: raw.artifacts,
    metrics: raw.metrics,
    migrationStatus: raw.migrationStatus ?? raw.migration_status,
    blockers: raw.blockers,
    recommendations: raw.recommendations,
    explainability: raw.explainability,
  };
}

export function exportAnalysisJsonUrl(id: string): string {
  return `${API_URL}/api/analyses/${id}/export.json`;
}

export function reportHtmlUrl(id: string): string {
  return `${API_URL}/api/analyses/${id}/report.html`;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

export { API_URL };
