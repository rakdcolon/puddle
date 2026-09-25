# Run by Windows Task Scheduler; never invokes the publisher.
param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$state = Join-Path $repo '.puddle-agent'
$config = Get-Content -Raw (Join-Path $state 'scheduler.json') | ConvertFrom-Json
$originalPath = $env:PATH
$env:PATH = ((@($config.node, $config.pi, $config.ollama) | ForEach-Object { Split-Path $_ -Parent }) -join ';') + ';' + $originalPath
$logs = Join-Path $state 'logs'
New-Item -ItemType Directory -Force $logs | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$log = Join-Path $logs "$stamp.log"
$code = 1
$before = $null
$after = $null
try {
  "Started $(Get-Date -Format o)" | Set-Content $log
  $before = @((& $config.node (Join-Path $PSScriptRoot 'operator.mjs') list 2>> $log) | ConvertFrom-Json -NoEnumerate)[0].Count
  if ($LASTEXITCODE -ne 0) { throw 'Cannot read draft queue.' }
  try { $models = Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5 }
  catch {
    Start-Process -FilePath $config.ollama -ArgumentList 'serve' -WindowStyle Hidden | Out-Null
    for ($attempt = 0; $attempt -lt 10; $attempt++) {
      Start-Sleep -Seconds 1
      try { $models = Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2; break } catch { }
    }
  }
  if ('qwen3.8:27b' -notin $models.models.name) { throw 'Ollama must serve qwen3.8:27b before running the curator.' }
  $assignment = 'Find and prepare one puzzle for review. Today in America/New_York is ' + [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTimeOffset]::UtcNow, 'Eastern Standard Time').ToString('yyyy-MM-dd') + '. Choose an unused future date, preferably at least three days ahead. Save at most one draft.'
  if ($CheckOnly) { $assignment = 'Call puddle_archive once and report the latest issue. Do not search, fetch or save a draft.' }
  & $config.pwsh -NoProfile -File (Join-Path $PSScriptRoot 'start.ps1') -Once -Prompt $assignment *> $log
  $code = $LASTEXITCODE
  $after = @((& $config.node (Join-Path $PSScriptRoot 'operator.mjs') list 2>> $log) | ConvertFrom-Json -NoEnumerate)[0].Count
} catch { $_.Exception.Message | Add-Content $log }
finally {
  @{ finished_at = (Get-Date -Format o); exit_code = $code; check_only = [bool]$CheckOnly; draft_count_before = $before; draft_count_after = $after; saved_new_draft = ($null -ne $after -and $null -ne $before -and $after -gt $before); log = $log } | ConvertTo-Json | Set-Content (Join-Path $state 'last-run.json')
}
exit $code
