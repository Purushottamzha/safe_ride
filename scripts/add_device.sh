#!/bin/bash
set -e
touch /tmp/pw
mosquitto_passwd -b /tmp/pw device_bus001 "${DEVICE_BUS001_PASSWORD:-change-me-before-use}" 2>/dev/null
hash=$(awk -F: '{print $2}' /tmp/pw)
rm -f /tmp/pw

jq --arg h "$hash" '.devices += [{"deviceId":"bus001-device","schoolId":"ba43ebb0-a4d9-4185-a1e1-292048ee0bec","busId":"e6e2815f-2b3b-4443-92d8-45acd13f8ca8","passwordHash": $h}]' /mosquitto/auth/credentials.json > /tmp/creds.json
mv /tmp/creds.json /mosquitto/auth/credentials.json
echo "Device added successfully"
