@echo off
chcp 65001 > nul
title Todaprime Frontend (Angular)
cd /d "%~dp0frontend"
echo ⚡ Starting Todaprime Angular Dev Server on http://localhost:4200...
npm start
pause
