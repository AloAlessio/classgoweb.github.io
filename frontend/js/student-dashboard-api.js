// Student Dashboard - API Version (No Firebase Client)
// Uses backend API exclusively for all data operations

let currentUser = null;
let currentSection = 'explore';
let allCourses = [];
let myCourses = [];
let currentCategory = 'all';
let currentCourseFilter = 'all';
let currentConversation = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Check role access
    const isAdminUser = userRole === 'admin' || userRole === 'administrador';
    const isStudentUser = userRole === 'student' || userRole === 'alumno';
    
    if (!isStudentUser && !isAdminUser) {
        showNotification('Acceso denegado', 'error');
        setTimeout(() => window.location.href = '/home', 1500);
        return;
    }
    
    console.log('✅ Access granted. User role:', userRole);
    
    currentUser = {
        name: userName || 'Estudiante',
        role: userRole
    };
    
    await initializeStudentDashboard();
});

async function initializeStudentDashboard() {
    // Display user info
    const welcomeTitle = document.getElementById('welcomeTitle');
    const avatarText = document.getElementById('avatarText');
    
    const isAdminUser = currentUser.role === 'admin' || currentUser.role === 'administrador';
    
    if (isAdminUser) {
        if (welcomeTitle) welcomeTitle.textContent = `¡Bienvenido ${currentUser.name}! 📚 👑 [Admin View]`;
    } else {
        if (welcomeTitle) welcomeTitle.textContent = `¡Bienvenido ${currentUser.name}! 📚`;
    }
    if (avatarText) avatarText.textContent = currentUser.name.charAt(0).toUpperCase();
    
    // Setup navigation
    setupNavigation();
    
    // Load all data
    await Promise.all([
        loadStats(),
        loadCourses(),
        loadMyCourses(),
        loadProgress(),
        loadMessages()
    ]);
    
    renderCalendar();
    setupEventListeners();
    
    if (isAdminUser) {
        setTimeout(() => {
            showNotification('👑 Accediendo como Administrador - Tienes acceso completo', 'success');
        }, 500);
    }
}

function setupNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const section = tab.getAttribute('data-section');
            switchSection(section);
        });
    });
}

function switchSection(sectionName) {
    currentSection = sectionName;
    
    // Update tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-section') === sectionName) {
            tab.classList.add('active');
        }
    });
    
    // Update sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const sectionElement = document.getElementById(`${sectionName}Section`);
    if (sectionElement) {
        sectionElement.classList.add('active');
    }
}

function setupEventListeners() {
    // Category filters
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.getAttribute('data-category');
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterCourses();
        });
    });
    
    // Search
    const searchInput = document.getElementById('searchCourses');
    searchInput?.addEventListener('input', (e) => {
        filterCourses(e.target.value);
    });
    
    // My courses filter
    const myCoursesFilter = document.getElementById('myCoursesFilter');
    myCoursesFilter?.addEventListener('change', (e) => {
        currentCourseFilter = e.target.value;
        displayMyCourses();
    });
    
    // Conversation search
    const searchConversations = document.getElementById('searchConversations');
    searchConversations?.addEventListener('input', (e) => {
        filterConversations(e.target.value);
    });
}

// ===================
// STATS SECTION
// ===================

async function loadStats() {
    try {
        const token = localStorage.getItem('authToken');
        
        // Get enrolled classes
        const response = await fetch('/api/classes?role=student', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load stats');
        }
        
        const data = await response.json();
        const enrolledClasses = data.data?.classes || [];
        
        // Calculate stats
        const totalEnrolled = enrolledClasses.length;
        const completedClasses = enrolledClasses.filter(c => c.status === 'completed').length;
        const progress = totalEnrolled > 0 ? Math.round((completedClasses / totalEnrolled) * 100) : 0;
        
        // Update UI
        const enrolledCoursesEl = document.getElementById('enrolledCourses');
        const completedLessonsEl = document.getElementById('completedLessons');
        const overallProgressEl = document.getElementById('overallProgress');
        const earnedCertificatesEl = document.getElementById('earnedCertificates');
        
        if (enrolledCoursesEl) enrolledCoursesEl.textContent = totalEnrolled;
        if (completedLessonsEl) completedLessonsEl.textContent = completedClasses;
        if (overallProgressEl) overallProgressEl.textContent = `${progress}%`;
        if (earnedCertificatesEl) earnedCertificatesEl.textContent = completedClasses;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ===================
// COURSES SECTION (EXPLORE)
// ===================

async function loadCourses() {
    try {
        const token = localStorage.getItem('authToken');
        
        // Get all available classes
        const response = await fetch('/api/classes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load courses');
        }
        
        const data = await response.json();
        allCourses = data.data?.classes || [];
        
        filterCourses();
        
    } catch (error) {
        console.error('Error loading courses:', error);
        showNotification('Error al cargar cursos', 'error');
    }
}

function filterCourses(searchTerm = '') {
    const coursesGrid = document.getElementById('exploreCoursesGrid');
    if (!coursesGrid) return;
    
    let filtered = allCourses;
    
    // Filter by category
    if (currentCategory && currentCategory !== 'all') {
        filtered = filtered.filter(course => 
            course.category?.toLowerCase() === currentCategory.toLowerCase()
        );
    }
    
    // Filter by search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(course =>
            course.title?.toLowerCase().includes(term) ||
            course.description?.toLowerCase().includes(term) ||
            course.subject?.toLowerCase().includes(term)
        );
    }
    
    // Display courses
    if (filtered.length === 0) {
        coursesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <p>No se encontraron cursos</p>
                <small>Intenta ajustar los filtros o buscar con otros términos</small>
            </div>
        `;
        return;
    }
    
    coursesGrid.innerHTML = filtered.map(course => `
        <div class="course-card">
            <div class="course-badge ${course.category || 'general'}">${course.category || 'General'}</div>
            <h3>${course.title}</h3>
            <p>${course.description || 'Sin descripción'}</p>
            <div class="course-meta">
                <span>👥 ${course.currentStudents || 0}/${course.maxStudents || 20} estudiantes</span>
                <span>⏱️ ${course.duration || 60} min</span>
            </div>
            <div class="course-tutor">
                <strong>Tutor:</strong> ${course.tutor?.name || 'No asignado'}
            </div>
            <div class="course-schedule">
                <strong>📅 Fecha:</strong> ${formatDate(course.scheduledAt)}
            </div>
            <button 
                class="btn-primary" 
                onclick="enrollInCourse('${course.id}')"
                ${course.currentStudents >= course.maxStudents ? 'disabled' : ''}
            >
                ${course.currentStudents >= course.maxStudents ? '❌ Lleno' : '✅ Inscribirse'}
            </button>
        </div>
    `).join('');
}

async function enrollInCourse(courseId) {
    if (!confirm('¿Deseas inscribirte en este curso?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`/api/classes/${courseId}/join`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to enroll');
        }
        
        showNotification('¡Te has inscrito exitosamente! 🎉', 'success');
        
        // Reload data
        await Promise.all([
            loadCourses(),
            loadMyCourses(),
            loadStats()
        ]);
        
    } catch (error) {
        console.error('Error enrolling:', error);
        showNotification(error.message || 'Error al inscribirse', 'error');
    }
}

// ===================
// MY COURSES SECTION
// ===================

async function loadMyCourses() {
    try {
        const token = localStorage.getItem('authToken');
        
        // Get user's enrolled classes
        const response = await fetch('/api/classes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load my courses');
        }
        
        const data = await response.json();
        myCourses = data.data?.classes || [];
        
        displayMyCourses();
        
    } catch (error) {
        console.error('Error loading my courses:', error);
        showNotification('Error al cargar tus cursos', 'error');
    }
}

function displayMyCourses() {
    const coursesGrid = document.getElementById('myCoursesGrid');
    if (!coursesGrid) return;
    
    let filtered = myCourses;
    
    // Filter by status
    if (currentCourseFilter && currentCourseFilter !== 'all') {
        filtered = filtered.filter(course => course.status === currentCourseFilter);
    }
    
    if (filtered.length === 0) {
        coursesGrid.innerHTML = '<div class="empty-state">No tienes cursos inscritos</div>';
        return;
    }
    
    coursesGrid.innerHTML = filtered.map(course => `
        <div class="course-card enrolled">
            <div class="course-badge ${course.category || 'general'}">${course.category || 'General'}</div>
            <div class="status-badge ${course.status}">${getStatusText(course.status)}</div>
            <h3>${course.title}</h3>
            <p>${course.description || 'Sin descripción'}</p>
            <div class="course-meta">
                <span>👥 ${course.currentStudents || 0} estudiantes</span>
                <span>⏱️ ${course.duration || 60} min</span>
            </div>
            <div class="course-tutor">
                <strong>Tutor:</strong> ${course.tutor?.name || 'No asignado'}
            </div>
            <div class="course-schedule">
                <strong>📅 Fecha:</strong> ${formatDate(course.scheduledAt)}
            </div>
            <div class="course-actions">
                ${course.status === 'active' && course.meetingUrl ? 
                    `<a href="${course.meetingUrl}" target="_blank" class="btn-primary">🎥 Unirse a clase</a>` :
                    '<button class="btn-secondary" disabled>Próximamente</button>'
                }
                <button class="btn-danger" onclick="leaveCourse('${course.id}')">❌ Abandonar</button>
            </div>
        </div>
    `).join('');
}

async function leaveCourse(courseId) {
    if (!confirm('¿Estás seguro de que deseas abandonar este curso?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`/api/classes/${courseId}/leave`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to leave course');
        }
        
        showNotification('Has abandonado el curso', 'success');
        
        // Reload data
        await Promise.all([
            loadCourses(),
            loadMyCourses(),
            loadStats()
        ]);
        
    } catch (error) {
        console.error('Error leaving course:', error);
        showNotification(error.message || 'Error al abandonar curso', 'error');
    }
}

// ===================
// PROGRESS SECTION
// ===================

async function loadProgress() {
    const progressGrid = document.getElementById('progressGrid');
    if (!progressGrid) return;
    
    if (myCourses.length === 0) {
        progressGrid.innerHTML = '<div class="empty-state">No hay progreso para mostrar</div>';
        return;
    }
    
    progressGrid.innerHTML = myCourses.map(course => {
        const progress = course.status === 'completed' ? 100 : 
                        course.status === 'active' ? 50 : 0;
        
        return `
            <div class="progress-card">
                <h4>${course.title}</h4>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-info">
                    <span>${progress}% completado</span>
                    <span class="status-${course.status}">${getStatusText(course.status)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===================
// MESSAGES SECTION
// ===================

async function loadMessages() {
    try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('/api/conversations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load conversations');
        }
        
        const data = await response.json();
        const conversations = data.data?.conversations || [];
        
        displayConversations(conversations);
        
    } catch (error) {
        console.error('Error loading messages:', error);
        const conversationsList = document.getElementById('conversationsList');
        if (conversationsList) {
            conversationsList.innerHTML = '<div class="empty-state">Error al cargar conversaciones</div>';
        }
    }
}

function displayConversations(conversations) {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = '<div class="empty-state">No tienes conversaciones</div>';
        return;
    }
    
    conversationsList.innerHTML = conversations.map(conv => `
        <div class="conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}" 
             onclick="openConversation('${conv.id}')">
            <div class="conversation-avatar">
                ${conv.otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div class="conversation-info">
                <div class="conversation-name">${conv.otherParticipant?.name || 'Usuario'}</div>
                <div class="conversation-last-message">${conv.lastMessage || 'Sin mensajes'}</div>
            </div>
            ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
        </div>
    `).join('');
}

async function openConversation(conversationId) {
    currentConversation = conversationId;
    
    try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load messages');
        }
        
        const data = await response.json();
        const messages = data.data?.messages || [];
        
        displayMessages(messages);
        
        // Mark as read
        fetch(`/api/conversations/${conversationId}/mark-read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
    } catch (error) {
        console.error('Error loading conversation:', error);
        showNotification('Error al cargar mensajes', 'error');
    }
}

function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const currentUserId = localStorage.getItem('userId');
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<div class="empty-state">No hay mensajes</div>';
        return;
    }
    
    messagesContainer.innerHTML = messages.map(msg => `
        <div class="message ${msg.senderId === currentUserId ? 'sent' : 'received'}">
            <div class="message-content">${msg.text}</div>
            <div class="message-time">${formatTime(msg.timestamp)}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    if (!currentConversation) {
        showNotification('Selecciona una conversación primero', 'error');
        return;
    }
    
    const messageInput = document.getElementById('messageInput');
    const text = messageInput?.value?.trim();
    
    if (!text) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`/api/conversations/${currentConversation}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        
        messageInput.value = '';
        
        // Reload messages
        await openConversation(currentConversation);
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Error al enviar mensaje', 'error');
    }
}

function filterConversations(searchTerm) {
    // TODO: Implement conversation filtering
    console.log('Filtering conversations:', searchTerm);
}

// ===================
// CALENDAR
// ===================

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '';
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === now.getDate();
        html += `<div class="calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
    }
    
    calendarGrid.innerHTML = html;
}

// ===================
// UTILITY FUNCTIONS
// ===================

function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function getStatusText(status) {
    const statusMap = {
        'scheduled': 'Programado',
        'active': 'En curso',
        'completed': 'Completado',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Logout function
function logout() {
    localStorage.clear();
    window.location.href = '/login';
}
