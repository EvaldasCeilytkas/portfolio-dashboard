@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================================
echo  EVALDO IR RIMOS PORTFELIU ATNAUJINIMAS IR PUBLIKAVIMAS
echo ================================================================
echo.

echo [1/3] Atnaujinamas Evaldo portfelis...
python scripts\update_all.py
if errorlevel 1 (
  echo.
  echo KLAIDA: Evaldo portfelio atnaujinti nepavyko.
  goto failed
)

echo.
echo [2/3] Atnaujinamas Rimos Dashboard...
python scripts\import_rima_dashboard.py
if errorlevel 1 (
  echo.
  echo KLAIDA: Rimos Dashboard atnaujinti nepavyko.
  goto failed
)

echo.
echo [3/3] Kuriamas build, pakeitimai keliami i GitHub...
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
echo GitHub Actions dabar paleis deploy.
echo GitHub Pages gali atsinaujinti per 1-3 minutes.
echo.
pause
exit /b 0

:failed
echo.
echo ================================================================
echo  ATNAUJINIMAS ARBA PUBLIKAVIMAS NEPAVYKO
echo ================================================================
echo.
pause
exit /b 1
