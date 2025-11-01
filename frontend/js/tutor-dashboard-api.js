// Tutor Dashboard - API Version (No Firebase Client)
// Uses backend API exclusively for all data operations

let currentTutor = null;
let currentSection = 'courses';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let myCourses = [];

// Initialize Dashboard
async function initializeTutorDashboard() {
    try {
        console.log('🎓 Initializing Tutor Dashboard...');
        
        // Check authentication
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        const isAdminUser = userRole === 'admin' || userRole === 'administrador';
        const isTutorUser = userRole === 'tutor';
        
        if (!isTutorUser && !isAdminUser) {
            showNotification('error', 'Acceso denegado. Solo tutores y administradores pueden acceder');
            setTimeout(() => {
                window.location.href = '/home';
            }, 2000);
            return;
        }
        
        console.log('✅ Access granted. User role:', userRole);
        
        // Load tutor data
        currentTutor = {
            name: localStorage.getItem('userName') || 'Tutor',
            email: localStorage.getItem('userEmail') || 'tutor@classgo.com',
            id: localStorage.getItem('userId') || null,
            role: userRole
        };
        
        updateWelcomeMessage();
        await loadDashboardData();
        
        if (isAdminUser) {
            setTimeout(() => {
                showNotification('success', '👑 Accediendo como Administrador - Tienes acceso completo a todas las funciones');
            }, 500);
        }
        
        console.log('✅ Tutor Dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing tutor dashboard:', error);
        showNotification('error', 'Error al cargar el dashboard');
    }
}

// Update Welcome Message
function updateWelcomeMessage() {
    const userName = currentTutor.name.split(' ')[0];
    const userRole = localStorage.getItem('userRole');
    const isAdminUser = userRole === 'admin' || userRole === 'administrador';
    
    if (isAdminUser) {
        document.getElementById('welcomeTitle').textContent = `¡Bienvenido, ${userName}! 🎓 👑 [Admin View]`;
    } else {
        document.getElementById('welcomeTitle').textContent = `¡Bienvenido, ${userName}! 🎓`;
    }
    document.getElementById('avatarText').textContent = userName.charAt(0).toUpperCase();
}

// Load Dashboard Data
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadCourses(),
        loadStudents(),
        loadSchedule(),
        loadMessages(),
        loadResources()
    ]);
}

// Load Stats
async function loadStats() {
    try {
        const token = localStorage.getItem('authToken');
        
        // Get tutor's classes
        const response = await fetch('/api/classes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load stats');
        }
        
        const data = await response.json();
        const classes = data.data?.classes || [];
        
        // Calculate stats
        const totalCourses = classes.length;
        const upcomingClasses = classes.filter(c => c.status === 'scheduled').length;
        
        let totalStudents = 0;
        classes.forEach(c => {
            totalStudents += c.currentStudents || 0;
        });
        
        document.getElementById('totalCourses').textContent = totalCourses;
        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('upcomingClasses').textContent = upcomingClasses;
        document.getElementById('avgRating').textContent = '4.8'; // TODO: Calculate from real data
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Section Switching
function switchSection(sectionName) {
    currentSection = sectionName;
    
    // Update tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}Section`).classList.add('active');
}

// ===================
// COURSES MANAGEMENT
// ===================

async function loadCourses() {
    try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('/api/classes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load courses');
        }
        
        const data = await response.json();
        myCourses = data.data?.classes || [];
        
        const coursesGrid = document.getElementById('coursesGrid');
        
        if (myCourses.length === 0) {
            coursesGrid.innerHTML = '<div class="empty-state">No tienes cursos creados</div>';
            return;
        }
        
        coursesGrid.innerHTML = myCourses.map(course => `
            <div class="course-card">
                <div class="course-badge ${course.category || 'general'}">${course.category || 'General'}</div>
                <div class="status-badge ${course.status}">${getStatusText(course.status)}</div>
                <div class="course-title">${course.title}</div>
                <p class="course-description">${course.description || 'Sin descripción'}</p>
                <div class="course-info">
                    <span>👥 ${course.currentStudents || 0}/${course.maxStudents || 20} estudiantes</span>
                    <span>⏱️ ${course.duration || 60} min</span>
                </div>
                <div class="course-schedule">
                    📅 ${formatDate(course.scheduledAt)}
                </div>
                <div class="course-actions">
                    <button class="btn-edit" onclick="editCourse('${course.id}')">✏️ Editar</button>
                    <button class="btn-delete" onclick="deleteCourse('${course.id}')">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading courses:', error);
        document.getElementById('coursesGrid').innerHTML = '<div class="empty-state">Error al cargar cursos</div>';
    }
}

function openCreateCourseModal() {
    // Show modal
    const modal = document.getElementById('createCourseModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeCreateCourseModal() {
    const modal = document.getElementById('createCourseModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitCreateCourse(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const courseData = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        subject: formData.get('subject'),
        scheduledAt: formData.get('scheduledAt'),
        duration: parseInt(formData.get('duration')) || 60,
        maxStudents: parseInt(formData.get('maxStudents')) || 20
    };
    
    try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('/api/classes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create course');
        }
        
        showNotification('success', '¡Curso creado exitosamente! 🎉');
        closeCreateCourseModal();
        form.reset();
        
        // Reload courses
        await loadCourses();
        await loadStats();
        
    } catch (error) {
        console.error('Error creating course:', error);
        showNotification('error', error.message || 'Error al crear curso');
    }
}

function editCourse(courseId) {
    showNotification('info', `Editando curso ${courseId} - Próximamente`);
    // TODO: Implement edit course functionality
}

async function deleteCourse(courseId) {
    if (!confirm('¿Estás seguro de eliminar este curso?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`/api/classes/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete course');
        }
        
        showNotification('success', 'Curso eliminado exitosamente');
        await loadCourses();
        await loadStats();
        
    } catch (error) {
        console.error('Error deleting course:', error);
        showNotification('error', error.message || 'Error al eliminar curso');
    }
}

// ===================
// STUDENTS MANAGEMENT
// ===================

async function loadStudents() {
    try {
        const studentsTableBody = document.getElementById('studentsTableBody');
        
        // Get all students from enrolled classes
        const studentsMap = new Map();
        
        myCourses.forEach(course => {
            if (course.enrolledStudents) {
                course.enrolledStudents.forEach(student => {
                    if (!studentsMap.has(student.uid)) {
                        studentsMap.set(student.uid, {
                            name: student.name,
                            email: student.email,
                            courses: [],
                            lastActivity: course.updatedAt
                        });
                    }
                    studentsMap.get(student.uid).courses.push(course.title);
                });
            }
        });
        
        const students = Array.from(studentsMap.values());
        
        if (students.length === 0) {
            studentsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay estudiantes inscritos</td></tr>';
            return;
        }
        
        studentsTableBody.innerHTML = students.map(student => `
            <tr>
                <td><strong>${student.name}</strong></td>
                <td>${student.courses.join(', ')}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 75%"></div>
                    </div>
                    75%
                </td>
                <td>${formatDate(student.lastActivity)}</td>
                <td>
                    <button class="btn-secondary" onclick="viewStudentDetail('${student.name}')">Ver Detalles</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function viewStudentDetail(studentName) {
    showNotification('info', `Ver detalles de ${studentName} - Próximamente`);
}

// Search students
document.addEventListener('DOMContentLoaded', () => {
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
        studentSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#studentsTableBody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
});

// ===================
// SCHEDULE/CALENDAR
// ===================

async function loadSchedule() {
    renderCalendar();
    loadUpcomingClasses();
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let html = '';
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Days of month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && 
                       currentMonth === today.getMonth() && 
                       currentYear === today.getFullYear();
        html += `<div class="calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
    }
    
    calendarGrid.innerHTML = html;
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

function loadUpcomingClasses() {
    const upcomingList = document.getElementById('upcomingClassesList');
    
    const upcomingClasses = myCourses.filter(c => c.status === 'scheduled');
    
    if (upcomingClasses.length === 0) {
        upcomingList.innerHTML = '<div class="empty-state">No hay clases próximas</div>';
        return;
    }
    
    upcomingList.innerHTML = upcomingClasses.map(course => `
        <div class="upcoming-class-item">
            <div class="upcoming-class-info">
                <strong>${course.title}</strong>
                <span>📅 ${formatDate(course.scheduledAt)}</span>
                <span>👥 ${course.currentStudents} estudiantes</span>
            </div>
        </div>
    `).join('');
}

// ===================
// MESSAGES
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
            throw new Error('Failed to load messages');
        }
        
        const data = await response.json();
        const conversations = data.data?.conversations || [];
        
        const messagesList = document.getElementById('messagesList');
        
        if (conversations.length === 0) {
            messagesList.innerHTML = '<div class="empty-state">No tienes mensajes</div>';
            return;
        }
        
        messagesList.innerHTML = conversations.map(conv => `
            <div class="message-item ${conv.unreadCount > 0 ? 'unread' : ''}">
                <div class="message-avatar">
                    ${conv.otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div class="message-content">
                    <strong>${conv.otherParticipant?.name || 'Usuario'}</strong>
                    <p>${conv.lastMessage || 'Sin mensajes'}</p>
                </div>
                ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// ===================
// RESOURCES
// ===================

async function loadResources() {
    const resourcesList = document.getElementById('resourcesList');
    
    // Placeholder for now
    resourcesList.innerHTML = '<div class="empty-state">No hay recursos disponibles</div>';
}

// ===================
// UTILITY FUNCTIONS
// ===================

function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function logout() {
    localStorage.clear();
    window.location.href = '/login';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeTutorDashboard);
