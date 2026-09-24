$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$slackDir = Join-Path $root "slack-code-workflow/node"

$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*(\w+)=(.*)$") {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
  }
}

if (-not $env:GH_TOKEN -and $env:GITHUB_TOKEN) {
  $env:GH_TOKEN = $env:GITHUB_TOKEN
}
if (-not $env:GITHUB_TOKEN) {
  Write-Host "GITHUB_TOKEN not set - GitHub actions from Slack will fail. See GITHUB-TOKEN-SETUP.md" -ForegroundColor Yellow
}

if (-not (Test-Path $slackDir)) {
  Write-Host "Slack bot not found at $slackDir" -ForegroundColor Red
  exit 1
}

Write-Host "Starting Slack bot..." -ForegroundColor Cyan
Push-Location $slackDir
try {
  npm run dev
}
finally {
  Pop-Location
}
