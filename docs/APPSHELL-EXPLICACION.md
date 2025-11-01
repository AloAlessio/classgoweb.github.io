# 🛒 APP SHELL - Explicación Super Clara

## 🎯 **¿Qué es el App Shell?**

### **Respuesta en 1 frase:**
> Es una **"lista de compras"** que le dice al Service Worker qué archivos debe guardar en caché para que tu app funcione sin internet.

### **Analogía simple:**
Imagina que vas al supermercado y necesitas comprar para sobrevivir una semana sin salir:

```
Lista de compras básicas:
✅ Pan (HTML - estructura)
✅ Agua (CSS - apariencia)
✅ Comida enlatada (JavaScript - funcionalidad)
✅ Linterna (manifest.json - identidad)

= Con esto puedes sobrevivir offline
```

**Tu ClassGo** tiene lo mismo en `appshell.js`:
```javascript
const HOME_APPSHELL = [
    // HTML (estructura)
    '/frontend/html/home.html',
    '/frontend/html/login.html',
    
    // CSS (apariencia)
    '/frontend/css/styles.css',
    '/frontend/css/home.css',
    
    // JavaScript (funcionalidad)
    '/frontend/js/app.js',
    '/frontend/js/api-service.js',
    '/frontend/js/home.js',
    '/frontend/js/appshell.js',
    
    // Manifest (identidad)
    '/manifest.json'
];
```

---

## 📋 **Tu App Shell Completo**

### **¿Qué archivos guardas?**

```
9 archivos esenciales para funcionar offline:

HTML (2 archivos):
📄 /frontend/html/home.html          ← Panel de administración
📄 /frontend/html/login.html         ← Página de login

CSS (4 archivos):
🎨 /frontend/css/styles.css          ← Estilos globales
🎨 /frontend/css/home.css            ← Estilos del panel admin
🎨 /frontend/css/student-dashboard.css ← Estilos dashboard estudiante
🎨 /frontend/css/tutor-dashboard.css   ← Estilos dashboard tutor

JavaScript (3 archivos):
⚙️ /frontend/js/app.js               ← Lógica principal
⚙️ /frontend/js/api-service.js       ← Llamadas API + token renewal
⚙️ /frontend/js/home.js              ← Panel admin
⚙️ /frontend/js/appshell.js          ← Este mismo archivo

PWA (1 archivo):
📱 /manifest.json                     ← Identidad de la app
```

---

## 🖼️ **Visualización: Cómo Funciona**

### **Flujo completo:**

```
1️⃣ PRIMERA VEZ (CON INTERNET):
Usuario abre ClassGo
   ↓
Service Worker se instala
   ↓
Lee HOME_APPSHELL (lista de compras)
   ↓
Descarga y guarda los 9 archivos
   ↓
┌────────────────────────────────────┐
│  CACHE "classgo-v3-pwa"            │
│  ✅ home.html                       │
│  ✅ login.html                      │
│  ✅ styles.css                      │
│  ✅ home.css                        │
│  ✅ student-dashboard.css           │
│  ✅ tutor-dashboard.css             │
│  ✅ app.js                          │
│  ✅ api-service.js                  │
│  ✅ home.js                         │
│  ✅ appshell.js                     │
│  ✅ manifest.json                   │
└────────────────────────────────────┘
   ↓
App funciona normalmente


2️⃣ SIGUIENTE VEZ (SIN INTERNET):
Usuario abre ClassGo sin internet
   ↓
Service Worker intercepta petición
   ↓
Busca en CACHE "classgo-v3-pwa"
   ↓
Encuentra home.html, styles.css, app.js, etc.
   ↓
Devuelve archivos desde caché
   ↓
App funciona OFFLINE ✅
```

---

## 🧩 **Las 2 Partes del appshell.js**

### **PARTE 1: HOME_APPSHELL (Lista de Archivos)**

```javascript
const HOME_APPSHELL = [
    '/frontend/html/home.html',
    '/frontend/html/login.html',
    // ... resto de archivos
];
```

**¿Qué hace?**
- Define qué archivos son **esenciales** para funcionar offline
- El Service Worker usa esta lista para cachear

**Analogía:**
```
Lista de compras del supermercado:
✅ Pan
✅ Leche
✅ Huevos
```

---

### **PARTE 2: IndexedDB (Base de Datos Offline)**

```javascript
const DB_NAME = 'ClassGoOfflineDB';
const DB_VERSION = 2;
```

**¿Qué hace?**
- Crea una **base de datos local** en el navegador
- Guarda datos para leer offline (usuarios, clases, stats)
- Guarda operaciones pendientes para sincronizar después

**Analogía:**
```
Base de datos = Libreta donde apuntas cosas:

📓 Libreta "ClassGoOfflineDB"
  
  Página 1 (userData):
  - Juan Pérez, estudiante, juan@mail.com
  - Ana López, tutor, ana@mail.com
  
  Página 2 (categories):
  - Matemáticas
  - Física
  
  Página 3 (classes):
  - Clase de Álgebra (Juan)
  - Clase de Cálculo (Ana)
  
  Página 4 (stats):
  - Juan: 5 clases completadas
  
  Página 5 (syncQueue):
  - Operación pendiente: Crear usuario "Pedro"
  - Operación pendiente: Eliminar clase #123
```

---

## 🗄️ **IndexedDB: Las 5 "Libretas" (Object Stores)**

### **1. userData (Usuarios)**

```javascript
if (!db.objectStoreNames.contains('userData')) {
    const userStore = db.createObjectStore('userData', { keyPath: 'id' });
    userStore.createIndex('email', 'email', { unique: true });
    userStore.createIndex('role', 'role', { unique: false });
}
```

**¿Qué guarda?**
```javascript
{
  id: "user123",
  name: "Juan Pérez",
  email: "juan@mail.com",
  role: "estudiante",
  status: "active"
}
```

**¿Para qué?**
- Ver lista de usuarios sin internet
- Buscar por email o rol
- Mostrar en panel de administración

---

### **2. categories (Categorías)**

```javascript
if (!db.objectStoreNames.contains('categories')) {
    const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
    categoriesStore.createIndex('type', 'type', { unique: false });
}
```

**¿Qué guarda?**
```javascript
{
  id: "cat123",
  name: "Matemáticas",
  type: "science",
  icon: "📐"
}
```

**¿Para qué?**
- Mostrar categorías disponibles offline
- Filtrar por tipo

---

### **3. classes (Clases)**

```javascript
if (!db.objectStoreNames.contains('classes')) {
    const classesStore = db.createObjectStore('classes', { keyPath: 'id' });
    classesStore.createIndex('userId', 'userId', { unique: false });
    classesStore.createIndex('status', 'status', { unique: false });
}
```

**¿Qué guarda?**
```javascript
{
  id: "class123",
  title: "Álgebra Básica",
  userId: "user123",
  status: "active",
  date: "2025-10-26"
}
```

**¿Para qué?**
- Ver mis clases sin internet
- Filtrar por usuario o estado

---

### **4. stats (Estadísticas)**

```javascript
if (!db.objectStoreNames.contains('stats')) {
    db.createObjectStore('stats', { keyPath: 'userId' });
}
```

**¿Qué guarda?**
```javascript
{
  userId: "user123",
  totalClasses: 15,
  completedClasses: 12,
  averageScore: 8.5
}
```

**¿Para qué?**
- Mostrar estadísticas del usuario sin internet

---

### **5. syncQueue ⭐ (Cola de Sincronización)**

```javascript
if (!db.objectStoreNames.contains('syncQueue')) {
    const syncStore = db.createObjectStore('syncQueue', { 
        keyPath: 'id', 
        autoIncrement: true 
    });
    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
    syncStore.createIndex('status', 'status', { unique: false });
    syncStore.createIndex('operation', 'operation', { unique: false });
}
```

**¿Qué guarda?**
```javascript
{
  id: 1,
  operation: "create-user",
  endpoint: "/api/users",
  method: "POST",
  data: { name: "Pedro", email: "pedro@mail.com" },
  timestamp: 1729987200000,
  status: "pending",  // 'pending', 'syncing', 'synced', 'failed'
  retries: 0,
  error: null
}
```

**¿Para qué?** ⭐ **ESTO ES LO MÁS IMPORTANTE**
- Cuando estás **sin internet** y quieres crear/editar/eliminar algo
- Guarda la operación aquí como "pendiente"
- Cuando vuelves a tener internet, **sincroniza automáticamente**

---

## 🔄 **Sincronización Offline → Online**

### **Escenario completo:**

```
1️⃣ Usuario OFFLINE:
Usuario: "Quiero crear un nuevo estudiante 'Pedro'"
   ↓
Internet: ❌ No disponible
   ↓
App: "Ok, lo guardo para después"
   ↓
addToSyncQueue({
  operation: "create-user",
  endpoint: "/api/users",
  method: "POST",
  data: { name: "Pedro", email: "pedro@mail.com" },
  status: "pending"
})
   ↓
IndexedDB syncQueue:
┌────────────────────────────────────┐
│ ID: 1                              │
│ Operation: create-user             │
│ Status: PENDING ⏳                 │
│ Data: Pedro, pedro@mail.com        │
└────────────────────────────────────┘


2️⃣ Usuario vuelve ONLINE:
Internet: ✅ Conectado
   ↓
Service Worker: "¡Hay internet! Voy a sincronizar"
   ↓
syncOfflineData() se ejecuta
   ↓
Lee syncQueue:
┌────────────────────────────────────┐
│ Encontré 1 operación pendiente     │
│ Operation: create-user             │
└────────────────────────────────────┘
   ↓
Hace la petición al servidor:
POST /api/users
{
  name: "Pedro",
  email: "pedro@mail.com"
}
   ↓
Servidor: ✅ "Usuario creado exitosamente"
   ↓
deleteSyncItem(1) → Borra de la cola
   ↓
Usuario ve notificación:
"Cambios sincronizados correctamente" ✅
```

---

## 📊 **Funciones Principales**

### **1. initDB() - Inicializar Base de Datos**

```javascript
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        // ...
    });
}
```

**¿Qué hace?**
- Abre o crea la base de datos "ClassGoOfflineDB"
- Crea las 5 "libretas" (object stores)
- Se ejecuta cuando cargas la app

**Cuándo se usa:**
```javascript
// Al cargar la app
window.addEventListener('load', async () => {
    await initDB();
    console.log('✅ Base de datos lista');
});
```

---

### **2. storeData() - Guardar Datos**

```javascript
function storeData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = Array.isArray(data) 
            ? data.forEach(item => store.put(item))
            : store.put(data);
        // ...
    });
}
```

**¿Qué hace?**
- Guarda datos en una "libreta" específica
- Puede guardar 1 objeto o un array

**Ejemplo:**
```javascript
// Guardar 1 usuario
await storeData('userData', {
    id: 'user123',
    name: 'Juan',
    email: 'juan@mail.com'
});

// Guardar varios usuarios
await storeData('userData', [
    { id: 'user123', name: 'Juan' },
    { id: 'user456', name: 'Ana' }
]);
```

---

### **3. getData() - Leer Datos**

```javascript
function getData(storeName, key = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = key ? store.get(key) : store.getAll();
        // ...
    });
}
```

**¿Qué hace?**
- Lee datos de una "libreta"
- Puede leer 1 específico o todos

**Ejemplo:**
```javascript
// Leer 1 usuario específico
const user = await getData('userData', 'user123');
console.log(user); // { id: 'user123', name: 'Juan', ... }

// Leer TODOS los usuarios
const allUsers = await getData('userData');
console.log(allUsers); // [{ id: 'user123' }, { id: 'user456' }, ...]
```

---

### **4. addToSyncQueue() - Guardar Operación Pendiente**

```javascript
async function addToSyncQueue(operation, endpoint, data, method = 'POST') {
    const syncItem = {
        operation: operation,        // 'create-user'
        endpoint: endpoint,           // '/api/users'
        method: method,               // 'POST'
        data: data,                   // { name: 'Pedro' }
        timestamp: Date.now(),
        status: 'pending',
        retries: 0,
        error: null
    };
    // Guardar en IndexedDB
}
```

**¿Qué hace?**
- Cuando estás offline y haces una operación (crear, editar, eliminar)
- La guarda en la cola para sincronizar después

**Ejemplo:**
```javascript
// Usuario offline quiere crear un estudiante
if (!navigator.onLine) {
    await addToSyncQueue(
        'create-user',           // Operación
        '/api/users',            // Endpoint
        { name: 'Pedro', email: 'pedro@mail.com' }, // Data
        'POST'                   // Método
    );
    alert('Se guardará cuando vuelvas a tener internet');
}
```

---

### **5. syncOfflineData() - Sincronizar Todo**

```javascript
async function syncOfflineData() {
    if (!navigator.onLine) {
        return; // Todavía offline
    }
    
    const pendingItems = await getPendingSyncItems();
    
    for (const item of pendingItems) {
        // Hacer fetch al servidor
        const response = await fetch(item.endpoint, {
            method: item.method,
            body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
            await deleteSyncItem(item.id); // Borrar de cola
        }
    }
}
```

**¿Qué hace?**
- Se ejecuta automáticamente cuando vuelves online
- Lee todas las operaciones pendientes
- Las envía al servidor
- Si funcionan, las borra de la cola

**Cuándo se ejecuta:**
```javascript
// Automáticamente cuando vuelves online
window.addEventListener('online', () => {
    console.log('✅ Internet restaurado, sincronizando...');
    syncOfflineData();
});
```

---

## 🎬 **Ejemplo Completo: Crear Usuario Offline**

### **Paso a paso:**

```javascript
// 1️⃣ Usuario hace click en "Crear Usuario"
async function crearUsuario() {
    const newUser = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        role: 'estudiante'
    };
    
    // 2️⃣ Verificar si hay internet
    if (navigator.onLine) {
        // CON INTERNET: Enviar directo al servidor
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        
        if (response.ok) {
            alert('Usuario creado ✅');
        }
    } else {
        // SIN INTERNET: Guardar en cola
        await addToSyncQueue(
            'create-user',
            '/api/users',
            newUser,
            'POST'
        );
        
        alert('⏳ Se creará cuando vuelvas a tener internet');
        
        // Opcional: Guardar temporalmente en IndexedDB para mostrarlo
        await storeData('userData', {
            id: 'temp-' + Date.now(),
            ...newUser,
            _pendingSync: true  // Marcador de que está pendiente
        });
    }
}

// 3️⃣ Cuando vuelve internet, sincroniza automáticamente
window.addEventListener('online', async () => {
    await syncOfflineData();
    // Usuario ve: "Cambios sincronizados correctamente" ✅
});
```

---

## 🔍 **¿Dónde se Usa el appshell.js?**

### **1. En el Service Worker (sw.js):**

```javascript
// sw.js
importScripts('/frontend/js/appshell.js');

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('classgo-v3-pwa').then(cache => {
            return cache.addAll(HOME_APPSHELL); // ⭐ Usa la lista
        })
    );
});
```

**¿Para qué?**
- El Service Worker lee `HOME_APPSHELL`
- Cachea los 9 archivos durante la instalación

---

### **2. En tu app principal:**

```javascript
// app.js
window.addEventListener('load', async () => {
    // Inicializar IndexedDB
    await initDB();
    
    // Verificar si hay operaciones pendientes
    const pending = await getPendingSyncItems();
    if (pending.length > 0) {
        console.log(`⏳ Tienes ${pending.length} operaciones pendientes`);
    }
    
    // Sincronizar si hay internet
    if (navigator.onLine) {
        await syncOfflineData();
    }
});

// Escuchar cuando vuelve internet
window.addEventListener('online', async () => {
    console.log('✅ Internet restaurado');
    await syncOfflineData();
});
```

---

## 📊 **Comparación: Con vs Sin App Shell**

### **SIN App Shell:**

```
Usuario sin internet:
   ↓
Abre ClassGo
   ↓
❌ Error: "No hay conexión"
❌ Página en blanco
❌ No puede hacer nada
```

### **CON App Shell:**

```
Usuario sin internet:
   ↓
Abre ClassGo
   ↓
✅ Carga desde caché
✅ Ve la interfaz completa
✅ Puede ver datos guardados (usuarios, clases)
✅ Puede crear/editar (se sincroniza después)
```

---

## 🎯 **Resumen en 3 Puntos**

1. **¿Qué es?**
   > Lista de archivos esenciales + base de datos local para funcionar offline

2. **¿Para qué sirve?**
   > Cachear archivos HTML/CSS/JS para cargar rápido y funcionar sin internet

3. **¿Qué contiene?**
   > - HOME_APPSHELL: 9 archivos a cachear
   > - IndexedDB: 5 "libretas" para guardar datos
   > - syncQueue: Cola para sincronizar operaciones offline

---

## 🧪 **Cómo Probarlo**

### **Prueba 1: Ver App Shell en Cache**
```
1. Abre http://localhost:3000
2. F12 → Application tab
3. Cache Storage → classgo-v3-pwa
4. Debes ver los 9 archivos:
   ✅ home.html
   ✅ login.html
   ✅ styles.css
   ✅ home.css
   ✅ student-dashboard.css
   ✅ tutor-dashboard.css
   ✅ app.js
   ✅ api-service.js
   ✅ home.js
   ✅ appshell.js
   ✅ manifest.json
```

### **Prueba 2: Ver IndexedDB**
```
1. F12 → Application tab
2. IndexedDB → ClassGoOfflineDB
3. Debes ver las 5 "libretas":
   ✅ userData
   ✅ categories
   ✅ classes
   ✅ stats
   ✅ syncQueue
```

### **Prueba 3: Funcionar Offline**
```
1. Abre ClassGo
2. F12 → Network tab
3. Selecciona "Offline" (arriba)
4. Recarga la página (F5)
5. ✅ Debe cargar desde caché
6. ✅ Interfaz funcional
```

### **Prueba 4: Sincronización**
```
1. Activa modo offline
2. Intenta crear un usuario
3. Debe guardar en syncQueue
4. F12 → Application → IndexedDB → syncQueue
5. Verás la operación pendiente
6. Desactiva offline
7. Automáticamente sincroniza
8. Verás: "Cambios sincronizados correctamente"
```

---

## 🎨 **Diagrama Visual Completo**

```
┌─────────────────────────────────────────────────────────────┐
│                     APPSHELL.JS                             │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  PARTE 1: HOME_APPSHELL (Lista de Archivos)       │    │
│  │                                                    │    │
│  │  📄 HTML (2): home.html, login.html               │    │
│  │  🎨 CSS (4): styles, home, student, tutor         │    │
│  │  ⚙️ JS (3): app, api-service, home               │    │
│  │  📱 PWA (1): manifest.json                        │    │
│  │                                                    │    │
│  │  → Service Worker usa esto para cachear           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  PARTE 2: IndexedDB (Base de Datos Local)         │    │
│  │                                                    │    │
│  │  📓 userData: Usuarios (id, email, role)          │    │
│  │  📓 categories: Categorías (id, name, type)       │    │
│  │  📓 classes: Clases (id, userId, status)          │    │
│  │  📓 stats: Estadísticas (userId, totals)          │    │
│  │  📓 syncQueue: Operaciones pendientes ⭐          │    │
│  │                                                    │    │
│  │  → Guarda datos para leer/escribir offline        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  FUNCIONES PRINCIPALES                             │    │
│  │                                                    │    │
│  │  initDB()          → Inicializar BD               │    │
│  │  storeData()       → Guardar datos                │    │
│  │  getData()         → Leer datos                   │    │
│  │  addToSyncQueue()  → Guardar operación offline    │    │
│  │  syncOfflineData() → Sincronizar cuando online    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

         ↓ Usado por ↓

┌─────────────────────────────────────────────────────────────┐
│              SERVICE WORKER (sw.js)                         │
│                                                             │
│  INSTALL: Cachea HOME_APPSHELL (9 archivos)                │
│  FETCH: Sirve desde caché si hay                           │
│  SYNC: Ejecuta syncOfflineData() cuando vuelve internet    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 **Para Explicarlo a Otros**

### **Versión simple:**
> "El appshell.js es como una lista de compras que dice qué archivos guardar para funcionar sin internet, y también una libreta donde apuntas cosas cuando no hay conexión. Cuando vuelve internet, automáticamente envía todo lo que apuntaste."

### **Versión técnica:**
> "El App Shell es un patrón arquitectónico de PWA que define:
> 1. Los recursos mínimos necesarios para la interfaz (HOME_APPSHELL)
> 2. Un sistema de persistencia local con IndexedDB para datos y operaciones
> 3. Un mecanismo de sincronización diferida (syncQueue) que permite operaciones CRUD offline con sincronización automática cuando se restaura la conectividad."

---

## 🚀 **Mejoras Futuras (Opcional)**

### **Posibles extensiones:**

```javascript
// 1. Agregar más archivos al App Shell
const HOME_APPSHELL = [
    // ... archivos existentes
    '/frontend/images/logo.svg',        // Logo
    '/frontend/images/offline-icon.svg' // Ícono offline
];

// 2. Añadir notificaciones de sincronización
async function syncOfflineData() {
    // ... código existente
    
    // Mostrar badge de notificaciones
    if ('setAppBadge' in navigator) {
        navigator.setAppBadge(pendingItems.length);
    }
}

// 3. Reintentar operaciones fallidas
async function retrySyncQueue() {
    const failedItems = await getFailedSyncItems();
    for (const item of failedItems) {
        if (item.retries < 3) {
            await syncItem(item);
        }
    }
}
```

---

**¡Ahora entiendes perfectamente cómo funciona el App Shell en tu proyecto ClassGo!** 🎉

¿Quieres que te explique más sobre alguna función específica? 🚀
