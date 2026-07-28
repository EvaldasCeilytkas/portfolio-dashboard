@echo off
title Portfolio Analytics - Update Portfolio
cd /d "%~dp0"
echo.
echo ========================================================
echo  PORTFOLIO ANALYTICS - DUOMENU ATNAUJINIMAS
echo ========================================================
echo.
python scripts\update_portfolio.py
echo.
if errorlevel 1 (
  echo Importavimo metu ivyko klaida.
) else (
  echo Portfelio duomenys sekmingai atnaujinti.
)
echo.
pause
