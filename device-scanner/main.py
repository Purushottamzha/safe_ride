#!/usr/bin/env python3
"""
SafeRide Nepal — Door-Scanner Device Supervisor

The single entry point that starts and coordinates all device subsystems:
  - Camera QR scan loop
  - GPS polling loop
  - MQTT sync + heartbeat publisher

All loops run concurrently. If any critical subsystem fails, the
supervisor logs the error and continues running others.

Run this script via the Termux:Boot launcher (boot.sh) for unattended
startup on device boot.
"""

import signal
import sys
import time

from config import Config
from database import ScannerDB
from camera import CameraScanner
from gps import GPSLoop
from mqtt_client import MqttClient


def main() -> None:
    print("=" * 50)
    print("SafeRide Nepal — Door-Scanner Device")
    print("=" * 50)

    # Load configuration
    config_path = sys.argv[1] if len(sys.argv) > 1 else None
    config = Config(config_path)
    print(f"[MAIN] Loaded config: {config}")

    # Initialise local database
    db = ScannerDB(config.db_path)
    print(f"[MAIN] Database at: {config.db_path}")

    # Start subsystems
    camera = CameraScanner(config, db)
    gps = GPSLoop(config, db)
    mqtt_client = MqttClient(config, db)

    # Acquire wake lock so Android doesn't suspend the process
    _acquire_wake_lock()

    camera.start()
    gps.start()
    mqtt_client.start()

    print("[MAIN] All subsystems started. Running...")

    # Set up graceful shutdown
    shutdown_requested = False

    def handle_signal(signum: int, _frame) -> None:
        nonlocal shutdown_requested
        if shutdown_requested:
            print("[MAIN] Forced exit")
            sys.exit(1)
        shutdown_requested = True
        print(f"[MAIN] Signal {signum} received — shutting down...")
        camera.stop()
        gps.stop()
        mqtt_client.stop()
        _release_wake_lock()
        print("[MAIN] Shutdown complete")
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
            # Periodic maintenance: purge old synced rows daily
            # (purge at most once per hour to be safe on battery)
            now = time.time()
            if not hasattr(main, "_last_purge") or now - main._last_purge > 3600:  # type: ignore[attr-defined]
                db.purge_synced_rows(older_than_hours=24)
                main._last_purge = now  # type: ignore[attr-defined]
    except KeyboardInterrupt:
        handle_signal(signal.SIGINT, None)


def _acquire_wake_lock() -> None:
    """Acquire Termux wake lock to prevent Android from suspending the script."""
    try:
        import subprocess
        subprocess.run(["termux-wake-lock", "ss"], timeout=5, capture_output=True)
        print("[MAIN] Wake lock acquired")
    except Exception as exc:
        print(f"[MAIN] WARNING: Could not acquire wake lock: {exc}")
        print("[MAIN] The device may suspend the scanner during idle periods")


def _release_wake_lock() -> None:
    """Release the Termux wake lock."""
    try:
        import subprocess
        subprocess.run(["termux-wake-unlock", "ss"], timeout=5, capture_output=True)
    except Exception:
        pass


if __name__ == "__main__":
    main()
