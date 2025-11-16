# 🎯 Arduino Bridge - Sistema de Asistencias RFID

## ¿Qué es?
Software que conecta tu Arduino (con lector RFID) al backend de ClassGo para registrar asistencias automáticamente.

## 📦 Instalación (Una sola vez)

```powershell
# Desde la carpeta raíz del proyecto
cd arduino-bridge
npm install
```

## 🚀 Uso Diario

### 1. Conectar Arduino
- Conecta el Arduino a tu PC por USB
- Verifica el puerto COM (ej: COM3, COM4) desde el Administrador de Dispositivos de Windows

### 2. Iniciar el Bridge
```powershell
cd arduino-bridge
npm start
```

### 3. Configurar en el CLI interactivo

```
🎯 ClassGo Arduino Bridge v1.0
================================

Comandos disponibles:
  puerto COM3          - Cambiar puerto serial
  clase <id>          - Configurar ID de clase activa
  backend <url>       - Cambiar URL del backend
  estado              - Ver configuración actual
  salir               - Cerrar el bridge

ClassGo>
```

**Configuración típica:**
```
ClassGo> puerto COM3
✅ Puerto cambiado a COM3

ClassGo> clase 53baf04c-4ab0-4d98-b746-42e0fb012cc4
✅ Clase configurada: 53baf04c-4ab0-4d98-b746-42e0fb012cc4

ClassGo> estado
📊 Configuración Actual:
- Puerto: COM3
- Backend: http://localhost:3000/api
- Clase Activa: 53baf04c-4ab0-4d98-b746-42e0fb012cc4

✅ Bridge listo para recibir tarjetas RFID
```

### 4. Registro Automático de Asistencia

Una vez configurado:
1. El alumno pasa su tarjeta RFID
2. El Arduino lee el UID
3. El Bridge envía: `POST /api/attendance/register { uid: "13:C9:46:14", classId: "abc123" }`
4. El backend busca al estudiante con ese UID
5. Si existe y está inscrito → ✅ Registra asistencia + 🎵 Jingle Bells
6. Si no existe → ❌ Error + 🎺 Sad trombone

### 5. Ver asistencias en tiempo real

Abre la página de asistencias en el navegador:
- `http://localhost:3000/attendance.html`
- Se actualiza automáticamente cada 10 segundos
- Verás aparecer los nuevos registros en tiempo real

## 🔧 Solución de Problemas

### El bridge no detecta el Arduino
```powershell
# Listar puertos COM disponibles
mode
# O en PowerShell
[System.IO.Ports.SerialPort]::getportnames()
```

### Error "Port not found"
- Verifica que el Arduino esté conectado
- Comprueba que el puerto COM sea correcto
- Cierra Arduino IDE si está abierto (bloquea el puerto)

### "Tarjeta no registrada"
- Primero vincula la tarjeta desde la interfaz web
- Ve a Asistencias → Vincular Tarjeta → Selecciona estudiante → Pasa tarjeta

## 📊 Flujo Completo

```
1. Admin vincula tarjeta RFID → Alumno "Juan" = UID "13:C9:46:14"
2. Arduino Bridge se conecta al puerto COM3
3. Se configura la clase activa
4. Alumno pasa tarjeta
5. Arduino detecta UID → "13:C9:46:14"
6. Bridge envía a backend
7. Backend registra asistencia para "Juan"
8. Arduino reproduce Jingle Bells 🎵
9. Interfaz web se actualiza mostrando a Juan presente
```

## 🎮 Comandos del CLI

| Comando | Ejemplo | Descripción |
|---------|---------|-------------|
| `puerto` | `puerto COM3` | Cambiar puerto serial |
| `clase` | `clase abc123` | Configurar clase activa |
| `backend` | `backend http://localhost:3000/api` | Cambiar URL del backend |
| `estado` | `estado` | Ver configuración actual |
| `salir` | `salir` | Cerrar el bridge |

## 📝 Notas

- El bridge debe estar corriendo mientras se toman asistencias
- Puedes dejarlo corriendo en segundo plano
- Las asistencias se registran instantáneamente
- El backend verifica que el alumno esté inscrito en la clase
- No se pueden registrar asistencias duplicadas (1 por día)
