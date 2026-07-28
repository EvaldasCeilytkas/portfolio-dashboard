@echo off
setlocal
title Portfolio Analytics - Update and Publish
color 0A

cd /d "%~dp0"

echo.
echo =============================================================
echo        PORTFOLIO ANALYTICS - UPDATE AND PUBLISH
echo =============================================================
echo.
echo Project folder:
echo %CD%
echo.

if not exist "scripts\publish.py" (
    color 0C
    echo ERROR: Nerastas failas scripts\publish.py
    echo.
    echo Idek si BAT faila i portfolio-react pagrindini aplanka:
    echo C:\Users\evald\OneDrive\Dokumentai\portfolio-analytics\portfolio-react
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
    echo Patikrink, ar Python idiegtas ir pazymetas "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

echo Naudojama Python komanda: %PYTHON_CMD%
%PYTHON_CMD% --version
echo.
echo Paleidziamas scripts\publish.py...
echo.

%PYTHON_CMD% "scripts\publish.py"
set "RESULT=%ERRORLEVEL%"

echo.
if "%RESULT%"=="0" (
    color 0A
    echo =============================================================
    echo SUCCESS: Portfelis atnaujintas ir ikeltas i GitHub.
    echo =============================================================
    echo.
    echo Atidaromas puslapis...
    start "" "https://evaldasceilytkas.github.io/portfolio-analytics/"
) else (
    color 0C
    echo =============================================================
    echo ERROR: publish.py baige darba su klaida %RESULT%.
    echo Perziurek klaidos teksta auksciau.
    echo =============================================================
)

echo.
echo Paspausk bet kuri klavisa, kad uzdarytum langa.
pause >nul
exit /b %RESULT%
