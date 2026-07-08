#!/bin/sh
# SafeRide Nepal — Mosquitto Docker Entrypoint
#
# Manages a persistent credentials store at /mosquitto/auth/credentials.json
# that contains ONLY hashed passwords — no plaintext ever persisted to disk.
#
# On first start (no credentials.json): reads static credentials from env
# vars, hashes them with mosquitto_passwd, writes only the hashes to
# credentials.json, and generates passwd + ACL files.
#
# On subsequent starts: reads hashes from credentials.json and writes them
# directly to the passwd file (no re-hashing needed).
#
# Background inotifywatcher: detects changes to credentials.json from the
# backend's provision/revoke/rotate endpoints, regenerates passwd + ACL,
# and sends SIGHUP to mosquitto for live reload.

set -e

AUTH_DIR="/mosquitto/auth"
CREDENTIALS_FILE="$AUTH_DIR/credentials.json"
PASSWD_FILE="/mosquitto/config/passwd"
ACL_FILE="/mosquitto/config/acl"
TEMP_PASSWD="/tmp/_mosquitto_passwd_init"

# ---- Helpers ----
write_passwd_entry() {
  local username="$1"
  local hash="$2"
  echo "${username}:${hash}" >> "$PASSWD_FILE"
}

# ---- Initialise credentials store on first start ----
if [ ! -f "$CREDENTIALS_FILE" ]; then
  mkdir -p "$AUTH_DIR"

  > "$TEMP_PASSWD"

  # Hash static user passwords from env vars
  mosquitto_passwd -b "$TEMP_PASSWD" "${MQTT_USERNAME:-saferide-backend}" "${MQTT_PASSWORD:?}"
  mosquitto_passwd -b "$TEMP_PASSWD" "saferide-health" "${MOSQUITTO_PASSWORD:?}"

  # Extract hashes from the temp passwd file
  BACKEND_HASH=$(grep "^${MQTT_USERNAME:-saferide-backend}:" "$TEMP_PASSWD" | cut -d: -f2)
  HEALTH_HASH=$(grep "^saferide-health:" "$TEMP_PASSWD" | cut -d: -f2)

  rm -f "$TEMP_PASSWD"

  cat > "$CREDENTIALS_FILE" <<EOF
{
  "users": [
    { "username": "${MQTT_USERNAME:-saferide-backend}", "passwordHash": "${BACKEND_HASH}" },
    { "username": "saferide-health", "passwordHash": "${HEALTH_HASH}" }
  ],
  "devices": []
}
EOF
  chmod 644 "$CREDENTIALS_FILE"
  echo "Initialised credentials.json from environment (plaintext already hashed, never stored)"
fi

# ---- Generate passwd + ACL from credentials.json ----
generate() {
  echo "Generating passwd and ACL from credentials.json..."

  > "$PASSWD_FILE"
  > "$ACL_FILE"

  if ! command -v jq >/dev/null 2>&1; then
    echo "ERROR: jq is required but not installed" >&2
    exit 1
  fi

  # --- Passwd file ---
  # Static users (pre-hashed)
  local user_count
  user_count=$(jq '.users | length' "$CREDENTIALS_FILE")
  i=0
  while [ "$i" -lt "$user_count" ]; do
    local u_name u_hash
    u_name=$(jq -r ".users[$i].username" "$CREDENTIALS_FILE")
    u_hash=$(jq -r ".users[$i].passwordHash" "$CREDENTIALS_FILE")
    write_passwd_entry "$u_name" "$u_hash"
    i=$((i + 1))
  done

  # Device credentials (pre-hashed by backend)
  local device_count
  device_count=$(jq '.devices | length' "$CREDENTIALS_FILE")
  i=0
  while [ "$i" -lt "$device_count" ]; do
    local dev_id dev_hash
    dev_id=$(jq -r ".devices[$i].deviceId" "$CREDENTIALS_FILE")
    dev_hash=$(jq -r ".devices[$i].passwordHash" "$CREDENTIALS_FILE")
    write_passwd_entry "device_$dev_id" "$dev_hash"
    i=$((i + 1))
  done

  echo "passwd file generated: $(wc -l < "$PASSWD_FILE") entries"

  # --- ACL file ---
  cat > "$ACL_FILE" << 'ACLHEADER'
# SafeRide Nepal — Auto-generated Mosquitto ACL
# DO NOT EDIT MANUALLY. Changes are overwritten from credentials.json.

# Backend subscriber: can read all saferide/ topics
user saferide-backend
topic read saferide/#

# Health monitor: can read $$SYS topics
user saferide-health
topic read $$

ACLHEADER

  local device_count
  device_count=$(jq '.devices | length' "$CREDENTIALS_FILE")
  i=0
  while [ "$i" -lt "$device_count" ]; do
    local dev_id school_id bus_id
    dev_id=$(jq -r ".devices[$i].deviceId" "$CREDENTIALS_FILE")
    school_id=$(jq -r ".devices[$i].schoolId" "$CREDENTIALS_FILE")
    bus_id=$(jq -r ".devices[$i].busId" "$CREDENTIALS_FILE")

    cat >> "$ACL_FILE" << ACLENTRY
# Device: $dev_id (school=$school_id, bus=$bus_id)
user device_$dev_id
topic write saferide/$school_id/bus/$bus_id/scan
topic write saferide/$school_id/bus/$bus_id/location
topic write saferide/$school_id/bus/$bus_id/heartbeat

ACLENTRY
    i=$((i + 1))
  done

  echo "ACL file generated: $(wc -l < "$ACL_FILE") lines"
}

generate

# ---- Background reload watcher ----
# Watches for changes to credentials.json (atomic renames from backend) and
# regenerates passwd + ACL, then sends SIGHUP to reload config live.
# Mosquitto 2.x SIGHUP reloads both password_file and acl_file.
if command -v inotifywait >/dev/null 2>&1; then
  inotifywait -m -e close_write,moved_to "$AUTH_DIR" 2>/dev/null | while read -r dir events file; do
    if [ "$file" = "credentials.json" ]; then
      echo "credentials.json changed — regenerating passwd + ACL and reloading..."
      generate
      kill -HUP 1 2>/dev/null || true
    fi
  done &
  echo "Background reload watcher started (inotify)"
else
  echo "WARNING: inotifywait not available — live reload disabled. Restart container to apply credential changes."
fi

exec "$@"
