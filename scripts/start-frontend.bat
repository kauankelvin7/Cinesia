@echo off
echo ========================================
echo   Iniciando Frontend Cinesia
echo ========================================
echo.

cd /d "%~dp0frontend"

echo Verificando Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js em: https://nodejs.org
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.
echo Iniciando servidor de desenvolvimento...
echo.

npm run dev

pause
