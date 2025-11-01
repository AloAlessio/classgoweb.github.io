# 📱 Guía PWA - ClassGo

## ¿Qué es una PWA?
Una Progressive Web App (PWA) permite que ClassGo funcione **sin conexión a internet** como una aplicación nativa.

---

## 🎯 Componentes PWA de ClassGo

### 1. **HOME_APPSHELL** (appshell.js)
Lista de archivos que se guardan en caché para uso offline:
- HTML: home, login, dashboards
- CSS: todos los estilos
- JS: toda la funcionalidad
- Manifest: configuración de la app

```javascript
const HOME_APPSHELL = [
    '/frontend/html/home.html',
    '/frontend/html/login.html',
    '/frontend/css/styles.css',
    '/frontend/js/app.js',
    // ... más archivos
];
```

---

### 2. **IndexedDB** - Base de datos local

#### Stores (tablas) disponibles:

| Store | Descripción | Para qué sirve |
|-------|-------------|----------------|
| `userData` | Datos de usuarios | Leer usuarios sin conexión |
| `categories` | Categorías de clases | Mostrar categorías offline |
| `classes` | Clases/cursos | Ver clases sin internet |
| `stats` | Estadísticas | Mostrar stats offline |
| `syncQueue` | **Cola de sincronización** | Guardar operaciones CRUD para sincronizar después |

#### Funciones principales:

```javascript
// Inicializar base de datos
await initDB();

// Guardar datos para lectura offline
await storeData('userData', userObject);

// Leer datos offline
const users = await getData('userData');
```

---

### 3. **syncQueue** - Cola de sincronización CRUD

#### ¿Cómo funciona?

Cuando **no hay internet** y el admin crea/edita/elimina algo:
1. La operación se guarda en `syncQueue`
2. Cuando vuelve la conexión, se sincroniza automáticamente
3. El usuario ve una notificación de éxito

#### Agregar operación a la cola:

```javascript
// Ejemplo: Crear usuario sin conexión
await addToSyncQueue(
    'create-user',           // Nombre de operación
    '/api/users/create',     // Endpoint de la API
    {                        // Datos a enviar
        email: 'nuevo@gmail.com',
        name: 'Usuario Nuevo',
        password: 'pass123',
        role: 'alumno'
    },
    'POST'                   // Método HTTP
);
```

#### Estructura de un item en syncQueue:

```javascript
{
    id: 1,                              // Auto-generado
    operation: 'create-user',           // Nombre de la operación
    endpoint: '/api/users/create',      // URL de la API
    method: 'POST',                     // GET, POST, PUT, DELETE
    data: { /* datos */ },              // Payload
    timestamp: 1697654321000,           // Fecha
    status: 'pending',                  // pending, syncing, synced, failed
    retries: 0,                         // Número de reintentos
    error: null                         // Error si falló
}
```

---

## 🔄 Sincronización Automática

### ¿Cuándo se sincronizan los datos?

1. **Automáticamente** cuando vuelve la conexión
2. **Background Sync**: El navegador sincroniza aunque cierres la pestaña
3. **Manual**: Puedes llamar `syncOfflineData()` desde la consola

### Proceso de sincronización:

```
1. Usuario sin internet → Crea usuario
2. Se guarda en syncQueue (status: 'pending')
3. Vuelve la conexión → Se detecta automáticamente
4. Se ejecuta syncOfflineData()
5. Se envía cada operación al backend
6. Si éxito → Se elimina de la cola
7. Si falla → status: 'failed', se reintenta después
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Crear usuario offline

```javascript
// En confirmCreateUser() de home.js
if (navigator.onLine) {
    // Online: llamada API normal
    await fetch('/api/users/create', { ... });
} else {
    // Offline: agregar a cola
    await addToSyncQueue('create-user', '/api/users/create', userData, 'POST');
    
    // Notificar al usuario
    showNotification('warning', '📴 Sin conexión. Se sincronizará después');
    
    // Registrar background sync
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-offline-data');
}
```

### Ejemplo 2: Actualizar estado de usuario offline

```javascript
if (!navigator.onLine) {
    await addToSyncQueue(
        'update-user-status',
        `/api/users/${userId}/status`,
        { status: 'inactive' },
        'PUT'
    );
}
```

### Ejemplo 3: Eliminar usuario offline

```javascript
if (!navigator.onLine) {
    await addToSyncQueue(
        'delete-user',
        `/api/users/${userId}`,
        null,  // DELETE no necesita body
        'DELETE'
    );
}
```

---

## 🛠️ Funciones útiles

### Ver operaciones pendientes:

```javascript
// En la consola del navegador
const pending = await getPendingSyncItems();
console.log('Operaciones pendientes:', pending);
```

### Forzar sincronización manual:

```javascript
// En la consola del navegador
await syncOfflineData();
```

### Verificar IndexedDB:

1. Abre DevTools (F12)
2. Ve a: **Application** → **IndexedDB** → **ClassGoOfflineDB**
3. Explora las stores (userData, syncQueue, etc.)

---

## ⚙️ Service Worker

### Estrategias de caché:

| Tipo | Estrategia | Descripción |
|------|-----------|-------------|
| **App Shell** (HTML/CSS/JS) | Cache First | Intenta caché primero, si falla usa red |
| **API** (/api/*) | Network First | Intenta red primero, si falla usa caché |

### Eventos del Service Worker:

```javascript
// Install: Cachea app shell
self.addEventListener('install', event => {
    caches.open('classgo-v2-pwa').then(cache => {
        cache.addAll(HOME_APPSHELL);
    });
});

// Activate: Limpia cachés viejos
self.addEventListener('activate', event => {
    // Elimina cachés antiguos
});

// Fetch: Maneja peticiones
self.addEventListener('fetch', event => {
    // Cache First para app shell
    // Network First para API
});

// Sync: Sincroniza datos offline
self.addEventListener('sync', event => {
    if (event.tag === 'sync-offline-data') {
        syncOfflineData();
    }
});
```

---

## ✅ Checklist de integración

Para agregar modo offline a una nueva función:

- [ ] Detectar si hay conexión: `navigator.onLine`
- [ ] Si **online**: Hacer fetch normal
- [ ] Si **offline**: Llamar `addToSyncQueue()`
- [ ] Registrar background sync: `registration.sync.register('sync-offline-data')`
- [ ] Mostrar notificación al usuario
- [ ] Probar sin conexión (DevTools → Network → Offline)

---

## 🧪 Cómo probar

### 1. Probar modo offline:
```
1. Abre DevTools (F12)
2. Network → Throttling → Offline
3. Intenta crear un usuario
4. Verifica que se guarde en syncQueue
5. Vuelve Online
6. Verifica que se sincronice automáticamente
```

### 2. Ver logs:
```javascript
// Service Worker logs
console.log('🔧 SW installing...')
console.log('✅ App shell cached')
console.log('🔄 Background sync triggered')
console.log('📦 Serving from cache')

// App logs
console.log('✅ Added to sync queue')
console.log('📋 Found X pending sync items')
console.log('✅ Synced: create-user')
```

---

## 🎓 Conceptos clave

### Cache First vs Network First:

- **Cache First**: Rápido, usa caché y si no existe va a red
  - Usado en: HTML, CSS, JS (no cambian frecuentemente)
  
- **Network First**: Siempre intenta red, si falla usa caché
  - Usado en: API calls (datos dinámicos)

### Background Sync:

- El navegador ejecuta la sincronización **aunque cierres la pestaña**
- Reintenta automáticamente si falla
- Solo funciona con HTTPS (o localhost)

### IndexedDB:

- Base de datos NoSQL en el navegador
- Más potente que localStorage
- Soporta índices, transacciones, y consultas complejas
- Almacenamiento ilimitado (con permiso del usuario)

---

## 📚 Archivos importantes

| Archivo | Descripción |
|---------|-------------|
| `/frontend/js/appshell.js` | HOME_APPSHELL + funciones de IndexedDB + syncQueue |
| `/sw.js` | Service Worker con caché y sync |
| `/manifest.json` | Configuración PWA (iconos, colores, etc.) |
| `/frontend/js/home.js` | Ejemplo de uso en `confirmCreateUser()` |

---

## 🚀 Resumen

**PWA de ClassGo = 3 partes:**

1. **App Shell** → Archivos en caché para funcionar offline
2. **IndexedDB** → Base de datos local para leer datos sin conexión
3. **Sync Queue** → Cola para guardar operaciones CRUD y sincronizar después

**Flujo offline:**
```
Usuario sin internet → Crea usuario → Se guarda en syncQueue → 
Vuelve online → Sync automático → Usuario creado en backend → ✅
```

¡Eso es todo! Simple y efectivo. 🎉
