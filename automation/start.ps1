param([switch]$Once, [string]$Prompt = 'Find and prepare one puzzle for review.', [ValidateRange(30,1800)][int]$MaxSeconds = 300)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$profileDir = Join-Path $repo '.puddle-agent/pi'
New-Item -ItemType Directory -Force $profileDir | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'models.json') -Destination (Join-Path $profileDir 'models.json') -Force
# Launch with a minimal environment: do not pass GitHub, Supabase or cloud-model credentials.
$piCommand = (Get-Command pi.cmd -ErrorAction Stop).Source
$launcher = Join-Path (Split-Path $piCommand -Parent) 'pi-launcher.js'
if (-not (Test-Path -LiteralPath $launcher)) { throw 'This launcher expects the managed Pi installation (pi-launcher.js beside pi.cmd).' }
$info = [System.Diagnostics.ProcessStartInfo]::new()
$info.FileName = (Get-Command node.exe).Source
$info.WorkingDirectory = $profileDir
$info.UseShellExecute = $false
$info.Environment.Clear()
foreach ($key in @('PATH','SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','COMSPEC','PATHEXT')) {
  $value = [Environment]::GetEnvironmentVariable($key)
  if ($value) { $info.Environment[$key] = $value }
}
$info.Environment['PI_CODING_AGENT_DIR'] = $profileDir
$info.Environment['PI_OFFLINE'] = '1'
$info.Environment['PI_TELEMETRY'] = '0'
foreach ($arg in @($launcher,'--provider','ollama','--model','qwen3.8:27b','--no-builtin-tools','--no-extensions','--no-skills','--no-prompt-templates','--no-themes','--no-context-files','--extension',(Join-Path $PSScriptRoot 'extension.ts'),'--tools','puddle_archive,puddle_search,puddle_read,puddle_save_draft','--system-prompt',(Get-Content -Raw (Join-Path $PSScriptRoot 'SYSTEM.md')))) {
  $info.ArgumentList.Add($arg)
}
if ($Once) { $info.ArgumentList.Add('--print') }
$info.ArgumentList.Add('--')
$info.ArgumentList.Add($Prompt)
$process = [System.Diagnostics.Process]::Start($info)
if ($Once) {
  if (-not $process.WaitForExit($MaxSeconds * 1000)) {
    $process.Kill($true)
    $process.WaitForExit()
    Write-Error "Curator exceeded ${MaxSeconds}s and was stopped. Inspect the queue before retrying; a draft may already have been saved."
    exit 124
  }
} else { $process.WaitForExit() }
exit $process.ExitCode
