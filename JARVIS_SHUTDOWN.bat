@echo off
title JARVIS - System Shutdown
color 0C

echo =======================================
echo        SHUTTING DOWN JARVIS
echo =======================================

echo.
echo [1/5] Closing Python Agent...
taskkill /IM python.exe /F >nul 2>&1

echo.
echo [2/5] Closing Personal Model Server...
taskkill /IM python.exe /F >nul 2>&1

echo.
echo [3/5] Closing Node Backend...
taskkill /IM node.exe /F >nul 2>&1

echo.
echo [4/5] Closing Frontend (React Dev Server)...
taskkill /IM cmd.exe /F >nul 2>&1

echo.
echo [5/5] Closing Playwright Chromium (if running)...
taskkill /IM chrome.exe /F >nul 2>&1
taskkill /IM ms-playwright.exe /F >nul 2>&1

echo.
echo =======================================
echo         JARVIS STOPPED COMPLETELY ✔
echo =======================================
pause
