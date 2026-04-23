param(
  [string]$BaseUrl    = "http://127.0.0.1:8080",
  [string]$Email      = "testafro5@gmail.com",
  [string]$Password   = "Test1@123",
  [int]$RecordCount   = 100,
  [string]$ReportDir  = ""
)

$results = New-Object System.Collections.Generic.List[Object]

function Add-Result {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Url,
    [int]$Status,
    [bool]$Ok,
    [string]$Detail
  )
  $results.Add([pscustomobject]@{
    name   = $Name
    method = $Method
    url    = $Url
    status = $Status
    ok     = $Ok
    detail = $Detail
  }) | Out-Null
}

function Invoke-Test {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [string]$Body,
    [string]$ContentType = "application/json"
  )

  $params = @{
    UseBasicParsing = $true
    Method          = $Method
    Uri             = $Url
    ErrorAction     = "Stop"
  }
  if ($Headers) { $params.Headers = $Headers }
  if (-not [string]::IsNullOrWhiteSpace($Body)) {
    $params.Body        = $Body
    $params.ContentType = $ContentType
  }

  # Retry once on 429 (rate limit window = 60s, wait 62s)
  for ($attempt = 1; $attempt -le 2; $attempt++) {
    try {
      $resp = Invoke-WebRequest @params
      Add-Result -Name $Name -Method $Method -Url $Url -Status ([int]$resp.StatusCode) -Ok $true -Detail ""
      return $resp
    }
    catch {
      $status = 0
      $detail = $_.Exception.Message
      try {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
          $status = [int]$_.Exception.Response.StatusCode
        }
      } catch {}
      try {
        if ($_.ErrorDetails.Message) { $detail = $_.ErrorDetails.Message }
      } catch {}

      if ($status -eq 429 -and $attempt -eq 1) {
        Write-Host "  [RATE-LIMIT] $Name - waiting 62s for window reset..." -ForegroundColor Yellow
        Start-Sleep -Seconds 62
        continue
      }

      Add-Result -Name $Name -Method $Method -Url $Url -Status $status -Ok $false -Detail $detail
      return $null
    }
  }
}

# ── helpers ─────────────────────────────────────────────────────────────

function Seed-Metadata {
  param(
    [string]$Resource,      # "departments" | "industries" | "employment-types" | "work-modes"
    [string]$Label,         # friendly label for output
    [hashtable]$Headers,
    [string]$RunTag,
    [int]$Count
  )

  $created = @()

  for ($i = 1; $i -le $Count; $i++) {
    $body = @{
      name        = "$Label $RunTag #$i"
      description = "Seeded $Label record #$i for run $RunTag"
    } | ConvertTo-Json

    $resp = Invoke-Test `
      -Name   "$Label Create #$i" `
      -Method "POST" `
      -Url    "$BaseUrl/api/ahrm/v3/$Resource" `
      -Headers $Headers `
      -Body   $body

    if ($resp) {
      # GET list to confirm the entry exists (single call after all creates)
      $created += @{ name = "$Label $RunTag #$i" }
    }
  }

  # Verify count via GET list
  $listResp = Invoke-Test -Name "$Label GET List" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/$Resource" -Headers $Headers
  if ($listResp) {
    $allItems = @($listResp.Content | ConvertFrom-Json)
    if ($allItems.Count -eq 1 -and $allItems[0] -is [System.Array]) {
      $allItems = @($allItems[0])
    }
    # Filter to this run's entries
    $runItems = @($allItems | Where-Object { $_.name -like "*$RunTag*" })
    if ($runItems.Count -eq $Count) {
      Add-Result -Name "$Label List Count Check ($Count)" -Method "GET" `
        -Url "$BaseUrl/api/ahrm/v3/$Resource" -Status 200 -Ok $true -Detail ""
    } else {
      Add-Result -Name "$Label List Count Check ($Count)" -Method "GET" `
        -Url "$BaseUrl/api/ahrm/v3/$Resource" -Status 0 -Ok $false `
        -Detail "Expected $Count, found $($runItems.Count) matching run tag"
    }

    # Sample GET by id
    if ($runItems.Count -gt 0) {
      $sampleId = [int]$runItems[0].id
      Invoke-Test -Name "$Label GET by Id (Sample)" -Method "GET" `
        -Url "$BaseUrl/api/ahrm/v3/$Resource/$sampleId" -Headers $Headers | Out-Null

      # Sample PUT (update)
      $updateBody = @{
        name        = "$Label $RunTag #1-updated"
        description = "Updated description for run $RunTag"
      } | ConvertTo-Json
      Invoke-Test -Name "$Label PUT Update (Sample)" -Method "PUT" `
        -Url "$BaseUrl/api/ahrm/v3/$Resource/$sampleId" -Headers $Headers -Body $updateBody | Out-Null
    }

    # Sample DELETE on a second record
    if ($runItems.Count -gt 1) {
      $deleteId = [int]$runItems[1].id
      Invoke-Test -Name "$Label DELETE (Sample)" -Method "DELETE" `
        -Url "$BaseUrl/api/ahrm/v3/$Resource/$deleteId" -Headers $Headers | Out-Null
    }
  }
}

# ── resolve report dir ───────────────────────────────────────────────────

$ts     = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$runTag = "meta100-$ts"

if ([string]::IsNullOrWhiteSpace($ReportDir)) {
  $ReportDir = Join-Path (Join-Path $PSScriptRoot "..") "logs\api-reports"
}
if (-not [System.IO.Path]::IsPathRooted($ReportDir)) {
  $ReportDir = Join-Path $PSScriptRoot $ReportDir
}
New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null

# ── login ────────────────────────────────────────────────────────────────

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$loginResp = Invoke-Test -Name "Login" -Method "POST" `
  -Url "$BaseUrl/api/ahrm/v3/auth/login" -Body $loginBody

if (-not $loginResp) {
  Write-Output "FAILED_AT=LOGIN"
  Write-Output "RUN_TAG=$runTag"
  exit 1
}

$jwt = ($loginResp.Content | ConvertFrom-Json).jwt
if ([string]::IsNullOrWhiteSpace($jwt)) {
  Add-Result -Name "JWT Presence" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/auth/login" `
    -Status 0 -Ok $false -Detail "No jwt in login response"
  Write-Output "FAILED_AT=JWT"
  exit 1
}

$headers = @{ Authorization = "Bearer $jwt" }

# Verify account type
$meResp = Invoke-Test -Name "Users Me" -Method "GET" `
  -Url "$BaseUrl/api/ahrm/v3/users/me" -Headers $headers
if (-not $meResp) {
  Write-Output "FAILED_AT=USERS_ME"
  exit 1
}
$me          = $meResp.Content | ConvertFrom-Json
$accountType = [string]$me.accountType

if ($accountType -ne "EMPLOYER" -and $accountType -ne "ADMIN") {
  Add-Result -Name "Account Type Check" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/users/me" `
    -Status 0 -Ok $false -Detail "Expected EMPLOYER or ADMIN, got $accountType"
  Write-Output "FAILED_AT=ACCOUNT_TYPE"
  exit 1
}

# ── seed all four metadata types ─────────────────────────────────────────

Seed-Metadata -Resource "departments"      -Label "Department"      -Headers $headers -RunTag $runTag -Count $RecordCount
Seed-Metadata -Resource "industries"       -Label "Industry"        -Headers $headers -RunTag $runTag -Count $RecordCount
Seed-Metadata -Resource "employment-types" -Label "EmploymentType"  -Headers $headers -RunTag $runTag -Count $RecordCount
Seed-Metadata -Resource "work-modes"       -Label "WorkMode"        -Headers $headers -RunTag $runTag -Count $RecordCount

# ── report ───────────────────────────────────────────────────────────────

$pass = ($results | Where-Object { $_.ok }).Count
$fail = ($results | Where-Object { -not $_.ok }).Count

$reportTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$jsonReportPath  = Join-Path $ReportDir ("metadata-100-{0}.json" -f $reportTimestamp)
$csvReportPath   = Join-Path $ReportDir ("metadata-100-{0}.csv"  -f $reportTimestamp)

$reportPayload = @{
  generatedAt  = (Get-Date).ToString("o")
  runTag       = $runTag
  baseUrl      = $BaseUrl
  email        = $Email
  recordCount  = $RecordCount
  total        = $results.Count
  pass         = $pass
  fail         = $fail
  results      = $results.ToArray()
}

$reportPayload | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonReportPath -Encoding UTF8
$results | Export-Csv -Path $csvReportPath -NoTypeInformation -Encoding UTF8

Write-Output "RUN_TAG=$runTag"
Write-Output "SMOKE_TOTAL=$($results.Count)"
Write-Output "SMOKE_PASS=$pass"
Write-Output "SMOKE_FAIL=$fail"
Write-Output "REPORT_JSON=$jsonReportPath"
Write-Output "REPORT_CSV=$csvReportPath"

$results | ForEach-Object {
  $state = if ($_.ok) { "PASS" } else { "FAIL" }
  Write-Output ("[{0}] {1} {2} => {3}" -f $state, $_.method, $_.name, $_.status)
}

if ($fail -gt 0) {
  Write-Output "--- FAIL DETAILS ---"
  $results | Where-Object { -not $_.ok } | ForEach-Object {
    Write-Output ("{0} => {1}" -f $_.name, $_.detail)
  }
}
