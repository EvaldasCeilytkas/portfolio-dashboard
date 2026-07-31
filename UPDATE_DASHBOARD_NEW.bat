@echo off
setlocal
title Portfolio Analytics - Update and Publish
color 0A

cd /d "%~dp0"

set "PYTHON_CMD="
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=python"
) else (
    where py >nul 2>&1
    if %ERRORLEVEL% EQU 0 set "PYTHON_CMD=py"
)

if not defined PYTHON_CMD (
    color 0C
    echo ERROR: Python nerastas.
    pause
    exit /b 1
)

if not exist "scripts\update_all.py" (
    echo ERROR: Nerastas scripts\update_all.py
    pause
    exit /b 1
)

if not exist "scripts\generate_platform_history.py" (
    echo ERROR: Nerastas scripts\generate_platform_history.py
    pause
    exit /b 1
)

if not exist "scripts\publish_dashboard.py" (
    echo ERROR: Nerastas scripts\publish_dashboard.py
    pause
    exit /b 1
)

echo.
echo ===== 1/3 Update portfolio =====
%PYTHON_CMD% scripts\update_all.py
if errorlevel 1 goto :err

echo.
echo ===== 2/3 Generate platform history =====
%PYTHON_CMD% scripts\generate_platform_history.py
if errorlevel 1 goto :err

echo.
echo ===== 3/3 Publish dashboard =====
%PYTHON_CMD% scripts\publish_dashboard.py
if errorlevel 1 goto :err

color 0A
echo.
echo SUCCESS
pause
exit /b 0

:err
color 0C
echo.
echo FAILED
pause
exit /b 1
