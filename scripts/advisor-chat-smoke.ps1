# advisor-chat-smoke.ps1
# Integration smoke test for the Student Advisor chatbot endpoints.
# No auth required - these are public endpoints.
# Usage: .\scripts\advisor-chat-smoke.ps1 [-BaseUrl http://localhost:8080]

param(
    [string]$BaseUrl = "http://localhost:8080",
    [int]$SyncTimeoutSec = 60,
    [int]$StreamTimeoutSec = 90,
    [int]$RetryCount = 1,
    [bool]$RequireDoneEvent = $false
)

$pass = 0
$fail = 0
$testPayload = '{"message":"Hi, give me 3 short software engineering skills for 2026.","history":[]}'
$contentType  = "application/json"
$syncUrl      = "$BaseUrl/api/ahrm/v3/dashboard/students/chatbot"
$streamUrl    = "$BaseUrl/api/ahrm/v3/dashboard/students/chatbot/stream"
$maxAttempts  = $RetryCount + 1

function Write-Pass([string]$label) {
    Write-Host "  [PASS] $label" -ForegroundColor Green
    $script:pass++
}

function Write-Fail([string]$label, [string]$detail) {
    Write-Host "  [FAIL] $label - $detail" -ForegroundColor Red
    $script:fail++
}

# --- Test 1: Sync chatbot endpoint ---
Write-Host "`n[1] Sync chatbot  POST $syncUrl"
$syncResp = $null
$syncError = ""
for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    try {
        $syncResp = Invoke-RestMethod -Method POST -Uri $syncUrl `
            -TimeoutSec $SyncTimeoutSec -ContentType $contentType -Body $testPayload -ErrorAction Stop
        break
    }
    catch {
        $syncError = $_.Exception.Message
        if ($attempt -lt $maxAttempts) {
            Write-Host "  [RETRY] Sync attempt $attempt failed, retrying..." -ForegroundColor Yellow
        }
    }
}

if ($syncResp) {
    if ($syncResp.reply -and $syncResp.reply.Length -gt 0) {
        Write-Pass "Response contains 'reply' field (length=$($syncResp.reply.Length))"
    }
    else {
        Write-Fail "reply field" "field missing or empty"
    }

    if ($syncResp.provider) {
        Write-Pass "Response contains 'provider' field: $($syncResp.provider)"
    }
    else {
        Write-Fail "provider field" "field missing"
    }

    if ($syncResp.reply -notmatch "unavailable") {
        Write-Pass "Reply does not contain fallback 'unavailable' text"
    }
    else {
        Write-Fail "Fallback guard" "reply contains 'unavailable' - AI not responding"
    }
}
else {
    Write-Fail "HTTP request" $syncError
}

# --- Test 2: Streaming (SSE) endpoint ---
Write-Host "`n[2] Stream chatbot  POST $streamUrl"

$payloadFile = [System.IO.Path]::GetTempFileName()
try {
    [System.IO.File]::WriteAllText($payloadFile, $testPayload)

    $curlOutput = @()
    $streamExitCode = 0
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        $curlOutput = & curl.exe --silent --show-error --no-buffer --max-time $StreamTimeoutSec `
            -X POST $streamUrl `
            -H "Content-Type: application/json" `
            -H "Accept: text/event-stream" `
            --data-binary "@$payloadFile" 2>&1
        $streamExitCode = $LASTEXITCODE

        $hasEvent = @($curlOutput | Where-Object { $_ -match "^event:" }).Count -gt 0
        $hasData = @($curlOutput | Where-Object { $_ -match "^data:" }).Count -gt 0
        if ($hasEvent -and $hasData) {
            break
        }

        if ($attempt -lt $maxAttempts) {
            Write-Host "  [RETRY] Stream attempt $attempt produced no chunks, retrying..." -ForegroundColor Yellow
        }
    }

    $eventLines   = $curlOutput | Where-Object { $_ -match "^event:" }
    $dataLines    = $curlOutput | Where-Object { $_ -match "^data:" }
    $hasDoneEvent = $curlOutput | Where-Object { $_ -match "event:done" }

    if ($eventLines.Count -gt 0) {
        Write-Pass "Received $($eventLines.Count) event line(s)"
    }
    else {
        Write-Fail "SSE event lines" "no 'event:' lines in response"
    }

    if ($dataLines.Count -gt 0) {
        Write-Pass "Received $($dataLines.Count) data chunk(s)"
    }
    else {
        Write-Fail "SSE data chunks" "no 'data:' lines in response"
    }

    if ($hasDoneEvent) {
        Write-Pass "Stream terminated with 'event:done'"
    }
    else {
        if ($RequireDoneEvent) {
            Write-Fail "event:done" "stream did not end with done event"
        }
        elseif ($eventLines.Count -gt 0 -and $dataLines.Count -gt 0) {
            Write-Pass "Stream produced chunks (done event not required)"
        }
        else {
            Write-Fail "event:done" "stream produced no chunks (curl exit=$streamExitCode)"
        }
    }

    $joinedData = ($dataLines -join " ")
    if ($joinedData -notmatch "unavailable") {
        Write-Pass "Streamed data does not contain fallback text"
    }
    else {
        Write-Fail "Fallback guard (stream)" "data contains 'unavailable'"
    }
}
catch {
    Write-Fail "curl SSE request" $_.Exception.Message
}
finally {
    Remove-Item -LiteralPath $payloadFile -ErrorAction SilentlyContinue
}

# --- Summary ---
Write-Host ""
Write-Host "----------------------------------------"
$total = $pass + $fail
$color = if ($fail -eq 0) { "Green" } else { "Yellow" }
Write-Host "Results: $pass/$total passed" -ForegroundColor $color
if ($fail -gt 0) {
    Write-Host "         $fail test(s) FAILED" -ForegroundColor Red
    exit 1
}
exit 0