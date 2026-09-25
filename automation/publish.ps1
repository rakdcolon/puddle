param([Parameter(Mandatory)][ValidatePattern('^[a-f0-9]{24}$')][string]$DraftId, [switch]$Apply, [switch]$Reviewed)
$ErrorActionPreference = 'Stop'
if ($Apply -and -not $Reviewed) { throw 'Review the draft first, then use -Apply -Reviewed.' }
$info = [Diagnostics.ProcessStartInfo]::new()
$info.FileName = (Get-Command node.exe -ErrorAction Stop).Source
$info.UseShellExecute = $false
$info.Environment.Remove('PUDDLE_PUBLISHER_TOKEN') | Out-Null
$credentialPath = Join-Path $env:LOCALAPPDATA 'Puddle/publisher.credential.xml'
if (Test-Path -LiteralPath $credentialPath) {
  $credential = Import-Clixml -LiteralPath $credentialPath
  $info.Environment['PUDDLE_PUBLISHER_TOKEN'] = $credential.GetNetworkCredential().Password
} elseif ($Apply) { throw 'Run publisher-credential.ps1 -Action Set first.' }
$info.ArgumentList.Add((Join-Path $PSScriptRoot 'publisher.mjs'))
$info.ArgumentList.Add($DraftId)
if ($Apply) { $info.ArgumentList.Add('--apply'); $info.ArgumentList.Add('--reviewed') }
try {
  $process = [Diagnostics.Process]::Start($info)
  $info.Environment.Remove('PUDDLE_PUBLISHER_TOKEN') | Out-Null
  $process.WaitForExit()
  exit $process.ExitCode
} finally { $info.Environment.Remove('PUDDLE_PUBLISHER_TOKEN') | Out-Null }
