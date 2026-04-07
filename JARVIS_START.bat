@echo off
title JARVIS - System Launcher
color 0B

echo =======================================
echo        STARTING JARVIS SYSTEM
echo =======================================

:: -------- PYTHON AGENT --------
echo.
echo [1/4] Starting Python Agent (OS + Web Automation)...
start cmd /k "cd /d D:\MINI PROJECT\JARVIS\python_agent && .\venv\Scripts\activate && python agent.py"

:: -------- PERSONAL MODEL --------
echo.
echo [2/4] Starting Personal Model AI...
start cmd /k "cd /d D:\MINI PROJECT\JARVIS\personal_model && .\venv\Scripts\activate && python personal_model_server.py"

:: -------- NODE BACKEND --------
echo.
echo [3/4] Starting Node Backend (Gemini + Permissions + Planner)...
start cmd /k "cd /d D:\MINI PROJECT\JARVIS\server && npm run dev"

:: -------- FRONTEND --------
echo.
echo [4/4] Starting JARVIS Frontend HUD...
start cmd /k "cd /d D:\MINI PROJECT\JARVIS && npm run dev"

echo.
echo =======================================
echo       ALL SYSTEMS LAUNCHED ✔
echo       Close this window if done
echo =======================================
pause
