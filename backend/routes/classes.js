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
        const { status, category, page = 1, limit = 20 } = req.query;

        let query = admin.firestore().collection('classes');

        // Filter based on user role
        if (role === 'tutor') {
            query = query.where('tutorId', '==', uid);
        } else if (role === 'alumno') {
            query = query.where('students', 'array-contains', uid);
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
            
            return {
                id: doc.id,
                title: classData.title,
                description: classData.description,
                category: classData.category,
                subject: classData.subject,
                scheduledAt: classData.scheduledAt,
                duration: classData.duration,
                maxStudents: classData.maxStudents,
                currentStudents: classData.students ? classData.students.length : 0,
                status: classData.status,
                meetingUrl: classData.meetingUrl,
                tutor: tutorData ? {
                    uid: tutorData.uid,
                    name: tutorData.name,
                    email: tutorData.email,
                    rating: tutorData.profile?.rating || 0
                } : null,
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
        scheduledAt,
        duration = 60,
        maxStudents = 20
    } = req.body;

    // Validation
    if (!title || !description || !category || !subject || !scheduledAt) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: title, description, category, subject, scheduledAt'
        });
    }

    try {
        const classId = crypto.randomUUID();
        const classData = {
            id: classId,
            title,
            description,
            category,
            subject,
            scheduledAt: new Date(scheduledAt),
            duration: parseInt(duration),
            maxStudents: parseInt(maxStudents),
            tutorId: req.user.uid,
            students: [],
            status: 'scheduled',
            meetingUrl: null, // Will be generated when class starts
            materials: [],
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
                ...classData
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
            
            enrolledStudents = studentsQuery.docs.map(doc => {
                const studentData = doc.data();
                return {
                    uid: studentData.uid,
                    name: studentData.name,
                    email: studentData.email
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
                enrolledStudents: req.user.role !== 'alumno' ? enrolledStudents : undefined,
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

module.exports = router;