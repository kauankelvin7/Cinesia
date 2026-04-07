@echo off
setlocal

echo ============================================================
echo   Cinesia - Inicializador do Backend (Spring Boot)
echo ============================================================
echo(

REM Detecta o diretorio raiz do projeto a partir da localizacao do script
cd /d "%~dp0"

REM Garante que estamos na pasta que contem o backend
if exist "backend\pom.xml" (
  cd backend
) else (
  echo [ERRO] Nao encontrei "backend\pom.xml" a partir de %SCRIPT_DIR%
  echo Verifique se o script esta na raiz do repositorio (Cinesia).
  goto :end
)

echo [INFO] Pasta backend: %CD%
echo(

REM ===================================================================
REM 1) Verificacao / descoberta de JAVA_HOME
REM ===================================================================
if defined JAVA_HOME (
  echo [INFO] JAVA_HOME detectado: %JAVA_HOME%
) else (
  echo [AVISO] JAVA_HOME nao definido. Tentando localizar JDK 17...
  call :find_javahome
  if not defined JAVA_HOME (
    echo [ERRO] Nao foi possivel localizar um JDK automaticamente.
    echo Configure a variavel de ambiente JAVA_HOME apontando para o seu JDK 17.
    echo Exemplo: "C:\Program Files\Java\jdk-17..."
    goto :end
  )
)

REM Garante que o bin do JDK esta no PATH desta sessao
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo [INFO] Usando JAVA_HOME=%JAVA_HOME%
echo(

REM ===================================================================
REM 2) Configuracao de memoria para Maven / Spring Boot (dev)
REM ===================================================================
if "%MAVEN_OPTS%"=="" (
  set "MAVEN_OPTS=-Xms512m -Xmx2048m -XX:+UseG1GC -Dfile.encoding=UTF-8"
)
echo [INFO] MAVEN_OPTS=%MAVEN_OPTS%
echo(

REM ===================================================================
REM 3) Verificacao do Maven Wrapper (mvnw.cmd)
REM ===================================================================
if exist "%CD%\mvnw.cmd" (
  set "MVNW_CMD=%CD%\mvnw.cmd"
) else (
  echo [ERRO] Maven Wrapper (mvnw.cmd) nao encontrado na pasta backend.
  echo(
  echo Para gerar o Maven Wrapper (UMA unica vez), siga um destes caminhos:
  echo   1) Em uma maquina com Maven instalado, execute:
  echo        cd backend
  echo        mvn -N wrapper
  echo      e depois envie os arquivos gerados (mvnw, mvnw.cmd e pasta .mvn)
  echo      para este repositorio.
  echo   2) Ou instale o Maven temporariamente neste Windows,
  echo      execute o comando acima, e depois remova o Maven se desejar.
  echo(
  echo Depois disso, volte a executar: run-backend.bat
  goto :end
)

REM ===================================================================
REM 4) Baixa dependencias antes de subir o servidor
REM ===================================================================
echo [INFO] Preparando dependencias Maven (dependency:go-offline)...
"%MVNW_CMD%" -q dependency:go-offline -B
if errorlevel 1 (
  echo [AVISO] Nao foi possivel executar "dependency:go-offline". Prosseguindo mesmo assim...
) else (
  echo [OK] Dependencias preparadas.
)
echo(

REM ===================================================================
REM 5) Inicializa o backend Spring Boot
REM ===================================================================
echo [INFO] Iniciando backend (mvnw clean spring-boot:run -DskipTests)...
echo(
"%MVNW_CMD%" clean spring-boot:run -DskipTests
goto :eof


REM ===================================================================
REM  Funcoes auxiliares
REM ===================================================================
:find_javahome
set "JAVA_HOME="

REM Busca em diretorios comuns de instalacao de JDK no Windows
for /d %%D in ("C:\Program Files\Java\jdk*") do (
  if exist "%%D\bin\java.exe" (
    set "JAVA_HOME=%%D"
    goto :found_java
  )
)

for /d %%D in ("C:\Program Files\Eclipse Adoptium\jdk-*") do (
  if exist "%%D\bin\java.exe" (
    set "JAVA_HOME=%%D"
    goto :found_java
  )
)

for /d %%D in ("C:\Program Files\Microsoft\jdk-*") do (
  if exist "%%D\bin\java.exe" (
    set "JAVA_HOME=%%D"
    goto :found_java
  )
)

:found_java
if defined JAVA_HOME (
  echo [INFO] JDK encontrado automaticamente em: %JAVA_HOME%
) else (
  echo [AVISO] Nenhum JDK foi encontrado nos caminhos padrao.
)
exit /b

:end
echo(
echo [INFO] Encerrando script run-backend.
endlocal
exit /b 1

