# 🔐 Sistema de Tokens con Expiración y Renovación Automática

## 📚 **¿Qué es esto?**

Este documento explica cómo funciona el sistema de autenticación con tokens que **expiran y se renuevan automáticamente** SIN usar librerías externas como `jsonwebtoken`.

---

## 🎯 **Objetivo**

Crear un sistema seguro donde:
1. ✅ Los tokens expiran después de 24 horas
2. 🔄 Se renuevan automáticamente cuando quedan menos de 2 horas
3. 🚪 Logout automático cuando el token expira completamente
4. 📦 Sin librerías externas (solo código nativo de Node.js)

---

## 🏗️ **Arquitectura del Sistema**

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                           │
└─────────────────────────────────────────────────────────────┘

1. LOGIN (Usuario ingresa email y password)
   ↓
2. BACKEND crea token con expiración (24h)
   Token = base64(datos) + firma-HMAC-SHA256
   Datos = { email, userId, role, iat, exp }
   ↓
3. FRONTEND guarda token en localStorage
   localStorage.setItem('authToken', token)
   ↓
4. CADA PETICIÓN al backend
   ↓
5. BACKEND verifica token
   - ¿Firma válida? → ✅ SÍ
   - ¿Expiró? → ❌ NO
   - ¿Quedan menos de 2h? → ✅ SÍ
   ↓
6. BACKEND renueva token automáticamente
   Genera nuevo token con mismos datos pero nueva expiración
   ↓
7. BACKEND devuelve token nuevo en header
   Response.Headers: X-New-Token: nuevo_token
   ↓
8. FRONTEND detecta token nuevo y lo actualiza
   localStorage.setItem('authToken', nuevoToken)
   ↓
9. Usuario NO nota nada, sesión continúa sin interrupciones
```

---

## 📦 **Archivos Modificados**

### 1. **backend/utils/tokenManager.js** (NUEVO)

Este archivo maneja TODO lo relacionado con tokens.

#### **Funciones principales:**

```javascript
// 🔨 CREAR TOKEN
createToken({ email, userId, role })
// Genera: "eyJlbWFpbCI6...base64...}.dGhpc2lzc2lnbmF0dXJl"

// ✅ VERIFICAR TOKEN
verifyToken(token)
// Retorna: { valid: true, payload: {...}, shouldRefresh: true }

// 🔄 RENOVAR TOKEN
refreshToken(payload)
// Genera nuevo token con mismos datos

// 📊 DECODIFICAR TOKEN (para debug)
decodeToken(token)
// Retorna: { email, userId, role, iat, exp }

// ⏱️ TIEMPO RESTANTE
getTimeRemaining(token)
// Retorna: milisegundos restantes antes de expirar
```

#### **Constantes:**

```javascript
TOKEN_EXPIRATION = 24 * 60 * 60 * 1000;  // 24 horas
REFRESH_THRESHOLD = 2 * 60 * 60 * 1000;  // Renovar si quedan < 2 horas
```

#### **¿Cómo funciona la firma?**

Para verificar que el token NO fue modificado, usamos **HMAC SHA256**:

```javascript
// Al CREAR el token:
const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('base64');

// Al VERIFICAR el token:
const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('base64');

if (signature !== expectedSignature) {
    // ❌ Token fue modificado - RECHAZAR
}
```

**¿Por qué es seguro?**
- Necesitas conocer `SECRET_KEY` para crear una firma válida
- Si alguien modifica el payload, la firma NO coincidirá
- HMAC SHA256 es un algoritmo criptográfico estándar

---

### 2. **backend/routes/auth.js** (MODIFICADO)

#### **Login endpoint:**

```javascript
// ❌ ANTES (token simple sin expiración):
const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

// ✅ AHORA (token con expiración y firma):
const token = createToken({
    email: email,
    userId: userDoc.id,
    role: userData.role
});
```

---

### 3. **backend/middleware/authMiddleware.js** (MODIFICADO)

Este middleware se ejecuta en **CADA** petición protegida (crear usuario, ver estadísticas, etc.)

#### **Proceso de verificación:**

```javascript
async function authenticateUser(req, res, next) {
    // 1. Obtener token del header
    const token = req.headers.authorization.split('Bearer ')[1];
    
    // 2. Verificar token
    const { valid, payload, shouldRefresh } = verifyToken(token);
    
    // 3. Si expiró → RECHAZAR
    if (!valid) {
        return res.status(401).json({
            error: 'Token expired or invalid',
            tokenExpired: true  // 🔔 Flag para frontend
        });
    }
    
    // 4. Si debe renovarse → GENERAR NUEVO
    let newToken = null;
    if (shouldRefresh) {
        newToken = refreshToken(payload);
        console.log('🔄 Token refreshed');
    }
    
    // 5. Enviar nuevo token en header
    if (newToken) {
        res.setHeader('X-New-Token', newToken);
    }
    
    // 6. Continuar con la petición
    next();
}
```

---

### 4. **frontend/js/api-service.js** (MODIFICADO)

Este archivo maneja todas las peticiones HTTP del frontend.

#### **Interceptor de respuestas:**

```javascript
async makeRequest(endpoint, options = {}) {
    // ... enviar petición ...
    const response = await fetch(url, config);
    
    // 🔄 VERIFICAR SI HAY TOKEN NUEVO
    const newToken = response.headers.get('X-New-Token');
    if (newToken) {
        console.log('🔄 Token renovado automáticamente');
        localStorage.setItem('authToken', newToken);
        this.token = newToken;
    }
    
    const data = await response.json();
    
    // 🚪 SI TOKEN EXPIRÓ → LOGOUT
    if (data.tokenExpired) {
        console.log('❌ Token expirado - Cerrando sesión...');
        this.clearAuth();
        localStorage.clear();
        window.location.href = '/';
        return { success: false, error: 'Sesión expirada' };
    }
    
    return data;
}
```

---

## 🔄 **Ejemplos de Funcionamiento**

### **Ejemplo 1: Usuario se loguea**

```
12:00 PM → Login exitoso
Backend genera token:
{
  email: "admin@example.com",
  userId: "abc123",
  role: "administrador",
  iat: 1729346400000,        // Creado: 12:00 PM
  exp: 1729432800000         // Expira: 12:00 PM (siguiente día)
}

Frontend guarda token en localStorage ✅
```

### **Ejemplo 2: Usuario hace peticiones durante el día**

```
02:00 PM → Crear usuario
Backend verifica token → ✅ Válido
Tiempo restante: 22 horas → No renueva
Petición exitosa ✅

06:00 PM → Ver estadísticas
Backend verifica token → ✅ Válido
Tiempo restante: 18 horas → No renueva
Petición exitosa ✅

10:00 AM (siguiente día) → Editar usuario
Backend verifica token → ✅ Válido
Tiempo restante: 2 horas → ⚠️ RENOVAR
Backend genera nuevo token (válido hasta 10:00 AM siguiente día)
Backend envía: X-New-Token: nuevo_token_aqui
Frontend detecta y actualiza localStorage ✅
Usuario NO nota nada 🎉
```

### **Ejemplo 3: Token expira completamente**

```
12:01 PM (25 horas después del login) → Crear usuario
Backend verifica token → ❌ EXPIRADO
Backend responde: { tokenExpired: true }
Frontend detecta error → Limpia localStorage → Redirige a login
Usuario ve: "Sesión expirada. Por favor inicia sesión de nuevo" 🚪
```

---

## 🧪 **Cómo Probar**

### **1. Login y ver token:**

```javascript
// En Console (F12):
console.log(localStorage.getItem('authToken'));

// Decodificar payload (primera parte del token):
const [payload, signature] = localStorage.getItem('authToken').split('.');
const decoded = JSON.parse(atob(payload));
console.log(decoded);
/*
{
  email: "admin@example.com",
  userId: "abc123",
  role: "administrador",
  iat: 1729346400000,
  exp: 1729432800000
}
*/

// Ver fecha de expiración:
console.log(new Date(decoded.exp));
// Sat Oct 19 2025 12:00:00
```

### **2. Simular renovación (cambiar threshold en tokenManager.js):**

```javascript
// Temporal para testing:
const REFRESH_THRESHOLD = 23 * 60 * 60 * 1000; // Renovar si quedan < 23h

// Ahora cualquier petición renovará el token
// Abre Network tab (F12) y busca header: X-New-Token
```

### **3. Simular expiración:**

```javascript
// En tokenManager.js (temporal):
const TOKEN_EXPIRATION = 10 * 1000; // 10 segundos

// Login → Espera 11 segundos → Intenta crear usuario
// Debe redirigir a login automáticamente
```

---

## 🔒 **Seguridad**

### **¿Qué mejora este sistema?**

✅ **Tokens expiran**: Si roban tu token, solo funciona 24h
✅ **Renovación automática**: Usuario no pierde sesión mientras usa la app
✅ **Firma HMAC**: Imposible modificar el token sin conocer SECRET_KEY
✅ **Logout automático**: Si expira, cierra sesión inmediatamente

### **¿Qué falta para producción?**

⚠️ **SECRET_KEY en variable de entorno**: No debe estar en el código
⚠️ **HTTPS obligatorio**: Los tokens viajan por internet
⚠️ **Rate limiting**: Limitar intentos de login
⚠️ **Refresh tokens**: Para sesiones más largas (opcional)

---

## 📊 **Comparación: Antes vs Ahora**

| Característica | ❌ Antes | ✅ Ahora |
|---------------|---------|----------|
| Expiración | No expira nunca | 24 horas |
| Renovación | No existe | Automática (< 2h) |
| Seguridad | Token simple base64 | HMAC SHA256 |
| Verificación | Solo en login | En cada petición |
| Logout automático | No | Sí (si expira) |
| Usuario nota cambios | - | No, transparente |

---

## 🎓 **Conceptos Clave**

### **1. ¿Qué es un token?**
Es como una "tarjeta de identificación" digital que prueba quién eres.

### **2. ¿Por qué expira?**
Si alguien roba tu tarjeta, solo la puede usar por tiempo limitado.

### **3. ¿Qué es HMAC?**
Es una forma de "sellar" el token para que nadie pueda modificarlo sin ser detectado.

### **4. ¿Por qué renovar automáticamente?**
Para que el usuario NO tenga que volver a iniciar sesión cada 24h si está usando la app.

### **5. ¿Cómo se renueva sin que el usuario note?**
El backend envía el nuevo token en los headers de respuesta, el frontend lo detecta y actualiza localStorage automáticamente.

---

## 🚀 **Próximos Pasos (Opcional)**

1. **Variables de entorno**: Mover SECRET_KEY a `.env`
2. **Configuración personalizable**: Permitir cambiar tiempo de expiración
3. **Refresh tokens**: Tokens de larga duración para renovar el access token
4. **Blacklist de tokens**: Invalidar tokens manualmente
5. **Logs de seguridad**: Registrar intentos de acceso con tokens inválidos

---

## ❓ **Preguntas Frecuentes**

### **¿Por qué 24 horas?**
Es un balance entre seguridad y comodidad. Puedes cambiarlo en `tokenManager.js`.

### **¿Por qué renovar si quedan menos de 2 horas?**
Para que el usuario no pierda sesión mientras está usando la app. Si está activo, su token se renueva continuamente.

### **¿Qué pasa si cierro el navegador?**
El token se queda en localStorage. Al volver, si no expiró (< 24h), sigues logueado.

### **¿Alguien puede robar mi token?**
Sí, por eso es importante usar HTTPS en producción y que los tokens expiren.

### **¿Esto reemplaza a JWT?**
Este sistema hace lo mismo que JWT pero sin librería externa. En producción, JWT es más estándar.

---

**¡Sistema de tokens implementado! 🎉**

Ahora tu app tiene:
- ✅ Tokens con expiración (24h)
- ✅ Renovación automática (transparente para el usuario)
- ✅ Logout automático si expira
- ✅ Sin librerías externas
- ✅ Código limpio y documentado
