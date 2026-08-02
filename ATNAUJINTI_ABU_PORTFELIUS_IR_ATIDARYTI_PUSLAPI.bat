@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================================
echo  ABIEJU PORTFELIU ATNAUJINIMAS IR PUBLIKAVIMAS
echo ================================================================
echo.

echo [1/4] Atnaujinamas Evaldo portfelis...
python scripts\update_all.py
if errorlevel 1 (
  echo.
  echo KLAIDA: Evaldo portfelio atnaujinti nepavyko.
  goto failed
)

echo.
echo [2/4] Atnaujinamas Rimos Dashboard...
python scripts\import_rima_dashboard.py
if errorlevel 1 (
  echo.
  echo KLAIDA: Rimos Dashboard atnaujinti nepavyko.
  goto failed
)

echo.
echo [3/4] Atnaujinamas visas Rimos portfelis...
python scripts\import_rima_portfolio.py
if errorlevel 1 (
  echo.
  echo KLAIDA: Rimos portfelio atnaujinti nepavyko.
  goto failed
)

echo.
echo [4/4] Kuriamas build, pakeitimai keliami i GitHub...
python scripts\publish_dashboard.py
if errorlevel 1 (
  echo.
  echo KLAIDA: Publikavimas i GitHub nepavyko.
  goto failed
)

echo.
echo ================================================================
echo  ABU PORTFELIAI ATNAUJINTI IR ISSIUSTI I GITHUB
echo ================================================================
echo.
echo GitHub Pages atidarytas narsykleje.
echo Duomenys gali galutinai atsinaujinti per 1-3 minutes.
echo.
pause
exit /b 0

:failed
echo.
echo ================================================================
echo  ATNAUJINIMAS ARBA PUBLIKAVIMAS NEPAVYKO
echo ================================================================
echo.
echo Patikrinkite auksciau parodyta klaidos pranesima.
echo.
pause
exit /b 1
