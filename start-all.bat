@echo off
chcp 65001 > nul
title Todaprime - What do I need to do today?
echo ========================================================
echo    🚀 กำลังเริ่มต้นระบบ Todaprime (Angular + Golang)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] กำลังเริ่ม Backend Server (Golang :8080)...
start "Todaprime Backend (Go)" cmd /k "cd /d "%~dp0backend" && todaprime-server.exe"

timeout /t 2 /nobreak > nul

echo [2/2] กำลังเริ่ม Frontend (Angular :4200)...
start "Todaprime Frontend (Angular)" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo ========================================================
echo    ✅ เริ่มต้นระบบเรียบร้อยแล้ว!
echo    - Frontend UI : http://localhost:4200
echo    - Backend API : http://localhost:8080/api/health
echo ========================================================
echo.

timeout /t 6 /nobreak > nul
start http://localhost:4200
exit
