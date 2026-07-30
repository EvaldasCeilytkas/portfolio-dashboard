$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Portfolio V2.2.1 JSON schemos patikra" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\scripts\validate_platform_data.py")) {
    Write-Host "KLAIDA: paleiskite faila portfolio-v2 aplanke." -ForegroundColor Red
    exit 1
}

python .\scripts\validate_platform_data.py `
    .\public\data\examples\platform-example.json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Schemos patikra nepavyko." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "V2.2.1 schema patvirtinta." -ForegroundColor Green
