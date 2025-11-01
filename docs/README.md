# 📚 Índice Completo de Documentación - ClassGo

## 🎯 **Guía Rápida de Navegación**

Esta es tu documentación completa de **ClassGo**. Usa este índice para encontrar rápidamente lo que necesitas.

---

## 📱 **PWA (Progressive Web App)**

### **Para Aprender:**
1. **[PWA-EXPLICACION-COMPLETA.md](./PWA-EXPLICACION-COMPLETA.md)** ⭐ EMPIEZA AQUÍ
   - ¿Qué es una PWA? (Explicación simple)
   - Los 3 componentes: Manifest, Service Worker, App Shell
   - Cómo funciona en tu proyecto
   - Flujo completo: Online vs Offline
   - Verificación y testing
   
2. **[PWA-DIAGRAMAS-VISUALES.md](./PWA-DIAGRAMAS-VISUALES.md)**
   - Diagramas de arquitectura
   - Flujos visuales (peticiones online/offline)
   - Sincronización offline explicada
   - Comparación visual: App Normal vs PWA

3. **[PWA-FAQ.md](./PWA-FAQ.md)**
   - Preguntas y respuestas comunes
   - Troubleshooting
   - Elevator pitch (para presentar)
   - Estadísticas y beneficios

### **Para Implementar:**
4. **[PWA-GUIDE.md](./PWA-GUIDE.md)** (Si existe)
   - Guía práctica de implementación
   - Código de ejemplo
   - Best practices

---

## 🔐 **Sistema de Tokens (Autenticación)**

### **Para Aprender:**
1. **[TOKEN-SYSTEM-GUIDE.md](./TOKEN-SYSTEM-GUIDE.md)** ⭐ EMPIEZA AQUÍ
   - Cómo funciona el sistema de tokens
   - Expiración (24h) y renovación automática (< 2h)
   - Sin librerías externas (HMAC SHA256)
   - Seguridad y firma de tokens
   - Ejemplos paso a paso

### **Para Probar:**
2. **[TOKEN-INTEGRATION-TEST.md](./TOKEN-INTEGRATION-TEST.md)**
   - Plan de pruebas completo
   - 6 pruebas diferentes
   - Resultados esperados
   - Checklist de verificación
   - Comandos para testing

---

## 🏗️ **Arquitectura del Proyecto**

### **Stack Técnico:**
```
Frontend:
├─ HTML5, CSS3, JavaScript (Vanilla)
├─ PWA (Service Worker + Manifest)
├─ IndexedDB (Almacenamiento local)
└─ API Service (Interceptor de peticiones)

Backend:
├─ Node.js + Express.js
├─ Firebase Admin SDK
├─ Firestore (Base de datos)
└─ Firebase Authentication

Seguridad:
├─ Tokens con HMAC SHA256
├─ Expiración de 24h
├─ Renovación automática
└─ Logout automático
```

---

## 📂 **Estructura de Archivos Clave**

### **Frontend:**
```
frontend/
├── html/
│   ├── home.html              # Dashboard admin
│   ├── login.html             # Página de login
│   ├── student-dashboard.html # Dashboard alumno
│   ├── tutor-dashboard.html   # Dashboard tutor
│   ├── test-tokens.html       # Pruebas de tokens
│   └── clear-cache.html       # Limpiar cache PWA
│
├── css/
│   ├── styles.css             # Estilos globales
│   ├── home.css               # Estilos de home
│   ├── student-dashboard.css  # Estilos dashboard alumno
│   └── tutor-dashboard.css    # Estilos dashboard tutor
│
├── js/
│   ├── app.js                 # Lógica principal (login, registro)
│   ├── api-service.js         # ⭐ Interceptor de API (tokens)
│   ├── home.js                # Lógica del panel admin
│   ├── appshell.js            # ⭐ PWA App Shell + IndexedDB
│   ├── student-dashboard.js   # Dashboard alumno
│   └── tutor-dashboard.js     # Dashboard tutor
│
└── images/
    └── icon-192x192.svg       # Ícono PWA
```

### **Backend:**
```
backend/
├── server.js                  # Servidor Express
│
├── config/
│   └── firebaseAdmin.js       # Configuración Firebase
│
├── middleware/
│   ├── authMiddleware.js      # ⭐ Verificación de tokens
│   └── errorMiddleware.js     # Manejo de errores
│
├── routes/
│   ├── auth.js                # ⭐ Login, registro, test-token
│   ├── users.js               # CRUD usuarios
│   ├── classes.js             # Gestión de clases
│   ├── stats.js               # Estadísticas
│   └── notes.js               # Notas
│
├── utils/
│   └── tokenManager.js        # ⭐ Sistema de tokens (crear, verificar, renovar)
│
└── validators/
    └── authValidator.js       # Validación de datos
```

### **PWA:**
```
root/
├── sw.js                      # ⭐ Service Worker
├── manifest.json              # ⭐ Manifest PWA
└── index.html                 # Punto de entrada
```

---

## 🔑 **Archivos Clave Explicados**

### **1. Service Worker (sw.js)**
- **Qué hace:** Intercepta peticiones, cachea archivos, maneja offline
- **Eventos:** install, activate, fetch, sync
- **Cache:** 9 archivos de HOME_APPSHELL
- **Estrategias:** Cache First (app shell), Network First (API)

### **2. API Service (api-service.js)**
- **Qué hace:** Centraliza comunicación con backend, maneja tokens
- **Función clave:** `makeRequest()` - Intercepta respuestas
- **Token renewal:** Detecta header `X-New-Token` y actualiza localStorage
- **Logout automático:** Si token expiró (`tokenExpired: true`)

### **3. Token Manager (tokenManager.js)**
- **Qué hace:** Crea, verifica y renueva tokens sin JWT
- **Funciones:** `createToken()`, `verifyToken()`, `refreshToken()`
- **Seguridad:** HMAC SHA256
- **Expiración:** 24h, renovación < 2h

### **4. Auth Middleware (authMiddleware.js)**
- **Qué hace:** Verifica tokens en cada petición protegida
- **Función:** `authenticateUser()` - Middleware de Express
- **Renovación:** Envía `X-New-Token` en header si debe renovar
- **Rechazo:** 401 con `tokenExpired: true` si expiró

### **5. App Shell (appshell.js)**
- **Qué hace:** Define archivos a cachear + IndexedDB
- **HOME_APPSHELL:** Array de 9 archivos críticos
- **IndexedDB:** 5 stores (userData, categories, classes, stats, syncQueue)
- **Sync Queue:** Operaciones offline pendientes

---

## 🧪 **Testing y Debugging**

### **Herramientas:**
1. **DevTools (F12) → Application Tab:**
   - Service Workers (estado, desregistrar)
   - Cache Storage (ver archivos cacheados)
   - IndexedDB (ver datos locales)
   - Manifest (validar configuración)

2. **DevTools → Network Tab:**
   - Simular offline (checkbox "Offline")
   - Ver headers de respuesta (`X-New-Token`)
   - Inspeccionar peticiones

3. **Console Commands:**
```javascript
// Ver Service Workers registrados
navigator.serviceWorker.getRegistrations()

// Ver caches
caches.keys()

// Ver token actual
localStorage.getItem('authToken')

// Decodificar token
const [payload] = localStorage.getItem('authToken').split('.');
JSON.parse(atob(payload))
```

---

## 🚀 **Flujos Principales**

### **1. Login con Token:**
```
Usuario ingresa email/password
   ↓
app.js → window.apiService.login()
   ↓
Backend verifica credenciales
   ↓
Backend crea token con tokenManager.createToken()
   ↓
Frontend guarda token en localStorage
   ↓
Redirección según rol (admin/tutor/alumno)
```

### **2. Petición con Renovación:**
```
Usuario hace operación (crear usuario)
   ↓
home.js → window.apiService.makeRequest()
   ↓
api-service.js añade token en header
   ↓
Backend → authMiddleware.authenticateUser()
   ↓
Backend verifica token → ¿Expira en < 2h?
   ↓ SÍ
Backend crea nuevo token
   ↓
Backend envía X-New-Token en header
   ↓
api-service.js detecta header
   ↓
api-service.js actualiza localStorage
   ↓
✅ Usuario NO nota nada
```

### **3. Uso Offline:**
```
Usuario abre ClassGo (sin internet)
   ↓
Service Worker intercepta /home
   ↓
SW busca en cache → ✅ Encontrado
   ↓
Usuario ve /home desde cache
   ↓
Usuario crea usuario
   ↓
home.js detecta offline
   ↓
Guarda en IndexedDB (syncQueue)
   ↓
Internet vuelve
   ↓
Background Sync sincroniza automáticamente
   ↓
✅ Usuario creado en servidor
```

---

## 📝 **Comandos Útiles**

### **Desarrollo:**
```bash
# Iniciar backend
cd backend
node server.js

# Abrir en navegador
http://localhost:3000
```

### **Testing:**
```bash
# Limpiar cache PWA
http://localhost:3000/clear-cache

# Probar tokens
http://localhost:3000/test-tokens
```

### **DevTools Console:**
```javascript
// Ver estado completo
console.log({
    sw: await navigator.serviceWorker.getRegistrations(),
    caches: await caches.keys(),
    token: localStorage.getItem('authToken'),
    user: {
        email: localStorage.getItem('userEmail'),
        role: localStorage.getItem('userRole')
    }
});
```

---

## 🎓 **Recursos de Aprendizaje**

### **Para PWA:**
- MDN Web Docs: Service Workers
- web.dev: Progressive Web Apps
- Google Developers: PWA Training

### **Para Tokens/Auth:**
- JWT.io (aunque no usamos librería, concepto similar)
- OWASP: Token-Based Authentication

### **Para IndexedDB:**
- MDN: IndexedDB API
- IndexedDB Promised (concepto, no librería)

---

## 🎯 **Quick Reference**

### **URLs Importantes:**
```
Login:        http://localhost:3000/
Home Admin:   http://localhost:3000/home
Test Tokens:  http://localhost:3000/test-tokens
Clear Cache:  http://localhost:3000/clear-cache
API Docs:     http://localhost:3000/api
```

### **Credenciales de Prueba:**
```
Email:    admin@classgo.com
Password: Admin123!
Rol:      Administrador
```

### **Versiones:**
```
Service Worker: classgo-v3-pwa
IndexedDB:      ClassGoOfflineDB v2
Node.js:        v14+
Firebase:       Admin SDK 11+
```

---

## ✅ **Checklist de Funcionalidades**

### **PWA:**
- [x] Service Worker instalado
- [x] Manifest.json configurado
- [x] App Shell (9 archivos)
- [x] IndexedDB (5 stores)
- [x] Funcionalidad offline
- [x] Background sync
- [x] Instalable como app

### **Autenticación:**
- [x] Login con tokens
- [x] Expiración 24h
- [x] Renovación automática < 2h
- [x] Logout automático si expira
- [x] HMAC SHA256 (seguridad)
- [x] Sin librerías externas

### **Funcionalidades:**
- [x] Panel de administrador
- [x] Gestión de usuarios (CRUD)
- [x] Dashboard alumno
- [x] Dashboard tutor
- [x] Estadísticas
- [x] Operaciones offline
- [x] Sincronización automática

---

**¡Tienes toda la documentación organizada y lista para consultar!** 📚✨

**Documentos principales:**
1. **PWA-EXPLICACION-COMPLETA.md** - Aprende PWA desde cero
2. **TOKEN-SYSTEM-GUIDE.md** - Entiende el sistema de tokens
3. **PWA-FAQ.md** - Respuestas rápidas
4. **Este índice** - Navegación rápida

¿Necesitas que explique algo más específico? 🚀
