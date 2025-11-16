# 🎓 Sistema de Asistencias RFID - ClassGo

Sistema completo de registro de asistencias usando tarjetas RFID con Arduino, integrado a la plataforma ClassGo.

## 📋 Tabla de Contenidos

1. [Características](#características)
2. [Requisitos](#requisitos)
3. [Instalación Hardware](#instalación-hardware)
4. [Instalación Software](#instalación-software)
5. [Configuración](#configuración)
6. [Uso](#uso)
7. [API](#api)
8. [Troubleshooting](#troubleshooting)

---

## ✨ Características

- ✅ **Registro automático** de asistencias con tarjetas RFID
- ✅ **Interfaz web moderna** con actualizaciones en tiempo real
- ✅ **Estadísticas visuales** de asistencia por clase
- ✅ **Sistema de vinculación** de tarjetas a estudiantes
- ✅ **Notificaciones en tiempo real** cuando un alumno registra asistencia
- ✅ **Filtros por fecha** y exportación de datos
- ✅ **Sonidos de feedback** (Jingle Bells para permitido, trompeta triste para denegado)
- ✅ **Multi-clase** - gestión de múltiples clases simultáneas
- ✅ **Responsive design** - funciona en móvil y escritorio

---

## 🔧 Requisitos

### Hardware

- **Arduino** (Uno, Nano, Mega, etc.)
- **Lector RFID RC522** (SPI)
- **Buzzer pasivo** (opcional, para feedback de audio)
- **Tarjetas/Tags RFID** (MIFARE 13.56MHz)
- **Cables jumper**
- **Cable USB** (para conectar Arduino a la PC)

### Software

- **Node.js** v16 o superior
- **Arduino IDE** (para cargar el sketch)
- **npm** o **yarn**
- Navegador web moderno (Chrome, Firefox, Edge)

---

## 🔌 Instalación Hardware

### Conexiones RFID RC522

| RC522 Pin | Arduino Pin |
|-----------|-------------|
| SDA       | 10          |
| SCK       | 13          |
| MOSI      | 11          |
| MISO      | 12          |
| IRQ       | (no usar)   |
| GND       | GND         |
| RST       | 9           |
| 3.3V      | 3.3V        |

### Conexión Buzzer (Opcional)

| Buzzer Pin | Arduino Pin |
|------------|-------------|
| +          | 3           |
| -          | GND         |

⚠️ **IMPORTANTE:** El RC522 funciona a **3.3V**, NO conectar a 5V.

---

## 💻 Instalación Software

### 1. Cargar código a Arduino

1. Abre el **Arduino IDE**
2. Instala la librería `MFRC522`:
   - Ve a **Sketch > Include Library > Manage Libraries**
   - Busca **"MFRC522"**
   - Instala la librería de **GithubCommunity**

3. Copia el código Arduino proporcionado (arriba)
4. Conecta tu Arduino
5. Selecciona el puerto correcto en **Tools > Port**
6. Haz clic en **Upload** (→)
7. Abre el **Serial Monitor** (115200 baud) para verificar que funciona

### 2. Instalar Bridge Node.js

```bash
# Navegar a la carpeta del bridge
cd arduino-bridge

# Instalar dependencias
npm install

# Iniciar el bridge
npm start
```

### 3. Configurar puerto serial

Cuando inicies el bridge, verás:

```
🎓 ClassGo - Arduino RFID Bridge
================================

❌ Error al inicializar puerto serial...
💡 Asegúrate de:
   1. Arduino conectado al puerto COM3
   2. Permisos de puerto serial configurados
   3. Otro programa no esté usando el puerto

📡 Puertos seriales disponibles:
   COM3 (USB Serial Port)
   COM4
```

Usa el comando para cambiar el puerto:

```
ClassGo> puerto COM3
```

O en Linux/Mac:

```
ClassGo> puerto /dev/ttyUSB0
```

---

## ⚙️ Configuración

### 1. Agregar tarjetas permitidas en Arduino

Edita el código Arduino, sección `ALLOWED_UIDS`:

```cpp
const byte ALLOWED_UIDS[][10] = {
  {4, 0x13, 0xC9, 0x46, 0x14},  // Tarjeta 1
  {4, 0xAA, 0xBB, 0xCC, 0xDD},  // Tarjeta 2
  {4, 0x11, 0x22, 0x33, 0x44}   // Tarjeta 3
};
```

**¿Cómo obtener el UID de una tarjeta?**

1. Carga el código Arduino
2. Abre el Serial Monitor
3. Pasa la tarjeta por el lector
4. Verás algo como: `UID: 13 C9 46 14`
5. Formato para Arduino: `{4, 0x13, 0xC9, 0x46, 0x14}`
   - El primer número `4` es la longitud del UID

### 2. Configurar clase activa en el bridge

```
ClassGo> clase abc123xyz
✅ Clase activa: abc123xyz
```

Obtén el ID de la clase desde el dashboard web o la URL.

### 3. Vincular tarjetas a estudiantes (Web)

1. Ve a **https://tu-dominio.com/attendance.html**
2. Selecciona la clase
3. Click en **"Vincular Tarjeta"**
4. Selecciona el estudiante
5. Ingresa el UID de la tarjeta (formato: `13:C9:46:14`)
6. Click **"Vincular Tarjeta"**

Ahora cuando el estudiante pase su tarjeta, se registrará automáticamente.

---

## 🚀 Uso

### Flujo completo

1. **Iniciar backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Iniciar bridge Arduino**:
   ```bash
   cd arduino-bridge
   npm start
   ```

3. **Configurar clase activa**:
   ```
   ClassGo> clase abc123
   ```

4. **Abrir panel web**:
   - Ir a: `http://localhost:3000/attendance.html`
   - O en producción: `https://classgo-web.onrender.com/attendance.html`

5. **Pasar tarjeta RFID**:
   - El alumno pasa su tarjeta
   - Arduino lee el UID
   - Si está permitido: suena Jingle Bells 🎵
   - Bridge envía al backend
   - Se registra la asistencia
   - Aparece en tiempo real en el panel web

---

## 📡 API

### Registrar asistencia

```http
POST /api/attendance/register
Content-Type: application/json

{
  "uid": "13:C9:46:14",
  "classId": "abc123xyz",
  "timestamp": 1699876543210
}
```

**Respuesta éxito:**

```json
{
  "success": true,
  "message": "Asistencia registrada para Juan Pérez",
  "attendanceId": "xyz789",
  "studentName": "Juan Pérez",
  "className": "Matemáticas 101"
}
```

### Consultar asistencias de una clase

```http
GET /api/attendance/class/:classId
Authorization: Bearer <token>
```

**Query params opcionales:**
- `date`: `2025-11-12` (filtrar por fecha específica)
- `startDate`: `2025-11-01`
- `endDate`: `2025-11-30`

### Vincular tarjeta a usuario

```http
POST /api/attendance/link-card
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user123",
  "rfidUid": "13:C9:46:14"
}
```

### Ver asistencias de un estudiante

```http
GET /api/attendance/student/:studentId?classId=abc123
Authorization: Bearer <token>
```

### Estadísticas de asistencia

```http
GET /api/attendance/stats/:classId
Authorization: Bearer <token>
```

---

## 🎨 Personalización

### Cambiar sonidos Arduino

Edita las funciones en el código Arduino:

- `playJingleFast()` - Sonido de acceso permitido
- `tuneSadTrombone()` - Sonido de acceso denegado

### Cambiar colores del panel web

Edita `frontend/css/attendance.css`:

```css
:root {
    --primary: #4f46e5;      /* Color principal */
    --success: #10b981;      /* Verde (presente) */
    --danger: #ef4444;       /* Rojo (ausente) */
    --bg: #0f172a;          /* Fondo */
}
```

### Cambiar intervalo de actualización

Edita `frontend/js/attendance.js`:

```javascript
startRealtimeUpdates() {
    this.pollInterval = setInterval(() => {
        if (this.currentClassId) {
            this.checkNewAttendances();
        }
    }, 10000); // 10000 = 10 segundos
}
```

---

## 🐛 Troubleshooting

### Arduino no detecta tarjetas

1. **Verifica las conexiones** - especialmente SDA, SCK, MOSI, MISO
2. **Voltaje correcto** - RC522 funciona a 3.3V, no 5V
3. **Abre Serial Monitor** - debe decir "RFID listo"
4. **Prueba con DumpInfo** - ejemplo de la librería MFRC522

### Bridge no se conecta al backend

```
❌ No se pudo conectar al backend
```

**Soluciones:**

1. Verifica que el backend esté corriendo
2. Cambia la URL:
   ```
   ClassGo> backend http://localhost:3000/api
   ```
3. En producción:
   ```
   ClassGo> backend https://classgo-web.onrender.com/api
   ```

### Error: "Tarjeta no registrada"

```json
{
  "success": false,
  "message": "Tarjeta no registrada",
  "uid": "13:C9:46:14"
}
```

**Solución:** Vincular la tarjeta a un estudiante desde el panel web.

### Puerto serial ocupado

```
❌ Error: Port is opening
```

**Soluciones:**

1. Cierra el Arduino IDE Serial Monitor
2. Cierra otros programas que usen el puerto
3. En Windows, verifica en **Device Manager**
4. Desconecta y reconecta el Arduino

### Bridge no detecta puerto serial

**Windows:**

```powershell
# Listar puertos COM
mode
```

**Linux/Mac:**

```bash
# Listar puertos
ls /dev/tty*

# Dar permisos (Linux)
sudo usermod -a -G dialout $USER
# Cerrar sesión y volver a entrar
```

### Asistencias no aparecen en tiempo real

1. Verifica que el bridge esté corriendo
2. Confirma que la clase activa sea correcta:
   ```
   ClassGo> estado
   ```
3. Abre la consola del navegador (F12) y busca errores

---

## 📊 Estructura de Archivos

```
classgo/
├── arduino-bridge/
│   ├── rfid-bridge.js          # Bridge Node.js
│   └── package.json
├── backend/
│   ├── routes/
│   │   └── attendance.js        # API de asistencias
│   └── server.js                # Servidor principal
└── frontend/
    ├── html/
    │   └── attendance.html      # Panel de asistencias
    ├── css/
    │   └── attendance.css       # Estilos
    └── js/
        └── attendance.js        # Lógica frontend
```

---

## 🔐 Seguridad

### Recomendaciones

1. **No exponer el bridge** a internet (solo local)
2. **Usar HTTPS** en producción
3. **Validar UIDs** en el backend
4. **Limitar rate limiting** para prevenir spam
5. **Logs de auditoría** de todas las asistencias

### Variables de entorno

Crea `.env` en `arduino-bridge/`:

```env
SERIAL_PORT=COM3
BACKEND_URL=http://localhost:3000/api
ACTIVE_CLASS_ID=abc123
```

---

## 📝 Comandos del Bridge

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `clase <ID>` | Establecer clase activa | `clase abc123` |
| `backend <URL>` | Cambiar URL del backend | `backend http://localhost:3000/api` |
| `puerto <COM>` | Cambiar puerto serial | `puerto COM3` |
| `puertos` | Listar puertos disponibles | `puertos` |
| `estado` | Ver configuración actual | `estado` |
| `ayuda` | Mostrar ayuda | `ayuda` |
| `salir` | Cerrar el programa | `salir` |

---

## 🎉 ¡Listo!

Tu sistema de asistencias RFID está completamente configurado. Ahora cuando un estudiante pase su tarjeta:

1. ✅ Arduino detecta la tarjeta
2. 🎵 Suena Jingle Bells si está permitido
3. 📡 Bridge envía al backend
4. 💾 Se registra en Firebase
5. 📊 Aparece en el panel web en tiempo real
6. 🔔 Notificación visual y sonora

---

## 📞 Soporte

¿Problemas? Revisa:

1. Logs del Arduino (Serial Monitor)
2. Logs del bridge (consola)
3. Logs del backend (consola del servidor)
4. Consola del navegador (F12)

**¡Disfruta tu sistema de asistencias automatizado! 🚀**
