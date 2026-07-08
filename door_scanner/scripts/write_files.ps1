$base = "C:\Users\ASUS\saferide-nepal\door_scanner"
function Write-File($path, $content) {
    $fullPath = Join-Path $base $path
    $dir = Split-Path $fullPath -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($fullPath, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Wrote: $fullPath"
}

