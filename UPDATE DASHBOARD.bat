@echo off
setlocal
title Portfolio Analytics - Update and Publish
color 0A

cd /d "%~dp0"

echo.
echo =============================================================
echo      PORTFOLIO ANALYTICS - UPDATE AND PUBLISH
echo =============================================================
echo.
echo Project folder:
echo %CD%
echo.

if not exist "scripts\update_all.py" (
    color 0C
    echo ERROR: Nerastas failas scripts\update_all.py
    echo.
    pause
    exit /b 1
)

if not exist "scripts\publish_dashboard.py" (
    color 0C
    echo ERROR: Nerastas failas scripts\publish_dashboard.py
    echo.
    pause
    exit /b 1
)

set "PYTHON_CMD="

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=python"
) else (
    where py >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "PYTHON_CMD=py"
    )
)

if not defined PYTHON_CMD (
    color 0C
    echo ERROR: Windows nerado Python komandos.
    echo.
    pause
    exit /b 1
)

echo =============================================================
echo 1/2 - Atnaujinami visi portfelio duomenys
echo =============================================================
echo.

%PYTHON_CMD% "scripts\update_all.py"
set "UPDATE_RESULT=%ERRORLEVEL%"

if not "%UPDATE_RESULT%"=="0" (
    color 0C
    echo.
    echo =============================================================
    echo ERROR: Duomenu atnaujinimas nepavyko.
    echo Publikavimas nebus vykdomas.
    echo =============================================================
    echo.
    pause
    exit /b %UPDATE_RESULT%
)

echo.
echo =============================================================
echo 2/2 - React build, Git commit ir Git push
echo =============================================================
echo.

%PYTHON_CMD% "scripts\publish_dashboard.py"
set "PUBLISH_RESULT=%ERRORLEVEL%"

echo.
if "%PUBLISH_RESULT%"=="0" (
    color 0A
    echo =============================================================
    echo SUCCESS: Dashboard atnaujintas ir publikuotas.
    echo =============================================================
) else (
    color 0C
    echo =============================================================
    echo ERROR: Publikavimas nepavyko.
    echo Perziurek klaidos teksta auksciau.
    echo =============================================================
)

echo.
echo Paspausk bet kuri klavisa, kad uzdarytum langa.
pause >nul
exit /b %PUBLISH_RESULT%
