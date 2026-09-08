"""Load step: write clean records into SQLite.

Each run inserts a fresh snapshot rather than overwriting the previous one
(rows are keyed by name + scraped_at), so the table doubles as a time series
once the scraper has run more than once — that history is what Phase 3's
trend view reads from.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

from scraper.config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rank INTEGER NOT NULL,
    name TEXT NOT NULL,
    wikipedia_url TEXT,
    youtube_url TEXT,
    subscribers_millions REAL,
    subscribers INTEGER,
    primary_language TEXT,
    category TEXT,
    joined_youtube TEXT,
    joined_youtube_raw TEXT,
    country TEXT,
    source_url TEXT NOT NULL,
    scraped_at TEXT NOT NULL,
    UNIQUE(name, scraped_at)
);

CREATE INDEX IF NOT EXISTS idx_channels_scraped_at ON channels(scraped_at);
CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name);
"""

INSERT_SQL = """
INSERT OR IGNORE INTO channels (
    rank, name, wikipedia_url, youtube_url, subscribers_millions, subscribers,
    primary_language, category, joined_youtube, joined_youtube_raw, country,
    source_url, scraped_at
) VALUES (
    :rank, :name, :wikipedia_url, :youtube_url, :subscribers_millions, :subscribers,
    :primary_language, :category, :joined_youtube, :joined_youtube_raw, :country,
    :source_url, :scraped_at
)
"""


def get_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def create_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    conn.commit()


def insert_records(
    conn: sqlite3.Connection,
    records: list[dict[str, Any]],
    source_url: str,
    scraped_at: str,
) -> int:
    rows = [{**record, "source_url": source_url, "scraped_at": scraped_at} for record in records]
    cursor = conn.executemany(INSERT_SQL, rows)
    conn.commit()
    return cursor.rowcount


def run(records: list[dict[str, Any]], source_url: str, scraped_at: str) -> int:
    conn = get_connection()
    try:
        create_schema(conn)
        inserted = insert_records(conn, records, source_url, scraped_at)
        print(f"[load] inserted {inserted} rows into {DB_PATH} (scraped_at={scraped_at})")
        return inserted
    finally:
        conn.close()
