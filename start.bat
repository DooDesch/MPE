@echo off
echo Starting xAkiitoh Program Executor...
echo.

REM Set UTF-8 codepage for proper Unicode support
chcp 65001 >nul 2>&1

REM Set environment variables for Python UTF-8 support
set PYTHONIOENCODING=utf-8
set PYTHONLEGACYWINDOWSIOENCODING=0

REM Start the development server
npm run dev

pause
