"""
SafeRide Nepal — Door-Scanner Local SQLite Database

Every scan and GPS point is written here FIRST, before any network
attempt. This is the single most important invariant — never depend
on live connectivity to record an event.

Thread safety: each method creates its own sqlite3 connection, so
there is no shared connection object between threads. WAL mode
allows concurrent reads from multiple connections. A threading lock
serializes write operations (INSERT/UPDATE/DELETE) across threads to
prevent database-locked errors at the SQLite level.

Tables:
  - scan_events:     local queue of QR scans awaiting sync
  - location_pings:  local queue of GPS fixes awaiting sync
"""

import sqlite3
import os
import threading
from uuid import uuid4
from datetime import datetime, timezone


class ScannerDB:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._write_lock = threading.Lock()
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(
            self.db_path,
            timeout=10,
            check_same_thread=False,
        )
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        return conn

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS scan_events (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id        TEXT NOT NULL UNIQUE,
                    qr_token        TEXT NOT NULL,
                    scan_type       TEXT,
                    trip_id         TEXT,
                    latitude        REAL,
                    longitude       REAL,
                    device_timestamp TEXT NOT NULL,
                    synced          INTEGER NOT NULL DEFAULT 0
                );

                CREATE INDEX IF NOT EXISTS idx_scan_events_synced
                    ON scan_events(synced);

                CREATE TABLE IF NOT EXISTS location_pings (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id        TEXT NOT NULL UNIQUE,
                    latitude        REAL NOT NULL,
                    longitude       REAL NOT NULL,
                    speed           REAL,
                    accuracy        REAL,
                    heading         REAL,
                    device_timestamp TEXT NOT NULL,
                    synced          INTEGER NOT NULL DEFAULT 0
                );

                CREATE INDEX IF NOT EXISTS idx_location_pings_synced
                    ON location_pings(synced);
            """)
            conn.commit()

    # ── Scan events ────────────────────────────────────────────────────

    def insert_scan(self, qr_token: str, scan_type: str | None = None,
                    trip_id: str | None = None,
                    latitude: float | None = None,
                    longitude: float | None = None) -> str:
        event_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        with self._write_lock, self._connect() as conn:
            conn.execute(
                """INSERT INTO scan_events
                   (event_id, qr_token, scan_type, trip_id,
                    latitude, longitude, device_timestamp, synced)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 0)""",
                (event_id, qr_token, scan_type, trip_id,
                 latitude, longitude, now),
            )
            conn.commit()
        return event_id

    def get_unsynced_scans(self, limit: int = 50) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM scan_events WHERE synced = 0 ORDER BY id LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]

    def mark_scan_synced(self, event_id: str) -> None:
        with self._write_lock, self._connect() as conn:
            conn.execute(
                "UPDATE scan_events SET synced = 1 WHERE event_id = ?",
                (event_id,),
            )
            conn.commit()

    def count_unsynced_scans(self) -> int:
        with self._connect() as conn:
            row = conn.execute("SELECT COUNT(*) as cnt FROM scan_events WHERE synced = 0").fetchone()
        return row["cnt"] if row else 0

    # ── Location pings ─────────────────────────────────────────────────

    def insert_location(self, latitude: float, longitude: float,
                        speed: float | None = None,
                        accuracy: float | None = None,
                        heading: float | None = None) -> str:
        event_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        with self._write_lock, self._connect() as conn:
            conn.execute(
                """INSERT INTO location_pings
                   (event_id, latitude, longitude, speed, accuracy,
                    heading, device_timestamp, synced)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 0)""",
                (event_id, latitude, longitude, speed, accuracy,
                 heading, now),
            )
            conn.commit()
        return event_id

    def get_unsynced_locations(self, limit: int = 50) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM location_pings WHERE synced = 0 ORDER BY id LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]

    def mark_location_synced(self, event_id: str) -> None:
        with self._write_lock, self._connect() as conn:
            conn.execute(
                "UPDATE location_pings SET synced = 1 WHERE event_id = ?",
                (event_id,),
            )
            conn.commit()

    def count_unsynced_locations(self) -> int:
        with self._connect() as conn:
            row = conn.execute("SELECT COUNT(*) as cnt FROM location_pings WHERE synced = 0").fetchone()
        return row["cnt"] if row else 0

    # ── Cleanup / Maintenance ──────────────────────────────────────────

    def purge_synced_rows(self, older_than_hours: int = 24) -> None:
        with self._write_lock, self._connect() as conn:
            conn.execute(
                "DELETE FROM scan_events WHERE synced = 1 AND device_timestamp < datetime('now', ?)",
                (f"-{older_than_hours} hours",),
            )
            conn.execute(
                "DELETE FROM location_pings WHERE synced = 1 AND device_timestamp < datetime('now', ?)",
                (f"-{older_than_hours} hours",),
            )
            conn.commit()
