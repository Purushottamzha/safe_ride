# SafeRide Nepal Database Backup Script for Windows
$BackupDir = ".\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

Write-Host "Starting database backup..." -ForegroundColor Yellow

docker compose exec -T postgres pg_dump -U saferide saferide | gzip > "$BackupDir\saferide_backup_$Timestamp.sql.gz"

Write-Host "Backup completed: $BackupDir\saferide_backup_$Timestamp.sql.gz" -ForegroundColor Green

# Keep only last 30 backups
Get-ChildItem -Path "$BackupDir" -Filter "saferide_backup_*.sql.gz" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force
