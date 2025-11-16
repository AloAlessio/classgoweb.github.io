@echo off
echo ========================================
echo   Arduino Bridge - ClassGo
echo ========================================
echo.
echo Iniciando Arduino Bridge...
echo.
echo CONFIGURACION REQUERIDA:
echo - Arduino conectado en puerto COM (verificar en Device Manager)
echo - Backend corriendo en http://localhost:3000
echo - Clase activa configurada via HTTP o comando
echo.
echo Comandos disponibles al iniciar:
echo   clase ^<ID^>    - Establecer clase activa
echo   puerto ^<COM^>  - Cambiar puerto serial
echo   info          - Ver configuracion actual
echo.
cd /d "%~dp0"
node rfid-bridge.js
pause
