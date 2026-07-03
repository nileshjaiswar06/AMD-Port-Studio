import os
import re
import shutil
import stat
import threading
import time
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from git import Repo
from git.exc import GitCommandError
from pydantic import BaseModel, HttpUrl, field_validator

from analysis_pipeline import run_analysis_pipeline
from config import settings
from database import (
    get_analysis,
    get_analysis_export,
    init_db,
    list_analyses,
    save_full_analysis,
)

app = FastAPI(title="AMD Port Studio API", version="0.1.0")

GITHUB_OWNER_REPO_RE = re.compile(r"^[\w.-]+$")
SLUG_RE = re.compile(r"[^a-zA-Z0-9._-]+")


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


def slugify_name(name: str) -> str:
    stem = Path(name).stem or "upload"
    slug = SLUG_RE.sub("_", stem).strip("_")
    return slug or "upload"


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
_analysis_jobs: dict[str, dict] = {}
_analysis_jobs_guard = threading.Lock()


def _clone_lock_for(slug: str) -> threading.Lock:
    with _clone_locks_guard:
        lock = _clone_locks.get(slug)
        if lock is None:
            lock = threading.Lock()
            _clone_locks[slug] = lock
        return lock


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _create_analysis_job(source_type: str, source_name: str) -> str:
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id,
        "status": "queued",
        "stage": "cloning",
        "analysis_id": None,
        "error": None,
        "source_type": source_type,
        "source_name": source_name,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    with _analysis_jobs_guard:
        _analysis_jobs[job_id] = job
    return job_id


def _get_analysis_job(job_id: str) -> dict | None:
    with _analysis_jobs_guard:
        job = _analysis_jobs.get(job_id)
        return dict(job) if job else None


def _update_analysis_job(job_id: str, **updates) -> dict | None:
    with _analysis_jobs_guard:
        job = _analysis_jobs.get(job_id)
        if job is None:
            return None
        job.update(updates)
        job["updated_at"] = _now_iso()
        return dict(job)


def _finalize_analysis_job(job_id: str, payload: dict) -> str:
    response = _finalize_analysis(payload)
    _update_analysis_job(
        job_id,
        status="completed",
        stage="completed",
        analysis_id=response["analysis_id"],
        error=None,
    )
    return response["analysis_id"]


def _fail_analysis_job(job_id: str, exc: Exception) -> None:
    error = _handle_analysis_errors(exc)
    _update_analysis_job(
        job_id,
        status="failed",
        stage="failed",
        error=error.detail,
    )


def _run_github_analysis_job(job_id: str, github_url: str, owner: str, repo: str) -> None:
    workspace = Path(settings.workspace_dir)
    workspace.mkdir(parents=True, exist_ok=True)

    slug = repo_slug(owner, repo)
    repo_path = workspace / slug

    try:
        _update_analysis_job(job_id, status="running", stage="cloning")
        with _clone_lock_for(slug):
            repo_path = clone_repository(github_url, repo_path)

        def progress(stage: str) -> None:
            _update_analysis_job(job_id, stage=stage)

        payload = run_analysis_pipeline(
            repo_path,
            slug,
            github_url,
            "github",
            progress_callback=progress,
        )
        _finalize_analysis_job(job_id, payload)
    except Exception as exc:
        _fail_analysis_job(job_id, exc)


def _run_zip_analysis_job(
    job_id: str,
    archive_path: Path,
    extract_dir: Path,
    filename: str,
) -> None:
    try:
        _update_analysis_job(job_id, status="running", stage="cloning")
        repo_path = extract_zip_archive(archive_path, extract_dir)
        slug = slugify_name(filename)

        def progress(stage: str) -> None:
            _update_analysis_job(job_id, stage=stage)

        payload = run_analysis_pipeline(
            repo_path,
            slug,
            filename,
            "zip",
            progress_callback=progress,
        )
        _finalize_analysis_job(job_id, payload)
    except Exception as exc:
        _fail_analysis_job(job_id, exc)
    finally:
        remove_directory(extract_dir)
        if archive_path.exists():
            archive_path.unlink(missing_ok=True)


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


def resolve_repo_root(extract_dir: Path) -> Path:
    entries = [p for p in extract_dir.iterdir() if not p.name.startswith(".")]
    if len(entries) == 1 and entries[0].is_dir():
        return entries[0]
    return extract_dir


def extract_zip_archive(archive_path: Path, target_dir: Path) -> Path:
    target_dir.mkdir(parents=True, exist_ok=True)
    resolved_root = target_dir.resolve()

    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.namelist():
            if not member or member.endswith("/"):
                continue
            destination = (target_dir / member).resolve()
            if not str(destination).startswith(str(resolved_root)):
                raise ValueError("Unsafe path in zip archive")
        archive.extractall(target_dir)

    return resolve_repo_root(target_dir)


def _finalize_analysis(payload: dict) -> dict:
    db_path = Path(settings.database_path)
    analysis_id = save_full_analysis(db_path, payload)
    response = {k: v for k, v in payload.items() if k != "_db_scan"}
    response["analysis_id"] = analysis_id
    return response


def _handle_analysis_errors(exc: Exception) -> HTTPException:
    if isinstance(exc, GitCommandError):
        return HTTPException(
            status_code=400,
            detail="Repository not found or not accessible. Check the GitHub URL.",
        )
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail=str(exc))
    if isinstance(exc, PermissionError):
        return HTTPException(
            status_code=409,
            detail=(
                "Workspace folder is locked by another process. "
                "Stop Docker (`docker compose down`) if it is running, "
                "then retry."
            ),
        )
    if isinstance(exc, OSError) and (
        getattr(exc, "winerror", None) == 32 or exc.errno in {13, 16}
    ):
        return HTTPException(
            status_code=409,
            detail=(
                "Workspace folder is locked by another process. "
                "Stop Docker (`docker compose down`) if it is running, "
                "then retry."
            ),
        )
    if isinstance(exc, zipfile.BadZipFile):
        return HTTPException(status_code=400, detail="Invalid or corrupted zip file.")
    return HTTPException(status_code=500, detail=f"Analysis failed: {exc}")


@app.on_event("startup")
def on_startup():
    init_db(Path(settings.database_path))


@app.get("/health")
def health():
    return {"status": "ok", "service": "amd-port-studio-api"}


@app.get("/api/analyses")
def analyses(limit: int = 50):
    if limit < 1 or limit > 200:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 200")
    return list_analyses(Path(settings.database_path), limit=limit)


@app.post("/api/analyze/jobs")
def analyze_job(request: AnalyzeRequest):
    try:
        github_url, owner, repo = parse_github_repo_url(str(request.github_url))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    job_id = _create_analysis_job("github", f"{owner}/{repo}")

    thread = threading.Thread(
        target=_run_github_analysis_job,
        args=(job_id, github_url, owner, repo),
        daemon=True,
    )
    thread.start()
    return _get_analysis_job(job_id)


@app.post("/api/analyze/jobs/zip")
async def analyze_zip_job(file: UploadFile = File(...)):
    filename = file.filename or "upload.zip"
    if not filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip uploads are supported")

    workspace = Path(settings.workspace_dir)
    workspace.mkdir(parents=True, exist_ok=True)

    slug = slugify_name(filename)
    extract_dir = workspace / f"zip_{uuid.uuid4().hex[:12]}"
    archive_path = extract_dir.with_suffix(".zip")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded zip file is empty")
    if len(content) > settings.max_zip_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Zip file exceeds {settings.max_zip_upload_bytes // (1024 * 1024)}MB limit",
        )

    archive_path.write_bytes(content)
    job_id = _create_analysis_job("zip", slug)

    thread = threading.Thread(
        target=_run_zip_analysis_job,
        args=(job_id, archive_path, extract_dir, filename),
        daemon=True,
    )
    thread.start()
    return _get_analysis_job(job_id)


@app.get("/api/analyze/jobs/{job_id}")
def analyze_job_status(job_id: str):
    job = _get_analysis_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return job


@app.get("/api/analyses/{analysis_id}")
def analysis_detail(analysis_id: str):
    stored = get_analysis(Path(settings.database_path), analysis_id)
    if stored is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return stored


@app.get("/api/analyses/{analysis_id}/export.json")
def analysis_export(analysis_id: str):
    stored = get_analysis_export(Path(settings.database_path), analysis_id)
    if stored is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return JSONResponse(
        content=stored,
        headers={
            "Content-Disposition": f'attachment; filename="analysis-{analysis_id}.json"'
        },
    )


@app.get("/api/analyses/{analysis_id}/report.html")
def analysis_report_html(analysis_id: str):
    stored = get_analysis(Path(settings.database_path), analysis_id)
    if stored is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    html = (stored.get("artifacts") or {}).get("htmlReport")
    if not html:
        raise HTTPException(status_code=404, detail="HTML report not found for this analysis")
    slug = stored.get("project_slug") or stored.get("repository", {}).get("name", analysis_id)
    return HTMLResponse(
        content=html,
        headers={
            "Content-Disposition": f'inline; filename="{slug}-migration-report.html"'
        },
    )


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
        payload = run_analysis_pipeline(repo_path, slug, github_url, "github")
        return _finalize_analysis(payload)
    except HTTPException:
        raise
    except Exception as exc:
        raise _handle_analysis_errors(exc) from exc


@app.post("/api/analyze/zip")
async def analyze_zip(file: UploadFile = File(...)):
    filename = file.filename or "upload.zip"
    if not filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip uploads are supported")

    workspace = Path(settings.workspace_dir)
    workspace.mkdir(parents=True, exist_ok=True)

    slug = slugify_name(filename)
    extract_dir = workspace / f"zip_{uuid.uuid4().hex[:12]}"
    archive_path = extract_dir.with_suffix(".zip")

    try:
        content = await file.read()
        if not content:
            raise ValueError("Uploaded zip file is empty")
        if len(content) > settings.max_zip_upload_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"Zip file exceeds {settings.max_zip_upload_bytes // (1024 * 1024)}MB limit",
            )
        archive_path.write_bytes(content)
        repo_path = extract_zip_archive(archive_path, extract_dir)
        payload = run_analysis_pipeline(repo_path, slug, filename, "zip")
        return _finalize_analysis(payload)
    except HTTPException:
        raise
    except Exception as exc:
        raise _handle_analysis_errors(exc) from exc
    finally:
        remove_directory(extract_dir)
        if archive_path.exists():
            archive_path.unlink(missing_ok=True)
