// Student Dashboard - API Version (No Firebase Client)
// Uses backend API exclusively for all data operations

const apiService = new APIService();

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
    
    // Check if coming back from game with a completion flag
    const completedClassId = sessionStorage.getItem('completedClassId');
    console.log('🔍 Checking for completedClassId:', completedClassId);
    if (completedClassId) {
        console.log('📝 User returned from game, marking class as completed:', completedClassId);
        await completeClass(completedClassId);
        sessionStorage.removeItem('completedClassId');
        console.log('✅ completedClassId removed from sessionStorage');
    } else {
        console.log('ℹ️ No completedClassId found - user did not return from a game');
    }
    
    // Setup navigation
    setupNavigation();
    
    // Load data in correct order to ensure proper filtering
    await loadMyCourses();  // Load enrolled courses first
    await loadCourses();    // Then load available courses (will be filtered automatically)
    await Promise.all([
        loadStats(),
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
    
    // Stop polling when leaving messages section
    if (sectionName !== 'messages') {
        stopMessagePolling();
    }
    
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
    
    // Load data for specific sections
    if (sectionName === 'calendar') {
        loadCalendar();
    } else if (sectionName === 'explore') {
        // Re-filter courses to ensure enrolled courses are hidden
        filterCourses();
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
    
    // Message input - Send with Enter key
    const messageInput = document.getElementById('messageInput');
    messageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// ===================
// STATS SECTION
// ===================

async function loadStats() {
    try {
        // Use myCourses data if already loaded
        let coursesData = myCourses;
        
        // If myCourses not loaded yet, fetch it
        if (!coursesData || coursesData.length === 0) {
            const data = await apiService.makeRequest('/classes?role=student', {
                method: 'GET'
            });
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to load stats');
            }
            
            coursesData = data.data?.classes || [];
        }
        
        // Calculate precise stats matching the progress section
        const totalEnrolled = coursesData.length;
        // Count completed based on enrollmentStatus, not class status
        const completedClasses = coursesData.filter(c => c.enrollmentStatus === 'completed').length;
        const activeCourses = coursesData.filter(c => c.status === 'active').length;
        const scheduledCourses = coursesData.filter(c => c.enrollmentStatus === 'scheduled' || (!c.enrollmentStatus && c.status === 'scheduled')).length;
        
        // Calculate overall progress as simple percentage: completed / total
        // This makes it clear: 1 of 2 classes = 50%, 2 of 2 = 100%, etc.
        const overallProgress = totalEnrolled > 0 ? Math.round((completedClasses / totalEnrolled) * 100) : 0;
        
        // Update UI with precise data
        const enrolledCoursesEl = document.getElementById('enrolledCourses');
        const completedLessonsEl = document.getElementById('completedLessons');
        const overallProgressEl = document.getElementById('overallProgress');
        const earnedCertificatesEl = document.getElementById('earnedCertificates');
        
        // Update header progress bar elements
        const headerProgressPercentage = document.getElementById('headerProgressPercentage');
        const headerProgressFill = document.getElementById('headerProgressFill');
        const activeCoursesCount = document.getElementById('activeCoursesCount');
        const completedCoursesCount = document.getElementById('completedCoursesCount');
        const scheduledCoursesCount = document.getElementById('scheduledCoursesCount');
        
        if (enrolledCoursesEl) enrolledCoursesEl.textContent = totalEnrolled;
        if (completedLessonsEl) completedLessonsEl.textContent = completedClasses;
        if (overallProgressEl) overallProgressEl.textContent = `${overallProgress}%`;
        if (earnedCertificatesEl) earnedCertificatesEl.textContent = completedClasses;
        
        // Update progress bar
        if (headerProgressPercentage) headerProgressPercentage.textContent = `${overallProgress}%`;
        if (headerProgressFill) {
            // Animate the progress bar
            setTimeout(() => {
                headerProgressFill.style.width = `${overallProgress}%`;
            }, 100);
        }
        if (activeCoursesCount) activeCoursesCount.textContent = activeCourses;
        if (completedCoursesCount) completedCoursesCount.textContent = completedClasses;
        if (scheduledCoursesCount) scheduledCoursesCount.textContent = scheduledCourses;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ===================
// COURSES SECTION (EXPLORE)
// ===================

async function loadCourses() {
    try {
        // Get ALL available classes (not just enrolled) using APIService
        const data = await apiService.makeRequest('/classes?enrolled=false', {
            method: 'GET'
        });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load courses');
        }
        
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
    
    // Filter ONLY scheduled classes (available for enrollment)
    filtered = filtered.filter(course => course.status === 'scheduled');
    
    // Filter out courses the user is already enrolled in
    const enrolledCourseIds = myCourses.map(c => c.id);
    filtered = filtered.filter(course => !enrolledCourseIds.includes(course.id));
    
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
                <p>No se encontraron cursos disponibles</p>
                <small>Intenta ajustar los filtros o buscar con otros términos</small>
            </div>
        `;
        return;
    }
    
    coursesGrid.innerHTML = filtered.map(course => {
        const isFull = course.currentStudents >= course.maxStudents;
        const isClickable = !isFull;
        
        return `
        <div class="course-card ${isClickable ? '' : 'disabled'}" 
             ${isClickable ? `onclick="enrollInCourse('${course.id}')"` : ''} 
             style="cursor: ${isClickable ? 'pointer' : 'not-allowed'}; ${!isClickable ? 'opacity: 0.6;' : ''}">
            <div class="course-image-student">
                ${getCategoryIcon(course.category)}
            </div>
            <div class="course-content-student">
                <div class="course-header-student">
                    <h3 class="course-title-student">${course.title}</h3>
                    <span class="course-category-badge">${course.category || 'General'}</span>
                </div>
                <p class="course-description-student">${course.description || 'Sin descripción'}</p>
                
                <div class="course-details-student">
                    <div class="detail-item">
                        <span class="detail-label">Instructor</span>
                        <span class="detail-value">${course.tutor?.name || 'No asignado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Duración</span>
                        <span class="detail-value">${course.duration || 60} minutos</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Capacidad</span>
                        <span class="detail-value">${course.currentStudents || 0}/${course.maxStudents || 20} estudiantes</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha programada</span>
                        <span class="detail-value">${formatDate(course.scheduledAt)}</span>
                    </div>
                </div>
                
                <div class="course-status-student">
                    ${isFull ? 
                        '<span class="status-full">Cupo lleno</span>' : 
                        '<span class="status-available">Click para inscribirse</span>'
                    }
                </div>
            </div>
        </div>
        `;
    }).join('');
}

async function enrollInCourse(courseId) {
    try {
        // Enroll using APIService
        const data = await apiService.makeRequest(`/classes/${courseId}/join`, {
            method: 'POST'
        });
        
        if (!data.success) {
            // Manejo de errores específicos
            if (data.error) {
                if (data.error.includes('already enrolled')) {
                    showNotification('Ya estás inscrito en este curso', 'info');
                    switchSection('myCourses');
                    return;
                } else if (data.error.includes('not in scheduled status')) {
                    showNotification('Este curso ya no está disponible para inscripción', 'warning');
                    // Recargar cursos para actualizar la lista
                    await loadCourses();
                    return;
                } else if (data.error.includes('full') || data.error.includes('capacity')) {
                    showNotification('El curso está lleno. No hay cupos disponibles', 'warning');
                    await loadCourses();
                    return;
                }
            }
            throw new Error(data.error || 'Failed to enroll');
        }
        
        showNotification('¡Te has inscrito exitosamente! 🎉', 'success');
        
        // Reload data en orden: primero mis cursos, luego los disponibles
        await loadMyCourses(); // Cargar primero los cursos en los que estoy inscrito
        await loadCourses();   // Luego recargar los disponibles (ya se filtrarán automáticamente)
        await loadStats();     // Finalmente actualizar estadísticas
        
        // Cambiar automáticamente a "Mis Cursos" para ver el curso
        switchSection('myCourses');
        
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
        // Get user's enrolled classes using APIService
        const data = await apiService.makeRequest('/classes', {
            method: 'GET'
        });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load my courses');
        }
        
        myCourses = data.data?.classes || [];
        console.log('📚 Loaded courses with grades:', myCourses.map(c => ({ 
            id: c.id, 
            title: c.title, 
            bestGrade: c.bestGrade 
        })));
        
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
        <div class="course-card enrolled-card">
            <div class="course-image-student">
                ${getCategoryIcon(course.category)}
            </div>
            <div class="course-content-student">
                <div class="course-header-student">
                    <h3 class="course-title-student">${course.title}</h3>
                    <span class="course-status-badge status-${course.status}">${getStatusText(course.status)}</span>
                </div>
                <span class="course-category-badge">${course.category || 'General'}</span>
                
                <div class="course-details-student">
                    <div class="detail-item">
                        <span class="detail-label">Instructor</span>
                        <span class="detail-value">${course.tutor?.name || 'No asignado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Duración</span>
                        <span class="detail-value">${course.duration || 60} minutos</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estudiantes</span>
                        <span class="detail-value">${course.currentStudents || 0} inscritos</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha programada</span>
                        <span class="detail-value">${formatDate(course.scheduledAt)}</span>
                    </div>
                </div>
                
                <div class="course-actions-student">
                    ${course.status === 'active' && course.meetingUrl ? 
                        `<a href="${course.meetingUrl}" target="_blank" class="btn-join-class">
                            <span>🎥</span> Unirse a la clase
                        </a>` : ''
                    }
                    ${hasAttendedToday(course.id) ? 
                        `<button class="btn-attendance" disabled style="background: #48bb78; cursor: not-allowed; opacity: 0.8;">
                            <span>✅</span> Asistencia Registrada
                        </button>` :
                        `<button class="btn-attendance" onclick="openAttendanceModal('${course.id}', '${course.title}')">
                            <span>📝</span> Marcar Asistencia
                        </button>`
                    }
                    ${course.enrollmentStatus === 'completed' ? 
                        `<button class="btn-game" disabled style="opacity: 0.6; cursor: not-allowed; background: #4a5568;">
                            <span>✅</span> Entregado
                        </button>` :
                        `<button class="btn-game" onclick="playGame('${course.id}', '${course.title}', '${course.difficulty || 'medium'}', '${course.category || 'General'}')">
                            <span>🎮</span> Jugar
                        </button>`
                    }
                    ${course.enrollmentStatus === 'completed' || (course.bestGradeOutOf10 && course.bestGradeOutOf10 >= 6) ? 
                        `<button class="btn-certificate" onclick="generateCourseCertificate(${JSON.stringify(course).replace(/"/g, '&quot;')})">
                            <span>🎓</span> Certificado
                        </button>` : ''
                    }
                    <button class="btn-leave-course" onclick="leaveCourse('${course.id}')">
                        <span>🚪</span> Abandonar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Verificar si el estudiante ya registró asistencia hoy para esta clase
 */
function hasAttendedToday(classId) {
    const today = new Date().toDateString();
    const attendanceKey = `attendance_${classId}_${today}`;
    return localStorage.getItem(attendanceKey) === 'true';
}

/**
 * Marcar que el estudiante asistió hoy a esta clase
 */
function markAttendedToday(classId) {
    const today = new Date().toDateString();
    const attendanceKey = `attendance_${classId}_${today}`;
    localStorage.setItem(attendanceKey, 'true');
}

// Hacer la función global
window.markAttendedToday = markAttendedToday;

async function leaveCourse(courseId) {
    if (!confirm('¿Estás seguro de que deseas abandonar este curso?')) {
        return;
    }
    
    try {
        // Leave course using APIService
        const data = await apiService.makeRequest(`/classes/${courseId}/leave`, {
            method: 'POST'
        });
        
        if (!data.success) {
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
        progressGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>No hay progreso para mostrar</p>
                <small>Inscríbete en un curso para empezar</small>
            </div>
        `;
        return;
    }
    
    // Calculate overall statistics
    const totalCourses = myCourses.length;
    const completedCourses = myCourses.filter(c => c.status === 'completed').length;
    const activeCourses = myCourses.filter(c => c.status === 'active').length;
    const scheduledCourses = myCourses.filter(c => c.status === 'scheduled').length;
    
    // Calculate precise progress for each course
    const coursesWithProgress = myCourses.map(course => {
        const scheduledDate = course.scheduledAt ? new Date(course.scheduledAt._seconds * 1000) : null;
        const enrolledDate = course.enrolledAt ? new Date(course.enrolledAt._seconds * 1000) : null;
        const now = new Date();
        
        let progress = 0;
        let daysUntilClass = null;
        let progressDetails = '';
        
        // If student has played the game and has a grade, use that as progress
        if (course.bestGradeOutOf10 !== undefined && course.bestGradeOutOf10 !== null) {
            // Use the grade out of 10 for display
            progress = course.bestGrade || 0; // Keep progress bar percentage for visual
            progressDetails = `Calificación del juego: ${course.bestGradeOutOf10}/10`;
        } else if (course.bestGrade !== undefined && course.bestGrade !== null) {
            // Fallback to old percentage-based grade if bestGradeOutOf10 doesn't exist yet
            progress = course.bestGrade;
            progressDetails = `Calificación del juego: ${(course.bestGrade / 10).toFixed(1)}/10`;
        } else if (course.status === 'completed') {
            // Course finished - 100%
            progress = 100;
            progressDetails = 'Curso completado';
        } else if (course.status === 'active') {
            // Class is happening now or already happened
            if (scheduledDate && now >= scheduledDate) {
                // Class already happened or is today - 75% (waiting for completion)
                progress = 75;
                progressDetails = 'Clase realizada - Pendiente certificación';
            } else {
                // Class is scheduled and course is active (materials available) - 25%
                progress = 25;
                progressDetails = 'Inscrito - Materiales disponibles';
            }
        } else if (course.status === 'scheduled' && scheduledDate) {
            // Calculate days until class
            const diffTime = scheduledDate - now;
            daysUntilClass = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (enrolledDate) {
                // Calculate progress based on time passed since enrollment
                const totalWaitTime = scheduledDate - enrolledDate;
                const timePassed = now - enrolledDate;
                const timeProgress = Math.min((timePassed / totalWaitTime) * 20, 20); // Max 20% before class
                progress = Math.max(5, Math.round(timeProgress)); // Minimum 5%
                progressDetails = `Esperando clase - ${daysUntilClass} ${daysUntilClass === 1 ? 'día' : 'días'}`;
            } else {
                progress = 5;
                progressDetails = 'Recién inscrito';
            }
        } else {
            // Unknown or pending status
            progress = 0;
            progressDetails = 'Pendiente';
        }
        
        return {
            ...course,
            progress,
            daysUntilClass,
            scheduledDate,
            progressDetails
        };
    });
    
    // Calculate overall progress as average of all courses
    const totalProgress = coursesWithProgress.reduce((sum, course) => sum + course.progress, 0);
    const overallProgress = Math.round(totalProgress / totalCourses);
    
    progressGrid.innerHTML = `
            ${coursesWithProgress.map(course => `
                <div class="progress-card-enhanced">
                    <div class="progress-card-header">
                        <div class="progress-card-title">
                            <h4>${course.title}</h4>
                            <span class="progress-category">${getCategoryIcon(course.category)} ${course.category || 'General'}</span>
                        </div>
                        <span class="progress-status status-${course.status}">${getStatusText(course.status)}</span>
                    </div>
                    
                    <div class="progress-card-body">
                        <div class="progress-metrics">
                            <div class="metric">
                                <span class="metric-icon">👨‍🏫</span>
                                <span class="metric-label">Instructor:</span>
                                <span class="metric-value">${course.tutor?.name || 'No asignado'}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-icon">⏱️</span>
                                <span class="metric-label">Duración:</span>
                                <span class="metric-value">${course.duration || 60} min</span>
                            </div>
                            <div class="metric">
                                <span class="metric-icon">📅</span>
                                <span class="metric-label">Fecha:</span>
                                <span class="metric-value">${formatDate(course.scheduledAt)}</span>
                            </div>
                            ${course.daysUntilClass !== null ? `
                                <div class="metric ${course.daysUntilClass <= 2 ? 'metric-urgent' : ''}">
                                    <span class="metric-icon">⏰</span>
                                    <span class="metric-label">Faltan:</span>
                                    <span class="metric-value">
                                        ${course.daysUntilClass > 0 ? 
                                            `${course.daysUntilClass} ${course.daysUntilClass === 1 ? 'día' : 'días'}` : 
                                            'Hoy'}
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="progress-bar-section">
                            ${(() => {
                                // Determinar la calificación sobre 10
                                let gradeValue = 0;
                                let statusText = 'Sin calificación - Juega para obtener puntaje';
                                let hasGrade = false;
                                
                                if (course.bestGradeOutOf10 !== undefined && course.bestGradeOutOf10 !== null) {
                                    gradeValue = course.bestGradeOutOf10;
                                    statusText = 'Puntaje obtenido en el juego';
                                    hasGrade = true;
                                } else if (course.bestGrade !== undefined && course.bestGrade !== null) {
                                    gradeValue = (course.bestGrade / 10);
                                    statusText = 'Puntaje obtenido en el juego';
                                    hasGrade = true;
                                }
                                
                                const gradeFormatted = gradeValue.toFixed(1);
                                const barWidth = (gradeValue * 10); // 0-10 -> 0-100%
                                
                                return `
                                    <div class="progress-bar-label">
                                        <span>🎯 Puntaje del Juego</span>
                                        <span class="progress-percentage ${hasGrade ? 'grade-highlight-value' : ''}" style="font-size: 18px; font-weight: 700;">
                                            ${gradeFormatted}/10
                                        </span>
                                    </div>
                                    <div class="progress-bar-container-enhanced">
                                        <div class="progress-bar-fill-enhanced ${hasGrade ? 'grade-fill' : ''}" style="width: ${barWidth}%; ${!hasGrade ? 'opacity: 0.3;' : ''}"></div>
                                    </div>
                                    <small style="color: ${hasGrade ? 'rgba(45, 212, 191, 0.8)' : 'rgba(255, 255, 255, 0.5)'}; font-size: 12px; margin-top: 5px; display: block; font-weight: ${hasGrade ? '600' : '400'};">
                                        ${statusText}
                                    </small>
                                `;
                            })()}
                        </div>
                        
                        <div class="progress-actions">
                            ${course.status === 'active' && course.meetingUrl ? 
                                `<a href="${course.meetingUrl}" target="_blank" class="btn-progress-action btn-join">
                                    <span>🎥</span> Unirse
                                </a>` : ''
                            }
                            ${course.enrollmentStatus === 'completed' ? 
                                `<button class="btn-progress-action btn-game" disabled style="opacity: 0.6; cursor: not-allowed;">
                                    <span>✅</span> Entregado
                                </button>` :
                                `<button class="btn-progress-action btn-game" onclick="playGame('${course.id}', '${course.title}', '${course.difficulty || 'medium'}', '${course.category || 'General'}')">
                                    <span>🎮</span> Practicar
                                </button>`
                            }
                            ${course.enrollmentStatus === 'completed' || (course.bestGradeOutOf10 && course.bestGradeOutOf10 >= 6) ? 
                                `<button class="btn-progress-action btn-certificate" onclick="generateCourseCertificate(${JSON.stringify(course).replace(/"/g, '&quot;')})">
                                    <span>🏆</span> Certificado
                                </button>` : ''
                            }
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ===================
// MESSAGES SECTION
// ===================

async function loadMessages() {
    try {
        // Get contacts using APIService
        const data = await apiService.makeRequest('/conversations/contacts/list', {
            method: 'GET'
        });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load contacts');
        }
        
        const contacts = data.data?.contacts || [];
        
        displayConversations(contacts);
        
    } catch (error) {
        console.error('Error loading contacts:', error);
        const conversationsList = document.getElementById('conversationsList');
        if (conversationsList) {
            conversationsList.innerHTML = '<div class="empty-state">Error al cargar contactos</div>';
        }
    }
}

function displayConversations(contacts) {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    if (contacts.length === 0) {
        conversationsList.innerHTML = '<div class="empty-state">No tienes tutores disponibles</div>';
        return;
    }
    
    conversationsList.innerHTML = contacts.map(contact => `
        <div class="conversation-item" 
             onclick="startConversation('${contact.uid}', '${contact.name}')">
            <div class="conversation-avatar">
                ${contact.avatar || contact.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div class="conversation-info">
                <div class="conversation-name">${contact.name || 'Usuario'}</div>
                <div class="conversation-last-message">${contact.email || ''}</div>
                <div class="conversation-role">${contact.role === 'tutor' ? '👨‍🏫 Tutor' : '👤 ' + contact.role}</div>
            </div>
        </div>
    `).join('');
}

async function startConversation(otherUserId, otherUserName) {
    try {
        // Get or create conversation using APIService
        const data = await apiService.makeRequest('/conversations', {
            method: 'POST',
            body: JSON.stringify({ otherUserId })
        });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to start conversation');
        }
        
        const conversationId = data.data?.conversationId;
        
        if (!conversationId) {
            throw new Error('No conversation ID returned');
        }
        
        // Update chat header with contact name
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) {
            chatHeader.style.display = 'block';
            chatHeader.innerHTML = `<h4>Chat con ${otherUserName}</h4>`;
        }
        
        // Open the conversation
        await openConversation(conversationId);
        
    } catch (error) {
        console.error('Error starting conversation:', error);
        showNotification('Error al iniciar conversación', 'error');
    }
}

async function openConversation(conversationId, isPolling = false) {
    currentConversation = conversationId;
    
    try {
        // Get messages using APIService
        const data = await apiService.makeRequest(`/conversations/${conversationId}/messages`, {
            method: 'GET'
        });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load messages');
        }
        
        const messages = data.data?.messages || [];
        
        displayMessages(messages);
        
        // Mark as read using APIService (only on initial load, not during polling)
        if (!isPolling) {
            // Store message count for polling comparison
            lastMessageCount = messages.length;
            
            apiService.makeRequest(`/conversations/${conversationId}/mark-read`, {
                method: 'PATCH'
            }).catch(err => console.error('Error marking as read:', err));
            
            // Start real-time polling
            startMessagePolling();
        }
        
    } catch (error) {
        console.error('Error loading conversation:', error);
        if (!isPolling) {
            showNotification('Error al cargar mensajes', 'error');
        }
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
        // Send message using APIService
        const data = await apiService.makeRequest(`/conversations/${currentConversation}/messages`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to send message');
        }
        
        messageInput.value = '';
        
        // Reload messages immediately after sending
        await openConversation(currentConversation, false);
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Error al enviar mensaje', 'error');
    }
}

function filterConversations(searchTerm) {
    // TODO: Implement conversation filtering
    console.log('Filtering conversations:', searchTerm);
}

// Real-time message polling
let messagePollingInterval = null;
let lastMessageCount = 0;

function startMessagePolling() {
    // Clear any existing interval
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
    
    // Poll every 3 seconds for real-time feel
    messagePollingInterval = setInterval(async () => {
        if (currentConversation) {
            try {
                const data = await apiService.makeRequest(`/conversations/${currentConversation}/messages`, {
                    method: 'GET'
                });
                
                if (data.success) {
                    const messages = data.data?.messages || [];
                    
                    // Only update if message count changed (to avoid unnecessary re-renders)
                    if (messages.length !== lastMessageCount) {
                        lastMessageCount = messages.length;
                        displayMessages(messages);
                        
                        // Scroll to bottom only if new messages arrived
                        const messagesContainer = document.getElementById('messagesContainer');
                        if (messagesContainer) {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                    }
                }
            } catch (error) {
                // Silently fail during polling to avoid console spam
            }
        }
    }, 3000); // 3 seconds for near real-time
}

function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
        lastMessageCount = 0;
    }
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
    
    try {
        let date;
        
        // Handle Firebase Timestamp object
        if (dateString._seconds) {
            date = new Date(dateString._seconds * 1000);
        } 
        // Handle Firestore Timestamp with seconds property
        else if (dateString.seconds) {
            date = new Date(dateString.seconds * 1000);
        }
        // Handle ISO string or timestamp
        else {
            date = new Date(dateString);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateString);
            return 'Fecha no válida';
        }
        
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Fecha no válida';
    }
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    
    try {
        let date;
        
        // Handle Firebase Timestamp object
        if (timestamp._seconds) {
            date = new Date(timestamp._seconds * 1000);
        } 
        // Handle Firestore Timestamp with seconds property
        else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        }
        // Handle ISO string or timestamp
        else {
            date = new Date(timestamp);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '';
        }
        
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
}

function getCategoryIcon(category) {
    const icons = {
        'matematicas': '📐',
        'ciencias': '🔬',
        'historia': '📜',
        'idiomas': '🗣️',
        'ingles': '🇬🇧',
        'español': '🇪🇸',
        'frances': '🇫🇷',
        'aleman': '🇩🇪',
        'arte': '🎨',
        'musica': '🎵',
        'tecnologia': '💻',
        'deportes': '⚽',
        'literatura': '📚',
        'quimica': '⚗️',
        'fisica': '⚛️',
        'biologia': '🧬',
        'geografia': '🌍',
        'astronomia': '🔭',
        'filosofia': '🤔',
        'economia': '💰',
        'programacion': '💻',
        'informatica': '🖥️',
        'derecho': '⚖️',
        'medicina': '⚕️',
        'psicologia': '🧠',
        'arquitectura': '🏛️',
        'ingenieria': '⚙️',
        'cocina': '👨‍🍳',
        'fotografia': '📷'
    };
    return icons[category?.toLowerCase()] || '📚';
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

// ===================
// CALENDAR FUNCTIONS
// ===================

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

async function loadCalendar() {
    renderCalendar();
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    if (!calendarGrid || !currentMonthElement) return;
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Get enrolled classes for this month
    const classesInMonth = getClassesForMonthStudent(currentYear, currentMonth);
    
    let html = '';
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Days of month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(currentYear, currentMonth, day);
        const isToday = day === today.getDate() && 
                       currentMonth === today.getMonth() && 
                       currentYear === today.getFullYear();
        
        // Check if there are classes on this day
        const classesThisDay = classesInMonth.filter(cls => {
            const classDate = getDateFromScheduleStudent(cls.scheduledAt);
            if (!classDate) return false;
            return classDate.getDate() === day;
        });
        
        let dayClass = '';
        let indicator = '';
        
        if (classesThisDay.length > 0) {
            // Determine the most critical status
            const status = getClassStatusStudent(classesThisDay, currentDate);
            dayClass = `has-class status-${status}`;
            indicator = `<span class="class-indicator ${status}"></span>`;
        }
        
        const todayClass = isToday ? 'today' : '';
        html += `<div class="calendar-day ${todayClass} ${dayClass}" onclick="showDayClassesStudent(${day}, ${currentMonth}, ${currentYear})" title="${classesThisDay.length} clase(s)">
            <span class="day-number">${day}</span>
            ${indicator}
        </div>`;
    }
    
    calendarGrid.innerHTML = html;
}

function getClassesForMonthStudent(year, month) {
    // Use myCourses instead of enrolledCourses
    if (!Array.isArray(myCourses)) {
        console.warn('myCourses is not an array:', myCourses);
        return [];
    }
    
    return myCourses.filter(course => {
        const classDate = getDateFromScheduleStudent(course.scheduledAt);
        if (!classDate) return false;
        return classDate.getFullYear() === year && classDate.getMonth() === month;
    });
}

function getDateFromScheduleStudent(scheduledAt) {
    if (!scheduledAt) return null;
    
    try {
        let date;
        if (scheduledAt._seconds) {
            date = new Date(scheduledAt._seconds * 1000);
        } else if (scheduledAt.seconds) {
            date = new Date(scheduledAt.seconds * 1000);
        } else {
            date = new Date(scheduledAt);
        }
        
        if (isNaN(date.getTime())) return null;
        date.setHours(0, 0, 0, 0);
        return date;
    } catch (error) {
        return null;
    }
}

function getClassStatusStudent(classes, currentDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Check if any class is overdue (past and not completed)
    const hasOverdue = classes.some(cls => {
        const classDate = getDateFromScheduleStudent(cls.scheduledAt);
        return classDate < now && cls.status !== 'completed' && cls.status !== 'cancelled';
    });
    
    if (hasOverdue) return 'atrasada';
    
    // Check if class is soon (within 2 days)
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    const isSoon = classes.some(cls => {
        const classDate = getDateFromScheduleStudent(cls.scheduledAt);
        return classDate >= now && classDate <= twoDaysFromNow && cls.status === 'scheduled';
    });
    
    if (isSoon) return 'próxima';
    
    // Otherwise it's open/scheduled
    return 'abierta';
}

function showDayClassesStudent(day, month, year) {
    const classesInMonth = getClassesForMonthStudent(year, month);
    const classesThisDay = classesInMonth.filter(cls => {
        const classDate = getDateFromScheduleStudent(cls.scheduledAt);
        if (!classDate) return false;
        return classDate.getDate() === day;
    });
    
    if (classesThisDay.length === 0) return;
    
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    // Update modal title
    document.getElementById('dayClassesTitle').textContent = 
        `Clases del ${day} de ${monthNames[month]} ${year}`;
    
    // Generate HTML for each class with status badge
    const classesHTML = classesThisDay.map(cls => {
        const status = getClassStatusStudent([cls]);
        const statusColors = {
            'abierta': '#10b981',
            'próxima': '#f59e0b',
            'atrasada': '#ef4444'
        };
        const statusColor = statusColors[status] || '#10b981';
        
        return `
            <div class="day-class-item">
                <div class="day-class-header">
                    <h4>${cls.title}</h4>
                    <span class="day-class-status" style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
                        ${status}
                    </span>
                </div>
                <div class="day-class-info">
                    <span>🕒 ${formatDate(cls.scheduledAt)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('dayClassesList').innerHTML = classesHTML;
    document.getElementById('dayClassesModal').style.display = 'flex';
}

function closeDayClassesModal() {
    document.getElementById('dayClassesModal').style.display = 'none';
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

// Play game function
function playGame(courseId, courseTitle, difficulty, category) {
    // Use the actual category from the course, not extracted from title
    const subject = category || 'General';
    
    // Save token to sessionStorage for the game to use
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        sessionStorage.setItem('gameAuthToken', authToken);
        console.log('✅ Token saved to sessionStorage for game');
    }
    
    // Mark that when user returns, this class should be marked as completed
    sessionStorage.setItem('pendingCompletionClassId', courseId);
    console.log('🎮 Starting game. pendingCompletionClassId set to:', courseId);
    
    // Redirect to game with parameters (use classId to match backend endpoint)
    window.location.href = `/archer-game?subject=${encodeURIComponent(subject)}&difficulty=${difficulty}&classId=${courseId}`;
}

// Complete class function
async function completeClass(classId) {
    try {
        console.log('📝 Marking class as completed:', classId);
        
        const data = await apiService.makeRequest(`/classes/${classId}/complete`, {
            method: 'POST'
        });
        
        if (data.success) {
            console.log('✅ Class marked as completed successfully');
            showNotification('¡Clase entregada! 🎉', 'success');
            
            // Reload all data to update stats and progress
            await loadMyCourses();
            await loadStats();
            await loadProgress();
        } else {
            console.warn('⚠️ Failed to mark class as completed:', data.error);
        }
    } catch (error) {
        console.error('❌ Error completing class:', error);
    }
}

// Logout function
function logout() {
    localStorage.clear();
    window.location.href = '/login';
}
