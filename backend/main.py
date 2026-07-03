import os
import re
import shutil
import stat
import threading
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from git import Repo
from git.exc import GitCommandError
from pydantic import BaseModel, HttpUrl, field_validator

from config import settings
from database import init_db, save_analysis
from scanner.indexer import index_repository

app = FastAPI(title="AMD Port Studio API", version="0.1.0")

GITHUB_OWNER_REPO_RE = re.compile(r"^[\w.-]+$")


class AnalyzeRequest(BaseModel):
    github_url: HttpUrl

    @field_validator("github_url", mode="before")
    @classmethod
    def strip_github_url(cls, value: str) -> str:
        return value.strip()


def parse_github_repo_url(url: str) -> tuple[str, str, str]:
    """Return (normalized_clone_url, owner, repo)."""
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower().removeprefix("www.")

    if host != "github.com":
        raise ValueError("Only GitHub URLs are supported (https://github.com/owner/repo)")

    path = parsed.path.strip("/")
    if path.endswith(".git"):
        path = path[:-4]

    parts = [segment for segment in path.split("/") if segment]
    if len(parts) < 2:
        raise ValueError(
            "Invalid GitHub URL. Use https://github.com/owner/repository"
        )

    owner, repo = parts[0], parts[1]
    for label, name in (("owner", owner), ("repository", repo)):
        if not name or name.endswith("."):
            raise ValueError(
                f"Invalid GitHub {label} in URL. "
                "Remove trailing punctuation and use https://github.com/owner/repo"
            )
        if not GITHUB_OWNER_REPO_RE.fullmatch(name):
            raise ValueError(f"Invalid GitHub {label} name: {name!r}")

    normalized = f"https://github.com/{owner}/{repo}"
    return normalized, owner, repo


def repo_slug(owner: str, repo: str) -> str:
    return f"{owner}_{repo}"


app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _remove_readonly(func, path: str, _excinfo) -> None:
    os.chmod(path, stat.S_IWRITE)
    func(path)


_clone_locks: dict[str, threading.Lock] = {}
_clone_locks_guard = threading.Lock()


def _clone_lock_for(slug: str) -> threading.Lock:
    with _clone_locks_guard:
        lock = _clone_locks.get(slug)
        if lock is None:
            lock = threading.Lock()
            _clone_locks[slug] = lock
        return lock


def remove_directory(path: Path, *, retries: int = 5, delay: float = 0.25) -> None:
    if not path.exists():
        return

    last_error: OSError | None = None
    for attempt in range(retries):
        try:
            shutil.rmtree(path, onerror=_remove_readonly)
            return
        except OSError as exc:
            last_error = exc
            if attempt < retries - 1:
                time.sleep(delay * (2**attempt))

    if last_error is not None:
        raise last_error


def _schedule_trash_cleanup(path: Path) -> None:
    def _cleanup() -> None:
        try:
            remove_directory(path)
        except OSError:
            pass

    threading.Thread(target=_cleanup, daemon=True).start()


def _is_valid_repo(path: Path) -> bool:
    try:
        Repo(path)
        return True
    except Exception:
        return False


def clone_repository(github_url: str, target_dir: Path) -> Path:
    workspace = target_dir.parent
    workspace.mkdir(parents=True, exist_ok=True)

    if _is_valid_repo(target_dir):
        return target_dir

    if not target_dir.exists():
        Repo.clone_from(github_url, target_dir, depth=1)
        return target_dir

    temp_dir = workspace / f".{target_dir.name}.clone-{uuid.uuid4().hex[:12]}"
    try:
        Repo.clone_from(github_url, temp_dir, depth=1)

        trash_dir = workspace / f".{target_dir.name}.trash-{uuid.uuid4().hex[:12]}"
        try:
            target_dir.replace(trash_dir)
            _schedule_trash_cleanup(trash_dir)
        except OSError:
            try:
                remove_directory(target_dir)
            except OSError:
                return temp_dir

        if target_dir.exists():
            return temp_dir

        try:
            temp_dir.replace(target_dir)
            return target_dir
        except OSError:
            return temp_dir
    except Exception:
        remove_directory(temp_dir)
        raise


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


@app.on_event("startup")
def on_startup():
    init_db(Path(settings.database_path))


@app.get("/health")
def health():
    return {"status": "ok", "service": "amd-port-studio-api"}


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest):
    try:
        github_url, owner, repo = parse_github_repo_url(str(request.github_url))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    workspace = Path(settings.workspace_dir)
    workspace.mkdir(parents=True, exist_ok=True)

    slug = repo_slug(owner, repo)
    repo_path = workspace / slug

    try:
        with _clone_lock_for(slug):
            repo_path = clone_repository(github_url, repo_path)
        scan = index_repository(repo_path)
        all_files = scan["files"]
        scan["files_full"] = all_files

        analysis_id = save_analysis(
            Path(settings.database_path),
            slug,
            github_url,
            {**scan, "files": all_files},
        )

        scan_for_response = {**scan, "files": all_files[:200]}
        del scan_for_response["files_full"]

        return {
            "status": "success",
            "analysis_id": analysis_id,
            "repository": {
                "name": slug,
                "url": github_url,
                "file_count": scan["file_count"],
                "files_skipped": scan["files_skipped"],
                "languages": scan["languages"],
                "priority_files": scan["priority_files"],
                "files": scan_for_response["files"],
                "sample_files": scan["sample_files"],
            },
            "analysis": mock_migration_analysis(slug, scan),
        }
    except GitCommandError as exc:
        raise HTTPException(
            status_code=400,
            detail="Repository not found or not accessible. Check the GitHub URL.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=409,
            detail=(
                "Workspace folder is locked by another process. "
                "Stop Docker (`docker compose down`) if it is running, "
                "then retry."
            ),
        ) from exc
    except OSError as exc:
        if getattr(exc, "winerror", None) == 32 or exc.errno in {13, 16}:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Workspace folder is locked by another process. "
                    "Stop Docker (`docker compose down`) if it is running, "
                    "then retry."
                ),
            ) from exc
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc
