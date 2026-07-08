"""
SafeRide Nepal — QR Scan Loop

Captures photos via termux-camera-photo (Android Camera2 API through
Termux:API — the only reliable camera path on non-rooted Termux),
decodes QR codes with pyzbar, writes to local SQLite, and provides
haptic feedback on successful scan.

IMPORTANT: On non-rooted Android, OpenCV VideoCapture(0) does NOT
work — Android does not expose the camera as a V4L2 device in Termux.
termux-camera-photo is the primary path, not a fallback.

Latency expectation: each capture-decode cycle takes ~1-3 seconds.
Design the debounce window and student experience around this.

Debounce: the same QR token is ignored for scan_debounce_seconds
to avoid duplicate rows from a student holding their card in frame.
"""

import json
import subprocess
import tempfile
import time
import threading
from pathlib import Path

import cv2
import numpy as np
from pyzbar.pyzbar import decode as qr_decode, ZBarSymbol

from config import Config
from database import ScannerDB


class CameraScanner:
    def __init__(self, config: Config, db: ScannerDB):
        self.config = config
        self.db = db
        self._running = False
        self._thread: threading.Thread | None = None
        self._debounce: dict[str, float] = {}
        self._debounce_sec = config.scan_debounce_seconds
        self._camera_index = config.camera_device

    def start(self) -> None:
        self._running = True
        self._thread = threading.Thread(target=self._loop, name="camera-scan", daemon=True)
        self._thread.start()
        print("[CAMERA] Scan loop started (primary path: termux-camera-photo)")

    def stop(self) -> None:
        self._running = False
        if self._thread:
            self._thread.join(timeout=10)
        print("[CAMERA] Scan loop stopped")

    def _is_debounced(self, qr_token: str) -> bool:
        now = time.time()
        last = self._debounce.get(qr_token, 0)
        if now - last < self._debounce_sec:
            return True
        self._debounce[qr_token] = now
        # Expire old entries
        cutoff = now - self._debounce_sec * 2
        for token in list(self._debounce.keys()):
            if self._debounce[token] < cutoff:
                del self._debounce[token]
        return False

    def _vibrate(self) -> None:
        try:
            subprocess.run(
                ["termux-vibrate", "-d", "200"],
                timeout=3,
                capture_output=True,
            )
        except Exception:
            pass

    def _capture_photo(self) -> np.ndarray | None:
        """Capture a single photo via termux-camera-photo.
        This is the primary (and usually only working) camera path
        on non-rooted Termux."""
        try:
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                tmp_path = tmp.name
            result = subprocess.run(
                ["termux-camera-photo", "-c", str(self._camera_index), tmp_path],
                timeout=15,
                capture_output=True,
            )
            if result.returncode != 0:
                print(f"[CAMERA] termux-camera-photo exited {result.returncode}: {result.stderr.decode(errors='replace').strip()}")
                Path(tmp_path).unlink(missing_ok=True)
                return None
            frame = cv2.imread(tmp_path)
            Path(tmp_path).unlink(missing_ok=True)
            if frame is None:
                print("[CAMERA] termux-camera-photo produced an unreadable image")
            return frame
        except subprocess.TimeoutExpired:
            print("[CAMERA] termux-camera-photo timed out")
            Path(tmp_path).unlink(missing_ok=True)
            return None
        except FileNotFoundError:
            print("[CAMERA] termux-camera-photo not found — install termux-api")
            return None
        except Exception as exc:
            print(f"[CAMERA] termux-camera-photo error: {exc}")
            return None

    def _decode_qr(self, frame: np.ndarray) -> list[str]:
        """Decode QR codes from an image frame."""
        tokens: list[str] = []
        try:
            decoded = qr_decode(frame, symbols=[ZBarSymbol.QRCODE])
            for obj in decoded:
                token = obj.data.decode("utf-8").strip()
                if token:
                    tokens.append(token)
        except Exception as exc:
            print(f"[CAMERA] QR decode error: {exc}")
        return tokens

    def _get_current_location(self) -> tuple[float | None, float | None]:
        try:
            result = subprocess.run(
                ["termux-location", "-p", "once"],
                timeout=5,
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return (data.get("latitude"), data.get("longitude"))
        except Exception:
            pass
        return (None, None)

    # ── Main loop ──────────────────────────────────────────────────────

    def _loop(self) -> None:
        while self._running:
            frame = self._capture_photo()
            if frame is None:
                # Photo capture failed — wait before retrying
                time.sleep(1)
                continue

            tokens = self._decode_qr(frame)

            for token in tokens:
                if self._is_debounced(token):
                    continue

                lat, lng = self._get_current_location()
                event_id = self.db.insert_scan(
                    qr_token=token,
                    latitude=lat,
                    longitude=lng,
                )
                self._vibrate()
                print(f"[CAMERA] Scanned: token={token[:16]}... event_id={event_id}")
