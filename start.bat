@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   HELIX AGI-OS CORTICAL DASHBOARD - INITIALIZING...
echo ============================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b
)

:: Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed.
    pause
    exit /b
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
)

:: Build the application
echo [INFO] Compiling neural binaries (Building app)...
call npm run build

:: Start the server
echo [SUCCESS] System Online. Launching Cortical Gateway...
echo.
echo Dashboard available at: http://localhost:3000
echo.

call npm run start

pause
