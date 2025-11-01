// PWA App Shell - ClassGo
// Cache resources for offline functionality

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

// IndexedDB setup for offline data storage
let db;
const DB_NAME = 'ClassGoOfflineDB';
const DB_VERSION = 2; // Increased for new sync queue store

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('❌ Error opening IndexedDB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('✅ IndexedDB initialized successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('🔄 Upgrading IndexedDB schema...');
            
            // Store for user data (read offline)
            if (!db.objectStoreNames.contains('userData')) {
                const userStore = db.createObjectStore('userData', { keyPath: 'id' });
                userStore.createIndex('email', 'email', { unique: true });
                userStore.createIndex('role', 'role', { unique: false });
                console.log('📦 Created: userData store');
            }
            
            // Store for categories/classes data (read offline)
            if (!db.objectStoreNames.contains('categories')) {
                const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
                categoriesStore.createIndex('type', 'type', { unique: false });
                console.log('📦 Created: categories store');
            }
            
            // Store for classes/courses (read offline)
            if (!db.objectStoreNames.contains('classes')) {
                const classesStore = db.createObjectStore('classes', { keyPath: 'id' });
                classesStore.createIndex('userId', 'userId', { unique: false });
                classesStore.createIndex('status', 'status', { unique: false });
                console.log('📦 Created: classes store');
            }
            
            // Store for stats (read offline)
            if (!db.objectStoreNames.contains('stats')) {
                db.createObjectStore('stats', { keyPath: 'userId' });
                console.log('📦 Created: stats store');
            }
            
            // 🆕 SYNC QUEUE - Cola de operaciones pendientes (CRUD offline)
            if (!db.objectStoreNames.contains('syncQueue')) {
                const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                syncStore.createIndex('status', 'status', { unique: false });
                syncStore.createIndex('operation', 'operation', { unique: false });
                console.log('📦 Created: syncQueue store (CRUD offline)');
            }
            
            console.log('✅ IndexedDB schema upgraded successfully');
        };
    });
}

// Store data in IndexedDB
function storeData(storeName, data) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = Array.isArray(data) 
            ? data.forEach(item => store.put(item))
            : store.put(data);
        
        transaction.oncomplete = () => {
            console.log(`✅ Data stored in ${storeName}`);
            resolve();
        };
        
        transaction.onerror = () => {
            console.error(`❌ Error storing data in ${storeName}:`, transaction.error);
            reject(transaction.error);
        };
    });
}

// Retrieve data from IndexedDB
function getData(storeName, key = null) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const request = key ? store.get(key) : store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            console.error(`❌ Error retrieving data from ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

// 🆕 Add operation to sync queue (when offline)
async function addToSyncQueue(operation, endpoint, data, method = 'POST') {
    if (!db) {
        console.error('❌ Database not initialized');
        return;
    }

    const syncItem = {
        operation: operation,        // 'create-user', 'update-user', 'delete-user', etc.
        endpoint: endpoint,           // '/api/users', '/api/notes', etc.
        method: method,               // 'POST', 'PUT', 'DELETE', etc.
        data: data,                   // Payload to send
        timestamp: Date.now(),
        status: 'pending',            // 'pending', 'syncing', 'synced', 'failed'
        retries: 0,
        error: null
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const request = store.add(syncItem);

        request.onsuccess = () => {
            console.log(`✅ Added to sync queue: ${operation}`, syncItem);
            resolve(request.result); // Returns the auto-generated ID
        };

        request.onerror = () => {
            console.error(`❌ Error adding to sync queue:`, request.error);
            reject(request.error);
        };
    });
}

// 🆕 Get all pending operations from sync queue
async function getPendingSyncItems() {
    if (!db) {
        console.error('❌ Database not initialized');
        return [];
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        const index = store.index('status');
        const request = index.getAll('pending');

        request.onsuccess = () => {
            console.log(`📋 Found ${request.result.length} pending sync items`);
            resolve(request.result);
        };

        request.onerror = () => {
            console.error('❌ Error getting pending sync items:', request.error);
            reject(request.error);
        };
    });
}

// 🆕 Update sync item status
async function updateSyncItemStatus(id, status, error = null) {
    if (!db) return;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) {
                item.status = status;
                item.error = error;
                if (status === 'failed') {
                    item.retries = (item.retries || 0) + 1;
                }
                
                const updateRequest = store.put(item);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
            } else {
                resolve();
            }
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

// 🆕 Delete synced item from queue
async function deleteSyncItem(id) {
    if (!db) return;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log(`🗑️ Deleted sync item: ${id}`);
            resolve();
        };

        request.onerror = () => reject(request.error);
    });
}

// Sync offline data when online
async function syncOfflineData() {
    if (!navigator.onLine) {
        console.log('� Still offline, skipping sync');
        return;
    }

    console.log('🔄 Starting offline data synchronization...');
    
    try {
        const pendingItems = await getPendingSyncItems();
        
        if (pendingItems.length === 0) {
            console.log('✅ No pending items to sync');
            return;
        }

        console.log(`📤 Syncing ${pendingItems.length} pending operations...`);

        for (const item of pendingItems) {
            try {
                // Mark as syncing
                await updateSyncItemStatus(item.id, 'syncing');

                // Get auth token
                const token = localStorage.getItem('authToken');
                
                // Make the API call
                const response = await fetch(item.endpoint, {
                    method: item.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: item.method !== 'DELETE' ? JSON.stringify(item.data) : undefined
                });

                if (response.ok) {
                    // Success - delete from queue
                    await deleteSyncItem(item.id);
                    console.log(`✅ Synced: ${item.operation}`);
                } else {
                    // Failed - mark as failed
                    const error = await response.text();
                    await updateSyncItemStatus(item.id, 'failed', error);
                    console.error(`❌ Sync failed: ${item.operation}`, error);
                }

            } catch (error) {
                // Network error - mark as failed
                await updateSyncItemStatus(item.id, 'failed', error.message);
                console.error(`❌ Sync error: ${item.operation}`, error);
            }
        }

        console.log('✅ Synchronization completed');

        // Show notification to user
        if (typeof showToast === 'function') {
            showToast('Cambios sincronizados correctamente', 'success');
        }

    } catch (error) {
        console.error('❌ Error during synchronization:', error);
    }
}

// Check if app shell is cached
function appshell() {
    return caches.open('classgo-v1').then(cache => {
        return cache.match('/frontend/html/home.html').then(response => {
            return !!response;
        });
    });
}

// Cache app shell resources
function cacheAppShell() {
    return caches.open('classgo-v1').then(cache => {
        console.log('📦 Caching app shell resources...');
        return cache.addAll(HOME_APPSHELL);
    });
}

// Export functions for use in service worker and main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HOME_APPSHELL,
        initDB,
        storeData,
        getData,
        syncOfflineData,
        appshell,
        cacheAppShell
    };
}