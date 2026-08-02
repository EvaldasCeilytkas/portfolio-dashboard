@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo RIMOS PORTFELIO ATNAUJINIMAS V1.4
echo ============================================================
python scripts\import_rima_portfolio.py

if errorlevel 1 (
  echo.
  echo ATNAUJINIMAS NEPAVYKO.
  pause
  exit /b 1
)

echo.
echo Rimos portfelis atnaujintas sekmingai.
pause
