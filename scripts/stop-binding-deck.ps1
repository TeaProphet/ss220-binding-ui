$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $root '.binding-deck.pid'
$processIds = @()

if (Test-Path $pidFile) {
  $savedPid = [int](Get-Content -LiteralPath $pidFile -Raw)
  if (Get-Process -Id $savedPid -ErrorAction SilentlyContinue) { $processIds += $savedPid }
}

$listeners = Get-NetTCPConnection -LocalPort 3141 -State Listen
foreach ($listener in $listeners) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
  if ($process.CommandLine -match 'server[\\/]index\.js') { $processIds += $listener.OwningProcess }
}

$processIds = $processIds | Select-Object -Unique
foreach ($processId in $processIds) { Stop-Process -Id $processId -Force }
Remove-Item -LiteralPath $pidFile -Force

if ($processIds.Count -gt 0) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show('SS220 Binding остановлен.', 'SS220 Binding', 'OK', 'Information') | Out-Null
}
