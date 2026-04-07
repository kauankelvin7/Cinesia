@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo 🔍 Verificando ambiente Java e Maven...

REM Tenta detectar se já estão no PATH
javac -version >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo ⚠️ JDK nao detectado no PATH. Tentando localizar...
    set "JAVA_HOME=C:\Program Files\Java\jdk-17"  REM <-- AJUSTE SUA VERSAO AQUI
    set "PATH=!JAVA_HOME!\bin;!PATH!"
)

mvn -v >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo ⚠️ Maven nao detectado no PATH. Tentando localizar...
    set "M2_HOME=C:\Program Files\apache-maven-3.9.6" REM <-- AJUSTE SUA PASTA AQUI
    set "PATH=!M2_HOME!\bin;!PATH!"
)

echo.
echo 🚀 Iniciando Build do Cinesia...
echo.

REM Agora usamos o Maven de verdade
call mvn clean install -DskipTests

if !ERRORLEVEL! EQU 0 (
    echo ✅ Sucesso! Rodando aplicacao...
    call mvn spring-boot:run
) else (
    echo ❌ O Maven falhou ao compilar. 
    echo Verifique se o arquivo pom.xml esta na mesma pasta deste .bat.
    pause
)

endlocal