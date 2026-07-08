#!/bin/bash
# SafeRide Nepal — OSRM Data Preparation Script
#
# PRE-REQUISITES:
#   - Docker (any local Docker install is sufficient; the OSRM image
#     handles the actual processing)
#   - ~8GB free disk space for the Nepal OSM extract + processing files
#
# USAGE:
#   bash scripts/prepare-osrm-data.sh              # safe re-run, skips if already done
#   bash scripts/prepare-osrm-data.sh --force       # force re-processing from scratch
#
# SAFETY:
#   By default, if the processed .osrm routing graph files already exist
#   and are non-empty, this script skips re-processing and exits early.
#   Use --force to explicitly re-download and re-process everything.
#
# WHAT THIS DOES:
#   1. Downloads the latest Nepal OSM extract from Geofabrik
#      (a `.osm.pbf` file, typically ~15-30MB for Nepal)
#   2. Runs osrm-extract, osrm-partition, and osrm-customize
#      inside the official osrm/osrm-backend Docker image
#   3. Writes the output routing graph files to ./docker/osrm/data/
#      which is bind-mounted into the osrm container at runtime
#
# WHY THIS IS A SEPARATE SCRIPT:
#   OSRM's data preparation step (extract -> partition -> customize)
#   is a one-time (or occasional) offline process that takes 5-30 minutes
#   depending on CPU/memory. It cannot be done at `docker compose up`
#   time without unacceptable startup delays. Run this once before
#   starting the osrm service, and re-run only when you want to refresh
#   the OSM data (e.g., quarterly or when road network changes matter).
#
# OUTPUT:
#   ./docker/osrm/data/  <- contains nepal-latest.osrm.* routing files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OSRM_DATA_DIR="$PROJECT_DIR/docker/osrm/data"
OSRM_IMAGE="osrm/osrm-backend:v5.27.1"
OSM_EXTRACT_URL="https://download.geofabrik.de/asia/nepal-latest.osm.pbf"
OSM_PBF="$OSRM_DATA_DIR/nepal-latest.osm.pbf"
OSRM_GRAPH="$OSRM_DATA_DIR/nepal-latest.osrm"
FORCE=false

# Colours
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --force|-f) FORCE=true ;;
    *) error "Unknown argument: $arg. Usage: $0 [--force]" ;;
  esac
done

# ---- Safety check: skip if already processed ----
if [ -f "$OSRM_GRAPH" ] && [ -s "$OSRM_GRAPH" ] && [ "$FORCE" = false ]; then
  info "OSRM routing graph already exists at $OSRM_GRAPH"
  info "Skipping re-processing. Use --force to re-download and re-process."
  info ""
  info "Routing files in: $OSRM_DATA_DIR"
  ls -lh "$OSRM_GRAPH"*
  exit 0
fi

if [ "$FORCE" = true ]; then
  warn "Force mode enabled — will re-download and re-process everything"
fi

# Ensure the output directory exists
mkdir -p "$OSRM_DATA_DIR"

info "OSRM data directory: $OSRM_DATA_DIR"
info "OSRM image: $OSRM_IMAGE"

# Pull the OSRM image (idempotent)
info "Pulling OSRM Docker image..."
docker pull "$OSRM_IMAGE"

# Download the Nepal OSM extract if not already present (or force)
if [ -f "$OSM_PBF" ] && [ "$FORCE" = false ]; then
  warn "$(basename "$OSM_PBF") already exists — skipping download."
else
  if [ "$FORCE" = true ] && [ -f "$OSM_PBF" ]; then
    info "Removing old OSM extract for force re-download..."
    rm -f "$OSM_PBF"
  fi
  info "Downloading Nepal OSM extract from Geofabrik..."
  curl -L -o "$OSM_PBF" "$OSM_EXTRACT_URL"
  info "Download complete: $(ls -lh "$OSM_PBF" | awk '{print $5}')"
fi

# Step 1: osrm-extract
info "Step 1/3: osrm-extract (this may take 5-15 minutes)..."
docker run --rm \
  -v "$OSRM_DATA_DIR:/data" \
  "$OSRM_IMAGE" \
  osrm-extract -p /opt/car.lua /data/nepal-latest.osm.pbf

# Step 2: osrm-partition
info "Step 2/3: osrm-partition..."
docker run --rm \
  -v "$OSRM_DATA_DIR:/data" \
  "$OSRM_IMAGE" \
  osrm-partition /data/nepal-latest.osrm

# Step 3: osrm-customize
info "Step 3/3: osrm-customize..."
docker run --rm \
  -v "$OSRM_DATA_DIR:/data" \
  "$OSRM_IMAGE" \
  osrm-customize /data/nepal-latest.osrm

info "OSRM data preparation complete!"
info "Routing files are in: $OSRM_DATA_DIR"
ls -lh "$OSRM_GRAPH"*
info ""
info "You can now start the OSRM service with:"
info "  docker compose up -d osrm"
info ""
info "Test the routing engine:"
info '  curl "http://localhost:5000/route/v1/driving/85.3240,27.7172;85.3260,27.7142?steps=true"'
