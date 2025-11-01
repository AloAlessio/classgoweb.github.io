# 📁 Archivos con la Lógica de Sesión Persistente

## 🎯 **Pregunta**

**"¿En qué archivos está toda la lógica de mantener la sesión logueada?"**

---

## 📋 **Resumen Rápido**

```
BACKEND (Node.js):
📁 backend/utils/tokenManager.js          → Crear, verificar, renovar tokens
📁 backend/routes/auth.js                 → Login endpoint (genera token)
📁 backend/middleware/authMiddleware.js   → Verificar token en cada petición

FRONTEND (JavaScript):
📁 frontend/js/api-service.js             → Detectar renovación, auto-logout
📁 frontend/js/app.js                     → Verificar sesión al cargar
📁 frontend/js/home.js                    → Usar apiService en peticiones

HTML:
📁 frontend/html/login.html               → Formulario de login
📁 frontend/html/home.html                → Panel de administración
```

---

## 🔧 **BACKEND - Archivos del Servidor**

### **1️⃣ backend/utils/tokenManager.js** ⭐ **ARCHIVO CLAVE**

**¿Qué hace?**
- Crea tokens con firma HMAC SHA256
- Verifica si un token es válido
- Decide si debe renovarse
- Renueva tokens automáticamente

**Funciones principales:**

```javascript
// 📍 Línea 1-10: Configuración
const crypto = require('crypto');
const SECRET_KEY = process.env.SECRET_KEY || 'tu_clave_secreta_aqui';
const TOKEN_EXPIRATION = 24 * 60 * 60 * 1000;  // 24 horas
const REFRESH_THRESHOLD = 2 * 60 * 60 * 1000;  // Renovar si quedan < 2h

// 📍 Línea 12-40: Crear token
function createToken(userData) {
    const payload = {
        email: userData.email,
        userId: userData.userId,
        role: userData.role,
        iat: Date.now(),                      // Issued At (creado)
        exp: Date.now() + TOKEN_EXPIRATION   // Expiration (expira)
    };
    
    const payloadBase64 = Buffer.from(JSON.stringify(payload))
        .toString('base64');
    
    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(payloadBase64)
        .digest('base64');
    
    return `${payloadBase64}.${signature}`;
}

// 📍 Línea 42-80: Verificar token
function verifyToken(token) {
    try {
        const [payloadBase64, receivedSignature] = token.split('.');
        
        // Verificar firma
        const expectedSignature = crypto
            .createHmac('sha256', SECRET_KEY)
            .update(payloadBase64)
            .digest('base64');
        
        if (receivedSignature !== expectedSignature) {
            return { valid: false, error: 'Invalid signature' };
        }
        
        // Decodificar payload
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
        
        // Verificar expiración
        if (Date.now() > payload.exp) {
            return { valid: false, error: 'Token expired', expired: true };
        }
        
        // Verificar si debe renovarse (quedan < 2h)
        const shouldRefresh = (payload.exp - Date.now()) < REFRESH_THRESHOLD;
        
        return {
            valid: true,
            payload: payload,
            shouldRefresh: shouldRefresh
        };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// 📍 Línea 82-95: Renovar token
function refreshToken(payload) {
    const newPayload = {
        email: payload.email,
        userId: payload.userId,
        role: payload.role,
        iat: Date.now(),
        exp: Date.now() + TOKEN_EXPIRATION
    };
    
    return createToken(newPayload);
}

// 📍 Línea 97-120: Otras funciones útiles
function decodeToken(token) { ... }          // Decodificar sin verificar
function getTimeRemaining(token) { ... }     // Tiempo restante en ms

module.exports = {
    createToken,
    verifyToken,
    refreshToken,
    decodeToken,
    getTimeRemaining
};
```

**Ubicación física:**
```
AloAlessio.github.io-main/
└── backend/
    └── utils/
        └── tokenManager.js  ⭐ AQUÍ
```

---

### **2️⃣ backend/routes/auth.js**

**¿Qué hace?**
- Endpoint de login (`POST /api/auth/login`)
- Verifica email y password en Firebase
- Genera token usando `createToken()`
- Devuelve token al frontend

**Código relevante:**

```javascript
// 📍 Línea 1-5: Imports
const express = require('express');
const router = express.Router();
const admin = require('../config/firebaseAdmin');
const { createToken } = require('../utils/tokenManager');  // ⭐ IMPORTA tokenManager

// 📍 Línea 15-80: Endpoint de LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Verificar en Firebase Authentication
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // 2. Verificar password (simulado porque Firebase no expone password)
        // En producción: usar Firebase Auth REST API
        
        // 3. Obtener datos adicionales de Firestore
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userRecord.uid)
            .get();
        
        const userData = userDoc.data();
        
        // 4. ⭐ CREAR TOKEN usando tokenManager
        const token = createToken({
            email: email,
            userId: userDoc.id,
            role: userData.role
        });
        
        // 5. Enviar token al frontend
        res.json({
            success: true,
            token: token,  // ⭐ TOKEN AQUÍ
            user: {
                email: email,
                role: userData.role,
                name: userData.name
            }
        });
        
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Credenciales inválidas'
        });
    }
});

// 📍 Línea 85-110: Endpoint de TEST (simular tokens)
router.post('/test-token', async (req, res) => {
    const { timeRemaining } = req.body;
    
    // Crear token que expira en X segundos
    const token = createToken({
        email: "test@classgo.com",
        userId: "test123",
        role: "administrador",
        customExp: Date.now() + timeRemaining
    });
    
    res.json({ token });
});

module.exports = router;
```

**Ubicación física:**
```
AloAlessio.github.io-main/
└── backend/
    └── routes/
        └── auth.js  ⭐ AQUÍ
```

---

### **3️⃣ backend/middleware/authMiddleware.js**

**¿Qué hace?**
- Se ejecuta en CADA petición protegida
- Verifica que el token sea válido
- Si quedan < 2h, genera nuevo token
- Envía nuevo token en header `X-New-Token`

**Código completo:**

```javascript
// 📍 Línea 1-5: Imports
const { verifyToken, refreshToken } = require('../utils/tokenManager');

// 📍 Línea 7-70: Middleware de autenticación
async function authenticateUser(req, res, next) {
    try {
        // 1. Obtener token del header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado',
                tokenExpired: true
            });
        }
        
        const token = authHeader.split('Bearer ')[1];
        
        // 2. ⭐ VERIFICAR TOKEN
        const { valid, payload, shouldRefresh, expired } = verifyToken(token);
        
        // 3. Si expiró → RECHAZAR
        if (!valid) {
            return res.status(401).json({
                success: false,
                error: expired ? 'Token expirado' : 'Token inválido',
                tokenExpired: true  // ⭐ Flag para frontend
            });
        }
        
        // 4. ⭐ Si debe renovarse → GENERAR NUEVO
        let newToken = null;
        if (shouldRefresh) {
            newToken = refreshToken(payload);
            console.log('🔄 Token renovado para:', payload.email);
        }
        
        // 5. Agregar usuario a request (para usar en routes)
        req.user = payload;
        
        // 6. ⭐ ENVIAR NUEVO TOKEN en header (si se renovó)
        if (newToken) {
            res.setHeader('X-New-Token', newToken);
        }
        
        // 7. Continuar con la petición
        next();
        
    } catch (error) {
        console.error('❌ Error en authenticateUser:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al verificar autenticación'
        });
    }
}

module.exports = { authenticateUser };
```

**¿Dónde se usa este middleware?**

```javascript
// En backend/routes/users.js:
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/api/users', authenticateUser, async (req, res) => {
    // ⬆️ authenticateUser se ejecuta ANTES de este código
    // req.user ya tiene { email, userId, role }
});

// En backend/routes/notes.js:
router.post('/api/notes', authenticateUser, async (req, res) => {
    // ⬆️ authenticateUser verifica token primero
});
```

**Ubicación física:**
```
AloAlessio.github.io-main/
└── backend/
    └── middleware/
        └── authMiddleware.js  ⭐ AQUÍ
```

---

## 🎨 **FRONTEND - Archivos del Cliente**

### **4️⃣ frontend/js/api-service.js** ⭐ **ARCHIVO CLAVE FRONTEND**

**¿Qué hace?**
- Maneja TODAS las peticiones HTTP
- Envía token en header `Authorization`
- Detecta header `X-New-Token` y actualiza localStorage
- Detecta `tokenExpired` y hace logout automático

**Código completo:**

```javascript
// 📍 Línea 1-20: Clase ApiService
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.token = localStorage.getItem('authToken');  // ⭐ Lee token
    }
    
    // 📍 Línea 22-120: Método principal de peticiones
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };
        
        // ⭐ AGREGAR TOKEN al header
        if (this.token) {
            defaultHeaders['Authorization'] = `Bearer ${this.token}`;
        }
        
        const config = {
            method: options.method || 'GET',
            headers: { ...defaultHeaders, ...options.headers },
            body: options.body ? JSON.stringify(options.body) : undefined
        };
        
        try {
            // Enviar petición
            const response = await fetch(url, config);
            
            // ⭐ DETECTAR TOKEN NUEVO en header
            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                console.log('🔄 Token renovado automáticamente');
                localStorage.setItem('authToken', newToken);  // ⭐ ACTUALIZAR
                this.token = newToken;
            }
            
            const data = await response.json();
            
            // ⭐ DETECTAR TOKEN EXPIRADO
            if (data.tokenExpired) {
                console.log('❌ Token expirado - Cerrando sesión...');
                this.clearAuth();
                localStorage.clear();
                window.location.href = '/';  // ⭐ REDIRECT A LOGIN
                return { success: false, error: 'Sesión expirada' };
            }
            
            return data;
            
        } catch (error) {
            console.error('❌ Error en petición:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 📍 Línea 122-135: Métodos auxiliares
    clearAuth() {
        this.token = null;
        localStorage.removeItem('authToken');
    }
    
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }
}

// 📍 Línea 137-140: Exportar instancia global
window.apiService = new ApiService();
```

**Ubicación física:**
```
AloAlessio.github.io-main/
└── frontend/
    └── js/
        └── api-service.js  ⭐ AQUÍ
```

---

### **5️⃣ frontend/js/app.js**

**¿Qué hace?**
- Se ejecuta al cargar cualquier página
- Verifica si hay token en localStorage
- Si no hay token → redirige a login
- Si hay token → permite acceso

**Código relevante:**

```javascript
// 📍 Línea 1-50: Verificación de sesión
window.addEventListener('DOMContentLoaded', async () => {
    
    // 1. ⭐ VERIFICAR SI HAY TOKEN
    const token = localStorage.getItem('authToken');
    const currentPath = window.location.pathname;
    
    // 2. Si NO hay token y NO estás en login → REDIRECT
    if (!token && currentPath !== '/' && currentPath !== '/index.html') {
        console.log('❌ No hay sesión activa, redirigiendo a login...');
        window.location.href = '/';
        return;
    }
    
    // 3. Si hay token y estás en login → REDIRECT a home
    if (token && (currentPath === '/' || currentPath === '/index.html')) {
        console.log('✅ Sesión activa, redirigiendo a home...');
        window.location.href = '/home';
        return;
    }
    
    // 4. Si hay token → Verificar que sea válido
    if (token) {
        try {
            // Hacer petición de prueba para verificar token
            const response = await window.apiService.makeRequest('/api/auth/verify');
            
            if (!response.success) {
                // Token inválido → Limpiar y redirect
                localStorage.clear();
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            localStorage.clear();
            window.location.href = '/';
        }
    }
    
    // 5. Cargar contenido de la página
    console.log('✅ Sesión verificada correctamente');
});

// 📍 Línea 55-70: Botón de logout
function logout() {
    console.log('🚪 Cerrando sesión...');
    localStorage.clear();  // ⭐ BORRAR TOKEN
    window.apiService.clearAuth();
    window.location.href = '/';  // ⭐ REDIRECT A LOGIN
}
```

**Ubicación física:**
```
AloAlessio.github.io-main/
└── frontend/
    └── js/
        └── app.js  ⭐ AQUÍ
```

---

### **6️⃣ frontend/js/home.js**

**¿Qué hace?**
- Lógica del panel de administración
- Usa `window.apiService` para todas las peticiones
- Las peticiones automáticamente incluyen token

**Código relevante:**

```javascript
// 📍 Línea 10-50: Cargar usuarios
async function loadUsers() {
    try {
        // ⭐ USA apiService (token incluido automáticamente)
        const response = await window.apiService.makeRequest('/api/users', {
            method: 'GET'
        });
        
        if (response.success) {
            displayUsers(response.users);
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// 📍 Línea 100-140: Crear usuario
async function confirmCreateUser() {
    const newUser = {
        name: document.getElementById('createUserName').value,
        email: document.getElementById('createUserEmail').value,
        role: document.getElementById('createUserRole').value
    };
    
    // ⭐ USA apiService (token incluido automáticamente)
    const response = await window.apiService.makeRequest('/api/users', {
        method: 'POST',
        body: newUser
    });
    
    if (response.success) {
        alert('Usuario creado exitosamente');
        loadUsers();
    }
}

// 📍 Línea 200-240: Cambiar rol de usuario
async function changeUserRole(userId, newRole) {
    // ⭐ USA apiService (token incluido automáticamente)
    const response = await window.apiService.makeRequest(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: { role: newRole }
    });
    
    if (response.success) {
        alert('Rol actualizado');
        loadUsers();
    }
}

// ⚠️ ANTES usaba fetch() directo (SIN renovación automática):
// const response = await fetch('/api/users', { ... });

// ✅ AHORA usa apiService (CON renovación automática):
// const response = await window.apiService.makeRequest('/api/users', { ... });
```

**Ubicación física:**
```
AloAlessio.github.io-main/
└── frontend/
    └── js/
        └── home.js  ⭐ AQUÍ
```

---

## 📄 **HTML - Páginas**

### **7️⃣ frontend/html/login.html**

**¿Qué hace?**
- Formulario de login (email + password)
- Al hacer submit, llama a `/api/auth/login`
- Guarda token en localStorage
- Redirige a `/home`

**Código relevante:**

```html
<!-- 📍 Línea 30-60: Formulario -->
<form id="loginForm">
    <input type="email" id="email" placeholder="Email" required>
    <input type="password" id="password" placeholder="Password" required>
    <button type="submit">Iniciar Sesión</button>
</form>

<script>
// 📍 Línea 80-130: Lógica de login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // 1. Enviar credenciales al backend
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 2. ⭐ GUARDAR TOKEN en localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userRole', data.user.role);
            
            // 3. ⭐ REDIRIGIR a home
            window.location.href = '/home';
        } else {
            alert('Credenciales inválidas');
        }
    } catch (error) {
        console.error('Error en login:', error);
        alert('Error al iniciar sesión');
    }
});
</script>
```

**Ubicación física:**
```
AloAlessio.github.io-main/
└── frontend/
    └── html/
        └── login.html  ⭐ AQUÍ
```

---

### **8️⃣ frontend/html/home.html**

**¿Qué hace?**
- Panel de administración (solo para usuarios logueados)
- Carga `app.js` (verifica sesión)
- Carga `api-service.js` (maneja peticiones)
- Carga `home.js` (lógica específica del panel)

**Código relevante:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <title>ClassGo - Admin Panel</title>
    <link rel="stylesheet" href="/frontend/css/home.css">
</head>
<body>
    <div id="content">
        <!-- Contenido del panel -->
    </div>
    
    <!-- 📍 Scripts en orden correcto -->
    <script src="/frontend/js/appshell.js"></script>     <!-- IndexedDB -->
    <script src="/frontend/js/api-service.js"></script>  <!-- ⭐ Peticiones con token -->
    <script src="/frontend/js/app.js"></script>          <!-- ⭐ Verificar sesión -->
    <script src="/frontend/js/home.js"></script>         <!-- Lógica del panel -->
</body>
</html>
```

**Ubicación física:**
```
AloAlessio.github.io-main/
└── frontend/
    └── html/
        └── home.html  ⭐ AQUÍ
```

---

## 🔄 **Flujo Completo por Archivo**

### **Login (primera vez):**

```
1. Usuario abre: frontend/html/login.html
   └─ Muestra formulario

2. Usuario ingresa email y password
   └─ login.html (JavaScript): POST /api/auth/login

3. backend/routes/auth.js recibe petición
   └─ Verifica en Firebase
   └─ Llama: backend/utils/tokenManager.js → createToken()
   └─ Devuelve: { success: true, token: "..." }

4. login.html (JavaScript) recibe respuesta
   └─ localStorage.setItem('authToken', token)  ⭐
   └─ window.location.href = '/home'

5. Usuario ya está logueado ✅
```

---

### **Navegación (con sesión activa):**

```
1. Usuario abre: frontend/html/home.html
   
2. Se carga: frontend/js/app.js
   └─ Lee: localStorage.getItem('authToken')
   └─ ¿Hay token? ✅ SÍ → Continuar
   
3. Se carga: frontend/js/home.js
   └─ Llama: window.apiService.makeRequest('/api/users')

4. frontend/js/api-service.js envía petición
   └─ Agrega header: Authorization: Bearer token
   
5. backend/middleware/authMiddleware.js intercepta
   └─ Llama: backend/utils/tokenManager.js → verifyToken()
   └─ ¿Válido? ✅ SÍ
   └─ ¿Renovar? (< 2h) → refreshToken()
   └─ Agrega header: X-New-Token: nuevo_token

6. backend/routes/users.js responde
   └─ Devuelve: { success: true, users: [...] }

7. frontend/js/api-service.js recibe respuesta
   └─ Detecta header: X-New-Token
   └─ localStorage.setItem('authToken', nuevoToken)  ⭐
   └─ Usuario no nota nada ✅
```

---

### **Token expirado:**

```
1. Usuario abre: frontend/html/home.html (después de 3 días sin usar)

2. frontend/js/app.js verifica sesión
   └─ Llama: window.apiService.makeRequest('/api/auth/verify')

3. frontend/js/api-service.js envía petición
   └─ Agrega header: Authorization: Bearer token_viejo

4. backend/middleware/authMiddleware.js intercepta
   └─ Llama: backend/utils/tokenManager.js → verifyToken()
   └─ ❌ Token expirado
   └─ Devuelve: { success: false, tokenExpired: true }

5. frontend/js/api-service.js detecta error
   └─ if (data.tokenExpired) { ... }
   └─ localStorage.clear()  ⭐
   └─ window.location.href = '/'  ⭐

6. Usuario redirigido a login ❌
```

---

## 📊 **Tabla Resumen de Archivos**

| Archivo | Responsabilidad | Funciones Clave |
|---------|----------------|-----------------|
| **backend/utils/tokenManager.js** | Crear, verificar, renovar tokens | `createToken()`, `verifyToken()`, `refreshToken()` |
| **backend/routes/auth.js** | Endpoint de login | `POST /api/auth/login` |
| **backend/middleware/authMiddleware.js** | Verificar token en cada petición | `authenticateUser()` |
| **frontend/js/api-service.js** | Peticiones HTTP con token | `makeRequest()`, detectar `X-New-Token` |
| **frontend/js/app.js** | Verificar sesión al cargar | Leer `localStorage`, redirect si no hay token |
| **frontend/js/home.js** | Lógica del panel admin | Usar `apiService.makeRequest()` |
| **frontend/html/login.html** | Formulario de login | Guardar token en `localStorage` |
| **frontend/html/home.html** | Panel de administración | Cargar scripts en orden correcto |

---

## 🎯 **Diagrama Visual de Archivos**

```
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 backend/utils/tokenManager.js  ⭐ NÚCLEO                │
│  ├─ createToken()        → Crear token con HMAC           │
│  ├─ verifyToken()        → Verificar firma y expiración    │
│  ├─ refreshToken()       → Renovar token                   │
│  └─ getTimeRemaining()   → Tiempo restante                 │
│                                                             │
│  📁 backend/routes/auth.js                                  │
│  └─ POST /api/auth/login → Llama createToken()            │
│                                                             │
│  📁 backend/middleware/authMiddleware.js                    │
│  ├─ authenticateUser()   → Llama verifyToken()            │
│  └─ Envía X-New-Token si shouldRefresh                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↕️ HTTP
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 frontend/js/api-service.js  ⭐ NÚCLEO                   │
│  ├─ makeRequest()        → Envía token en header          │
│  ├─ Detecta X-New-Token  → Actualiza localStorage         │
│  └─ Detecta tokenExpired → Logout automático              │
│                                                             │
│  📁 frontend/js/app.js                                      │
│  ├─ Lee localStorage     → Verifica si hay token           │
│  └─ Redirect si no hay token                               │
│                                                             │
│  📁 frontend/js/home.js                                     │
│  └─ Usa apiService.makeRequest() para todo                 │
│                                                             │
│  📁 frontend/html/login.html                                │
│  └─ Guarda token en localStorage después de login          │
│                                                             │
│  📁 frontend/html/home.html                                 │
│  └─ Carga scripts: app.js, api-service.js, home.js        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 **Cómo Encontrar Cada Parte**

### **¿Dónde se CREA el token?**
```
📁 backend/utils/tokenManager.js
   └─ Función: createToken() (línea ~12)
   
📁 backend/routes/auth.js
   └─ Llama: createToken() en POST /api/auth/login (línea ~45)
```

### **¿Dónde se VERIFICA el token?**
```
📁 backend/utils/tokenManager.js
   └─ Función: verifyToken() (línea ~42)
   
📁 backend/middleware/authMiddleware.js
   └─ Llama: verifyToken() en authenticateUser() (línea ~20)
```

### **¿Dónde se RENUEVA el token?**
```
📁 backend/utils/tokenManager.js
   └─ Función: refreshToken() (línea ~82)
   
📁 backend/middleware/authMiddleware.js
   └─ Llama: refreshToken() si shouldRefresh (línea ~35)
   └─ Envía: res.setHeader('X-New-Token', ...) (línea ~43)
```

### **¿Dónde se GUARDA el token?**
```
📁 frontend/html/login.html
   └─ localStorage.setItem('authToken', token) (línea ~95)
   
📁 frontend/js/api-service.js
   └─ localStorage.setItem('authToken', newToken) (línea ~35)
```

### **¿Dónde se LEE el token?**
```
📁 frontend/js/api-service.js
   └─ constructor(): this.token = localStorage.getItem('authToken') (línea ~4)
   
📁 frontend/js/app.js
   └─ const token = localStorage.getItem('authToken') (línea ~5)
```

### **¿Dónde se BORRA el token (logout)?**
```
📁 frontend/js/api-service.js
   └─ localStorage.clear() cuando tokenExpired (línea ~42)
   
📁 frontend/js/app.js
   └─ logout(): localStorage.clear() (línea ~58)
```

---

## 📝 **Resumen en 3 Puntos**

1. **Backend (3 archivos):**
   > - `tokenManager.js` → Crea/verifica/renueva tokens
   > - `auth.js` → Endpoint de login
   > - `authMiddleware.js` → Verifica en cada petición

2. **Frontend (3 archivos):**
   > - `api-service.js` → Envía token, detecta renovación
   > - `app.js` → Verifica sesión al cargar
   > - `home.js` → Usa apiService para peticiones

3. **HTML (2 archivos):**
   > - `login.html` → Guarda token después de login
   > - `home.html` → Carga scripts en orden correcto

---

**¡Ahora sabes exactamente dónde está cada parte de la lógica!** 🎉

**Archivos clave:** `tokenManager.js` (backend) y `api-service.js` (frontend) son los núcleos del sistema. 🔐
