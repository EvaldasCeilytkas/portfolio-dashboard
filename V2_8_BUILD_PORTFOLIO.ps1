$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Portfolio V2.8 - 1 grupes importas ir portfolio.json" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path ".\V2_7_TEST_GROUP1.ps1") {
    powershell -ExecutionPolicy Bypass -File ".\V2_7_TEST_GROUP1.ps1"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "1 grupes importas nepavyko." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}
else {
    Write-Host "KLAIDA: nerastas V2_7_TEST_GROUP1.ps1." -ForegroundColor Red
    exit 1
}

python ".\scripts\build_portfolio.py"

if ($LASTEXITCODE -ne 0) {
    Write-Host "portfolio.json sukurti nepavyko." -ForegroundColor Red
    exit $LASTEXITCODE
}

python ".\scripts\validate_portfolio_data.py" `
    ".\public\data\portfolio.json"

if ($LASTEXITCODE -ne 0) {
    Write-Host "portfolio.json patikra nepavyko." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "V2.8 baigtas sekmingai." -ForegroundColor Green
