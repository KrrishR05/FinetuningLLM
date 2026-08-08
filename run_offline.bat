@echo off
title Offline Gemma-4 Intelligence Suite (Netravaani)
echo =======================================================
echo   Starting 100%% Local Offline Gemma-4 Intelligence Suite
echo =======================================================
echo.

:: Check if llama-server or Ollama is running
echo [1/2] Checking local Gemma-4 LLM server...
netstat -ano | findstr :8080 >nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Gemma-4 server is already running on port 8080.
) else (
    echo [*] Starting Gemma-4 local CUDA server on port 8080...
    start "Gemma-4 Local Server (CUDA 12.4)" /min "C:\Users\Om\Downloads\llama-b9804-bin-win-cuda-12.4-x64\llama-server.exe" -m "C:\Users\Om\Downloads\LOLOM\gemma-4-E2B-it-Q4_0.gguf" --port 8080 -c 4096 -ngl 99
    timeout /t 3 /nobreak >nul
)

echo [2/2] Launching Netravaani Streamlit Application...
echo.
streamlit run app.py

pause
