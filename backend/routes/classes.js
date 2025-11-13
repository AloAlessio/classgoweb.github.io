// Classes Routes for ClassGo
// Handles class creation, management, scheduling, and enrollment

const express = require('express');
const crypto = require('crypto');
const { admin } = require('../config/firebaseAdmin');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { requireTutorOrAdmin, requireOwnershipOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/classes
 * @desc    Get classes based on user role
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
    try {
        const { role, uid } = req.user;
        const { status, category, page = 1, limit = 20, enrolled } = req.query;

        let query = admin.firestore().collection('classes');

        // Filter based on user role
        if (role === 'tutor') {
            query = query.where('tutorId', '==', uid);
        } else if (role === 'alumno') {
            // If enrolled=false, show ALL classes (for exploration)
            // If enrolled=true or not specified, show only enrolled classes
            if (enrolled !== 'false') {
                query = query.where('students', 'array-contains', uid);
            }
        }
        // Admins see all classes (no filter)

        // Additional filters
        if (status && ['scheduled', 'active', 'completed', 'cancelled'].includes(status)) {
            query = query.where('status', '==', status);
        }

        if (category) {
            query = query.where('category', '==', category);
        }

        // Pagination
        const offset = (page - 1) * limit;
        query = query.orderBy('scheduledAt', 'desc').limit(parseInt(limit)).offset(offset);

        const snapshot = await query.get();
        
        const classes = await Promise.all(snapshot.docs.map(async (doc) => {
            const classData = doc.data();
            
            // Get tutor info
            const tutorDoc = await admin.firestore()
                .collection('users')
                .doc(classData.tutorId)
                .get();
            
            const tutorData = tutorDoc.exists ? tutorDoc.data() : null;
            
            // Get student's grade if they are enrolled
            let bestGrade = null;
            let bestGradeOutOf10 = null;
            let grades = null;
            let enrollmentStatus = null;
            if (role === 'alumno' && classData.students && classData.students.includes(uid)) {
                const enrollmentQuery = await admin.firestore()
                    .collection('enrollments')
                    .where('classId', '==', doc.id)
                    .where('studentId', '==', uid)
                    .get();
                
                if (!enrollmentQuery.empty) {
                    const enrollmentData = enrollmentQuery.docs[0].data();
                    console.log('📊 Enrollment data for class:', doc.id, enrollmentData);
                    bestGrade = enrollmentData.bestGrade !== undefined ? enrollmentData.bestGrade : null;
                    bestGradeOutOf10 = enrollmentData.bestGradeOutOf10 !== undefined ? enrollmentData.bestGradeOutOf10 : null;
                    grades = enrollmentData.grades || null;
                    enrollmentStatus = enrollmentData.status || null;
                } else {
                    console.log('⚠️ No enrollment found for class:', doc.id, 'student:', uid);
                }
            }
            
            return {
                id: doc.id,
                title: classData.title,
                description: classData.description,
                category: classData.category,
                subject: classData.subject,
                difficulty: classData.difficulty,
                scheduledAt: classData.scheduledAt,
                duration: classData.duration,
                maxStudents: classData.maxStudents,
                currentStudents: classData.students ? classData.students.length : 0,
                status: classData.status,
                enrollmentStatus: enrollmentStatus,
                meetingUrl: classData.meetingUrl,
                tutor: tutorData ? {
                    uid: tutorData.uid,
                    name: tutorData.name,
                    email: tutorData.email,
                    rating: tutorData.profile?.rating || 0
                } : null,
                bestGrade: bestGrade,
                bestGradeOutOf10: bestGradeOutOf10,
                grades: grades,
                enrolledAt: classData.enrolledAt,
                createdAt: classData.createdAt
            };
        }));

        res.json({
            success: true,
            data: {
                classes,
                pagination: {
                    currentPage: parseInt(page),
                    limit: parseInt(limit),
                    total: snapshot.size
                }
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/classes
 * @desc    Create a new class (Tutor or Admin only)
 * @access  Private (Tutor/Admin)
 */
router.post('/', requireTutorOrAdmin, asyncHandler(async (req, res) => {
    const {
        title,
        description,
        category,
        subject,
        subjectIcon,
        subjectName,
        difficulty,
        deadline,
        objectives,
        assignedStudents,
        scheduledAt,
        duration = 60,
        maxStudents = 20
    } = req.body;

    // Basic validation
    if (!title || !description || !subject) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: title, description, subject'
        });
    }

    // Validate difficulty level if provided
    if (difficulty && !['principiante', 'intermedio', 'avanzado'].includes(difficulty)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid difficulty level. Must be: principiante, intermedio, or avanzado'
        });
    }

    // Validate assignedStudents is an array if provided (now optional)
    const studentsArray = Array.isArray(assignedStudents) ? assignedStudents : [];

    // Validate deadline is in the future if provided
    if (deadline) {
        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            return res.status(400).json({
                success: false,
                error: 'Deadline must be in the future'
            });
        }
    }

    try {
        const classId = crypto.randomUUID();
        
        // Set default deadline to 7 days from now if not provided
        const defaultDeadline = new Date();
        defaultDeadline.setDate(defaultDeadline.getDate() + 7);
        
        const classData = {
            id: classId,
            title,
            description,
            category: category || subject,
            subject,
            subjectIcon: subjectIcon || '',
            subjectName: subjectName || subject,
            difficulty: difficulty || 'intermedio',
            deadline: deadline ? new Date(deadline) : defaultDeadline,
            objectives: objectives || '',
            scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
            duration: parseInt(duration),
            maxStudents: parseInt(maxStudents),
            tutorId: req.user.uid,
            tutorName: req.user.name || req.user.email,
            students: studentsArray,
            assignedStudents: studentsArray,
            status: 'scheduled', // Changed from 'active' to 'scheduled' for consistency
            meetingUrl: null,
            materials: [],
            progress: {},
            submissions: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await admin.firestore()
            .collection('classes')
            .doc(classId)
            .set(classData);

        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: {
                id: classId,
                ...classData,
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   GET /api/classes/:classId
 * @desc    Get specific class details
 * @access  Private
 */
router.get('/:classId', asyncHandler(async (req, res) => {
    const { classId } = req.params;

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();
        
        // Check access permissions
        if (req.user.role === 'alumno' && !classData.students.includes(req.user.uid)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You are not enrolled in this class.'
            });
        }

        if (req.user.role === 'tutor' && classData.tutorId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You are not the tutor of this class.'
            });
        }

        // Get tutor info
        const tutorDoc = await admin.firestore()
            .collection('users')
            .doc(classData.tutorId)
            .get();

        const tutorData = tutorDoc.exists ? tutorDoc.data() : null;

        // Get enrolled students info (for tutors and admins)
        let enrolledStudents = [];
        if (req.user.role !== 'alumno' && classData.students.length > 0) {
            const studentsQuery = await admin.firestore()
                .collection('users')
                .where('uid', 'in', classData.students.slice(0, 10)) // Firestore 'in' limit is 10
                .get();
            
            // Get enrollment data for each student to include grades
            const enrolledStudentsPromises = studentsQuery.docs.map(async (doc) => {
                const studentData = doc.data();
                
                // Query enrollment to get grades and status
                const enrollmentQuery = await admin.firestore()
                    .collection('enrollments')
                    .where('classId', '==', classId)
                    .where('studentId', '==', studentData.uid)
                    .get();
                
                let enrollmentInfo = {
                    bestGrade: null,
                    bestGradeOutOf10: null,
                    grades: [],
                    status: 'scheduled'
                };
                
                if (!enrollmentQuery.empty) {
                    const enrollmentData = enrollmentQuery.docs[0].data();
                    enrollmentInfo = {
                        bestGrade: enrollmentData.bestGrade || null,
                        bestGradeOutOf10: enrollmentData.bestGradeOutOf10 || null,
                        grades: enrollmentData.grades || [],
                        status: enrollmentData.status || 'scheduled'
                    };
                }
                
                return {
                    uid: studentData.uid,
                    name: studentData.name,
                    email: studentData.email,
                    bestGrade: enrollmentInfo.bestGrade,
                    bestGradeOutOf10: enrollmentInfo.bestGradeOutOf10,
                    grades: enrollmentInfo.grades,
                    enrollmentStatus: enrollmentInfo.status
                };
            });
            
            enrolledStudents = await Promise.all(enrolledStudentsPromises);
        }

        // Get attendance records for this class
        let attendanceRecords = [];
        if (req.user.role !== 'alumno') {
            const attendanceQuery = await admin.firestore()
                .collection('attendance')
                .where('classId', '==', classId)
                .get();
            
            attendanceRecords = attendanceQuery.docs.map(doc => {
                const attendanceData = doc.data();
                return {
                    studentId: attendanceData.studentId,
                    attended: attendanceData.attended || false,
                    completed: attendanceData.completed || false,
                    markedAt: attendanceData.markedAt,
                    completedAt: attendanceData.completedAt
                };
            });
        }

        res.json({
            success: true,
            data: {
                id: classDoc.id,
                title: classData.title,
                description: classData.description,
                category: classData.category,
                subject: classData.subject,
                scheduledAt: classData.scheduledAt,
                duration: classData.duration,
                maxStudents: classData.maxStudents,
                currentStudents: classData.students.length,
                status: classData.status,
                meetingUrl: classData.meetingUrl,
                materials: classData.materials,
                tutor: tutorData ? {
                    uid: tutorData.uid,
                    name: tutorData.name,
                    email: tutorData.email,
                    rating: tutorData.profile?.rating || 0
                } : null,
                students: req.user.role !== 'alumno' ? classData.students : undefined,
                visibleTo: req.user.role !== 'alumno' ? (classData.visibleTo || []) : undefined,
                enrolledStudents: req.user.role !== 'alumno' ? enrolledStudents : undefined,
                attendance: req.user.role !== 'alumno' ? attendanceRecords : undefined,
                createdAt: classData.createdAt,
                updatedAt: classData.updatedAt
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/classes/:classId/join
 * @desc    Join a class (Student only)
 * @access  Private (Student)
 */
router.post('/:classId/join', asyncHandler(async (req, res) => {
    const { classId } = req.params;

    if (req.user.role !== 'alumno') {
        return res.status(403).json({
            success: false,
            error: 'Only students can join classes'
        });
    }

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();

        // Check if class is still accepting students
        if (classData.status !== 'scheduled') {
            return res.status(400).json({
                success: false,
                error: 'Cannot join class. Class is not in scheduled status.'
            });
        }

        // Check if student already enrolled
        if (classData.students.includes(req.user.uid)) {
            return res.status(400).json({
                success: false,
                error: 'You are already enrolled in this class'
            });
        }

        // Check if class is full
        if (classData.students.length >= classData.maxStudents) {
            return res.status(400).json({
                success: false,
                error: 'Class is full'
            });
        }

        // Add student to class
        await admin.firestore()
            .collection('classes')
            .doc(classId)
            .update({
                students: admin.firestore.FieldValue.arrayUnion(req.user.uid),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        // Create enrollment record
        await admin.firestore()
            .collection('enrollments')
            .add({
                classId,
                studentId: req.user.uid,
                enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'enrolled'
            });

        res.json({
            success: true,
            message: 'Successfully joined the class',
            data: {
                classId,
                studentId: req.user.uid,
                enrolledAt: new Date()
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/classes/:classId/leave
 * @desc    Leave a class (Student only)
 * @access  Private (Student)
 */
router.post('/:classId/leave', asyncHandler(async (req, res) => {
    const { classId } = req.params;

    if (req.user.role !== 'alumno') {
        return res.status(403).json({
            success: false,
            error: 'Only students can leave classes'
        });
    }

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();

        // Check if student is enrolled
        if (!classData.students.includes(req.user.uid)) {
            return res.status(400).json({
                success: false,
                error: 'You are not enrolled in this class'
            });
        }

        // Remove student from class
        await admin.firestore()
            .collection('classes')
            .doc(classId)
            .update({
                students: admin.firestore.FieldValue.arrayRemove(req.user.uid),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        // Update enrollment record
        const enrollmentQuery = await admin.firestore()
            .collection('enrollments')
            .where('classId', '==', classId)
            .where('studentId', '==', req.user.uid)
            .get();

        if (!enrollmentQuery.empty) {
            await enrollmentQuery.docs[0].ref.update({
                status: 'withdrawn',
                withdrawnAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.json({
            success: true,
            message: 'Successfully left the class',
            data: {
                classId,
                studentId: req.user.uid,
                leftAt: new Date()
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/classes/:classId/grade
 * @desc    Save student's game grade for a class
 * @access  Private (Student)
 */
router.post('/:classId/grade', asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { grade, gradeOutOf10, score, correctAnswers, totalQuestions, combo, completedAt } = req.body;

    if (req.user.role !== 'alumno') {
        return res.status(403).json({
            success: false,
            error: 'Only students can save grades'
        });
    }

    try {
        console.log('📝 Saving grade for student:', req.user.uid, 'in class:', classId);
        
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            console.log('❌ Class not found:', classId);
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();
        console.log('📚 Class data:', { 
            title: classData.title, 
            students: classData.students,
            studentCount: classData.students?.length 
        });

        // Check if student is enrolled
        if (!classData.students || !classData.students.includes(req.user.uid)) {
            console.log('❌ Student not in class.students array');
            return res.status(400).json({
                success: false,
                error: 'You are not enrolled in this class'
            });
        }

        console.log('✅ Student is in class.students array');

        // Update enrollment record with grade
        console.log('🔍 Searching for enrollment with classId:', classId, 'studentId:', req.user.uid);
        const enrollmentQuery = await admin.firestore()
            .collection('enrollments')
            .where('classId', '==', classId)
            .where('studentId', '==', req.user.uid)
            .get();

        console.log('📊 Enrollment query result:', {
            empty: enrollmentQuery.empty,
            size: enrollmentQuery.size,
            docs: enrollmentQuery.docs.map(d => ({ id: d.id, data: d.data() }))
        });

        let enrollmentDoc;
        let enrollmentData;
        let existingGrades = [];

        if (enrollmentQuery.empty) {
            console.log('⚠️ No enrollment document found, creating one...');
            // Create the enrollment document if it doesn't exist
            const newEnrollmentRef = await admin.firestore()
                .collection('enrollments')
                .add({
                    classId: classId,
                    studentId: req.user.uid,
                    enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: classData.status || 'scheduled',
                    grades: [],
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            
            console.log('✅ Enrollment document created:', newEnrollmentRef.id);
            enrollmentDoc = await newEnrollmentRef.get();
            enrollmentData = enrollmentDoc.data();
        } else {
            console.log('✅ Enrollment found, updating grade...');
            enrollmentDoc = enrollmentQuery.docs[0];
            enrollmentData = enrollmentDoc.data();
            existingGrades = enrollmentData.grades || [];
        }

        // Add new grade
        const newGrade = {
            grade,
            gradeOutOf10: gradeOutOf10 || (grade / 10), // Use provided gradeOutOf10 or calculate from grade
            score,
            correctAnswers,
            totalQuestions,
            combo,
            completedAt: completedAt || new Date().toISOString(),
            timestamp: new Date().toISOString() // Use ISO string instead of serverTimestamp in arrays
        };

        existingGrades.push(newGrade);

        // Update enrollment with new grade and calculate best grade
        const bestGrade = Math.max(...existingGrades.map(g => g.grade));
        const bestGradeOutOf10 = Math.max(...existingGrades.map(g => g.gradeOutOf10 || (g.grade / 10)));
        
        await enrollmentDoc.ref.update({
            grades: existingGrades,
            bestGrade: bestGrade,
            bestGradeOutOf10: parseFloat(bestGradeOutOf10.toFixed(1)),
            lastPlayedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({
            success: true,
            message: 'Grade saved successfully',
            data: {
                classId,
                studentId: req.user.uid,
                grade,
                gradeOutOf10: parseFloat((gradeOutOf10 || grade / 10).toFixed(1)),
                bestGrade,
                bestGradeOutOf10: parseFloat(bestGradeOutOf10.toFixed(1)),
                totalAttempts: existingGrades.length
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/classes/:classId/complete
 * @desc    Mark class as completed (when student returns to dashboard)
 * @access  Private (Student)
 */
router.post('/:classId/complete', asyncHandler(async (req, res) => {
    const { classId } = req.params;

    if (req.user.role !== 'alumno') {
        return res.status(403).json({
            success: false,
            error: 'Only students can complete classes'
        });
    }

    try {
        console.log('📝 Marking class as completed for student:', req.user.uid, 'in class:', classId);

        // Update enrollment status to completed
        const enrollmentQuery = await admin.firestore()
            .collection('enrollments')
            .where('classId', '==', classId)
            .where('studentId', '==', req.user.uid)
            .get();

        if (enrollmentQuery.empty) {
            return res.status(404).json({
                success: false,
                error: 'Enrollment not found'
            });
        }

        const enrollmentDoc = enrollmentQuery.docs[0];
        await enrollmentDoc.ref.update({
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Class marked as completed');

        res.json({
            success: true,
            message: 'Class completed successfully',
            data: {
                classId,
                studentId: req.user.uid,
                status: 'completed'
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   PUT /api/classes/:classId
 * @desc    Update a class (Tutor/Owner or Admin only)
 * @access  Private (Tutor/Admin)
 */
router.put('/:classId', asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { title, description, category, scheduledAt, duration, maxStudents, status } = req.body;

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();

        // Check permissions - only the tutor who created it or admin can update
        if (req.user.role === 'tutor' && classData.tutorId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                error: 'You can only update your own classes'
            });
        }

        // Prepare update data
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt;
        if (duration !== undefined) updateData.duration = parseInt(duration);
        if (maxStudents !== undefined) updateData.maxStudents = parseInt(maxStudents);
        if (status !== undefined) {
            if (!['scheduled', 'active', 'completed', 'cancelled'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status'
                });
            }
            updateData.status = status;
        }

        // Update the class
        await admin.firestore()
            .collection('classes')
            .doc(classId)
            .update(updateData);

        // Get updated class
        const updatedDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        res.json({
            success: true,
            message: 'Class updated successfully',
            data: {
                id: updatedDoc.id,
                ...updatedDoc.data()
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/classes/:classId/add-student
 * @desc    Add a student to a class (Tutor/Owner or Admin only)
 * @access  Private (Tutor/Admin)
 */
router.post('/:classId/add-student', asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
        return res.status(400).json({
            success: false,
            error: 'Student ID is required'
        });
    }

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();

        // Check permissions - only the tutor who created it or admin can add students
        if (req.user.role === 'tutor' && classData.tutorId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                error: 'You can only add students to your own classes'
            });
        }

        // Check if class is full
        const currentStudents = classData.students || [];
        if (currentStudents.length >= classData.maxStudents) {
            return res.status(400).json({
                success: false,
                error: 'Class is full'
            });
        }

        // Check if student is already enrolled
        if (currentStudents.includes(studentId)) {
            return res.status(400).json({
                success: false,
                error: 'Student is already enrolled'
            });
        }

        // Verify student exists and has correct role
        const studentDoc = await admin.firestore()
            .collection('users')
            .doc(studentId)
            .get();

        if (!studentDoc.exists || studentDoc.data().role !== 'alumno') {
            return res.status(400).json({
                success: false,
                error: 'Invalid student ID'
            });
        }

        // Add student to class
        await admin.firestore()
            .collection('classes')
            .doc(classId)
            .update({
                students: admin.firestore.FieldValue.arrayUnion(studentId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        // Create enrollment record
        await admin.firestore()
            .collection('enrollments')
            .add({
                classId,
                studentId,
                enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'enrolled'
            });

        res.json({
            success: true,
            message: 'Student added successfully',
            data: {
                classId,
                studentId
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/classes/:classId/remove-student
 * @desc    Remove a student from a class (Tutor/Owner or Admin only)
 * @access  Private (Tutor/Admin)
 */
router.post('/:classId/remove-student', asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
        return res.status(400).json({
            success: false,
            error: 'Student ID is required'
        });
    }

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();

        // Check permissions - only the tutor who created it or admin can remove students
        if (req.user.role === 'tutor' && classData.tutorId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                error: 'You can only remove students from your own classes'
            });
        }

        // Remove student from class
        await admin.firestore()
            .collection('classes')
            .doc(classId)
            .update({
                students: admin.firestore.FieldValue.arrayRemove(studentId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        // Update enrollment record
        const enrollmentQuery = await admin.firestore()
            .collection('enrollments')
            .where('classId', '==', classId)
            .where('studentId', '==', studentId)
            .get();

        if (!enrollmentQuery.empty) {
            await enrollmentQuery.docs[0].ref.update({
                status: 'removed',
                removedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.json({
            success: true,
            message: 'Student removed successfully',
            data: {
                classId,
                studentId
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/classes/:classId/remove-visibility
 * @desc    Remove student visibility from a class (Tutor/Owner or Admin only)
 * @access  Private (Tutor/Admin)
 */
router.post('/:classId/remove-visibility', asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
        return res.status(400).json({
            success: false,
            error: 'Student ID is required'
        });
    }

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();

        // Check permissions - only the tutor who created it or admin can remove visibility
        if (req.user.role === 'tutor' && classData.tutorId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                error: 'You can only manage visibility for your own classes'
            });
        }

        // Remove student from visibleTo array
        await admin.firestore()
            .collection('classes')
            .doc(classId)
            .update({
                visibleTo: admin.firestore.FieldValue.arrayRemove(studentId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        res.json({
            success: true,
            message: 'Student visibility removed successfully',
            data: {
                classId,
                studentId
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   DELETE /api/classes/:classId
 * @desc    Delete a class (Tutor/Owner or Admin only)
 * @access  Private (Tutor/Admin)
 */
router.delete('/:classId', asyncHandler(async (req, res) => {
    const { classId } = req.params;

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();

        // Check permissions - only the tutor who created it or admin can delete
        if (req.user.role === 'tutor' && classData.tutorId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                error: 'You can only delete your own classes'
            });
        }

        // Delete related enrollments
        const enrollmentsSnapshot = await admin.firestore()
            .collection('enrollments')
            .where('classId', '==', classId)
            .get();

        const batch = admin.firestore().batch();
        enrollmentsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the class
        batch.delete(classDoc.ref);

        await batch.commit();

        res.json({
            success: true,
            message: 'Class deleted successfully',
            data: {
                classId,
                deletedAt: new Date()
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   PATCH /api/classes/:classId/status
 * @desc    Update class status (Tutor or Admin only)
 * @access  Private (Tutor/Admin)
 */
router.patch('/:classId/status', asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'active', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid status. Must be: scheduled, active, completed, or cancelled'
        });
    }

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();

        // Check permissions
        if (req.user.role === 'tutor' && classData.tutorId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                error: 'You can only update your own classes'
            });
        }

        const updateData = {
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Generate meeting URL when class becomes active
        if (status === 'active' && !classData.meetingUrl) {
            updateData.meetingUrl = `https://meet.classgo.com/class/${classId}`;
        }

        await admin.firestore()
            .collection('classes')
            .doc(classId)
            .update(updateData);

        res.json({
            success: true,
            message: `Class status updated to ${status}`,
            data: {
                classId,
                status,
                meetingUrl: updateData.meetingUrl
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/classes/:classId/mark-attendance
 * @desc    Mark student attendance for a class
 * @access  Private (Tutor/Admin)
 */
router.post('/:classId/mark-attendance', asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { studentId, attended } = req.body;

    if (!studentId || typeof attended !== 'boolean') {
        return res.status(400).json({
            success: false,
            error: 'Student ID and attendance status are required'
        });
    }

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();

        // Check permissions
        if (req.user.role === 'tutor' && classData.tutorId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                error: 'You can only manage attendance for your own classes'
            });
        }

        // Get or create attendance record
        const attendanceQuery = await admin.firestore()
            .collection('attendance')
            .where('classId', '==', classId)
            .where('studentId', '==', studentId)
            .get();

        const attendanceData = {
            classId,
            studentId,
            attended,
            markedAt: admin.firestore.FieldValue.serverTimestamp(),
            markedBy: req.user.uid
        };

        if (attendanceQuery.empty) {
            // Create new attendance record
            await admin.firestore()
                .collection('attendance')
                .add({
                    ...attendanceData,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
        } else {
            // Update existing attendance record
            await attendanceQuery.docs[0].ref.update(attendanceData);
        }

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            data: {
                classId,
                studentId,
                attended
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/classes/:classId/mark-completed
 * @desc    Mark student as completed for a class
 * @access  Private (Tutor/Admin)
 */
router.post('/:classId/mark-completed', asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
        return res.status(400).json({
            success: false,
            error: 'Student ID is required'
        });
    }

    try {
        const classDoc = await admin.firestore()
            .collection('classes')
            .doc(classId)
            .get();

        if (!classDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        const classData = classDoc.data();

        // Check permissions
        if (req.user.role === 'tutor' && classData.tutorId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                error: 'You can only manage completion for your own classes'
            });
        }

        // Get or create attendance record
        const attendanceQuery = await admin.firestore()
            .collection('attendance')
            .where('classId', '==', classId)
            .where('studentId', '==', studentId)
            .get();

        if (attendanceQuery.empty) {
            // Create new attendance record with completion
            await admin.firestore()
                .collection('attendance')
                .add({
                    classId,
                    studentId,
                    attended: true, // Auto-mark as attended when completed
                    completed: true,
                    completedAt: admin.firestore.FieldValue.serverTimestamp(),
                    markedBy: req.user.uid,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
        } else {
            // Update existing attendance record
            await attendanceQuery.docs[0].ref.update({
                completed: true,
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
                markedBy: req.user.uid
            });
        }

        res.json({
            success: true,
            message: 'Class marked as completed',
            data: {
                classId,
                studentId,
                completed: true
            }
        });

    } catch (error) {
        throw error;
    }
}));

module.exports = router;