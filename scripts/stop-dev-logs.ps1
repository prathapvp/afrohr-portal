$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logsRoot = Join-Path $root "logs"
$latestPath = Join-Path $logsRoot "latest-session.txt"

if (-not (Test-Path $latestPath)) {
    Write-Host "No latest logging session file found: $latestPath"
    exit 0
}

$sessionDir = (Get-Content -Path $latestPath -Raw).Trim()
$metaPath = Join-Path $sessionDir "session.json"

if (-not (Test-Path $metaPath)) {
    Write-Host "No session metadata found: $metaPath"
    exit 0
}

$meta = Get-Content -Path $metaPath -Raw | ConvertFrom-Json
$pids = @($meta.backendPid, $meta.frontendPid) | Where-Object { $_ }

foreach ($pid in $pids) {
    try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-Host "Stopped process $pid"
    } catch {
        Write-Warning "Could not stop process ${pid}: $($_.Exception.Message)"
    }
}

Write-Host "Stopped logging session: $($meta.session)"
Write-Host "Logs remain at: $sessionDir"
