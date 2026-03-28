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

  [string]$JobIds
)

$headers = @{ Authorization = "Bearer $Token" }

if ($Action -eq "seed") {
  $payload = @{
    postedBy = $PostedBy
    testTag = $TestTag
    jobs = @(
      @{
        title = "Seeded Platform Operations Lead"
        company = "AfroHR Labs"
        location = "Lagos"
        salary = "125000"
        description = "Seeded helper job for manual employer card checks."
        department = "Research & Development"
        role = "Platform Operations Lead"
        experience = "5-10yrs"
        employmentType = "Full Time, Permanent"
        industry = "Technology"
        workMode = "Hybrid"
        currency = "USD"
        vacancies = 2
        skills = "Platform,Operations,SRE"
        jobStatus = "ACTIVE"
      },
      @{
        title = "Seeded Curriculum Strategist"
        company = "AfroHR Academy"
        location = "Accra"
        salary = "91000"
        description = "Seeded helper draft job for employer card checks."
        department = "Teaching & Training"
        role = "Curriculum Strategist"
        experience = "Intermediate"
        employmentType = "Part Time, Permanent"
        industry = "Education / Training"
        workMode = "Remote"
        currency = "USD"
        vacancies = 3
        skills = "Curriculum,Research,Figma"
        jobStatus = "DRAFT"
      }
    )
  } | ConvertTo-Json -Depth 6

  Invoke-WebRequest -UseBasicParsing -Method POST -Uri "$BaseUrl/api/ahrm/v3/jobs/test/seed" -Headers $headers -ContentType "application/json" -Body $payload | Select-Object -ExpandProperty Content
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