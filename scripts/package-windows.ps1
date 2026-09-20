param(
  [string]$Version,
  [string]$NodeVersion
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$installerRoot = Join-Path $projectRoot 'installer'
$stageRoot = Join-Path $installerRoot '.stage'
$releaseRoot = Join-Path $projectRoot 'release'
$stageResolvedParent = [System.IO.Path]::GetFullPath($installerRoot).TrimEnd('\')
$stageResolved = [System.IO.Path]::GetFullPath($stageRoot)

if (-not $stageResolved.StartsWith("$stageResolvedParent\", [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Unsafe staging path: $stageResolved"
}

if (-not $Version) {
  $Version = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
}
if (-not $NodeVersion) {
  $NodeVersion = (& node -p "process.versions.node").Trim()
}
$Version = $Version.TrimStart('v')
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
  throw "Invalid installer version: $Version"
}
if ($NodeVersion -notmatch '^\d+\.\d+\.\d+$') {
  throw "Invalid Node.js version: $NodeVersion"
}

Push-Location $projectRoot
try {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'Failed to build the client application.' }

  if (Test-Path -LiteralPath $stageResolved) {
    Remove-Item -LiteralPath $stageResolved -Recurse -Force
  }
  New-Item -ItemType Directory -Path $stageResolved,$releaseRoot -Force | Out-Null

  Copy-Item -LiteralPath (Join-Path $projectRoot 'package.json'),(Join-Path $projectRoot 'package-lock.json') -Destination $stageResolved
  $productionPaths = @(& npm.cmd ls --omit=dev --all --parseable)
  if ($LASTEXITCODE -ne 0) { throw 'Failed to resolve production dependencies. Run npm ci first.' }
  $sourceModules = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'node_modules')).TrimEnd('\')
  $stageModules = Join-Path $stageResolved 'node_modules'
  $clientOnlyPackages = @('lucide-react','react','react-dom','scheduler')
  New-Item -ItemType Directory -Path $stageModules -Force | Out-Null
  foreach ($sourcePath in $productionPaths) {
    $sourcePath = [System.IO.Path]::GetFullPath($sourcePath).TrimEnd('\')
    if (-not $sourcePath.StartsWith("$sourceModules\", [System.StringComparison]::OrdinalIgnoreCase)) { continue }
    $relativePath = $sourcePath.Substring($sourceModules.Length + 1)
    if ($relativePath -match '[\\/]node_modules[\\/]') { continue }
    if ($clientOnlyPackages -contains ($relativePath -split '[\\/]')[0]) { continue }
    $destinationPath = Join-Path $stageModules $relativePath
    New-Item -ItemType Directory -Path (Split-Path -Parent $destinationPath) -Force | Out-Null
    Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Recurse
  }

  foreach ($directory in @('dist','server','shared','resources')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $directory) -Destination $stageResolved -Recurse
  }
  Copy-Item -LiteralPath (Join-Path $installerRoot 'scripts') -Destination $stageResolved -Recurse
  Copy-Item -LiteralPath (Join-Path $projectRoot 'public\binding-deck.ico') -Destination $stageResolved

  $downloadRoot = Join-Path $env:TEMP "ss220-binding-node-$NodeVersion"
  $archiveName = "node-v$NodeVersion-win-x64.zip"
  $archive = Join-Path $downloadRoot $archiveName
  $checksumFile = Join-Path $downloadRoot 'SHASUMS256.txt'
  $expanded = Join-Path $downloadRoot 'expanded'
  if (Test-Path -LiteralPath $downloadRoot) {
    $resolvedDownload = [System.IO.Path]::GetFullPath($downloadRoot)
    $resolvedTemp = [System.IO.Path]::GetFullPath($env:TEMP).TrimEnd('\')
    if (-not $resolvedDownload.StartsWith("$resolvedTemp\", [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Unsafe temporary Node.js path: $resolvedDownload"
    }
    if (Test-Path -LiteralPath $expanded) {
      Remove-Item -LiteralPath $expanded -Recurse -Force
    }
  }
  New-Item -ItemType Directory -Path $downloadRoot,$expanded -Force | Out-Null
  if (-not (Test-Path -LiteralPath $archive)) {
    Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip" -OutFile $archive
  }
  if (-not (Test-Path -LiteralPath $checksumFile)) {
    Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/v$NodeVersion/SHASUMS256.txt" -OutFile $checksumFile
  }
  $checksumList = Get-Content -LiteralPath $checksumFile -Raw
  $checksumLine = $checksumList -split "`n" | Where-Object { $_.Trim().EndsWith("  $archiveName") } | Select-Object -First 1
  if (-not $checksumLine) { throw "Checksum not found for $archiveName." }
  $expectedChecksum = ($checksumLine.Trim() -split '\s+')[0]
  $archiveStream = [System.IO.File]::OpenRead($archive)
  try {
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
      $actualChecksum = [System.BitConverter]::ToString($sha256.ComputeHash($archiveStream)).Replace('-', '').ToLowerInvariant()
    } finally {
      $sha256.Dispose()
    }
  } finally {
    $archiveStream.Dispose()
  }
  if ($actualChecksum -ne $expectedChecksum.ToLowerInvariant()) {
    throw 'The downloaded Node.js checksum does not match.'
  }
  Expand-Archive -LiteralPath $archive -DestinationPath $expanded
  $nodeRoot = Join-Path $expanded "node-v$NodeVersion-win-x64"
  $runtimeRoot = Join-Path $stageResolved 'runtime'
  New-Item -ItemType Directory -Path $runtimeRoot | Out-Null
  Copy-Item -LiteralPath (Join-Path $nodeRoot 'node.exe') -Destination $runtimeRoot
  Copy-Item -LiteralPath (Join-Path $nodeRoot 'LICENSE') -Destination (Join-Path $runtimeRoot 'NODE-LICENSE.txt')

  $isccCandidates = @(
    $env:ISCC_PATH,
    (Get-Command ISCC.exe -ErrorAction SilentlyContinue).Source,
    (Join-Path ${env:ProgramFiles(x86)} 'Inno Setup 6\ISCC.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\Inno Setup 6\ISCC.exe')
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
  $iscc = $isccCandidates | Select-Object -First 1
  if (-not $iscc -or -not (Test-Path -LiteralPath $iscc)) {
    throw 'Inno Setup 6 was not found. Install it or set ISCC_PATH.'
  }
  & $iscc "/DMyAppVersion=$Version" (Join-Path $installerRoot 'SS220Binding.iss')
  if ($LASTEXITCODE -ne 0) { throw 'Inno Setup failed to create the installer.' }

  Write-Host "Installer created: $(Join-Path $releaseRoot "SS220-Binding-Setup-$Version.exe")"
} finally {
  Pop-Location
}
