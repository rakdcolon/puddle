param([ValidateSet('Set','Status','Remove')][string]$Action = 'Status')
$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'Windows PowerShell 7 is required for encrypted credential storage.' }
$folder = Join-Path $env:LOCALAPPDATA 'Puddle'
$path = Join-Path $folder 'publisher.credential.xml'
switch ($Action) {
  'Set' {
    $secret = Read-Host 'Paste your fine-grained Puddle GitHub token (hidden)' -AsSecureString
    if ($secret.Length -eq 0) { throw 'Token cannot be empty.' }
    New-Item -ItemType Directory -Force $folder | Out-Null
    [PSCredential]::new('puddle-publisher', $secret) | Export-Clixml -LiteralPath $path
    $secret.Dispose()
    Write-Output 'Publisher token saved with Windows user-bound encryption. It has not been sent to GitHub yet.'
  }
  'Status' { if (Test-Path -LiteralPath $path) { $credential = Import-Clixml -LiteralPath $path; if ($credential -isnot [PSCredential]) { throw 'Invalid credential file.' }; Write-Output 'Publisher credential stored and decryptable for this Windows account (GitHub access not tested).' } else { Write-Output 'Publisher credential not configured.' } }
  'Remove' { if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path }; Write-Output 'Local publisher credential removed. Revoke it separately in GitHub settings.' }
}
