@echo off
REM Cinesia Backend - H2 In-Memory Database

echo ========================================
echo   Iniciando Backend Cinesia com H2
echo ========================================
echo.

cd /d "%~dp0backend"

echo Procurando por spring-boot-maven-plugin...
echo Tentando executar com Maven Wrapper...

REM Try mvnw first
if exist "mvnw.cmd" (
    call mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
) else if exist "mvnw" (
    bash mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
) else (
    echo.
    echo [AVISO] Maven wrapper nao encontrado
    echo Você pode instalar Maven manualmente com:
    echo   choco install maven
    echo.
    echo Ou usar Docker para rodar PostgreSQL:
    echo   docker run --name postgres-cinesia -e POSTGRES_PASSWORD=kapri -e POSTGRES_DB=cinesia -p 5432:5432 -d postgres
    echo.
    pause
)
