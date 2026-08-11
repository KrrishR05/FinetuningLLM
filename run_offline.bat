@echo off
setlocal enabledelayedexpansion
title VERIDIAN — Offline LLM Suite Launcher
echo.
echo  ================================================================
echo   VERIDIAN -- Offline LLM Document Intelligence Suite
echo   Gemma-4 LLM + FastAPI Backend + React Frontend
echo  ================================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "MODEL_FILE=%USERPROFILE%\Downloads\gemma-4-E2B-it-Q4_0.gguf"
set "LLAMA_BIN="
set "LLAMA_DIR=%USERPROFILE%\Downloads\llama-b10356-bin-win-cuda-13.3-x64"

:: ================================================================
:: STEP 1: Detect / Launch Local LLM Server (Gemma-4 via llama.cpp)
:: ================================================================

:: 1a. Check if llama-server is already responding on port 8080
echo [1/5] Checking local Gemma-4 LLM server on :8080...
curl -s http://127.0.0.1:8080/health >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo       [OK] Gemma-4 server is already running on port 8080.
    goto :CHECK_OLLAMA
)

:: 1b. Search for llama-server.exe — check known CUDA build path first
echo       Searching for llama-server.exe...
if exist "%LLAMA_DIR%\llama-server.exe" (
    set "LLAMA_BIN=%LLAMA_DIR%\llama-server.exe"
) else if exist "%SCRIPT_DIR%llama-server.exe" (
    set "LLAMA_BIN=%SCRIPT_DIR%llama-server.exe"
) else if exist "%SCRIPT_DIR%bin\llama-server.exe" (
    set "LLAMA_BIN=%SCRIPT_DIR%bin\llama-server.exe"
) else (
    for /d %%D in ("%SCRIPT_DIR%..\llama-*") do (
        if exist "%%D\llama-server.exe" set "LLAMA_BIN=%%D\llama-server.exe"
    )
    if not defined LLAMA_BIN (
        for /d %%D in ("%USERPROFILE%\Downloads\llama-*") do (
            if exist "%%D\llama-server.exe" set "LLAMA_BIN=%%D\llama-server.exe"
        )
    )
    if not defined LLAMA_BIN (
        for /d %%D in ("%USERPROFILE%\Desktop\llama-*") do (
            if exist "%%D\llama-server.exe" set "LLAMA_BIN=%%D\llama-server.exe"
        )
    )
    if not defined LLAMA_BIN (
        for %%X in (llama-server.exe) do (
            if not "%%~$PATH:X"=="" set "LLAMA_BIN=%%~$PATH:X"
        )
    )
)

:: 1c. Launch llama-server with Gemma-4 GGUF model
if defined LLAMA_BIN (
    if exist "%MODEL_FILE%" (
        echo       [*] Found llama-server: !LLAMA_BIN!
        echo       [*] Model: %MODEL_FILE%
        echo       [*] Starting Gemma-4 local server on port 8080...
        set "PATH=%LLAMA_DIR%;!PATH!"
        start "Gemma-4 Local Server" /min "!LLAMA_BIN!" -m "%MODEL_FILE%" --port 8080 -c 4096 -ngl 99
        
        :: Wait up to 10 seconds for llama-server to respond
        for /l %%I in (1,1,10) do (
            curl -s http://127.0.0.1:8080/health >nul 2>&1
            if !errorlevel! equ 0 (
                echo       [OK] Gemma-4 llama-server launched on :8080
                goto :CHECK_OLLAMA
            )
            timeout /t 1 /nobreak >nul
        )
    ) else (
        echo       [!] Model file not found at: %MODEL_FILE%
        echo       [!] Please download the GGUF model to: %MODEL_FILE%
    )
) else (
    echo       [INFO] llama-server.exe not found in standard paths.
    echo       [INFO] Will fall back to Ollama if available.
)

:: ================================================================
:: STEP 2: Check / Start Ollama as fallback
:: ================================================================
:CHECK_OLLAMA
echo.
echo [2/5] Checking Ollama server on :11434...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% == 0 (
    echo       [OK] Ollama is ONLINE at :11434
) else (
    echo       Ollama is OFFLINE. Attempting to start Ollama serve...
    where ollama >nul 2>&1
    if %errorlevel% == 0 (
        start /B "Ollama" ollama serve >nul 2>&1
        timeout /t 3 /nobreak >nul
        echo       [OK] Ollama serve started.
    ) else (
        echo       [INFO] Ollama not found on PATH. Skipping.
    )
)

:: ================================================================
:: STEP 3: Activate Python venv & Start FastAPI backend
:: ================================================================
echo.
echo [3/5] Checking / Starting FastAPI backend on :8000...
cd /d "%SCRIPT_DIR%"

curl -s http://127.0.0.1:8000/api/health >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo       [OK] FastAPI backend is already active on port 8000.
) else (
    echo       Starting FastAPI backend on :8000...
    if exist "%SCRIPT_DIR%venv\Scripts\python.exe" (
        start "FastAPI Backend" /min "%SCRIPT_DIR%venv\Scripts\python.exe" -m uvicorn server.main:app --host 127.0.0.1 --port 8000
    ) else (
        start "FastAPI Backend" /min python -m uvicorn server.main:app --host 127.0.0.1 --port 8000
    )
    
    :: Wait up to 10 seconds for FastAPI to respond
    for /l %%I in (1,1,10) do (
        curl -s http://127.0.0.1:8000/api/health >nul 2>&1
        if !errorlevel! equ 0 (
            echo       [OK] FastAPI backend is ready on :8000
            goto :FASTAPI_READY
        )
        timeout /t 1 /nobreak >nul
    )
    echo       [WARNING] FastAPI backend is taking longer than usual to start.
)

:FASTAPI_READY

:: ================================================================
:: STEP 4: Start React frontend (Vite)
:: ================================================================
echo.
echo [4/5] Checking / Starting React frontend on :5173...
cd /d "%SCRIPT_DIR%frontend"

curl -s http://localhost:5173 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo       [OK] React frontend is already running on :5173.
) else (
    echo       Starting React dev server on :5173...
    start "React Frontend" /min cmd /c "npm run dev"
    
    :: Wait up to 10 seconds for Vite to respond
    for /l %%I in (1,1,10) do (
        curl -s http://localhost:5173 >nul 2>&1
        if !errorlevel! equ 0 (
            echo       [OK] React frontend is ready on :5173
            goto :REACT_READY
        )
        timeout /t 1 /nobreak >nul
    )
)

:REACT_READY

:: ================================================================
:: STEP 5: Open browser
:: ================================================================
echo.
echo [5/5] Opening browser...
start http://localhost:5173

echo.
echo  ================================================================
echo   VERIDIAN is running!
echo  ================================================================
echo.
echo   Frontend:     http://localhost:5173
echo   API Docs:     http://localhost:8000/docs
echo   LLM Server:   http://localhost:8080  (llama.cpp / Gemma-4)
echo   Ollama:       http://localhost:11434  (fallback)
echo.
echo   Press Ctrl+C or close this window to exit launcher.
echo  ================================================================
echo.
pause