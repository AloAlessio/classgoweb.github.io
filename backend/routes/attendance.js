// Attendance Routes - Sistema de asistencias con RFID
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authenticateUser } = require('../middleware/authMiddleware');

const db = admin.firestore();

// ============= REGISTRO DE ASISTENCIA (desde Arduino) =============

/**
 * POST /api/attendance/register
 * Registra una asistencia cuando el alumno pasa su tarjeta RFID
 * Body: { uid: "13:C9:46:14", classId: "abc123" }
 */
router.post('/register', async (req, res) => {
    try {
        const { uid, classId, timestamp } = req.body;

        if (!uid || !classId) {
            return res.status(400).json({
                success: false,
                message: 'UID y classId son requeridos'
            });
        }

        // 1. Buscar al estudiante por su UID de tarjeta RFID
        const usersSnapshot = await db.collection('users')
            .where('rfidUid', '==', uid)
            .where('role', '==', 'student')
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            return res.status(404).json({
                success: false,
                message: 'Tarjeta no registrada',
                uid
            });
        }

        const studentDoc = usersSnapshot.docs[0];
        const studentId = studentDoc.id;
        const studentData = studentDoc.data();

        // 2. Verificar que la clase existe y el estudiante está inscrito
        const classDoc = await db.collection('classes').doc(classId).get();
        
        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Clase no encontrada'
            });
        }

        const classData = classDoc.data();
        
        if (!classData.students || !classData.students.includes(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'El estudiante no está inscrito en esta clase'
            });
        }

        // 3. Verificar si ya registró asistencia hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = admin.firestore.Timestamp.fromDate(today);

        const existingAttendance = await db.collection('attendance')
            .where('studentId', '==', studentId)
            .where('classId', '==', classId)
            .where('date', '>=', todayTimestamp)
            .limit(1)
            .get();

        if (!existingAttendance.empty) {
            return res.status(200).json({
                success: true,
                message: 'Ya registraste tu asistencia hoy',
                duplicate: true,
                studentName: `${studentData.name} ${studentData.lastName}`,
                attendanceId: existingAttendance.docs[0].id
            });
        }

        // 4. Registrar asistencia
        const attendanceData = {
            studentId,
            studentName: `${studentData.name} ${studentData.lastName}`,
            classId,
            className: classData.name,
            date: timestamp ? admin.firestore.Timestamp.fromMillis(timestamp) : admin.firestore.FieldValue.serverTimestamp(),
            status: 'present', // present, absent, late, excused
            rfidUid: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const attendanceRef = await db.collection('attendance').add(attendanceData);

        res.status(201).json({
            success: true,
            message: `Asistencia registrada para ${studentData.name}`,
            attendanceId: attendanceRef.id,
            studentName: `${studentData.name} ${studentData.lastName}`,
            className: classData.name
        });

    } catch (error) {
        console.error('Error registrando asistencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar asistencia',
            error: error.message
        });
    }
});

// ============= REGISTRAR ASISTENCIA MANUAL (estudiante logueado) =============

/**
 * POST /api/attendance/register-manual
 * Registra asistencia del estudiante logueado sin tarjeta RFID
 * Body: { classId: "abc123" }
 */
router.post('/register-manual', authenticateUser, async (req, res) => {
    try {
        const { classId } = req.body;
        const studentId = req.user.uid;

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: 'classId es requerido'
            });
        }

        // 1. Obtener datos del estudiante
        const studentDoc = await db.collection('users').doc(studentId).get();
        
        if (!studentDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const studentData = studentDoc.data();

        // 2. Verificar que la clase existe y el estudiante está inscrito
        const classDoc = await db.collection('classes').doc(classId).get();
        
        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Clase no encontrada'
            });
        }

        const classData = classDoc.data();
        
        if (!classData.students || !classData.students.includes(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'No estás inscrito en esta clase'
            });
        }

        // 3. Verificar si ya registró asistencia hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = admin.firestore.Timestamp.fromDate(today);

        const existingAttendance = await db.collection('attendance')
            .where('studentId', '==', studentId)
            .where('classId', '==', classId)
            .where('date', '>=', todayTimestamp)
            .limit(1)
            .get();

        if (!existingAttendance.empty) {
            return res.status(200).json({
                success: true,
                message: 'Ya registraste tu asistencia hoy',
                duplicate: true,
                studentName: `${studentData.name} ${studentData.lastName}`,
                attendanceId: existingAttendance.docs[0].id
            });
        }

        // 4. Registrar asistencia
        const attendanceData = {
            studentId,
            studentName: `${studentData.name} ${studentData.lastName}`,
            classId,
            className: classData.name,
            date: admin.firestore.FieldValue.serverTimestamp(),
            status: 'present',
            method: 'manual', // Método de registro
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const attendanceRef = await db.collection('attendance').add(attendanceData);

        res.status(201).json({
            success: true,
            message: `Asistencia registrada para ${studentData.name}`,
            attendanceId: attendanceRef.id,
            studentName: `${studentData.name} ${studentData.lastName}`,
            className: classData.name
        });

    } catch (error) {
        console.error('Error registrando asistencia manual:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar asistencia',
            error: error.message
        });
    }
});

// ============= CONSULTAR ASISTENCIAS DE UNA CLASE =============

/**
 * GET /api/attendance/class/:classId
 * Obtiene todas las asistencias de una clase (filtrable por fecha)
 */
router.get('/class/:classId', authenticateUser, async (req, res) => {
    try {
        const { classId } = req.params;
        const { date, startDate, endDate } = req.query;

        // Verificar permisos
        const classDoc = await db.collection('classes').doc(classId).get();
        
        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Clase no encontrada'
            });
        }

        const classData = classDoc.data();
        const userRole = req.user.role;
        const userId = req.user.uid;

        // Verificar permisos según el rol
        if (userRole === 'tutor' || userRole === 'profesor') {
            // El tutor solo puede ver las asistencias de SUS clases
            if (classData.tutorId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo el tutor de la clase puede ver las asistencias'
                });
            }
        } else if (userRole === 'student' || userRole === 'alumno') {
            // El alumno solo puede ver las asistencias de las clases en las que está inscrito
            const students = classData.students || [];
            if (!students.includes(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'No estás inscrito en esta clase'
                });
            }
        } else if (userRole !== 'admin' && userRole !== 'administrador') {
            // Si no es admin, tutor o student, denegar acceso
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver estas asistencias'
            });
        }
        // Admin/Administrador tiene acceso total a todas las asistencias

        // Construir query
        let query = db.collection('attendance').where('classId', '==', classId);

        // Filtrar por fecha si se especifica
        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            query = query
                .where('date', '>=', admin.firestore.Timestamp.fromDate(targetDate))
                .where('date', '<', admin.firestore.Timestamp.fromDate(nextDay));
        } else if (startDate && endDate) {
            query = query
                .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)))
                .where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
        }

        const attendanceSnapshot = await query.orderBy('date', 'desc').get();

        const attendances = attendanceSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate().toISOString()
        }));

        // Obtener lista de estudiantes de la clase para calcular ausentes
        const students = classData.students || [];
        const presentStudents = attendances.map(a => a.studentId);
        const absentStudents = students.filter(s => !presentStudents.includes(s));

        res.json({
            success: true,
            attendances,
            stats: {
                total: students.length,
                present: presentStudents.length,
                absent: absentStudents.length,
                percentage: students.length > 0 ? ((presentStudents.length / students.length) * 100).toFixed(1) : 0
            }
        });

    } catch (error) {
        console.error('Error obteniendo asistencias:', error);
        
        // Detectar si es error de índice faltante
        if (error.message && error.message.includes('requires an index')) {
            const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
            return res.status(500).json({
                success: false,
                message: '⚠️ Necesitas crear un índice en Firestore',
                error: 'MISSING_INDEX',
                indexUrl: indexUrl || 'Ver consola del servidor para el link',
                hint: 'Copia el link de la consola del servidor y ábrelo en tu navegador para crear el índice automáticamente.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencias',
            error: error.message
        });
    }
});

// ============= CONSULTAR ASISTENCIAS DE UN ESTUDIANTE =============

/**
 * GET /api/attendance/student/:studentId
 * Obtiene el historial de asistencias de un estudiante
 */
router.get('/student/:studentId', authenticateUser, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { classId } = req.query;

        // Los estudiantes solo pueden ver sus propias asistencias
        if (req.user.role === 'student' && req.user.uid !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver estas asistencias'
            });
        }

        let query = db.collection('attendance').where('studentId', '==', studentId);

        if (classId) {
            query = query.where('classId', '==', classId);
        }

        const attendanceSnapshot = await query.orderBy('date', 'desc').limit(100).get();

        const attendances = attendanceSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate().toISOString()
        }));

        res.json({
            success: true,
            attendances,
            total: attendances.length
        });

    } catch (error) {
        console.error('Error obteniendo asistencias del estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencias',
            error: error.message
        });
    }
});

// ============= VINCULAR TARJETA RFID A USUARIO =============

/**
 * POST /api/attendance/link-card
 * Vincula una tarjeta RFID con un usuario
 * Body: { userId: "abc123", rfidUid: "13:C9:46:14" }
 */
router.post('/link-card', authenticateUser, async (req, res) => {
    try {
        const { userId, rfidUid } = req.body;

        // Solo admin o tutor pueden vincular tarjetas (inglés y español)
        const allowedRoles = ['admin', 'administrador', 'tutor', 'profesor'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para vincular tarjetas'
            });
        }

        if (!userId || !rfidUid) {
            return res.status(400).json({
                success: false,
                message: 'userId y rfidUid son requeridos'
            });
        }

        // Verificar que el UID no esté ya asignado
        const existingUser = await db.collection('users')
            .where('rfidUid', '==', rfidUid)
            .limit(1)
            .get();

        if (!existingUser.empty && existingUser.docs[0].id !== userId) {
            return res.status(409).json({
                success: false,
                message: 'Esta tarjeta ya está asignada a otro usuario'
            });
        }

        // Actualizar usuario con el UID de la tarjeta
        await db.collection('users').doc(userId).update({
            rfidUid,
            rfidLinkedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({
            success: true,
            message: 'Tarjeta vinculada exitosamente'
        });

    } catch (error) {
        console.error('Error vinculando tarjeta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vincular tarjeta',
            error: error.message
        });
    }
});

// ============= OBTENER ESTADÍSTICAS DE ASISTENCIA =============

/**
 * GET /api/attendance/stats/:classId
 * Obtiene estadísticas de asistencia de una clase
 */
router.get('/stats/:classId', authenticateUser, async (req, res) => {
    try {
        const { classId } = req.params;

        const classDoc = await db.collection('classes').doc(classId).get();
        
        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Clase no encontrada'
            });
        }

        const classData = classDoc.data();
        const userRole = req.user.role;
        const userId = req.user.uid;

        // Verificar permisos (igual que en la ruta anterior)
        if (userRole === 'tutor' || userRole === 'profesor') {
            if (classData.tutorId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo el tutor de la clase puede ver las estadísticas'
                });
            }
        } else if (userRole === 'student' || userRole === 'alumno') {
            const students = classData.students || [];
            if (!students.includes(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'No estás inscrito en esta clase'
                });
            }
        } else if (userRole !== 'admin' && userRole !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver estas estadísticas'
            });
        }

        const students = classData.students || [];

        // Obtener todas las asistencias de la clase
        const attendanceSnapshot = await db.collection('attendance')
            .where('classId', '==', classId)
            .get();

        // Calcular estadísticas por estudiante
        const statsMap = {};
        students.forEach(studentId => {
            statsMap[studentId] = {
                present: 0,
                absent: 0,
                total: 0
            };
        });

        attendanceSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (statsMap[data.studentId]) {
                statsMap[data.studentId].present++;
                statsMap[data.studentId].total++;
            }
        });

        // Convertir a array con información del estudiante
        const statsArray = await Promise.all(
            Object.entries(statsMap).map(async ([studentId, stats]) => {
                const studentDoc = await db.collection('users').doc(studentId).get();
                const studentData = studentDoc.data();
                
                return {
                    studentId,
                    studentName: `${studentData?.name} ${studentData?.lastName}`,
                    ...stats,
                    percentage: stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0
                };
            })
        );

        res.json({
            success: true,
            stats: statsArray,
            className: classData.name
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});

// ============= ENDPOINT DE PRUEBA RFID (SIN VALIDACIONES) =============

/**
 * POST /api/attendance/register-test
 * Endpoint de prueba que registra cualquier tarjeta sin validar nada
 * Body: { uid: "13:C9:46:14", classId: "TEST_CLASS_ID" }
 */
router.post('/register-test', async (req, res) => {
    try {
        const { uid, classId, timestamp } = req.body;

        console.log('\n🧪 TEST MODE: Registro de asistencia sin validaciones');
        console.log(`   UID: ${uid}`);
        console.log(`   ClassID: ${classId}`);

        if (!uid) {
            return res.status(400).json({
                success: false,
                message: 'UID es requerido'
            });
        }

        // Obtener nombre del estudiante desde el request (si viene del frontend)
        const studentName = req.body.studentName || 'Estudiante de Prueba';
        const studentId = req.body.studentId || 'TEST_STUDENT_' + Date.now();

        // Crear registro de prueba sin validar nada
        const attendanceData = {
            studentId: studentId,
            studentName: studentName,
            classId: classId || 'TEST_CLASS_ID',
            className: 'Clase de Prueba',
            date: timestamp ? admin.firestore.Timestamp.fromMillis(timestamp) : admin.firestore.FieldValue.serverTimestamp(),
            status: 'present',
            rfidUid: uid,
            testMode: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Guardar en colección de pruebas
        const attendanceRef = await db.collection('attendance_test').add(attendanceData);

        // TAMBIÉN guardar en colección real de attendance para que el tutor lo vea
        try {
            const realAttendanceData = {
                studentId: studentId,
                studentName: studentName,
                classId: classId,
                className: 'Clase de Prueba',
                date: timestamp ? admin.firestore.Timestamp.fromMillis(timestamp) : admin.firestore.FieldValue.serverTimestamp(),
                status: 'present',
                attended: true,
                rfidUid: uid,
                method: 'rfid',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            const realRef = await db.collection('attendance').add(realAttendanceData);
            console.log(`   ✅ También guardado en colección "attendance": ${realRef.id}`);
        } catch (error) {
            console.log(`   ⚠️ Error guardando en colección real:`, error.message);
            console.log(`   Stack:`, error.stack);
        }

        console.log(`   ✅ Registro creado: ${attendanceRef.id}`);
        console.log(`   👤 Estudiante: ${studentName}\n`);

        res.status(201).json({
            success: true,
            message: 'Asistencia de prueba registrada',
            attendanceId: attendanceRef.id,
            studentName: studentName,
            className: 'Clase de Prueba',
            testMode: true
        });

    } catch (error) {
        console.error('Error en registro de prueba:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar asistencia de prueba',
            error: error.message
        });
    }
});

module.exports = router;
