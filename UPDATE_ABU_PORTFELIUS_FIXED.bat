@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================================
echo  EVALDO IR RIMOS PORTFELIU ATNAUJINIMAS
echo ================================================================
echo.

echo [1/2] Atnaujinamas Evaldo portfelis...
python scripts\update_all.py

if errorlevel 1 (
  echo.
  echo KLAIDA: Evaldo portfelio atnaujinti nepavyko.
  echo Rimos atnaujinimas nebuvo paleistas.
  pause
  exit /b 1
)

echo.
echo [OK] Evaldo portfelis atnaujintas.
echo.

echo [2/2] Atnaujinamas Rimos Dashboard...
python scripts\import_rima_dashboard.py

if errorlevel 1 (
  echo.
  echo KLAIDA: Rimos Dashboard atnaujinti nepavyko.
  echo Evaldo duomenys jau buvo atnaujinti.
  pause
  exit /b 1
)

echo.
echo ================================================================
echo  ABU PORTFELIAI ATNAUJINTI SEKMEINGAI
echo ================================================================
echo.
echo Atnaujinta:
echo  - Evaldo visas portfelis ir platformos
echo  - Rimos pagrindinis Dashboard
echo.
echo Dabar ikelk pakeitimus i GitHub ir palauk deploy.
echo.
pause
