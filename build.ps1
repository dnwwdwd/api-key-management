$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$distDir = Join-Path $root "dist"
$seedWorkDir = Join-Path $root ".lpk-seed"
$seedDb = Join-Path $seedWorkDir "app.db"

if (Test-Path $distDir) {
  Remove-Item -LiteralPath $distDir -Recurse -Force
}
if (Test-Path $seedWorkDir) {
  Remove-Item -LiteralPath $seedWorkDir -Recurse -Force
}

New-Item -ItemType Directory -Path $distDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $distDir ".next") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $distDir "lzc") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $distDir "seed") | Out-Null
New-Item -ItemType Directory -Path $seedWorkDir | Out-Null

$standaloneDir = Join-Path $root ".next/standalone"
if (-not (Test-Path $standaloneDir)) {
  npm run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$env:DATABASE_FILE = $seedDb
npm run db:migrate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:DATABASE_FILE = $seedDb
$env:SEED_ADMIN_USERNAME = "admin"
$env:SEED_ADMIN_PASSWORD = "admin123456"
npm run db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Copy-Item -LiteralPath $seedDb -Destination (Join-Path $distDir "seed/app.db") -Force

Copy-Item -Path (Join-Path $root ".next/standalone/*") -Destination $distDir -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root ".next/static") -Destination (Join-Path $distDir ".next/static") -Recurse -Force

$publicDir = Join-Path $root "public"
if (Test-Path $publicDir) {
  Copy-Item -LiteralPath $publicDir -Destination (Join-Path $distDir "public") -Recurse -Force
}

Copy-Item -LiteralPath (Join-Path $root "lzc/run.sh") -Destination (Join-Path $distDir "lzc/run.sh") -Force

if (Test-Path $seedWorkDir) {
  Remove-Item -LiteralPath $seedWorkDir -Recurse -Force
}
