# Device Registry

Each physical scanner (webcam laptop, ESP32-CAM, ESP32-GPS) must be registered in the
Device table before it can call `POST /hardware/qr-scan`. The shared static
`DEVICE_API_KEY` env var from the demo phase is **no longer used**.

## How to register a new device

1. Log into the Admin Portal as SUPER_ADMIN or SCHOOL_ADMIN.
2. Navigate to **Devices** in the sidebar.
3. Click **Register Device**, fill in:
   - **Name** — human-readable label (e.g. "Gate 1 - Main Entrance")
   - **Type** — `WEBCAM_DEMO`, `ESP32_CAM`, or `ESP32_GPS`
   - **Firmware Version** — optional version string
4. Click **Register**.
5. **Copy the API key immediately** — it is shown once and never stored in plaintext
   (only a SHA-256 hash is persisted).
6. Configure the device to send the key in the `x-device-api-key` header on every request.

## Switching from webcam demo to ESP32-CAM

No backend code changes are needed:

1. Register the ESP32-CAM as a new Device (type=`ESP32_CAM`) via the admin UI.
2. Program the ESP32-CAM to send the same payload shape to `POST /hardware/qr-scan`:
   ```json
   {
     "deviceId": "<device-uuid>",
     "busId": "<bus-uuid>",
     "qrToken": "<scanned-qr-token>",
     "capturedAt": "<ISO-8601-timestamp>",
     "imageBase64": "<optional-base64-snapshot>"
   }
   ```
3. Include headers: `x-device-api-key: <the-api-key>` and `Content-Type: application/json`.
4. The endpoint determines `scanType` (BOARD_IN vs EXIT_OUT) from the trip status
   automatically — the device never needs to specify the direction.

## API key rotation

If a device's API key is compromised or needs rotation:

1. Go to **Devices** > find the device > click the key icon.
2. Confirm the rotation.
3. The old key is **immediately invalidated**.
4. Copy the new key and update the device configuration.

## Security notes

- API keys are stored as SHA-256 hashes only.
- The `lastSeenAt` field is updated on every successful API call.
- Deactivate a device by setting its status to `INACTIVE` — all further calls are
  rejected by `DeviceApiKeyGuard`.

---

## Data Retention & Parental Consent (Group C — internal demo phase)

**TODO before production:** SafeRide stores children's:
- Names, dates of birth, grade/section
- Photographs (profile pictures, camera-captured images via `imageBase64`)
- QR-linked identity tokens (personally identifiable by design)
- Attendance records (timestamp, GPS coordinates of scan events)

This data is subject to:
- **Children's Online Privacy Protection Act (COPPA)** / equivalent local law
- **GDPR** (if EU parents) / **PDPA** (Nepal's pending privacy framework)

**Required actions before any non-demo deployment:**

1. Capture explicit parental consent at the point of student registration (checkbox +
   timestamped record stored alongside `PendingStudentRequest`).
2. Define a **data retention schedule** in consultation with legal counsel:
   - Recommended: purge student photos 30 days after the student leaves the school.
   - Archive attendance records after 1 year.
   - QR tokens are already time-bound by `qrExpiresAt` (end of academic term).
3. Add a privacy notice / consent checkbox to the parent-web registration form.
4. Audit all `imageBase64` fields in `TripEvent` and `PendingStudentRequest` — these
   should never be stored longer than necessary; consider discard-on-read or
   ephemeral processing.

**For the current internal demo:** these considerations are flagged but not enforced.
The codebase does not yet implement consent capture or automated purging.
