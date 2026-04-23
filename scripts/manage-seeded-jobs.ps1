param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("seed", "list", "cleanup")]
  [string]$Action,

  [string]$BaseUrl = "http://127.0.0.1:7000",

  [Parameter(Mandatory = $true)]
  [string]$Token,

  [Parameter(Mandatory = $true)]
  [long]$PostedBy,

  [string]$TestTag = "legacy-ui-manual",

  [int]$RecordCount = 10000,

  [int]$BatchSize = 500,

  [string]$JobIds
)

$headers = @{ Authorization = "Bearer $Token" }

function New-SeedJob {
  param(
    [int]$Index
  )

  $seniority = switch ($Index % 4) {
    0 { "0-2yrs" }
    1 { "2-5yrs" }
    2 { "5-10yrs" }
    default { "Intermediate" }
  }

  $workMode = switch ($Index % 3) {
    0 { "Remote" }
    1 { "Hybrid" }
    default { "On-site" }
  }

  $employmentType = switch ($Index % 3) {
    0 { "Full Time, Permanent" }
    1 { "Part Time, Permanent" }
    default { "Contract" }
  }

  $location = switch ($Index % 5) {
    0 { "Lagos" }
    1 { "Accra" }
    2 { "Nairobi" }
    3 { "Kigali" }
    default { "Abuja" }
  }

  [ordered]@{
    title = "Seeded Test Job #$Index"
    company = "AfroHR Test Data"
    location = $location
    salary = [string](45000 + ($Index % 5000))
    description = "Seeded bulk test job #$Index for performance and pagination testing."
    department = "Engineering"
    role = "Software Engineer"
    experience = $seniority
    employmentType = $employmentType
    industry = "Technology"
    workMode = $workMode
    currency = "USD"
    vacancies = 1 + ($Index % 4)
    skills = "Java,Spring Boot,SQL"
    jobStatus = "ACTIVE"
  }
}

function New-StandardJobPayload {
  param(
    [int]$Index,
    [long]$PostedBy
  )

  $workMode = switch ($Index % 3) {
    0 { "Remote" }
    1 { "Hybrid" }
    default { "On-site" }
  }

  $employmentType = switch ($Index % 3) {
    0 { "Full-Time" }
    1 { "Part-Time" }
    default { "Contract" }
  }

  $location = switch ($Index % 5) {
    0 { "Lagos, Nigeria" }
    1 { "Accra, Ghana" }
    2 { "Nairobi, Kenya" }
    3 { "Kigali, Rwanda" }
    default { "Abuja, Nigeria" }
  }

  $experience = switch ($Index % 4) {
    0 { "0-2 years" }
    1 { "2-5 years" }
    2 { "5-10 years" }
    default { "3-6 years" }
  }

  [ordered]@{
    jobTitle = "Seeded Test Job #$Index"
    department = "Engineering"
    role = "Software Engineer"
    company = "AfroHR Test Data"
    about = "Bulk seeded test job #$Index for API and pagination testing."
    experience = $experience
    freshersAllowed = $false
    jobType = $employmentType
    location = $location
    packageOffered = 45000 + ($Index % 5000)
    maxPackageOffered = 55000 + ($Index % 5000)
    hideSalary = $false
    workMode = $workMode
    willingToRelocate = $true
    industry = "Technology"
    vacancies = 1 + ($Index % 4)
    description = "<p>Seeded test description for job #$Index</p>"
    skillsRequired = @("Java", "Spring Boot", "SQL")
    jobStatus = "ACTIVE"
    postedBy = $PostedBy
  }
}

if ($Action -eq "seed") {
  if ($RecordCount -lt 1) {
    throw "RecordCount must be greater than 0."
  }

  if ($BatchSize -lt 1) {
    throw "BatchSize must be greater than 0."
  }

  $seedUri = "$BaseUrl/api/ahrm/v3/jobs/test/seed"
  $postJobUri = "$BaseUrl/api/ahrm/v3/jobs/me"
  $created = 0
  $useFallbackPostJob = $false

  for ($start = 1; $start -le $RecordCount; $start += $BatchSize) {
    $end = [Math]::Min($start + $BatchSize - 1, $RecordCount)
    $jobs = @()

    for ($i = $start; $i -le $end; $i++) {
      $jobs += New-SeedJob -Index $i
    }

    if (-not $useFallbackPostJob) {
      $payload = @{
        postedBy = $PostedBy
        testTag = $TestTag
        jobs = $jobs
      } | ConvertTo-Json -Depth 8

      try {
        Invoke-WebRequest -UseBasicParsing -Method POST -Uri $seedUri -Headers $headers -ContentType "application/json" -Body $payload -ErrorAction Stop | Out-Null
        $created += ($end - $start + 1)
      }
      catch {
        $responseCode = $null
        try {
          $responseCode = [int]$_.Exception.Response.StatusCode
        }
        catch {
          $responseCode = $null
        }

        if ($responseCode -eq 404 -or $responseCode -eq 429) {
          Write-Host "Seed endpoint unavailable (status: $responseCode). Switching to /jobs/me fallback seeding."
          $useFallbackPostJob = $true
        }
        else {
          throw
        }
      }
    }

    if ($useFallbackPostJob) {
      for ($i = $start; $i -le $end; $i++) {
        $singleJob = New-StandardJobPayload -Index $i -PostedBy $PostedBy | ConvertTo-Json -Depth 8
        Invoke-WebRequest -UseBasicParsing -Method POST -Uri $postJobUri -Headers $headers -ContentType "application/json" -Body $singleJob -ErrorAction Stop | Out-Null
      }
      $created += ($end - $start + 1)
    }

    Write-Host "Seeded $created/$RecordCount jobs..."
  }

  Write-Output "Seed completed. Total records requested: $RecordCount"
  exit
}

if ($Action -eq "list") {
  Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/ahrm/v3/jobs/test/seeded/$PostedBy/$TestTag" -Headers $headers | Select-Object -ExpandProperty Content
  exit
}

$cleanupPayload = @{ postedBy = $PostedBy }
if ($JobIds) {
  $cleanupPayload.jobIds = $JobIds.Split(",") | ForEach-Object { [long]($_.Trim()) }
} else {
  $cleanupPayload.testTag = $TestTag
}

$cleanupBody = $cleanupPayload | ConvertTo-Json -Depth 4
Invoke-WebRequest -UseBasicParsing -Method POST -Uri "$BaseUrl/api/ahrm/v3/jobs/test/cleanup" -Headers $headers -ContentType "application/json" -Body $cleanupBody | Select-Object -ExpandProperty Content