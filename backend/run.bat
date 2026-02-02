@echo off
title CINESIA BACKEND
cd /d %~dp0
echo.
echo ==========================================
echo    CINESIA BACKEND - Spring Boot
echo ==========================================
echo.
echo Iniciando na porta 8080...
echo.
C:\Users\Kauan\tools\apache-maven-3.9.12\bin\mvn.cmd spring-boot:run
pause
