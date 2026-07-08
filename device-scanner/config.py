"""
SafeRide Nepal — Door-Scanner Device Configuration Loader

Loads device identity and MQTT credentials from a local JSON config file.
This file contains secrets and must NOT be world-readable.

Config file location: ~/.saferide/config.json (default)
"""

import json
import os
import sys

DEFAULT_CONFIG_PATH = os.path.expanduser("~/.saferide/config.json")


class Config:
    def __init__(self, path: str | None = None):
        self.path = path or DEFAULT_CONFIG_PATH
        self._data: dict = {}
        self._load()

    def _load(self) -> None:
        if not os.path.exists(self.path):
            print(f"[CONFIG] ERROR: Config file not found at {self.path}", file=sys.stderr)
            print(f"[CONFIG] Create one using the template at config.json.template", file=sys.stderr)
            sys.exit(1)

        # Check permissions — warn if world-readable on a Unix-like filesystem
        # Termux runs on Linux (Android), so this check applies
        mode = os.stat(self.path).st_mode
        if mode & 0o007:
            print(f"[CONFIG] WARNING: {self.path} is world-readable (mode {oct(mode & 0o777)})", file=sys.stderr)
            print(f"[CONFIG] Run: chmod 600 {self.path}", file=sys.stderr)

        with open(self.path, "r") as f:
            self._data = json.load(f)

        self._validate()

    def _validate(self) -> None:
        required = ["device_id", "school_id", "bus_id", "mqtt"]
        for key in required:
            if key not in self._data:
                print(f"[CONFIG] ERROR: Missing required key '{key}' in {self.path}", file=sys.stderr)
                sys.exit(1)

        mqtt_required = ["host", "port", "username", "password"]
        for key in mqtt_required:
            if key not in self._data["mqtt"]:
                print(f"[CONFIG] ERROR: Missing required MQTT key '{key}' in {self.path}", file=sys.stderr)
                sys.exit(1)

    @property
    def device_id(self) -> str:
        return str(self._data["device_id"])

    @property
    def school_id(self) -> str:
        return str(self._data["school_id"])

    @property
    def bus_id(self) -> str:
        return str(self._data["bus_id"])

    @property
    def mqtt_host(self) -> str:
        return str(self._data["mqtt"]["host"])

    @property
    def mqtt_port(self) -> int:
        return int(self._data["mqtt"]["port"])

    @property
    def mqtt_username(self) -> str:
        return str(self._data["mqtt"]["username"])

    @property
    def mqtt_password(self) -> str:
        return str(self._data["mqtt"]["password"])

    @property
    def gps_interval_seconds(self) -> int:
        return int(self._data.get("gps_interval_seconds", 10))

    @property
    def sync_interval_seconds(self) -> int:
        return int(self._data.get("sync_interval_seconds", 15))

    @property
    def heartbeat_interval_seconds(self) -> int:
        return int(self._data.get("heartbeat_interval_seconds", 60))

    @property
    def scan_debounce_seconds(self) -> int:
        return int(self._data.get("scan_debounce_seconds", 10))

    @property
    def db_path(self) -> str:
        return os.path.expanduser(str(self._data.get("db_path", "~/.saferide/scanner.db")))

    @property
    def camera_device(self) -> int:
        return int(self._data.get("camera_device", 0))

    @property
    def camera_preview(self) -> bool:
        return bool(self._data.get("camera_preview", False))

    def __repr__(self) -> str:
        return (
            f"Config(device_id={self.device_id}, school_id={self.school_id}, "
            f"bus_id={self.bus_id}, mqtt_host={self.mqtt_host})"
        )
