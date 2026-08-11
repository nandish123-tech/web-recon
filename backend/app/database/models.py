"""Database CRUD operations for scans."""
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.database.db import get_db
from app.utils.logger import get_logger

logger = get_logger(__name__)


def save_scan(scan_id: str, target: str) -> None:
    """Create a new scan record in the database."""
    with get_db() as conn:
        conn.execute(
            """INSERT INTO scans (scan_id, target, status, progress, modules_json, errors_json, created_at)
               VALUES (?, ?, 'queued', 0, ?, '[]', ?)""",
            (
                scan_id,
                target,
                json.dumps({
                    "whois": "pending", "dns": "pending", "ip": "pending",
                    "http": "pending", "ssl": "pending", "web_files": "pending",
                    "security": "pending"
                }),
                datetime.utcnow().isoformat(),
            ),
        )


def update_scan_status(
    scan_id: str,
    status: str,
    progress: int,
    current_module: Optional[str] = None,
    modules: Optional[Dict] = None,
    errors: Optional[List] = None,
    results: Optional[Dict] = None,
    started_at: Optional[str] = None,
    completed_at: Optional[str] = None,
    duration_seconds: Optional[float] = None,
    observation_count: Optional[int] = None,
) -> None:
    """Update scan status and results."""
    with get_db() as conn:
        fields = ["status = ?", "progress = ?"]
        values: List[Any] = [status, progress]

        if current_module is not None:
            fields.append("current_module = ?")
            values.append(current_module)

        if modules is not None:
            fields.append("modules_json = ?")
            values.append(json.dumps(modules))

        if errors is not None:
            fields.append("errors_json = ?")
            values.append(json.dumps(errors))

        if results is not None:
            fields.append("results_json = ?")
            values.append(json.dumps(results))

        if started_at is not None:
            fields.append("started_at = ?")
            values.append(started_at)

        if completed_at is not None:
            fields.append("completed_at = ?")
            values.append(completed_at)

        if duration_seconds is not None:
            fields.append("duration_seconds = ?")
            values.append(duration_seconds)

        if observation_count is not None:
            fields.append("observation_count = ?")
            values.append(observation_count)

        values.append(scan_id)
        conn.execute(
            f"UPDATE scans SET {', '.join(fields)} WHERE scan_id = ?",
            values,
        )


def get_scan(scan_id: str) -> Optional[Dict]:
    """Retrieve a scan by ID."""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM scans WHERE scan_id = ?", (scan_id,)).fetchone()
        if row is None:
            return None
        return dict(row)


def list_scans(limit: int = 50, offset: int = 0) -> List[Dict]:
    """List all scans ordered by creation date."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM scans ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(row) for row in rows]


def delete_scan(scan_id: str) -> bool:
    """Delete a scan record."""
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM scans WHERE scan_id = ?", (scan_id,))
        return cursor.rowcount > 0
