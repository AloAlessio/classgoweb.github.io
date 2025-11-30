/**
 * ClassGo Real-time Chat System
 * Utiliza Firestore onSnapshot para mensajes instantáneos
 * Reemplaza el sistema de polling para mejor rendimiento
 */

// Firebase SDK imports via CDN (ya incluidos en el HTML)
// No necesitamos import statements - usamos la versión global

class RealtimeChat {
    constructor() {
        this.db = null;
        this.currentConversation = null;
        this.unsubscribe = null;
        this.onMessagesUpdate = null;
        this.onConversationsUpdate = null;
        this.conversationsUnsubscribe = null;
        this.initialized = false;
        this.currentUserId = localStorage.getItem('userId');
    }

    /**
     * Inicializar Firebase Firestore
     */
    async init() {
        if (this.initialized) return true;

        try {
            // Verificar que Firebase está cargado
            if (typeof firebase === 'undefined') {
                console.warn('⚠️ Firebase SDK no encontrado, usando modo polling');
                return false;
            }

            // Usar la instancia de Firestore existente o crear una nueva
            if (firebase.firestore) {
                this.db = firebase.firestore();
            } else {
                console.warn('⚠️ Firestore no disponible, usando modo polling');
                return false;
            }

            this.initialized = true;
            console.log('✅ Real-time Chat inicializado con Firestore');
            return true;

        } catch (error) {
            console.error('❌ Error inicializando Real-time Chat:', error);
            return false;
        }
    }

    /**
     * Escuchar cambios en tiempo real de una conversación
     * @param {string} conversationId - ID de la conversación
     * @param {Function} callback - Función a llamar cuando hay nuevos mensajes
     */
    subscribeToConversation(conversationId, callback) {
        // Limpiar subscripción anterior
        this.unsubscribeFromConversation();

        if (!this.db || !conversationId) {
            console.warn('⚠️ No se puede suscribir: Firestore no inicializado o conversationId faltante');
            return false;
        }

        this.currentConversation = conversationId;
        this.onMessagesUpdate = callback;

        try {
            // Crear listener en tiempo real
            this.unsubscribe = this.db
                .collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .orderBy('timestamp', 'asc')
                .onSnapshot(
                    (snapshot) => {
                        const messages = [];
                        snapshot.forEach((doc) => {
                            const data = doc.data();
                            messages.push({
                                id: doc.id,
                                ...data,
                                timestamp: data.timestamp?.toDate?.() || data.timestamp
                            });
                        });

                        console.log(`📨 Real-time: ${messages.length} mensajes recibidos`);
                        
                        if (this.onMessagesUpdate) {
                            this.onMessagesUpdate(messages);
                        }
                    },
                    (error) => {
                        console.error('❌ Error en listener de mensajes:', error);
                        // Fallback a polling si hay error de permisos
                        if (error.code === 'permission-denied') {
                            console.warn('⚠️ Permisos denegados, cambiando a modo polling');
                            this.unsubscribeFromConversation();
                        }
                    }
                );

            console.log(`🔔 Suscrito a conversación: ${conversationId}`);
            return true;

        } catch (error) {
            console.error('❌ Error suscribiéndose a conversación:', error);
            return false;
        }
    }

    /**
     * Cancelar subscripción a la conversación actual
     */
    unsubscribeFromConversation() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
            console.log('🔕 Desuscrito de conversación');
        }
        this.currentConversation = null;
        this.onMessagesUpdate = null;
    }

    /**
     * Escuchar cambios en la lista de conversaciones
     * @param {Function} callback - Función a llamar cuando hay cambios
     */
    subscribeToConversationsList(callback) {
        if (!this.db || !this.currentUserId) {
            console.warn('⚠️ No se puede suscribir a lista de conversaciones');
            return false;
        }

        // Limpiar subscripción anterior
        if (this.conversationsUnsubscribe) {
            this.conversationsUnsubscribe();
        }

        this.onConversationsUpdate = callback;

        try {
            this.conversationsUnsubscribe = this.db
                .collection('conversations')
                .where('participants', 'array-contains', this.currentUserId)
                .orderBy('lastMessageTime', 'desc')
                .onSnapshot(
                    async (snapshot) => {
                        const conversations = [];
                        
                        for (const doc of snapshot.docs) {
                            const data = doc.data();
                            const otherParticipantId = data.participants?.find(p => p !== this.currentUserId);
                            
                            conversations.push({
                                id: doc.id,
                                ...data,
                                lastMessageTime: data.lastMessageTime?.toDate?.() || data.lastMessageTime,
                                unreadCount: data.unreadCount?.[this.currentUserId] || 0,
                                otherParticipantId
                            });
                        }

                        console.log(`💬 Real-time: ${conversations.length} conversaciones actualizadas`);
                        
                        if (this.onConversationsUpdate) {
                            this.onConversationsUpdate(conversations);
                        }
                    },
                    (error) => {
                        console.error('❌ Error en listener de conversaciones:', error);
                    }
                );

            console.log('🔔 Suscrito a lista de conversaciones');
            return true;

        } catch (error) {
            console.error('❌ Error suscribiéndose a conversaciones:', error);
            return false;
        }
    }

    /**
     * Cancelar subscripción a la lista de conversaciones
     */
    unsubscribeFromConversationsList() {
        if (this.conversationsUnsubscribe) {
            this.conversationsUnsubscribe();
            this.conversationsUnsubscribe = null;
            console.log('🔕 Desuscrito de lista de conversaciones');
        }
        this.onConversationsUpdate = null;
    }

    /**
     * Enviar mensaje (usa el API del backend para mantener consistencia)
     * El mensaje aparecerá automáticamente via el listener
     * @param {string} conversationId 
     * @param {string} text 
     */
    async sendMessage(conversationId, text) {
        // Usamos el API del backend para enviar mensajes
        // Esto asegura validación, actualización de metadatos, etc.
        // El listener de Firestore detectará el nuevo mensaje automáticamente
        
        try {
            const response = await apiService.makeRequest(`/conversations/${conversationId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ text })
            });

            if (!response.success) {
                throw new Error(response.error || 'Error enviando mensaje');
            }

            console.log('✉️ Mensaje enviado via API');
            return true;

        } catch (error) {
            console.error('❌ Error enviando mensaje:', error);
            throw error;
        }
    }

    /**
     * Marcar conversación como leída
     * @param {string} conversationId 
     */
    async markAsRead(conversationId) {
        try {
            await apiService.makeRequest(`/conversations/${conversationId}/mark-read`, {
                method: 'PATCH'
            });
            console.log('✓ Marcado como leído');
        } catch (error) {
            console.error('Error marcando como leído:', error);
        }
    }

    /**
     * Limpiar todas las subscripciones
     */
    cleanup() {
        this.unsubscribeFromConversation();
        this.unsubscribeFromConversationsList();
        this.initialized = false;
        console.log('🧹 Real-time Chat limpiado');
    }

    /**
     * Verificar si está usando real-time o polling
     */
    isRealtime() {
        return this.initialized && this.db !== null;
    }
}

// Crear instancia global
const realtimeChat = new RealtimeChat();

// Exponer globalmente
window.realtimeChat = realtimeChat;

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    realtimeChat.cleanup();
});

console.log('📦 Real-time Chat module cargado');
