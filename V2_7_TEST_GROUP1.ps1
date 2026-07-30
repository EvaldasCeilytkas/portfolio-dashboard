$ErrorActionPreference = "Stop"

$items = @(
    "crowdpear",
    "profitus",
    "rontgen",
    "nordstreet"
)

foreach ($item in $items) {
    Write-Host ""
    Write-Host "Importuojama: $item" -ForegroundColor Cyan

    python ".\scripts\import_$item.py"

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    if (Test-Path ".\scripts\validate_platform_data.py") {
        python ".\scripts\validate_platform_data.py" `
            ".\public\data\platforms\$item.json"

        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
}

Write-Host ""
Write-Host "V2.7: visa 1 grupe importuota sekmingai." -ForegroundColor Green
