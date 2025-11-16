// Attendance System JavaScript - ClassGo
// Sistema completo de asistencias con RFID

class AttendanceSystem {
    constructor() {
        this.apiService = new APIService();
        this.currentClassId = null;
        this.attendances = [];
        this.selectedDate = null;
        
        this.init();
    }

    async init() {
        // Verificar autenticación
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        this.apiService.setAuthToken(token);
        await this.loadUserClasses();
        this.setupEventListeners();
        
        // Iniciar polling para actualizaciones en tiempo real
        this.startRealtimeUpdates();
    }

    // ============= CARGA DE DATOS =============

    async loadUserClasses() {
        try {
            const response = await this.apiService.request('/classes');
            
            console.log('📚 Response from /classes:', response);
            
            // Intentar diferentes estructuras de respuesta
            let classes = null;
            
            if (response.success && response.data && response.data.classes) {
                // Estructura: { success: true, data: { classes: [...] } }
                classes = response.data.classes;
                console.log('✅ Found classes in response.data.classes');
            } else if (response.success && response.classes) {
                // Estructura: { success: true, classes: [...] }
                classes = response.classes;
                console.log('✅ Found classes in response.classes');
            } else if (Array.isArray(response.classes)) {
                classes = response.classes;
                console.log('⚠️ Found classes array (no success flag)');
            } else if (Array.isArray(response)) {
                classes = response;
                console.log('⚠️ Response is directly an array');
            }
            
            if (classes && Array.isArray(classes) && classes.length > 0) {
                console.log('✅ Classes found:', classes.length);
                this.renderClassSelector(classes);
            } else {
                console.error('❌ No classes found');
                this.showError('No tienes clases disponibles');
            }
        } catch (error) {
            console.error('Error cargando clases:', error);
            this.showError('Error al cargar las clases');
        }
    }

    renderClassSelector(classes) {
        const select = document.getElementById('classSelect');
        
        if (!select) {
            console.error('❌ Element #classSelect not found!');
            return;
        }
        
        console.log('🎯 Rendering classes:', classes);
        select.innerHTML = '<option value="">Selecciona una clase...</option>';
        
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            // Usar title o name, y subject o category
            const className = cls.title || cls.name || 'Clase sin nombre';
            const subject = cls.subject || cls.category || 'Sin materia';
            option.textContent = `${className} - ${subject}`;
            select.appendChild(option);
            console.log('➕ Added class:', className);
        });
        
        console.log('✅ Class selector updated with', classes.length, 'classes');
    }

    async loadAttendances(classId, date = null) {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('statsSection').style.display = 'none';
        document.getElementById('attendanceSection').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';

        try {
            const url = date 
                ? `/attendance/class/${classId}?date=${date}`
                : `/attendance/class/${classId}`;
                
            const response = await this.apiService.request(url);

            document.getElementById('loadingState').style.display = 'none';

            // 🔒 Manejar errores de autenticación (403 Forbidden)
            if (response.status === 403 || response.status === 401) {
                console.warn('⚠️ Error de autenticación al cargar asistencias');
                document.getElementById('emptyState').style.display = 'block';
                document.getElementById('emptyState').innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <h2>⚠️ Error de Autenticación</h2>
                        <p>No se pudieron cargar las asistencias. Tu sesión podría haber expirado.</p>
                        <button onclick="window.location.href='login.html'" class="btn-primary" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Volver a iniciar sesión
                        </button>
                    </div>
                `;
                return;
            }

            // 🔧 Manejar error de índice faltante en Firestore
            if (response.error === 'MISSING_INDEX') {
                console.warn('⚠️ Falta crear índice en Firestore');
                document.getElementById('emptyState').style.display = 'block';
                document.getElementById('emptyState').innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <h2>🔧 Configuración Requerida</h2>
                        <p style="margin: 1rem 0;">Necesitas crear un índice en Firestore para poder consultar las asistencias.</p>
                        <p style="font-size: 0.9rem; color: #888; margin-bottom: 1rem;">
                            ${response.hint || 'Revisa la consola del servidor para obtener el link de creación.'}
                        </p>
                        ${response.indexUrl && response.indexUrl !== 'Ver consola del servidor para el link' ? 
                            `<a href="${response.indexUrl}" target="_blank" class="btn-primary" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--primary-color); color: white; text-decoration: none; border-radius: 8px;">
                                Crear Índice en Firebase
                            </a>` : 
                            '<p style="color: #ff6b6b;">Revisa la consola del servidor para el link</p>'
                        }
                    </div>
                `;
                return;
            }

            if (response.success) {
                this.attendances = response.attendances || [];
                this.renderStats(response.stats);
                this.renderAttendances();
                
                document.getElementById('statsSection').style.display = 'grid';
                document.getElementById('filterSection').style.display = 'block';
                
                if (this.attendances.length === 0) {
                    document.getElementById('emptyState').style.display = 'block';
                } else {
                    document.getElementById('attendanceSection').style.display = 'block';
                }
            } else {
                this.showError(response.message || 'Error al cargar asistencias');
            }
        } catch (error) {
            document.getElementById('loadingState').style.display = 'none';
            console.error('Error cargando asistencias:', error);
            this.showError('Error al cargar las asistencias');
        }
    }

    // ============= RENDERIZADO =============

    renderStats(stats) {
        document.getElementById('statTotal').textContent = stats.total || 0;
        document.getElementById('statPresent').textContent = stats.present || 0;
        document.getElementById('statAbsent').textContent = stats.absent || 0;
        document.getElementById('statPercentage').textContent = `${stats.percentage || 0}%`;
    }

    renderAttendances() {
        const grid = document.getElementById('attendanceGrid');
        grid.innerHTML = '';

        if (this.attendances.length === 0) {
            return;
        }

        this.attendances.forEach(attendance => {
            const card = this.createAttendanceCard(attendance);
            grid.appendChild(card);
        });
    }

    createAttendanceCard(attendance) {
        const card = document.createElement('div');
        card.className = 'attendance-card';
        
        const initial = attendance.studentName ? attendance.studentName.charAt(0).toUpperCase() : '?';
        const date = new Date(attendance.date);
        const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });

        card.innerHTML = `
            <div class="attendance-info">
                <div class="student-avatar">${initial}</div>
                <div class="student-details">
                    <h3>${attendance.studentName || 'Desconocido'}</h3>
                    <p>📅 ${dateStr} a las ${timeStr}</p>
                </div>
            </div>
            <div class="attendance-status status-${attendance.status || 'present'}">
                ${attendance.status === 'present' ? '✅ Presente' : '❌ Ausente'}
            </div>
        `;

        return card;
    }

    // ============= VINCULAR TARJETA =============

    async openLinkCardModal() {
        if (!this.currentClassId) {
            this.showError('Primero selecciona una clase');
            return;
        }

        // Cargar estudiantes de la clase
        try {
            const response = await this.apiService.request(`/classes/${this.currentClassId}`);
            
            console.log('🔍 Response for class details:', response);
            console.log('🔍 response.data:', response.data);
            console.log('🔍 response.data.class:', response.data?.class);
            
            // 🔒 Manejar errores de autenticación
            if (response.status === 403 || response.status === 401) {
                console.warn('⚠️ Error de autenticación');
                this.showError('Error de autenticación. Por favor recarga la página e inicia sesión de nuevo.');
                return;
            }
            
            // Manejar diferentes estructuras de respuesta
            let classData = null;
            
            // Si response.data ES el objeto de la clase directamente
            if (response.success && response.data && !response.data.class) {
                classData = response.data;
                console.log('✅ Using response.data directly');
            } else if (response.success && response.data && response.data.class) {
                classData = response.data.class;
                console.log('✅ Using response.data.class');
            } else if (response.success && response.class) {
                classData = response.class;
                console.log('✅ Using response.class');
            } else if (response.class) {
                classData = response.class;
                console.log('✅ Using response.class (no success flag)');
            }
            
            console.log('📚 Class data:', classData);
            
            if (classData) {
                const students = classData.students || [];
                console.log('👥 Students in class:', students);
                await this.loadStudentsList(students);
                
                const modal = document.getElementById('linkCardModal');
                if (modal) {
                    modal.classList.add('active');
                    console.log('✅ Modal opened');
                    
                    // Iniciar escucha de tarjetas RFID desde Arduino Bridge
                    this.startCardDetection();
                } else {
                    console.error('❌ Modal element not found!');
                }
            } else {
                this.showError('No se pudieron cargar los datos de la clase');
            }
        } catch (error) {
            console.error('Error cargando estudiantes:', error);
            this.showError('Error al cargar estudiantes');
        }
    }

    /**
     * Iniciar detección automática de tarjetas desde Arduino Bridge
     */
    startCardDetection() {
        console.log('🔍 Iniciando detección de tarjetas RFID...');
        
        // Polling cada 1 segundo para verificar nuevas lecturas
        this.cardDetectionInterval = setInterval(async () => {
            try {
                // Intentar obtener el último UID detectado del Arduino Bridge
                const response = await fetch('http://localhost:3001/status');
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Si hay un UID nuevo detectado
                    if (data.lastUid && data.lastUid !== this.lastDetectedUid) {
                        console.log('🔖 Nueva tarjeta detectada:', data.lastUid);
                        this.lastDetectedUid = data.lastUid;
                        
                        // Autocompletar el campo de UID
                        const rfidInput = document.getElementById('rfidInput');
                        if (rfidInput) {
                            rfidInput.value = data.lastUid;
                            
                            // Feedback visual
                            rfidInput.style.backgroundColor = '#48bb78';
                            rfidInput.style.color = 'white';
                            setTimeout(() => {
                                rfidInput.style.backgroundColor = '';
                                rfidInput.style.color = '';
                            }, 1000);
                            
                            console.log('✅ UID autocompletado en el campo');
                        }
                    }
                }
            } catch (error) {
                // Silenciar errores de conexión (Arduino Bridge puede no estar corriendo)
                console.debug('Arduino Bridge no disponible');
            }
        }, 1000);
    }

    /**
     * Detener detección de tarjetas
     */
    stopCardDetection() {
        if (this.cardDetectionInterval) {
            clearInterval(this.cardDetectionInterval);
            this.cardDetectionInterval = null;
            this.lastDetectedUid = null;
            console.log('🛑 Detección de tarjetas detenida');
        }
    }

    async loadStudentsList(studentIds) {
        const select = document.getElementById('studentSelect');
        select.innerHTML = '<option value="">Selecciona un estudiante...</option>';

        try {
            // Cargar todos los usuarios de una vez
            const response = await this.apiService.request('/users');
            
            if (response.success && response.users) {
                const allUsers = response.users;
                
                // Filtrar solo los estudiantes que están en esta clase
                const studentsInClass = allUsers.filter(user => 
                    studentIds.includes(user.uid) && 
                    (user.role === 'student' || user.role === 'alumno')
                );
                
                console.log('👥 Found students:', studentsInClass);
                
                studentsInClass.forEach(student => {
                    const option = document.createElement('option');
                    option.value = student.uid;
                    const fullName = `${student.name || ''} ${student.lastName || ''}`.trim() || student.email;
                    option.textContent = fullName;
                    option.dataset.rfidUid = student.rfidUid || '';
                    
                    // Indicar si ya tiene tarjeta vinculada
                    if (student.rfidUid) {
                        option.textContent += ` 🔗 (${student.rfidUid})`;
                    }
                    
                    select.appendChild(option);
                });
                
                if (studentsInClass.length === 0) {
                    select.innerHTML = '<option value="">No hay estudiantes en esta clase</option>';
                }
            }
        } catch (error) {
            console.error('Error cargando lista de estudiantes:', error);
            select.innerHTML = '<option value="">Error al cargar estudiantes</option>';
        }
    }

    closeLinkCardModal() {
        const modal = document.getElementById('linkCardModal');
        modal.classList.remove('active');
        document.getElementById('studentSelect').value = '';
        document.getElementById('rfidInput').value = '';
        
        // Detener detección de tarjetas
        this.stopCardDetection();
    }

    async linkCard() {
        const studentId = document.getElementById('studentSelect').value;
        const rfidUid = document.getElementById('rfidInput').value.trim();

        if (!studentId) {
            this.showError('Selecciona un estudiante');
            return;
        }

        if (!rfidUid) {
            this.showError('Ingresa el UID de la tarjeta');
            return;
        }

        // Validar formato UID (XX:XX:XX:XX)
        const uidRegex = /^[0-9A-Fa-f]{1,2}(:[0-9A-Fa-f]{1,2})*$/;
        if (!uidRegex.test(rfidUid)) {
            this.showError('Formato de UID inválido. Ejemplo: 13:C9:46:14');
            return;
        }

        try {
            const response = await this.apiService.request('/attendance/link-card', {
                method: 'POST',
                body: JSON.stringify({ userId: studentId, rfidUid })
            });

            if (response.success) {
                this.showNotification('Tarjeta vinculada exitosamente', '✅');
                this.closeLinkCardModal();
            } else {
                this.showError(response.message || 'Error al vincular tarjeta');
            }
        } catch (error) {
            console.error('Error vinculando tarjeta:', error);
            this.showError('Error al vincular la tarjeta');
        }
    }

    // ============= FILTROS =============

    filterByDate() {
        const dateInput = document.getElementById('dateFilter');
        const date = dateInput.value;

        if (!date) {
            this.showError('Selecciona una fecha');
            return;
        }

        this.selectedDate = date;
        this.loadAttendances(this.currentClassId, date);
    }

    clearFilter() {
        document.getElementById('dateFilter').value = '';
        this.selectedDate = null;
        this.loadAttendances(this.currentClassId);
    }

    // ============= ACTUALIZACIONES EN TIEMPO REAL =============

    startRealtimeUpdates() {
        // Polling cada 10 segundos para detectar nuevas asistencias
        this.pollInterval = setInterval(() => {
            if (this.currentClassId) {
                this.checkNewAttendances();
            }
        }, 10000);
    }

    async checkNewAttendances() {
        if (!this.currentClassId) return;

        try {
            const url = this.selectedDate 
                ? `/attendance/class/${this.currentClassId}?date=${this.selectedDate}`
                : `/attendance/class/${this.currentClassId}`;
                
            const response = await this.apiService.request(url);

            if (response.success && response.attendances) {
                const newAttendances = response.attendances.filter(att => 
                    !this.attendances.some(existing => existing.id === att.id)
                );

                if (newAttendances.length > 0) {
                    // Actualizar lista
                    this.attendances = response.attendances;
                    this.renderStats(response.stats);
                    this.renderAttendances();
                    
                    // Mostrar notificación
                    newAttendances.forEach(att => {
                        this.showNotification(
                            `${att.studentName} registró su asistencia`,
                            '✅'
                        );
                    });

                    // Reproducir sonido
                    this.playNotificationSound();
                }
            }
        } catch (error) {
            // Silencioso - no mostrar error en polling
            console.log('Polling error:', error);
        }
    }

    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYII2OdVJNhMgU=');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (error) {
            // Silencioso
        }
    }

    // ============= NOTIFICACIONES Y ERRORES =============

    showNotification(message, icon = '✅') {
        const notification = document.getElementById('attendanceNotification');
        const title = document.getElementById('notificationTitle');
        const msg = document.getElementById('notificationMessage');
        const iconEl = notification.querySelector('.notification-icon');

        iconEl.textContent = icon;
        title.textContent = icon === '✅' ? 'Asistencia Registrada' : 'Notificación';
        msg.textContent = message;

        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    showError(message) {
        const notification = document.getElementById('attendanceNotification');
        const title = document.getElementById('notificationTitle');
        const msg = document.getElementById('notificationMessage');
        const iconEl = notification.querySelector('.notification-icon');
        
        iconEl.textContent = '❌';
        title.textContent = 'Error';
        msg.textContent = message;
        
        notification.style.borderColor = '#ef4444';
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
            notification.style.borderColor = '#10b981';
        }, 4000);
    }

    // ============= EVENT LISTENERS =============

    setupEventListeners() {
        // Selector de clase
        document.getElementById('classSelect').addEventListener('change', (e) => {
            this.currentClassId = e.target.value;
            if (this.currentClassId) {
                this.loadAttendances(this.currentClassId);
            }
        });

        // Botón vincular tarjeta
        document.getElementById('btnLinkCard').addEventListener('click', () => {
            this.openLinkCardModal();
        });

        // Modal
        document.getElementById('btnCloseModal').addEventListener('click', () => {
            this.closeLinkCardModal();
        });

        document.getElementById('btnCancelLink').addEventListener('click', () => {
            this.closeLinkCardModal();
        });

        document.getElementById('btnSaveLink').addEventListener('click', () => {
            this.linkCard();
        });

        // Cerrar modal al hacer click fuera
        document.getElementById('linkCardModal').addEventListener('click', (e) => {
            if (e.target.id === 'linkCardModal') {
                this.closeLinkCardModal();
            }
        });

        // Filtros
        document.getElementById('btnFilter').addEventListener('click', () => {
            this.filterByDate();
        });

        document.getElementById('btnClearFilter').addEventListener('click', () => {
            this.clearFilter();
        });

        // Auto-llenar UID si el estudiante ya tiene tarjeta vinculada
        document.getElementById('studentSelect').addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const existingUid = selectedOption.dataset.rfidUid;
            
            if (existingUid) {
                document.getElementById('rfidInput').value = existingUid;
            } else {
                document.getElementById('rfidInput').value = '';
            }
        });
    }

    // ============= CLEANUP =============

    destroy() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.attendanceSystem = new AttendanceSystem();
});

// Limpiar al salir
window.addEventListener('beforeunload', () => {
    if (window.attendanceSystem) {
        window.attendanceSystem.destroy();
    }
});
