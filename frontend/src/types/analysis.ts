export interface RepositoryInfo {
  name: string;
  url: string;
  file_count: number;
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
  repository: RepositoryInfo;
  analysis: MigrationAnalysis;
}

export interface AnalyzeError {
  detail: string;
}
