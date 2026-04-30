@echo off
cd /d "%~dp0"
title QR Meal Distribution - Dev

start "Scanner (Expo)" cmd /k "cd /d %~dp0scanner && npm start"

npx concurrently -n backend,admin -c blue,green "npm:dev:backend" "npm:dev:admin"

pause
