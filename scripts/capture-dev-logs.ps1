param(
    [switch]$RestartExisting = $true
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logsRoot = Join-Path $root "logs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$sessionDir = Join-Path $logsRoot $timestamp

New-Item -ItemType Directory -Path $logsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $sessionDir -Force | Out-Null

function Stop-ListeningProcessOnPort {
    param([int]$Port)

    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($null -ne $conn) {
        try {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction Stop
            Start-Sleep -Milliseconds 800
            Write-Host "Stopped existing process $($conn.OwningProcess) on port $Port"
        } catch {
            Write-Warning "Failed to stop process on port ${Port}: $($_.Exception.Message)"
        }
    }
}

if ($RestartExisting) {
    Stop-ListeningProcessOnPort -Port 8080
    Stop-ListeningProcessOnPort -Port 5173
}

$backendOut = Join-Path $sessionDir "backend.out.log"
$backendErr = Join-Path $sessionDir "backend.err.log"
$frontendOut = Join-Path $sessionDir "frontend.out.log"
$frontendErr = Join-Path $sessionDir "frontend.err.log"

$backendDir = Join-Path $root "backend\\dashboard-service"
$frontendDir = $root

$backendProc = Start-Process -FilePath "powershell.exe" `
    -WorkingDirectory $backendDir `
    -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "mvn spring-boot:run" `
    -RedirectStandardOutput $backendOut `
    -RedirectStandardError $backendErr `
    -PassThru

$frontendProc = Start-Process -FilePath "powershell.exe" `
    -WorkingDirectory $frontendDir `
    -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "npm run dev" `
    -RedirectStandardOutput $frontendOut `
    -RedirectStandardError $frontendErr `
    -PassThru

function Wait-ForPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($listening) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }

    return $false
}

$backendReady = Wait-ForPort -Port 8080 -TimeoutSeconds 90
$frontendReady = Wait-ForPort -Port 5173 -TimeoutSeconds 45

$meta = [ordered]@{
    session = $timestamp
    startedAt = (Get-Date).ToString("o")
    backendPid = $backendProc.Id
    frontendPid = $frontendProc.Id
    backendOut = $backendOut
    backendErr = $backendErr
    frontendOut = $frontendOut
    frontendErr = $frontendErr
}

$metaJson = $meta | ConvertTo-Json -Depth 4
$metaPath = Join-Path $sessionDir "session.json"
Set-Content -Path $metaPath -Value $metaJson -Encoding UTF8
Set-Content -Path (Join-Path $logsRoot "latest-session.txt") -Value $sessionDir -Encoding UTF8

Write-Host "Log capture started."
Write-Host "Session: $timestamp"
Write-Host "Backend PID: $($backendProc.Id)"
Write-Host "Frontend PID: $($frontendProc.Id)"
Write-Host "Backend logs: $backendOut and $backendErr"
Write-Host "Frontend logs: $frontendOut and $frontendErr"
Write-Host "Metadata: $metaPath"
Write-Host "Backend ready on 8080: $backendReady"
Write-Host "Frontend ready on 5173: $frontendReady"

if (-not $backendReady -or -not $frontendReady) {
    Write-Warning "One or more services did not become ready in time. Check logs in $sessionDir"
}
