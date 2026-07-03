import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


def get_connection(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


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
    conn.commit()
    conn.close()


def save_analysis(db_path: Path, repository_name: str, repository_url: str, scan: dict) -> str:
    analysis_id = str(uuid4())
    conn = get_connection(db_path)
    now = datetime.now(timezone.utc).isoformat()

    conn.execute(
        """
        INSERT INTO analyses (id, repository_name, repository_url, file_count, files_skipped, languages_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            analysis_id,
            repository_name,
            repository_url,
            scan["file_count"],
            scan["files_skipped"],
            json.dumps(scan["languages"]),
            now,
        ),
    )

    conn.executemany(
        """
        INSERT INTO analysis_files (analysis_id, path, language, size_bytes, priority, category)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            (analysis_id, f["path"], f["language"], f["size_bytes"], f["priority"], f["category"])
            for f in scan.get("files_full", scan["files"])
        ],
    )

    conn.commit()
    conn.close()
    return analysis_id