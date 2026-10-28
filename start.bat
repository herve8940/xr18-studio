@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 22+ requis : https://nodejs.org/
  pause
  exit /b 1
)
echo XR18 Studio - installation locale et demarrage
call npm run setup
if errorlevel 1 (
  pause
  exit /b 1
)
start "" "http://127.0.0.1:5173"
call npm run studio
pause
