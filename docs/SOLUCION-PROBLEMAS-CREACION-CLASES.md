# 🔧 Guía de Solución de Problemas - Sistema de Creación de Clases

## ⚠️ Error: "Failed to load resource: 404 - /api/users"

### Síntomas:
- Al abrir el modal de crear clase aparece el error en la consola
- La lista de estudiantes muestra "Error al cargar estudiantes"
- El servidor responde con 404 Not Found

### Causas Comunes:

#### 1. **Servidor Backend No Está Ejecutándose** ⚡
El error más común es que el servidor backend no esté corriendo.

**Solución:**
```powershell
# Navegar a la carpeta backend
cd backend

# Instalar dependencias si es necesario
npm install

# Iniciar el servidor
npm start
```

**Deberías ver:**
```
🚀 Server running on port 3000
🔥 Firebase Admin initialized successfully
📱 Environment: development
```

---

#### 2. **Puerto Incorrecto o Conflicto** 🔌

**Verificar:**
```powershell
# Ver si el puerto 3000 está en uso
netstat -ano | findstr :3000
```

**Solución alternativa:**
Cambiar el puerto en `backend/.env`:
```env
PORT=3001
```

Y actualizar el frontend para usar el nuevo puerto (si no usas proxy).

---

#### 3. **Firewall o Antivirus Bloqueando** 🛡️

**Solución:**
- Permitir Node.js en el Firewall de Windows
- Agregar excepción en el antivirus para la carpeta del proyecto

---

#### 4. **Endpoint No Registrado Correctamente** 📡

**Verificar en `backend/server.js`:**
```javascript
app.use('/api/users', authenticateUser, userRoutes);
```

**Verificar en `backend/routes/users.js`:**
```javascript
router.get('/', asyncHandler(async (req, res) => {
    // ... código para GET /api/users
}));
```

---

## ✅ Checklist de Verificación

### 1. **Backend Running**
```powershell
cd backend
npm start
```
✅ Debería mostrar: "Server running on port 3000"

### 2. **Health Check**
```powershell
# En otra terminal
curl http://localhost:3000/api/health
```
✅ Debería devolver JSON con status "OK"

### 3. **Test de Autenticación**
- Abre el navegador en `http://localhost:3000/login`
- Inicia sesión con un usuario tutor
- Verifica que se almacenen los tokens en localStorage

### 4. **Test del Endpoint de Usuarios**
```powershell
# Reemplaza <TOKEN> con el token real de localStorage
curl http://localhost:3000/api/users -H "Authorization: Bearer <TOKEN>"
```
✅ Debería devolver lista de usuarios

---

## 🔍 Diagnóstico Paso a Paso

### Paso 1: Verificar Consola del Servidor
Abre la terminal donde corre el servidor backend y busca:
```
📋 GET /api/users - Fetching users, role filter: undefined
✅ Found X users
```

Si ves `❌ Error fetching users`, revisa los logs para más detalles.

---

### Paso 2: Verificar Consola del Navegador
Presiona F12 y ve a la pestaña Console. Busca:
```
🔄 Loading students from /api/users...
📡 Response status: 200
✅ Received data: {success: true, users: [...]}
👥 Found X students
```

---

### Paso 3: Verificar Network en DevTools
1. F12 → Pestaña Network
2. Click en "Crear Nuevo Curso"
3. Busca la petición a `/api/users`
4. Verifica:
   - Status: 200 OK
   - Headers: Authorization presente
   - Response: JSON con array de usuarios

---

## 🐛 Errores Específicos y Soluciones

### Error 401 Unauthorized
**Causa:** Token inválido o expirado

**Solución:**
1. Cerrar sesión
2. Volver a iniciar sesión
3. Verificar que `authToken` esté en localStorage

---

### Error 403 Forbidden
**Causa:** Usuario sin permisos (no es tutor ni admin)

**Solución:**
- Verificar que `userRole` en localStorage sea "tutor" o "admin"
- Actualizar el rol del usuario en Firebase

---

### Error 500 Internal Server Error
**Causa:** Error en el servidor (Firebase, consulta, etc.)

**Solución:**
1. Ver logs del servidor backend
2. Verificar credenciales de Firebase en `.env`
3. Verificar conexión a Firestore

---

## 🔧 Configuración de Firebase

### Verificar `.env` en carpeta backend:
```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY_ID=tu-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu-proyecto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=tu-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu-secreto-super-seguro-aqui
JWT_EXPIRES_IN=7d
```

---

## 📊 Estructura de Respuesta Esperada

### GET /api/users
```json
{
  "success": true,
  "users": [
    {
      "uid": "user_id_1",
      "id": "user_id_1",
      "email": "estudiante1@mail.com",
      "name": "Ana García",
      "role": "alumno",
      "status": "active"
    },
    {
      "uid": "user_id_2",
      "id": "user_id_2",
      "email": "estudiante2@mail.com",
      "name": "Juan Pérez",
      "role": "alumno",
      "status": "active"
    }
  ],
  "total": 2
}
```

---

## 🎨 Problemas de Posicionamiento del Modal

### Modal no se ve completo
**Solución en CSS:**
```css
.modal-large {
    max-width: 950px;
    width: 95%;
    max-height: 85vh;
    margin: 2% auto;
}
```

### Modal muy pequeño en móvil
**Ya corregido con responsive:**
```css
@media (max-width: 768px) {
    .modal-large {
        width: 95%;
        padding: 20px;
        margin: 5% auto;
    }
}
```

### Scroll no funciona
**Verificar:**
```css
.modal-large {
    overflow-y: auto;
}
```

---

## 🚀 Comandos Rápidos de Inicio

### Terminal 1 - Backend:
```powershell
cd backend
npm install
npm start
```

### Terminal 2 - Verificar:
```powershell
# Health check
curl http://localhost:3000/api/health

# Ver logs en tiempo real
# (los verás en la Terminal 1)
```

### Navegador:
```
http://localhost:3000/login
```

---

## 📝 Logs Útiles

### Backend (Node.js):
```javascript
console.log('📋 GET /api/users - Fetching users');
console.log('✅ Found X users');
console.log('❌ Error fetching users:', error);
```

### Frontend (Browser):
```javascript
console.log('🔄 Loading students from /api/users...');
console.log('📡 Response status:', response.status);
console.log('✅ Received data:', data);
console.log('👥 Found X students');
```

---

## 🔄 Reiniciar Todo Desde Cero

```powershell
# 1. Detener el servidor (Ctrl+C en terminal del backend)

# 2. Limpiar caché del navegador
# - F12 → Application → Storage → Clear site data

# 3. Limpiar node_modules (opcional)
cd backend
Remove-Item -Recurse -Force node_modules
npm install

# 4. Reiniciar servidor
npm start

# 5. Recargar página (Ctrl+Shift+R)
```

---

## 🎯 Test de Integración Completo

### 1. Login
- ✅ Ir a /login
- ✅ Ingresar credenciales de tutor
- ✅ Verificar redirección a /tutor-dashboard

### 2. Abrir Modal
- ✅ Click en "Crear Nuevo Curso"
- ✅ Modal aparece centrado y completo
- ✅ Paso 1 activo (materias visibles)

### 3. Cargar Estudiantes
- ✅ Consola muestra: "Loading students..."
- ✅ Petición GET /api/users con status 200
- ✅ Lista de estudiantes se renderiza

### 4. Seleccionar y Crear
- ✅ Seleccionar materia (Biología)
- ✅ Llenar detalles del paso 2
- ✅ Seleccionar estudiantes en paso 3
- ✅ Submit → POST /api/classes con status 201
- ✅ Notificación de éxito

---

## 📞 Información de Contacto

Si el problema persiste después de seguir todos estos pasos:

1. **Verificar logs del servidor** - La mayoría de errores aparecen ahí
2. **Revisar consola del navegador** - F12 para ver errores JavaScript
3. **Comprobar Network** - Ver peticiones HTTP y sus respuestas
4. **Verificar Firebase** - Credenciales y permisos en Firestore

---

## ✨ Mejoras Implementadas

### Frontend (JavaScript):
- ✅ Mejor manejo de errores con mensajes descriptivos
- ✅ Logs detallados en consola para debug
- ✅ Empty states informativos
- ✅ Loading states animados

### Frontend (CSS):
- ✅ Modal con mejor posicionamiento (margin: 2% auto)
- ✅ Scroll interno funcional
- ✅ Empty state con borde y fondo destacado
- ✅ Responsive para móviles

### Backend (API):
- ✅ Endpoint GET /api/users agregado
- ✅ Filtrado por rol (alumno/student)
- ✅ Validación de usuarios activos
- ✅ Logs informativos en servidor

---

**¡Todo configurado y listo para usar! 🎉**

Recuerda siempre tener el servidor backend corriendo antes de usar la aplicación.
