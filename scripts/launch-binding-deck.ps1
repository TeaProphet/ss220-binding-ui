$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$port = 3141
$url = "http://127.0.0.1:$port"

function Test-BindingDeck {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$url/api/bindings" -TimeoutSec 2
    $payload = $response.Content | ConvertFrom-Json
    return $response.StatusCode -eq 200 -and $payload.schemaVersion -eq 2
  } catch { return $false }
}

function Test-BuildIsCurrent {
  $distIndex = Join-Path $root 'dist/index.html'
  if (-not (Test-Path -LiteralPath $distIndex)) { return $false }
  $builtAt = (Get-Item -LiteralPath $distIndex).LastWriteTimeUtc
  $inputs = @(
    Get-ChildItem -LiteralPath (Join-Path $root 'src') -Recurse -File
    Get-ChildItem -LiteralPath (Join-Path $root 'shared') -Recurse -File
    Get-Item -LiteralPath (Join-Path $root 'index.html')
    Get-Item -LiteralPath (Join-Path $root 'package-lock.json')
  )
  return -not ($inputs | Where-Object { $_.LastWriteTimeUtc -gt $builtAt } | Select-Object -First 1)
}

if (-not (Test-BuildIsCurrent)) {
  Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','build' -WorkingDirectory $root -Wait -WindowStyle Hidden
}

if (-not (Test-BindingDeck)) {
  $pidFile = Join-Path $root '.binding-deck.pid'
  if (Test-Path -LiteralPath $pidFile) {
    $savedPid = [int](Get-Content -LiteralPath $pidFile -Raw)
    $staleProcess = Get-Process -Id $savedPid -ErrorAction SilentlyContinue
    if ($staleProcess) {
      Stop-Process -Id $savedPid -Force
      $staleProcess.WaitForExit()
    }
  }
  $server = Start-Process -FilePath 'node.exe' -ArgumentList 'server/index.js','--production' -WorkingDirectory $root -WindowStyle Hidden -PassThru
  Set-Content -LiteralPath (Join-Path $root '.binding-deck.pid') -Value $server.Id -NoNewline
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 250
    if (Test-BindingDeck) { break }
  }
}

if (Test-BindingDeck) {
  Start-Process $url
} else {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show("SS220 Binding не удалось запустить на порту $port. Проверьте Node.js и server/index.js.", 'SS220 Binding', 'OK', 'Error') | Out-Null
  exit 1
}
