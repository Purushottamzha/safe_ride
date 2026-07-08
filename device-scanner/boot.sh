#!/data/data/com.termux/files/usr/bin/bash
# SafeRide Nepal — Termux:Boot Launcher
#
# Place this file at ~/.termux/boot/saferide-scanner.sh
# It is executed automatically when the Android device boots
# (requires Termux:Boot from F-Droid installed).
#
# Supervisor loop with crash backoff:
#   - Always sleeps 2s minimum between restarts — never an instant restart loop
#   - Tracks runtime: a script that ran for 5+ minutes before dying is not
#     "crashing" — it won't increment the crash counter
#   - After 5 fast crashes in a row, backs off to 60s to prevent battery drain
#     and log flooding while still recovering automatically when the issue clears

# Stop any previously running instance
pkill -f "python.*main.py" 2>/dev/null || true

SCANNER_DIR="$HOME/.saferide"
MAIN_SCRIPT="$SCANNER_DIR/main.py"
LOG_FILE="$SCANNER_DIR/scanner.log"
CONFIG_FILE="$SCANNER_DIR/config.json"

mkdir -p "$SCANNER_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
    echo "$*"
}

log "SafeRide scanner boot launcher starting"

if [ ! -f "$MAIN_SCRIPT" ]; then
    log "ERROR: main.py not found at $MAIN_SCRIPT"
    log "Copy device-scanner/ contents to $SCANNER_DIR and re-run"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    log "ERROR: config.json not found at $CONFIG_FILE"
    log "Create it from config.json.template with your device credentials"
    exit 1
fi

cd "$SCANNER_DIR"

# Acquire wake lock for the boot session
termux-wake-lock ss-boot 2>/dev/null || true

CRASH_COUNT=0
CRASH_WINDOW_RESET_SECONDS=300

while true; do
    START_TIME=$(date +%s)

    log "Starting scanner..."
    python3 main.py "$CONFIG_FILE" >> "$LOG_FILE" 2>&1
    EXIT_CODE=$?

    RUNTIME=$(( $(date +%s) - START_TIME ))

    # If it ran for a reasonable while, reset the crash counter
    if [ "$RUNTIME" -ge "$CRASH_WINDOW_RESET_SECONDS" ]; then
        CRASH_COUNT=0
    else
        CRASH_COUNT=$((CRASH_COUNT + 1))
    fi

    log "main.py exited (code=$EXIT_CODE, ran=${RUNTIME}s, crash_count=$CRASH_COUNT)"

    # Check for expected exits — don't restart
    if [ "$EXIT_CODE" -eq 0 ] || [ "$EXIT_CODE" -eq 130 ] || [ "$EXIT_CODE" -eq 143 ]; then
        log "Normal exit — supervisor stopping"
        break
    fi

    # Always sleep at least 2s — never instant-restart
    sleep 2

    # Escalate backoff if crash-looping
    if [ "$CRASH_COUNT" -ge 5 ]; then
        log "Repeated fast crashes — backing off 60s"
        sleep 60
    fi
done

termux-wake-unlock ss-boot 2>/dev/null || true
log "Boot launcher finished"
