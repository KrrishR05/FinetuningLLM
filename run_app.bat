@echo off
title NETRAVAANI — Offline LLM Suite Launcher
echo.
echo  ================================================================
echo   NETRAVAANI -- Offline LLM Document Intelligence Suite
echo   FastAPI Backend + React Frontend
echo  ================================================================
echo.

:: Check if Ollama is running
echo [1/4] Checking Ollama server...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% == 0 (
    echo       Ollama is ONLINE at :11434
) else (
    echo       Ollama is OFFLINE. Starting Ollama serve...
    start /B "Ollama" ollama serve >nul 2>&1
    timeout /t 3 /nobreak >nul
)

:: Start FastAPI backend
echo [2/4] Starting FastAPI backend on :8000...
cd /d "%~dp0"
start /B "FastAPI" cmd /c "python -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul

:: Start React frontend
echo [3/4] Starting React frontend on :5173...
cd /d "%~dp0frontend"
start /B "React" cmd /c "npm run dev"
timeout /t 4 /nobreak >nul

:: Open browser
echo [4/4] Opening browser...
start http://localhost:5173

echo.
echo  ================================================================
echo   NETRAVAANI is running!
echo   Frontend:  http://localhost:5173
echo   API:       http://localhost:8000/docs
echo   Press Ctrl+C to stop all servers.
echo  ================================================================
echo.
pause
