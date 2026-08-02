@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title Portfolio Dashboard - Visu portfeliu atnaujinimas
color 0A
cd /d "%~dp0"

echo ================================================================
echo          VISU PORTFELIU ATNAUJINIMAS IR PUBLIKAVIMAS
echo ================================================================
echo.
echo Projekto aplankas:
echo %CD%
echo.

rem ---------------------------------------------------------------
rem Python komandos parinkimas: pirmiausia py, tada python
rem ---------------------------------------------------------------
where py >nul 2>&1
if not errorlevel 1 (
    set "PYTHON=py"
) else (
    where python >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON=python"
    ) else (
        echo KLAIDA: Kompiuteryje nerasta Python komanda.
        echo.
        echo Patikrinkite, ar Python idiegtas ir pazymeta:
        echo "Add Python to PATH".
        goto failed
    )
)

echo Naudojama Python komanda: %PYTHON%
echo.

rem ---------------------------------------------------------------
rem Tikrinami svarbiausi failai
rem ---------------------------------------------------------------
for %%F in (
    "scripts\update_all.py"
    "scripts\import_rima_dashboard.py"
    "scripts\import_rima_portfolio.py"
    "scripts\update_gerda.py"
    "scripts\generate_sync_status.py"
    "scripts\publish_dashboard.py"
) do (
    if not exist %%F (
        echo KLAIDA: Nerastas failas %%F
        goto failed
    )
)

echo [1/6] Atnaujinamas Evaldo portfelis...
%PYTHON% "scripts\update_all.py"
if errorlevel 1 (
    echo.
    echo KLAIDA [1/6]: Evaldo portfelio atnaujinti nepavyko.
    goto failed
)

echo.
echo [2/6] Atnaujinamas Rimos Dashboard...
%PYTHON% "scripts\import_rima_dashboard.py"
if errorlevel 1 (
    echo.
    echo KLAIDA [2/6]: Rimos Dashboard atnaujinti nepavyko.
    goto failed
)

echo.
echo [3/6] Atnaujinamas visas Rimos portfelis...
%PYTHON% "scripts\import_rima_portfolio.py"
if errorlevel 1 (
    echo.
    echo KLAIDA [3/6]: Rimos portfelio atnaujinti nepavyko.
    goto failed
)

echo.
echo [4/6] Atnaujinamas Gerdos portfelis...
%PYTHON% "scripts\update_gerda.py"
if errorlevel 1 (
    echo.
    echo KLAIDA [4/6]: Gerdos portfelio atnaujinti nepavyko.
    goto failed
)

echo.
echo [5/6] Generuojama Sync Center ataskaita...
%PYTHON% "scripts\generate_sync_status.py"
if errorlevel 1 (
    echo.
    echo KLAIDA [5/6]: Sync Center ataskaitos sugeneruoti nepavyko.
    goto failed
)

echo.
echo [6/6] Kuriamas build ir publikuojama i GitHub...
%PYTHON% "scripts\publish_dashboard.py"
if errorlevel 1 (
    echo.
    echo KLAIDA [6/6]: Publikavimas i GitHub nepavyko.
    goto failed
)

echo.
echo ================================================================
echo       VISI PORTFELIAI SEKMINGAI ATNAUJINTI
echo ================================================================
echo.
echo   Evaldas     - OK
echo   Rima        - OK
echo   Gerda       - OK
echo   Sync Center - OK
echo   GitHub      - OK
echo.
echo Duomenys GitHub Pages puslapyje gali atsinaujinti per 1-3 minutes.
echo.
goto finish

:failed
color 0C
echo.
echo ================================================================
echo                 ATNAUJINIMAS NEPAVYKO
echo ================================================================
echo.
echo Langas paliekamas atidarytas, kad matytumete klaidos pranesima.
echo Nukopijuokite arba nufotografuokite paskutines eilutes.
echo.

:finish
echo Paspauskite bet kuri klavisa, kad uzdarytumete si langa.
pause >nul
endlocal
exit /b
