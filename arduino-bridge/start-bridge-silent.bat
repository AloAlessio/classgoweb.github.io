@echo off
chcp 65001 >nul

:: Script silencioso para auto-inicio
:: Se ejecuta minimizado sin mostrar ventana de comandos grande

cd /d "%~dp0"

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    exit /b 1
)

:: Verificar si las dependencias están instaladas
if not exist "node_modules" (
    npm install >nul 2>nul
)

:: Iniciar el bridge en segundo plano
start /min "ClassGo-RFID-Bridge" cmd /c "node rfid-bridge.js"
