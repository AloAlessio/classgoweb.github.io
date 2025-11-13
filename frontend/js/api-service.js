// API Service for ClassGo Frontend
// Centralizes all backend communication and authentication handling

class APIService {
    constructor() {
        // Detectar automáticamente el entorno
        // En producción (Render), usa la URL de producción
        // En desarrollo, usa localhost
        const isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1';
        
        this.baseURL = isProduction 
            ? `${window.location.origin}/api`  // Producción: usa la misma URL del sitio
            : 'http://localhost:3000/api';     // Desarrollo: localhost
        
        console.log(`🌐 API Service initialized - Environment: ${isProduction ? 'Production' : 'Development'}`);
        console.log(`📡 Base URL: ${this.baseURL}`);
        
        this.token = null;
        this.refreshToken = null;
        this.isRefreshing = false;
        this.failedQueue = [];
    }

    // ============= AUTHENTICATION METHODS =============

    /**
     * Set authentication token
     */
    setAuthToken(token, refreshToken = null) {
        this.token = token;
        this.refreshToken = refreshToken;
        localStorage.setItem('authToken', token);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    /**
     * Get stored auth token
     */
    getAuthToken() {
        if (!this.token) {
            this.token = localStorage.getItem('authToken');
        }
        return this.token;
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userProfile');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getAuthToken();
    }

    // ============= HTTP REQUEST METHODS =============

    /**
     * Make HTTP request with automatic token handling
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
            const response = await fetch(url, config);
            
            // 🔄 VERIFICAR SI HAY TOKEN NUEVO EN LOS HEADERS
            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                console.log('🔄 Token renovado automáticamente');
                localStorage.setItem('authToken', newToken);
                this.token = newToken;
            }
            
            const data = await response.json();
            
            // Handle error responses (4xx, 5xx)
            if (!response.ok) {
                console.warn(`⚠️ API Error Response: ${response.status}`, data);
                
                // 🚪 Si el token expiró completamente, hacer logout
                if (data.tokenExpired) {
                    console.log('❌ Token expirado - Cerrando sesión...');
                    this.clearAuth();
                    localStorage.clear();
                    window.location.href = '/';
                    return {
                        success: false,
                        error: 'Sesión expirada. Por favor inicia sesión de nuevo.',
                        tokenExpired: true
                    };
                }
                
                // Para errores de autenticación, devolver objeto con success: false
                return {
                    success: false,
                    error: data.error || data.message || `Error ${response.status}`,
                    message: data.error || data.message || `Error ${response.status}`,
                    status: response.status
                };
            }

            console.log(`✅ API Response: ${response.status}`, data);
            return data;

        } catch (error) {
            console.error('❌ API Request failed:', error);
            // Devolver objeto de error en lugar de throw
            return {
                success: false,
                error: error.message || 'Error de conexión',
                message: error.message || 'Error de conexión'
            };
        }
    }

    /**
     * Handle error responses
     */
    async handleErrorResponse(response) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle 401 Unauthorized - token expired
        if (response.status === 401 && this.refreshToken) {
            try {
                await this.refreshAuthToken();
                // Retry the original request will be handled by the calling code
                return;
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                this.clearAuth();
                window.location.href = '/frontend/html/login.html';
                return;
            }
        }

        // Handle other errors
        const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }

    /**
     * Refresh authentication token
     */
    async refreshAuthToken() {
        if (this.isRefreshing) {
            // If already refreshing, wait for it to complete
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
            });
        }

        try {
            this.isRefreshing = true;
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.setAuthToken(data.data.accessToken, data.data.refreshToken);
            
            // Process failed queue
            this.failedQueue.forEach(({ resolve }) => resolve());
            this.failedQueue = [];

        } catch (error) {
            // Process failed queue with error
            this.failedQueue.forEach(({ reject }) => reject(error));
            this.failedQueue = [];
            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    // ============= CONVENIENCE METHODS =============

    async get(endpoint) {
        return this.makeRequest(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data) {
        return this.makeRequest(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.makeRequest(endpoint, { method: 'DELETE' });
    }

    /**
     * Test backend connectivity
     */
    async ping() {
        try {
            // Since there's no dedicated ping endpoint, test with any authenticated endpoint
            const response = await this.get('/users/me');
            return { success: true, message: 'Backend connected' };
        } catch (error) {
            console.warn('Backend ping failed:', error);
            return { success: false, message: 'Backend not available' };
        }
    }

    // ============= AUTHENTICATION API CALLS =============

    /**
     * User registration
     */
    async register(userData) {
        const response = await this.post('/auth/register', userData);
        
        // Si el registro es exitoso, guardar tokens
        if (response.success && response.data) {
            if (response.data.token) {
                this.setAuthToken(response.data.token, response.data.refreshToken);
            }
            if (response.data.user) {
                localStorage.setItem('userProfile', JSON.stringify(response.data.user));
            }
        }
        
        return response;
    }

    /**
     * User login with Backend API (Firebase temporarily disabled)
     */
    async login(email, password) {
        try {
            console.log('🔐 Authenticating with backend API...');
            
            // Direct backend authentication without Firebase
            const response = await this.post('/auth/login', { 
                email, 
                password 
            });
            
            if (response.success) {
                // Store tokens and user data
                const token = response.token || response.data?.token;
                const user = response.user || response.data?.user;
                
                if (token) {
                    this.setAuthToken(token);
                }
                
                if (user) {
                    localStorage.setItem('userProfile', JSON.stringify(user));
                }
                
                return {
                    success: true,
                    user: user,
                    token: token,
                    message: 'Login successful'
                };
            } else {
                throw new Error(response.message || 'Authentication failed');
            }

        } catch (error) {
            console.error('Login failed:', error);
            
            // Return structured error response
            return {
                success: false,
                message: this.getErrorMessage(error),
                error: error.code || 'login-error'
            };
        }
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        const errorCode = error.code;
        
        switch (errorCode) {
            case 'auth/user-not-found':
                return 'No existe una cuenta con este email';
            case 'auth/wrong-password':
                return 'Contraseña incorrecta';
            case 'auth/invalid-email':
                return 'Email inválido';
            case 'auth/user-disabled':
                return 'Esta cuenta ha sido deshabilitada';
            case 'auth/too-many-requests':
                return 'Demasiados intentos. Intenta más tarde';
            default:
                return error.message || 'Error de autenticación';
        }
    }

    /**
     * User logout
     */
    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            this.clearAuth();
        }
    }

    /**
     * Change user role (admin only)
     */
    async changeUserRole(userId, newRole) {
        return this.post('/auth/change-role', { userId, newRole });
    }

    // ============= USER API CALLS =============

    /**
     * Get current user profile
     */
    async getUserProfile() {
        const response = await this.get('/users/profile');
        if (response.success) {
            localStorage.setItem('userProfile', JSON.stringify(response.data.user));
        }
        return response;
    }

    /**
     * Update user profile
     */
    async updateUserProfile(profileData) {
        const response = await this.put('/users/profile', profileData);
        if (response.success) {
            localStorage.setItem('userProfile', JSON.stringify(response.data.user));
        }
        return response;
    }

    /**
     * Get list of users (admin only)
     */
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/users/list?${queryString}` : '/users/list';
        return this.get(endpoint);
    }

    /**
     * Change user role (admin only)
     */
    async changeRole(userId, role) {
        return this.post('/users/change-role', { userId, role });
    }

    // ============= CLASSES API CALLS =============

    /**
     * Get classes list
     */
    async getClasses(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/classes?${queryString}` : '/classes';
        return this.get(endpoint);
    }

    /**
     * Get specific class details
     */
    async getClass(classId) {
        return this.get(`/classes/${classId}`);
    }

    /**
     * Create new class (tutor/admin only)
     */
    async createClass(classData) {
        return this.post('/classes', classData);
    }

    /**
     * Update class (tutor/admin only)
     */
    async updateClass(classId, classData) {
        return this.put(`/classes/${classId}`, classData);
    }

    /**
     * Join a class (student only)
     */
    async joinClass(classId) {
        return this.post(`/classes/${classId}/join`);
    }

    /**
     * Leave a class (student only)
     */
    async leaveClass(classId) {
        return this.post(`/classes/${classId}/leave`);
    }

    /**
     * Update class status (tutor/admin only)
     */
    async updateClassStatus(classId, status) {
        return this.patch(`/classes/${classId}/status`, { status });
    }

    // ============= NOTES API CALLS =============

    /**
     * Get notes list
     */
    async getNotes(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/notes?${queryString}` : '/notes';
        return this.get(endpoint);
    }

    /**
     * Get specific note
     */
    async getNote(noteId) {
        return this.get(`/notes/${noteId}`);
    }

    /**
     * Create new note (tutor/admin only)
     */
    async createNote(noteData) {
        return this.post('/notes', noteData);
    }

    /**
     * Update note (author/admin only)
     */
    async updateNote(noteId, noteData) {
        return this.put(`/notes/${noteId}`, noteData);
    }

    /**
     * Delete note (author/admin only)
     */
    async deleteNote(noteId) {
        return this.delete(`/notes/${noteId}`);
    }

    /**
     * Get notes for specific class
     */
    async getClassNotes(classId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/notes/class/${classId}?${queryString}` : `/notes/class/${classId}`;
        return this.get(endpoint);
    }

    // ============= STATISTICS API CALLS =============

    /**
     * Get personal statistics
     */
    async getPersonalStats() {
        return this.get('/stats/personal');
    }

    /**
     * Get system statistics (admin only)
     */
    async getSystemStats() {
        return this.get('/stats/system');
    }

    /**
     * Get dashboard statistics by role
     */
    async getDashboardStats(role) {
        return this.get(`/stats/dashboard/${role}`);
    }

    // ============= UTILITY METHODS =============

    /**
     * Get cached user profile
     */
    getCachedUserProfile() {
        const cached = localStorage.getItem('userProfile');
        return cached ? JSON.parse(cached) : null;
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    /**
     * Check backend connectivity
     */
    async checkConnectivity() {
        try {
            await this.healthCheck();
            return true;
        } catch (error) {
            console.error('Backend connectivity check failed:', error);
            return false;
        }
    }
}

// Create global instance
window.apiService = new APIService();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}

console.log('🔌 API Service initialized and ready for backend communication');