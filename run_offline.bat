@echo off
setlocal enabledelayedexpansion
title Offline Gemma-4 Intelligence Suite (Netravaani)

echo =======================================================
echo   Starting // please work :( this timeeeee
echo =======================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "MODEL_FILE=%SCRIPT_DIR%gemma-4-E2B-it-Q4_0.gguf"
set "LLAMA_BIN="

:: 1. is running on 8080 ???? T-T
echo [1/2] Checking local Gemma-4 LLM server...
netstat -ano | findstr :8080 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Gemma-4 server is already running on port 8080.
    goto :LAUNCH_APP
)

:: 2. is OLLAMAAA RUNNING ? ON 11434
netstat -ano | findstr :11434 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Local Ollama service is active on port 11434.
    goto :LAUNCH_APP
)

:: 3. LLAMA TUM KAHA HO ?
if exist "%SCRIPT_DIR%llama-server.exe" (
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
        for %%X in (llama-server.exe) do (
            if not "%%~$PATH:X"=="" set "LLAMA_BIN=%%~$PATH:X"
        )
    )
)

:: 4. YE RAHA LLAMA :) MEH MEH MEH
if defined LLAMA_BIN (
    if exist "%MODEL_FILE%" (
        echo [*] Found local server: !LLAMA_BIN!
        echo [*] Starting Gemma-4 local server on port 8080...
        start "Gemma-4 Local Server" /min "!LLAMA_BIN!" -m "%MODEL_FILE%" --port 8080 -c 4096 -ngl 99
        ping -n 4 127.0.0.1 >nul
    ) else (
        echo [!] Model file not found at: %MODEL_FILE%
    )
) else (
    echo [INFO] llama-server.exe not found in standard paths.
    echo [INFO] The app will use Ollama or the local runtime fallback.
)

:LAUNCH_APP
echo.
echo [2/2] Launching Netravaani Streamlit Application...
echo.

where streamlit >nul 2>&1
if %ERRORLEVEL% equ 0 (
    streamlit run app.py
) else (
    python -m streamlit run app.py
)

pause
