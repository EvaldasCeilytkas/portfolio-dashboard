$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Portfolio V2.0 setup" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\package.json")) {
    Write-Host "KLAIDA: paleiskite faila pagrindiniame portfolio-v2 aplanke." -ForegroundColor Red
    exit 1
}

Write-Host "Diegiama react-router-dom..." -ForegroundColor Yellow
npm install react-router-dom

if ($LASTEXITCODE -ne 0) {
    Write-Host "KLAIDA: nepavyko idiegti react-router-dom." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Priklausomybe idiegta." -ForegroundColor Green
Write-Host "Paleidziamas projektas..." -ForegroundColor Yellow
npm run dev
