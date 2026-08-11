@echo off
title VERIDIAN — Offline LLM Suite Launcher
echo.
echo  ================================================================
echo   VERIDIAN -- Offline LLM Document Intelligence Suite
echo   Powered by local LLM models offline (Ollama / llama.cpp)
echo  ================================================================
echo.

:: 1. Check if Ollama is running
echo [1/3] Checking local LLM engine (Ollama)...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% == 0 (
    echo       [OK] Ollama server is ONLINE at http://localhost:11434
) else (
    echo       [!] Ollama is not responding on port 11434.
    echo       Attempting to start Ollama in the background...
    start /B ollama serve >nul 2>&1
    timeout /t 3 /nobreak >nul
    echo       [OK] Ollama startup initiated.
)

:: 2. Activate Python Virtual Environment
echo.
echo [2/3] Activating Python environment...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo       [OK] Virtual environment activated.
) else (
    echo       [!] No venv found. Running with system Python.
)

:: 3. Launch Streamlit Application
echo.
echo [3/3] Launching Web Application...
echo.
echo  ================================================================
echo   VERIDIAN is running! Opening in your browser...
echo   Local URL: http://localhost:8501
echo   Press Ctrl+C in this window to stop the server.
echo  ================================================================
echo.

streamlit run app.py --server.port 8501 --server.headless false

pause
