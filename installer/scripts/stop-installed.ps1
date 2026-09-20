param([switch]$Silent)
$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
$runtime = [System.IO.Path]::GetFullPath((Join-Path $root 'runtime\node.exe'))
$stateDir = Join-Path $env:LOCALAPPDATA 'SS220 Binding'
$pidFile = Join-Path $stateDir 'server.pid'
$portFile = Join-Path $stateDir 'server.port'
$messages = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'messages.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$stopped = $false
$processIds = @()

if (Test-Path -LiteralPath $pidFile) {
  $savedPid = [int](Get-Content -LiteralPath $pidFile -Raw)
  $processIds += $savedPid
  Remove-Item -LiteralPath $pidFile -Force
}
Remove-Item -LiteralPath $portFile -Force -ErrorAction SilentlyContinue

$installedServers = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
  $_.ExecutablePath -and [System.IO.Path]::GetFullPath($_.ExecutablePath) -ieq $runtime -and $_.CommandLine -match 'server[\\/]index\.js.+--production'
}
$processIds += $installedServers.ProcessId

foreach ($processId in ($processIds | Select-Object -Unique)) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId"
  if ($process -and $process.ExecutablePath -and [System.IO.Path]::GetFullPath($process.ExecutablePath) -ieq $runtime) {
    Stop-Process -Id $processId -Force
    $stopped = $true
  }
}

if ($stopped -and -not $Silent) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show($messages.stopped, 'SS220 Binding', 'OK', 'Information') | Out-Null
}
