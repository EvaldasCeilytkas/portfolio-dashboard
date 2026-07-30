$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Portfolio V2.5 - Rontgen importas" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\scripts\import_rontgen.py")) {
    Write-Host "KLAIDA: paleiskite faila portfolio-v2 aplanke." -ForegroundColor Red
    exit 1
}

python .\scripts\import_rontgen.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "Rontgen importas nepavyko." -ForegroundColor Red
    exit $LASTEXITCODE
}

if (Test-Path ".\scripts\validate_platform_data.py") {
    python .\scripts\validate_platform_data.py `
        .\public\data\platforms\rontgen.json

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Rontgen JSON neatitiko V2 schemos." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host ""
Write-Host "Rontgen importas baigtas sekmingai." -ForegroundColor Green
