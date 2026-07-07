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
  compatibility: CompatibilityReport;
}

export interface CompatibilityComponent {
  id: string;
  type: string;
  name?: string;
  label?: string;
  status: "supported" | "partial" | "unsupported" | "unknown";
  alternative: string;
  difficulty: string;
  notes: string;
  manifest?: string;
}

export interface CompatibilityReport {
  score: number;
  tier: string;
  effort_score: number;
  components: CompatibilityComponent[];
}

export interface Artifacts {
  dockerfile: string;
  deployGuide: string[];
  htmlReport: string;
  aiUsed: boolean;
  aiProvider: string;
}

export interface AnalyzeResponse {
  status: string;
  analysis_id: string;
  repository: RepositoryInfo;
  findings?: Findings;
  analysis?: MigrationAnalysis;
  artifacts?: Artifacts;
  metrics?: Metrics;
  migrationStatus?: MigrationStatus;
  blockers?: Blocker[];
  recommendations?: Recommendation[];
  explainability?: Explainability;
  confidence?: Confidence;
  graph?: DependencyGraph;
}

export interface ConfidenceItem {
  value: "high" | "medium" | "low";
  score: number;
  reason: string;
}

export interface Confidence {
  cuda: ConfidenceItem;
  dependencies: ConfidenceItem;
  compatibility: ConfidenceItem;
  docker: ConfidenceItem;
}

export interface AnalyzeError {
  detail: string;
}

export interface ExplainabilitySignals {
  cuda: CudaSummary;
  docker: {
    uses_nvidia_docker: boolean;
    dockerfiles_found: string[];
  };
}

export interface Explainability {
  compatibility: {
    score: number;
    components: CompatibilityComponent[];
    signals: ExplainabilitySignals;
  };
}

export interface AnalysisSummary {
  id: string;
  repository_name: string;
  project_slug: string | null;
  source_type: string | null;
  created_at: string;
  compatibility_score: number | null;
}

export type AnalysisJobStage =
  | "queued"
  | "cloning"
  | "scanning"
  | "analyzing"
  | "ai"
  | "generating"
  | "completed"
  | "failed";

export interface AnalysisJobStatus {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  stage: AnalysisJobStage;
  analysis_id: string | null;
  error: string | null;
  source_type: string;
  source_name: string;
  created_at: string;
  updated_at: string;
}

export interface Blocker { 
  severity: string; 
  title: string; 
  detail: string; 
  source: string; 
}

export interface Recommendation { 
  priority: string; 
  action: string; 
  rationale: string; 
}

export interface MigrationTimeline { 
  preparation: number; 
  docker: number; 
  dependencies: number; 
  cuda_kernels: number; 
  validation: number; 
  total: number; 
}

export interface Metrics {
  readinessScore: number;
  successProbability: number;
  developerDays: number;
  hourlyRate: number;
  estimatedCost: number;
  timeline: MigrationTimeline;
}

export interface MigrationStatus {
  analysis: boolean; planning: boolean; docker: boolean;
  migrate: boolean; validate: boolean; benchmark: boolean;
  productionReady: boolean; maintain: boolean;
}

export interface ChecklistItem {
  id: string;
  completed: boolean;
}

export interface WorkspaceResponse {
  analysis: AnalyzeResponse;
  checklist: ChecklistItem[];
  workspace: {
    tabs: string[];
  };
}

export interface PatchSuggestion {
  id: string;
  title: string;
  type: string;
  before: string;
  after: string;
}

export interface PatchResponse {
  patches: PatchSuggestion[];
}

export interface ChatResponse {
  response: string;
  stub: boolean;
}

export interface GraphNode {
  id: string;
  type?: string;
  position: {
    x: number;
    y: number;
  };
  data:{
    label:string
    status:string    
    color:string
    alternative?:string
    difficulty?:string
    notes?:string
    }
  style?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AssistantRequest {
  analysis_id: string;
  question: string;
}

export interface AssistantResponse {
  answer: string;
  recommendation: string;
  repositoryImpact: string;
  nextSteps: string[];
  confidence: string;
  sources: string[];
}