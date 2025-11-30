// Home Dashboard JavaScript
// PWA Offline Support
let offlineMode = false;
let offlineDb = null;

// Firebase Configuration and Initialization
let firebaseInitialized = false;
let firebaseDb = null;

// Initialize PWA offline capabilities
async function initializeOfflineSupport() {
    try {
        if (typeof initDB === 'function') {
            offlineDb = await initDB();
            console.log('✅ Offline database initialized');
            
            // Store initial data for offline use
            await storeOfflineData();
            
            // Check online/offline status
            updateConnectionStatus();
            
            // Listen for connection changes
            window.addEventListener('online', () => {
                offlineMode = false;
                console.log('🌐 Back online');
                showNotification('success', 'Conexión restaurada');
                syncOfflineData();
                updateConnectionStatus();
            });
            
            window.addEventListener('offline', () => {
                offlineMode = true;
                console.log('📱 Working offline');
                showNotification('warning', 'Modo sin conexión activado');
                updateConnectionStatus();
            });
        }
    } catch (error) {
        console.error('❌ Error initializing offline support:', error);
    }
}

// Store essential data for offline use
async function storeOfflineData() {
    try {
        // Store categories data
        if (typeof storeData === 'function' && categories) {
            await storeData('categories', categories);
        }
        
        // Store user data if authenticated
        if (isUserAuthenticated()) {
            const userData = {
                id: localStorage.getItem('userEmail') || 'user',
                name: localStorage.getItem('userName'),
                role: getUserRole(),
                authenticated: true
            };
            await storeData('userData', userData);
        }
        
        console.log('✅ Offline data stored');
    } catch (error) {
        console.error('❌ Error storing offline data:', error);
    }
}

// Load data from offline storage
async function loadOfflineData() {
    try {
        if (!offlineDb || typeof getData !== 'function') return null;
        
        // Load categories from offline storage
        const offlineCategories = await getData('categories');
        if (offlineCategories && offlineCategories.length > 0) {
            console.log('📱 Loading categories from offline storage');
            return offlineCategories;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error loading offline data:', error);
        return null;
    }
}

// Update connection status indicator
function updateConnectionStatus() {
    const isOnline = navigator.onLine;
    offlineMode = !isOnline;
    
    // Add connection indicator to header (you can customize this)
    let connectionIndicator = document.getElementById('connectionStatus');
    if (!connectionIndicator) {
        connectionIndicator = document.createElement('div');
        connectionIndicator.id = 'connectionStatus';
        connectionIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 1000;
            transition: all 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(connectionIndicator);
    }
    
    if (offlineMode) {
        connectionIndicator.textContent = '📱 Modo sin conexión';
        connectionIndicator.style.background = 'rgba(251, 191, 36, 0.9)';
        connectionIndicator.style.color = '#92400e';
        connectionIndicator.style.opacity = '1';
    } else {
        connectionIndicator.textContent = '🌐 Conectado';
        connectionIndicator.style.background = 'rgba(16, 185, 129, 0.9)';
        connectionIndicator.style.color = '#065f46';
        connectionIndicator.style.opacity = '1';
        
        // Hide after 3 seconds when online
        setTimeout(() => {
            connectionIndicator.style.opacity = '0';
        }, 3000);
    }
}

// Initialize Firebase for dashboard - DEPRECATED: Now using backend API
function initializeFirebaseForDashboard() {
    return new Promise((resolve) => {
        // No longer using Firebase Client SDK - all data comes from backend API
        console.log('✅ Skipping Firebase Client SDK - using backend API');
        resolve(true);
    });
}

// Check if Firebase is ready - DEPRECATED: Now using backend API
function isFirebaseReady() {
    // Always return false since we don't use Firebase Client SDK anymore
    return false;
}

// Get Firebase database instance
function getFirebaseDb() {
    if (!isFirebaseReady()) {
        throw new Error('Firebase no está inicializado. Usa initializeFirebaseForDashboard() primero.');
    }
    return firebaseDb;
}

// User Roles System
const USER_ROLES = {
    ADMIN: 'administrador',
    TUTOR: 'tutor', 
    STUDENT: 'alumno'
};

// Admin email configuration (first admin)
const ADMIN_EMAIL = 'admin@classgo.com'; // Cambia este email según necesites

// Get user role from localStorage or default to student
function getUserRole() {
    return localStorage.getItem('userRole') || USER_ROLES.STUDENT;
}

// Set user role
function setUserRole(role) {
    localStorage.setItem('userRole', role);
}

// Check if current user is admin
function isAdmin() {
    return getUserRole() === USER_ROLES.ADMIN;
}

// Check if current user is tutor
function isTutor() {
    return getUserRole() === USER_ROLES.TUTOR;
}

// Check if current user is student
function isStudent() {
    return getUserRole() === USER_ROLES.STUDENT;
}

// Role-based permissions
const PERMISSIONS = {
    [USER_ROLES.ADMIN]: {
        canManageUsers: true,
        canAssignRoles: true,
        canCreateCourses: true,
        canDeleteCourses: true,
        canViewAllStats: true,
        canModerateContent: true
    },
    [USER_ROLES.TUTOR]: {
        canManageUsers: false,
        canAssignRoles: false,
        canCreateCourses: true,
        canDeleteCourses: false,
        canViewAllStats: false,
        canModerateContent: true
    },
    [USER_ROLES.STUDENT]: {
        canManageUsers: false,
        canAssignRoles: false,
        canCreateCourses: false,
        canDeleteCourses: false,
        canViewAllStats: false,
        canModerateContent: false
    }
};

// Get user permissions
function getUserPermissions() {
    const role = getUserRole();
    return PERMISSIONS[role] || PERMISSIONS[USER_ROLES.STUDENT];
}

// Check if user has specific permission
function hasPermission(permission) {
    const permissions = getUserPermissions();
    return permissions[permission] || false;
}

// Categories Data
const categories = [
    {
        id: 'ciencia',
        icon: '🔬',
        title: 'Ciencias',
        description: 'Explora el mundo de la física, química y ciencias naturales',
        students: 1234,
        classes: 45,
        type: 'science'
    },
    {
        id: 'astronomia',
        icon: '🌌',
        title: 'Astronomía',
        description: 'Descubre los misterios del universo y los cuerpos celestes',
        students: 856,
        classes: 28,
        type: 'science'
    },
    {
        id: 'biologia',
        icon: '🧬',
        title: 'Biología',
        description: 'Comprende la vida y los organismos vivos',
        students: 1567,
        classes: 52,
        type: 'science'
    },
    {
        id: 'arte',
        icon: '🎨',
        title: 'Arte',
        description: 'Desarrolla tu creatividad con pintura, dibujo y diseño',
        students: 2341,
        classes: 67,
        type: 'arts'
    },
    {
        id: 'ingles',
        icon: '🗣️',
        title: 'Inglés',
        description: 'Domina el idioma inglés con tutores nativos',
        students: 3456,
        classes: 89,
        type: 'languages'
    },
    {
        id: 'matematicas',
        icon: '📐',
        title: 'Matemáticas',
        description: 'Resuelve problemas y desarrolla el pensamiento lógico',
        students: 2890,
        classes: 73,
        type: 'science'
    },
    {
        id: 'historia',
        icon: '📚',
        title: 'Historia',
        description: 'Viaja a través del tiempo y aprende del pasado',
        students: 1678,
        classes: 41,
        type: 'all'
    },
    {
        id: 'musica',
        icon: '🎵',
        title: 'Música',
        description: 'Aprende a tocar instrumentos y teoría musical',
        students: 1234,
        classes: 38,
        type: 'arts'
    },
    {
        id: 'programacion',
        icon: '💻',
        title: 'Programación',
        description: 'Desarrolla aplicaciones y aprende a codificar',
        students: 4567,
        classes: 95,
        type: 'all'
    },
    {
        id: 'geografia',
        icon: '🌍',
        title: 'Geografía',
        description: 'Explora países, culturas y fenómenos terrestres',
        students: 987,
        classes: 32,
        type: 'all'
    },
    {
        id: 'frances',
        icon: '🇫🇷',
        title: 'Francés',
        description: 'Aprende el idioma del amor y la cultura francesa',
        students: 1456,
        classes: 44,
        type: 'languages'
    },
    {
        id: 'quimica',
        icon: '⚗️',
        title: 'Química',
        description: 'Descubre las reacciones y propiedades de la materia',
        students: 1876,
        classes: 56,
        type: 'science'
    }
];

// Render Categories Function
function renderCategories(filter = 'all') {
    const grid = document.getElementById('categoriesGrid');
    let filteredCategories = categories;

    if (filter !== 'all') {
        filteredCategories = categories.filter(cat => cat.type === filter);
    }

    grid.innerHTML = filteredCategories.map(category => `
        <div class="category-card" onclick="openCategory('${category.id}')">
            <div class="category-icon">${category.icon}</div>
            <h3 class="category-title">${category.title}</h3>
            <p class="category-description">${category.description}</p>
            <div class="category-meta">
                <span class="students-count">👥 ${category.students} estudiantes</span>
                <span class="classes-count">📖 ${category.classes} clases</span>
            </div>
        </div>
    `).join('');
}

// Open Category Function
function openCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
        // In a real app, this would navigate to the category page
        showNotification('info', `Abriendo: ${category.title}`);
        console.log('Opening category:', category);
        
        // Future: Navigate to category detail page
        // window.location.href = `/category/${categoryId}`;
    }
}

// Switch Tab Function
function switchTab(filter, element) {
    try {
        // Remove active class from all tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to clicked tab
        element.classList.add('active');
        
        // Render categories with filter
        renderCategories(filter);
        
        // Show feedback
        const filterNames = {
            'all': 'Todas las Categorías',
            'science': 'Ciencias',
            'languages': 'Idiomas',
            'arts': 'Arte',
            'favorites': 'Favoritos'
        };
        
        showNotification('success', `Mostrando: ${filterNames[filter]}`);
    } catch (error) {
        console.error('Error switching tab:', error);
        showNotification('error', 'Error al cambiar categoría');
    }
}

// Join Class Function
function joinClass(classId) {
    const classNames = {
        'astronomia': 'Astronomía: Sistema Solar',
        'biologia': 'Biología: Células y Organismos',
        'ingles': 'Inglés Conversacional',
        'arte': 'Arte: Técnicas de Acuarela'
    };
    
    const className = classNames[classId] || classId;
    
    // In a real app, this would join the actual class
    showNotification('info', `Preparando clase: ${className}`);
    console.log('Joining class:', classId);
    
    // Future: Navigate to video call/classroom
    // window.location.href = `/class/${classId}`;
}

// Show Stats Function
function showStats(type) {
    const isAuth = isUserAuthenticated();
    
    if (isAuth) {
        // Personal stats for authenticated users
        const personalMessages = {
            classes: 'Has completado 24 clases este mes. ¡Excelente progreso!',
            students: 'Has estudiado 156 horas en total. ¡Sigue así!',
            tutors: 'Tienes 8 tutores diferentes enseñándote. ¡Diversidad de conocimiento!',
            progress: 'Tu progreso personal es del 87%. ¡Casi perfecto!'
        };
        
        const message = personalMessages[type] || 'Estadística personal no disponible';
        showNotification('info', message);
    } else {
        // General stats for guest users
        const generalMessages = {
            classes: 'Tenemos más de 1,200 clases disponibles en diferentes categorías. ¡Inicia sesión para empezar!',
            students: 'Únete a más de 15,000 estudiantes activos en nuestra plataforma.',
            tutors: 'Contamos con más de 250 tutores expertos listos para ayudarte.',
            progress: 'Nuestros estudiantes tienen una tasa de éxito del 95%. ¡Tú también puedes lograrlo!'
        };
        
        const message = generalMessages[type] || 'Estadística no disponible';
        showNotification('info', message);
        
        // Suggest login for personal stats
        setTimeout(() => {
            showNotification('warning', 'Inicia sesión para ver tus estadísticas personales');
        }, 3000);
    }
}

// Check if user is authenticated
function isUserAuthenticated() {
    const isAuth = localStorage.getItem('userAuthenticated') === 'true';
    const hasUserName = localStorage.getItem('userName');
    
    // Debug log to see what's in localStorage
    console.log('Auth check:', {
        isAuth,
        hasUserName,
        userName: localStorage.getItem('userName')
    });
    
    // If marked as authenticated but no user data, clear the flag
    if (isAuth && !hasUserName) {
        localStorage.removeItem('userAuthenticated');
        return false;
    }
    
    return isAuth;
}

// Update user interface based on authentication state
function updateUserInterface() {
    const isAuth = isUserAuthenticated();
    const avatarText = document.getElementById('avatarText');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    
    if (isAuth) {
        const userName = localStorage.getItem('userName') || 'Usuario';
        const userRole = getUserRole();
        const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        // Role-based welcome messages
        const roleEmojis = {
            [USER_ROLES.ADMIN]: '👑',
            [USER_ROLES.TUTOR]: '🎓',
            [USER_ROLES.STUDENT]: '📚'
        };
        
        const roleNames = {
            [USER_ROLES.ADMIN]: 'Administrador',
            [USER_ROLES.TUTOR]: 'Tutor',
            [USER_ROLES.STUDENT]: 'Estudiante'
        };
        
        const roleEmoji = roleEmojis[userRole] || '📚';
        const roleName = roleNames[userRole] || 'Estudiante';
        
        // Role-based subtitles
        const roleSubtitles = {
            [USER_ROLES.ADMIN]: 'Administrador - Gestiona la plataforma y usuarios',
            [USER_ROLES.TUTOR]: 'Tutor - Inspira y transforma vidas con tu conocimiento',
            [USER_ROLES.STUDENT]: 'Estudiante - Continúa tu aprendizaje donde lo dejaste'
        };
        
        const roleSubtitle = roleSubtitles[userRole] || 'Estudiante - Continúa tu aprendizaje donde lo dejaste';
        
        avatarText.textContent = userInitials;
        welcomeTitle.textContent = `¡Bienvenido de nuevo, ${userName.split(' ')[0]}! ${roleEmoji}`;
        welcomeSubtitle.textContent = roleSubtitle;
        
        // Update stats to personal stats
        updatePersonalStats();
    } else {
        avatarText.textContent = '?';
        welcomeTitle.textContent = '¡Bienvenido a ClassGo! 👋';
        welcomeSubtitle.textContent = 'Explora nuestra plataforma educativa';
        
        // Keep general stats
        updateGeneralStats();
        
        // Update dynamic section for guests
        updateDynamicSection(false);
    }
    
    // Update dynamic section for authenticated users
    if (isAuth) {
        updateDynamicSection(true);
    }
}

// Update dynamic content section based on authentication
function updateDynamicSection(isAuthenticated) {
    const sectionTitle = document.getElementById('dynamicSectionTitle');
    const contentSection = document.getElementById('dynamicContentSection');
    
    if (!sectionTitle || !contentSection) return;
    
    // Always show games section for everyone (guests, students, tutors)
    sectionTitle.textContent = '🎮 ¡Pon a Prueba tu Conocimiento!';
    contentSection.innerHTML = `
        <div class="class-item game-item" style="cursor: pointer;" onclick="playGameTopic('Astronomía', 'astronomy')">
            <div class="class-info">
                <div class="class-subject">🚀 Astronomía</div>
                <div class="class-teacher">Explora el universo y sus secretos</div>
                <div class="class-time">🌟 Planetas, estrellas, galaxias y más</div>
            </div>
            <button class="join-button" style="background: linear-gradient(135deg, #6366f1, #4f46e5);">¡Jugar!</button>
        </div>
        <div class="class-item game-item" style="cursor: pointer;" onclick="playGameTopic('Programación', 'programming')">
            <div class="class-info">
                <div class="class-subject">💻 Programación</div>
                <div class="class-teacher">Demuestra tus habilidades de código</div>
                <div class="class-time">🔧 Variables, funciones, algoritmos</div>
            </div>
            <button class="join-button" style="background: linear-gradient(135deg, #10b981, #059669);">¡Jugar!</button>
        </div>
        <div class="class-item game-item" style="cursor: pointer;" onclick="playGameTopic('Inglés', 'english')">
            <div class="class-info">
                <div class="class-subject">🌍 Inglés</div>
                <div class="class-teacher">Practica tu vocabulario y gramática</div>
                <div class="class-time">📚 Vocabulario, frases, traducción</div>
            </div>
            <button class="join-button" style="background: linear-gradient(135deg, #f59e0b, #d97706);">¡Jugar!</button>
        </div>
        <div class="class-item game-item" style="cursor: pointer;" onclick="playGameTopic('Corridos Tumbados', 'corridos')">
            <div class="class-info">
                <div class="class-subject">🎤 Corridos Tumbados</div>
                <div class="class-teacher">¿Cuánto sabes del género del momento?</div>
                <div class="class-time">🔥 Peso Pluma, Natanael, Junior H y más</div>
            </div>
            <button class="join-button" style="background: linear-gradient(135deg, #ec4899, #db2777);">¡Jugar!</button>
        </div>
        <div class="class-item game-item" style="cursor: pointer;" onclick="playGameTopic('Películas', 'movies')">
            <div class="class-info">
                <div class="class-subject">🎬 Películas</div>
                <div class="class-teacher">Demuestra tu conocimiento del cine</div>
                <div class="class-time">🎥 Marvel, DC, Netflix y más</div>
            </div>
            <button class="join-button" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">¡Jugar!</button>
        </div>
        <div class="class-item game-item" style="cursor: pointer;" onclick="playGameTopic('Cultura General', 'culture')">
            <div class="class-info">
                <div class="class-subject">🧠 Cultura General</div>
                <div class="class-teacher">Pon a prueba tus conocimientos</div>
                <div class="class-time">🌎 Historia, geografía, ciencia y más</div>
            </div>
            <button class="join-button" style="background: linear-gradient(135deg, #14b8a6, #0d9488);">¡Jugar!</button>
        </div>
    `;
}

// Function to play game with specific topic
function playGameTopic(topicName, topicId) {
    // Navigate to archer game with the selected topic
    window.location.href = `/archer-game?subject=${encodeURIComponent(topicName)}&difficulty=medium&topic=${topicId}&mode=free`;
}

// Update stats for authenticated users
function updatePersonalStats() {
    const userRole = getUserRole();
    
    if (userRole === USER_ROLES.TUTOR || userRole === USER_ROLES.ADMIN) {
        // Tutor stats
        document.getElementById('classesValue').textContent = '142';
        document.querySelector('#classesValue').nextElementSibling.textContent = 'Clases Impartidas';
        
        document.getElementById('studentsValue').textContent = '38';
        document.querySelector('#studentsValue').nextElementSibling.textContent = 'Estudiantes Activos';
        
        document.getElementById('tutorsValue').textContent = '287';
        document.querySelector('#tutorsValue').nextElementSibling.textContent = 'Horas de Enseñanza';
        
        document.getElementById('progressValue').textContent = '4.8⭐';
        document.querySelector('#progressValue').nextElementSibling.textContent = 'Calificación Promedio';
    } else {
        // Student stats
        document.getElementById('classesValue').textContent = '24';
        document.querySelector('#classesValue').nextElementSibling.textContent = 'Clases Completadas';
        
        document.getElementById('studentsValue').textContent = '156';
        document.querySelector('#studentsValue').nextElementSibling.textContent = 'Horas de Estudio';
        
        document.getElementById('tutorsValue').textContent = '8';
        document.querySelector('#tutorsValue').nextElementSibling.textContent = 'Tutores Activos';
        
        document.getElementById('progressValue').textContent = '87%';
        document.querySelector('#progressValue').nextElementSibling.textContent = 'Progreso Personal';
    }
}

// Update stats for general users
function updateGeneralStats() {
    document.getElementById('classesValue').textContent = '1,200+';
    document.querySelector('#classesValue').nextElementSibling.textContent = 'Clases Disponibles';
    
    document.getElementById('studentsValue').textContent = '15,000+';
    document.querySelector('#studentsValue').nextElementSibling.textContent = 'Estudiantes Activos';
    
    document.getElementById('tutorsValue').textContent = '250+';
    document.querySelector('#tutorsValue').nextElementSibling.textContent = 'Tutores Expertos';
    
    document.getElementById('progressValue').textContent = '95%';
    document.querySelector('#progressValue').nextElementSibling.textContent = 'Tasa de Éxito';
}

// Toggle User Menu Function
let isMenuToggling = false; // Prevent multiple rapid clicks

function toggleUserMenu(event) {
    // Prevent event bubbling
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Prevent multiple rapid clicks
    if (isMenuToggling) {
        return;
    }
    
    isMenuToggling = true;
    
    // Reset the flag after a short delay
    setTimeout(() => {
        isMenuToggling = false;
    }, 300);
    
    const isAuth = isUserAuthenticated();
    
    // Check if menu is already open
    const existingMenu = document.getElementById('userMenuDropdown');
    if (existingMenu) {
        existingMenu.style.opacity = '0';
        existingMenu.style.transform = 'translateY(-10px) scale(0.95)';
        setTimeout(() => {
            existingMenu.remove();
        }, 200);
        return;
    }
    
    let userMenuHTML;
    
    if (isAuth) {
        const userName = localStorage.getItem('userName') || 'Usuario';
        const currentUserRole = getUserRole();
        const permissions = getUserPermissions();
        
        // Base menu items for all authenticated users
        let menuItems = `
            <div style="padding: 12px; text-align: center; margin-bottom: 12px; color: #5eead4; font-size: 14px; font-weight: 500; background: rgba(255,255,255,0.05); border-radius: 8px;">
                ${userName} | ${currentUserRole === USER_ROLES.ADMIN ? '👑 Admin' : currentUserRole === USER_ROLES.TUTOR ? '🎓 Tutor' : '📚 Estudiante'}
            </div>
            <div onclick="viewProfile()" style="padding: 10px; cursor: pointer; border-radius: 8px; margin-bottom: 5px; transition: background 0.2s; color: #e0f7f7;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                👤 Mi Perfil
            </div>`;
        
        // Add separator for special panels
        menuItems += `<div style="border-top: 1px solid rgba(94, 234, 212, 0.3); margin: 10px 0;"></div>`;
        
        // Add role-specific menu items with enhanced visibility
        // ADMIN has access to ALL panels (student, tutor, and admin)
        
        // Show info message for admin
        if (currentUserRole === USER_ROLES.ADMIN) {
            menuItems += `
                <div style="padding: 10px; background: rgba(234, 179, 8, 0.15); border-radius: 8px; margin-bottom: 12px; border: 1px solid rgba(234, 179, 8, 0.3); text-align: center;">
                    <span style="color: #fbbf24; font-size: 13px; font-weight: 500;">👑 Modo Administrador</span>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 11px; margin-top: 4px;">Acceso completo a todos los perfiles</div>
                </div>`;
        }
        
        // Student Dashboard - ONLY show for admins (students use Mi Perfil)
        if (currentUserRole === USER_ROLES.ADMIN) {
            menuItems += `
                <div onclick="goToStudentDashboard()" style="padding: 14px 12px; cursor: pointer; border-radius: 10px; margin-bottom: 8px; transition: all 0.3s ease; background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.25)); border: 2px solid rgba(59, 130, 246, 0.5); color: #ffffff; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);" onmouseover="this.style.background='linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.4))'; this.style.borderColor='rgba(59, 130, 246, 0.8)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.5)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.25))'; this.style.borderColor='rgba(59, 130, 246, 0.5)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.3)'; this.style.transform='translateY(0)'">
                    📚 Panel de Estudiante
                </div>`;
        }
        
        // Tutor Dashboard - ONLY show for admins (tutors use Mi Perfil)
        if (currentUserRole === USER_ROLES.ADMIN) {
            menuItems += `
                <div onclick="goToTutorDashboard()" style="padding: 14px 12px; cursor: pointer; border-radius: 10px; margin-bottom: 8px; transition: all 0.3s ease; background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.25)); border: 2px solid rgba(245, 158, 11, 0.5); color: #ffffff; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);" onmouseover="this.style.background='linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.4))'; this.style.borderColor='rgba(245, 158, 11, 0.8)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.5)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.25))'; this.style.borderColor='rgba(245, 158, 11, 0.5)'; this.style.boxShadow='0 2px 8px rgba(245, 158, 11, 0.3)'; this.style.transform='translateY(0)'">
                    🎓 Panel de Tutor
                </div>`;
        }
        
        // Panel Admin button removed - admins use "Mi Perfil" to access their admin panel
        // Keeping student and tutor panels visible for admin access
        
        menuItems += `
            <div onclick="contactSupport()" style="padding: 10px; cursor: pointer; border-radius: 8px; margin-bottom: 5px; transition: background 0.2s; color: #e0f7f7;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                💭 Soporte
            </div>
            <hr style="border: none; height: 1px; background: rgba(255,255,255,0.2); margin: 10px 0;">
            <div onclick="logoutUser()" style="padding: 10px; cursor: pointer; border-radius: 8px; color: #ff6b6b; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,107,107,0.1)'" onmouseout="this.style.background='transparent'">
                🚪 Cerrar Sesión
            </div>`;
        
        // Menu for authenticated users - usando clases CSS para mejor control
        userMenuHTML = `
            <div id="userMenuDropdown">
                ${menuItems}
            </div>
        `;
    } else {
        // Menu for guest users - usando clases CSS para mejor control
        userMenuHTML = `
            <div id="userMenuDropdown">
                <div style="padding: 12px; text-align: center; margin-bottom: 12px; color: #5eead4; font-size: 15px; font-weight: 500; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    👋 Modo Invitado
                </div>
                <div onclick="promptLogin('profile')" style="padding: 12px; cursor: pointer; border-radius: 8px; margin-bottom: 6px; transition: all 0.2s; color: #e0f7f7;" onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.color='#ffffff';" onmouseout="this.style.background='transparent'; this.style.color='#e0f7f7';">
                    👤 Ver Mi Perfil
                </div>
                <hr style="border: none; height: 1px; background: rgba(255,255,255,0.2); margin: 15px 0;">
                <div onclick="goToLogin()" style="
                    padding: 15px 20px; 
                    cursor: pointer; 
                    border-radius: 12px; 
                    background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%); 
                    color: #0d7377; 
                    font-weight: 600;
                    font-size: 15px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(45, 212, 191, 0.4);
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                " onmouseover="
                    this.style.transform='translateY(-2px)'; 
                    this.style.boxShadow='0 8px 25px rgba(45, 212, 191, 0.5)';
                    this.style.background='linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)';
                " onmouseout="
                    this.style.transform='translateY(0)'; 
                    this.style.boxShadow='0 4px 15px rgba(45, 212, 191, 0.4)';
                    this.style.background='linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)';
                ">
                    <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span>Iniciar Sesión</span>
                    </span>
                </div>
            </div>
        `;
    }
    
    // Add menu to body
    document.body.insertAdjacentHTML('beforeend', userMenuHTML);
    
    // Get the menu element and add entrance animation
    const menu = document.getElementById('userMenuDropdown');
    if (menu) {
        // Initial state for animation
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(-10px) scale(0.95)';
        menu.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        // Trigger animation
        requestAnimationFrame(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'translateY(0) scale(1)';
        });
    }
    
    // Add immediate click listener for outside clicks
    const handleOutsideClick = (e) => {
        const currentMenu = document.getElementById('userMenuDropdown');
        const avatar = document.getElementById('userAvatar');
        
        // Check if click is outside menu and not on avatar
        if (currentMenu && !currentMenu.contains(e.target) && 
            !avatar.contains(e.target) && 
            !e.target.classList.contains('user-avatar')) {
            
            // Animate out
            currentMenu.style.opacity = '0';
            currentMenu.style.transform = 'translateY(-10px) scale(0.95)';
            setTimeout(() => {
                currentMenu.remove();
            }, 200);
            
            document.removeEventListener('click', handleOutsideClick);
        }
    };
    
    // Add listener after a small delay to avoid immediate closing
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 100);
}

// Function to prompt login for specific features
function promptLogin(feature) {
    document.getElementById('userMenuDropdown')?.remove();
    
    const featureNames = {
        'profile': 'ver tu perfil',
        'stats': 'acceder a tus estadísticas',
        'progress': 'ver tu progreso personal'
    };
    
    const featureName = featureNames[feature] || 'acceder a esta función';
    
    showLoginPrompt(`Para ${featureName}, necesitas iniciar sesión`, feature);
}

// Function to show login prompt
function showLoginPrompt(message, feature) {
    const promptHTML = `
        <div id="loginPrompt" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        ">
            <div style="
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 30px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                max-width: 400px;
                text-align: center;
                color: white;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
                <h3 style="margin-bottom: 15px; font-size: 20px;">Iniciar Sesión Requerido</h3>
                <p style="margin-bottom: 25px; color: #b3e5e6; line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="goToLogin()" style="
                        background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
                        color: #0d7377;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 10px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        Iniciar Sesión
                    </button>
                    <button onclick="closeLoginPrompt()" style="
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 12px 24px;
                        border-radius: 10px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', promptHTML);
}

// Close login prompt
function closeLoginPrompt() {
    document.getElementById('loginPrompt')?.remove();
}

// Go to login page
function goToLogin() {
    window.location.href = '/login';
}

// User menu functions for authenticated users
function viewProfile() {
    document.getElementById('userMenuDropdown')?.remove();
    
    // Redirigir al dashboard correspondiente según el rol del usuario
    const userRole = localStorage.getItem('userRole');
    
    if (userRole === USER_ROLES.STUDENT) {
        goToStudentDashboard();
    } else if (userRole === USER_ROLES.TUTOR) {
        goToTutorDashboard();
    } else if (userRole === USER_ROLES.ADMIN) {
        // Admin va directo al panel de admin
        openAdminPanel();
    } else {
        showNotification('error', 'No se pudo determinar tu rol de usuario');
    }
}

function viewSettings() {
    document.getElementById('userMenuDropdown')?.remove();
    showNotification('info', 'Configuración - Próximamente disponible');
}

function viewDetailedStats() {
    document.getElementById('userMenuDropdown')?.remove();
    if (isUserAuthenticated()) {
        showNotification('info', 'Tus estadísticas detalladas - Próximamente disponible');
    } else {
        promptLogin('stats');
    }
}

function contactSupport() {
    document.getElementById('userMenuDropdown')?.remove();
    showNotification('info', 'Soporte técnico - Próximamente disponible');
}

function logoutUser() {
    document.getElementById('userMenuDropdown')?.remove();
    showNotification('warning', 'Cerrando sesión...');
    
    // Clear user data
    localStorage.removeItem('userAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('rememberUser');
    
    setTimeout(() => {
        // Reload the page to show guest mode
        window.location.reload();
    }, 1500);
}

// Role Management Functions
function goToTutorDashboard() {
    document.getElementById('userMenuDropdown')?.remove();
    
    // Admin can access ALL panels, tutors can access their panel
    if (isAdmin() || hasPermission('canCreateCourses')) {
        window.location.href = '/tutor-dashboard';
    } else {
        showNotification('error', 'No tienes permisos de tutor');
    }
}

function goToStudentDashboard() {
    document.getElementById('userMenuDropdown')?.remove();
    // Admin can access ALL panels, students can access their panel
    // No need for permission check here as everyone can view student dashboard
    window.location.href = '/student-dashboard';
}

function createCourse() {
    document.getElementById('userMenuDropdown')?.remove();
    
    if (hasPermission('canCreateCourses')) {
        showNotification('info', 'Crear curso - Próximamente disponible');
    } else {
        showNotification('error', 'No tienes permisos para crear cursos');
    }
}

function viewSystemStats() {
    document.getElementById('userMenuDropdown')?.remove();
    
    if (hasPermission('canViewAllStats')) {
        showGameScoresPanel();
    } else {
        showNotification('error', 'No tienes permisos para ver estadísticas del sistema');
    }
}

// Show Game Scores Panel for Admin
async function showGameScoresPanel() {
    // Block body scroll
    document.body.style.overflow = 'hidden';
    
    const panelHTML = `
        <div id="gameScoresModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(15px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease-out;
        ">
            <div style="
                background: linear-gradient(135deg, rgba(20, 25, 33, 0.98), rgba(13, 115, 119, 0.95));
                backdrop-filter: blur(40px);
                border-radius: 24px;
                padding: 0;
                border: 1px solid rgba(45, 212, 191, 0.3);
                max-width: 1000px;
                width: 95%;
                max-height: 90vh;
                overflow-y: auto;
                color: white;
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, rgba(45, 212, 191, 0.15), rgba(20, 184, 166, 0.1));
                    border-bottom: 1px solid rgba(45, 212, 191, 0.2);
                    padding: 24px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <h2 style="margin: 0 0 4px 0; font-size: 24px; font-weight: 700;">🎮 Puntuaciones del Juego</h2>
                        <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.7);">Estadísticas de todos los jugadores</p>
                    </div>
                    <button onclick="closeGameScoresPanel()" style="
                        background: rgba(255,255,255,0.1);
                        border: none;
                        color: white;
                        width: 40px;
                        height: 40px;
                        border-radius: 12px;
                        cursor: pointer;
                        font-size: 20px;
                    ">✕</button>
                </div>
                
                <!-- Stats Summary -->
                <div id="gameStatsSection" style="padding: 24px 32px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px;">
                        <div style="background: rgba(45, 212, 191, 0.1); border-radius: 16px; padding: 16px; text-align: center; border: 1px solid rgba(45, 212, 191, 0.2);">
                            <div id="statTotalPlays" style="font-size: 28px; font-weight: 700; color: #2dd4bf;">-</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.7);">Partidas Totales</div>
                        </div>
                        <div style="background: rgba(251, 191, 36, 0.1); border-radius: 16px; padding: 16px; text-align: center; border: 1px solid rgba(251, 191, 36, 0.2);">
                            <div id="statGuestPlays" style="font-size: 28px; font-weight: 700; color: #fbbf24;">-</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.7);">Invitados</div>
                        </div>
                        <div style="background: rgba(99, 102, 241, 0.1); border-radius: 16px; padding: 16px; text-align: center; border: 1px solid rgba(99, 102, 241, 0.2);">
                            <div id="statUserPlays" style="font-size: 28px; font-weight: 700; color: #6366f1;">-</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.7);">Usuarios</div>
                        </div>
                        <div style="background: rgba(236, 72, 153, 0.1); border-radius: 16px; padding: 16px; text-align: center; border: 1px solid rgba(236, 72, 153, 0.2);">
                            <div id="statTopScore" style="font-size: 28px; font-weight: 700; color: #ec4899;">-</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.7);">Mejor Puntaje</div>
                        </div>
                    </div>
                    
                    <!-- Filter -->
                    <div style="margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
                        <select id="filterSubject" onchange="filterGameScores()" style="
                            background: rgba(255,255,255,0.1);
                            border: 1px solid rgba(45, 212, 191, 0.3);
                            border-radius: 8px;
                            color: white;
                            padding: 8px 16px;
                            font-size: 14px;
                        ">
                            <option value="">Todos los temas</option>
                            <option value="Astronomía">🚀 Astronomía</option>
                            <option value="Programación">💻 Programación</option>
                            <option value="Inglés">🌍 Inglés</option>
                            <option value="Corridos Tumbados">🎤 Corridos Tumbados</option>
                            <option value="Películas">🎬 Películas</option>
                            <option value="Cultura General">🧠 Cultura General</option>
                            <option value="Matemáticas">📐 Matemáticas</option>
                            <option value="Ciencias">🔬 Ciencias</option>
                            <option value="Historia">📜 Historia</option>
                        </select>
                        <select id="filterGuest" onchange="filterGameScores()" style="
                            background: rgba(255,255,255,0.1);
                            border: 1px solid rgba(45, 212, 191, 0.3);
                            border-radius: 8px;
                            color: white;
                            padding: 8px 16px;
                            font-size: 14px;
                        ">
                            <option value="">Todos</option>
                            <option value="true">Solo Invitados</option>
                            <option value="false">Solo Usuarios</option>
                        </select>
                        <div style="flex: 1;"></div>
                        <button onclick="clearAllGameScores()" style="
                            background: rgba(239, 68, 68, 0.2);
                            border: 1px solid rgba(239, 68, 68, 0.4);
                            color: #ef4444;
                            padding: 8px 16px;
                            border-radius: 8px;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        ">🗑️ Vaciar Tabla</button>
                    </div>
                    
                    <!-- Scores Table -->
                    <div style="background: rgba(0,0,0,0.2); border-radius: 16px; overflow: hidden;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: rgba(45, 212, 191, 0.1);">
                                    <th style="padding: 16px; text-align: left; font-weight: 600; font-size: 13px; color: #2dd4bf;">#</th>
                                    <th style="padding: 16px; text-align: left; font-weight: 600; font-size: 13px; color: #2dd4bf;">Jugador</th>
                                    <th style="padding: 16px; text-align: left; font-weight: 600; font-size: 13px; color: #2dd4bf;">Tema</th>
                                    <th style="padding: 16px; text-align: center; font-weight: 600; font-size: 13px; color: #2dd4bf;">Puntaje</th>
                                    <th style="padding: 16px; text-align: center; font-weight: 600; font-size: 13px; color: #2dd4bf;">Correctas</th>
                                    <th style="padding: 16px; text-align: center; font-weight: 600; font-size: 13px; color: #2dd4bf;">Tipo</th>
                                    <th style="padding: 16px; text-align: left; font-weight: 600; font-size: 13px; color: #2dd4bf;">Fecha</th>
                                    <th style="padding: 16px; text-align: center; font-weight: 600; font-size: 13px; color: #2dd4bf;">Acción</th>
                                </tr>
                            </thead>
                            <tbody id="gameScoresTableBody">
                                <tr>
                                    <td colspan="8" style="padding: 40px; text-align: center; color: rgba(255,255,255,0.5);">
                                        Cargando puntuaciones...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', panelHTML);
    
    // Load scores
    await loadGameScores();
}

function closeGameScoresPanel() {
    const modal = document.getElementById('gameScoresModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

let allGameScores = [];

async function loadGameScores() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/stats/game-scores/admin', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allGameScores = data.data.scores;
            
            // Update stats
            document.getElementById('statTotalPlays').textContent = data.data.statistics.totalPlays;
            document.getElementById('statGuestPlays').textContent = data.data.statistics.guestPlays;
            document.getElementById('statUserPlays').textContent = data.data.statistics.userPlays;
            document.getElementById('statTopScore').textContent = data.data.statistics.topScore;
            
            // Render table
            renderGameScoresTable(allGameScores);
        } else {
            showNotification('error', 'Error al cargar puntuaciones');
        }
    } catch (error) {
        console.error('Error loading game scores:', error);
        document.getElementById('gameScoresTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="padding: 40px; text-align: center; color: rgba(255,255,255,0.5);">
                    Error al cargar puntuaciones. Intenta de nuevo.
                </td>
            </tr>
        `;
    }
}

function filterGameScores() {
    const subjectFilter = document.getElementById('filterSubject').value;
    const guestFilter = document.getElementById('filterGuest').value;
    
    let filtered = [...allGameScores];
    
    if (subjectFilter) {
        filtered = filtered.filter(s => s.subject === subjectFilter);
    }
    
    if (guestFilter !== '') {
        const isGuest = guestFilter === 'true';
        filtered = filtered.filter(s => s.isGuest === isGuest);
    }
    
    renderGameScoresTable(filtered);
}

// Delete a single game score
async function deleteGameScore(scoreId) {
    if (!confirm('¿Estás seguro de eliminar esta puntuación?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/stats/game-scores/${scoreId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('success', 'Puntuación eliminada');
            // Remove from local array and re-render
            allGameScores = allGameScores.filter(s => s.id !== scoreId);
            filterGameScores();
            // Update stats
            document.getElementById('statTotalPlays').textContent = allGameScores.length;
            document.getElementById('statGuestPlays').textContent = allGameScores.filter(s => s.isGuest).length;
            document.getElementById('statUserPlays').textContent = allGameScores.filter(s => !s.isGuest).length;
            document.getElementById('statTopScore').textContent = allGameScores.length > 0 ? Math.max(...allGameScores.map(s => s.score)) : 0;
        } else {
            showNotification('error', 'Error al eliminar: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting score:', error);
        showNotification('error', 'Error al eliminar la puntuación');
    }
}

// Clear all game scores
async function clearAllGameScores() {
    if (!confirm('⚠️ ¿Estás seguro de VACIAR TODA la tabla de puntuaciones?\n\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    if (!confirm('🚨 CONFIRMACIÓN FINAL: ¿Realmente deseas eliminar TODAS las puntuaciones?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/stats/game-scores/clear-all', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('success', `Se eliminaron ${data.data.deleted} puntuaciones`);
            allGameScores = [];
            renderGameScoresTable([]);
            // Reset stats
            document.getElementById('statTotalPlays').textContent = '0';
            document.getElementById('statGuestPlays').textContent = '0';
            document.getElementById('statUserPlays').textContent = '0';
            document.getElementById('statTopScore').textContent = '0';
        } else {
            showNotification('error', 'Error al vaciar tabla: ' + data.error);
        }
    } catch (error) {
        console.error('Error clearing scores:', error);
        showNotification('error', 'Error al vaciar la tabla');
    }
}

function renderGameScoresTable(scores) {
    const tbody = document.getElementById('gameScoresTableBody');
    
    if (scores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="padding: 40px; text-align: center; color: rgba(255,255,255,0.5);">
                    No hay puntuaciones que mostrar
                </td>
            </tr>
        `;
        return;
    }
    
    const subjectEmojis = {
        'Astronomía': '🚀',
        'Programación': '💻',
        'Inglés': '🌍',
        'Corridos Tumbados': '🎤',
        'Películas': '🎬',
        'Cultura General': '🧠',
        'Matemáticas': '📐',
        'Ciencias': '🔬',
        'Historia': '📜',
        'Geografía': '🌎',
        'Biología': '🧬',
        'Química': '⚗️',
        'Música': '🎵',
        'Francés': '🇫🇷'
    };
    
    tbody.innerHTML = scores.map((s, index) => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); ${index % 2 === 0 ? 'background: rgba(255,255,255,0.02);' : ''}" data-score-id="${s.id}">
            <td style="padding: 14px 16px; font-weight: 600; color: ${index < 3 ? '#fbbf24' : 'rgba(255,255,255,0.7)'};">
                ${index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
            </td>
            <td style="padding: 14px 16px;">
                <div style="font-weight: 500;">${s.playerName}</div>
            </td>
            <td style="padding: 14px 16px; color: rgba(255,255,255,0.8);">
                ${subjectEmojis[s.subject] || '📚'} ${s.subject}
            </td>
            <td style="padding: 14px 16px; text-align: center; font-weight: 700; color: #2dd4bf;">
                ${s.score}
            </td>
            <td style="padding: 14px 16px; text-align: center; color: rgba(255,255,255,0.7);">
                ${s.correctAnswers}/${s.totalQuestions}
            </td>
            <td style="padding: 14px 16px; text-align: center;">
                <span style="
                    background: ${s.isGuest ? 'rgba(251, 191, 36, 0.2)' : 'rgba(99, 102, 241, 0.2)'};
                    color: ${s.isGuest ? '#fbbf24' : '#6366f1'};
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                ">${s.isGuest ? '👤 Invitado' : '✓ Usuario'}</span>
            </td>
            <td style="padding: 14px 16px; color: rgba(255,255,255,0.5); font-size: 12px;">
                ${new Date(s.createdAt || s.date).toLocaleString('es-MX', { 
                    day: '2-digit', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}
            </td>
            <td style="padding: 14px 16px; text-align: center;">
                <button onclick="deleteGameScore('${s.id}')" style="
                    background: rgba(239, 68, 68, 0.15);
                    border: none;
                    color: #ef4444;
                    padding: 6px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                " title="Eliminar">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Admin Panel Functions
function openAdminPanel() {
    document.getElementById('userMenuDropdown')?.remove();
    
    if (!hasPermission('canManageUsers')) {
        showNotification('error', 'No tienes permisos de administrador');
        return;
    }
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    // Create admin panel modal
    const adminPanelHTML = `
        <div id="adminPanelModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease-out;
        ">
            <div style="
                background: linear-gradient(135deg, rgba(20, 25, 33, 0.98), rgba(13, 115, 119, 0.95));
                backdrop-filter: blur(40px);
                -webkit-backdrop-filter: blur(40px);
                border-radius: 24px;
                padding: 0;
                border: 1px solid rgba(45, 212, 191, 0.3);
                max-width: 900px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                scroll-behavior: smooth;
                color: white;
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(45, 212, 191, 0.2);
                animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, rgba(45, 212, 191, 0.15), rgba(20, 184, 166, 0.1));
                    border-bottom: 1px solid rgba(45, 212, 191, 0.2);
                    padding: 24px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <h2 style="
                            margin: 0 0 4px 0;
                            font-size: 24px;
                            font-weight: 700;
                            color: #ffffff;
                        ">Panel de Administración</h2>
                        <p style="
                            margin: 0;
                            font-size: 13px;
                            color: rgba(255, 255, 255, 0.6);
                        ">Gestión y control del sistema</p>
                    </div>
                    
                    <button onclick="closeAdminPanel()" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 12px;
                        width: 40px;
                        height: 40px;
                        color: white;
                        cursor: pointer;
                        font-size: 20px;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    " onmouseover="
                        this.style.background='rgba(255, 255, 255, 0.15)';
                        this.style.transform='rotate(90deg)';
                    " onmouseout="
                        this.style.background='rgba(255, 255, 255, 0.1)';
                        this.style.transform='rotate(0deg)';
                    ">×</button>
                </div>
                
                <!-- Action Buttons -->
                <div style="
                    padding: 24px 32px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 16px;
                ">
                    <button onclick="showUserManagement()" style="
                        background: linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(20, 184, 166, 0.15));
                        color: #ffffff;
                        border: 1px solid rgba(45, 212, 191, 0.4);
                        padding: 18px 20px;
                        border-radius: 16px;
                        font-weight: 600;
                        font-size: 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 12px rgba(45, 212, 191, 0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    " onmouseover="
                        this.style.background='linear-gradient(135deg, rgba(45, 212, 191, 0.3), rgba(20, 184, 166, 0.25))';
                        this.style.transform='translateY(-2px)';
                        this.style.boxShadow='0 8px 20px rgba(45, 212, 191, 0.35)';
                    " onmouseout="
                        this.style.background='linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(20, 184, 166, 0.15))';
                        this.style.transform='translateY(0)';
                        this.style.boxShadow='0 4px 12px rgba(45, 212, 191, 0.2)';
                    ">
                        <span>Gestionar Usuarios</span>
                    </button>
                    
                    <button onclick="viewSystemStats()" style="
                        background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(109, 40, 217, 0.15));
                        color: #ffffff;
                        border: 1px solid rgba(139, 92, 246, 0.4);
                        padding: 18px 20px;
                        border-radius: 16px;
                        font-weight: 600;
                        font-size: 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    " onmouseover="
                        this.style.background='linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(109, 40, 217, 0.25))';
                        this.style.transform='translateY(-2px)';
                        this.style.boxShadow='0 8px 20px rgba(139, 92, 246, 0.35)';
                    " onmouseout="
                        this.style.background='linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(109, 40, 217, 0.15))';
                        this.style.transform='translateY(0)';
                        this.style.boxShadow='0 4px 12px rgba(139, 92, 246, 0.2)';
                    ">
                        <span>Estadísticas del Sistema</span>
                    </button>
                </div>
                
                <!-- Content Area -->
                <div style="padding: 0 32px 32px 32px;">
                    <div id="adminPanelContent" style="
                        background: rgba(255, 255, 255, 0.05);
                        backdrop-filter: blur(10px);
                        border-radius: 16px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        padding: 32px;
                        min-height: 300px;
                    ">
                        <div style="text-align: center; padding: 30px 20px;">
                            <h3 style="
                                margin: 0 0 12px 0;
                                font-size: 22px;
                                font-weight: 600;
                                color: #ffffff;
                            ">Centro de Control</h3>
                            
                            <p style="
                                margin: 0 0 24px 0;
                                font-size: 14px;
                                color: rgba(255, 255, 255, 0.6);
                            ">Selecciona una opción para administrar el sistema</p>
                        
                            <!-- Quick Stats -->
                            <div style="
                                display: grid;
                                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                                gap: 12px;
                                margin-top: 20px;
                            ">
                                <div style="
                                    background: rgba(45, 212, 191, 0.1);
                                    border-radius: 12px;
                                    padding: 16px;
                                    border: 1px solid rgba(45, 212, 191, 0.2);
                                ">
                                    <div style="
                                        font-size: 13px;
                                        font-weight: 500;
                                        color: rgba(255, 255, 255, 0.8);
                                        margin-bottom: 4px;
                                    ">Gestión de Usuarios</div>
                                    <div style="
                                        font-size: 11px;
                                        color: rgba(255, 255, 255, 0.5);
                                    ">Crear, editar, eliminar</div>
                                </div>
                                
                                <div style="
                                    background: rgba(139, 92, 246, 0.1);
                                    border-radius: 12px;
                                    padding: 16px;
                                    border: 1px solid rgba(139, 92, 246, 0.2);
                                ">
                                    <div style="
                                        font-size: 13px;
                                        font-weight: 500;
                                        color: rgba(255, 255, 255, 0.8);
                                        margin-bottom: 4px;
                                    ">Estadísticas</div>
                                    <div style="
                                        font-size: 11px;
                                        color: rgba(255, 255, 255, 0.5);
                                    ">Métricas del sistema</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            /* Custom scrollbar for admin panel */
            #adminPanelModal ::-webkit-scrollbar {
                width: 10px;
            }
            
            #adminPanelModal ::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
            }
            
            #adminPanelModal ::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, rgba(45, 212, 191, 0.5), rgba(20, 184, 166, 0.4));
                border-radius: 10px;
                border: 2px solid rgba(255, 255, 255, 0.1);
            }
            
            #adminPanelModal ::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, rgba(45, 212, 191, 0.7), rgba(20, 184, 166, 0.6));
            }
            
            /* Firefox scrollbar */
            #adminPanelModal * {
                scrollbar-width: thin;
                scrollbar-color: rgba(45, 212, 191, 0.5) rgba(255, 255, 255, 0.05);
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', adminPanelHTML);
}

function closeAdminPanel() {
    const modal = document.getElementById('adminPanelModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease-out';
        
        setTimeout(() => {
            modal.remove();
            // Restaurar scroll del body
            document.body.style.overflow = '';
        }, 300);
    }
}

async function showUserManagement() {
    const content = document.getElementById('adminPanelContent');
    if (!content) return;
    
    // Show loading state with liquid glass design
    content.innerHTML = `
        <!-- Top highlight -->
        <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        "></div>
        
        <div style="padding: 20px;">
            <div style="
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 32px;
            ">
                <div style="
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, rgba(45, 212, 191, 0.3), rgba(20, 184, 166, 0.2));
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    border: 1px solid rgba(45, 212, 191, 0.4);
                    box-shadow: 0 4px 16px rgba(45, 212, 191, 0.25);
                ">👥</div>
                <h3 style="
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #ffffff 0%, #5eead4 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                ">Gestión de Usuarios</h3>
            </div>
            
            <div style="text-align: center; padding: 60px 20px;">
                <div style="
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 24px;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(109, 40, 217, 0.15));
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    animation: float 2s ease-in-out infinite;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
                ">⏳</div>
                <p style="
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.85);
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                ">Cargando usuarios desde Firebase...</p>
            </div>
        </div>
    `;
    
    try {
        console.log('📊 Loading users from backend API...');
        
        // ✅ Use apiService for automatic token renewal
        const result = await window.apiService.makeRequest('/users/list', {
            method: 'GET'
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load users from backend');
        }
        
        const rawUsers = result.data.users || [];
        
        // Map backend format to frontend format
        const users = rawUsers.map(user => ({
            id: user.uid,
            name: user.name || 'Sin nombre',
            email: user.email || 'Sin email',
            role: user.role || USER_ROLES.STUDENT,
            status: user.status || 'active',
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        }));
        
        console.log(`✅ ${users.length} usuarios cargados exitosamente desde backend`);
        
        const roleEmojis = {
            [USER_ROLES.ADMIN]: '👑',
            [USER_ROLES.TUTOR]: '🎓',
            [USER_ROLES.STUDENT]: '📚'
        };
        
        const roleColors = {
            [USER_ROLES.ADMIN]: '#ffd700',
            [USER_ROLES.TUTOR]: '#5eead4',
            [USER_ROLES.STUDENT]: '#a7f3d0'
        };
        
        const roleNames = {
            [USER_ROLES.ADMIN]: 'Administrador',
            [USER_ROLES.TUTOR]: 'Tutor',
            [USER_ROLES.STUDENT]: 'Estudiante'
        };
        
        if (users.length === 0) {
            content.innerHTML = `
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                "></div>
                
                <div style="padding: 20px;">
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        margin-bottom: 32px;
                    ">
                        <div style="
                            width: 48px;
                            height: 48px;
                            background: linear-gradient(135deg, rgba(45, 212, 191, 0.3), rgba(20, 184, 166, 0.2));
                            border-radius: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            border: 1px solid rgba(45, 212, 191, 0.4);
                            box-shadow: 0 4px 16px rgba(45, 212, 191, 0.25);
                        ">👥</div>
                        <h3 style="
                            margin: 0;
                            font-size: 24px;
                            font-weight: 700;
                            background: linear-gradient(135deg, #ffffff 0%, #5eead4 100%);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                        ">Gestión de Usuarios</h3>
                    </div>
                    
                    <div style="text-align: center; padding: 60px 20px;">
                        <div style="
                            width: 100px;
                            height: 100px;
                            margin: 0 auto 24px;
                            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
                            border-radius: 28px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 52px;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                        ">👤</div>
                        <h4 style="
                            font-size: 20px;
                            color: rgba(255, 255, 255, 0.9);
                            margin: 0 0 12px 0;
                            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                        ">No hay usuarios registrados</h4>
                        <p style="
                            font-size: 15px;
                            color: rgba(255, 255, 255, 0.7);
                            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                        ">Los usuarios aparecerán aquí cuando se registren en la plataforma.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        content.innerHTML = `
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            "></div>
            
            <div style="padding: 20px;">
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                ">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="
                            width: 48px;
                            height: 48px;
                            background: linear-gradient(135deg, rgba(45, 212, 191, 0.3), rgba(20, 184, 166, 0.2));
                            border-radius: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            border: 1px solid rgba(45, 212, 191, 0.4);
                            box-shadow: 0 4px 16px rgba(45, 212, 191, 0.25);
                        ">👥</div>
                        <div>
                            <h3 style="
                                margin: 0 0 4px 0;
                                font-size: 24px;
                                font-weight: 700;
                                background: linear-gradient(135deg, #ffffff 0%, #5eead4 100%);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                background-clip: text;
                                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                            ">Gestión de Usuarios</h3>
                            <span style="
                                font-size: 13px;
                                color: rgba(94, 234, 212, 0.85);
                                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                            ">${users.length} ${users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}</span>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button onclick="showCreateUserModal()" style="
                            padding: 12px 20px;
                            background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.15));
                            backdrop-filter: blur(10px);
                            -webkit-backdrop-filter: blur(10px);
                            color: #4ade80;
                            border: 1px solid rgba(34, 197, 94, 0.4);
                            border-radius: 14px;
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 600;
                            box-shadow: 0 4px 16px rgba(34, 197, 94, 0.2);
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        " onmouseover="this.style.background='linear-gradient(135deg, rgba(34, 197, 94, 0.35), rgba(34, 197, 94, 0.25))'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(34, 197, 94, 0.35)';" onmouseout="this.style.background='linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.15))'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(34, 197, 94, 0.2)';">➕ Crear Usuario</button>
                        
                        <button onclick="refreshUserList()" style="
                            padding: 12px 20px;
                            background: linear-gradient(135deg, rgba(45, 212, 191, 0.25), rgba(45, 212, 191, 0.15));
                            backdrop-filter: blur(10px);
                            -webkit-backdrop-filter: blur(10px);
                            color: #5eead4;
                            border: 1px solid rgba(45, 212, 191, 0.4);
                            border-radius: 14px;
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 600;
                            box-shadow: 0 4px 16px rgba(45, 212, 191, 0.2);
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        " onmouseover="this.style.background='linear-gradient(135deg, rgba(45, 212, 191, 0.35), rgba(45, 212, 191, 0.25))'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(45, 212, 191, 0.35)';" onmouseout="this.style.background='linear-gradient(135deg, rgba(45, 212, 191, 0.25), rgba(45, 212, 191, 0.15))'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(45, 212, 191, 0.2)';">🔄 Actualizar</button>
                    </div>
                </div>
                
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                    margin-bottom: 28px;
                    padding: 18px;
                    background: linear-gradient(135deg, rgba(45, 212, 191, 0.08), rgba(45, 212, 191, 0.04));
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border-radius: 18px;
                    border: 1px solid rgba(45, 212, 191, 0.25);
                    box-shadow: 0 4px 20px rgba(45, 212, 191, 0.15);
                ">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #ffffff; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">${users.length}</div>
                        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 0.5px;">Total</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #fbbf24; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">${users.filter(u => u.role === USER_ROLES.ADMIN).length}</div>
                        <div style="font-size: 12px; color: rgba(251, 191, 36, 0.8); text-transform: uppercase; letter-spacing: 0.5px;">Admins</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #5eead4; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">${users.filter(u => u.role === USER_ROLES.TUTOR).length}</div>
                        <div style="font-size: 12px; color: rgba(94, 234, 212, 0.8); text-transform: uppercase; letter-spacing: 0.5px;">Tutores</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #a78bfa; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">${users.filter(u => u.role === USER_ROLES.STUDENT).length}</div>
                        <div style="font-size: 12px; color: rgba(167, 139, 250, 0.8); text-transform: uppercase; letter-spacing: 0.5px;">Estudiantes</div>
                    </div>
                </div>
            
            <div class="user-list-container" style="display: grid; gap: 16px;">
                ${users.map(user => {
                    const statusActive = user.status === 'activo' || user.status === 'active';
                    const createdDate = user.createdAt && user.createdAt.toDate ? 
                        user.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A';
                    const lastLoginDate = user.lastLogin && user.lastLogin.toDate ? 
                        user.lastLogin.toDate().toLocaleDateString('es-ES') : 'Nunca';
                    
                    // Colores por rol con valores RGB para usar en gradientes
                    const roleColorData = {
                        'administrador': { base: '#fbbf24', rgb: '251, 191, 36', light: '#fef3c7', emoji: '👑' },
                        'tutor': { base: '#5eead4', rgb: '94, 234, 212', light: '#ccfbf1', emoji: '👨‍🏫' },
                        'alumno': { base: '#a78bfa', rgb: '167, 139, 250', light: '#ede9fe', emoji: '👨‍🎓' }
                    };
                    
                    const roleColor = roleColorData[user.role] || roleColorData['alumno'];
                    const roleDisplayName = user.role === 'administrador' ? 'Administrador' : 
                                          user.role === 'tutor' ? 'Tutor' : 'Estudiante';
                    
                    return `
                        <div style="
                            background: linear-gradient(135deg, rgba(${roleColor.rgb}, 0.12) 0%, rgba(${roleColor.rgb}, 0.06) 100%);
                            backdrop-filter: blur(20px) saturate(180%);
                            -webkit-backdrop-filter: blur(20px) saturate(180%);
                            border: 1px solid rgba(${roleColor.rgb}, 0.3);
                            border-radius: 20px;
                            padding: 20px;
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15),
                                       0 0 0 1px rgba(255, 255, 255, 0.05) inset,
                                       0 0 20px rgba(${roleColor.rgb}, 0.15);
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 48px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 30px rgba(${roleColor.rgb}, 0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 0 20px rgba(${roleColor.rgb}, 0.15)';">
                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
                                <div style="display: flex; align-items: center; gap: 16px; flex: 1;">
                                    <div style="
                                        width: 68px;
                                        height: 68px;
                                        border-radius: 50%;
                                        background: linear-gradient(135deg, rgba(${roleColor.rgb}, 0.3), rgba(${roleColor.rgb}, 0.15));
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 32px;
                                        border: 2px solid rgba(${roleColor.rgb}, 0.4);
                                        box-shadow: 0 6px 24px rgba(${roleColor.rgb}, 0.35),
                                                   0 0 0 3px rgba(${roleColor.rgb}, 0.1);
                                        flex-shrink: 0;
                                    ">${roleColor.emoji}</div>
                                    
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap;">
                                            <strong style="
                                                font-size: 17px;
                                                color: rgba(255, 255, 255, 0.95);
                                                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                                            ">${user.name}</strong>
                                            <span style="
                                                padding: 4px 10px;
                                                border-radius: 10px;
                                                font-size: 11px;
                                                font-weight: 600;
                                                background: ${statusActive ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.15))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.15))'};
                                                color: ${statusActive ? '#22c55e' : '#ef4444'};
                                                border: 1px solid ${statusActive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'};
                                                box-shadow: 0 2px 8px ${statusActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
                                            ">${statusActive ? '✓ Activo' : '✗ Inactivo'}</span>
                                        </div>
                                        <div style="
                                            color: rgba(255, 255, 255, 0.75);
                                            font-size: 14px;
                                            margin-bottom: 8px;
                                            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                                        ">${user.email}</div>
                                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                                            <span style="
                                                display: inline-flex;
                                                align-items: center;
                                                gap: 6px;
                                                padding: 6px 14px;
                                                background: linear-gradient(135deg, rgba(${roleColor.rgb}, 0.25), rgba(${roleColor.rgb}, 0.15));
                                                color: ${roleColor.base};
                                                border: 1px solid rgba(${roleColor.rgb}, 0.4);
                                                border-radius: 12px;
                                                font-size: 12px;
                                                font-weight: 700;
                                                text-transform: uppercase;
                                                letter-spacing: 0.5px;
                                                box-shadow: 0 2px 8px rgba(${roleColor.rgb}, 0.2);
                                            ">${roleDisplayName}</span>
                                            <span style="
                                                font-size: 11px;
                                                color: rgba(255, 255, 255, 0.6);
                                                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                                            ">📅 ${createdDate}</span>
                                            <span style="
                                                font-size: 11px;
                                                color: rgba(255, 255, 255, 0.5);
                                                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                                            ">🔐 ${lastLoginDate}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 10px; flex-shrink: 0;">
                                    <button onclick="changeUserRole('${user.id}', '${user.email}', '${user.role}')" style="
                                        padding: 10px 20px;
                                        background: linear-gradient(135deg, rgba(45, 212, 191, 0.25), rgba(45, 212, 191, 0.15));
                                        backdrop-filter: blur(10px);
                                        -webkit-backdrop-filter: blur(10px);
                                        color: #5eead4;
                                        border: 1px solid rgba(45, 212, 191, 0.4);
                                        border-radius: 12px;
                                        cursor: pointer;
                                        font-size: 13px;
                                        font-weight: 600;
                                        box-shadow: 0 4px 16px rgba(45, 212, 191, 0.2);
                                        transition: all 0.2s ease;
                                        white-space: nowrap;
                                    " onmouseover="this.style.background='linear-gradient(135deg, rgba(45, 212, 191, 0.35), rgba(45, 212, 191, 0.25))'; this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(45, 212, 191, 0.35)';" onmouseout="this.style.background='linear-gradient(135deg, rgba(45, 212, 191, 0.25), rgba(45, 212, 191, 0.15))'; this.style.transform='scale(1)'; this.style.boxShadow='0 4px 16px rgba(45, 212, 191, 0.2)';">Cambiar Rol</button>
                                    
                                    <button onclick="toggleUserStatus('${user.id}', '${user.status}')" style="
                                        padding: 10px 20px;
                                        background: linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(251, 191, 36, 0.15));
                                        backdrop-filter: blur(10px);
                                        -webkit-backdrop-filter: blur(10px);
                                        color: #fbbf24;
                                        border: 1px solid rgba(251, 191, 36, 0.4);
                                        border-radius: 12px;
                                        cursor: pointer;
                                        font-size: 13px;
                                        font-weight: 600;
                                        box-shadow: 0 4px 16px rgba(251, 191, 36, 0.2);
                                        transition: all 0.2s ease;
                                        white-space: nowrap;
                                    " onmouseover="this.style.background='linear-gradient(135deg, rgba(251, 191, 36, 0.35), rgba(251, 191, 36, 0.25))'; this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(251, 191, 36, 0.35)';" onmouseout="this.style.background='linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(251, 191, 36, 0.15))'; this.style.transform='scale(1)'; this.style.boxShadow='0 4px 16px rgba(251, 191, 36, 0.2)';">${statusActive ? 'Desactivar' : 'Activar'}</button>
                                    
                                    <button onclick="deleteUser('${user.id}', '${user.email}')" style="
                                        padding: 10px 20px;
                                        background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.15));
                                        backdrop-filter: blur(10px);
                                        -webkit-backdrop-filter: blur(10px);
                                        color: #ef4444;
                                        border: 1px solid rgba(239, 68, 68, 0.4);
                                        border-radius: 12px;
                                        cursor: pointer;
                                        font-size: 13px;
                                        font-weight: 600;
                                        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
                                        transition: all 0.2s ease;
                                        white-space: nowrap;
                                    " onmouseover="this.style.background='linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(239, 68, 68, 0.25))'; this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(239, 68, 68, 0.35)';" onmouseout="this.style.background='linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.15))'; this.style.transform='scale(1)'; this.style.boxShadow='0 4px 16px rgba(239, 68, 68, 0.2)';">Eliminar</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="
                margin-top: 24px;
                padding: 20px;
                background: linear-gradient(135deg, rgba(45, 212, 191, 0.15), rgba(45, 212, 191, 0.08));
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border-radius: 18px;
                border: 1px solid rgba(45, 212, 191, 0.3);
                box-shadow: 0 4px 20px rgba(45, 212, 191, 0.15);
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <div style="
                        width: 36px;
                        height: 36px;
                        background: linear-gradient(135deg, rgba(45, 212, 191, 0.3), rgba(45, 212, 191, 0.2));
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        border: 1px solid rgba(45, 212, 191, 0.4);
                    ">✅</div>
                    <strong style="
                        font-size: 15px;
                        color: #5eead4;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    ">Firebase Sincronizado</strong>
                </div>
                <p style="
                    margin: 0;
                    padding-left: 48px;
                    color: rgba(255, 255, 255, 0.75);
                    font-size: 14px;
                    line-height: 1.6;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                ">Los datos se actualizan en tiempo real desde Firebase Firestore.</p>
            </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading users from Firebase:', error);
        content.innerHTML = `
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            "></div>
            
            <div style="padding: 20px;">
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 32px;
                ">
                    <div style="
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2));
                        border-radius: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        border: 1px solid rgba(239, 68, 68, 0.4);
                        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
                    ">❌</div>
                    <h3 style="
                        margin: 0;
                        font-size: 24px;
                        font-weight: 700;
                        background: linear-gradient(135deg, #ffffff 0%, #f87171 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                    ">Error al Cargar Usuarios</h3>
                </div>
                
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="
                        width: 120px;
                        height: 120px;
                        margin: 0 auto 24px;
                        background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
                        border-radius: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 60px;
                        border: 1px solid rgba(239, 68, 68, 0.3);
                        box-shadow: 0 8px 32px rgba(239, 68, 68, 0.25);
                    ">⚠️</div>
                    
                    <h4 style="
                        font-size: 20px;
                        color: rgba(255, 255, 255, 0.95);
                        margin: 0 0 16px 0;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    ">No se pudieron cargar los usuarios</h4>
                    
                    <div style="
                        padding: 16px 24px;
                        background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08));
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        border-radius: 14px;
                        border: 1px solid rgba(239, 68, 68, 0.3);
                        margin: 0 auto 28px;
                        max-width: 500px;
                    ">
                        <p style="
                            margin: 0;
                            color: rgba(248, 113, 113, 0.95);
                            font-size: 14px;
                            font-family: monospace;
                            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                        ">${error.message}</p>
                    </div>
                    
                    <button onclick="showUserManagement()" style="
                        padding: 14px 32px;
                        background: linear-gradient(135deg, rgba(45, 212, 191, 0.25), rgba(45, 212, 191, 0.15));
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        color: #5eead4;
                        border: 1px solid rgba(45, 212, 191, 0.4);
                        border-radius: 14px;
                        cursor: pointer;
                        font-size: 15px;
                        font-weight: 600;
                        box-shadow: 0 4px 16px rgba(45, 212, 191, 0.2);
                        transition: all 0.2s ease;
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                    " onmouseover="this.style.background='linear-gradient(135deg, rgba(45, 212, 191, 0.35), rgba(45, 212, 191, 0.25))'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(45, 212, 191, 0.35)';" onmouseout="this.style.background='linear-gradient(135deg, rgba(45, 212, 191, 0.25), rgba(45, 212, 191, 0.15))'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(45, 212, 191, 0.2)';">🔄 Reintentar Carga</button>
                </div>
            </div>
        `;
    }
}

function showRoleAssignment() {
    const content = document.getElementById('adminPanelContent');
    if (!content) return;
    
    content.innerHTML = `
        <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
            🎭 Asignación de Roles
        </h3>
        
        <div style="display: grid; gap: 20px;">
            <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px;">
                <h4 style="color: #ffd700; margin-bottom: 15px;">👑 Administrador</h4>
                <ul style="color: #b3e5e6; margin: 0; padding-left: 20px;">
                    <li>Gestionar todos los usuarios</li>
                    <li>Asignar y cambiar roles</li>
                    <li>Ver estadísticas del sistema</li>
                    <li>Moderar contenido</li>
                    <li>Crear y eliminar cursos</li>
                </ul>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px;">
                <h4 style="color: #5eead4; margin-bottom: 15px;">🎓 Tutor</h4>
                <ul style="color: #b3e5e6; margin: 0; padding-left: 20px;">
                    <li>Crear cursos y contenido</li>
                    <li>Moderar comentarios</li>
                    <li>Ver estadísticas de sus cursos</li>
                    <li>Gestionar estudiantes asignados</li>
                </ul>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px;">
                <h4 style="color: #a7f3d0; margin-bottom: 15px;">📚 Estudiante</h4>
                <ul style="color: #b3e5e6; margin: 0; padding-left: 20px;">
                    <li>Acceder a cursos</li>
                    <li>Ver progreso personal</li>
                    <li>Participar en clases</li>
                    <li>Contactar soporte</li>
                </ul>
            </div>
        </div>
        
        <div style="margin-top: 25px;">
            <h4 style="color: #5eead4; margin-bottom: 15px;">Cambio Rápido de Rol</h4>
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <input type="email" id="roleChangeEmail" placeholder="Email del usuario" style="
                    flex: 1;
                    min-width: 200px;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                " />
                
                <select id="newRoleSelect" style="
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                ">
                    <option value="${USER_ROLES.STUDENT}">📚 Estudiante</option>
                    <option value="${USER_ROLES.TUTOR}">🎓 Tutor</option>
                    <option value="${USER_ROLES.ADMIN}">👑 Administrador</option>
                </select>
                
                <button onclick="assignRoleQuick()" style="
                    background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
                    color: #0d7377;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                ">Asignar Rol</button>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: rgba(239, 68, 68, 0.1); border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.3);">
            <strong style="color: #ef4444;">⚠️ Importante:</strong>
            <p style="margin: 5px 0 0 0; color: #b3e5e6; font-size: 14px;">
                Los cambios de rol son permanentes. Asegúrate de tener al menos un administrador activo en todo momento.
            </p>
        </div>
    `;
}

// Refresh user list
function refreshUserList() {
    showNotification('info', 'Actualizando lista de usuarios...');
    showUserManagement();
}

async function changeUserRole(userId, userEmail, currentRole) {
    const roleNames = {
        [USER_ROLES.ADMIN]: 'Administrador',
        [USER_ROLES.TUTOR]: 'Tutor',
        [USER_ROLES.STUDENT]: 'Estudiante'
    };
    
    const roleOptions = Object.entries(USER_ROLES).map(([key, value]) => 
        `<option value="${value}" ${value === currentRole ? 'selected' : ''}>${roleNames[value]}</option>`
    ).join('');
    
    // Create role change modal
    const modalHTML = `
        <div id="roleChangeModal" class="role-modal">
            <div class="role-modal-content">
                <h3 class="role-modal-title">🎭 Cambiar Rol de Usuario</h3>
                <p class="role-modal-email">
                    <strong>${userEmail}</strong>
                </p>
                <p class="role-modal-current">
                    Rol actual: ${roleNames[currentRole]}
                </p>
                
                <select id="newRoleSelect" style="
                    width: 100%;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background: rgba(20, 25, 33, 0.9);
                    color: white;
                    margin-bottom: 20px;
                    font-size: 14px;
                    backdrop-filter: blur(10px);
                ">
                    ${roleOptions}
                </select>
                
                <div class="role-modal-buttons">
                    <button onclick="confirmRoleChange('${userId}', '${userEmail}')" class="role-modal-btn role-modal-btn-confirm">
                        Confirmar
                    </button>
                    
                    <button onclick="closeRoleChangeModal()" class="role-modal-btn role-modal-btn-cancel">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeRoleChangeModal() {
    const modal = document.getElementById('roleChangeModal');
    if (modal) {
        modal.remove();
    }
}

async function confirmRoleChange(userId, userEmail) {
    const newRole = document.getElementById('newRoleSelect')?.value;
    
    if (!newRole) {
        showNotification('error', 'Por favor selecciona un rol');
        return;
    }
    
    try {
        // ✅ Use apiService for automatic token renewal
        const result = await window.apiService.makeRequest('/users/change-role', {
            method: 'POST',
            body: JSON.stringify({ 
                userId: userId,
                newRole: newRole 
            })
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Error al actualizar rol');
        }
        
        closeRoleChangeModal();
        showNotification('success', `Rol actualizado para ${userEmail}`);
        
        // Refresh the user list
        setTimeout(() => {
            showUserManagement();
        }, 1000);
        
    } catch (error) {
        console.error('Error updating user role:', error);
        showNotification('error', `Error al actualizar rol: ${error.message}`);
    }
}

async function toggleUserStatus(userId, currentStatus) {
    try {
        const newStatus = currentStatus === 'activo' || currentStatus === 'active' ? 'inactive' : 'active';
        
        // ✅ Use apiService for automatic token renewal
        const result = await window.apiService.makeRequest('/users/change-status', {
            method: 'POST',
            body: JSON.stringify({ 
                userId: userId,
                newStatus: newStatus 
            })
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Error al cambiar estado');
        }
        
        showNotification('success', `Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente`);
        
        // Refresh the user list
        setTimeout(() => {
            showUserManagement();
        }, 1000);
        
    } catch (error) {
        console.error('Error toggling user status:', error);
        showNotification('error', `Error al cambiar estado: ${error.message}`);
    }
}

async function deleteUser(userId, userEmail) {
    // Confirmation dialog
    const confirmMessage = `¿Estás seguro de que deseas eliminar a ${userEmail}?\n\n⚠️ Esta acción no se puede deshacer.\n⚠️ Se eliminará tanto de Authentication como de Firestore.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            showNotification('error', 'No estás autorizado. Por favor, inicia sesión nuevamente.');
            return;
        }
        
        // ✅ Use apiService for automatic token renewal
        const result = await window.apiService.makeRequest(`/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!result.success) {
            if (result.error && result.error.includes('cannot delete yourself')) {
                throw new Error('No puedes eliminarte a ti mismo');
            }
            throw new Error(result.error || 'Error al eliminar usuario');
        }
        
        showNotification('success', `✅ Usuario ${userEmail} eliminado correctamente de Authentication y Firestore`);
        
        // Refresh the user list
        setTimeout(() => {
            showUserManagement();
        }, 1000);
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('error', `Error al eliminar usuario: ${error.message}`);
    }
}

// ============================================
// Create User Modal Functions
// ============================================

function showCreateUserModal() {
    const modalHTML = `
        <div id="createUserModal" class="role-modal">
            <div class="role-modal-content" style="max-width: 500px;">
                <h3 class="role-modal-title">➕ Crear Nuevo Usuario</h3>
                
                <form id="createUserForm" style="display: flex; flex-direction: column; gap: 16px; margin-top: 20px;">
                    <div>
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 8px; font-weight: 600;">
                            📧 Email
                        </label>
                        <input 
                            type="email" 
                            id="newUserEmail" 
                            required
                            placeholder="usuario@ejemplo.com"
                            style="
                                width: 100%;
                                padding: 12px;
                                border-radius: 8px;
                                border: 1px solid rgba(255, 255, 255, 0.2);
                                background: rgba(20, 25, 33, 0.9);
                                color: white;
                                font-size: 14px;
                                backdrop-filter: blur(10px);
                            "
                        />
                    </div>
                    
                    <div>
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 8px; font-weight: 600;">
                            👤 Nombre Completo
                        </label>
                        <input 
                            type="text" 
                            id="newUserName" 
                            required
                            placeholder="Juan Pérez García"
                            style="
                                width: 100%;
                                padding: 12px;
                                border-radius: 8px;
                                border: 1px solid rgba(255, 255, 255, 0.2);
                                background: rgba(20, 25, 33, 0.9);
                                color: white;
                                font-size: 14px;
                                backdrop-filter: blur(10px);
                            "
                        />
                    </div>
                    
                    <div>
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 8px; font-weight: 600;">
                            🔒 Contraseña
                        </label>
                        <input 
                            type="password" 
                            id="newUserPassword" 
                            required
                            minlength="6"
                            placeholder="Mínimo 6 caracteres"
                            style="
                                width: 100%;
                                padding: 12px;
                                border-radius: 8px;
                                border: 1px solid rgba(255, 255, 255, 0.2);
                                background: rgba(20, 25, 33, 0.9);
                                color: white;
                                font-size: 14px;
                                backdrop-filter: blur(10px);
                            "
                        />
                        <small style="color: rgba(255, 255, 255, 0.6); font-size: 12px; margin-top: 4px; display: block;">
                            Mínimo 6 caracteres
                        </small>
                    </div>
                    
                    <div>
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 8px; font-weight: 600;">
                            🎭 Rol
                        </label>
                        <select 
                            id="newUserRole" 
                            required
                            style="
                                width: 100%;
                                padding: 12px;
                                border-radius: 8px;
                                border: 1px solid rgba(255, 255, 255, 0.2);
                                background: rgba(20, 25, 33, 0.9);
                                color: white;
                                font-size: 14px;
                                backdrop-filter: blur(10px);
                            "
                        >
                            <option value="alumno">📚 Estudiante</option>
                            <option value="tutor">🎓 Tutor</option>
                            <option value="administrador">👑 Administrador</option>
                        </select>
                    </div>
                </form>
                
                <div class="role-modal-buttons" style="margin-top: 24px;">
                    <button onclick="confirmCreateUser()" class="role-modal-btn role-modal-btn-confirm">
                        ✅ Crear Usuario
                    </button>
                    
                    <button onclick="closeCreateUserModal()" class="role-modal-btn role-modal-btn-cancel">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    if (modal) {
        modal.remove();
    }
}

async function confirmCreateUser() {
    const email = document.getElementById('newUserEmail')?.value.trim();
    const name = document.getElementById('newUserName')?.value.trim();
    const password = document.getElementById('newUserPassword')?.value;
    const role = document.getElementById('newUserRole')?.value;
    
    // Validate form
    if (!email || !name || !password || !role) {
        showNotification('error', 'Por favor completa todos los campos');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('error', 'El formato del email no es válido');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        showNotification('error', 'La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    try {
        const userData = { 
            email: email,
            name: name,
            password: password,
            role: role
        };

        // Check if online
        if (navigator.onLine) {
            // ONLINE - Make API call immediately with apiService for token renewal
            showNotification('info', 'Creando usuario...');
            
            // ✅ Use apiService for automatic token renewal
            const result = await window.apiService.makeRequest('/users/create', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            if (!result.success) {
                throw new Error(result.error || 'Error al crear usuario');
            }
            
            closeCreateUserModal();
            showNotification('success', `✅ Usuario ${name} creado exitosamente`);
            
            // Refresh the user list
            setTimeout(() => {
                showUserManagement();
            }, 1000);
            
        } else {
            // OFFLINE - Add to sync queue
            if (typeof addToSyncQueue === 'function') {
                await addToSyncQueue(
                    'create-user',           // operation name
                    '/api/users/create',     // endpoint
                    userData,                // data
                    'POST'                   // method
                );
                
                closeCreateUserModal();
                showNotification('warning', `📴 Sin conexión. Usuario "${name}" se creará cuando vuelvas a estar online`);
                
                // Register background sync
                if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('sync-offline-data');
                    console.log('🔄 Background sync registered');
                }
            } else {
                throw new Error('Sistema offline no disponible. Por favor, conéctate a internet.');
            }
        }
        
    } catch (error) {
        console.error('Error creating user:', error);
        showNotification('error', `❌ Error: ${error.message}`);
    }
}

async function assignRoleQuick() {
    const email = document.getElementById('roleChangeEmail')?.value;
    const newRole = document.getElementById('newRoleSelect')?.value;
    
    if (!email || !newRole) {
        showNotification('error', 'Por favor completa todos los campos');
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        showNotification('error', 'Por favor ingresa un email válido');
        return;
    }
    
    try {
        if (!isFirebaseReady()) {
            const initialized = await initializeFirebaseForDashboard();
            if (!initialized) {
                throw new Error('Firebase no está disponible');
            }
        }
        
        const db = getFirebaseDb();
        
        // Find user by email
        const userQuery = await db.collection('users')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();
        
        if (!userQuery || userQuery.empty || !userQuery.docs || userQuery.docs.length === 0) {
            showNotification('error', 'Usuario no encontrado con ese email');
            return;
        }
        
        const userDoc = userQuery.docs[0];
        if (!userDoc) {
            showNotification('error', 'Error al obtener datos del usuario');
            return;
        }
        
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Check if trying to remove the last admin
        if (newRole !== USER_ROLES.ADMIN && userData.role === USER_ROLES.ADMIN) {
            const adminQuery = await db.collection('users')
                .where('role', '==', USER_ROLES.ADMIN)
                .get();
            
            if (adminQuery.size <= 1) {
                showNotification('error', 'No se puede eliminar el último administrador');
                return;
            }
        }
        
        // Update user role
        await db.collection('users').doc(userId).update({
            role: newRole,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Clear form
        document.getElementById('roleChangeEmail').value = '';
        document.getElementById('newRoleSelect').value = USER_ROLES.STUDENT;
        
        const roleNames = {
            [USER_ROLES.ADMIN]: 'Administrador',
            [USER_ROLES.TUTOR]: 'Tutor',
            [USER_ROLES.STUDENT]: 'Estudiante'
        };
        
        showNotification('success', `Rol ${roleNames[newRole]} asignado a ${email}`);
        
        // Refresh user management if it's currently shown
        const adminContent = document.getElementById('adminPanelContent');
        if (adminContent && adminContent.innerHTML.includes('👥 Gestión de Usuarios')) {
            setTimeout(() => {
                showUserManagement();
            }, 1000);
        }
        
    } catch (error) {
        console.error('Error assigning role:', error);
        showNotification('error', `Error al asignar rol: ${error.message}`);
    }
}

// Notification System
function showNotification(type, message) {
    // Remove ALL existing notifications immediately
    const existingNotifications = document.querySelectorAll('.notification-toast');
    existingNotifications.forEach(existing => {
        // Clear any pending timeouts
        if (existing.autoHideTimeout) {
            clearTimeout(existing.autoHideTimeout);
        }
        // Remove immediately without animation for instant replacement
        existing.remove();
    });
    
    // Create unique ID for this notification
    const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = 'notification-toast';
    
    // Base styles with MAXIMUM z-index - LIQUID GLASS EFFECT
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 18px 26px;
        border-radius: 16px;
        color: white;
        font-weight: 600;
        font-size: 14px;
        z-index: 999999;
        transform: translateX(calc(100% + 40px));
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        max-width: 380px;
        min-width: 220px;
        word-wrap: break-word;
        white-space: pre-line;
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        pointer-events: auto;
        cursor: pointer;
        overflow: hidden;
        animation: liquidPulse 3s ease-in-out infinite;
    `;
    
    // Set notification style based on type with LIQUID GLASS variations
    const styles = {
        success: {
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85), rgba(5, 150, 105, 0.9))',
            border: '1px solid rgba(16, 185, 129, 0.6)',
            shadow: '0 12px 48px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.2) inset',
            glow: 'rgba(16, 185, 129, 0.3)',
            icon: '✅'
        },
        error: {
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.85), rgba(220, 38, 38, 0.9))',
            border: '1px solid rgba(239, 68, 68, 0.6)',
            shadow: '0 12px 48px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.2) inset',
            glow: 'rgba(239, 68, 68, 0.3)',
            icon: '❌'
        },
        info: {
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(37, 99, 235, 0.9))',
            border: '1px solid rgba(59, 130, 246, 0.6)',
            shadow: '0 12px 48px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2) inset',
            glow: 'rgba(59, 130, 246, 0.3)',
            icon: 'ℹ️'
        },
        warning: {
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.85), rgba(217, 119, 6, 0.9))',
            border: '1px solid rgba(245, 158, 11, 0.6)',
            shadow: '0 12px 48px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.2) inset',
            glow: 'rgba(245, 158, 11, 0.3)',
            icon: '⚠️'
        }
    };
    
    const style = styles[type] || styles.info;
    notification.style.background = style.background;
    notification.style.border = style.border;
    notification.style.boxShadow = style.shadow;
    
    // Add liquid glass shimmer overlay
    const shimmer = document.createElement('div');
    shimmer.style.cssText = `
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent 30%, ${style.glow} 50%, transparent 70%);
        animation: shimmerMove 3s linear infinite;
        pointer-events: none;
        opacity: 0.4;
    `;
    
    // Create content with icon and liquid glass depth
    const content = document.createElement('div');
    content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
        z-index: 1;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    `;
    content.innerHTML = `
        <span style="font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); animation: iconBounce 0.6s ease-out;">${style.icon}</span>
        <span style="flex: 1; line-height: 1.4;">${message}</span>
        <span style="opacity: 0.8; font-size: 18px; margin-left: 8px; transition: all 0.2s; font-weight: 300;" onmouseover="this.style.opacity='1'; this.style.transform='scale(1.2)'" onmouseout="this.style.opacity='0.8'; this.style.transform='scale(1)'">×</span>
    `;
    
    notification.appendChild(shimmer);
    notification.appendChild(content);
    
    // Add liquid glass animations to page if not already added
    if (!document.getElementById('liquidGlassAnimations')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'liquidGlassAnimations';
        styleSheet.textContent = `
            @keyframes shimmerMove {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
            @keyframes liquidPulse {
                0%, 100% { filter: brightness(1) contrast(1); }
                50% { filter: brightness(1.05) contrast(1.05); }
            }
            @keyframes iconBounce {
                0% { transform: scale(0.3) rotate(-12deg); opacity: 0; }
                50% { transform: scale(1.1) rotate(6deg); }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            .notification-toast::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
                border-radius: 16px;
                pointer-events: none;
            }
            .notification-toast::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 10%;
                right: 10%;
                height: 20px;
                background: radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, transparent 70%);
                filter: blur(8px);
                pointer-events: none;
                z-index: -1;
            }
        `;
        document.head.appendChild(styleSheet);
    }
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification with animation
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0) scale(1)';
        notification.style.opacity = '1';
    });
    
    // Add click to dismiss
    notification.addEventListener('click', () => {
        hideNotification(notification);
    });
    
    // Auto hide after 4 seconds
    const autoHideTimeout = setTimeout(() => {
        hideNotification(notification);
    }, 4000);
    
    // Store timeout so we can clear it if manually dismissed
    notification.autoHideTimeout = autoHideTimeout;
}

// Helper function to hide notification with liquid glass effect
function hideNotification(notification) {
    if (!notification || !notification.parentNode) return;
    
    // Clear auto-hide timeout
    if (notification.autoHideTimeout) {
        clearTimeout(notification.autoHideTimeout);
    }
    
    // Liquid glass dissolve animation
    notification.style.transform = 'translateX(calc(100% + 40px)) scale(0.9) rotateZ(3deg)';
    notification.style.opacity = '0';
    notification.style.filter = 'blur(4px)';
    
    // Remove from DOM
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 500);
}

// Initialize Background Animations
function initializeBackgroundAnimations() {
    const circles = document.querySelectorAll('.bg-circle');
    circles.forEach((circle, index) => {
        setInterval(() => {
            const scale = 1 + Math.sin(Date.now() / 1000 + index) * 0.1;
            circle.style.transform = `scale(${scale})`;
        }, 50);
    });
}

// Clean up localStorage for fresh start
function cleanupLocalStorage() {
    // For now, always start in guest mode unless explicitly authenticated
    // This ensures the dashboard loads as guest by default
    const isAuth = localStorage.getItem('userAuthenticated') === 'true';
    const hasUserName = localStorage.getItem('userName');
    const hasValidSession = isAuth && hasUserName && hasUserName !== 'Usuario';
    
    if (!hasValidSession) {
        // Clear all auth-related data for fresh start
        localStorage.removeItem('userAuthenticated');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        console.log('Starting in guest mode');
    } else {
        console.log('Valid session found for:', hasUserName);
        // Ensure admin role is set for existing session
        const currentRole = localStorage.getItem('userRole');
        if (!currentRole && hasUserName) {
            localStorage.setItem('userRole', USER_ROLES.ADMIN);
            console.log('Set admin role for existing user');
        }
    }
}

// Initialize Dashboard
async function initializeDashboard() {
    try {
        console.log('🚀 Starting dashboard initialization...');
        
        // Clean up localStorage first
        cleanupLocalStorage();
        
        // Update user interface based on authentication state
        updateUserInterface();
        
        // Render initial categories (these don't need Firebase)
        renderCategories();
        
        // Initialize background animations
        initializeBackgroundAnimations();
        
        // Firebase Client SDK is deprecated - we use backend API now
        console.log('✅ Using backend API for all data operations');
        
        // Show welcome notification
        const isAuth = isUserAuthenticated();
        setTimeout(() => {
            if (isAuth) {
                const userName = localStorage.getItem('userName') || 'Usuario';
                const userRole = getUserRole();
                
                // Debug log for troubleshooting
                console.log('🔍 Current User Role:', userRole);
                console.log('🔍 Available Roles:', USER_ROLES);
                console.log('🔍 Is Admin?', isAdmin());
                
                const roleEmojis = {
                    [USER_ROLES.ADMIN]: '👑',
                    [USER_ROLES.TUTOR]: '🎓',
                    [USER_ROLES.STUDENT]: '📚'
                };
                showNotification('success', `¡Bienvenido de nuevo, ${userName.split(' ')[0]}! ${roleEmojis[userRole] || '📚'}`);
            } else {
                showNotification('info', '¡Bienvenido a ClassGo! 🚀');
            }
        }, 1500);
        
        console.log('✅ Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        showNotification('error', 'Error al cargar el dashboard');
        
        // Still try to show basic interface
        try {
            updateUserInterface();
            renderCategories();
        } catch (e) {
            console.error('Failed to load basic interface:', e);
        }
    }
}

// Make critical functions immediately available
window.toggleUserMenu = toggleUserMenu;
window.switchTab = switchTab;
window.openCategory = openCategory;
window.joinClass = joinClass;
window.showStats = showStats;





// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    
    // Additional event listener for user avatar to ensure reliability
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        // Remove any existing listeners and add a fresh one
        userAvatar.removeEventListener('click', toggleUserMenu);
        userAvatar.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleUserMenu(e);
        });
        
        // Also add touch support for mobile
        userAvatar.addEventListener('touchstart', function(e) {
            e.preventDefault();
            toggleUserMenu(e);
        });
        
        console.log('✅ User avatar click handlers initialized');
    }
});

// Initialize PWA offline support
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize offline capabilities
    await initializeOfflineSupport();
    
    // Check if we need to load offline data
    if (offlineMode) {
        const offlineCategories = await loadOfflineData();
        if (offlineCategories) {
            console.log('📱 Using offline data for categories');
            // You can use offline data here if needed
        }
    }
});

// Export functions for global access (including PWA functions)
window.ClassGoDashboard = {
    renderCategories,
    openCategory,
    switchTab,
    joinClass,
    showStats,
    toggleUserMenu,
    showNotification,
    // PWA functions
    initializeOfflineSupport,
    storeOfflineData,
    loadOfflineData,
    updateConnectionStatus
};