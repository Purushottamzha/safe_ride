#!/data/data/com.termux/files/usr/bin/bash
# SafeRide Nepal — Door-Scanner Device Setup Script
#
# Run this ONCE on the Android phone via Termux to install all
# dependencies and set up the scanner environment.
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
#
# Prerequisites (installed from F-Droid, not Play Store):
#   1. Termux
#   2. Termux:Boot (for auto-start on boot)
#   3. Termux:API (for camera/GPS/battery/vibration access)

set -e

echo "========================================="
echo "SafeRide Nepal — Door-Scanner Setup"
echo "========================================="

SCANNER_DIR="$HOME/.saferide"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Step 1: Grant storage permissions (needed for camera-photo fallback)
echo ""
echo "[1/5] Granting storage permissions..."
termux-setup-storage 2>/dev/null || true

# Step 2: Install system packages
echo ""
echo "[2/5] Installing system packages..."
pkg update -y
pkg upgrade -y
pkg install -y python termux-api opencv-python-headless 2>/dev/null || {
    # Fallback if opencv-python-headless isn't in the default repo
    pip install opencv-python-headless
}

# Step 3: Install Python dependencies
echo ""
echo "[3/5] Installing Python dependencies..."
pip install paho-mqtt pyzbar

# Step 4: Copy scanner files
echo ""
echo "[4/5] Setting up scanner files..."
mkdir -p "$SCANNER_DIR"

# Copy Python modules
cp "$SCRIPT_DIR/main.py" "$SCANNER_DIR/"
cp "$SCRIPT_DIR/config.py" "$SCANNER_DIR/"
cp "$SCRIPT_DIR/database.py" "$SCANNER_DIR/"
cp "$SCRIPT_DIR/camera.py" "$SCANNER_DIR/"
cp "$SCRIPT_DIR/gps.py" "$SCANNER_DIR/"
cp "$SCRIPT_DIR/mqtt_client.py" "$SCANNER_DIR/"
cp "$SCRIPT_DIR/config.json.template" "$SCANNER_DIR/"

# Set up Termux:Boot launcher
BOOT_DIR="$HOME/.termux/boot"
mkdir -p "$BOOT_DIR"
cp "$SCRIPT_DIR/boot.sh" "$BOOT_DIR/saferide-scanner.sh"
chmod +x "$BOOT_DIR/saferide-scanner.sh"

echo ""
echo "[5/5] Setup complete!"
echo "========================================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Configure device credentials:"
echo "   nano $SCANNER_DIR/config.json.template"
echo "   # Fill in device_id, school_id, bus_id, MQTT credentials"
echo "   # from the backend admin API (POST /api/v1/devices/:id/mqtt-credentials)"
echo "   mv $SCANNER_DIR/config.json.template $SCANNER_DIR/config.json"
echo "   chmod 600 $SCANNER_DIR/config.json"
echo ""
echo "2. Test the scanner manually:"
echo "   cd $SCANNER_DIR"
echo "   python3 main.py"
echo ""
echo "3. Reboot to test auto-start:"
echo "   termux-reload-settings"
echo "   reboot"
echo ""
echo "4. Check logs after reboot:"
echo "   tail -f $SCANNER_DIR/scanner.log"
echo ""
echo "========================================="
