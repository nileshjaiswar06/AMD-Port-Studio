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

export interface PackageRecord {
  name: string;
  source?: string;
  manifest?: string;
  line?: number | null;
  category: string;
}
export interface CudaHit {
  file: string;
  line: number | null;
  kind: string;
  symbol: string;
  snippet: string;
  confidence: string;
}
export interface CudaSummary {
  api_hit_count: number;
  cu_file_count: number;
  python_files_scanned: number;
  uses_torch_cuda: boolean;
  uses_tensorrt: boolean;
  uses_cupy: boolean;
  has_cuda_source: boolean;
}
export interface DockerFinding {
  file: string;
  line: number;
  kind: string;
  detail: string;
  severity: string;
}
export interface Findings {
  dependencies: {
    manifests_found: string[];
    packages: PackageRecord[];
    frameworks: string[];
    nvidia_packages: PackageRecord[];
    package_count: number;
  };
  cuda: {
    summary: CudaSummary;
    api_hits: CudaHit[];
    cu_files: CudaHit[];
  };
  docker: {
    dockerfiles_found: string[];
    findings: DockerFinding[];
    uses_nvidia_docker: boolean;
  };
}

export interface AnalyzeResponse {
  status: string;
  analysis_id: string;
  repository: RepositoryInfo;
  findings: Findings;
  analysis: MigrationAnalysis;
}

export interface AnalyzeError {
  detail: string;
}
