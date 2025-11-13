@echo off
echo ================================
echo   ClassGo - Iniciar Servidor
echo ================================
echo.

cd backend

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js encontrado

echo.
echo [2/3] Verificando dependencias...
if not exist "node_modules\" (
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
)
echo OK - Dependencias instaladas

echo.
echo [3/3] Iniciando servidor...
echo.
echo ================================
echo   Servidor corriendo en:
echo   http://localhost:3000
echo ================================
echo.
echo Presiona Ctrl+C para detener
echo.

call npm start
