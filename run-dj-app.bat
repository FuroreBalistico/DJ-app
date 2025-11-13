@echo off
REM DJ-App Quick Launcher per Windows
REM Questo script batch automatizza l'avvio del DJ-App su Windows

setlocal enabledelayedexpansion

REM Configurazione
set REPO_URL=https://github.com/FuroreBalistico/DJ-app.git
set BRANCH=main
set PROJECT_DIR=DJ-app-clone
set PORT=8000

echo ========================================
echo    DJ-App Quick Launcher
echo ========================================
echo.

REM Controlla se la directory esiste
if not exist "%PROJECT_DIR%" (
    echo [31mDirectory '%PROJECT_DIR%' non trovata.[0m
    echo [33mUsa: %0 --clone[0m
    echo.
    set /p CLONE="Vuoi clonare il repository ora? (Y/N): "
    if /i "!CLONE!"=="Y" goto :clone_repo
    exit /b 1
)

REM Controlla se esiste la directory src
if not exist "%PROJECT_DIR%\src" (
    echo [31mDirectory 'src' non trovata in %PROJECT_DIR%[0m
    exit /b 1
)

goto :start_server

:clone_repo
echo.
echo [33mClonazione repository...[0m

if exist "%PROJECT_DIR%" (
    echo [33mLa cartella '%PROJECT_DIR%' esiste gia.[0m
    set /p DELETE="Vuoi eliminarla e clonare di nuovo? (Y/N): "
    if /i "!DELETE!"=="Y" (
        rmdir /s /q "%PROJECT_DIR%"
        echo [32mCartella eliminata.[0m
    ) else (
        echo [32mUso la cartella esistente.[0m
        goto :start_server
    )
)

git clone -b %BRANCH% %REPO_URL% %PROJECT_DIR%
if errorlevel 1 (
    echo [31mErrore durante la clonazione.[0m
    pause
    exit /b 1
)
echo [32mRepository clonato con successo![0m

:start_server
echo.
echo [33mAvvio server HTTP sulla porta %PORT%...[0m
echo [36mDirectory: %CD%\%PROJECT_DIR%\src[0m
echo [36mURL: http://localhost:%PORT%[0m
echo.
echo [33mPremi Ctrl+C per fermare il server[0m
echo.

REM Naviga nella directory src
cd "%PROJECT_DIR%\src" || exit /b 1

REM Apri il browser
timeout /t 2 /nobreak >nul
start http://localhost:%PORT%

echo [32mBrowser aperto![0m
echo.
echo ========================================
echo [32m   DJ-App e' ora in esecuzione![0m
echo ========================================
echo.
echo [36mConsigli:[0m
echo   - Carica una traccia audio cliccando 'Load'
echo   - Usa 'Tap Tempo' per rilevare i BPM
echo   - Prova i nuovi tasti Cue, Sync e FX!
echo.

REM Avvia il server
python -m http.server %PORT%
if errorlevel 1 (
    echo.
    echo [31mErrore: Python non trovato o errore nel server[0m
    echo [33mProva a installare Python 3 da python.org[0m
    pause
    exit /b 1
)
