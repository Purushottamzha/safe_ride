#!/bin/bash
# SafeRide Nepal Database Backup Script
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."

docker compose exec -T postgres pg_dump -U saferide saferide | gzip > "$BACKUP_DIR/saferide_backup_$TIMESTAMP.sql.gz"

echo "Backup completed: $BACKUP_DIR/saferide_backup_$TIMESTAMP.sql.gz"

# Keep only last 30 backups
find "$BACKUP_DIR" -name "saferide_backup_*.sql.gz" -mtime +30 -delete
