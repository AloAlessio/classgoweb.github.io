@echo off
chcp 65001 >nul
title Desinstalar Auto-Inicio - Arduino Bridge

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║     DESINSTALAR AUTO-INICIO - Arduino RFID Bridge            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=ClassGo-RFID-Bridge.lnk"

if exist "%STARTUP_FOLDER%\%SHORTCUT_NAME%" (
    del "%STARTUP_FOLDER%\%SHORTCUT_NAME%"
    echo ✅ Auto-inicio desinstalado correctamente
    echo    El bridge ya NO se iniciará automáticamente
) else (
    echo ⚠️ No se encontró el auto-inicio instalado
)

echo.
pause
