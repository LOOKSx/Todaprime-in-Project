@echo off
chcp 65001 > nul
title Todaprime Backend (Go)
cd /d "%~dp0backend"
echo ⚡ Starting Todaprime Go API Server on http://localhost:8080...
todaprime-server.exe
pause
