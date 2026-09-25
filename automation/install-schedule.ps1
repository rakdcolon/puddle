param([ValidatePattern('^([01]\d|2[0-3]):[0-5]\d$')][string]$At = '19:00')
$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'Windows PowerShell 7 is required.' }
$repo = Split-Path $PSScriptRoot -Parent
$state = Join-Path $repo '.puddle-agent'
New-Item -ItemType Directory -Force $state | Out-Null
$config = @{
  pwsh = (Get-Process -Id $PID).Path
  node = (Get-Command node.exe -ErrorAction Stop).Source
  pi = (Get-Command pi.cmd -ErrorAction Stop).Source
  ollama = (Get-Command ollama.exe -ErrorAction Stop).Source
}
$config | ConvertTo-Json | Set-Content (Join-Path $state 'scheduler.json')
$action = New-ScheduledTaskAction -Execute $config.pwsh -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -File "' + (Join-Path $PSScriptRoot 'scheduled-run.ps1') + '"') -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 7) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName 'Puddle Daily Draft' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Find one local puzzle draft for human review. No GitHub publishing or production access.' -Force | Out-Null
Write-Output "Puddle Daily Draft installed for $At ($(Get-TimeZone | Select-Object -ExpandProperty Id)). Runs while this Windows user is signed in; missed runs start when available."
