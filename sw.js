// Service Worker for ClassGo PWA
// Handles caching, offline functionality, and background sync

const CACHE_NAME = 'classgo-v68-modal-sync-optimization'; // Updated: Modal state management optimized
const OFFLINE_URL = '/frontend/html/home.html';

// Import app shell configuration
importScripts('/frontend/js/appshell.js');

// Install event - cache app shell
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching app shell resources...');
                
                // Cache files one by one to avoid failing if one is missing
                const cachePromises = HOME_APPSHELL.map(url => 
                    fetch(url)
                        .then(response => {
                            if (response.ok) {
                                console.log('✅ Cached:', url);
                                return cache.put(url, response);
                            } else {
                                console.warn('⚠️ Failed to cache (not found):', url);
                            }
                        })
                        .catch(error => {
                            console.warn('⚠️ Error caching:', url, error.message);
                        })
                );
                
                return Promise.allSettled(cachePromises);
            })
            .then(results => {
                const successful = results.filter(r => r.status === 'fulfilled').length;
                console.log(`✅ Cached ${successful}/${HOME_APPSHELL.length} files successfully`);
            })
            .catch(error => {
                console.error('❌ Error during cache process:', error);
            })
            .finally(() => {
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Delete old caches, keep current one
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - Cache First strategy for app shell, Network First for API
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Skip cross-origin requests
    if (url.origin !== self.location.origin) {
        return;
    }

    // Skip clear-cache utility page (bypass SW)
    if (url.pathname === '/clear-cache') {
        return; // Let browser handle it directly
    }

    // API requests - Network First, DON'T cache mutations (POST, PUT, DELETE)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Only cache GET requests (safe, idempotent)
                    if (event.request.method === 'GET' && response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        }).catch(err => {
                            console.warn('⚠️ Could not cache API response:', err);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Network failed, try cache (only for GET requests)
                    if (event.request.method === 'GET') {
                        return caches.match(event.request)
                            .then(cachedResponse => {
                                if (cachedResponse) {
                                    console.log('📦 Serving API from cache:', url.pathname);
                                    return cachedResponse;
                                }
                                // No cache, return offline response
                                return new Response(
                                    JSON.stringify({ success: false, error: 'Sin conexión a internet' }),
                                    { 
                                        status: 503,
                                        headers: { 'Content-Type': 'application/json' }
                                    }
                                );
                            });
                    } else {
                        // For POST/PUT/DELETE, just return offline error
                        return new Response(
                            JSON.stringify({ success: false, error: 'Sin conexión a internet. Operación no completada.' }),
                            { 
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    }
                })
        );
        return;
    }

    // App Shell resources - Cache First, fallback to network
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('📦 Serving from cache:', url.pathname);
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Cache successful responses
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return response;
                    })
                    .catch(error => {
                        console.error('❌ Fetch failed:', url.pathname, error);
                        
                        // For navigation requests, show offline page
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }
                        
                        return new Response('Network error', { status: 503 });
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-offline-data') {
        event.waitUntil(
            syncOfflineData()
                .then(() => {
                    console.log('✅ Background sync completed');
                })
                .catch(error => {
                    console.error('❌ Background sync failed:', error);
                    throw error; // Retry sync
                })
        );
    }
});

// Push notification handler (for future use)
self.addEventListener('push', event => {
    console.log('🔔 Push message received');
    
    const options = {
        body: event.data ? event.data.text() : 'Nueva notificación de ClassGo',
        icon: '/frontend/images/icon-192x192.png',
        badge: '/frontend/images/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('ClassGo', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('🔔 Notification clicked');
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/frontend/html/home.html')
    );
});

console.log('🎯 ClassGo Service Worker loaded');