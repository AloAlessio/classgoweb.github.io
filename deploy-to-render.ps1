# Script de Despliegue Rápido para Render
# Ejecuta este script para hacer commit y push de los cambios

Write-Host "🚀 ClassGo - Despliegue a Render" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (!(Test-Path "backend/server.js")) {
    Write-Host "❌ Error: Ejecuta este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Verificar que .env local existe
if (!(Test-Path "backend/.env")) {
    Write-Host "⚠️  Advertencia: No se encontró backend/.env" -ForegroundColor Yellow
    Write-Host "   Asegúrate de tener tus credenciales localmente" -ForegroundColor Yellow
}

# Mostrar estado de Git
Write-Host "📊 Estado actual de Git:" -ForegroundColor Green
git status --short

Write-Host ""
Write-Host "📋 Archivos listos para commit:" -ForegroundColor Green
git diff --cached --name-only

Write-Host ""
$confirm = Read-Host "¿Continuar con el commit y push? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
    exit 0
}

# Hacer commit
Write-Host ""
Write-Host "💾 Haciendo commit..." -ForegroundColor Cyan
git commit -m "Preparar proyecto para despliegue en Render - Proteger credenciales"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el commit" -ForegroundColor Red
    exit 1
}

# Push a GitHub
Write-Host ""
Write-Host "📤 Subiendo a GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al subir a GitHub" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ ¡Código subido exitosamente a GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. Ve a https://render.com" -ForegroundColor White
Write-Host "2. Regístrate con tu cuenta de GitHub" -ForegroundColor White
Write-Host "3. Crea un nuevo Web Service" -ForegroundColor White
Write-Host "4. Conecta el repositorio: classgoweb.github.io" -ForegroundColor White
Write-Host "5. Sigue la guía en DEPLOY-RENDER.md" -ForegroundColor White
Write-Host ""
Write-Host "📖 Lee LISTO-PARA-DESPLEGAR.md para más detalles" -ForegroundColor Yellow
Write-Host ""

# Preguntar si quiere abrir Render.com
$openRender = Read-Host "¿Abrir Render.com en el navegador? (S/N)"
if ($openRender -eq "S" -or $openRender -eq "s") {
    Start-Process "https://render.com"
}

Write-Host ""
Write-Host "🎉 ¡Buena suerte con tu despliegue!" -ForegroundColor Green
