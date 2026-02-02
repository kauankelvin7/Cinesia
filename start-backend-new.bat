@echo off
echo ========================================
echo   Iniciando Backend Cinesia
echo ========================================
echo.

cd /d "%~dp0backend"

REM Add Maven to PATH
set "PATH=%USERPROFILE%\tools\apache-maven-3.9.12\bin;%PATH%"

echo Iniciando Spring Boot com Maven...
echo.

mvn clean spring-boot:run

pause
