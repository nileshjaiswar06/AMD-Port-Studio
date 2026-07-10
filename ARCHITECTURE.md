# Architecture

AMD Port Studio is organized as a pipeline-driven migration analyzer with a thin UI on top of a deterministic backend core. The design keeps the analysis path explainable, with AI used for summarization and advisory output rather than as the primary source of truth.

## System Overview

```text
User -> Next.js Frontend -> FastAPI Backend -> Analysis Pipeline -> SQLite / Workspace Artifacts
                                      \-> AI Provider (Gemini or Fireworks)
```

## Core Design Principles

- Deterministic first: scan, parse, score, and explain before calling AI.
- Background execution: repository analysis runs in jobs so the UI can poll progress.
- Small, composable modules: each analysis concern has a focused package.
- Provider abstraction: Gemini and Fireworks share a common interface.
- Workspace persistence: analyses are stored for later review, export, and assistant use.

## Frontend Layer

The frontend is a Next.js application that acts as the command center.

### Responsibilities

- Accept GitHub URLs and ZIP uploads.
- Start analysis jobs and poll their progress.
- Render the workspace dashboard and tabbed views.
- Display compatibility scores, findings, artifacts, checklist state, and assistant outputs.

### Key areas

- `src/app/page.tsx` handles import and job creation.
- `src/app/workspace/[analysisId]/page.tsx` loads a completed analysis.
- `src/components/workspace/*` renders the dashboard sections.
- `src/lib/api.ts` centralizes backend calls.

## Backend Layer

The backend is a FastAPI service that owns cloning, extraction, scanning, scoring, report generation, and persistence.

### Responsibilities

- Validate and normalize repository URLs.
- Clone GitHub repositories or extract ZIP archives.
- Run the analysis pipeline in background threads.
- Persist analysis records and checklists in SQLite.
- Serve workspace, export, patch, report, and assistant endpoints.

### Entry points

- `main.py` defines the HTTP API.
- `analysis_pipeline.py` coordinates the end-to-end analysis flow.
- `database.py` persists and retrieves analysis state.
- `migration_workspace/patches.py` generates patch suggestions.

## Analysis Pipeline

The pipeline follows a consistent order so every result can be traced back to a specific stage.

### Stage 1: Scan

- Index repository files.
- Track file counts, languages, and priority files.
- Collect a bounded file sample for downstream use.

### Stage 2: Parse and detect

- Extract dependencies from standard project files.
- Detect CUDA usage through AST and repository patterns.
- Inspect Dockerfiles for NVIDIA-specific runtime settings.

### Stage 3: Evaluate

- Run compatibility rules.
- Compute migration effort and confidence.
- Build blockers, recommendations, and summary data.

### Stage 4: Generate

- Build a ROCm Dockerfile.
- Generate a deployment guide.
- Render the HTML report.
- Assemble graph and artifact payloads for the UI.

### Stage 5: Assist

- Build a RAG-style context from the analysis and curated knowledge.
- Ask the configured AI provider for structured assistant output.
- Return concise, JSON-shaped answers for the frontend.

## Module Map

### `scanner/`
Repository indexing, file prioritization, and ignore rules.

### `parsers/`
Dependency extraction, CUDA detection, and Docker analysis.

### `compatibility/`
Rule evaluation, blocker derivation, scoring, and recommendations.

### `confidence/`
Confidence computation for analysis outputs.

### `generators/`
Dockerfile and deployment guide generation.

### `graph/`
Dependency graph construction for visual and summary use.

### `ai/`
Provider abstraction, prompt building, schemas, and assistant helpers.

### `reports/`
HTML report rendering.

### `migration_workspace/`
Patch suggestion generation and workspace-related helpers.

## Data Model

The main persisted unit is an analysis record, which includes:

- repository metadata
- scan output
- findings
- compatibility results
- confidence data
- generated artifacts
- blockers and recommendations
- migration status
- optional assistant data
- checklist state

SQLite is used because it is simple, portable, and adequate for the expected hackathon-scale workload.

## Runtime and Deployment

The project is designed to run as two services under Docker Compose:

- Frontend on port 3000
- Backend on port 8000

Shared volumes expose the workspace and database so analyses can persist across runs.

## AI Provider Strategy

AI is intentionally isolated behind a provider interface so the app can switch between providers without changing the pipeline.

- Gemini is suitable for development and low-friction local testing.
- Fireworks is used as the production-facing provider.
- The backend returns deterministic data even when AI output is unavailable, so analysis can still complete.

## Failure Boundaries

The architecture is structured so failures are localized:

- Clone or ZIP extraction errors are handled before analysis begins.
- Large repository limits fail fast.
- AI failures do not block the deterministic analysis result.
- The frontend polls job state instead of holding a long request open.

## Why This Shape Works

This layout keeps the app understandable under time pressure:

- the backend owns correctness
- the frontend owns presentation
- the analysis pipeline owns domain logic
- AI adds polish rather than being the single point of failure

That separation makes it easier to debug, demo, and extend.
