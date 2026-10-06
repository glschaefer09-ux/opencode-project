$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$botDir = Join-Path $root "mattermost-workflow"

$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*(\w+)=(.*)$") {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
  }
}

if (-not $env:MATTERMOST_URL -or -not $env:MATTERMOST_BOT_TOKEN) {
  Write-Host "MATTERMOST_URL and MATTERMOST_BOT_TOKEN must be set in .env. See GITHUB-TOKEN-SETUP.md" -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path $botDir)) {
  Write-Host "Mattermost bot not found at $botDir" -ForegroundColor Red
  exit 1
}

Write-Host "Starting Mattermost bot..." -ForegroundColor Cyan
Push-Location $botDir
try {
  if (-not (Test-Path (Join-Path $botDir "node_modules"))) {
    npm install
  }
  npm run dev
}
finally {
  Pop-Location
}
