$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "COMMON IMPORT FRAMEWORK ROLLBACK V1" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

$removeFiles = @(
    "scripts\brokers\import_seb_mikro.py",
    "scripts\brokers\import_seb_fondai.py",
    "scripts\brokers\import_seb_robo.py",
    "scripts\brokers\import_revolut_brokerage.py",
    "scripts\brokers\import_revolut_robo.py",
    "scripts\common\legacy_broker_adapter.py"
)

foreach ($relativePath in $removeFiles) {
    $fullPath = Join-Path $projectRoot $relativePath

    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "Pašalinta: $relativePath" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Paliekamas tik naujas Synergy importeris." -ForegroundColor Green
Write-Host "Kiti brokeriai vėl bus paleidžiami per seną build_portfolio.py logiką." -ForegroundColor Green
Write-Host ""
Write-Host "Dabar paleiskite:" -ForegroundColor Cyan
Write-Host "python scripts/build_portfolio.py"
