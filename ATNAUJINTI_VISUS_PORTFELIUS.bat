@echo off
title Portfolio Dashboard Sync
color 0A

echo ==========================================
echo      PORTFOLIO DASHBOARD SYNC
echo ==========================================
echo.

echo [1/5] Atnaujinami Evaldo ir Rimos portfeliai...
call ATNAUJINTI_ABU_PORTFELIUS_IR_ATIDARYTI_PUSLAPI.bat
if errorlevel 1 goto failed

echo.
echo [2/5] Atnaujinamas Gerdos portfelis...
call ATNAUJINTI_GERDOS_PORTFELI.bat
if errorlevel 1 goto failed

echo.
echo ==========================================
echo   VISI PORTFELIAI SĖKMINGAI ATNAUJINTI
echo ==========================================
echo.
echo  ✓ Evaldas
echo  ✓ Rima
echo  ✓ Gerda
echo.
goto end

:failed
echo.
echo **********************************
echo * ĮVYKO KLAIDA ATNAUJINIMO METU! *
echo **********************************

:end
pause
