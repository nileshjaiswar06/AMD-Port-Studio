export interface FileRecord {
  path: string;
  language: string;
  size_bytes: number;
  priority: "high" | "normal" | "low";
  category: string;
}

export interface RepositoryInfo {
  name: string;
  url: string;
  file_count: number;
  files_skipped: number;
  languages: Record<string, number>;
  priority_files: FileRecord[];
  files: FileRecord[];
  sample_files: string[];
}

export interface MigrationAnalysis {
  migrationDifficulty: string;
  estimatedHours: number;
  riskLevel: string;
  compatibilityScore: number;
  summary: string;
  unsupportedLibraries: string[];
  recommendedAlternatives: string[];
  migrationSteps: string[];
}

export interface AnalyzeResponse {
  status: string;
  analysis_id: string;
  repository: RepositoryInfo;
  analysis: MigrationAnalysis;
}

export interface AnalyzeError {
  detail: string;
}
