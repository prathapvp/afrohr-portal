param(
  [string]$BaseUrl = "http://127.0.0.1:8080",
  [string]$Email = "testafro5@gmail.com",
  [string]$Password = "Test1@123",
  [int]$RecordCount = 100,
  [string]$ReportDir = ""
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
    name = $Name
    method = $Method
    url = $Url
    status = $Status
    ok = $Ok
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

  try {
    $params = @{
      UseBasicParsing = $true
      Method = $Method
      Uri = $Url
      ErrorAction = "Stop"
    }

    if ($Headers) {
      $params.Headers = $Headers
    }

    if (-not [string]::IsNullOrWhiteSpace($Body)) {
      $params.Body = $Body
      $params.ContentType = $ContentType
    }

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
    }
    catch {
      $status = 0
    }

    try {
      if ($_.ErrorDetails.Message) {
        $detail = $_.ErrorDetails.Message
      }
    }
    catch {}

    Add-Result -Name $Name -Method $Method -Url $Url -Status $status -Ok $false -Detail $detail
    return $null
  }
}

function Get-ScalarValue {
  param(
    $Value
  )

  if ($Value -is [System.Array]) {
    if ($Value.Count -gt 0) {
      return $Value[0]
    }
    return $null
  }

  return $Value
}

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$runTag = "emp100-$ts"

if ([string]::IsNullOrWhiteSpace($ReportDir)) {
  $ReportDir = Join-Path (Join-Path $PSScriptRoot "..") "logs\api-reports"
}

if (-not [System.IO.Path]::IsPathRooted($ReportDir)) {
  $ReportDir = Join-Path $PSScriptRoot $ReportDir
}

New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$loginResp = Invoke-Test -Name "Employer Login" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/auth/login" -Body $loginBody
if (-not $loginResp) {
  Write-Output "FAILED_AT=LOGIN"
  Write-Output "RUN_TAG=$runTag"
  $results | ForEach-Object {
    $state = if ($_.ok) { "PASS" } else { "FAIL" }
    Write-Output ("[{0}] {1} {2} => {3}" -f $state, $_.method, $_.name, $_.status)
  }
  exit 1
}

$jwt = ($loginResp.Content | ConvertFrom-Json).jwt
if ([string]::IsNullOrWhiteSpace($jwt)) {
  Add-Result -Name "JWT Presence" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/auth/login" -Status 0 -Ok $false -Detail "No jwt in login response"
  Write-Output "FAILED_AT=JWT"
  exit 1
}

$headers = @{ Authorization = "Bearer $jwt" }

$meResp = Invoke-Test -Name "Users Me" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/users/me" -Headers $headers
if (-not $meResp) {
  Write-Output "FAILED_AT=USERS_ME"
  exit 1
}

$me = $meResp.Content | ConvertFrom-Json
$userId = [int]$me.id
$accountType = [string]$me.accountType

if ($accountType -ne "EMPLOYER") {
  Add-Result -Name "Account Type EMPLOYER" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/users/me" -Status 0 -Ok $false -Detail "Account type is $accountType"
  Write-Output "FAILED_AT=ACCOUNT_TYPE"
  $results | ForEach-Object {
    $state = if ($_.ok) { "PASS" } else { "FAIL" }
    Write-Output ("[{0}] {1} {2} => {3}" -f $state, $_.method, $_.name, $_.status)
  }
  exit 1
}

Invoke-Test -Name "Employer Members" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/users/employer/members" -Headers $headers | Out-Null

$linkEmail = "linked.$runTag@example.com"
$linkResp = Invoke-Test -Name "Employer Link Member" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/users/employer/link/$linkEmail" -Headers $headers
if ($linkResp) {
  $linkedUserId = [int](($linkResp.Content | ConvertFrom-Json).id)
  if ($linkedUserId -gt 0) {
    Invoke-Test -Name "Employer Update Member Role" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/users/employer/members/$linkedUserId/role/VIEWER" -Headers $headers | Out-Null
  }
}

Invoke-Test -Name "Profiles Me" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/profiles/me" -Headers $headers | Out-Null
Invoke-Test -Name "Profiles GetAll Applicant" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/profiles/getAll?accountType=APPLICANT" -Headers $headers | Out-Null

$jobs = @()
for ($i = 1; $i -le $RecordCount; $i++) {
  $jobs += @{
    jobTitle = "$runTag Job #$i"
    department = "Engineering"
    role = "Software Engineer"
    company = "AfroHR Test Data"
    about = "Bulk employer test run $runTag"
    experience = "2-5 years"
    freshersAllowed = $false
    jobType = "Full-Time"
    location = "Lagos, Nigeria"
    country = "Nigeria"
    currency = "USD"
    packageOffered = 60000 + $i
    maxPackageOffered = 80000 + $i
    variableComponent = 0
    hideSalary = $false
    workMode = "Hybrid"
    willingToRelocate = $true
    industry = "Technology"
    vacancies = 1
    description = "Bulk employer API test description #$i"
    skillsRequired = @("Java", "Spring Boot", "SQL")
    jobStatus = "DRAFT"
    postedBy = $userId
  }
}

$postAllBody = $jobs | ConvertTo-Json -Depth 8
$postAllResp = Invoke-Test -Name "Jobs PostAll 100 Create" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/jobs/postAll" -Headers $headers -Body $postAllBody

$created = @()
if ($postAllResp) {
  try {
    $createdParsed = @($postAllResp.Content | ConvertFrom-Json)
    if ($createdParsed.Count -eq 1 -and $createdParsed[0] -is [System.Array]) {
      $created = @($createdParsed[0])
    } else {
      $created = $createdParsed
    }
  }
  catch {
    $created = @()
  }
}

$createdWithIds = @($created | Where-Object { $null -ne (Get-ScalarValue -Value $_.id) })

if ($createdWithIds.Count -eq $RecordCount) {
  Add-Result -Name "Create Count Check (100)" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/jobs/postAll" -Status 201 -Ok $true -Detail ""
} else {
  Add-Result -Name "Create Count Check (100)" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/jobs/postAll" -Status 0 -Ok $false -Detail "Expected $RecordCount created, got $($createdWithIds.Count)"
}

$myPostedResp = Invoke-Test -Name "Jobs Me Posted" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/jobs/me/posted" -Headers $headers

if ($createdWithIds.Count -gt 0) {
  $sampleIdRaw = Get-ScalarValue -Value $createdWithIds[0].id
  if ($null -ne $sampleIdRaw) {
    $sampleId = [int]$sampleIdRaw
    Invoke-Test -Name "Jobs Get By Id (Sample)" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/jobs/get/$sampleId" | Out-Null
  }
}

if ($createdWithIds.Count -gt 0) {
  $closePayload = @()
  foreach ($j in $createdWithIds) {
    $jobIdValue = Get-ScalarValue -Value $j.id
    $closePayload += @{
      id = $jobIdValue
      jobTitle = $j.jobTitle
      department = $j.department
      role = $j.role
      company = $j.company
      applicants = $j.applicants
      about = $j.about
      experience = $j.experience
      freshersAllowed = $j.freshersAllowed
      jobType = $j.jobType
      location = $j.location
      country = $j.country
      currency = $j.currency
      packageOffered = $j.packageOffered
      maxPackageOffered = $j.maxPackageOffered
      variableComponent = $(if ($null -eq $j.variableComponent) { 0 } else { $j.variableComponent })
      hideSalary = $j.hideSalary
      workMode = $j.workMode
      willingToRelocate = $j.willingToRelocate
      industry = $j.industry
      vacancies = $j.vacancies
      description = $j.description
      skillsRequired = $j.skillsRequired
      jobStatus = "CLOSED"
      postedBy = $userId
    }
  }

  $closeBody = $closePayload | ConvertTo-Json -Depth 10
  $closeResp = Invoke-Test -Name "Jobs PostAll 100 Close" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/jobs/postAll" -Headers $headers -Body $closeBody

  $closed = @()
  if ($closeResp) {
    try {
      $closedParsed = @($closeResp.Content | ConvertFrom-Json)
      if ($closedParsed.Count -eq 1 -and $closedParsed[0] -is [System.Array]) {
        $closed = @($closedParsed[0])
      } else {
        $closed = $closedParsed
      }
    }
    catch {
      $closed = @()
    }
  }

  $closedCount = @($closed | Where-Object { $_.jobStatus -eq "CLOSED" -and $null -ne (Get-ScalarValue -Value $_.id) }).Count
  if ($closedCount -eq $RecordCount) {
    Add-Result -Name "Close Count Check (100)" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/jobs/postAll" -Status 201 -Ok $true -Detail ""
  } else {
    Add-Result -Name "Close Count Check (100)" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/jobs/postAll" -Status 0 -Ok $false -Detail "Expected $RecordCount closed, got $closedCount"
  }

  # Endpoint coverage for specific close/delete routes on a sample job
  $sampleCloseIdRaw = Get-ScalarValue -Value $createdWithIds[0].id
  if ($null -ne $sampleCloseIdRaw) {
    $sampleCloseId = [int]$sampleCloseIdRaw
    Invoke-Test -Name "Jobs Me Close (Sample Endpoint)" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/jobs/me/$sampleCloseId/close" -Headers $headers | Out-Null
  }

  if ($createdWithIds.Count -gt 1) {
    $sampleDeleteIdRaw = Get-ScalarValue -Value $createdWithIds[1].id
    if ($null -ne $sampleDeleteIdRaw) {
      $sampleDeleteId = [int]$sampleDeleteIdRaw
      Invoke-Test -Name "Jobs Me Delete (Sample Endpoint)" -Method "DELETE" -Url "$BaseUrl/api/ahrm/v3/jobs/me/$sampleDeleteId" -Headers $headers | Out-Null
    }
  }
}

$pass = ($results | Where-Object { $_.ok }).Count
$fail = ($results | Where-Object { -not $_.ok }).Count

$reportTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$jsonReportPath = Join-Path $ReportDir ("employer-api-100-{0}.json" -f $reportTimestamp)
$csvReportPath = Join-Path $ReportDir ("employer-api-100-{0}.csv" -f $reportTimestamp)

$reportPayload = @{
  generatedAt = (Get-Date).ToString("o")
  runTag = $runTag
  baseUrl = $BaseUrl
  email = $Email
  employerId = $userId
  recordCount = $RecordCount
  total = $results.Count
  pass = $pass
  fail = $fail
  results = $results.ToArray()
}

$reportPayload | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonReportPath -Encoding UTF8
$results | Export-Csv -Path $csvReportPath -NoTypeInformation -Encoding UTF8

Write-Output "RUN_TAG=$runTag"
Write-Output "EMPLOYER_ID=$userId"
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
