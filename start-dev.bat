@echo off
REM Start dev servers in separate windows.
REM Close the windows to stop the servers.

setlocal
set ROOT=%~dp0

start "Backend - Laravel (8000)" cmd /k "cd /d %ROOT%backend && ..\electron\resources\php\php.exe artisan serve"
start "Admin - Vite (5173)"      cmd /k "cd /d %ROOT%admin && npm run dev"

endlocal
