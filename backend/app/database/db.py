"""Database initialization and connection management."""
import sqlite3
import json
from contextlib import contextmanager
from datetime import datetime
from typing import Optional, List
from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


def get_connection() -> sqlite3.Connection:
    """Get a SQLite database connection with row factory."""
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Initialize the database schema."""
    logger.info("Initializing database schema")
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS scans (
                scan_id TEXT PRIMARY KEY,
                target TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'queued',
                progress INTEGER NOT NULL DEFAULT 0,
                current_module TEXT,
                modules_json TEXT NOT NULL DEFAULT '{}',
                errors_json TEXT NOT NULL DEFAULT '[]',
                results_json TEXT,
                created_at TEXT NOT NULL,
                started_at TEXT,
                completed_at TEXT,
                duration_seconds REAL,
                observation_count INTEGER DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
        """)
    logger.info("Database initialized")
