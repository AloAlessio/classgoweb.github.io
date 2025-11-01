# 🔑 ¿Dónde Obtener las Credenciales de Firebase?

Esta guía explica **exactamente** dónde se obtienen las dos configuraciones diferentes de Firebase.

---

## 📱 OPCIÓN 1: Firebase Client SDK (Frontend - Web App)

### ¿Dónde obtenerlo?

1. **Ir a Firebase Console:**
   ```
   https://console.firebase.google.com
   ```

2. **Seleccionar tu proyecto:**
   ```
   classgo-324dd
   ```

3. **Ir a Configuración del Proyecto:**
   ```
   Icono ⚙️ (arriba izquierda) → Configuración del proyecto
   ```

4. **Scroll down hasta "Tus apps":**
   ```
   Verás sección: "Tus apps"
   Click en el icono Web </> o tu app existente
   ```

5. **Copiar el código:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyA5D1UCIQ2nzNwVPHFoub46uflwM4PKzmo",
     authDomain: "classgo-324dd.firebaseapp.com",
     projectId: "classgo-324dd",
     storageBucket: "classgo-324dd.firebasestorage.app",
     messagingSenderId: "1079859024722",
     appId: "1:1079859024722:web:13b56092cc678063c6e08b",
     measurementId: "G-H5QE3QHPTV"
   };
   ```

### ⚠️ Características:

- ✅ **Es PÚBLICO** - puede estar en código frontend
- ✅ **No es secreto** - Firebase sabe que cualquiera puede verlo
- ⚠️ **Limitado** - solo funciona con reglas de seguridad de Firestore
- ⚠️ **Restringido** - no puede hacer operaciones administrativas

### 📄 Archivo en tu proyecto:
```
frontend/js/firebase-config.js
```

---

## 🔐 OPCIÓN 2: Firebase Admin SDK (Backend - Service Account)

### ¿Dónde obtenerlo?

1. **Ir a Firebase Console:**
   ```
   https://console.firebase.google.com
   ```

2. **Seleccionar tu proyecto:**
   ```
   classgo-324dd
   ```

3. **Ir a Configuración del Proyecto:**
   ```
   Icono ⚙️ (arriba izquierda) → Configuración del proyecto
   ```

4. **Ir a la pestaña "Cuentas de servicio":**
   ```
   En el menú superior, click en: "Cuentas de servicio" (Service accounts)
   ```

5. **Generar nueva clave privada:**
   ```
   Click en botón: "Generar nueva clave privada"
   Se descargará un archivo JSON
   ```

6. **Archivo JSON descargado:**
   ```json
   {
     "type": "service_account",
     "project_id": "classgo-324dd",
     "private_key_id": "abc123...",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@classgo-324dd.iam.gserviceaccount.com",
     "client_id": "123456789",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
   }
   ```

7. **Extraer datos al .env:**
   ```env
   FIREBASE_PROJECT_ID=classgo-324dd
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@classgo-324dd.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### 🔒 Características:

- 🔐 **ES SECRETO** - NUNCA exponerlo públicamente
- 🔐 **Solo backend** - debe estar en servidor
- ✅ **Control total** - puede hacer TODO en Firebase
- ✅ **Sin restricciones** - ignora reglas de seguridad
- ⚠️ **MUY PELIGROSO** si se filtra

### 📄 Archivo en tu proyecto:
```
backend/.env (NUNCA subir a Git)
backend/config/firebaseAdmin.js
```

---

## 📊 COMPARACIÓN VISUAL

```
┌────────────────────────────────────────────────────────────┐
│           FIREBASE CLIENT SDK                              │
├────────────────────────────────────────────────────────────┤
│ Ubicación en Console:                                      │
│   ⚙️ Configuración → General → Tus apps → Web </> │
│                                                            │
│ Datos obtenidos:                                           │
│   • apiKey                                                 │
│   • authDomain                                             │
│   • projectId                                              │
│   • storageBucket                                          │
│   • messagingSenderId                                      │
│   • appId                                                  │
│   • measurementId                                          │
│                                                            │
│ Seguridad: 🟡 Público (protegido por reglas)              │
│ Permisos: 🟡 Limitado                                      │
│ Uso: Frontend                                              │
└────────────────────────────────────────────────────────────┘

                          VS

┌────────────────────────────────────────────────────────────┐
│          FIREBASE ADMIN SDK                                │
├────────────────────────────────────────────────────────────┤
│ Ubicación en Console:                                      │
│   ⚙️ Configuración → Cuentas de servicio →                │
│   "Generar nueva clave privada"                            │
│                                                            │
│ Datos obtenidos (JSON file):                              │
│   • project_id                                             │
│   • private_key (🔐 CLAVE PRIVADA)                        │
│   • client_email                                           │
│   • private_key_id                                         │
│   • ... más datos secretos ...                            │
│                                                            │
│ Seguridad: 🔴 SECRETO (nunca exponer)                     │
│ Permisos: 🟢 Control total                                 │
│ Uso: Backend (servidor)                                    │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 EJEMPLO: Tu Configuración Actual

### Frontend (NO USADO):

**Archivo:** `frontend/js/firebase-config.js`

```javascript
// Estos datos son de: Configuración → General → Tus apps → Web
const firebaseConfig = {
  apiKey: "AIzaSyA5D1UCIQ2nzNwVPHFoub46uflwM4PKzmo",
  authDomain: "classgo-324dd.firebaseapp.com",
  projectId: "classgo-324dd",
  storageBucket: "classgo-324dd.firebasestorage.app",
  messagingSenderId: "1079859024722",
  appId: "1:1079859024722:web:13b56092cc678063c6e08b",
  measurementId: "G-H5QE3QHPTV"
};
```

---

### Backend (USADO):

**Archivo:** `backend/.env`

```env
# Estos datos son de: Configuración → Cuentas de servicio → Generar clave privada
FIREBASE_PROJECT_ID=classgo-324dd
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@classgo-324dd.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://classgo-324dd-default-rtdb.firebaseio.com/
```

**Archivo:** `backend/config/firebaseAdmin.js`

```javascript
const admin = require('firebase-admin');

// Lee las credenciales del .env
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});
```

---

## 🔄 ¿QUÉ REEMPLAZA QUÉ?

### Lo que NO se usa (Client SDK):
```javascript
import { initializeApp } from "firebase/app";

const app = initializeApp(firebaseConfig);  // ← Esto NO se ejecuta
```

### Lo que SÍ se usa (Admin SDK):
```javascript
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  })
});

// Ahora el backend puede hacer:
admin.firestore()        // Acceder a base de datos
admin.auth()            // Gestionar usuarios
admin.storage()         // Acceder a archivos
```

---

## ⚡ PASO A PASO: Cómo lo configuraste

### 1. Descargaste archivo JSON de Firebase

Firebase Console → Cuentas de servicio → Generar clave privada

Archivo descargado: `classgo-324dd-firebase-adminsdk-xxxxx.json`

### 2. Copiaste datos al .env

Del archivo JSON copiaste:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY`

### 3. Backend lee el .env

```javascript
// backend/config/firebaseAdmin.js
const projectId = process.env.FIREBASE_PROJECT_ID;  // Lee del .env
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey
  })
});
```

---

## ✅ RESUMEN

| Aspecto | Client SDK (Web) | Admin SDK (Service Account) |
|---------|------------------|----------------------------|
| **Dónde obtener** | Configuración → General → Tus apps | Configuración → Cuentas de servicio |
| **Formato** | Objeto JavaScript | Archivo JSON |
| **Datos clave** | apiKey, authDomain, appId | private_key, client_email |
| **Seguridad** | Público | 🔐 SECRETO |
| **Ubicación** | frontend/js/ | backend/.env |
| **Uso en ClassGo** | ❌ NO (comentado) | ✅ SÍ (activo) |

---

## 🆘 ¿Cómo regenerar credenciales?

### Client SDK (apiKey, etc.):
1. Firebase Console → Configuración del proyecto
2. General → Tus apps → Click en tu app web
3. Copiar código nuevamente

### Admin SDK (private_key, etc.):
1. Firebase Console → Configuración del proyecto
2. Cuentas de servicio → "Generar nueva clave privada"
3. **⚠️ ADVERTENCIA:** La clave anterior dejará de funcionar
4. Actualizar `backend/.env` con nuevos valores

---

**Última actualización:** Octubre 2025
