@echo off
rem Uses the PowerShell 7 path recorded by install-schedule.ps1. No token arguments.
powershell.exe -NoProfile -Command "$ErrorActionPreference='Stop'; $repo=Split-Path -Parent '%~dp0'; $config=Get-Content -Raw (Join-Path $repo '.puddle-agent\scheduler.json') | ConvertFrom-Json; & $config.pwsh -NoProfile -File (Join-Path $repo 'automation\publisher-credential.ps1') -Action Set; exit $LASTEXITCODE"
pause
