$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Portfolio V2.1 platformu registro patikra" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\scripts\validate_platform_registry.py")) {
    Write-Host "KLAIDA: paleiskite faila portfolio-v2 aplanke." -ForegroundColor Red
    exit 1
}

python .\scripts\validate_platform_registry.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "Registro patikra nepavyko." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Registro patikra baigta sekmingai." -ForegroundColor Green
