$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Portfolio V2.2.2 - realus Crowdpear JSON" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\scripts\create_crowdpear_v2.py")) {
    Write-Host "KLAIDA: paleiskite faila portfolio-v2 aplanke." -ForegroundColor Red
    exit 1
}

python .\scripts\create_crowdpear_v2.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "Crowdpear V2 failo sukurti nepavyko." -ForegroundColor Red
    exit $LASTEXITCODE
}

python .\scripts\validate_platform_data.py `
    .\public\data\platforms\crowdpear.json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Crowdpear V2 failas neatitiko schemos." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "V2.2.2 baigta sekmingai." -ForegroundColor Green
