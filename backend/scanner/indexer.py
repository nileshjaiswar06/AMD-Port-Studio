import os
from dataclasses import asdict, dataclass
from pathlib import Path

from scanner.constants import (
    HIGH_PRIORITY_BASENAMES,
    HIGH_PRIORITY_EXTENSIONS,
    HIGH_PRIORITY_NAMES,
    IGNORE_DIRS,
    IGNORE_EXTENSIONS,
)
from scanner.language import detect_language


@dataclass
class FileRecord:
    path: str
    language: str
    size_bytes: int
    priority: str  # "high" | "normal" | "low"
    category: str  # "config" | "source" | "docs" | "other"


def classify_priority(path: str) -> str:
    name = Path(path).name.lower()
    ext = Path(path).suffix.lower()

    if name in HIGH_PRIORITY_NAMES or name in HIGH_PRIORITY_BASENAMES:
        return "high"
    if ext in HIGH_PRIORITY_EXTENSIONS:
        return "high"
    if ext in {".md", ".rst", ".txt"} and "readme" in name:
        return "high"
    if ext in {".md", ".rst"}:
        return "low"
    if ext in {".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico"}:
        return "low"
    return "normal"


def classify_category(path: str, language: str) -> str:
    name = Path(path).name.lower()
    if name in HIGH_PRIORITY_NAMES or "docker" in name:
        return "config"
    if language in {"markdown", "unknown"} and name.endswith((".md", ".rst", ".txt")):
        return "docs"
    if language != "unknown":
        return "source"
    return "other"


def should_skip_file(path: Path) -> bool:
    return path.suffix.lower() in IGNORE_EXTENSIONS


def index_repository(repo_path: Path) -> dict:
    records: list[FileRecord] = []
    skipped = 0

    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for filename in filenames:
            full = Path(root) / filename
            rel = str(full.relative_to(repo_path)).replace("\\", "/")

            if should_skip_file(full):
                skipped += 1
                continue

            try:
                size = full.stat().st_size
            except OSError:
                skipped += 1
                continue

            language = detect_language(rel)
            priority = classify_priority(rel)
            category = classify_category(rel, language)

            records.append(
                FileRecord(
                    path=rel,
                    language=language,
                    size_bytes=size,
                    priority=priority,
                    category=category,
                )
            )

    priority_rank = {"high": 0, "normal": 1, "low": 2}
    records.sort(key=lambda r: (priority_rank[r.priority], r.path))

    languages: dict[str, int] = {}
    for r in records:
        languages[r.language] = languages.get(r.language, 0) + 1

    high_priority = [asdict(r) for r in records if r.priority == "high"]

    return {
        "file_count": len(records),
        "files_skipped": skipped,
        "languages": languages,
        "priority_files": high_priority[:50],
        "files": [asdict(r) for r in records],
        "sample_files": [r.path for r in records[:20]],
    }