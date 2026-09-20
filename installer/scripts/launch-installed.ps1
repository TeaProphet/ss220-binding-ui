param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root 'runtime\node.exe'
$serverEntry = Join-Path $root 'server\index.js'
$stateDir = Join-Path $env:LOCALAPPDATA 'SS220 Binding'
$pidFile = Join-Path $stateDir 'server.pid'
$portFile = Join-Path $stateDir 'server.port'
$logDir = Join-Path $stateDir 'logs'
$messages = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'messages.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$port = 0
$url = ''

function Test-SS220Binding {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$url/api/bindings" -TimeoutSec 2
    $payload = $response.Content | ConvertFrom-Json
    return $response.StatusCode -eq 200 -and $payload.schemaVersion -eq 2
  } catch {
    return $false
  }
}

function Test-PortAvailable([int]$candidate) {
  $listener = $null
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    if ($listener) { $listener.Stop() }
  }
}

function Show-LaunchError([string]$message) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show($message, 'SS220 Binding', 'OK', 'Error') | Out-Null
}

try {
  if (-not (Test-Path -LiteralPath $runtime) -or -not (Test-Path -LiteralPath $serverEntry)) {
    throw $messages.damaged
  }

  New-Item -ItemType Directory -Path $stateDir,$logDir -Force | Out-Null
  if (Test-Path -LiteralPath $pidFile) {
    $savedPid = [int](Get-Content -LiteralPath $pidFile -Raw)
    $staleProcess = Get-Process -Id $savedPid -ErrorAction SilentlyContinue
    if ($staleProcess -and (Test-Path -LiteralPath $portFile)) {
      $port = [int](Get-Content -LiteralPath $portFile -Raw)
      $url = "http://127.0.0.1:$port"
      if (Test-SS220Binding) {
        if (-not $NoBrowser) { Start-Process $url }
        exit 0
      }
    }
    if (-not $staleProcess) {
      Remove-Item -LiteralPath $pidFile -Force
      Remove-Item -LiteralPath $portFile -Force -ErrorAction SilentlyContinue
    }
  }

  foreach ($candidate in 3141..3150) {
    if (Test-PortAvailable $candidate) {
      $port = $candidate
      break
    }
  }
  if (-not $port) { throw $messages.noPort }
  $url = "http://127.0.0.1:$port"
  $env:PORT = [string]$port

  $stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
  $server = Start-Process -FilePath $runtime -ArgumentList 'server/index.js','--production' -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir "$stamp-out.log") -RedirectStandardError (Join-Path $logDir "$stamp-error.log")
  Set-Content -LiteralPath $pidFile -Value $server.Id -NoNewline
  Set-Content -LiteralPath $portFile -Value $port -NoNewline

  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 250
    if (Test-SS220Binding) {
      if (-not $NoBrowser) { Start-Process $url }
      exit 0
    }
    if ($server.HasExited) { break }
  }

  throw ($messages.launchFailed -f $port, $logDir)
} catch {
  Show-LaunchError $_.Exception.Message
  exit 1
}
