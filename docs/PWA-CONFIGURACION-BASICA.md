# ⚙️ CONFIGURACIÓN BÁSICA PWA - CLASSGO

## 🎯 ¿Qué Necesitas para Convertir Tu Página en PWA?

Una Progressive Web App (PWA) requiere **3 componentes esenciales**:

1. **Manifest.json** - Define cómo se ve tu app cuando se instala
2. **Service Worker (sw.js)** - Maneja cacheo y funcionalidad offline
3. **App Shell (appshell.js)** - Define qué archivos se guardan offline

---

## 📱 1. MANIFEST.JSON

### ¿Qué es?
El **manifest** es un archivo JSON que dice al navegador cómo debe comportarse tu app cuando se instala en el dispositivo del usuario.

### Configuración Básica de ClassGo:

```json
{
  "name": "ClassGo - Plataforma Educativa",
  "short_name": "ClassGo",
  "description": "Plataforma educativa para clases virtuales con tutores expertos",
  "start_url": "/home",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#0d7377",
  "background_color": "#0a5f62",
  "scope": "/",
  "lang": "es",
  "categories": ["education", "productivity"],
  "icons": [
    {
      "src": "/frontend/images/icon-192x192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "/frontend/images/icon-192x192.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
```

### 🔑 Propiedades Clave Explicadas:

| Propiedad | Qué hace | Valor en ClassGo |
|-----------|----------|------------------|
| **name** | Nombre completo de la app | "ClassGo - Plataforma Educativa" |
| **short_name** | Nombre corto (icono) | "ClassGo" |
| **description** | Descripción breve | Para clases virtuales |
| **start_url** | Página inicial al abrir | "/home" |
| **display** | Modo de visualización | "standalone" (sin barra del navegador) |
| **orientation** | Orientación preferida | "portrait-primary" (vertical) |
| **theme_color** | Color de la barra superior | #0d7377 (cyan-teal) |
| **background_color** | Color del splash screen | #0a5f62 (teal oscuro) |
| **scope** | Alcance de la PWA | "/" (toda la app) |
| **lang** | Idioma | "es" (español) |
| **icons** | Íconos de la app | 192x192 y 512x512 px |

### 📐 Tamaños de Íconos Requeridos:

```
MÍNIMO REQUERIDO:
- 192x192 px (para pantalla de inicio Android)
- 512x512 px (para splash screen)

RECOMENDADO PARA MEJOR COMPATIBILIDAD:
- 72x72 px
- 96x96 px
- 128x128 px
- 144x144 px
- 152x152 px (Apple Touch Icon)
- 192x192 px ✅
- 384x384 px
- 512x512 px ✅
```

### 🎨 Opciones de Display:

```javascript
"display": "standalone"  // ✅ Usado en ClassGo - Pantalla completa sin navegador
"display": "fullscreen"  // Pantalla completa total (oculta todo)
"display": "minimal-ui"  // Navegación mínima
"display": "browser"     // Como página web normal
```

---

## 🔧 2. SERVICE WORKER (sw.js)

### ¿Qué es?
El **Service Worker** es un script que corre en segundo plano y gestiona:
- ✅ Cacheo de archivos
- ✅ Funcionalidad offline
- ✅ Sincronización en background
- ✅ Notificaciones push

### Estructura Básica del Service Worker:

```javascript
// 1. CONFIGURACIÓN INICIAL
const CACHE_NAME = 'classgo-v3-pwa';
const OFFLINE_URL = '/frontend/html/home.html';

// 2. IMPORTAR APP SHELL
importScripts('/frontend/js/appshell.js');
```

### 📦 Eventos del Service Worker:

#### A) **INSTALL** - Se ejecuta al instalar el SW

```javascript
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Cachear todos los archivos del App Shell
                return cache.addAll(HOME_APPSHELL);
            })
            .then(() => self.skipWaiting())
    );
});
```

**¿Qué hace?**
- Crea un nuevo cache con nombre `classgo-v3-pwa`
- Guarda todos los archivos del array `HOME_APPSHELL`
- `skipWaiting()` activa el nuevo SW inmediatamente

---

#### B) **ACTIVATE** - Se ejecuta al activar el SW

```javascript
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                // Borrar caches antiguas
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});
```

**¿Qué hace?**
- Borra versiones antiguas de cache
- `claim()` toma control de todas las páginas abiertas

---

#### C) **FETCH** - Intercepta todas las peticiones de red

```javascript
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Para peticiones API - Network First
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Solo cachear peticiones GET exitosas
                    if (event.request.method === 'GET' && response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Si falla la red, buscar en cache
                    return caches.match(event.request);
                })
        );
    }
    
    // Para recursos estáticos - Cache First
    else {
        event.respondWith(
            caches.match(event.request)
                .then(cached => {
                    if (cached) return cached; // Está en cache
                    return fetch(event.request); // No está, traer de red
                })
        );
    }
});
```

**Estrategias de Cacheo:**

| Estrategia | Cuándo usar | Usado en ClassGo |
|------------|-------------|------------------|
| **Cache First** | Archivos estáticos (CSS, JS, imágenes) | ✅ App Shell |
| **Network First** | Datos que cambian (API) | ✅ Peticiones /api/ |
| **Network Only** | Siempre datos frescos | Login, registro |
| **Cache Only** | Offline total | No usado |

---

#### D) **SYNC** - Sincronización en background

```javascript
self.addEventListener('sync', event => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-offline-data') {
        event.waitUntil(
            syncOfflineData()
                .then(() => console.log('✅ Sync completed'))
                .catch(error => {
                    console.error('❌ Sync failed:', error);
                    throw error; // Retry
                })
        );
    }
});
```

**¿Qué hace?**
- Sincroniza datos cuando vuelve la conexión
- Si falla, intenta de nuevo automáticamente

---

#### E) **PUSH** - Notificaciones push (opcional)

```javascript
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/frontend/images/icon-192x192.png',
        badge: '/frontend/images/badge-72x72.png',
        vibrate: [200, 100, 200]
    };
    
    event.waitUntil(
        self.registration.showNotification('ClassGo', options)
    );
});
```

---

## 📂 3. APP SHELL (appshell.js)

### ¿Qué es?
El **App Shell** es la lista de archivos que DEBEN estar disponibles offline para que tu app funcione.

### Configuración en ClassGo:

```javascript
const HOME_APPSHELL = [
    // HTML Pages
    '/frontend/html/home.html',
    '/frontend/html/login.html',
    
    // Core CSS
    '/frontend/css/styles.css',
    '/frontend/css/home.css',
    '/frontend/css/student-dashboard.css',
    '/frontend/css/tutor-dashboard.css',
    
    // Core JavaScript
    '/frontend/js/app.js',
    '/frontend/js/api-service.js',
    '/frontend/js/home.js',
    '/frontend/js/appshell.js',
    
    // PWA Files
    '/manifest.json'
];
```

### 🎯 ¿Qué Archivos Incluir?

**SÍ incluir:**
- ✅ Páginas principales (home, login, dashboard)
- ✅ CSS crítico (estilos principales)
- ✅ JavaScript esencial (funciones core)
- ✅ Logo e íconos principales
- ✅ Manifest.json

**NO incluir:**
- ❌ Imágenes grandes (optimiza primero)
- ❌ Videos
- ❌ Archivos de terceros (CDN)
- ❌ Recursos que cambian constantemente

---

### 💾 IndexedDB para Datos Offline

El App Shell también configura **IndexedDB** para guardar datos estructurados offline:

```javascript
const DB_NAME = 'ClassGoOfflineDB';
const DB_VERSION = 2;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // Crear "tablas" (Object Stores)
            
            // 1. Datos de usuario
            if (!db.objectStoreNames.contains('userData')) {
                const userStore = db.createObjectStore('userData', { keyPath: 'id' });
                userStore.createIndex('email', 'email', { unique: true });
                userStore.createIndex('role', 'role', { unique: false });
            }
            
            // 2. Categorías/Clases
            if (!db.objectStoreNames.contains('categories')) {
                const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
                categoriesStore.createIndex('type', 'type', { unique: false });
            }
            
            // 3. Cola de sincronización (operaciones offline)
            if (!db.objectStoreNames.contains('syncQueue')) {
                const syncStore = db.createObjectStore('syncQueue', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                syncStore.createIndex('status', 'status', { unique: false });
                syncStore.createIndex('operation', 'operation', { unique: false });
            }
        };
        
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
    });
}
```

### 📊 Object Stores en ClassGo:

| Store | Para qué sirve | Ejemplo |
|-------|----------------|---------|
| **userData** | Datos del usuario autenticado | Nombre, email, rol |
| **categories** | Categorías de cursos | Ciencias, Arte, Idiomas |
| **classes** | Clases/cursos disponibles | Lista de clases |
| **stats** | Estadísticas del usuario | Progreso, calificaciones |
| **syncQueue** | Operaciones pendientes | Crear nota offline |

---

### 🔄 Sistema de Sincronización Offline

Cuando el usuario hace cambios **sin conexión**:

```javascript
// 1. Agregar operación a la cola
async function addToSyncQueue(operation, endpoint, data, method = 'POST') {
    const syncItem = {
        operation: operation,      // 'create-note', 'update-user', etc.
        endpoint: endpoint,         // '/api/notes', '/api/users', etc.
        method: method,             // 'POST', 'PUT', 'DELETE'
        data: data,                 // Datos a enviar
        timestamp: Date.now(),
        status: 'pending',
        retries: 0
    };
    
    // Guardar en IndexedDB
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    return store.add(syncItem);
}

// 2. Cuando vuelve la conexión, sincronizar
async function syncOfflineData() {
    if (!navigator.onLine) return;
    
    const pendingItems = await getPendingSyncItems();
    
    for (const item of pendingItems) {
        try {
            const response = await fetch(item.endpoint, {
                method: item.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data)
            });
            
            if (response.ok) {
                // Éxito - borrar de la cola
                await deleteSyncItem(item.id);
            } else {
                // Fallo - marcar como fallido
                await updateSyncItemStatus(item.id, 'failed');
            }
        } catch (error) {
            console.error('Sync error:', error);
        }
    }
}
```

---

## 🔗 4. CONEXIÓN EN EL HTML

### En cada página HTML, debes:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <!-- 1. Meta tags PWA -->
    <meta name="theme-color" content="#0d7377">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    
    <!-- 2. Link al manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- 3. Apple Touch Icons -->
    <link rel="apple-touch-icon" sizes="152x152" href="/images/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/icon-192x192.png">
</head>
<body>
    <!-- Tu contenido -->
    
    <!-- 4. Scripts PWA -->
    <script src="/frontend/js/appshell.js"></script>
    
    <!-- 5. Registrar Service Worker -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('✅ SW registrado:', reg.scope))
                    .catch(err => console.error('❌ SW error:', err));
            });
        }
    </script>
</body>
</html>
```

---

## 📋 CHECKLIST PARA CONVERTIR TU WEB EN PWA

### ✅ 1. Crear manifest.json
- [ ] Archivo en raíz del proyecto
- [ ] Configurar name, short_name, description
- [ ] Definir start_url
- [ ] Establecer display: "standalone"
- [ ] Configurar theme_color y background_color
- [ ] Agregar íconos 192x192 y 512x512

### ✅ 2. Crear Service Worker (sw.js)
- [ ] Archivo en raíz del proyecto
- [ ] Definir CACHE_NAME
- [ ] Implementar evento 'install'
- [ ] Implementar evento 'activate'
- [ ] Implementar evento 'fetch'
- [ ] (Opcional) Implementar evento 'sync'
- [ ] (Opcional) Implementar evento 'push'

### ✅ 3. Crear App Shell (appshell.js)
- [ ] Definir array HOME_APPSHELL con archivos críticos
- [ ] Inicializar IndexedDB con initDB()
- [ ] Crear Object Stores necesarios
- [ ] Implementar storeData() y getData()
- [ ] (Opcional) Implementar cola de sincronización

### ✅ 4. Conectar en HTML
- [ ] Agregar meta tags PWA
- [ ] Link a manifest.json
- [ ] Link a Apple Touch Icons
- [ ] Registrar Service Worker en JavaScript
- [ ] Importar appshell.js

### ✅ 5. Crear Íconos
- [ ] Logo 192x192 px
- [ ] Logo 512x512 px
- [ ] (Opcional) Más tamaños

### ✅ 6. Probar
- [ ] Abrir Chrome DevTools → Application
- [ ] Verificar "Manifest" está cargado
- [ ] Verificar "Service Workers" está registrado
- [ ] Probar modo offline
- [ ] Verificar cache en "Cache Storage"

---

## 🚀 FLUJO DE FUNCIONAMIENTO

### Primera Visita del Usuario:

```
1. Usuario visita la web
   ↓
2. HTML carga y registra Service Worker
   ↓
3. Service Worker se instala (evento install)
   ↓
4. Cachea archivos del HOME_APPSHELL
   ↓
5. Service Worker se activa (evento activate)
   ↓
6. IndexedDB se inicializa
   ↓
7. App lista para trabajar offline
```

### Siguientes Visitas:

```
1. Usuario visita la web
   ↓
2. Service Worker intercepta peticiones (evento fetch)
   ↓
3. ¿Está en cache?
   │
   ├─ SÍ → Servir desde cache (rápido) ⚡
   │
   └─ NO → Traer de red y cachear
```

### Cuando el Usuario Pierde Conexión:

```
1. Usuario pierde conexión WiFi/datos
   ↓
2. Intenta usar la app
   ↓
3. Service Worker sirve desde cache
   ↓
4. Operaciones (crear/editar) se guardan en syncQueue
   ↓
5. Usuario recupera conexión
   ↓
6. Service Worker dispara evento 'sync'
   ↓
7. syncOfflineData() envía operaciones pendientes al servidor
   ↓
8. App sincronizada ✅
```

---

## 🎯 EJEMPLO MÍNIMO DE PWA

Si quieres lo más básico para empezar:

### manifest.json (Mínimo)
```json
{
  "name": "Mi App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### sw.js (Mínimo)
```javascript
const CACHE = 'v1';
const FILES = ['/index.html', '/styles.css', '/app.js'];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
});

// Fetch
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
```

### index.html (Mínimo)
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#000000">
</head>
<body>
  <h1>Mi PWA</h1>
  
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
</body>
</html>
```

---

## 🔍 DEBUGGING Y TESTING

### Chrome DevTools:

**Application Tab:**
- **Manifest**: Ver configuración cargada
- **Service Workers**: Estado del SW
- **Cache Storage**: Archivos cacheados
- **IndexedDB**: Datos guardados offline
- **Clear storage**: Borrar todo y empezar de nuevo

**Console:**
```javascript
// Ver si SW está registrado
navigator.serviceWorker.getRegistration().then(reg => console.log(reg));

// Ver qué hay en cache
caches.keys().then(keys => console.log(keys));
caches.open('classgo-v3-pwa').then(cache => 
  cache.keys().then(keys => console.log(keys))
);

// Ver IndexedDB
indexedDB.databases().then(dbs => console.log(dbs));
```

### Lighthouse Audit:
1. Chrome DevTools → Lighthouse
2. Seleccionar "Progressive Web App"
3. Click "Generate report"
4. Ver puntuación y sugerencias

---

## 📊 RESUMEN VISUAL

```
┌─────────────────────────────────────────────────┐
│                    TU WEB                       │
│                                                 │
│  index.html ←──────┐                           │
│       ↓            │                           │
│  <link rel="manifest" href="/manifest.json">   │
│       ↓            │                           │
│  manifest.json ────┘                           │
│  {                                             │
│    "name": "ClassGo",                          │
│    "display": "standalone",                    │
│    "icons": [...]                              │
│  }                                             │
│                                                 │
│  sw.js (Service Worker)                        │
│  ├─ install  → Cachear archivos                │
│  ├─ activate → Limpiar caches viejas           │
│  ├─ fetch    → Interceptar peticiones          │
│  └─ sync     → Sincronizar offline             │
│                                                 │
│  appshell.js                                   │
│  ├─ HOME_APPSHELL → Lista de archivos          │
│  ├─ initDB()      → Crear IndexedDB            │
│  └─ syncOfflineData() → Sync cuando hay red    │
│                                                 │
└─────────────────────────────────────────────────┘

            ↓ RESULTADO ↓

┌─────────────────────────────────────────────────┐
│    📱 APP INSTALABLE                            │
│    ✅ Funciona offline                          │
│    ⚡ Carga rápida (cache)                      │
│    🔄 Sincronización automática                 │
│    🔔 (Opcional) Push notifications             │
└─────────────────────────────────────────────────┘
```

---

**Versión**: 1.0  
**Fecha**: 27 de octubre de 2025  
**Proyecto**: ClassGo - Configuración PWA
