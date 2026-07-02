import os
import shutil
import stat
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from git import Repo
from pydantic import BaseModel, HttpUrl

from config import settings

app = FastAPI(title="AMD Port Studio API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    github_url: HttpUrl


def repo_slug(url: str) -> str:
    path = urlparse(url).path.strip("/")
    if path.endswith(".git"):
        path = path[:-4]
    parts = path.split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub URL")
    return f"{parts[-2]}_{parts[-1]}"


def _remove_readonly(func, path: str, _excinfo) -> None:
    os.chmod(path, stat.S_IWRITE)
    func(path)


def remove_directory(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path, onerror=_remove_readonly)


def clone_repository(github_url: str, target_dir: Path) -> None:
    remove_directory(target_dir)
    Repo.clone_from(github_url, target_dir)


def scan_repository(repo_path: Path) -> dict:
  files = []
  for root, dirs, filenames in os.walk(repo_path):
      dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "venv", ".venv", "__pycache__"}]
      for name in filenames:
          rel = Path(root).relative_to(repo_path) / name
          files.append(str(rel).replace("\\", "/"))
  return {
      "file_count": len(files),
      "sample_files": files[:20],
  }


def mock_migration_analysis(repo_name: str, scan: dict) -> dict:
    return {
        "migrationDifficulty": "Medium",
        "estimatedHours": 8,
        "riskLevel": "Moderate",
        "compatibilityScore": 72,
        "summary": (
            f"Stub analysis for {repo_name}. "
            "Day 1 vertical slice is working. Real CUDA and ROCm rules come on Days 3–4."
        ),
        "unsupportedLibraries": ["tensorrt"],
        "recommendedAlternatives": ["ONNX Runtime ROCm"],
        "migrationSteps": [
            "Review CUDA dependencies",
            "Update Docker base image to ROCm",
            "Validate PyTorch on AMD hardware",
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "amd-port-studio-api"}


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest):
    github_url = str(request.github_url)
    if "github.com" not in github_url:
        raise HTTPException(status_code=400, detail="Only GitHub URLs are supported on Day 1")

    workspace = Path(settings.workspace_dir)
    workspace.mkdir(parents=True, exist_ok=True)

    slug = repo_slug(github_url)
    repo_path = workspace / slug

    try:
        clone_repository(github_url, repo_path)
        scan = scan_repository(repo_path)
        analysis = mock_migration_analysis(slug, scan)
        return {
            "status": "success",
            "repository": {
                "name": slug,
                "url": github_url,
                "file_count": scan["file_count"],
                "sample_files": scan["sample_files"],
            },
            "analysis": analysis,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc