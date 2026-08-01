@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================================
echo  RIMOS DASHBOARD ATNAUJINIMAS
echo ================================================================
echo.

python scripts\import_rima_dashboard.py

if errorlevel 1 (
  echo.
  echo KLAIDA: Rimos duomenu atnaujinti nepavyko.
  pause
  exit /b 1
)

echo.
echo Rimos Dashboard duomenys atnaujinti.
echo Dabar ikelk pakeitimus i GitHub ir palauk deploy.
echo.
pause
