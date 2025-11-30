# ✅ Sistema de Asistencias - Guía Completa

## 🎯 ¿Qué es el Sistema de Asistencias?

El sistema de asistencias de ClassGo registra automáticamente cuando un estudiante llega a clase. Funciona con tarjetas RFID (como las tarjetas de acceso) que los estudiantes pasan por un lector, registrando su presencia de forma instantánea y sin errores.

---

## 🏗️ Componentes del Sistema

### **1. Hardware (Físico)**

#### **Lector RFID**
- Dispositivo conectado a un Arduino
- Lee tarjetas RFID cuando se acercan
- Se coloca en la entrada del salón de clases

#### **Tarjetas RFID**
- Cada estudiante tiene una tarjeta única
- Contiene un código identificador (ej: "A1B2C3D4")
- Funciona acercándola al lector (sin contacto)

#### **Arduino + Computadora**
- Arduino conectado al lector RFID
- Computadora ejecuta el "Arduino Bridge"
- Envía datos a la plataforma web

---

### **2. Software (Digital)**

#### **Arduino Bridge**
**Ubicación**: `/arduino-bridge/rfid-bridge.js`

**¿Qué hace?**
- Recibe datos del Arduino (código de tarjeta)
- Los envía al backend de ClassGo
- Actúa como "puente" entre hardware y web

#### **Backend API**
**Ubicación**: `/backend/routes/attendance.js`

**¿Qué hace?**
- Recibe código RFID
- Busca estudiante en Firestore
- Valida que tenga clase activa
- Guarda registro de asistencia
- Notifica al frontend

#### **Frontend (Interfaz)**
**Ubicación**: 
- Dashboard Estudiante: `/frontend/html/student-dashboard-new.html`
- Dashboard Tutor: `/frontend/html/tutor-dashboard-new.html`

**¿Qué hace?**
- Muestra asistencias registradas
- Permite asistencia manual
- Actualiza en tiempo real
- Muestra estadísticas

---

## 🔄 Flujo Completo del Sistema

### **Configuración Inicial (Una sola vez)**

#### **Paso 1: Asociar Tarjeta RFID a Estudiante**

**Desde el Dashboard de Estudiante**:

1. **Estudiante inicia sesión**
2. **Avatar → "🔧 Configurar Lector RFID"**
3. **Ventana de configuración aparece**:

```
╔═══════════════════════════════════════╗
║  🔧 Configurar Tu Tarjeta RFID       ║
╠═══════════════════════════════════════╣
║                                        ║
║  Para usar el registro automático de  ║
║  asistencia, necesitas asociar tu     ║
║  tarjeta RFID con tu cuenta.          ║
║                                        ║
║  📋 Instrucciones:                    ║
║  1. Asegúrate de tener tu tarjeta     ║
║  2. Click en "Leer Tarjeta"           ║
║  3. Acerca tu tarjeta al lector       ║
║  4. Espera confirmación               ║
║                                        ║
║  Estado: ⏳ Esperando...              ║
║                                        ║
║  [Leer Tarjeta]  [Cancelar]           ║
╚═══════════════════════════════════════╝
```

4. **Click en "Leer Tarjeta"**
5. **Sistema se conecta** al Arduino Bridge
6. **Mensaje aparece**: "Acerca tu tarjeta al lector"

7. **Estudiante acerca tarjeta**
8. **Lector detecta**: "A1B2C3D4"
9. **Sistema muestra**:
   ```
   ✓ Tarjeta detectada: A1B2C3D4
   ¿Asociar con tu cuenta?
   [Sí, Asociar]  [Cancelar]
   ```

10. **Click "Sí, Asociar"**
11. **Backend guarda** en Firestore:
    ```javascript
    users/studentId {
      rfidCard: "A1B2C3D4",
      rfidConfiguredAt: "2025-11-22T10:00:00Z"
    }
    ```

12. **Confirmación aparece**:
    ```
    ✅ ¡Tarjeta configurada exitosamente!
    
    Ya puedes usar el registro automático
    de asistencia en tus clases.
    ```

**La tarjeta ahora está lista para usar.**

---

### **Uso Diario (Registro de Asistencia)**

#### **Escenario: Estudiante llega a clase de Matemáticas**

**Hora**: 10:00 AM
**Clase**: Matemáticas Avanzadas
**Estudiante**: María González
**Tarjeta RFID**: A1B2C3D4

---

### **🚀 Proceso Paso a Paso**

#### **1. Arduino Bridge está Activo**

**En el servidor/computadora de la institución**:
```bash
$ node rfid-bridge.js

🚀 Arduino RFID Bridge iniciado
📡 Conectado a Arduino en puerto COM3
✅ Listo para recibir tarjetas
⏰ Sincronizado con backend ClassGo
```

El bridge está "escuchando" tarjetas 24/7.

---

#### **2. Estudiante Llega al Salón**

**María ve el lector RFID** en la entrada del salón:

```
╔════════════════════════════════╗
║                                 ║
║    [📡 LECTOR RFID]            ║
║                                 ║
║   Acerca tu tarjeta            ║
║   para registrar asistencia    ║
║                                 ║
╚════════════════════════════════╝
```

---

#### **3. Pasa la Tarjeta**

**María acerca su tarjeta** al lector.

**Lector detecta**:
```
RFID detectado: A1B2C3D4
```

**Lector emite**:
- Sonido: *beep* 🔊
- Luz LED verde parpadea 💚

---

#### **4. Arduino Envía a Bridge**

**Arduino → Arduino Bridge**:
```javascript
{
  type: "rfid_scan",
  cardId: "A1B2C3D4",
  timestamp: "2025-11-22T10:00:15Z"
}
```

---

#### **5. Bridge Envía a Backend**

**Arduino Bridge → Backend API**:

```javascript
POST https://classgo-backend.com/attendance/rfid
Headers:
  Content-Type: application/json
  Authorization: Bearer {bridgeToken}

Body:
{
  rfidCard: "A1B2C3D4",
  timestamp: "2025-11-22T10:00:15Z",
  location: "Salón 201"
}
```

---

#### **6. Backend Procesa**

**Archivo**: `/backend/routes/attendance.js`

**Pasos que realiza el backend**:

##### **A. Buscar Estudiante**
```javascript
// Busca en Firestore por tarjeta RFID
const userSnapshot = await firestore
  .collection('users')
  .where('rfidCard', '==', 'A1B2C3D4')
  .limit(1)
  .get();

// Encuentra:
{
  uid: "student123",
  name: "María González",
  email: "maria.gonzalez@email.com",
  role: "alumno",
  rfidCard: "A1B2C3D4"
}
```

##### **B. Verificar Clases Activas**
```javascript
// Busca clases donde está inscrita
const classesSnapshot = await firestore
  .collection('classes')
  .where('enrolledStudents', 'array-contains', 'student123')
  .where('status', '==', 'activo')
  .get();

// Revisa horarios
const now = new Date(); // 10:00 AM
const dayOfWeek = "lunes";

// Encuentra clase activa ahora:
{
  id: "class456",
  subject: "Matemáticas Avanzadas",
  tutorId: "tutor789",
  schedule: {
    days: ["lunes", "miércoles", "viernes"],
    startTime: "10:00",
    endTime: "11:30"
  }
}
```

##### **C. Validar Horario**
```javascript
// Verifica que la hora actual esté en el rango
const currentTime = "10:00";
const classStart = "10:00";
const classEnd = "11:30";

// Permite registro 15 min antes hasta 30 min después del inicio
const validWindow = {
  earliest: "09:45",  // 15 min antes
  latest: "10:30"     // 30 min después
};

// 10:00 está dentro del rango ✓
```

##### **D. Verificar Duplicados**
```javascript
// Revisa si ya registró asistencia hoy
const existingAttendance = await firestore
  .collection('attendance')
  .where('studentId', '==', 'student123')
  .where('classId', '==', 'class456')
  .where('date', '==', '2025-11-22')
  .get();

// No existe registro previo ✓
```

##### **E. Guardar Asistencia**
```javascript
// Crea nuevo documento en Firestore
const attendanceDoc = await firestore
  .collection('attendance')
  .add({
    id: 'att_' + Date.now(),
    studentId: 'student123',
    studentName: 'María González',
    classId: 'class456',
    className: 'Matemáticas Avanzadas',
    tutorId: 'tutor789',
    timestamp: new Date('2025-11-22T10:00:15Z'),
    date: '2025-11-22',
    time: '10:00:15',
    method: 'RFID',
    status: 'presente',
    rfidCard: 'A1B2C3D4',
    location: 'Salón 201',
    createdAt: new Date()
  });

console.log('✅ Asistencia registrada:', attendanceDoc.id);
```

---

#### **7. Backend Responde**

**Backend → Arduino Bridge**:
```javascript
{
  success: true,
  message: "Asistencia registrada exitosamente",
  data: {
    studentName: "María González",
    className: "Matemáticas Avanzadas",
    time: "10:00:15",
    status: "presente"
  }
}
```

**Arduino Bridge → Arduino**:
- Enciende LED verde permanente por 3 segundos ✅
- Muestra en pantalla (si tiene): "✓ María González"

---

#### **8. Notificación en Tiempo Real**

**Firestore actualiza** → **Listeners detectan cambio**

##### **Dashboard de María (Estudiante)**

Si María tiene su dashboard abierto:

```javascript
// Listener escucha cambios en sus asistencias
firestore.collection('attendance')
  .where('studentId', '==', 'student123')
  .onSnapshot((snapshot) => {
    // Nueva asistencia detectada
    const newAttendance = snapshot.docs[snapshot.docs.length - 1];
    
    // Muestra notificación
    showNotification('success', 
      '✅ Asistencia registrada en Matemáticas'
    );
    
    // Actualiza contador
    updateAttendanceCount();
  });
```

**Notificación aparece**:
```
┌─────────────────────────────────────┐
│ ✅ Asistencia Registrada           │
│ Matemáticas Avanzadas              │
│ 10:00 AM - Presente                │
└─────────────────────────────────────┘
```

##### **Dashboard del Tutor**

Si el tutor (Prof. Carlos) tiene su dashboard abierto:

```javascript
// Listener escucha asistencias de su clase
firestore.collection('attendance')
  .where('classId', '==', 'class456')
  .where('date', '==', today)
  .onSnapshot((snapshot) => {
    // Nueva asistencia en su clase
    updateStudentList();
    showNotification('info', 
      '✓ Asistencia: María González'
    );
  });
```

**Lista se actualiza automáticamente**:
```
╔═══════════════════════════════════════╗
║  ✅ Asistencias - Matemáticas        ║
║  Lunes, 22 Nov - 10:00 AM            ║
╠═══════════════════════════════════════╣
║                                        ║
║ ✓ María González    10:00 (RFID)     ║
║ ✓ Juan Pérez        10:01 (RFID)     ║
║ ⏳ Ana López        Esperando...      ║
║ ✓ Carlos Ruiz       10:02 (RFID)     ║
║                                        ║
║ Presentes: 3/24 (12.5%)               ║
╚═══════════════════════════════════════╝
```

---

## 🛠️ Asistencia Manual (Sin RFID)

### **¿Cuándo se usa?**
- Lector RFID no funciona
- Estudiante olvidó su tarjeta
- Primera clase antes de configurar RFID
- Corrección de errores

---

### **Proceso Manual por Tutor**

#### **1. Tutor Abre Panel de Asistencia**

**Dashboard de Tutor → "Tomar Asistencia"**

1. **Selecciona clase**:
   ```
   ¿Qué clase?
   (•) Matemáticas Avanzadas - 10:00 AM
   ( ) Álgebra Básica - 14:00 PM
   ( ) Geometría - 16:00 PM
   ```

2. **Click en "Continuar"**

---

#### **2. Lista de Estudiantes Aparece**

```
╔═══════════════════════════════════════╗
║  📋 Tomar Asistencia Manual          ║
║  Matemáticas Avanzadas - 22 Nov      ║
╠═══════════════════════════════════════╣
║                                        ║
║  [Marcar Todos] [Desmarcar Todos]     ║
║  [Guardar Asistencia]                 ║
║                                        ║
╠═══════════════════════════════════════╣
║                                        ║
║ ☑ María González                      ║
║   10:00 AM - Ya registrada (RFID)     ║
║                                        ║
║ ☐ Juan Pérez                          ║
║   [Marcar Presente]                   ║
║                                        ║
║ ☑ Ana López                           ║
║   [Marcado manualmente]               ║
║                                        ║
║ ☐ Carlos Ruiz                         ║
║   [Marcar Presente]                   ║
║                                        ║
║ ... (20 estudiantes más)              ║
║                                        ║
║ Presentes: 2/24                       ║
║                                        ║
╚═══════════════════════════════════════╝
```

---

#### **3. Tutor Marca Presentes**

**Para cada estudiante**:
- **Click en checkbox** para marcar/desmarcar
- Estudiantes con RFID ya aparecen marcados
- Puede marcar los que llegaron sin tarjeta

---

#### **4. Guardar Asistencias**

1. **Click "Guardar Asistencia"**
2. **Backend procesa**:

```javascript
// Por cada estudiante marcado manualmente
for (const studentId of markedStudents) {
  await firestore.collection('attendance').add({
    studentId: studentId,
    studentName: getStudentName(studentId),
    classId: 'class456',
    className: 'Matemáticas Avanzadas',
    tutorId: currentUserId,
    timestamp: new Date(),
    date: getCurrentDate(),
    time: getCurrentTime(),
    method: 'Manual',  // ← Diferencia clave
    status: 'presente',
    registeredBy: currentUserId,
    createdAt: new Date()
  });
}
```

3. **Confirmación aparece**:
   ```
   ✅ Asistencias guardadas exitosamente
   22 estudiantes registrados
   ```

---

## 📊 Visualización de Asistencias

### **Dashboard de Estudiante**

#### **Vista de Resumen**
```
╔═══════════════════════════════════════╗
║     📊 Mis Asistencias                ║
╠═══════════════════════════════════════╣
║                                        ║
║ 📚 Matemáticas Avanzadas              ║
║ ████████████████░░░ 15/16 (93.75%)   ║
║ Última: Hoy 10:00 AM                  ║
║                                        ║
║ 🧪 Química Orgánica                   ║
║ ██████████████░░░░░ 12/14 (85.71%)   ║
║ Última: Ayer 14:00 PM                 ║
║                                        ║
║ 💻 Programación Python                ║
║ ██████████████████ 8/8 (100%)        ║
║ Última: Hoy 16:00 PM                  ║
║                                        ║
║ 📈 Promedio General: 91.2%            ║
║                                        ║
║ [Ver Detalles]                         ║
╚═══════════════════════════════════════╝
```

#### **Vista Detallada**

**Click en "Ver Detalles" → Historial completo**:

```
╔═════════════════════════════════════════╗
║  📋 Historial - Matemáticas Avanzadas  ║
╠═════════════════════════════════════════╣
║                                          ║
║ ✅ Vie 22 Nov - 10:00 AM                ║
║    Método: RFID                         ║
║    Estado: Presente                     ║
║                                          ║
║ ✅ Mié 20 Nov - 10:02 AM                ║
║    Método: RFID                         ║
║    Estado: Presente                     ║
║                                          ║
║ ❌ Lun 18 Nov                           ║
║    Estado: Ausente                      ║
║    Nota: Sin registro                   ║
║                                          ║
║ ✅ Vie 15 Nov - 10:01 AM                ║
║    Método: Manual (Prof. Carlos)        ║
║    Estado: Presente                     ║
║    Nota: Tarjeta olvidada               ║
║                                          ║
║ ✅ Mié 13 Nov - 10:00 AM                ║
║    Método: RFID                         ║
║    Estado: Presente                     ║
║                                          ║
║ ... (11 registros más)                  ║
║                                          ║
║ [Exportar PDF] [Solicitar Corrección]   ║
╚═════════════════════════════════════════╝
```

---

### **Dashboard de Tutor**

#### **Vista por Clase**

```
╔═════════════════════════════════════════╗
║  📊 Asistencias - Matemáticas          ║
║  Noviembre 2025                         ║
╠═════════════════════════════════════════╣
║                                          ║
║ 📅 Resumen por Estudiante:              ║
║                                          ║
║ 1. Ana López                            ║
║    ██████████████████ 16/16 (100%)     ║
║    Última: Hoy 10:00 (RFID)            ║
║                                          ║
║ 2. María González                       ║
║    ████████████████░░ 15/16 (93.75%)   ║
║    Última: Hoy 10:00 (RFID)            ║
║    ⚠️ Ausente: 18 Nov                  ║
║                                          ║
║ 3. Juan Pérez                           ║
║    ███████████████░░░ 14/16 (87.5%)    ║
║    Última: Hoy 10:01 (RFID)            ║
║    ⚠️ Ausente: 13 Nov, 18 Nov          ║
║                                          ║
║ ... (21 estudiantes más)                ║
║                                          ║
║ 📊 Estadísticas:                        ║
║ • Promedio clase: 89.5%                 ║
║ • Mejor asistencia: Ana López (100%)    ║
║ • Requieren atención: 3 estudiantes     ║
║                                          ║
║ [Ver por Fecha] [Exportar] [Enviar]     ║
╚═════════════════════════════════════════╝
```

#### **Vista por Fecha**

```
╔═════════════════════════════════════════╗
║  📅 Asistencia por Sesión              ║
║  Matemáticas Avanzadas                  ║
╠═════════════════════════════════════════╣
║                                          ║
║ ▼ Vie 22 Nov - 10:00 AM (Hoy)          ║
║   Presentes: 23/24 (95.8%)             ║
║                                          ║
║   ✅ María González  10:00 (RFID)       ║
║   ✅ Juan Pérez      10:01 (RFID)       ║
║   ✅ Ana López       10:00 (RFID)       ║
║   ✅ Carlos Ruiz     10:02 (RFID)       ║
║   ... (19 más)                          ║
║   ❌ Pedro Sánchez   Ausente            ║
║                                          ║
║ ▼ Mié 20 Nov - 10:00 AM                ║
║   Presentes: 22/24 (91.7%)             ║
║   [Ver Detalles]                        ║
║                                          ║
║ ▼ Lun 18 Nov - 10:00 AM                ║
║   Presentes: 20/24 (83.3%)             ║
║   [Ver Detalles]                        ║
║                                          ║
║ ... (13 sesiones más)                   ║
║                                          ║
╚═════════════════════════════════════════╝
```

---

## 🔧 Configuración del Arduino Bridge

### **Archivo de Configuración**

**Ubicación**: `/arduino-bridge/config.json`

```json
{
  "arduino": {
    "port": "COM3",
    "baudRate": 9600
  },
  "backend": {
    "url": "https://classgo-backend.com",
    "apiKey": "tu-api-key-secreta",
    "endpoints": {
      "attendance": "/attendance/rfid",
      "ping": "/ping"
    }
  },
  "settings": {
    "retryAttempts": 3,
    "retryDelay": 2000,
    "logLevel": "info"
  }
}
```

---

### **Iniciar Arduino Bridge**

**En la computadora conectada al Arduino**:

```bash
# Navegar a carpeta
cd arduino-bridge

# Instalar dependencias (primera vez)
npm install

# Iniciar bridge
node rfid-bridge.js
```

**Salida esperada**:
```
🚀 ClassGo Arduino RFID Bridge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Conectando a Arduino...
✅ Arduino conectado en puerto COM3
✅ Baudrate: 9600

🌐 Conectando a backend...
✅ Backend alcanzable en https://classgo-backend.com
✅ API Key validada

⏰ Sistema sincronizado
🎯 Listo para recibir tarjetas RFID

Esperando lecturas...
```

---

## ⚠️ Manejo de Errores

### **Error 1: Tarjeta No Reconocida**

**Escenario**: Tarjeta no asociada a ningún estudiante

**Flujo**:
1. Lector detecta: "X9Y8Z7W6"
2. Backend busca en Firestore
3. No encuentra usuario con esa tarjeta
4. Responde con error:
   ```javascript
   {
     success: false,
     error: "Tarjeta no registrada",
     cardId: "X9Y8Z7W6"
   }
   ```

**Arduino**:
- LED rojo parpadea 🔴
- Sonido de error: *beep-beep-beep*
- Pantalla muestra: "❌ Tarjeta no registrada"

**Solución**:
- Estudiante debe configurar su tarjeta
- O contactar al administrador

---

### **Error 2: Fuera de Horario**

**Escenario**: Estudiante pasa tarjeta fuera del horario de clase

**Flujo**:
1. María pasa tarjeta a las 15:00
2. Su clase de Matemáticas es a las 10:00
3. Backend valida horario
4. No hay clase activa en ese momento
5. Responde con error:
   ```javascript
   {
     success: false,
     error: "No tienes clases activas en este momento",
     nextClass: {
       subject: "Química Orgánica",
       time: "14:00",
       day: "martes"
     }
   }
   ```

**Arduino**:
- LED amarillo parpadea 🟡
- Pantalla muestra: "⚠️ Fuera de horario"

---

### **Error 3: Asistencia Duplicada**

**Escenario**: Estudiante pasa tarjeta dos veces

**Flujo**:
1. María ya registró a las 10:00
2. Pasa tarjeta nuevamente a las 10:15
3. Backend detecta registro previo hoy
4. Responde:
   ```javascript
   {
     success: false,
     error: "Asistencia ya registrada",
     existingRecord: {
       time: "10:00:15",
       method: "RFID"
     }
   }
   ```

**Arduino**:
- LED azul parpadea 🔵
- Pantalla muestra: "✓ Ya registrado (10:00)"

---

### **Error 4: Arduino Desconectado**

**Escenario**: Problema de conexión con Arduino

**Bridge detecta**:
```
❌ Error: Arduino desconectado
🔄 Intentando reconectar...
⏳ Intento 1/3...
⏳ Intento 2/3...
✅ Reconectado exitosamente
```

**Acciones automáticas**:
- Reintenta conexión cada 5 segundos
- Guarda lecturas en buffer mientras reconecta
- Procesa buffer cuando vuelve la conexión

---

### **Error 5: Backend Inaccesible**

**Escenario**: API de ClassGo no responde

**Bridge detecta**:
```
❌ Error: Backend no accesible
💾 Guardando lecturas en caché local...
🔄 Reintentando en 10 segundos...
```

**Archivo de caché**: `/arduino-bridge/offline-cache.json`
```json
[
  {
    "rfidCard": "A1B2C3D4",
    "timestamp": "2025-11-22T10:00:15Z",
    "status": "pending"
  },
  {
    "rfidCard": "B2C3D4E5",
    "timestamp": "2025-11-22T10:01:22Z",
    "status": "pending"
  }
]
```

**Cuando backend vuelve**:
```
✅ Backend accesible nuevamente
📤 Procesando 2 lecturas en caché...
✅ Asistencia registrada: A1B2C3D4
✅ Asistencia registrada: B2C3D4E5
🎉 Caché sincronizada
```

---

## 📈 Reportes y Estadísticas

### **Reporte Individual (Estudiante)**

**Exportar PDF desde Dashboard**:

```
╔═══════════════════════════════════════╗
║  📄 Reporte de Asistencia             ║
║  María González                        ║
║  Estudiante ID: student123            ║
╠═══════════════════════════════════════╣
║                                        ║
║ Período: Noviembre 2025               ║
║ Generado: 22/11/2025 15:30            ║
║                                        ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║                                        ║
║ 📊 RESUMEN GENERAL                    ║
║                                        ║
║ Total de Clases: 3                    ║
║ Asistencias: 35/38 (92.1%)           ║
║ Ausencias: 3                          ║
║ Método RFID: 32 (91.4%)              ║
║ Método Manual: 3 (8.6%)              ║
║                                        ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║                                        ║
║ 📚 POR MATERIA                        ║
║                                        ║
║ Matemáticas Avanzadas                 ║
║ • Asistencias: 15/16 (93.75%)        ║
║ • Ausencias: 1 (18 Nov)              ║
║ • Tendencia: ↗️ Excelente            ║
║                                        ║
║ Química Orgánica                      ║
║ • Asistencias: 12/14 (85.71%)        ║
║ • Ausencias: 2 (15 Nov, 20 Nov)      ║
║ • Tendencia: → Buena                 ║
║                                        ║
║ Programación Python                   ║
║ • Asistencias: 8/8 (100%)            ║
║ • Ausencias: 0                        ║
║ • Tendencia: ↗️ Perfecta             ║
║                                        ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║                                        ║
║ 🏆 LOGROS                             ║
║ • ⭐ Asistencia Ejemplar             ║
║ • 🎯 Puntualidad Perfecta            ║
║ • 🔥 5 semanas consecutivas >90%     ║
║                                        ║
╚═══════════════════════════════════════╝
```

---

### **Reporte de Clase (Tutor)**

```
╔═══════════════════════════════════════╗
║  📊 Reporte de Clase                  ║
║  Matemáticas Avanzadas                ║
║  Prof. Carlos Ramírez                 ║
╠═══════════════════════════════════════╣
║                                        ║
║ Período: Noviembre 2025               ║
║ Total Estudiantes: 24                 ║
║ Sesiones Realizadas: 16               ║
║                                        ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║                                        ║
║ 📈 ESTADÍSTICAS GENERALES             ║
║                                        ║
║ Asistencia Promedio: 89.5%           ║
║ Mejor Sesión: 95.8% (22 Nov)         ║
║ Peor Sesión: 79.2% (8 Nov)           ║
║                                        ║
║ Registros RFID: 336 (87.5%)          ║
║ Registros Manual: 48 (12.5%)         ║
║                                        ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║                                        ║
║ 👥 ESTUDIANTES DESTACADOS             ║
║                                        ║
║ 🏆 Mejor Asistencia:                  ║
║ 1. Ana López - 100%                   ║
║ 2. María González - 93.75%            ║
║ 3. Carlos Ruiz - 91.2%                ║
║                                        ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║                                        ║
║ ⚠️ REQUIEREN ATENCIÓN                ║
║                                        ║
║ • Pedro Sánchez - 62.5%               ║
║   Ausente últimas 3 sesiones          ║
║                                        ║
║ • Sofia Vargas - 58.3%                ║
║   Patrón irregular de asistencia      ║
║                                        ║
║ Recomendación: Contactar estudiantes  ║
║                                        ║
╚═══════════════════════════════════════╝
```

---

## 🎯 Mejores Prácticas

### **Para Estudiantes**

1. **Configura tu tarjeta** en el primer día
2. **Llega temprano** (ventana de 15 min antes)
3. **Mantén tu tarjeta** en lugar seguro
4. **Verifica registro** en tu dashboard
5. **Contacta al tutor** si hay error

### **Para Tutores**

1. **Revisa asistencias** al inicio de clase
2. **Toma manual** si hay problemas técnicos
3. **Contacta estudiantes** con baja asistencia
4. **Exporta reportes** mensualmente
5. **Reporta problemas** al administrador

### **Para Administradores**

1. **Monitorea Arduino Bridge** diariamente
2. **Revisa logs** de errores
3. **Mantén actualizado** el sistema
4. **Capacita usuarios** nuevos
5. **Haz backups** de registros

---

## 🔐 Seguridad y Privacidad

### **Protección de Datos**

- Códigos RFID **no contienen información personal**
- Asociación tarjeta-estudiante **solo en base de datos**
- Acceso a registros **solo usuarios autorizados**
- Datos **encriptados en tránsito** (HTTPS)
- Logs **no guardan información sensible**

### **Control de Acceso**

- **Estudiantes**: Solo ven sus propias asistencias
- **Tutores**: Solo ven clases que imparten
- **Admins**: Acceso completo pero registrado
- **Arduino Bridge**: Token de servicio limitado

---

## 📝 Resumen

El sistema de asistencias de ClassGo:

✅ **Automatiza** el registro con RFID
✅ **Valida** horarios y clases automáticamente
✅ **Actualiza** en tiempo real dashboards
✅ **Permite** registro manual de respaldo
✅ **Genera** reportes y estadísticas
✅ **Notifica** a estudiantes y tutores
✅ **Maneja** errores inteligentemente
✅ **Protege** datos con seguridad robusta

**Beneficios**:
- Elimina errores humanos
- Ahorra tiempo al tutor
- Transparencia para estudiantes
- Estadísticas precisas
- Seguimiento en tiempo real

---

*Documentación actualizada: Noviembre 2025*
