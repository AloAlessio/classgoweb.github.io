// ===================================
// SISTEMA DE AUTO-REGISTRO DE ASISTENCIA
// Para estudiantes - Pasan tarjeta RFID
// ===================================

let currentAttendanceClassId = null;
let currentAttendanceClassName = null;
let attendanceCheckInterval = null;
let lastAttendanceCount = 0;

// Configuración del Arduino Bridge (IP local)
let ARDUINO_BRIDGE_URL = localStorage.getItem('arduinoBridgeURL') || null;

/**
 * Abrir modal de asistencia
 */
async function openAttendanceModal(classId, className) {
    currentAttendanceClassId = classId;
    currentAttendanceClassName = className;
    lastAttendanceCount = 0;
    
    // Mostrar modal primero
    const modal = document.getElementById('attendanceModal');
    const classNameElement = document.getElementById('attendanceClassName');
    
    classNameElement.textContent = className;
    modal.classList.add('active');
    
    // Resetear estados
    showWaitingState();
    
    // Verificar si ya hay una URL configurada
    if (!ARDUINO_BRIDGE_URL) {
        console.log('⚙️ No hay URL configurada, solicitando al usuario...');
        try {
            await promptForArduinoBridge();
        } catch (error) {
            console.error('❌ Usuario canceló la configuración');
            showErrorState('Necesitas configurar el lector RFID para registrar asistencia');
            return;
        }
    } else {
        // Verificar que la URL guardada sigue funcionando
        console.log('🔍 Verificando conexión con:', ARDUINO_BRIDGE_URL);
        try {
            await testArduinoBridgeConnection(ARDUINO_BRIDGE_URL);
            console.log('✅ Conexión verificada correctamente');
        } catch (error) {
            console.warn('⚠️ La URL guardada no responde, solicitando nueva configuración');
            ARDUINO_BRIDGE_URL = null;
            localStorage.removeItem('arduinoBridgeURL');
            try {
                await promptForArduinoBridge();
            } catch (error) {
                showErrorState('No se pudo conectar al lector RFID');
                return;
            }
        }
    }
    
    // Intentar configurar el Arduino Bridge automáticamente
    const bridgeConfigured = await configureArduinoBridge(classId);
    
    if (!bridgeConfigured) {
        console.log('⚠️ No se pudo configurar Arduino Bridge automáticamente');
    }
    
    // Iniciar escucha de tarjetas RFID desde Arduino Bridge
    startCardDetectionForAttendance();
    
    console.log('📝 Modal de asistencia abierto para clase:', classId);
}

/**
 * Escuchar detección de tarjetas RFID desde Arduino Bridge
 * Cuando detecte una tarjeta, registrar asistencia automáticamente
 */
function startCardDetectionForAttendance() {
    console.log('🔍 Iniciando escucha de tarjetas RFID...');
    console.log('📡 Conectando a Arduino Bridge:', ARDUINO_BRIDGE_URL);
    
    let lastProcessedDetection = 0;
    let lastProcessedRejection = 0;
    
    // Polling cada 300ms para detectar tarjetas RÁPIDAMENTE
    attendanceCheckInterval = setInterval(async () => {
        try {
            // Intentar obtener estado del Arduino Bridge
            const response = await fetch(`${ARDUINO_BRIDGE_URL}/status`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                
                console.log('🔍 Bridge status:', {
                    cardDetected: data.cardDetected,
                    cardRejected: data.cardRejected,
                    lastUid: data.lastUid,
                    rejectedUid: data.rejectedUid,
                    detectionTime: data.lastDetectionTime,
                    rejectionTime: data.lastRejectionTime
                });
                
                // PRIORIDAD 1: Si hay una tarjeta rechazada
                if (data.cardRejected && data.rejectedUid && data.lastRejectionTime > lastProcessedRejection) {
                    lastProcessedRejection = data.lastRejectionTime;
                    
                    console.log('🚫 ¡Tarjeta RECHAZADA detectada!');
                    console.log('   UID:', data.rejectedUid);
                    console.log('   Tiempo:', new Date(data.lastRejectionTime).toLocaleTimeString());
                    
                    // Mostrar estado de rechazo
                    showRejectedState(data.rejectedUid);
                    
                    // Detener el polling para que no intente registrar
                    stopAttendancePolling();
                    return;
                }
                
                // PRIORIDAD 2: Si hay una tarjeta AUTORIZADA recién detectada
                if (data.cardDetected && !data.cardRejected && data.lastUid && data.lastDetectionTime > lastProcessedDetection) {
                    lastProcessedDetection = data.lastDetectionTime;
                    
                    console.log('🔖 ¡Tarjeta AUTORIZADA detectada desde Arduino Bridge!');
                    console.log('   UID:', data.lastUid);
                    console.log('   Tiempo:', new Date(data.lastDetectionTime).toLocaleTimeString());
                    
                    // Registrar asistencia manual del estudiante logueado
                    await registerManualAttendance();
                }
            }
        } catch (error) {
            // Arduino Bridge no disponible
            console.warn('⚠️ Arduino Bridge no disponible:', error.message);
            
            // Método alternativo: polling de asistencias cada 5 segundos
            // (Por si el estudiante ya registró desde otro lado)
            if (!attendanceCheckInterval._alternativeMode) {
                attendanceCheckInterval._alternativeMode = true;
                clearInterval(attendanceCheckInterval);
                console.log('⚠️ Cambiando a modo alternativo (polling de asistencias)');
                startAttendancePolling();
            }
        }
    }, 300); // Cada 300ms para respuesta rápida
}

/**
 * Registrar asistencia manual (sin tarjeta RFID)
 */
async function registerManualAttendance() {
    try {
        console.log('📤 Enviando registro de asistencia...');
        console.log('🧪 MODO TEST: Usando endpoint sin validaciones');
        
        // Obtener nombre del estudiante logueado
        const studentName = localStorage.getItem('userName') || 'Estudiante';
        const userId = localStorage.getItem('userId') || 'unknown';
        
        console.log('👤 Estudiante:', studentName);
        
        // Detectar entorno automáticamente
        const API_BASE_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api'
            : '/api';  // En producción usa la ruta relativa (mismo dominio)
        
        console.log('🌐 API URL:', API_BASE_URL);
        
        // TEMPORAL: Usar endpoint de test mientras se crea el índice de Firebase
        const response = await fetch(`${API_BASE_URL}/attendance/register-test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uid: 'DETECTED_FROM_ARDUINO',
                classId: currentAttendanceClassId || 'TEST_CLASS',
                timestamp: Date.now(),
                studentName: studentName,
                studentId: userId
            })
        });
        
        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);
        
        if (data.success) {
            console.log('🎉 Asistencia registrada exitosamente (modo test)');
            showSuccessState({
                studentName: studentName, // Usar nombre real del localStorage
                className: data.className || currentAttendanceClassName,
                date: Date.now()
            });
        } else {
            console.error('❌ Error al registrar:', data.message);
            showErrorState(data.message || 'Error al registrar asistencia');
        }
    } catch (error) {
        console.error('❌ Error en registro:', error);
        showErrorState('Error de conexión. Verifica que el backend esté corriendo.');
    }
}

/**
 * Mostrar instrucciones si el bridge no se pudo configurar automáticamente
 */
function showBridgeInstructions(classId, className) {
    const waitingElement = document.getElementById('attendanceWaiting');
    const instructionsHTML = `
        <div class="rfid-card-animation">
            <div class="card-pulse"></div>
            <div class="card-icon">💳</div>
        </div>
        <h3>Pasa tu tarjeta RFID</h3>
        <p>Acerca tu tarjeta al lector para registrar tu asistencia</p>
        <div class="bridge-instructions">
            <p style="font-size: 0.9rem; color: #a0aec0; margin-top: 1rem;">
                💡 Si el Arduino Bridge no configuró la clase automáticamente,<br>
                escribe en la terminal del bridge: <code style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px;">clase ${classId}</code>
            </p>
        </div>
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    waitingElement.innerHTML = instructionsHTML;
}

/**
 * Configurar clase en Arduino Bridge automáticamente
 */
async function configureArduinoBridge(classId) {
    try {
        console.log('🔧 Intentando configurar Arduino Bridge para clase:', classId);
        
        // Intentar enviar comando al bridge via HTTP
        const response = await fetch(`${ARDUINO_BRIDGE_URL}/set-class`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ classId })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Arduino Bridge configurado automáticamente:', data);
            return true;
        } else {
            console.warn('⚠️ Bridge respondió con error');
            return false;
        }
        
    } catch (error) {
        console.warn('⚠️ No se pudo configurar automáticamente:', error.message);
        console.log('💡 Configura manualmente en el bridge: clase', classId);
        return false;
    }
}

/**
 * Cerrar modal de asistencia
 */
function closeAttendanceModal() {
    const modal = document.getElementById('attendanceModal');
    modal.classList.remove('active');
    
    // Detener polling
    stopAttendancePolling();
    
    // Limpiar variables
    currentAttendanceClassId = null;
    currentAttendanceClassName = null;
    lastAttendanceCount = 0;
    
    console.log('✅ Modal de asistencia cerrado');
}

/**
 * Obtener conteo inicial de asistencias
 */
async function getInitialAttendanceCount() {
    try {
        const response = await apiService.request(`/attendance/class/${currentAttendanceClassId}`);
        
        if (response.success && response.attendances) {
            lastAttendanceCount = response.attendances.length;
            console.log('📊 Conteo inicial de asistencias:', lastAttendanceCount);
        }
    } catch (error) {
        console.error('Error obteniendo conteo inicial:', error);
        lastAttendanceCount = 0;
    }
}

/**
 * Iniciar polling para detectar nuevas asistencias
 */
function startAttendancePolling() {
    console.log('🔄 Iniciando polling de asistencias...');
    
    // Verificar cada 5 segundos (evitar rate limiting)
    attendanceCheckInterval = setInterval(async () => {
        await checkForNewAttendance();
    }, 5000);
}

/**
 * Detener polling
 */
function stopAttendancePolling() {
    if (attendanceCheckInterval) {
        clearInterval(attendanceCheckInterval);
        attendanceCheckInterval = null;
        console.log('⏹️ Polling de asistencias detenido');
    }
}

/**
 * Verificar si hay nueva asistencia registrada
 */
async function checkForNewAttendance() {
    try {
        const response = await apiService.request(`/attendance/class/${currentAttendanceClassId}`);
        
        console.log('🔄 Polling response:', {
            success: response.success,
            attendancesCount: response.attendances?.length,
            lastCount: lastAttendanceCount
        });
        
        if (response.success && response.attendances) {
            const currentCount = response.attendances.length;
            
            // Si hay una nueva asistencia
            if (currentCount > lastAttendanceCount) {
                console.log('🎉 Nueva asistencia detectada! Count:', currentCount, 'vs', lastAttendanceCount);
                
                // Obtener la asistencia más reciente (asumiendo que viene ordenada por fecha desc)
                const latestAttendance = response.attendances[0];
                
                console.log('📋 Latest attendance:', latestAttendance);
                
                // Verificar si es del usuario actual
                const currentUserId = localStorage.getItem('userId');
                
                console.log('🔍 Comparando:', {
                    attendanceStudentId: latestAttendance.studentId,
                    currentUserId: currentUserId,
                    match: latestAttendance.studentId === currentUserId
                });
                
                if (latestAttendance.studentId === currentUserId) {
                    console.log('✅ Es la asistencia del usuario actual');
                    stopAttendancePolling();
                    showSuccessState(latestAttendance);
                } else {
                    console.log('⏭️ Asistencia de otro estudiante, continuando polling...');
                    console.log('   Esperando asistencia de:', currentUserId);
                    console.log('   Pero se registró:', latestAttendance.studentId);
                }
                
                lastAttendanceCount = currentCount;
            } else {
                console.log('⏳ Sin cambios en asistencias. Count:', currentCount);
            }
        } else {
            console.log('⚠️ Response no tiene attendances:', response);
        }
    } catch (error) {
        console.error('❌ Error verificando asistencias:', error);
    }
}

/**
 * Mostrar estado de espera
 */
function showWaitingState() {
    document.getElementById('attendanceWaiting').classList.remove('hidden');
    document.getElementById('attendanceSuccess').classList.add('hidden');
    document.getElementById('attendanceError').classList.add('hidden');
}

/**
 * Mostrar estado de éxito con animación increíble
 */
function showSuccessState(attendance) {
    // Primero mostrar animación de tarjeta detectada
    showCardDetectedAnimation();
    
    // Después de 1.5 segundos, mostrar el éxito final
    setTimeout(() => {
        // Ocultar waiting
        document.getElementById('attendanceWaiting').classList.add('hidden');
        
        // Mostrar success
        const successElement = document.getElementById('attendanceSuccess');
        const nameElement = document.getElementById('attendanceStudentName');
        const timeElement = document.getElementById('attendanceTime');
        
        // Formatear datos
        const studentName = attendance.studentName || 'Estudiante';
        const time = new Date(attendance.date || Date.now()).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const date = new Date(attendance.date || Date.now()).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        nameElement.textContent = studentName;
        timeElement.textContent = `${date} a las ${time}`;
        
        successElement.classList.remove('hidden');
        
        // Marcar como asistido en localStorage para ocultar el botón
        if (typeof window.markAttendedToday === 'function' && currentAttendanceClassId) {
            window.markAttendedToday(currentAttendanceClassId);
            console.log('✅ Asistencia marcada en localStorage para clase:', currentAttendanceClassId);
        }
        
        // Lanzar confetti
        launchConfetti();
        
        // Reproducir sonido de éxito (si quieres agregar sonido)
        playSuccessSound();
        
        // Cerrar automáticamente después de 4 segundos y recargar clases
        setTimeout(() => {
            closeAttendanceModal();
            
            // Recargar las clases para actualizar el botón
            if (typeof loadMyCourses === 'function') {
                loadMyCourses();
            }
        }, 4000);
    }, 1500);
}

/**
 * Mostrar animación de tarjeta detectada
 */
function showCardDetectedAnimation() {
    const waitingElement = document.getElementById('attendanceWaiting');
    const cardDetectedHTML = `
        <div class="rfid-card-animation detected">
            <div class="card-pulse success-pulse"></div>
            <div class="card-icon detected-icon">✓</div>
        </div>
        <h3 style="color: #4fd1c5;">¡Tarjeta Detectada!</h3>
        <p style="color: #68d391;">Procesando asistencia...</p>
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    waitingElement.innerHTML = cardDetectedHTML;
    waitingElement.classList.remove('hidden');
}

/**
 * Mostrar estado de error
 */
function showErrorState(message) {
    document.getElementById('attendanceWaiting').classList.add('hidden');
    document.getElementById('attendanceSuccess').classList.add('hidden');
    
    const errorElement = document.getElementById('attendanceError');
    const errorMessage = document.getElementById('attendanceErrorMessage');
    
    errorMessage.textContent = message || 'No se pudo registrar la asistencia. Intenta de nuevo.';
    errorElement.classList.remove('hidden');
    
    stopAttendancePolling();
}

/**
 * Mostrar estado de tarjeta rechazada
 */
function showRejectedState(uid) {
    // Ocultar otros estados
    document.getElementById('attendanceWaiting').classList.add('hidden');
    document.getElementById('attendanceSuccess').classList.add('hidden');
    document.getElementById('attendanceError').classList.add('hidden');
    
    // Mostrar estado de rechazo
    const rejectedElement = document.getElementById('attendanceRejected');
    const rejectedUidElement = document.getElementById('rejectedUid');
    
    rejectedUidElement.textContent = `UID: ${uid || 'Desconocido'}`;
    rejectedElement.classList.remove('hidden');
    
    // Detener polling
    stopAttendancePolling();
    
    // Cerrar automáticamente después de 5 segundos
    setTimeout(() => {
        closeAttendanceModal();
    }, 5000);
}

/**
 * Reintentar registro
 */
function retryAttendance() {
    showWaitingState();
    getInitialAttendanceCount();
    startAttendancePolling();
}

/**
 * Lanzar confetti (partículas que caen)
 */
function launchConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#4fd1c5', '#48bb78', '#4299e1', '#ed64a6', '#f6ad55'];
    
    // Crear 50 partículas de confetti
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            container.appendChild(confetti);
            
            // Eliminar después de la animación
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
    
    // Limpiar container después
    setTimeout(() => {
        container.innerHTML = '';
    }, 4000);
}

/**
 * Reproducir sonido de éxito (opcional)
 */
function playSuccessSound() {
    // Si quieres agregar un sonido:
    // const audio = new Audio('/sounds/success.mp3');
    // audio.play().catch(e => console.log('No se pudo reproducir sonido:', e));
    console.log('🎵 Sonido de éxito (opcional)');
}

/**
 * FUNCIÓN DE PRUEBA: Simular detección de tarjeta RFID
 */
async function simulateCardDetection() {
    console.log('🧪 TEST: Simulando detección de tarjeta RFID...');
    
    // Deshabilitar el botón temporalmente
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Procesando...';
    
    try {
        // Simular llamada al backend de prueba
        const response = await fetch('http://localhost:3000/api/attendance/register-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uid: '13:C9:46:14',
                classId: currentAttendanceClassId || 'TEST_CLASS_ID',
                timestamp: Date.now()
            })
        });
        
        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);
        
        if (data.success) {
            // Mostrar animación de éxito
            showSuccessState({
                studentName: data.studentName || 'Estudiante de Prueba',
                className: data.className || currentAttendanceClassName,
                date: Date.now()
            });
        } else {
            showErrorState('Error al simular tarjeta: ' + data.message);
        }
    } catch (error) {
        console.error('❌ Error en simulación:', error);
        showErrorState('Error de conexión. Verifica que el backend esté corriendo en puerto 3000.');
    } finally {
        btn.disabled = false;
        btn.textContent = '🧪 Simular Tarjeta (Test)';
    }
}

// Hacer la función global para que funcione con onclick
window.simulateCardDetection = simulateCardDetection;

/**
 * Cerrar modal al hacer clic fuera
 */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('attendanceModal');
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAttendanceModal();
            }
        });
    }
});

/**
 * Cerrar modal con tecla ESC
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentAttendanceClassId) {
        closeAttendanceModal();
    }
});

// ===================================
// CONFIGURACIÓN DE ARDUINO BRIDGE
// ===================================

/**
 * Probar conexión con Arduino Bridge
 */
async function testArduinoBridgeConnection(url) {
    const response = await fetch(`${url}/status`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error('Connection failed');
    return response.json();
}

/**
 * Solicitar al usuario la configuración del Arduino Bridge
 */
function promptForArduinoBridge() {
    return new Promise((resolve, reject) => {
        const modal = document.createElement('div');
        modal.className = 'arduino-config-modal';
        modal.innerHTML = `
            <div class="arduino-config-content">
                <div class="config-header">
                    <div class="config-icon">🔧</div>
                    <h3>Configurar Lector RFID</h3>
                    <p>Ingresa la dirección IP de la computadora con el Arduino</p>
                </div>
                
                <div class="config-form">
                    <div class="config-field">
                        <label>Dirección IP:</label>
                        <input type="text" id="arduinoIP" placeholder="192.168.1.100" value="localhost">
                        <span class="hint">Si estás en la misma computadora, deja "localhost"</span>
                    </div>
                    
                    <div class="config-field">
                        <label>Puerto:</label>
                        <input type="text" id="arduinoPort" placeholder="3001" value="3001">
                    </div>
                    
                    <div class="config-examples">
                        <p><strong>Ejemplos:</strong></p>
                        <ul>
                            <li>Misma computadora: <code>localhost:3001</code></li>
                            <li>Red local: <code>192.168.1.100:3001</code></li>
                            <li>Red escolar: <code>10.0.0.50:3001</code></li>
                        </ul>
                    </div>
                </div>
                
                <div class="config-actions">
                    <button class="btn-test" id="testConnection">🔍 Probar Conexión</button>
                    <button class="btn-save" id="saveConnection" disabled>💾 Guardar</button>
                    <button class="btn-cancel" id="cancelConnection">❌ Cancelar</button>
                </div>
                
                <div class="config-status" id="connectionStatus"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const ipInput = document.getElementById('arduinoIP');
        const portInput = document.getElementById('arduinoPort');
        const testBtn = document.getElementById('testConnection');
        const saveBtn = document.getElementById('saveConnection');
        const cancelBtn = document.getElementById('cancelConnection');
        const statusDiv = document.getElementById('connectionStatus');
        
        let testedURL = null;
        
        testBtn.onclick = async () => {
            const ip = ipInput.value.trim();
            const port = portInput.value.trim();
            
            if (!ip || !port) {
                statusDiv.innerHTML = '<span class="status-error">⚠️ Completa todos los campos</span>';
                return;
            }
            
            const testURL = `http://${ip}:${port}`;
            statusDiv.innerHTML = '<span class="status-testing">🔄 Probando conexión...</span>';
            testBtn.disabled = true;
            
            try {
                const response = await fetch(`${testURL}/status`, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    statusDiv.innerHTML = `<span class="status-success">✅ Conexión exitosa! Arduino Bridge funcionando</span>`;
                    testedURL = testURL;
                    saveBtn.disabled = false;
                } else {
                    throw new Error('Respuesta inválida');
                }
            } catch (error) {
                statusDiv.innerHTML = `<span class="status-error">❌ No se pudo conectar. Verifica que:<br>
                    1. El Arduino Bridge esté corriendo<br>
                    2. La IP y puerto sean correctos<br>
                    3. Estés en la misma red</span>`;
                saveBtn.disabled = true;
                testedURL = null;
            } finally {
                testBtn.disabled = false;
            }
        };
        
        saveBtn.onclick = () => {
            if (testedURL) {
                localStorage.setItem('arduinoBridgeURL', testedURL);
                ARDUINO_BRIDGE_URL = testedURL;
                document.body.removeChild(modal);
                console.log('✅ Arduino Bridge configurado:', testedURL);
                resolve(testedURL);
            }
        };
        
        cancelBtn.onclick = () => {
            document.body.removeChild(modal);
            reject(new Error('Configuración cancelada'));
        };
        
        // Cerrar con ESC
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', escapeHandler);
                reject(new Error('Configuración cancelada'));
            }
        };
        document.addEventListener('keydown', escapeHandler);
    });
}

/**
 * Reconfigurar Arduino Bridge (desde un botón en el dashboard)
 */
window.reconfigureArduinoBridge = async function() {
    ARDUINO_BRIDGE_URL = null;
    localStorage.removeItem('arduinoBridgeURL');
    try {
        await promptForArduinoBridge();
        alert('✅ Arduino Bridge reconfigurado correctamente');
    } catch (error) {
        console.log('Usuario canceló la reconfiguración');
    }
};

console.log('✅ Sistema de auto-registro de asistencia cargado');




