# AMD Port Studio

AMD Port Studio is a full-stack migration assistant for NVIDIA CUDA to AMD ROCm. It analyzes GitHub repositories or uploaded ZIP archives, scans dependencies and GPU usage, scores ROCm compatibility, and presents the results in a command-center style dashboard with AI-assisted guidance.

## What it does

- Imports a repository from GitHub or a ZIP archive.
- Scans files, languages, dependencies, and GPU-related patterns.
- Evaluates ROCm compatibility with deterministic rules and scoring.
- Generates migration recommendations, blockers, confidence signals, and reports.
- Surfaces the result in a Next.js dashboard with workspace tabs for overview, compatibility, dependencies, Docker, deploy, checklist, patches, artifacts, and AI.
- Exposes a FastAPI backend with workspace, analysis, export, report, checklist, and assistant endpoints.

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: FastAPI, Python 3.11+, Pydantic, GitPython
- Analysis: AST-based dependency extraction, CUDA detection, ROCm compatibility rules, confidence scoring
- AI: Gemini or Fireworks provider abstraction
- Data: SQLite for stored analyses and checklists
- Deployment: Docker Compose

## Repository Layout

```text
frontend/   Next.js app and UI components
backend/    FastAPI app, analysis pipeline, providers, rules, and generators
data/       SQLite database and persisted analysis artifacts
workspace/  Extracted or cloned repositories under analysis
docs/       Planning and architecture documentation
```

## Quick Start

### Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer
- npm
- Docker and Docker Compose, if you want containerized runs

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker Compose

```bash
docker compose up --build
```

The frontend runs on http://localhost:3000 and the backend runs on http://localhost:8000.

## Environment Variables

Configure these for the backend and Docker Compose:

- `AI_PROVIDER` - `gemini` or `fireworks`
- `GEMINI_API_KEY` - Gemini API key
- `FIREWORKS_API_KEY` - Fireworks API key
- `AMD_CLOUD_API_KEY` - reserved for AMD Cloud workflows
- `DATABASE_PATH` - path to the SQLite database
- `WORKSPACE_DIR` - clone/extract workspace path
- `CORS_ORIGINS` - allowed frontend origin(s)

Example backend `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
DATABASE_PATH=data/amd_port_studio.db
WORKSPACE_DIR=./workspace
CORS_ORIGINS=http://localhost:3000
```

## User Flow

1. Paste a GitHub repository URL or upload a ZIP archive.
2. The backend clones or extracts the project and starts a background analysis job.
3. The scanner indexes files and gathers dependency and GPU signals.
4. The compatibility engine evaluates ROCm readiness and confidence.
5. The dashboard opens the workspace view once the analysis completes.
6. The assistant endpoint can answer questions grounded in the analysis and curated ROCm knowledge.

## Main API Endpoints

- `GET /health` - service health check
- `POST /api/analyze/jobs` - start a GitHub repository analysis job
- `POST /api/analyze/jobs/zip` - upload and analyze a ZIP archive
- `GET /api/analyze/jobs/{job_id}` - poll job progress
- `GET /api/workspace/{analysis_id}` - fetch workspace data for the dashboard
- `GET /api/analyses/{analysis_id}` - fetch a stored analysis
- `GET /api/analyses/{analysis_id}/report.html` - render the HTML report
- `POST /api/analyses/{analysis_id}/patches` - generate patch suggestions
- `POST /api/assistant` - ask the analysis assistant a question

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Demo Repositories](DEMO-REPOS.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
