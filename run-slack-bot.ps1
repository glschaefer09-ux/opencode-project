$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$slackDir = Join-Path $root "slack-code-workflow/node"

Write-Host "Starting Slack bot..." -ForegroundColor Cyan
Push-Location $slackDir
try {
  npm run dev
}
finally {
  Pop-Location
}
