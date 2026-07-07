import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

_NEW_ANALYSIS_COLUMNS = (
    ("project_slug", "TEXT"),
    ("source_type", "TEXT"),
    ("full_response_json", "TEXT"),
    ("metrics_json", "TEXT"),
    ("blockers_json", "TEXT"),
    ("recommendations_json", "TEXT"),
    ("migration_status_json", "TEXT"),
    ("checklist_json", "TEXT"),
    ("notes_json", "TEXT"),
    ("workspace_state_json", "TEXT"),
)


def get_connection(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def _migrate_analyses_table(conn: sqlite3.Connection) -> None:
    existing = {row[1] for row in conn.execute("PRAGMA table_info(analyses)")}
    for name, col_type in _NEW_ANALYSIS_COLUMNS:
        if name not in existing:
            conn.execute(f"ALTER TABLE analyses ADD COLUMN {name} {col_type}")


def init_db(db_path: Path) -> None:
    conn = get_connection(db_path)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            repository_name TEXT NOT NULL,
            repository_url TEXT NOT NULL,
            file_count INTEGER NOT NULL,
            files_skipped INTEGER NOT NULL,
            languages_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS analysis_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id TEXT NOT NULL,
            path TEXT NOT NULL,
            language TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            priority TEXT NOT NULL,
            category TEXT NOT NULL,
            FOREIGN KEY (analysis_id) REFERENCES analyses(id)
        );

        CREATE INDEX IF NOT EXISTS idx_analysis_files_analysis_id
        ON analysis_files(analysis_id);
    """)
    _migrate_analyses_table(conn)
    conn.commit()
    conn.close()


def _repository_name(payload: dict) -> str:
    repository = payload.get("repository") or {}
    return repository.get("name") or payload.get("project_slug") or "unknown"


def _repository_url(payload: dict) -> str:
    repository = payload.get("repository") or {}
    return repository.get("url") or payload.get("source_url") or ""


def _scan_from_payload(payload: dict) -> dict:
    db_scan = payload.get("_db_scan")
    if db_scan:
        return db_scan
    repository = payload.get("repository") or {}
    return {
        "file_count": repository.get("file_count", 0),
        "files_skipped": repository.get("files_skipped", 0),
        "languages": repository.get("languages", {}),
        "files_full": repository.get("files", []),
    }


def _compatibility_score(payload: dict) -> int | None:
    findings = payload.get("findings") or {}
    compatibility = findings.get("compatibility") or {}
    score = compatibility.get("score")
    return int(score) if score is not None else None


def save_full_analysis(db_path: Path, payload: dict) -> str:
    analysis_id = str(uuid4())
    scan = _scan_from_payload(payload)
    now = datetime.now(timezone.utc).isoformat()
    project_slug = payload.get("project_slug") or _repository_name(payload)
    source_type = payload.get("source_type") or "github"

    stored_payload = {k: v for k, v in payload.items() if k != "_db_scan"}
    stored_payload["analysis_id"] = analysis_id

    conn = get_connection(db_path)
    conn.execute(
        """
        INSERT INTO analyses (
            id, repository_name, repository_url, file_count, files_skipped,
            languages_json, created_at, project_slug, source_type,
            full_response_json, metrics_json, blockers_json,
            recommendations_json, migration_status_json, checklist_json,
            notes_json, workspace_state_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            analysis_id,
            _repository_name(payload),
            _repository_url(payload),
            scan["file_count"],
            scan["files_skipped"],
            json.dumps(scan["languages"]),
            now,
            project_slug,
            source_type,
            json.dumps(stored_payload),
            json.dumps(payload.get("metrics") or {}),
            json.dumps(payload.get("blockers") or []),
            json.dumps(payload.get("recommendations") or []),
            json.dumps(
                payload.get("migrationStatus")
                or payload.get("migration_status")
                or {}
            ),
            json.dumps([]),          # checklist_json
            json.dumps({}),          # notes_json
            json.dumps({}),          # workspace_state_json
        ),
    )

    files = scan.get("files_full") or scan.get("files") or []
    if files:
        conn.executemany(
            """
            INSERT INTO analysis_files (analysis_id, path, language, size_bytes, priority, category)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    analysis_id,
                    f["path"],
                    f["language"],
                    f["size_bytes"],
                    f["priority"],
                    f["category"],
                )
                for f in files
            ],
        )

    conn.commit()
    conn.close()
    return analysis_id


def save_analysis(db_path: Path, repository_name: str, repository_url: str, scan: dict) -> str:
    """Legacy scan-only save. Prefer save_full_analysis for new code."""
    return save_full_analysis(
        db_path,
        {
            "project_slug": repository_name,
            "source_type": "github",
            "source_url": repository_url,
            "repository": {
                "name": repository_name,
                "url": repository_url,
                "file_count": scan["file_count"],
                "files_skipped": scan["files_skipped"],
                "languages": scan["languages"],
            },
            "_db_scan": scan,
        },
    )


def list_analyses(db_path: Path, limit: int = 50) -> list[dict]:
    conn = get_connection(db_path)
    rows = conn.execute(
        """
        SELECT
            id,
            repository_name,
            project_slug,
            source_type,
            created_at,
            json_extract(full_response_json, '$.findings.compatibility.score') AS compatibility_score
        FROM analyses
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "repository_name": row["repository_name"],
            "project_slug": row["project_slug"],
            "source_type": row["source_type"],
            "created_at": row["created_at"],
            "compatibility_score": (
                int(row["compatibility_score"])
                if row["compatibility_score"] is not None
                else None
            ),
        }
        for row in rows
    ]


def _load_full_response(row: sqlite3.Row) -> dict | None:
    raw = row["full_response_json"]
    if raw:
        return json.loads(raw)

    return {
        "analysis_id": row["id"],
        "repository": {
            "name": row["repository_name"],
            "url": row["repository_url"],
            "file_count": row["file_count"],
            "files_skipped": row["files_skipped"],
            "languages": json.loads(row["languages_json"]),
        },
        "metrics": json.loads(row["metrics_json"] or "{}"),
        "blockers": json.loads(row["blockers_json"] or "[]"),
        "recommendations": json.loads(row["recommendations_json"] or "[]"),
        "migration_status": json.loads(row["migration_status_json"] or "{}"),
        "project_slug": row["project_slug"],
        "source_type": row["source_type"],
        "created_at": row["created_at"],
    }


def get_analysis(db_path: Path, analysis_id: str) -> dict | None:
    conn = get_connection(db_path)
    row = conn.execute(
        "SELECT * FROM analyses WHERE id = ?",
        (analysis_id,),
    ).fetchone()
    conn.close()
    if row is None:
        return None
    return _load_full_response(row)


def get_analysis_export(db_path: Path, analysis_id: str) -> dict | None:
    return get_analysis(db_path, analysis_id)

def save_checklist(db_path: Path, analysis_id: str, checklist: list[dict],) -> None:
    conn = get_connection(db_path)
    conn.execute(
        """
        UPDATE analyses
        SET checklist_json = ?
        WHERE id = ?
        """,
        (
            json.dumps(checklist),
            analysis_id,
        ),
    )

    conn.commit()
    conn.close()

def get_checklist(db_path: Path, analysis_id: str,) -> list[dict]:
    conn = get_connection(db_path)
    row = conn.execute(
        """
        SELECT checklist_json
        FROM analyses
        WHERE id = ?
        """,
        (analysis_id,),
    ).fetchone()

    conn.close()

    if row is None:
        return []

    return json.loads(row["checklist_json"] or "[]")