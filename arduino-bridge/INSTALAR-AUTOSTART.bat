@echo off
chcp 65001 >nul
title Instalar Arduino Bridge - AutoStart

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║     INSTALADOR DE AUTO-INICIO - Arduino RFID Bridge          ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Esto creará un acceso directo en el Inicio de Windows       ║
echo ║  para que el bridge se ejecute automáticamente               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Obtener la ruta actual
set "BRIDGE_PATH=%~dp0"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=ClassGo-RFID-Bridge.lnk"

echo 📁 Ruta del bridge: %BRIDGE_PATH%
echo 📁 Carpeta de inicio: %STARTUP_FOLDER%
echo.

:: Crear el VBScript para generar el acceso directo
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%STARTUP_FOLDER%\%SHORTCUT_NAME%" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%BRIDGE_PATH%start-bridge-silent.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%BRIDGE_PATH%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "ClassGo Arduino RFID Bridge" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

:: Ejecutar el VBScript
cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

if exist "%STARTUP_FOLDER%\%SHORTCUT_NAME%" (
    echo.
    echo ✅ ¡INSTALACIÓN EXITOSA!
    echo.
    echo El Arduino Bridge ahora se iniciará automáticamente
    echo cuando enciendas tu computadora.
    echo.
    echo 📋 Para desinstalar: Ejecuta DESINSTALAR-AUTOSTART.bat
    echo.
) else (
    echo.
    echo ❌ Error al crear el acceso directo
    echo    Intenta ejecutar este archivo como Administrador
    echo.
)

pause
