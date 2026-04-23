param(
  [string]$BaseUrl = "http://127.0.0.1:8080"
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

# Public endpoints
Invoke-Test -Name "Health" -Method "GET" -Url "$BaseUrl/actuator/health" | Out-Null
Invoke-Test -Name "Public Jobs" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/jobs/getAll" | Out-Null
Invoke-Test -Name "Departments" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/departments" | Out-Null
Invoke-Test -Name "Industries" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/industries" | Out-Null
Invoke-Test -Name "Employment Types" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/employment-types" | Out-Null
Invoke-Test -Name "Work Modes" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/work-modes" | Out-Null
Invoke-Test -Name "Dashboard Public" -Method "GET" -Url "$BaseUrl/api/dashboard" | Out-Null
Invoke-Test -Name "Audiences Public" -Method "GET" -Url "$BaseUrl/api/audiences" | Out-Null
Invoke-Test -Name "Search Public" -Method "GET" -Url "$BaseUrl/api/search?audience=candidates&q=java" | Out-Null

# Auth + JWT setup
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "api.smoke.$ts@example.com"
$password = "P@ssw0rd123!"

$registerBody = @{
  name = "API Smoke User"
  email = $email
  password = $password
  accountType = "ADMIN"
} | ConvertTo-Json

Invoke-Test -Name "Register User" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/users/register" -Body $registerBody | Out-Null

$loginBody = @{
  email = $email
  password = $password
} | ConvertTo-Json

$loginResp = Invoke-Test -Name "Login User" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/auth/login" -Body $loginBody
$jwt = $null

if ($loginResp) {
  try {
    $jwt = ($loginResp.Content | ConvertFrom-Json).jwt
  }
  catch {
    $jwt = $null
  }
}

if ($jwt) {
  $headers = @{ Authorization = "Bearer $jwt" }

  $meResp = Invoke-Test -Name "Users Me" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/users/me" -Headers $headers
  $userId = 0

  if ($meResp) {
    try {
      $userId = [int](($meResp.Content | ConvertFrom-Json).id)
    }
    catch {
      $userId = 0
    }
  }

  Invoke-Test -Name "Profiles Me" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/profiles/me" -Headers $headers | Out-Null
  Invoke-Test -Name "Profiles GetAll(APPLICANT)" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/profiles/getAll?accountType=APPLICANT" -Headers $headers | Out-Null

  $jobBody = @{
    jobTitle = "API Smoke Job"
    department = "Engineering"
    role = "Software Engineer"
    company = "AfroHR Test Data"
    about = "api smoke"
    experience = "2-5 years"
    freshersAllowed = $false
    jobType = "Full-Time"
    location = "Lagos, Nigeria"
    country = "Nigeria"
    currency = "USD"
    packageOffered = 51000
    maxPackageOffered = 71000
    variableComponent = 0
    hideSalary = $false
    workMode = "Hybrid"
    willingToRelocate = $true
    industry = "Technology"
    vacancies = 1
    description = "API smoke description"
    skillsRequired = @("Java", "Spring Boot", "SQL")
    jobStatus = "ACTIVE"
    postedBy = $userId
  } | ConvertTo-Json -Depth 6

  $postJobResp = Invoke-Test -Name "Post My Job" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/jobs/me" -Headers $headers -Body $jobBody
  $jobId = 0

  if ($postJobResp) {
    try {
      $jobId = [int](($postJobResp.Content | ConvertFrom-Json).id)
    }
    catch {
      $jobId = 0
    }
  }

  Invoke-Test -Name "My Posted Jobs" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/jobs/me/posted" -Headers $headers | Out-Null

  if ($jobId -gt 0) {
    Invoke-Test -Name "Get Job By Id Public" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/jobs/get/$jobId" | Out-Null
    Invoke-Test -Name "Close My Job" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/jobs/me/$jobId/close" -Headers $headers | Out-Null
    Invoke-Test -Name "Delete My Job" -Method "DELETE" -Url "$BaseUrl/api/ahrm/v3/jobs/me/$jobId" -Headers $headers | Out-Null
  }

}

# Employer workspace role-gated endpoints with valid owner/member context
$employerTs = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$ownerEmail = "api.owner.$employerTs@example.com"
$memberEmail = "api.member.$employerTs@example.com"
$ownerPassword = "P@ssw0rd123!"

$ownerRegisterBody = @{
  name = "API Employer Owner"
  email = $ownerEmail
  password = $ownerPassword
  accountType = "EMPLOYER"
} | ConvertTo-Json

Invoke-Test -Name "Employer Owner Register" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/users/register" -Body $ownerRegisterBody | Out-Null

$ownerLoginBody = @{
  email = $ownerEmail
  password = $ownerPassword
} | ConvertTo-Json

$ownerLoginResp = Invoke-Test -Name "Employer Owner Login" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/auth/login" -Body $ownerLoginBody

if ($ownerLoginResp) {
  $ownerJwt = $null
  try {
    $ownerJwt = ($ownerLoginResp.Content | ConvertFrom-Json).jwt
  }
  catch {
    $ownerJwt = $null
  }

  if ($ownerJwt) {
    $ownerHeaders = @{ Authorization = "Bearer $ownerJwt" }
    $linkResp = Invoke-Test -Name "Employer Link Member" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/users/employer/link/$memberEmail" -Headers $ownerHeaders

    Invoke-Test -Name "Employer Members (owner context)" -Method "GET" -Url "$BaseUrl/api/ahrm/v3/users/employer/members" -Headers $ownerHeaders | Out-Null

    if ($linkResp) {
      $memberId = 0
      try {
        $memberId = [int](($linkResp.Content | ConvertFrom-Json).id)
      }
      catch {
        $memberId = 0
      }

      if ($memberId -gt 0) {
        Invoke-Test -Name "Update Employer Role (owner context)" -Method "POST" -Url "$BaseUrl/api/ahrm/v3/users/employer/members/$memberId/role/VIEWER" -Headers $ownerHeaders | Out-Null
      }
    }
  }
}

$pass = ($results | Where-Object { $_.ok }).Count
$fail = ($results | Where-Object { -not $_.ok }).Count

Write-Output "SMOKE_TOTAL=$($results.Count)"
Write-Output "SMOKE_PASS=$pass"
Write-Output "SMOKE_FAIL=$fail"

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
