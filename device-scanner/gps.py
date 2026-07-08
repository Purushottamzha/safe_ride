"""
SafeRide Nepal — GPS Polling Loop

Polls termux-location at a fixed interval and writes each fix to the
local SQLite database. Runs independently of the scan and sync loops.
"""

import json
import subprocess
import time
import threading

from config import Config
from database import ScannerDB


class GPSLoop:
    def __init__(self, config: Config, db: ScannerDB):
        self.config = config
        self.db = db
        self._running = False
        self._thread: threading.Thread | None = None
        self._interval = config.gps_interval_seconds

    def start(self) -> None:
        self._running = True
        self._thread = threading.Thread(target=self._loop, name="gps", daemon=True)
        self._thread.start()
        print(f"[GPS] Loop started (interval={self._interval}s)")

    def stop(self) -> None:
        self._running = False
        if self._thread:
            self._thread.join(timeout=10)
        print("[GPS] Loop stopped")

    def _get_fix(self) -> dict | None:
        """Poll termux-location for a single GPS fix."""
        try:
            result = subprocess.run(
                ["termux-location", "-p", "once"],
                timeout=10,
                capture_output=True,
                text=True,
            )
            if result.returncode != 0:
                print(f"[GPS] termux-location returned {result.returncode}: {result.stderr.strip()}")
                return None
            return json.loads(result.stdout)
        except subprocess.TimeoutExpired:
            print("[GPS] termux-location timed out")
            return None
        except json.JSONDecodeError as exc:
            print(f"[GPS] Failed to parse location: {exc}")
            return None
        except FileNotFoundError:
            print("[GPS] termux-location not found — is termux-api installed?")
            return None
        except Exception as exc:
            print(f"[GPS] Unexpected error: {exc}")
            return None

    def _loop(self) -> None:
        while self._running:
            fix = self._get_fix()
            if fix is not None:
                lat = fix.get("latitude")
                lng = fix.get("longitude")
                if lat is not None and lng is not None:
                    event_id = self.db.insert_location(
                        latitude=float(lat),
                        longitude=float(lng),
                        speed=fix.get("speed"),
                        accuracy=fix.get("accuracy"),
                        heading=fix.get("bearing"),
                    )
                    print(f"[GPS] Fix: {lat:.5f},{lng:.5f} acc={fix.get('accuracy')} event_id={event_id[:8]}...")
                else:
                    print(f"[GPS] Incomplete fix (no lat/lng): {fix}")
            else:
                print("[GPS] No fix available")

            # Wait the configured interval
            for _ in range(self._interval * 2):
                if not self._running:
                    return
                time.sleep(0.5)
