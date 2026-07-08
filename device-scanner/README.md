# SafeRide Nepal — Door-Scanner Device

Android phone (via Termux) mounted at a bus door that scans student QR codes, captures GPS, queues everything locally in SQLite, and syncs to the backend over MQTT.

## Prerequisites

Install these from **F-Droid** (NOT the Play Store — Play Store Termux is outdated):

1. [Termux](https://f-droid.org/packages/com.termux/)
2. [Termux:Boot](https://f-droid.org/packages/com.termux.boot/) — auto-launch on boot
3. [Termux:API](https://f-droid.org/packages/com.termux.api/) — GPS, camera, battery, vibration access

## Quick Install

```bash
# On the Android phone in Termux:
git clone https://github.com/Purushottamzha/safe_ride.git
cd safe_ride/device-scanner
chmod +x setup.sh
./setup.sh
```

## Configuration

After setup, configure the device:

```bash
nano ~/.saferide/config.json.template
```

Fill in the values from the backend admin API:

| Field | Source |
|-------|--------|
| `device_id` | Device UUID from the backend device registry |
| `school_id` | School UUID assigned to this device |
| `bus_id` | Bus UUID assigned to this device |
| `mqtt.username` | From `POST /api/v1/devices/:id/mqtt-credentials` |
| `mqtt.password` | From `POST /api/v1/devices/:id/mqtt-credentials` |
| `mqtt.host` | VPS IP or hostname of the Mosquitto broker |

```bash
mv ~/.saferide/config.json.template ~/.saferide/config.json
chmod 600 ~/.saferide/config.json
```

## Manual Test

```bash
cd ~/.saferide
python3 main.py
```

## Unattended Operation

Reboot the phone:

```bash
termux-reload-settings
reboot
```

After boot, check the log:

```bash
tail -f ~/.saferide/scanner.log
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Android Phone (at bus door)                        │
│  ┌─────────────┐   ┌──────────┐   ┌──────────────┐ │
│  │ Camera QR   │   │ GPS      │   │ MQTT Sync    │ │
│  │ Scan Loop   │   │ Poll     │   │ + Heartbeat  │ │
│  └──────┬──────┘   └────┬─────┘   └──────┬───────┘ │
│         │               │                │          │
│         ▼               ▼                │          │
│  ┌───────────────────────────────────────┘          │
│  │  Local SQLite (WAL mode)                        │
│  │  - scan_events (synced=false until acked)       │
│  │  - location_pings (synced=false until acked)    │
│  └──────────────────────────────────────────────────│
│         │                                            │
│         │ MQTT (QoS 1)                               │
│         ▼                                            │
│  Mosquitto Broker ──► Backend MqttService           │
└─────────────────────────────────────────────────────┘
```

## Validation Sequence

Run these in order before deploying to a real bus:

| # | Test | Pass Criteria |
|---|------|---------------|
| 1 | Bench test indoors | Scan printed QR codes → rows appear in SQLite with `synced=0` |
| 2 | Connectivity test | Rows sync and flip to `synced=1`; Attendance row appears in Postgres |
| 3 | Airplane-mode test | Enable airplane mode, scan → rows queue locally, stay `synced=0` |
| 4 | Reconnect test | Disable airplane mode → queued rows sync within one cycle |
| 5 | Reboot test | Force-reboot → Termux:Boot relaunches scanner, unsynced rows intact |
| 6 | Duplicate test | Re-publish synced event → no duplicate Attendance (ConflictException logged) |
| 7 | Real route test | Mount on bus, run real trip → data syncs through dead zones |
| 8 | Full-day power test | Two-trip school day → no unexpected shutdown, battery adequate |
