@echo off
echo ========================================
echo   Iniciando Backend Cinesia
echo ========================================
echo.

cd /d "%~dp0backend"

echo Verificando Maven...
where mvn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Maven nao encontrado no PATH!
    echo.
    echo Por favor, instale o Maven:
    echo 1. Baixe em: https://maven.apache.org/download.cgi
    echo 2. Extraia para C:\apache-maven
    echo 3. Adicione ao PATH: C:\apache-maven\bin
    echo.
    echo Ou use chocolatey: choco install maven
    pause
    exit /b 1
)

echo Maven encontrado!
echo.
echo Compilando e executando o projeto...
echo.

mvn clean spring-boot:run

pause
