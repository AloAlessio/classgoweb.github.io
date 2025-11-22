# 🚀 Arduino Bridge - Inicio Rápido

## ❓ ¿Qué es el Arduino Bridge?

Es un servidor **local** que conecta tu Arduino (RFID) con el backend en Render.

**IMPORTANTE**: Este servidor corre en **tu computadora del salón**, NO en Render.

## 📋 Requisitos

- ✅ Arduino conectado por USB
- ✅ Node.js instalado
- ✅ Backend desplegado en Render
- ✅ Wi-Fi local para los estudiantes

## ⚙️ Configuración Inicial (Solo una vez)

### 1. Crear archivo `.env`

```powershell
# En la carpeta arduino-bridge
cd arduino-bridge
cp .env.example .env
```

### 2. Editar `.env` con tus valores:

```env
SERIAL_PORT=COM16
BACKEND_URL=https://classgoweb.onrender.com/api
HTTP_PORT=3001
```

**Cómo saber tu puerto COM:**
```powershell
# Windows PowerShell
Get-WmiObject Win32_SerialPort | Select-Object Name, DeviceID

# Busca algo como: "Arduino Uno (COM16)"
```

### 3. Instalar dependencias (solo primera vez)

```powershell
npm install
```

## 🚀 Iniciar el Arduino Bridge

```powershell
cd arduino-bridge
node rfid-bridge.js
```

**Salida esperada:**
```
🎓 ClassGo - Arduino RFID Bridge
================================

📡 Intentando conectar al puerto serial: COM16
✅ Arduino conectado correctamente en COM16

🌐 Servidor HTTP escuchando en puerto 3001
📍 Los estudiantes pueden conectarse a: http://TU_IP_LOCAL:3001

🔗 Backend configurado: https://classgoweb.onrender.com/api

⏳ Esperando tarjetas RFID...
```

## 🌐 Obtener tu IP Local

Los estudiantes necesitan tu IP para conectarse:

```powershell
ipconfig

# Busca "Dirección IPv4" en tu adaptador Wi-Fi
# Ejemplo: 192.168.1.100
```

**Anota en el pizarrón:**
```
Arduino Bridge: 192.168.1.100:3001
```

## ✅ Verificar que Funciona

### Prueba 1: Desde la misma computadora
```powershell
curl http://localhost:3001/status
```

**Respuesta esperada:**
```json
{
  "status": "ready",
  "arduino": "connected",
  "activeClass": null,
  "cardDetected": false
}
```

### Prueba 2: Desde otro dispositivo en la red
```powershell
# Reemplaza con tu IP real
curl http://192.168.1.100:3001/status
```

Si conecta ✅, todo está listo.

## 🎓 Uso Diario

### Al Inicio de Clase:

1. **Conectar Arduino** (USB)
2. **Abrir terminal** en la carpeta `arduino-bridge`
3. **Ejecutar**: `node rfid-bridge.js`
4. **Ver mensaje**: "✅ Arduino conectado correctamente"
5. **¡Listo!** Los estudiantes ya pueden registrar asistencia

### Durante la Clase:

- El Arduino Bridge detecta tarjetas automáticamente
- Envía los datos al backend en Render
- Los estudiantes ven confirmación en su pantalla

### Al Terminar:

- **Cerrar terminal** (Ctrl+C) o dejar corriendo
- El Arduino se puede desconectar

## 🔧 Solución de Problemas

### ❌ "Error: Port not found"

**Causa**: Puerto COM incorrecto o Arduino desconectado

**Solución**:
```powershell
# Verificar puertos disponibles
Get-WmiObject Win32_SerialPort | Select-Object Name, DeviceID

# Actualizar .env con el puerto correcto
SERIAL_PORT=COM16  # ← Cambia según tu puerto
```

### ❌ "EADDRINUSE: address already in use"

**Causa**: Ya hay una instancia corriendo en el puerto 3001

**Solución**:
```powershell
# Encontrar proceso usando el puerto
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess
$processId = (Get-NetTCPConnection -LocalPort 3001).OwningProcess
Stop-Process -Id $processId -Force

# O cambiar el puerto en .env
HTTP_PORT=3002
```

### ❌ "Cannot connect to backend"

**Causa**: Backend en Render no responde o URL incorrecta

**Solución**:
```powershell
# Verificar que el backend funciona
curl https://classgoweb.onrender.com/api/health

# Si no responde, verifica Render dashboard
# Si responde, verifica BACKEND_URL en .env
```

### ⚠️ "Estudiantes no pueden conectarse"

**Causa**: Firewall bloqueando el puerto 3001

**Solución**:
```powershell
# Permitir puerto en firewall Windows
New-NetFirewallRule -DisplayName "Arduino Bridge" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

## 💡 Tips

### Crear un Acceso Directo

1. Crea archivo `inicio-arduino.bat`:
```batch
@echo off
cd C:\ruta\completa\al\proyecto\arduino-bridge
node rfid-bridge.js
pause
```

2. Doble click para iniciar

### Inicio Automático (Opcional)

Usando PM2:
```powershell
npm install -g pm2

# Iniciar
pm2 start rfid-bridge.js --name arduino-bridge

# Ver estado
pm2 status

# Detener
pm2 stop arduino-bridge

# Iniciar al arrancar Windows
pm2 startup
pm2 save
```

### Ver Logs en Tiempo Real

El Arduino Bridge muestra logs útiles:
```
🔖 Tarjeta detectada: 13:C9:46:14
✅ UID formateado correctamente
⏳ Esperando validación del backend...
✅ PERMITIDO - Estudiante autorizado
```

## 📊 Monitoreo

### Ver Estado Actual:
```powershell
curl http://localhost:3001/status | ConvertFrom-Json
```

### Ver Última Tarjeta:
```powershell
$status = curl http://localhost:3001/status | ConvertFrom-Json
$status.lastUid
```

## 🔐 Seguridad

- ✅ El bridge solo acepta conexiones desde la red local
- ✅ No está expuesto a internet
- ✅ CORS habilitado para permitir requests del frontend
- ✅ Los datos se envían a Render por HTTPS

## 📱 Configuración en Estudiantes

Los estudiantes configuran **una sola vez**:

1. Abren ClassGo: `https://classgoweb.onrender.com`
2. Click en "Registrar Asistencia"
3. Ingresan tu IP: `192.168.1.100:3001`
4. Guardan (persiste en su navegador)

## 🎯 Resumen

```
┌─────────────────────────────────────────┐
│  RENDER (Nube)                          │
│  Backend + Frontend                     │
└──────────────────┬──────────────────────┘
                   │ Internet
                   │
┌──────────────────▼──────────────────────┐
│  ESTUDIANTES (Red Local)                │
│  Navegadores                            │
└──────────────────┬──────────────────────┘
                   │ Wi-Fi Local
                   │
┌──────────────────▼──────────────────────┐
│  TU COMPUTADORA (Salón)                 │
│  Arduino Bridge ← node rfid-bridge.js   │
│         ↓                               │
│  Arduino (USB)                          │
└─────────────────────────────────────────┘
```

**El Arduino Bridge NO va en Render, corre en tu computadora local** ✅

---

**¿Listo para empezar?**
```powershell
cd arduino-bridge
node rfid-bridge.js
```
