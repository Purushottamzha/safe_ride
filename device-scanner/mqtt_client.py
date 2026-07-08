"""
SafeRide Nepal — MQTT Sync and Heartbeat Publisher

Publishes locally-queued scan and location data to the Mosquitto broker
via MQTT (QoS 1). On successful delivery (broker PUBACK), marks the
local row as synced.

Also publishes periodic heartbeats with battery and storage status.

Topic structure (enforced by Mosquitto ACL):
  saferide/{school_id}/bus/{bus_id}/scan
  saferide/{school_id}/bus/{bus_id}/location
  saferide/{school_id}/bus/{bus_id}/heartbeat
"""

import json
import subprocess
import time
import threading
from datetime import datetime, timezone
from typing import Callable

import paho.mqtt.client as mqtt

from config import Config
from database import ScannerDB


class MqttClient:
    def __init__(self, config: Config, db: ScannerDB):
        self.config = config
        self.db = db
        self._running = False
        self._connected = False
        self._client: mqtt.Client | None = None
        self._sync_thread: threading.Thread | None = None
        self._heartbeat_thread: threading.Thread | None = None
        self._sync_interval = config.sync_interval_seconds
        self._heartbeat_interval = config.heartbeat_interval_seconds
        self._on_connect_callback: Callable[[], None] | None = None

    @property
    def topic_scan(self) -> str:
        return f"saferide/{self.config.school_id}/bus/{self.config.bus_id}/scan"

    @property
    def topic_location(self) -> str:
        return f"saferide/{self.config.school_id}/bus/{self.config.bus_id}/location"

    @property
    def topic_heartbeat(self) -> str:
        return f"saferide/{self.config.school_id}/bus/{self.config.bus_id}/heartbeat"

    def start(self) -> None:
        self._running = True
        self._connect()
        self._sync_thread = threading.Thread(target=self._sync_loop, name="mqtt-sync", daemon=True)
        self._sync_thread.start()
        self._heartbeat_thread = threading.Thread(target=self._heartbeat_loop, name="mqtt-heartbeat", daemon=True)
        self._heartbeat_thread.start()
        print(f"[MQTT] Client started (sync={self._sync_interval}s, heartbeat={self._heartbeat_interval}s)")

    def stop(self) -> None:
        self._running = False
        if self._client:
            self._client.disconnect()
            self._client.loop_stop()
        if self._sync_thread:
            self._sync_thread.join(timeout=10)
        if self._heartbeat_thread:
            self._heartbeat_thread.join(timeout=10)
        print("[MQTT] Client stopped")

    # ── Connection ─────────────────────────────────────────────────────

    def _connect(self) -> None:
        self._client = mqtt.Client(
            client_id=f"scanner_{self.config.device_id}_{int(time.time())}",
            protocol=mqtt.MQTTv311,
        )
        self._client.username_pw_set(
            username=self.config.mqtt_username,
            password=self.config.mqtt_password,
        )

        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_publish = self._on_publish

        # Last Will: if the device disconnects unexpectedly, the broker
        # will publish this retained message so the backend knows
        self._client.will_set(
            self.topic_heartbeat,
            json.dumps({"status": "offline", "deviceId": self.config.device_id}),
            qos=1,
            retain=True,
        )

        try:
            self._client.connect(
                self.config.mqtt_host,
                self.config.mqtt_port,
                keepalive=30,
            )
            self._client.loop_start()
        except Exception as exc:
            print(f"[MQTT] Connection failed: {exc}")

    def _on_connect(self, _client, _userdata, _flags, rc: int) -> None:
        if rc == 0:
            self._connected = True
            print(f"[MQTT] Connected successfully")
            # Publish online status
            self._publish(
                self.topic_heartbeat,
                {"status": "online", "deviceId": self.config.device_id},
                retain=True,
            )
        else:
            self._connected = False
            print(f"[MQTT] Connection refused (rc={rc})")

    def _on_disconnect(self, _client, _userdata, rc: int) -> None:
        self._connected = False
        if rc != 0:
            print(f"[MQTT] Unexpected disconnect (rc={rc})")
        else:
            print("[MQTT] Disconnected")

    def _on_publish(self, _client, _userdata, mid: int) -> None:
        pass  # Handled via callbacks in _publish

    # ── Publish (synchronous wrapper with ack tracking) ────────────────

    def _publish(self, topic: str, payload: dict, retain: bool = False) -> bool:
        """Publish a JSON payload and wait for the broker ack."""
        if self._client is None or not self._connected:
            return False
        try:
            result = self._client.publish(
                topic,
                json.dumps(payload, default=str),
                qos=1,
                retain=retain,
            )
            # Wait for PUBACK (QoS 1) with timeout
            result.wait_for_publish(timeout=5)
            return result.is_published()
        except Exception as exc:
            print(f"[MQTT] Publish failed to {topic}: {exc}")
            return False

    # ── Sync loop ──────────────────────────────────────────────────────

    def _sync_loop(self) -> None:
        while self._running:
            if self._connected:
                self._sync_scans()
                self._sync_locations()
            time.sleep(self._sync_interval)

    def _sync_scans(self) -> None:
        unsynced = self.db.get_unsynced_scans()
        if not unsynced:
            return
        for row in unsynced:
            if not self._running:
                return
            payload = {
                "eventId": row["event_id"],
                "qrToken": row["qr_token"],
                "deviceTimestamp": row["device_timestamp"],
            }
            if row.get("scan_type"):
                payload["scanType"] = row["scan_type"]
            if row.get("trip_id"):
                payload["tripId"] = row["trip_id"]
            if row.get("latitude") is not None:
                payload["latitude"] = row["latitude"]
                payload["longitude"] = row["longitude"]

            if self._publish(self.topic_scan, payload):
                self.db.mark_scan_synced(row["event_id"])
                print(f"[MQTT] Synced scan: {row['event_id'][:8]}...")
            else:
                # Stop this batch on first failure — will retry next cycle
                print(f"[MQTT] Failed to sync scan: {row['event_id'][:8]}...")
                break

    def _sync_locations(self) -> None:
        unsynced = self.db.get_unsynced_locations()
        if not unsynced:
            return
        for row in unsynced:
            if not self._running:
                return
            payload = {
                "eventId": row["event_id"],
                "lat": row["latitude"],
                "lng": row["longitude"],
                "deviceTimestamp": row["device_timestamp"],
            }
            if row.get("speed") is not None:
                payload["speed"] = row["speed"]
            if row.get("accuracy") is not None:
                payload["accuracy"] = row["accuracy"]
            if row.get("heading") is not None:
                payload["heading"] = row["heading"]

            if self._publish(self.topic_location, payload):
                self.db.mark_location_synced(row["event_id"])
                print(f"[MQTT] Synced location: {row['event_id'][:8]}...")
            else:
                break

    # ── Heartbeat loop ─────────────────────────────────────────────────

    def _heartbeat_loop(self) -> None:
        while self._running:
            if self._connected:
                payload = self._get_heartbeat_payload()
                self._publish(self.topic_heartbeat, payload)
            time.sleep(self._heartbeat_interval)

    def _get_heartbeat_payload(self) -> dict:
        payload = {
            "deviceId": self.config.device_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "unsyncedScans": self.db.count_unsynced_scans(),
            "unsyncedLocations": self.db.count_unsynced_locations(),
        }

        # Battery status via termux-battery-status
        try:
            result = subprocess.run(
                ["termux-battery-status"],
                timeout=5,
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                battery = json.loads(result.stdout)
                payload["batteryLevel"] = battery.get("percentage")
                payload["batteryStatus"] = battery.get("status")
                payload["batteryHealth"] = battery.get("health")
        except Exception:
            pass

        # Storage free via termux-disk-usage (if available) or df
        try:
            import os
            stat = os.statvfs("/data")
            free_bytes = stat.f_frsize * stat.f_bavail
            payload["storageFreeBytes"] = free_bytes
            payload["storageFreeGB"] = round(free_bytes / (1024 ** 3), 2)
        except Exception:
            pass

        return payload
