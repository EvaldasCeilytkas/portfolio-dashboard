@echo off
cd /d "%~dp0"
python scripts\update_gerda.py
if errorlevel 1 (
  echo.
  echo KLAIDA atnaujinant Gerdos portfeli.
  pause
  exit /b 1
)
echo.
echo Gerdos portfelis atnaujintas sekmingai.
pause
