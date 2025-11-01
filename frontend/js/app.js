// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // First, unregister all old service workers and clear all caches
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }
            
            // Clear all caches
            const cacheNames = await caches.keys();
            for (let cacheName of cacheNames) {
                await caches.delete(cacheName);
            }
            
            console.log('🧹 Cleared all old service workers and caches');
            
            // Now register the new service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registered:', registration.scope);
            
            // Initialize IndexedDB for offline functionality
            if (typeof initDB === 'function') {
                await initDB();
            }
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('🔄 New version available. Refresh to update.');
                        showNotification('info', 'Nueva versión disponible. Recarga la página para actualizar.');
                    }
                });
            });
            
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button/banner if needed
    showInstallPrompt();
});

// Handle PWA installation
function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ User accepted PWA install');
                showNotification('success', '¡ClassGo instalado correctamente!');
            }
            deferredPrompt = null;
        });
    }
}

// Show install prompt
function showInstallPrompt() {
    // This can be customized to show a banner or button
    console.log('📱 PWA can be installed');
}

// Firebase configuration is now in frontend/js/firebase-config.js
// NOTE: Currently NOT using Firebase Client SDK directly in frontend
// Authentication and database operations are handled through the backend API
// Backend uses Firebase Admin SDK with secure credentials

// DOM elements - will be initialized after DOM loads
let loginForm, registerForm, forgotForm;
let loadingOverlay, messageContainer;
let successMessage, errorMessage;
let successText, errorText;
let loginFormElement, registerFormElement, forgotFormElement;

// Current active form
let currentForm = 'login';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements after page loads
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    forgotForm = document.getElementById('forgotForm');
    loadingOverlay = document.getElementById('loadingOverlay');
    messageContainer = document.getElementById('messageContainer');
    successMessage = document.getElementById('successMessage');
    errorMessage = document.getElementById('errorMessage');
    successText = document.getElementById('successText');
    errorText = document.getElementById('errorText');
    loginFormElement = document.getElementById('loginFormElement');
    registerFormElement = document.getElementById('registerFormElement');
    forgotFormElement = document.getElementById('forgotFormElement');
    
    console.log('📦 DOM elements loaded:', {
        loginForm: !!loginForm,
        registerForm: !!registerForm,
        forgotForm: !!forgotForm,
        loginFormElement: !!loginFormElement,
        registerFormElement: !!registerFormElement,
        forgotFormElement: !!forgotFormElement,
        successMessage: !!successMessage,
        errorMessage: !!errorMessage,
        loadingOverlay: !!loadingOverlay
    });
    
    initializeApp();
});

function initializeApp() {
    // Set up form event listeners
    setupFormListeners();
    
    // Initialize input animations
    setupInputAnimations();
    
    // Show initial form
    showForm('login');
    
    console.log('Login system initialized');
}

function setupFormListeners() {
    console.log('🔗 Setting up form listeners...');
    
    // Only setup listeners if elements exist (for login page)
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
        console.log('✅ Login form listener added');
    }
    
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', handleRegister);
        console.log('✅ Register form listener added');
    }
    
    if (forgotFormElement) {
        forgotFormElement.addEventListener('submit', handleForgotPassword);
        console.log('✅ Forgot password form listener added');
    }
    
    // Navigation button listeners - with debug logs
    const showForgotPasswordBtn = document.getElementById('showForgotPasswordBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginFromRegisterBtn = document.getElementById('showLoginFromRegisterBtn');
    const showLoginFromForgotBtn = document.getElementById('showLoginFromForgotBtn');
    
    console.log('🔍 Navigation buttons found:', {
        forgot: !!showForgotPasswordBtn,
        register: !!showRegisterBtn,
        loginFromRegister: !!showLoginFromRegisterBtn,
        loginFromForgot: !!showLoginFromForgotBtn
    });
    
    if (showForgotPasswordBtn) {
        showForgotPasswordBtn.addEventListener('click', () => {
            console.log('🔘 Forgot password button clicked');
            showForgotPassword();
        });
    }
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', () => {
            console.log('🔘 Register button clicked');
            showRegister();
        });
    }
    
    if (showLoginFromRegisterBtn) {
        showLoginFromRegisterBtn.addEventListener('click', () => {
            console.log('🔘 Back to login (from register) clicked');
            showLogin();
        });
    }
    
    if (showLoginFromForgotBtn) {
        showLoginFromForgotBtn.addEventListener('click', () => {
            console.log('🔘 Back to login (from forgot) clicked');
            showLogin();
        });
    }
}

function setupInputAnimations() {
    // Animate form inputs
    const inputs = document.querySelectorAll('.input-group input');
    
    // Password strength meter
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('input', (e) => {
            checkPasswordStrength(e.target.value);
        });
        
        // Hide strength meter when password is empty
        registerPassword.addEventListener('blur', (e) => {
            if (!e.target.value) {
                const pwStrength = document.getElementById('pwStrength');
                if (pwStrength) pwStrength.classList.remove('show');
            }
        });
    }
    
    // Clear field errors on input
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.parentElement.classList.contains('invalid')) {
                clearFieldError(input.id);
            }
        });
    });
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentNode.classList.remove('focused');
            }
        });
        
        // Check if input has value on page load
        if (input.value) {
            input.parentNode.classList.add('focused');
        }
    });
}

// Form management
function showForm(formType) {
    console.log(`📋 Showing form: ${formType}`);
    const forms = ['login', 'register', 'forgot'];
    
    forms.forEach(form => {
        const element = document.getElementById(`${form}Form`);
        if (element) {
            const shouldShow = form === formType;
            // Use CSS classes to control visibility
            if (shouldShow) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
            console.log(`  ${form}Form: ${shouldShow ? 'visible' : 'hidden'}`);
        } else {
            console.warn(`  ${form}Form element not found!`);
        }
    });
    
    currentForm = formType;
    
    // Clear any previous messages
    hideMessage();
}

function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showMessage(type, message, duration = 4000) {
    console.log('📢 showMessage called:', { type, message, hasSuccess: !!successMessage, hasError: !!errorMessage });
    hideMessage();
    
    if (type === 'success' && successMessage) {
        successText.textContent = message;
        successMessage.style.display = 'flex';
        console.log('✅ Success message - display set to flex');
        setTimeout(() => {
            successMessage.classList.add('show');
            console.log('✅ Success message - "show" class added');
        }, 10);
        setTimeout(() => hideMessage(), duration);
    } else if (type === 'error' && errorMessage) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        console.log('❌ Error message - display set to flex');
        setTimeout(() => {
            errorMessage.classList.add('show');
            console.log('❌ Error message - "show" class added');
        }, 10);
        setTimeout(() => hideMessage(), duration);
    } else if (type === 'info' && successMessage) {
        successText.textContent = message;
        successMessage.style.display = 'flex';
        console.log('ℹ️ Info message - display set to flex');
        setTimeout(() => {
            successMessage.classList.add('show');
            console.log('ℹ️ Info message - "show" class added');
        }, 10);
        setTimeout(() => hideMessage(), duration);
    } else if (type === 'warning' && errorMessage) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        console.log('⚠️ Warning message - display set to flex');
        setTimeout(() => {
            errorMessage.classList.add('show');
            console.log('⚠️ Warning message - "show" class added');
        }, 10);
        setTimeout(() => hideMessage(), duration);
    } else {
        console.error('❌ Could not show message - elements not found');
    }
}

function hideMessage() {
    if (successMessage) {
        successMessage.classList.remove('show');
        setTimeout(() => successMessage.style.display = 'none', 400);
    }
    if (errorMessage) {
        errorMessage.classList.remove('show');
        setTimeout(() => errorMessage.style.display = 'none', 400);
    }
}

// Navigation functions
function showLogin() {
    showForm('login');
}

function showRegister() {
    showForm('register');
}

function showForgotPassword() {
    showForm('forgot');
}

// Validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Login handler - INTEGRATED with API Service
async function handleLogin(e) {
    e.preventDefault();
    clearAllFieldErrors();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    let hasError = false;
    
    if (!email) {
        showFieldError('loginEmail', 'El email es requerido');
        hasError = true;
    } else if (!validateEmail(email)) {
        showFieldError('loginEmail', 'Por favor ingresa un email válido');
        hasError = true;
    }
    
    if (!password) {
        showFieldError('loginPassword', 'La contraseña es requerida');
        hasError = true;
    }
    
    if (hasError) return;
    
    showLoading(true);

    try {
        // Use API Service for login
        const response = await window.apiService.login(email, password);
        
        if (response.success) {
            // Store user data
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userName', response.user.nombre || response.user.email);
            localStorage.setItem('userRole', response.user.rol);
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('userId', response.user.id);
            localStorage.setItem('userAuthenticated', 'true'); // ⭐ KEY FLAG FOR HOME.JS
            
            // Show role-based welcome message
            const roleEmojis = {
                'administrador': '👑',
                'tutor': '🎓',
                'alumno': '📚'
            };
            const roleNames = {
                'administrador': 'Administrador',
                'tutor': 'Tutor',
                'alumno': 'Estudiante'
            };
            
            const userRole = response.user.rol;
            const userName = response.user.nombre || email;
            
            // Show welcome message with longer duration
            showMessage('success', `Bienvenido ${roleEmojis[userRole]} ${roleNames[userRole]}: ${userName.split(' ')[0]}`, 3000);
            
            // Redirect to appropriate dashboard based on role (after message shows)
            setTimeout(() => {
                let redirectUrl = '/home'; // Default for admin
                
                if (userRole === 'tutor') {
                    redirectUrl = '/tutor-dashboard';
                } else if (userRole === 'alumno') {
                    redirectUrl = '/student-dashboard';
                }
                
                console.log('🚀 Redirecting to:', redirectUrl, 'for role:', userRole);
                window.location.href = redirectUrl;
            }, 1200);
            
        } else {
            // Mostrar error inline en el campo correspondiente
            const errorMsg = response.message || response.error || 'Error en las credenciales';
            
            if (errorMsg.includes('password') || errorMsg.includes('contraseña') || errorMsg.includes('credential')) {
                showFieldError('loginPassword', '❌ Contraseña incorrecta');
            } else if (errorMsg.includes('email') || errorMsg.includes('user') || errorMsg.includes('found')) {
                showFieldError('loginEmail', '❌ No existe una cuenta con este email');
            } else {
                showFieldError('loginPassword', '❌ Email o contraseña incorrectos');
            }
        }
        
    } catch (error) {
        console.error('Login error:', error);
        const errorMsg = error.message || '';
        
        // Intentar mostrar error específico
        if (errorMsg.includes('INVALID_LOGIN_CREDENTIALS') || errorMsg.includes('credential')) {
            showFieldError('loginPassword', '❌ Email o contraseña incorrectos');
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('conexión')) {
            showMessage('error', '❌ Error de conexión. Verifica tu internet e inténtalo de nuevo.');
        } else {
            showFieldError('loginPassword', '❌ Error al iniciar sesión. Intenta de nuevo.');
        }
    } finally {
        showLoading(false);
    }
}

// Register handler - INTEGRATED with API Service
async function handleRegister(e) {
    e.preventDefault();
    clearAllFieldErrors();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const acceptTerms = document.getElementById('acceptTerms').checked;
    
    let hasError = false;
    
    if (!name) {
        showFieldError('registerName', 'El nombre es requerido');
        hasError = true;
    }
    
    if (!email) {
        showFieldError('registerEmail', 'El email es requerido');
        hasError = true;
    } else if (!validateEmail(email)) {
        showFieldError('registerEmail', 'Por favor ingresa un email válido');
        hasError = true;
    }
    
    if (!password) {
        showFieldError('registerPassword', 'La contraseña es requerida');
        hasError = true;
    } else if (password.length < 6) {
        showFieldError('registerPassword', 'La contraseña debe tener al menos 6 caracteres');
        hasError = true;
    }
    
    if (!confirmPassword) {
        showFieldError('confirmPassword', 'Confirma tu contraseña');
        hasError = true;
    } else if (password !== confirmPassword) {
        showFieldError('confirmPassword', 'Las contraseñas no coinciden');
        hasError = true;
    }
    
    if (!acceptTerms) {
        showFieldError('acceptTerms', 'Debes aceptar los términos y condiciones');
        hasError = true;
    }
    
    if (hasError) return;
    
    showLoading(true);

    try {
        // Use API Service for registration
        // El backend siempre asigna rol 'alumno' en registro público
        const response = await window.apiService.register({
            name: name,      // ✅ Corregido de 'nombre' a 'name'
            email: email,
            password: password
            // Campo 'rol' eliminado - el backend asigna 'alumno' automáticamente
        });
        
        if (response.success) {
            showMessage('success', '✅ Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
            
            // Clear form
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            document.getElementById('acceptTerms').checked = false;
            
            // Switch to login form after delay
            setTimeout(() => {
                showForm('login');
                document.getElementById('loginEmail').value = email;
                document.getElementById('loginEmail').focus();
            }, 2000);
            
        } else {
            // Mostrar error específico en el campo correspondiente
            const errorMsg = response.error || response.message || 'Error al registrar usuario';
            
            if (errorMsg.includes('email') || errorMsg.includes('Email') || errorMsg.includes('already')) {
                showFieldError('registerEmail', '⚠️ Este email ya está registrado. ¿Olvidaste tu contraseña?');
            } else {
                showMessage('error', errorMsg);
            }
        }
        
    } catch (error) {
        console.error('Register error:', error);
        // Mostrar error en el campo de email si es error de duplicado
        const errorMsg = error.message || '';
        if (errorMsg.includes('duplicate') || errorMsg.includes('already') || errorMsg.includes('exists')) {
            showFieldError('registerEmail', '⚠️ Este email ya está registrado. ¿Olvidaste tu contraseña?');
        } else {
            showMessage('error', '❌ Error de conexión. Verifica tu internet e inténtalo de nuevo.');
        }
    } finally {
        showLoading(false);
    }
}

// Forgot password handler - Using Backend API
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    if (!validateEmail(email)) {
        showMessage('error', 'Por favor ingresa un email válido');
        return;
    }
    
    showLoading(true);

    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('success', 'Se ha enviado un email para restablecer tu contraseña');
            
            // In development, show the reset link
            if (data.resetLink) {
                console.log('🔗 Password reset link:', data.resetLink);
            }
            
            setTimeout(() => {
                showForm('login');
            }, 3000);
        } else {
            showMessage('error', data.error || 'Error al enviar email de recuperación');
        }
        
    } catch (error) {
        console.error('Password reset error:', error);
        showMessage('error', 'Error al enviar email de recuperación. Intenta de nuevo.');
    } finally {
        showLoading(false);
    }
}

// Firebase error messages
function getFirebaseErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'No existe una cuenta con este email';
        case 'auth/wrong-password':
            return 'Contraseña incorrecta';
        case 'auth/email-already-in-use':
            return 'Este email ya está registrado';
        case 'auth/weak-password':
            return 'La contraseña es muy débil';
        case 'auth/invalid-email':
            return 'Email inválido';
        case 'auth/too-many-requests':
            return 'Demasiados intentos. Intenta más tarde';
        default:
            return 'Error de autenticación';
    }
}

// Utility functions for other pages
function getCurrentUser() {
    return {
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName'),
        role: localStorage.getItem('userRole'),
        token: localStorage.getItem('authToken'),
        id: localStorage.getItem('userId')
    };
}

function isUserLoggedIn() {
    return localStorage.getItem('userEmail') && localStorage.getItem('authToken');
}

function logout() {
    localStorage.clear();
    window.location.href = '/login';
}

// PWA notification function
function showNotification(type, message) {
    // This can be enhanced to show toast notifications
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // If the page has the message system, use it
    if (typeof showMessage === 'function') {
        showMessage(type, message);
    }
}

// Export functions for use in other scripts
window.authUtils = {
    getCurrentUser,
    isUserLoggedIn,
    logout,
    showNotification
};

// ========================================
// Password Toggle Functionality
// ========================================
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle');
    const eyeIcon = button.querySelector('.eye-icon');
    const eyeOffIcon = button.querySelector('.eye-off-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
        button.setAttribute('aria-label', 'Ocultar contraseña');
    } else {
        input.type = 'password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
        button.setAttribute('aria-label', 'Mostrar contraseña');
    }
}

// Make togglePassword global
window.togglePassword = togglePassword;

// ========================================
// Password Strength Meter
// ========================================
function checkPasswordStrength(password) {
    const pwStrength = document.getElementById('pwStrength');
    const pwLabel = document.getElementById('pwLabel');
    
    if (!pwStrength || !password) {
        if (pwStrength) pwStrength.classList.remove('show');
        return;
    }
    
    // Show strength meter
    pwStrength.classList.add('show');
    
    // Calculate strength
    let strength = 0;
    let strengthText = 'Muy débil';
    
    // Length check
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Complexity checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++; // Mixed case
    if (/\d/.test(password)) strength++; // Has numbers
    if (/[^a-zA-Z0-9]/.test(password)) strength++; // Has special chars
    
    // Remove all strength classes
    pwStrength.classList.remove('pw-very-weak', 'pw-weak', 'pw-medium', 'pw-strong', 'pw-very-strong');
    
    // Apply appropriate class
    if (strength <= 2) {
        pwStrength.classList.add('pw-very-weak');
        strengthText = 'Muy débil';
    } else if (strength <= 3) {
        pwStrength.classList.add('pw-weak');
        strengthText = 'Débil';
    } else if (strength <= 4) {
        pwStrength.classList.add('pw-medium');
        strengthText = 'Media';
    } else if (strength <= 5) {
        pwStrength.classList.add('pw-strong');
        strengthText = 'Fuerte';
    } else {
        pwStrength.classList.add('pw-very-strong');
        strengthText = 'Muy fuerte';
    }
    
    pwLabel.textContent = strengthText;
}

// ========================================
// Toast Notification System
// ========================================
function showFieldError(fieldId, message) {
    // Just add visual indicator to field without inline message
    const container = document.getElementById(fieldId)?.parentElement;
    if (container) {
        container.classList.add('invalid');
        // Show as toast instead
        showToast(message, 'error');
    }
}

function clearFieldError(fieldId) {
    const container = document.getElementById(fieldId)?.parentElement;
    if (container) {
        container.classList.remove('invalid');
    }
}

function clearAllFieldErrors() {
    document.querySelectorAll('.input-container.invalid').forEach(container => {
        container.classList.remove('invalid');
    });
}

// Toast notification function
function showToast(message, type = 'error') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    const icons = {
        error: '❌',
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const colors = {
        error: { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444', shadow: 'rgba(239, 68, 68, 0.4)' },
        success: { bg: 'rgba(34, 197, 94, 0.95)', border: '#22c55e', shadow: 'rgba(34, 197, 94, 0.4)' },
        warning: { bg: 'rgba(251, 191, 36, 0.95)', border: '#fbbf24', shadow: 'rgba(251, 191, 36, 0.4)' },
        info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.4)' }
    };

    const color = colors[type] || colors.error;
    
    toast.innerHTML = `
        <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px;
            background: ${color.bg};
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid ${color.border};
            border-radius: 12px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 32px ${color.shadow}, 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
            pointer-events: auto;
            cursor: pointer;
            transition: all 0.3s ease;
            animation: slideInRight 0.3s ease;
            min-width: 280px;
            max-width: 400px;
        " onmouseover="this.style.transform='translateX(-5px) scale(1.02)'; this.style.boxShadow='0 12px 48px ${color.shadow}, 0 0 0 1px rgba(255, 255, 255, 0.2) inset';" onmouseout="this.style.transform='translateX(0) scale(1)'; this.style.boxShadow='0 8px 32px ${color.shadow}, 0 0 0 1px rgba(255, 255, 255, 0.1) inset';">
            <span style="font-size: 20px; flex-shrink: 0;">${icons[type]}</span>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.parentElement.remove();" style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.2s ease;
                flex-shrink: 0;
            " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)';" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)';">×</button>
        </div>
    `;

    // Add animation styles if not already added
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    toastContainer.appendChild(toast);

    // Auto remove after 4 seconds with slide out animation
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);

    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    });
}