# 🌐 Configuración Red Local - Arduino Bridge

## 📋 Cómo Funciona

El sistema ahora detecta automáticamente el Arduino Bridge en tu red local. **No necesitas ngrok ni configuración complicada**.

### Arquitectura Simplificada

```
┌─────────────────────────────────────────────────────────┐
│                    COMPUTADORA DEL SALÓN                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐      ┌──────────────────┐             │
│  │   Arduino   │ USB  │  Arduino Bridge  │             │
│  │   (RFID)    │─────►│   localhost:3001 │             │
│  └─────────────┘      └──────────────────┘             │
│                                ▲                        │
└────────────────────────────────┼────────────────────────┘
                                 │
                          ┌──────┴──────┐
                          │  RED LOCAL  │
                          │  Wi-Fi      │
                          └──────┬──────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
        ┌─────▼─────┐      ┌─────▼─────┐    ┌─────▼─────┐
        │ Tablet    │      │  Celular  │    │  Laptop   │
        │ Estudiante│      │ Estudiante│    │ Estudiante│
        └───────────┘      └───────────┘    └───────────┘
        
        Todos en Render: https://classgoweb.onrender.com
```

## ✅ Ventajas del Nuevo Sistema

1. **Sin ngrok**: No necesitas exponer puertos públicos
2. **Configuración una sola vez**: Se guarda en el navegador
3. **Funciona en red local**: Toda la escuela en la misma Wi-Fi
4. **Auto-detección**: Solo pide configuración la primera vez
5. **Reconfigurable**: Botón en el menú del estudiante

## 🚀 Pasos de Configuración

### 1. En la Computadora del Salón (Con Arduino)

1. **Iniciar Arduino Bridge**:
```powershell
cd arduino-bridge
node rfid-bridge.js
```

2. **Obtener la IP de la computadora**:
```powershell
ipconfig
# Busca "Dirección IPv4" de tu adaptador Wi-Fi
# Ejemplo: 192.168.1.100
```

3. **Verificar que el bridge funciona**:
```powershell
# En la misma computadora
curl http://localhost:3001/status

# Desde otra computadora en la red
curl http://192.168.1.100:3001/status
```

### 2. En los Dispositivos de los Estudiantes

1. **Entrar a la app**: `https://classgoweb.onrender.com`
2. **Hacer login** como estudiante
3. **Ir a "Mis Clases"**
4. **Presionar botón "Registrar Asistencia"**
5. **Se abre el modal de configuración automáticamente**:
   - Ingresar IP: `192.168.1.100` (la IP de la computadora del salón)
   - Dejar puerto: `3001`
   - Presionar "🔍 Probar Conexión"
   - Si conecta ✅, presionar "💾 Guardar"

6. **¡Listo!** Ahora puede pasar su tarjeta RFID

### 3. Si Cambia la IP o la Computadora

Los estudiantes pueden reconfigurar desde el menú:
1. Click en el avatar (esquina superior derecha)
2. Click en "🔧 Configurar Lector RFID"
3. Ingresar nueva IP
4. Probar y guardar

## 🏫 Escenarios de Uso

### Escenario 1: Aula con Wi-Fi Local
```
Computadora Arduino: 192.168.1.100
Estudiantes: Tablets/celulares conectados al mismo Wi-Fi
Configuración: 192.168.1.100:3001
```

### Escenario 2: Misma Computadora
```
Computadora Arduino: localhost
Estudiantes: Usan la misma computadora
Configuración: localhost:3001
```

### Escenario 3: Red Escolar Amplia
```
Computadora Arduino: 10.0.5.50 (IP fija)
Estudiantes: Cualquier dispositivo en la red escolar
Configuración: 10.0.5.50:3001
```

## 🔧 Resolución de Problemas

### ❌ "No se pudo conectar"

**Causas comunes:**
1. Arduino Bridge no está corriendo
2. IP incorrecta
3. Puerto 3001 bloqueado por firewall
4. No están en la misma red

**Solución:**
```powershell
# 1. Verificar que el bridge está corriendo
# Debe ver: "🌐 Servidor HTTP escuchando en puerto 3001"

# 2. Verificar firewall Windows
New-NetFirewallRule -DisplayName "Arduino Bridge" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# 3. Verificar IP
ipconfig
# Copiar la IPv4 exacta
```

### ⚠️ "Conexión funcionó pero no detecta tarjetas"

**Causas:**
1. Arduino no está conectado (USB)
2. Puerto COM incorrecto

**Solución:**
```powershell
# Verificar dispositivos USB
Get-WmiObject Win32_SerialPort | Select-Object Name, DeviceID

# Ajustar en .env si es necesario
SERIAL_PORT=COM16
```

### 🔄 "Antes funcionaba, ahora no"

**Causa:** La IP de la computadora cambió (DHCP)

**Solución:**
1. Click en menú usuario → "🔧 Configurar Lector RFID"
2. Ingresar nueva IP
3. Guardar

**Prevención:** Configurar IP estática en Windows:
```
Panel de Control → Centro de redes → Adaptador → Propiedades → IPv4
IP: 192.168.1.100 (ejemplo)
Máscara: 255.255.255.0
Puerta de enlace: 192.168.1.1 (IP del router)
```

## 🎯 Configuración Recomendada para Escuelas

### Para el Administrador de Red:

1. **Asignar IP fija a la computadora del Arduino**
   - Ejemplo: `192.168.1.50`
   - Documentar en el pizarrón o en un cartel

2. **Abrir puerto 3001 en el firewall**
   ```powershell
   New-NetFirewallRule -DisplayName "ClassGo Arduino" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   ```

3. **Crear acceso directo para iniciar el bridge**
   ```powershell
   # Crear archivo inicio-arduino.bat
   @echo off
   cd C:\ruta\al\proyecto\arduino-bridge
   node rfid-bridge.js
   pause
   ```

4. **Opcional: Configurar inicio automático**
   - Agregar el .bat al inicio de Windows
   - O usar `pm2` para mantenerlo corriendo

### Para los Profesores:

1. **Primer día de clase:**
   - Anotar la IP en el pizarrón: `192.168.1.50:3001`
   - Explicar a los estudiantes cómo configurar (solo primera vez)

2. **Iniciar clases:**
   - Doble click en "inicio-arduino.bat"
   - Verificar mensaje: "✅ Arduino conectado correctamente"
   - Listo para tomar asistencia

3. **Al terminar:**
   - Cerrar la ventana del Arduino Bridge
   - O dejar corriendo si hay más clases

## 📱 Guía Rápida para Estudiantes

### Primera Vez:
1. Abre ClassGo en tu celular/tablet
2. Entra a tu clase
3. Presiona "Registrar Asistencia"
4. Aparece ventana de configuración:
   - **IP**: Copia del pizarrón (ej: `192.168.1.50`)
   - **Puerto**: `3001`
5. "Probar Conexión" → "Guardar"
6. ¡Pasa tu tarjeta! 🎴

### Siguientes Veces:
1. Presiona "Registrar Asistencia"
2. ¡Pasa tu tarjeta! 🎴
3. (No pide configuración de nuevo)

## 🔐 Seguridad

**Buenas prácticas:**
- El Arduino Bridge solo acepta conexiones desde la red local
- No está expuesto a internet
- Los datos se envían directamente al backend en Render (HTTPS)
- La configuración se guarda en el navegador (localStorage)

## 💡 Tips

1. **IP del pizarrón**: Anota la IP en grande en el salón para que los estudiantes la vean
2. **QR Code**: Genera un código QR con la URL completa: `http://192.168.1.50:3001`
3. **Prueba previa**: Antes de clase, verifica la conexión desde tu celular
4. **Backup**: Ten un método manual de registro por si falla el sistema

## 📊 Monitoreo

Para ver el estado del Arduino Bridge en tiempo real:
```powershell
# En la computadora del salón
curl http://localhost:3001/status | ConvertFrom-Json

# Desde otro dispositivo
curl http://192.168.1.50:3001/status | ConvertFrom-Json
```

Respuesta esperada:
```json
{
  "status": "ready",
  "arduino": "connected",
  "activeClass": "53baf04c-4ab0-4d98-b746-42e0fb012cc4",
  "cardDetected": false,
  "lastUid": null
}
```

## 🎓 Ejemplo Completo de Uso

**Día lunes, 8:00 AM, Clase de Astronomía**

1. **Profesor llega al salón**:
   ```powershell
   # Doble click en inicio-arduino.bat
   # Ve: "✅ Arduino conectado correctamente"
   # Ve: "🌐 Servidor HTTP escuchando en puerto 3001"
   ```

2. **Estudiantes entran a la clase**:
   - Abren ClassGo en sus celulares
   - Click en "ASTRO 1"
   - Click en "Registrar Asistencia"

3. **Primera vez (solo algunos estudiantes nuevos)**:
   - Ven ventana de configuración
   - Copian IP del pizarrón: `192.168.1.50`
   - Puerto: `3001`
   - "Probar" → ✅ → "Guardar"

4. **Todos los estudiantes**:
   - Ven modal futurista con sensor RFID
   - Pasan su tarjeta
   - ✅ "¡Asistencia registrada!"

5. **Profesor verifica**:
   - En su dashboard ve la lista actualizada
   - 25/30 estudiantes presentes

6. **Al terminar la clase**:
   - El bridge sigue corriendo para la siguiente clase
   - O cierra la ventana si es la última clase del día

## 🔄 Actualizaciones Futuras

- [ ] Auto-descubrimiento en la red (broadcast)
- [ ] App móvil nativa con NFC directo
- [ ] Múltiples aulas con múltiples Arduinos
- [ ] Dashboard del bridge con interfaz web

---

**¿Dudas?** Revisa los logs del Arduino Bridge, siempre muestran información útil.
