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

/**
 * @route   POST /api/stats/game-scores
 * @desc    Save a game score (for guests and logged users)
 * @access  Public
 */
router.post('/game-scores', asyncHandler(async (req, res) => {
    try {
        console.log('📊 Saving game score:', req.body);
        const { playerName, score, correctAnswers, totalQuestions, bestCombo, subject, difficulty } = req.body;
        
        // Validate required fields
        if (!playerName || score === undefined || !subject) {
            console.log('❌ Missing required fields:', { playerName, score, subject });
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: playerName, score, subject'
            });
        }
        
        // Check if user is logged in
        const isGuest = !req.user;
        
        // Create score document
        const scoreDoc = {
            playerName: playerName.substring(0, 50), // Limit name length
            score: parseInt(score) || 0,
            correctAnswers: parseInt(correctAnswers) || 0,
            totalQuestions: parseInt(totalQuestions) || 10,
            bestCombo: parseInt(bestCombo) || 0,
            subject: subject,
            difficulty: difficulty || 'medium',
            isGuest: isGuest,
            userId: req.user?.uid || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            date: new Date().toISOString()
        };
        
        // Save to Firestore
        const docRef = await admin.firestore()
            .collection('gameScores')
            .add(scoreDoc);
        
        res.json({
            success: true,
            message: 'Score saved successfully',
            data: {
                id: docRef.id,
                ...scoreDoc,
                createdAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error saving game score:', error);
        throw error;
    }
}));

/**
 * @route   GET /api/stats/game-scores
 * @desc    Get game scores leaderboard (top 50)
 * @access  Public
 */
router.get('/game-scores', asyncHandler(async (req, res) => {
    try {
        const { subject, limit = 50 } = req.query;
        
        let query = admin.firestore()
            .collection('gameScores')
            .orderBy('score', 'desc')
            .limit(parseInt(limit));
        
        // Filter by subject if provided
        if (subject) {
            query = admin.firestore()
                .collection('gameScores')
                .where('subject', '==', subject)
                .orderBy('score', 'desc')
                .limit(parseInt(limit));
        }
        
        const snapshot = await query.get();
        
        const scores = [];
        snapshot.forEach(doc => {
            scores.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().date
            });
        });
        
        res.json({
            success: true,
            data: {
                scores,
                total: scores.length
            }
        });
        
    } catch (error) {
        console.error('Error getting game scores:', error);
        throw error;
    }
}));

/**
 * @route   GET /api/stats/game-scores/admin
 * @desc    Get all game scores for admin panel with details
 * @access  Admin only
 */
router.get('/game-scores/admin', requireAdmin, asyncHandler(async (req, res) => {
    try {
        console.log('📊 Admin requesting game scores');
        const { subject, isGuest, startDate, endDate, limit = 100 } = req.query;
        
        let snapshot;
        try {
            // Try with orderBy first (requires index)
            let query = admin.firestore()
                .collection('gameScores')
                .orderBy('createdAt', 'desc')
                .limit(parseInt(limit));
            
            snapshot = await query.get();
        } catch (indexError) {
            // If index doesn't exist, query without ordering
            console.log('⚠️ Index not ready, querying without order:', indexError.message);
            snapshot = await admin.firestore()
                .collection('gameScores')
                .limit(parseInt(limit))
                .get();
        }
        
        let scores = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            scores.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.date
            });
        });
        
        // Apply filters in memory (Firestore has limitations on multiple where clauses)
        if (subject) {
            scores = scores.filter(s => s.subject === subject);
        }
        if (isGuest !== undefined) {
            const guestFilter = isGuest === 'true';
            scores = scores.filter(s => s.isGuest === guestFilter);
        }
        
        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);
        
        // Calculate statistics
        const totalPlays = scores.length;
        const guestPlays = scores.filter(s => s.isGuest).length;
        const userPlays = scores.filter(s => !s.isGuest).length;
        const averageScore = scores.length > 0 
            ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) 
            : 0;
        const topScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;
        
        // Get subject distribution
        const subjectCounts = {};
        scores.forEach(s => {
            subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
        });
        
        console.log('✅ Returning', scores.length, 'game scores to admin');
        res.json({
            success: true,
            data: {
                scores,
                statistics: {
                    totalPlays,
                    guestPlays,
                    userPlays,
                    averageScore,
                    topScore,
                    subjectDistribution: subjectCounts
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting admin game scores:', error);
        throw error;
    }
}));

/**
 * @route   DELETE /api/stats/game-scores/clear-all
 * @desc    Delete all game scores (clear entire table)
 * @access  Admin only
 * NOTE: This route MUST be before :scoreId route
 */
router.delete('/game-scores/clear-all', requireAdmin, asyncHandler(async (req, res) => {
    try {
        console.log('🗑️ Admin clearing all game scores...');
        
        const snapshot = await admin.firestore()
            .collection('gameScores')
            .get();
        
        if (snapshot.empty) {
            return res.json({
                success: true,
                message: 'No scores to delete',
                data: { deleted: 0 }
            });
        }
        
        // Delete in batches (Firestore limit is 500 per batch)
        const batch = admin.firestore().batch();
        let count = 0;
        
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            count++;
        });
        
        await batch.commit();
        
        console.log(`✅ Deleted ${count} game scores`);
        
        res.json({
            success: true,
            message: `Deleted ${count} scores`,
            data: { deleted: count }
        });
        
    } catch (error) {
        console.error('❌ Error clearing all game scores:', error);
        throw error;
    }
}));

/**
 * @route   DELETE /api/stats/game-scores/:scoreId
 * @desc    Delete a game score
 * @access  Admin only
 */
router.delete('/game-scores/:scoreId', requireAdmin, asyncHandler(async (req, res) => {
    try {
        const { scoreId } = req.params;
        
        await admin.firestore()
            .collection('gameScores')
            .doc(scoreId)
            .delete();
        
        res.json({
            success: true,
            message: 'Score deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting game score:', error);
        throw error;
    }
}));

module.exports = router;