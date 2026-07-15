param(
  [string]$CostData = "budget-workflow/sample-costs.json"
)

$script:ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Load env vars from root .env
$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*(\w+)=(.*)$") {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
  }
}

Write-Host "=== Budget Analysis ===" -ForegroundColor Cyan
Write-Host "Cost data: $CostData`n"

Push-Location (Join-Path $root "budget-workflow")
try {
  node analyze.mjs $CostData

  $reportPath = Join-Path $root "budget-workflow/budget-report.md"
  if (Test-Path $reportPath) {
    Write-Host "`n=== Report ===" -ForegroundColor Green
    Get-Content $reportPath -Tail 30
  }

  # Slack notification
  $slackUrl = [Environment]::GetEnvironmentVariable("SLACK_WEBHOOK_URL")
  $slackMsg = Join-Path $root "budget-workflow/slack-message.txt"
  if ($slackUrl -and (Test-Path $slackMsg)) {
    $msg = Get-Content $slackMsg -Raw
    $body = @{ text = $msg } | ConvertTo-Json
    Invoke-RestMethod -Uri $slackUrl -Method Post -Body $body -ContentType "application/json"
    Write-Host "`nSlack notification sent" -ForegroundColor Green
  }
}
finally {
  Pop-Location
}
