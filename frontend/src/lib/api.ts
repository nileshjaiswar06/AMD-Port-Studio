import type { AnalyzeError, AnalyzeResponse } from "@/types/analysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function analyzeRepository(
  githubUrl: string,
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ github_url: githubUrl }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | AnalyzeError
      | null;
    throw new Error(error?.detail ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<AnalyzeResponse>;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}
