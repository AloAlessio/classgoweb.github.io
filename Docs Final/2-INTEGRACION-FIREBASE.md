# 🔥 Integración con Firebase - Guía Completa

## 🎯 ¿Qué es Firebase?

Firebase es una plataforma de Google que proporciona servicios en la nube para aplicaciones web y móviles. En ClassGo, Firebase es el corazón que mantiene todo funcionando: guarda los datos, autentica usuarios y permite comunicación en tiempo real.

**Piensa en Firebase como**:
- 🏦 **Banco de datos**: Donde guardamos toda la información
- 🔐 **Sistema de seguridad**: Quien verifica que eres quien dices ser
- 📡 **Central de comunicaciones**: Que permite mensajes instantáneos

---

## 🏗️ Servicios de Firebase que Usa ClassGo

### 1. **Firebase Authentication** 🔐

**¿Qué hace?**
Maneja el inicio de sesión y registro de usuarios de forma segura.

**¿Cómo funciona en ClassGo?**
- Cuando te registras, Firebase crea tu cuenta
- Cuando inicias sesión, Firebase verifica tu contraseña
- Firebase genera un token único para tu sesión
- Este token se usa en cada acción que realizas

**Ejemplo práctico**:
```
Usuario ingresa:
- Email: estudiante@example.com
- Contraseña: ********

Firebase Authentication:
1. Verifica que el email existe
2. Compara la contraseña encriptada
3. Si es correcto, crea un token de sesión
4. Devuelve información del usuario (UID, email)
```

**¿Dónde está configurado?**
- **Frontend**: `/frontend/js/api-service.js`
- **Backend**: `/backend/config/firebaseAdmin.js`

---

### 2. **Firestore Database** 📊

**¿Qué es?**
Una base de datos NoSQL en tiempo real que guarda toda la información de ClassGo.

**¿Cómo está organizada?**

Firestore organiza los datos en "colecciones" y "documentos", como carpetas y archivos:

```
📁 Firestore Database
│
├── 📁 users (Colección de usuarios)
│   ├── 📄 user123 (Documento individual)
│   │   ├── name: "Juan Pérez"
│   │   ├── email: "juan@example.com"
│   │   ├── role: "estudiante"
│   │   └── status: "activo"
│   │
│   ├── 📄 user456
│   └── 📄 user789
│
├── 📁 classes (Colección de clases)
│   ├── 📄 class001
│   │   ├── subject: "Matemáticas"
│   │   ├── tutorId: "user123"
│   │   ├── schedule: {...}
│   │   └── students: [...]
│   │
│   └── 📄 class002
│
├── 📁 attendance (Colección de asistencias)
│   ├── 📄 attendance001
│   │   ├── studentId: "user789"
│   │   ├── classId: "class001"
│   │   ├── timestamp: "2025-11-22 10:00"
│   │   └── method: "RFID"
│   │
│   └── 📄 attendance002
│
└── 📁 conversations (Colección de mensajes)
    ├── 📄 conv001
    │   ├── participants: ["user123", "user456"]
    │   └── messages: [...]
    │
    └── 📄 conv002
```

---

### **Colecciones Principales**

#### 📁 **users**
Guarda información de todos los usuarios.

**Estructura de un usuario**:
```javascript
{
  uid: "abc123def456",           // ID único de Firebase Auth
  name: "María González",        // Nombre completo
  email: "maria@example.com",    // Correo electrónico
  role: "tutor",                 // Rol: admin, tutor, o alumno
  status: "activo",              // Estado: activo o inactivo
  createdAt: Timestamp,          // Fecha de registro
  lastLogin: Timestamp,          // Último inicio de sesión
  rfidCard: "A1B2C3D4"          // Tarjeta RFID (solo estudiantes)
}
```

**¿Qué operaciones hacemos?**
- **Crear**: Cuando alguien se registra
- **Leer**: Para cargar perfil, validar permisos
- **Actualizar**: Cambiar rol, estado, información personal
- **Eliminar**: Solo admins pueden borrar usuarios

---

#### 📁 **classes**
Almacena todas las clases creadas por tutores.

**Estructura de una clase**:
```javascript
{
  id: "class123",                      // ID único de la clase
  subject: "Programación Python",      // Nombre de la materia
  description: "Curso básico...",      // Descripción
  tutorId: "tutor456",                 // ID del tutor creador
  tutorName: "Prof. Carlos",           // Nombre del tutor
  schedule: {
    startTime: "10:00",                // Hora de inicio
    endTime: "11:30",                  // Hora de fin
    days: ["lunes", "miércoles"]       // Días de la semana
  },
  capacity: 30,                        // Máximo de estudiantes
  enrolledStudents: ["std1", "std2"],  // IDs de inscritos
  status: "activo",                    // Estado de la clase
  createdAt: Timestamp                 // Fecha de creación
}
```

**¿Qué operaciones hacemos?**
- **Crear**: Tutor crea nueva clase
- **Leer**: Mostrar clases disponibles, detalles
- **Actualizar**: Editar horario, agregar estudiantes
- **Eliminar**: Tutor puede borrar su clase

---

#### 📁 **attendance**
Registra cada asistencia de estudiantes a clases.

**Estructura de una asistencia**:
```javascript
{
  id: "att789",                   // ID único del registro
  studentId: "std123",            // ID del estudiante
  studentName: "Ana López",       // Nombre del estudiante
  classId: "class456",            // ID de la clase
  className: "Matemáticas",       // Nombre de la clase
  timestamp: Timestamp,           // Fecha y hora exacta
  method: "RFID",                 // Método: RFID o Manual
  status: "presente",             // Estado: presente, tarde, falta
  validatedBy: "tutor789"         // Quién validó (si es manual)
}
```

**¿Qué operaciones hacemos?**
- **Crear**: Al registrar asistencia (RFID o manual)
- **Leer**: Ver historial, generar reportes
- **Actualizar**: Corregir errores (solo tutores)
- **Eliminar**: Casi nunca, solo en casos especiales

---

#### 📁 **conversations**
Almacena mensajes entre usuarios.

**Estructura de una conversación**:
```javascript
{
  id: "conv123",                           // ID de la conversación
  participants: ["user1", "user2"],        // IDs de participantes
  participantNames: ["Juan", "María"],     // Nombres
  lastMessage: "Hola, ¿cómo estás?",      // Último mensaje
  lastMessageTime: Timestamp,              // Timestamp del último
  unreadCount: {                           // Mensajes no leídos
    user1: 0,
    user2: 3
  },
  messages: [                              // Array de mensajes
    {
      id: "msg1",
      senderId: "user1",
      text: "Hola",
      timestamp: Timestamp,
      read: true
    },
    {
      id: "msg2",
      senderId: "user2",
      text: "¿Cómo estás?",
      timestamp: Timestamp,
      read: false
    }
  ]
}
```

**¿Qué operaciones hacemos?**
- **Crear**: Nueva conversación o mensaje
- **Leer**: Cargar mensajes, actualizar chat
- **Actualizar**: Marcar como leído, agregar mensaje
- **Listeners**: Escuchan cambios en tiempo real

---

## 🔄 Flujo de Comunicación con Firebase

### **Ejemplo Completo: Estudiante registra asistencia**

#### **Paso 1: Estudiante pasa tarjeta RFID**
```
Lector RFID detecta tarjeta
↓
Arduino Bridge lee: "A1B2C3D4"
↓
Envía a Backend: POST /attendance/rfid
```

#### **Paso 2: Backend valida**
```javascript
1. Recibe RFID: "A1B2C3D4"
2. Busca en Firestore users donde rfidCard = "A1B2C3D4"
3. Encuentra: {
     uid: "std123",
     name: "Ana López",
     role: "alumno"
   }
4. Verifica que el estudiante tiene clases activas ahora
5. Encuentra clase: "Matemáticas" (class456)
```

#### **Paso 3: Guarda en Firestore**
```javascript
firestore.collection('attendance').add({
  studentId: "std123",
  studentName: "Ana López",
  classId: "class456",
  className: "Matemáticas",
  timestamp: new Date(),
  method: "RFID",
  status: "presente"
})
```

#### **Paso 4: Responde al frontend**
```javascript
Backend responde: {
  success: true,
  message: "Asistencia registrada",
  data: {
    studentName: "Ana López",
    className: "Matemáticas"
  }
}
```

#### **Paso 5: Frontend actualiza interfaz**
```javascript
// Muestra notificación
showNotification('success', '✓ Asistencia registrada para Ana López')

// Actualiza tabla de asistencias en tiempo real
// El tutor ve la asistencia aparecer automáticamente
```

---

## 🔐 Seguridad en Firebase

### **Reglas de Firestore**

Firebase tiene un sistema de reglas que controla quién puede leer/escribir datos.

**Ejemplo de reglas en ClassGo**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuarios pueden leer su propia información
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId 
                   || request.auth.token.role == 'administrador';
    }
    
    // Solo tutores pueden crear clases
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow create: if request.auth.token.role in ['tutor', 'administrador'];
      allow update, delete: if request.auth.token.role == 'administrador'
                            || resource.data.tutorId == request.auth.uid;
    }
    
    // Asistencias - validación estricta
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow create: if request.auth.token.role in ['tutor', 'administrador'];
      allow update: if request.auth.token.role in ['tutor', 'administrador'];
      allow delete: if request.auth.token.role == 'administrador';
    }
  }
}
```

**¿Qué significan estas reglas?**
- **read**: Quién puede ver los datos
- **write**: Quién puede crear/modificar/borrar
- **request.auth**: Información del usuario autenticado
- **resource.data**: Datos actuales del documento

---

## 🛠️ Configuración de Firebase en ClassGo

### **Frontend Configuration**

**Archivo**: `/frontend/js/firebase-config.js` (implícito en api-service.js)

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

**¿Qué hace cada valor?**
- **apiKey**: Clave para conectarse a Firebase (pública, está bien exponerla)
- **authDomain**: Dominio de autenticación
- **projectId**: ID único de tu proyecto Firebase
- **storageBucket**: Almacenamiento de archivos (no lo usamos actualmente)
- **messagingSenderId**: Para notificaciones push
- **appId**: Identificador de la aplicación

---

### **Backend Configuration**

**Archivo**: `/backend/config/firebaseAdmin.js`

```javascript
const admin = require('firebase-admin');

// Inicializa con credenciales de servicio
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();
```

**¿Qué es serviceAccountKey.json?**
Es un archivo secreto con credenciales de administrador. **¡NUNCA debe compartirse públicamente!**

**Contiene**:
- private_key: Clave privada para autenticación
- client_email: Email de servicio
- project_id: ID del proyecto

---

## 📡 Comunicación en Tiempo Real

### **Listeners de Firestore**

Una de las características más poderosas de Firestore es la capacidad de escuchar cambios en tiempo real.

**Ejemplo: Chat en tiempo real**

```javascript
// Frontend escucha nuevos mensajes
firestore.collection('conversations')
  .doc(conversationId)
  .onSnapshot((snapshot) => {
    // Cada vez que hay un cambio, esta función se ejecuta
    const messages = snapshot.data().messages;
    updateChatUI(messages);
  });
```

**¿Cómo funciona?**
1. Frontend se "suscribe" a una conversación
2. Firestore mantiene conexión abierta
3. Cuando alguien envía mensaje, Firestore notifica
4. Frontend actualiza interfaz automáticamente
5. Todo en milisegundos ⚡

**Beneficios**:
- Sin necesidad de recargar página
- Sincronización instantánea
- Múltiples usuarios ven cambios simultáneamente

---

## 🔄 Token System (Sistema de Tokens)

### **¿Qué son los tokens?**

Los tokens son "carnets digitales" que prueban tu identidad en cada solicitud.

**Flujo de tokens en ClassGo**:

#### **1. Login**
```
Usuario inicia sesión
↓
Firebase Authentication valida
↓
Genera token JWT (JSON Web Token)
↓
Frontend guarda en localStorage
```

#### **2. Cada solicitud**
```
Frontend hace solicitud a backend
↓
Incluye token en headers: Authorization: Bearer {token}
↓
Backend verifica token con Firebase Admin
↓
Extrae información del usuario (uid, role)
↓
Procesa solicitud con permisos validados
```

#### **3. Token expira**
```
Token antiguo ya no es válido
↓
Frontend detecta error 401 (No autorizado)
↓
Solicita nuevo token automáticamente
↓
Reintenta solicitud original
```

**Archivo que maneja tokens**: `/backend/middleware/authMiddleware.js`

```javascript
async function verifyToken(req, res, next) {
  try {
    // Extrae token del header
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    // Verifica con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Agrega info del usuario al request
    req.user = decodedToken;
    
    // Continúa con la solicitud
    next();
  } catch (error) {
    res.status(401).json({ error: 'No autorizado' });
  }
}
```

---

## 🔍 Consultas Comunes en Firestore

### **Buscar usuario por email**
```javascript
const snapshot = await firestore
  .collection('users')
  .where('email', '==', 'usuario@example.com')
  .limit(1)
  .get();

const user = snapshot.docs[0].data();
```

### **Obtener clases de un tutor**
```javascript
const snapshot = await firestore
  .collection('classes')
  .where('tutorId', '==', tutorId)
  .where('status', '==', 'activo')
  .orderBy('createdAt', 'desc')
  .get();

const classes = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### **Asistencias de un estudiante**
```javascript
const snapshot = await firestore
  .collection('attendance')
  .where('studentId', '==', studentId)
  .where('timestamp', '>=', startDate)
  .where('timestamp', '<=', endDate)
  .orderBy('timestamp', 'desc')
  .get();
```

---

## 📊 Ventajas de Usar Firebase

### **✅ Ventajas**

1. **Escalabilidad Automática**: Se ajusta a la demanda sin configuración
2. **Tiempo Real**: Actualizaciones instantáneas
3. **Seguridad Integrada**: Autenticación y reglas robustas
4. **Sin Servidor**: No necesitas mantener servidores
5. **Rápido**: Datos replicados globalmente
6. **Backup Automático**: Firebase guarda copias de seguridad
7. **Gratis para empezar**: Plan gratuito generoso

### **⚠️ Consideraciones**

1. **Costo por Uso**: Puede aumentar con muchos usuarios
2. **Curva de Aprendizaje**: NoSQL es diferente a SQL
3. **Límites de Consulta**: Algunas consultas complejas no son posibles
4. **Dependencia de Google**: Estás atado a su plataforma

---

## 🎯 Resumen de Integración

### **¿Cómo se conecta todo?**

```
┌─────────────────┐
│   FRONTEND      │  Usuario interactúa
│  (HTML/JS/CSS)  │
└────────┬────────┘
         │
         ↓ Solicitudes HTTP
┌─────────────────┐
│    BACKEND      │  Valida y procesa
│   (Node.js)     │
└────────┬────────┘
         │
         ↓ Firebase Admin SDK
┌─────────────────┐
│    FIREBASE     │
│                 │
│ • Auth          │  Autentica usuarios
│ • Firestore     │  Guarda datos
│ • Real-time     │  Sincroniza cambios
└─────────────────┘
```

### **Puntos clave**:

1. **Frontend** usa Firebase directamente para auth
2. **Backend** usa Firebase Admin para operaciones seguras
3. **Firestore** es la única fuente de verdad
4. **Tokens** mantienen sesión segura
5. **Listeners** permiten actualizaciones en tiempo real
6. **Reglas** protegen los datos

---

*Documentación actualizada: Noviembre 2025*
