@echo off
REM Simple build and run script for Cinesia Backend using Java

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo Building Cinesia Backend...
echo.

REM Create output directories
if not exist "build\classes" mkdir build\classes
if not exist "build\lib" mkdir build\lib

REM Compile Java files
echo Compiling Java files...
javac -d build\classes -sourcepath src\main\java src\main\java\com\fisioterapia\cinesia\*.java 2>nul

if !ERRORLEVEL! EQU 0 (
    echo Build successful!
    echo.
    echo Starting application...
    java -cp "build\classes" com.fisioterapia.cinesia.CinesiaApplication
) else (
    echo Build failed. Maven is required to build this project.
    echo.
    echo Please install Maven:
    echo choco install maven
    echo.
    pause
)

endlocal
