// Tutor Dashboard - API Version (No Firebase Client)
// Uses backend API exclusively for all data operations

const apiService = new APIService();

let currentTutor = null;
let currentSection = 'courses';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let myCourses = [];
let currentConversation = null;

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
    
    // Setup message input Enter key listener
    const messageInput = document.getElementById('messageInput');
    messageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Load Stats
async function loadStats() {
    try {
        // Get tutor's classes using APIService
        const data = await apiService.makeRequest('/classes', {
            method: 'GET'
        });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load stats');
        }
        
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
    
    // Stop polling when leaving messages section
    if (sectionName !== 'messages') {
        stopMessagePolling();
    }
    
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
        // Get tutor's classes using APIService
        const data = await apiService.makeRequest('/classes', {
            method: 'GET'
        });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load courses');
        }
        
        myCourses = data.data?.classes || [];
        
        console.log('📚 Courses loaded:', myCourses.length);
        // Log student counts for debugging
        myCourses.forEach(course => {
            console.log(`Course: ${course.title} - Students: ${course.currentStudents}/${course.maxStudents}`, 
                       'ID:', course.id);
        });
        
        const coursesGrid = document.getElementById('coursesGrid');
        
        if (myCourses.length === 0) {
            coursesGrid.innerHTML = '<div class="empty-state">No tienes cursos creados</div>';
            return;
        }
        
        coursesGrid.innerHTML = myCourses.map(course => `
            <div class="course-card" onclick="manageClass('${course.id}')" style="cursor: pointer;">
                <div class="course-image">
                    ${getCategoryIcon(course.category)}
                </div>
                <div class="course-content">
                    <div class="course-header">
                        <h3 class="course-title">${course.title}</h3>
                        <div class="course-badge">${course.category || 'General'}</div>
                    </div>
                    <p class="course-description">${course.description || 'Sin descripción'}</p>
                    <div class="course-meta">
                        <div class="course-meta-item">
                            👥 <span>${course.currentStudents || 0}/${course.maxStudents || 20}</span> estudiantes
                        </div>
                        <div class="course-meta-item">
                            ⏱️ <span>${course.duration || 60}</span> min
                        </div>
                        <div class="course-meta-item">
                            📅 <span>${formatDate(course.scheduledAt)}</span>
                        </div>
                    </div>
                    <div class="course-info">
                        <div class="course-stats">
                            <div class="course-stat">Estado: ${getStatusText(course.status)}</div>
                        </div>
                        <div class="course-actions">
                            <button class="btn-edit" onclick="event.stopPropagation(); editCourse('${course.id}')">Editar</button>
                            <button class="btn-delete" onclick="event.stopPropagation(); deleteCourse('${course.id}')">Eliminar</button>
                        </div>
                    </div>
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
        // Create course using APIService
        const data = await apiService.makeRequest('/classes', {
            method: 'POST',
            body: JSON.stringify(courseData)
        });
        
        if (!data.success) {
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

let currentEditingCourse = null;
let enrolledStudents = [];
let availableStudents = [];
let selectedNewStudents = new Set();

function editCourse(courseId) {
    const course = myCourses.find(c => c.id === courseId);
    
    if (!course) {
        showNotification('error', 'Curso no encontrado');
        return;
    }
    
    currentEditingCourse = course;
    
    // Populate form with current values
    document.getElementById('editCourseId').value = courseId;
    document.getElementById('editTitle').value = course.title || '';
    document.getElementById('editDescription').value = course.description || '';
    document.getElementById('editCategory').value = course.category || '';
    document.getElementById('editDuration').value = course.duration || 60;
    document.getElementById('editMaxStudents').value = course.maxStudents || 20;
    document.getElementById('editStatus').value = course.status || 'scheduled';
    
    // Update max students display
    document.getElementById('maxStudentsDisplay').textContent = course.maxStudents || 20;
    
    // Format date for datetime-local input
    if (course.scheduledAt) {
        const date = getDateFromSchedule(course.scheduledAt);
        if (date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            document.getElementById('editScheduledAt').value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    }
    
    // Load students
    loadEditStudents(courseId);
    
    // Show modal
    document.getElementById('editCourseModal').style.display = 'block';
}

async function loadEditStudents(courseId) {
    try {
        console.log('📚 Loading students for class:', courseId);
        
        // Get class details with enrolled students using APIService
        const classData = await apiService.makeRequest(`/classes/${courseId}`, {
            method: 'GET'
        });
        
        if (!classData.success) throw new Error(classData.error || 'Failed to load class details');
        
        const enrolledStudentIds = classData.data?.students || [];
        const enrolledStudentsData = classData.data?.enrolledStudents || [];
        
        console.log('👥 Enrolled student IDs:', enrolledStudentIds);
        console.log('👥 Enrolled students data:', enrolledStudentsData);
        
        // Get all users to find students using APIService
        const usersData = await apiService.makeRequest('/users?role=alumno', {
            method: 'GET'
        });
        
        if (!usersData.success) throw new Error(usersData.error || 'Failed to load users');
        
        const allUsers = usersData.users || [];
        
        console.log('📋 All students found:', allUsers.length);
        
        // Use enrolledStudents from the API if available
        enrolledStudents = enrolledStudentsData.length > 0 ? enrolledStudentsData : 
            allUsers.filter(user => enrolledStudentIds.includes(user.uid));
        
        // Available students are those NOT enrolled
        availableStudents = allUsers.filter(user => 
            !enrolledStudentIds.includes(user.uid)
        );
        
        console.log('✅ Enrolled:', enrolledStudents.length, 
                    'IDs:', enrolledStudentIds,
                    '| Available:', availableStudents.length);
        
        // Clear selected students set to avoid duplicates
        selectedNewStudents.clear();
        
        // Update counts
        document.getElementById('currentStudentsCount').textContent = enrolledStudents.length;
        document.getElementById('enrolledCount').textContent = enrolledStudents.length;
        document.getElementById('availableCount').textContent = availableStudents.length;
        document.getElementById('newStudentsCount').textContent = '0';
        
        // Render lists
        renderEnrolledStudents();
        renderAvailableStudents();
        
    } catch (error) {
        console.error('Error loading students:', error);
        showNotification('error', 'Error al cargar estudiantes: ' + error.message);
    }
}

function renderEnrolledStudents() {
    const list = document.getElementById('enrolledStudentsList');
    
    if (enrolledStudents.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No hay estudiantes inscritos en esta clase</p></div>';
        return;
    }
    
    list.innerHTML = enrolledStudents.map(student => `
        <div class="student-item enrolled">
            <div class="student-info">
                <div class="student-avatar">${student.name?.charAt(0).toUpperCase() || 'E'}</div>
                <div class="student-details">
                    <div class="student-name">${student.name || 'Sin nombre'}</div>
                    <div class="student-email">${student.email || ''}</div>
                </div>
            </div>
            <div class="student-actions">
                <button type="button" class="remove-student-btn" onclick="removeStudent('${student.uid}')" title="Quitar del curso">
                    Quitar
                </button>
            </div>
        </div>
    `).join('');
}

function renderAvailableStudents() {
    const list = document.getElementById('availableStudentsList');
    
    if (availableStudents.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>Todos los estudiantes ya están inscritos</p></div>';
        return;
    }
    
    list.innerHTML = availableStudents.map(student => `
        <div class="student-item available">
            <div class="student-info">
                <div class="student-avatar">${student.name?.charAt(0).toUpperCase() || 'E'}</div>
                <div class="student-details">
                    <div class="student-name">${student.name || 'Sin nombre'}</div>
                    <div class="student-email">${student.email || ''}</div>
                </div>
            </div>
            <div class="student-actions">
                <input type="checkbox" 
                       class="student-checkbox" 
                       value="${student.uid}"
                       onchange="toggleStudentSelection('${student.uid}')"
                       ${selectedNewStudents.has(student.uid) ? 'checked' : ''}>
            </div>
        </div>
    `).join('');
}

function switchStudentTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.student-tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    if (tab === 'enrolled') {
        document.getElementById('enrolledStudentsTab').classList.add('active');
    } else {
        document.getElementById('availableStudentsTab').classList.add('active');
    }
}

function toggleStudentSelection(studentUid) {
    if (selectedNewStudents.has(studentUid)) {
        selectedNewStudents.delete(studentUid);
        console.log('❌ Deselected student:', studentUid);
    } else {
        selectedNewStudents.add(studentUid);
        console.log('✅ Selected student:', studentUid);
    }
    
    const count = selectedNewStudents.size;
    document.getElementById('newStudentsCount').textContent = count;
    console.log(`📊 Total students selected: ${count}`);
}

function selectAllAvailable() {
    availableStudents.forEach(student => selectedNewStudents.add(student.uid));
    const count = selectedNewStudents.size;
    document.getElementById('newStudentsCount').textContent = count;
    console.log(`✅ Selected all ${availableStudents.length} available students (Total: ${count})`);
    renderAvailableStudents();
}

function deselectAllAvailable() {
    const previousCount = selectedNewStudents.size;
    selectedNewStudents.clear();
    document.getElementById('newStudentsCount').textContent = 0;
    console.log(`❌ Deselected all students (was ${previousCount}, now 0)`);
    renderAvailableStudents();
}

function filterEnrolledStudents() {
    const searchTerm = document.getElementById('searchEnrolled').value.toLowerCase();
    const items = document.querySelectorAll('#enrolledStudentsList .student-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterAvailableStudents() {
    const searchTerm = document.getElementById('searchAvailable').value.toLowerCase();
    const items = document.querySelectorAll('#availableStudentsList .student-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

async function removeStudent(studentUid) {
    if (!confirm('¿Estás seguro de quitar este estudiante del curso?\n\nPodrás agregarlo nuevamente después.')) {
        return;
    }
    
    try {
        const courseId = document.getElementById('editCourseId').value;
        
        console.log('🗑️ Removing student:', studentUid, 'from class:', courseId);
        
        // Remove student using APIService
        const result = await apiService.makeRequest(`/classes/${courseId}/remove-student`, {
            method: 'POST',
            body: JSON.stringify({ studentId: studentUid })
        });
        
        if (!result.success) {
            console.error('❌ Server error:', result);
            throw new Error(result.error || 'Failed to remove student');
        }
        
        console.log('✅ Student removed successfully:', result);
        
        showNotification('success', '✅ Estudiante quitado del curso');
        
        // Reload students to update both lists
        await loadEditStudents(courseId);
        
        // Also reload courses to update the card count
        await loadCourses();
        
        // If manage modal is open for this class, refresh its data
        if (currentManagingClass && currentManagingClass.id === courseId) {
            await refreshManageClassData();
        }
        
    } catch (error) {
        console.error('❌ Error removing student:', error);
        showNotification('error', error.message || 'Error al quitar estudiante');
    }
}

function closeEditCourseModal() {
    document.getElementById('editCourseModal').style.display = 'none';
    document.getElementById('editCourseForm').reset();
    selectedNewStudents.clear();
    enrolledStudents = [];
    availableStudents = [];
    currentEditingCourse = null;
}

// Manage Class Modal Functions
let currentManagingClass = null;
let classAttendance = [];
let classProgress = [];

async function manageClass(classId) {
    try {
        // Get class details using APIService
        const result = await apiService.makeRequest(`/classes/${classId}`, {
            method: 'GET'
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Error al cargar la clase');
        }
        
        currentManagingClass = result.data;
        
        console.log('📊 Managing class:', currentManagingClass);
        console.log('📊 Students array (IDs):', currentManagingClass.students);
        console.log('📊 Enrolled students (objects):', currentManagingClass.enrolledStudents);
        
        // Update modal header
        document.getElementById('manageClassName').textContent = currentManagingClass.title;
        
        // Update statistics - use enrolledStudents array for accurate count
        const enrolledCount = currentManagingClass.enrolledStudents?.length || 
                            currentManagingClass.students?.length || 0;
        const attendedCount = currentManagingClass.attendance?.filter(a => a.attended).length || 0;
        
        // Count students who have delivered (enrollmentStatus === 'completed')
        const completedCount = currentManagingClass.enrolledStudents?.filter(
            s => s.enrollmentStatus === 'completed'
        ).length || 0;
        
        const classStatus = getClassStatus(currentManagingClass);
        
        console.log('📊 Statistics - Enrolled:', enrolledCount, 'Attended:', attendedCount, 'Completed:', completedCount);
        
        document.getElementById('enrolledCount').textContent = enrolledCount;
        document.getElementById('attendedCount').textContent = attendedCount;
        document.getElementById('completedCount').textContent = completedCount;
        document.getElementById('classStatusBadge').textContent = classStatus;
        document.getElementById('classStatusBadge').className = `stat-value status-${classStatus.toLowerCase()}`;
        
        // Load initial tab (Attendance)
        switchManageTab('attendance');
        
        // Show modal
        document.getElementById('manageClassModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error managing class:', error);
        showNotification('error', error.message || 'Error al gestionar la clase');
    }
}

async function refreshManageClassData() {
    try {
        // Get fresh class data using APIService
        const result = await apiService.makeRequest(`/classes/${currentManagingClass.id}`, {
            method: 'GET'
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Error al recargar datos');
        }
        
        currentManagingClass = result.data;
        
        console.log('🔄 Class data refreshed');
        console.log('🔄 Enrolled students:', currentManagingClass.enrolledStudents?.length || 0);
        console.log('🔄 Students IDs:', currentManagingClass.students);
        
        // Update statistics in real-time - use enrolledStudents for accurate count
        const enrolledCount = currentManagingClass.enrolledStudents?.length || 
                            currentManagingClass.students?.length || 0;
        const attendedCount = currentManagingClass.attendance?.filter(a => a.attended).length || 0;
        
        // Count students who have delivered (enrollmentStatus === 'completed')
        const completedCount = currentManagingClass.enrolledStudents?.filter(
            s => s.enrollmentStatus === 'completed'
        ).length || 0;
        
        const classStatus = getClassStatus(currentManagingClass);
        
        console.log('🔄 Updated stats - Enrolled:', enrolledCount, 'Attended:', attendedCount, 'Completed:', completedCount);
        
        document.getElementById('enrolledCount').textContent = enrolledCount;
        document.getElementById('attendedCount').textContent = attendedCount;
        document.getElementById('completedCount').textContent = completedCount;
        document.getElementById('classStatusBadge').textContent = classStatus;
        document.getElementById('classStatusBadge').className = `stat-value status-${classStatus.toLowerCase()}`;
        
        // Reload the currently active tab to show updated data
        const activeTab = document.querySelector('.manage-tab.active');
        if (activeTab) {
            const tabText = activeTab.textContent.trim();
            if (tabText.includes('Asistencia')) {
                await loadAttendance();
            } else if (tabText.includes('Progreso')) {
                await loadProgress();
            } else if (tabText.includes('Detalles')) {
                loadClassDetails();
            }
        }
        
    } catch (error) {
        console.error('Error refreshing class data:', error);
    }
}

function closeManageClassModal() {
    document.getElementById('manageClassModal').style.display = 'none';
    currentManagingClass = null;
    classAttendance = [];
    classProgress = [];
}

function switchManageTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.manage-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[onclick="switchManageTab('${tabName}')"]`).classList.add('active');
    
    // Update content panes
    document.querySelectorAll('.manage-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabName}Pane`).classList.add('active');
    
    // Load corresponding data
    switch(tabName) {
        case 'attendance':
            loadAttendance();
            break;
        case 'progress':
            loadProgress();
            break;
        case 'details':
            loadClassDetails();
            break;
    }
}

async function loadAttendance() {
    try {
        const students = currentManagingClass.enrolledStudents || [];
        const attendance = currentManagingClass.attendance || [];
        
        const attendanceList = document.getElementById('attendanceList');
        
        if (students.length === 0) {
            attendanceList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">No hay estudiantes inscritos</p>';
            return;
        }
        
        console.log('👥 Loading attendance for', students.length, 'students');
        
        attendanceList.innerHTML = students.map(student => {
            const attendanceRecord = attendance.find(a => a.studentId === student.uid);
            const hasAttended = attendanceRecord?.attended || false;
            
            return `
                <div class="attendance-item">
                    <div class="student-info-manage">
                        <div>
                            <div class="student-name">${student.name || 'Sin nombre'}</div>
                            <div class="student-email">${student.email || ''}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <span class="status-badge ${hasAttended ? 'attended' : 'not-attended'}">
                            ${hasAttended ? 'Asistió' : 'No asistió'}
                        </span>
                        <button class="toggle-attendance" onclick="toggleAttendance('${student.uid}', ${!hasAttended})">
                            ${hasAttended ? 'Marcar ausente' : 'Marcar presente'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading attendance:', error);
        showNotification('error', 'Error al cargar asistencia');
    }
}

async function toggleAttendance(studentId, attended) {
    try {
        // Update attendance using APIService
        const result = await apiService.makeRequest(`/classes/${currentManagingClass.id}/mark-attendance`, {
            method: 'POST',
            body: JSON.stringify({
                studentId: studentId,
                attended: attended
            })
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Error al actualizar asistencia');
        }
        
        // Reload class data to get fresh statistics
        await refreshManageClassData();
        
        // Reload attendance view
        await loadAttendance();
        
        showNotification('success', attended ? 'Asistencia registrada' : 'Asistencia removida');
        
    } catch (error) {
        console.error('Error toggling attendance:', error);
        showNotification('error', error.message || 'Error al actualizar asistencia');
    }
}

async function loadProgress() {
    try {
        const students = currentManagingClass.enrolledStudents || [];
        const attendance = currentManagingClass.attendance || [];
        
        const progressList = document.getElementById('progressList');
        
        if (students.length === 0) {
            progressList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">No hay estudiantes inscritos</p>';
            return;
        }
        
        console.log('📊 Loading progress for', students.length, 'students');
        
        progressList.innerHTML = students.map(student => {
            const attendanceRecord = attendance.find(a => a.studentId === student.uid);
            const hasCompleted = attendanceRecord?.completed || false;
            const hasAttended = attendanceRecord?.attended || false;
            
            // Check enrollment status
            const isDelivered = student.enrollmentStatus === 'completed';
            const hasGrade = student.bestGradeOutOf10 !== null && student.bestGradeOutOf10 !== undefined;
            
            let progressStatus = 'not-started';
            let progressText = 'No iniciado';
            
            if (isDelivered) {
                progressStatus = 'completed';
                progressText = 'Entregado';
            } else if (hasGrade) {
                progressStatus = 'in-progress';
                progressText = 'En progreso';
            } else if (hasCompleted) {
                progressStatus = 'completed';
                progressText = 'Completado';
            } else if (hasAttended) {
                progressStatus = 'in-progress';
                progressText = 'En progreso';
            }
            
            // Format grade display
            let gradeDisplay = '';
            if (hasGrade) {
                const gradeColor = student.bestGradeOutOf10 >= 7 ? '#10b981' : 
                                  student.bestGradeOutOf10 >= 6 ? '#f59e0b' : '#ef4444';
                gradeDisplay = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px; font-weight: 700; color: ${gradeColor};">
                            ${student.bestGradeOutOf10.toFixed(1)}/10
                        </span>
                    </div>
                `;
            } else {
                gradeDisplay = `
                    <span style="color: rgba(255,255,255,0.4); font-size: 14px;">
                        Sin calificación
                    </span>
                `;
            }
            
            return `
                <div class="progress-item">
                    <div class="student-info-manage">
                        <div>
                            <div class="student-name">${student.name || 'Sin nombre'}</div>
                            <div class="student-email">${student.email || ''}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        ${gradeDisplay}
                        <span class="status-badge ${progressStatus}">
                            ${progressText}
                        </span>
                        ${!hasCompleted && hasAttended ? `
                            <button class="toggle-attendance" onclick="markAsCompleted('${student.uid}')">
                                Marcar completado
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading progress:', error);
        showNotification('error', 'Error al cargar progreso');
    }
}

async function markAsCompleted(studentId) {
    try {
        // Mark as completed using APIService
        const result = await apiService.makeRequest(`/classes/${currentManagingClass.id}/mark-completed`, {
            method: 'POST',
            body: JSON.stringify({
                studentId: studentId
            })
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Error al marcar como completado');
        }
        
        // Reload class data to get fresh statistics
        await refreshManageClassData();
        
        // Reload progress view
        await loadProgress();
        
        showNotification('success', 'Clase marcada como completada');
        
    } catch (error) {
        console.error('Error marking as completed:', error);
        showNotification('error', error.message || 'Error al marcar como completado');
    }
}

function loadClassDetails() {
    const detailsContainer = document.getElementById('classDetails');
    
    const scheduledDate = formatDate(currentManagingClass.scheduledAt);
    const createdDate = formatDate(currentManagingClass.createdAt);
    
    detailsContainer.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Título:</div>
            <div class="detail-value">${currentManagingClass.title}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Descripción:</div>
            <div class="detail-value">${currentManagingClass.description || 'Sin descripción'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Categoría:</div>
            <div class="detail-value">${currentManagingClass.category}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Fecha programada:</div>
            <div class="detail-value">${scheduledDate}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Duración:</div>
            <div class="detail-value">${currentManagingClass.duration || 60} minutos</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Capacidad máxima:</div>
            <div class="detail-value">${currentManagingClass.maxStudents || 20} estudiantes</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Estudiantes inscritos:</div>
            <div class="detail-value">${currentManagingClass.students?.length || 0}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Estado:</div>
            <div class="detail-value">${currentManagingClass.status || 'Activo'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Creada el:</div>
            <div class="detail-value">${createdDate}</div>
        </div>
    `;
}

async function submitEditCourse(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const courseId = formData.get('courseId');
    
    const courseData = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        scheduledAt: formData.get('scheduledAt'),
        duration: parseInt(formData.get('duration')) || 60,
        maxStudents: parseInt(formData.get('maxStudents')) || 20,
        status: formData.get('status')
    };
    
    try {
        console.log('📝 Updating course:', courseId, courseData);
        
        // Update class details using APIService
        const result = await apiService.makeRequest(`/classes/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(courseData)
        });
        
        if (!result.success) {
            let errorMessage = result.error || result.message || 'Error al actualizar curso';
            console.error('❌ Server error response:', result);
            throw new Error(errorMessage);
        }
        
        console.log('✅ Course updated successfully');
        
        // Add new students if any selected
        if (selectedNewStudents.size > 0) {
            console.log(`👥 Adding ${selectedNewStudents.size} new student(s)...`);
            const studentsArray = Array.from(selectedNewStudents);
            let successCount = 0;
            let errorCount = 0;
            
            for (const studentUid of studentsArray) {
                try {
                    const addResult = await apiService.makeRequest(`/classes/${courseId}/add-student`, {
                        method: 'POST',
                        body: JSON.stringify({ studentId: studentUid })
                    });
                    
                    if (addResult.success) {
                        successCount++;
                        console.log(`✅ Student ${studentUid} added successfully`);
                    } else {
                        errorCount++;
                        console.error(`❌ Failed to add student ${studentUid}:`, addResult.error);
                    }
                } catch (err) {
                    errorCount++;
                    console.error(`❌ Error adding student ${studentUid}:`, err);
                }
            }
            
            if (successCount > 0) {
                showNotification('success', `¡Curso actualizado y ${successCount} estudiante(s) agregado(s)! 🎉`);
                
                // Reload students list immediately to update UI
                await loadEditStudents(courseId);
            } else if (errorCount > 0) {
                showNotification('warning', `Curso actualizado, pero hubo errores al agregar ${errorCount} estudiante(s)`);
            }
        } else {
            showNotification('success', '¡Curso actualizado exitosamente! 🎉');
        }
        
        closeEditCourseModal();
        
        // Reload courses to update card counts
        await loadCourses();
        await loadStats();
        
        // If manage modal is open for this class, refresh its data
        if (currentManagingClass && currentManagingClass.id === courseId) {
            await refreshManageClassData();
        }
        
    } catch (error) {
        console.error('❌ Error updating course:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        showNotification('error', errorMessage || 'Error al actualizar curso');
    }
}

async function deleteCourse(courseId) {
    if (!confirm('¿Estás seguro de eliminar este curso?')) {
        return;
    }
    
    try {
        // Delete course using APIService
        const result = await apiService.makeRequest(`/classes/${courseId}`, {
            method: 'DELETE'
        });
        
        if (!result.success) {
            let errorMessage = result.error || result.message || 'Error al eliminar curso';
            throw new Error(errorMessage);
        }
        
        showNotification('success', 'Curso eliminado exitosamente 🗑️');
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
        
        // If the element doesn't exist, skip loading students
        if (!studentsTableBody) {
            console.log('ℹ️ Students table not found in this view, skipping');
            return;
        }
        
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
    
    // Get classes for this month
    const classesInMonth = getClassesForMonth(currentYear, currentMonth);
    
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
            const classDate = getDateFromSchedule(cls.scheduledAt);
            if (!classDate) return false;
            return classDate.getDate() === day;
        });
        
        let dayClass = '';
        let indicator = '';
        
        if (classesThisDay.length > 0) {
            // Determine the most critical status
            const status = getClassStatus(classesThisDay, currentDate);
            dayClass = `has-class status-${status}`;
            indicator = `<span class="class-indicator ${status}"></span>`;
        }
        
        const todayClass = isToday ? 'today' : '';
        html += `<div class="calendar-day ${todayClass} ${dayClass}" onclick="showDayClasses(${day}, ${currentMonth}, ${currentYear})" title="${classesThisDay.length} clase(s)">
            <span class="day-number">${day}</span>
            ${indicator}
        </div>`;
    }
    
    calendarGrid.innerHTML = html;
}

function getClassesForMonth(year, month) {
    return myCourses.filter(course => {
        const classDate = getDateFromSchedule(course.scheduledAt);
        if (!classDate) return false;
        return classDate.getFullYear() === year && classDate.getMonth() === month;
    });
}

function getDateFromSchedule(scheduledAt) {
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

function getClassStatus(classesOrClass, currentDate) {
    // Accept either a single class object or an array of classes.
    // Normalize input to an array for easier processing.
    let classes = [];
    if (!classesOrClass) return 'abierta';

    if (Array.isArray(classesOrClass)) {
        classes = classesOrClass;
    } else if (typeof classesOrClass === 'object') {
        classes = [classesOrClass];
    } else {
        console.warn('getClassStatus: unexpected input type', classesOrClass);
        return 'abierta';
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // If there are no classes, default to 'abierta'
    if (classes.length === 0) return 'abierta';

    // Check if any class is overdue (past and not completed)
    const hasOverdue = classes.some(cls => {
        try {
            const classDate = getDateFromSchedule(cls.scheduledAt);
            if (!classDate) return false;
            return classDate < now && cls.status !== 'completed' && cls.status !== 'cancelled';
        } catch (e) {
            return false;
        }
    });

    if (hasOverdue) return 'atrasada';

    // Check if class is soon (within 2 days)
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const isSoon = classes.some(cls => {
        try {
            const classDate = getDateFromSchedule(cls.scheduledAt);
            if (!classDate) return false;
            return classDate >= now && classDate <= twoDaysFromNow && (cls.status === 'scheduled' || cls.status === 'active');
        } catch (e) {
            return false;
        }
    });

    if (isSoon) return 'próxima';

    // Otherwise it's open/scheduled
    return 'abierta';
}

function showDayClasses(day, month, year) {
    const classesInMonth = getClassesForMonth(year, month);
    const classesThisDay = classesInMonth.filter(cls => {
        const classDate = getDateFromSchedule(cls.scheduledAt);
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
        const status = getClassStatus(cls);
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
// MESSAGES (Real-time con Firestore)
// ===================

// Flag para saber si estamos usando real-time o polling
let useRealtimeChat = false;

async function loadMessages() {
    try {
        // Intentar inicializar el chat en tiempo real
        if (window.realtimeChat) {
            useRealtimeChat = await window.realtimeChat.init();
            if (useRealtimeChat) {
                console.log('✅ Usando mensajería en tiempo real');
            }
        }

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
        conversationsList.innerHTML = '<div class="empty-state">No tienes estudiantes disponibles</div>';
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
                <div class="conversation-role">${contact.role === 'alumno' ? '👨‍🎓 Estudiante' : '👤 ' + contact.role}</div>
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
        
        // Update chat header with contact name and delete button
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) {
            chatHeader.style.display = 'flex';
            chatHeader.innerHTML = `<h4>Chat con ${otherUserName}</h4><button class="btn-delete-chat" onclick="clearChatHistory('${conversationId}')">Eliminar historial</button>`;
        }
        
        // Open the conversation
        await openConversation(conversationId);
        
    } catch (error) {
        console.error('Error starting conversation:', error);
        showNotification('error', 'Error al iniciar conversación');
    }
}

async function openConversation(conversationId, isInitialLoad = true) {
    currentConversation = conversationId;
    
    try {
        // Si tenemos real-time chat, usarlo
        if (useRealtimeChat && window.realtimeChat) {
            // Detener polling si estaba activo
            stopMessagePolling();
            
            // Suscribirse a la conversación en tiempo real
            const subscribed = window.realtimeChat.subscribeToConversation(
                conversationId,
                (messages) => {
                    displayMessages(messages);
                    // Auto-scroll al recibir nuevos mensajes
                    const messagesContainer = document.getElementById('messagesContainer');
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }
            );

            if (subscribed && isInitialLoad) {
                // Marcar como leído
                window.realtimeChat.markAsRead(conversationId);
                console.log('🔔 Escuchando mensajes en tiempo real');
            }

            // Si la suscripción falló, cargar mensajes manualmente como fallback
            if (!subscribed) {
                console.warn('⚠️ Fallback: cargando mensajes via API');
                await loadMessagesViaAPI(conversationId, isInitialLoad);
            }
        } else {
            // Modo polling (fallback)
            await loadMessagesViaAPI(conversationId, isInitialLoad);
        }
        
    } catch (error) {
        console.error('Error loading conversation:', error);
        if (isInitialLoad) {
            showNotification('error', 'Error al cargar mensajes');
        }
    }
}

// Función auxiliar para cargar mensajes via API (modo polling)
async function loadMessagesViaAPI(conversationId, isInitialLoad) {
    const data = await apiService.makeRequest(`/conversations/${conversationId}/messages`, {
        method: 'GET'
    });
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to load messages');
    }
    
    const messages = data.data?.messages || [];
    displayMessages(messages);
    
    if (isInitialLoad) {
        lastMessageCount = messages.length;
        
        apiService.makeRequest(`/conversations/${conversationId}/mark-read`, {
            method: 'PATCH'
        }).catch(err => console.error('Error marking as read:', err));
        
        // Iniciar polling como fallback
        startMessagePolling();
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
        showNotification('error', 'Selecciona una conversación primero');
        return;
    }
    
    const messageInput = document.getElementById('messageInput');
    const text = messageInput?.value?.trim();
    
    if (!text) {
        return;
    }
    
    try {
        // Limpiar input inmediatamente para mejor UX
        messageInput.value = '';

        // Si tenemos real-time, el mensaje aparecerá automáticamente via listener
        if (useRealtimeChat && window.realtimeChat) {
            await window.realtimeChat.sendMessage(currentConversation, text);
            // El listener de Firestore actualizará los mensajes automáticamente
            console.log('✉️ Mensaje enviado (real-time)');
        } else {
            // Modo polling: enviar y recargar
            const data = await apiService.makeRequest(`/conversations/${currentConversation}/messages`, {
                method: 'POST',
                body: JSON.stringify({ text })
            });
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to send message');
            }
            
            // Recargar mensajes
            await openConversation(currentConversation, false);
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('error', 'Error al enviar mensaje');
        // Restaurar el texto si falló
        messageInput.value = text;
    }
}

function filterConversations(searchTerm) {
    // TODO: Implement conversation filtering
    console.log('Filtering conversations:', searchTerm);
}

// Real-time message polling (fallback cuando Firestore no está disponible)
let messagePollingInterval = null;
let lastMessageCount = 0;

function startMessagePolling() {
    // Si estamos usando real-time, no necesitamos polling
    if (useRealtimeChat && window.realtimeChat?.isRealtime()) {
        console.log('⏭️ Polling omitido - usando real-time');
        return;
    }

    // Clear any existing interval
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
    
    console.log('🔄 Iniciando polling (fallback mode)');
    
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
        console.log('⏹️ Polling detenido');
    }
    
    // También limpiar el listener de real-time si existe
    if (window.realtimeChat) {
        window.realtimeChat.unsubscribeFromConversation();
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

function getStatusText(status) {
    const statusMap = {
        'scheduled': 'Programado',
        'active': 'En curso',
        'completed': 'Completado',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

function getCategoryIcon(category) {
    const icons = {
        'matematicas': '📐',
        'ciencias': '🔬',
        'historia': '📜',
        'idiomas': '🗣️',
        'arte': '🎨',
        'musica': '🎵',
        'tecnologia': '💻',
        'deportes': '⚽',
        'literatura': '📚',
        'quimica': '⚗️',
        'fisica': '⚛️',
        'biologia': '🧬',
        'geografia': '🌍',
        'filosofia': '🤔',
        'economia': '💰'
    };
    return icons[category?.toLowerCase()] || '📚';
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

// Clear chat history function
async function clearChatHistory(conversationId) {
    if (!conversationId) {
        showNotification('warning', 'No hay conversación activa');
        return;
    }

    // Confirm before deleting
    const confirmed = confirm('¿Estás seguro de que quieres eliminar todo el historial de este chat? Esta acción no se puede deshacer.');
    
    if (!confirmed) return;

    try {
        const response = await apiService.makeRequest(`/conversations/${conversationId}/messages`, {
            method: 'DELETE'
        });

        if (response && response.success) {
            showNotification('success', 'Historial de chat eliminado');
            
            // Clear messages display
            const messagesContainer = document.getElementById('messagesContainer');
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="no-messages">
                        <p>💬 No hay mensajes. ¡Inicia la conversación!</p>
                    </div>
                `;
            }
            
            // Reload conversations list to update last message
            await loadMessages();
        } else {
            const errorMsg = response?.error || 'Error al eliminar historial';
            throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
        }
    } catch (error) {
        console.error('Error clearing chat history:', error);
        showNotification('error', error.message || 'Error al eliminar historial');
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/login';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeTutorDashboard);

// ===========================================
// CREATE CLASS MODAL FUNCTIONS
// ===========================================

let selectedSubjectData = null;
let selectedStudents = [];
let allStudents = [];

// Open Create Course Modal
function openCreateCourseModal() {
    const modal = document.getElementById('createCourseModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
    resetCreateClassForm();
    loadAvailableStudents();
    
    // Close modal when clicking outside
    setTimeout(() => {
        modal.onclick = function(event) {
            if (event.target === modal) {
                closeCreateCourseModal();
            }
        };
    }, 100);
    
    // Close modal with Escape key
    document.addEventListener('keydown', handleEscapeKey);
}

// Close Create Course Modal
function closeCreateCourseModal() {
    const modal = document.getElementById('createCourseModal');
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.style.overflow = 'auto'; // Restore body scroll
    modal.onclick = null; // Remove event listener
    document.removeEventListener('keydown', handleEscapeKey);
    resetCreateClassForm();
}

// Handle Escape Key
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeCreateCourseModal();
    }
}

// Reset Form
function resetCreateClassForm() {
    document.getElementById('createCourseForm').reset();
    selectedSubjectData = null;
    selectedStudents = [];
    
    // Reset to step 1
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.getElementById('step1').classList.add('active');
    
    // Deselect all subjects
    document.querySelectorAll('.subject-card').forEach(card => card.classList.remove('selected'));
    
    // Disable next button
    document.getElementById('btnStep1').disabled = true;
}

// Select Subject
function selectSubject(id, icon, name) {
    // Deselect all
    document.querySelectorAll('.subject-card').forEach(card => card.classList.remove('selected'));
    
    // Select clicked
    event.target.closest('.subject-card').classList.add('selected');
    
    // Store selection
    selectedSubjectData = { id, icon, name };
    
    // Update hidden fields
    document.getElementById('selectedSubject').value = id;
    document.getElementById('selectedSubjectIcon').value = icon;
    
    // Enable next button
    document.getElementById('btnStep1').disabled = false;
}

// Next Step
function nextStep(stepNumber) {
    // Validate current step
    if (stepNumber === 2) {
        if (!selectedSubjectData) {
            showNotification('error', 'Por favor selecciona una materia');
            return;
        }
        
        // Show selected subject in step 2
        const display = document.getElementById('selectedSubjectDisplay');
        const iconHtml = selectedSubjectData.icon.length > 2 
            ? `<div class="subject-text">${selectedSubjectData.icon}</div>`
            : `<div class="subject-icon">${selectedSubjectData.icon}</div>`;
        
        display.innerHTML = `
            ${iconHtml}
            <div>
                <div class="subject-name">${selectedSubjectData.name}</div>
                <small style="color: rgba(255,255,255,0.6);">Materia seleccionada</small>
            </div>
        `;
    }
    
    if (stepNumber === 3) {
        // Validate step 2 fields
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const difficulty = document.getElementById('difficulty').value;
        const deadline = document.getElementById('deadline').value;
        
        if (!title || !description || !difficulty || !deadline) {
            showNotification('error', 'Por favor completa todos los campos obligatorios');
            return;
        }
        
        // Validate deadline is in the future
        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            showNotification('error', 'La fecha límite debe ser en el futuro');
            return;
        }
    }
    
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    
    // Show target step
    document.getElementById(`step${stepNumber}`).classList.add('active');
}

// Previous Step
function previousStep(stepNumber) {
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step${stepNumber}`).classList.add('active');
}

// Load Available Students
async function loadAvailableStudents() {
    const studentsList = document.getElementById('studentsList');
    studentsList.innerHTML = '<div class="loading">Cargando estudiantes</div>';
    
    try {
        const token = localStorage.getItem('authToken');
        
        console.log('🔄 Loading students from /api/users...');
        
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server error:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Received data:', data);
        
        // Filter only students (not tutors or admins)
        allStudents = data.users?.filter(user => 
            user.role === 'alumno' || user.role === 'student'
        ) || [];
        
        console.log('👥 Found', allStudents.length, 'students');
        
        if (allStudents.length === 0) {
            studentsList.innerHTML = '<div class="empty-state">⚠️ No hay estudiantes disponibles<br><small>Asegúrate de que existan usuarios con rol "alumno"</small></div>';
            return;
        }
        
        renderStudentsList(allStudents);
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
        studentsList.innerHTML = `
            <div class="empty-state">
                ⚠️ Error al cargar estudiantes<br>
                <small>${error.message}</small><br>
                <small style="margin-top:10px;display:block;">Verifica que el servidor backend esté ejecutándose</small>
            </div>
        `;
        showNotification('error', 'No se pudieron cargar los estudiantes. Verifica el servidor backend.');
    }
}

// Render Students List
function renderStudentsList(students) {
    const studentsList = document.getElementById('studentsList');
    
    if (students.length === 0) {
        studentsList.innerHTML = '<div class="empty-state">No se encontraron estudiantes</div>';
        return;
    }
    
    studentsList.innerHTML = students.map(student => {
        const initials = (student.name || student.email)
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        const isSelected = selectedStudents.includes(student.uid || student.id);
        
        return `
            <div class="student-item ${isSelected ? 'selected' : ''}" onclick="toggleStudent('${student.uid || student.id}')">
                <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleStudent('${student.uid || student.id}')">
                <div class="student-avatar">${initials}</div>
                <div class="student-info">
                    <div class="student-name">${student.name || 'Sin nombre'}</div>
                    <div class="student-email">${student.email}</div>
                </div>
            </div>
        `;
    }).join('');
    
    updateSelectedCount();
}

// Toggle Student Selection
function toggleStudent(studentId) {
    const index = selectedStudents.indexOf(studentId);
    
    if (index > -1) {
        selectedStudents.splice(index, 1);
    } else {
        selectedStudents.push(studentId);
    }
    
    renderStudentsList(allStudents);
}

// Select All Students
function selectAllStudents() {
    selectedStudents = allStudents.map(s => s.uid || s.id);
    renderStudentsList(allStudents);
}

// Deselect All Students
function deselectAllStudents() {
    selectedStudents = [];
    renderStudentsList(allStudents);
}

// Filter Students
function filterStudents() {
    const searchTerm = document.getElementById('searchStudents').value.toLowerCase();
    
    const filtered = allStudents.filter(student => {
        const name = (student.name || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
    });
    
    renderStudentsList(filtered);
}

// Update Selected Count
function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = selectedStudents.length;
}

// Submit Create Course
async function submitCreateCourse(event) {
    event.preventDefault();
    
    // Students are now optional - they can join later
    const formData = {
        subject: document.getElementById('selectedSubject').value,
        subjectIcon: document.getElementById('selectedSubjectIcon').value,
        subjectName: selectedSubjectData.name,
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        difficulty: document.getElementById('difficulty').value,
        deadline: document.getElementById('deadline').value,
        objectives: document.getElementById('objectives').value.trim() || '',
        assignedStudents: selectedStudents, // Can be empty array
        tutorId: currentTutor.id,
        tutorName: currentTutor.name,
        status: 'scheduled',
        createdAt: new Date().toISOString()
    };
    
    console.log('Creating class with data:', formData);
    
    try {
        // Use APIService
        const data = await apiService.makeRequest('/classes', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (!data.success) {
            throw new Error(data.error || 'Error al crear la clase');
        }
        
        const message = selectedStudents.length > 0 
            ? `✅ Clase creada exitosamente con ${selectedStudents.length} estudiante(s)` 
            : '✅ Clase creada exitosamente. Los estudiantes podrán inscribirse.';
        
        showNotification('success', message);
        closeCreateCourseModal();
        
        // Reload courses
        await loadCourses();
        await loadStats();
        
    } catch (error) {
        console.error('Error creating class:', error);
        showNotification('error', error.message || 'Error al crear la clase');
    }
}
