Write-Host "=== SafeRide Nepal Docker Fix ===" -ForegroundColor Cyan

Write-Host "[1/4] Enabling required Windows features..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart

Write-Host "[2/4] Setting WSL2 as default..." -ForegroundColor Yellow
wsl --set-default-version 2

Write-Host "[3/4] Restarting Docker service..." -ForegroundColor Yellow
Stop-Service com.docker.service -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Service com.docker.service

Write-Host "[4/4] Starting Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 30

docker ps
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker is working!" -ForegroundColor Green
} else {
    Write-Host "Docker may need a system restart. Please restart your computer and try again." -ForegroundColor Red
}
