// Statistics Routes for ClassGo
// Handles personal and system-wide statistics

const express = require('express');
const { admin } = require('../config/firebaseAdmin');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/stats/personal
 * @desc    Get personal statistics for the authenticated user
 * @access  Private
 */
router.get('/personal', asyncHandler(async (req, res) => {
    try {
        const { uid, role } = req.user;
        let stats = {};

        if (role === 'alumno') {
            // Student statistics
            
            // Get enrolled classes
            const enrolledClassesQuery = await admin.firestore()
                .collection('classes')
                .where('students', 'array-contains', uid)
                .get();

            // Get completed classes
            const completedClassesQuery = await admin.firestore()
                .collection('classes')
                .where('students', 'array-contains', uid)
                .where('status', '==', 'completed')
                .get();

            // Calculate total study hours
            let totalHours = 0;
            completedClassesQuery.forEach(doc => {
                const classData = doc.data();
                totalHours += classData.duration || 60; // Default 60 minutes
            });

            // Get unique tutors
            const tutorIds = new Set();
            enrolledClassesQuery.forEach(doc => {
                const classData = doc.data();
                tutorIds.add(classData.tutorId);
            });

            // Calculate progress (completed vs enrolled)
            const totalEnrolled = enrolledClassesQuery.size;
            const totalCompleted = completedClassesQuery.size;
            const progressPercentage = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

            stats = {
                role: 'alumno',
                classesCompleted: totalCompleted,
                totalEnrolledClasses: totalEnrolled,
                studyHours: Math.round(totalHours / 60), // Convert to hours
                activeTutors: tutorIds.size,
                progressPercentage
            };

        } else if (role === 'tutor') {
            // Tutor statistics
            
            // Get taught classes
            const taughtClassesQuery = await admin.firestore()
                .collection('classes')
                .where('tutorId', '==', uid)
                .get();

            // Get completed classes
            const completedClassesQuery = await admin.firestore()
                .collection('classes')
                .where('tutorId', '==', uid)
                .where('status', '==', 'completed')
                .get();

            // Calculate unique students
            const studentIds = new Set();
            let totalHours = 0;
            
            taughtClassesQuery.forEach(doc => {
                const classData = doc.data();
                if (classData.students) {
                    classData.students.forEach(studentId => studentIds.add(studentId));
                }
                if (classData.status === 'completed') {
                    totalHours += classData.duration || 60;
                }
            });

            // Get user profile for rating
            const userDoc = await admin.firestore()
                .collection('users')
                .doc(uid)
                .get();
            
            const userData = userDoc.exists ? userDoc.data() : {};
            const rating = userData.profile?.rating || 0;

            stats = {
                role: 'tutor',
                classesImparted: completedClassesQuery.size,
                totalCreatedClasses: taughtClassesQuery.size,
                activeStudents: studentIds.size,
                teachingHours: Math.round(totalHours / 60),
                averageRating: rating,
                ratingCount: userData.profile?.ratingCount || 0
            };

        } else if (role === 'administrador') {
            // Admin gets both personal and system stats
            
            // System-wide statistics
            const usersQuery = await admin.firestore().collection('users').get();
            const classesQuery = await admin.firestore().collection('classes').get();
            
            // Count users by role
            let students = 0, tutors = 0, admins = 0;
            usersQuery.forEach(doc => {
                const userData = doc.data();
                switch(userData.role) {
                    case 'alumno': students++; break;
                    case 'tutor': tutors++; break;
                    case 'administrador': admins++; break;
                }
            });

            // Count classes by status
            let scheduledClasses = 0, activeClasses = 0, completedClasses = 0;
            classesQuery.forEach(doc => {
                const classData = doc.data();
                switch(classData.status) {
                    case 'scheduled': scheduledClasses++; break;
                    case 'active': activeClasses++; break;
                    case 'completed': completedClasses++; break;
                }
            });

            stats = {
                role: 'administrador',
                systemStats: {
                    totalUsers: usersQuery.size,
                    totalStudents: students,
                    totalTutors: tutors,
                    totalAdmins: admins,
                    totalClasses: classesQuery.size,
                    scheduledClasses,
                    activeClasses,
                    completedClasses
                }
            };
        }

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   GET /api/stats/system
 * @desc    Get system-wide statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/system', requireAdmin, asyncHandler(async (req, res) => {
    try {
        // Get basic counts
        const usersQuery = await admin.firestore().collection('users').get();
        const classesQuery = await admin.firestore().collection('classes').get();
        const enrollmentsQuery = await admin.firestore().collection('enrollments').get();

        // User statistics
        let userStats = {
            total: 0,
            students: 0,
            tutors: 0,
            admins: 0,
            active: 0,
            inactive: 0
        };

        usersQuery.forEach(doc => {
            const userData = doc.data();
            userStats.total++;
            
            switch(userData.role) {
                case 'alumno': userStats.students++; break;
                case 'tutor': userStats.tutors++; break;
                case 'administrador': userStats.admins++; break;
            }
            
            if (userData.status === 'active' || !userData.status) {
                userStats.active++;
            } else {
                userStats.inactive++;
            }
        });

        // Class statistics
        let classStats = {
            total: 0,
            scheduled: 0,
            active: 0,
            completed: 0,
            cancelled: 0,
            totalStudentEnrollments: 0
        };

        const categoryStats = {};
        
        classesQuery.forEach(doc => {
            const classData = doc.data();
            classStats.total++;
            
            switch(classData.status) {
                case 'scheduled': classStats.scheduled++; break;
                case 'active': classStats.active++; break;
                case 'completed': classStats.completed++; break;
                case 'cancelled': classStats.cancelled++; break;
            }
            
            // Count enrollments
            if (classData.students) {
                classStats.totalStudentEnrollments += classData.students.length;
            }
            
            // Category statistics
            const category = classData.category || 'Other';
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        });

        // Enrollment statistics
        let enrollmentStats = {
            total: 0,
            enrolled: 0,
            withdrawn: 0,
            completed: 0
        };

        enrollmentsQuery.forEach(doc => {
            const enrollmentData = doc.data();
            enrollmentStats.total++;
            
            switch(enrollmentData.status) {
                case 'enrolled': enrollmentStats.enrolled++; break;
                case 'withdrawn': enrollmentStats.withdrawn++; break;
                case 'completed': enrollmentStats.completed++; break;
            }
        });

        // Calculate success rates
        const successRate = classStats.total > 0 ? 
            Math.round((classStats.completed / classStats.total) * 100) : 0;
        
        const enrollmentRate = userStats.students > 0 ? 
            Math.round((enrollmentStats.enrolled / userStats.students) * 100) : 0;

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUsersQuery = await admin.firestore()
            .collection('users')
            .where('createdAt', '>=', thirtyDaysAgo)
            .get();

        const recentClassesQuery = await admin.firestore()
            .collection('classes')
            .where('createdAt', '>=', thirtyDaysAgo)
            .get();

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers: userStats.total,
                    totalClasses: classStats.total,
                    totalEnrollments: enrollmentStats.total,
                    successRate: `${successRate}%`,
                    enrollmentRate: `${enrollmentRate}%`
                },
                users: userStats,
                classes: classStats,
                enrollments: enrollmentStats,
                categories: categoryStats,
                recentActivity: {
                    newUsers: recentUsersQuery.size,
                    newClasses: recentClassesQuery.size,
                    period: 'Last 30 days'
                },
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   GET /api/stats/dashboard/:role
 * @desc    Get dashboard statistics for specific role
 * @access  Private
 */
router.get('/dashboard/:role', asyncHandler(async (req, res) => {
    const { role } = req.params;
    
    if (!['alumno', 'tutor', 'administrador'].includes(role)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid role parameter'
        });
    }

    // Only admins can view other roles' dashboard stats
    if (req.user.role !== 'administrador' && req.user.role !== role) {
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }

    try {
        let dashboardStats = {};

        if (role === 'alumno') {
            // Student dashboard stats
            const totalStudents = await admin.firestore()
                .collection('users')
                .where('role', '==', 'alumno')
                .get();

            const allClasses = await admin.firestore()
                .collection('classes')
                .get();

            let availableClasses = 0;
            let totalTutors = new Set();

            allClasses.forEach(doc => {
                const classData = doc.data();
                if (classData.status === 'scheduled') {
                    availableClasses++;
                }
                totalTutors.add(classData.tutorId);
            });

            dashboardStats = {
                availableClasses,
                totalTutors: totalTutors.size,
                totalStudents: totalStudents.size,
                successRate: 95 // This could be calculated from actual data
            };

        } else if (role === 'tutor') {
            // Tutor dashboard stats
            const totalTutors = await admin.firestore()
                .collection('users')
                .where('role', '==', 'tutor')
                .get();

            const allClasses = await admin.firestore()
                .collection('classes')
                .get();

            let totalStudentsServed = new Set();
            let totalClassesTaught = 0;

            allClasses.forEach(doc => {
                const classData = doc.data();
                if (classData.status === 'completed') {
                    totalClassesTaught++;
                    if (classData.students) {
                        classData.students.forEach(studentId => {
                            totalStudentsServed.add(studentId);
                        });
                    }
                }
            });

            dashboardStats = {
                totalTutors: totalTutors.size,
                totalClassesTaught,
                studentsServed: totalStudentsServed.size,
                averageRating: 4.8 // This could be calculated from actual ratings
            };

        } else if (role === 'administrador') {
            // Admin dashboard stats (same as system stats but simplified)
            const users = await admin.firestore().collection('users').get();
            const classes = await admin.firestore().collection('classes').get();
            
            let activeUsers = 0;
            users.forEach(doc => {
                const userData = doc.data();
                if (userData.status === 'active' || !userData.status) {
                    activeUsers++;
                }
            });

            let activeClasses = 0;
            classes.forEach(doc => {
                const classData = doc.data();
                if (['scheduled', 'active'].includes(classData.status)) {
                    activeClasses++;
                }
            });

            dashboardStats = {
                totalUsers: users.size,
                activeUsers,
                totalClasses: classes.size,
                activeClasses,
                systemHealth: 'Excellent' // This could be based on various metrics
            };
        }

        res.json({
            success: true,
            data: {
                role,
                stats: dashboardStats,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        throw error;
    }
}));

module.exports = router;