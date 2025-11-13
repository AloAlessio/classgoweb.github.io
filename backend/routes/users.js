// User Management Routes for ClassGo
// Handles user profiles, role management, and user listing

const express = require('express');
const { admin } = require('../config/firebaseAdmin');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { requireAdmin, requireOwnershipOrAdmin } = require('../middleware/authMiddleware');
const { validateProfileUpdate } = require('../validators/authValidator');

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile (alias)
 * @access  Private
 */
router.get('/me', asyncHandler(async (req, res) => {
    try {
        console.log('🔍 GET /api/users/me called for user:', req.user.email);
        
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(req.user.uid)
            .get();

        if (!userDoc.exists) {
            console.log('❌ User document not found for uid:', req.user.uid);
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }

        const userData = userDoc.data();
        console.log('✅ User profile found:', userData.email, 'Role:', userData.role);

        res.json({
            success: true,
            data: {
                uid: req.user.uid, // Use UID from authenticated user
                email: userData.email,
                name: userData.name || userData.displayName || 'Sin nombre',
                role: userData.role,
                profile: userData.profile,
                settings: userData.settings,
                createdAt: userData.createdAt,
                lastLogin: userData.lastLogin
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', asyncHandler(async (req, res) => {
    try {
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(req.user.uid)
            .get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }

        const userData = userDoc.data();

        res.json({
            success: true,
            data: {
                uid: req.user.uid, // Use UID from authenticated user
                email: userData.email,
                name: userData.name || userData.displayName || 'Sin nombre',
                role: userData.role,
                profile: userData.profile,
                settings: userData.settings,
                createdAt: userData.createdAt,
                lastLogin: userData.lastLogin
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', asyncHandler(async (req, res) => {
    const updateData = validateProfileUpdate(req.body);

    try {
        const updateObject = {};

        // Update name if provided
        if (updateData.name) {
            updateObject.name = updateData.name;
            // Also update in Firebase Auth
            await admin.auth().updateUser(req.user.uid, {
                displayName: updateData.name
            });
        }

        // Update profile fields
        if (updateData.bio !== undefined) {
            updateObject['profile.bio'] = updateData.bio;
        }

        if (updateData.subjects) {
            updateObject['profile.subjects'] = updateData.subjects;
        }

        // Update settings
        if (updateData.settings) {
            Object.keys(updateData.settings).forEach(key => {
                updateObject[`settings.${key}`] = updateData.settings[key];
            });
        }

        // Add timestamp
        updateObject.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await admin.firestore()
            .collection('users')
            .doc(req.user.uid)
            .update(updateObject);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updateData
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   GET /api/users
 * @desc    Get all users for assignment (Tutors and Admins)
 * @access  Private (Tutor/Admin)
 */
router.get('/', asyncHandler(async (req, res) => {
    try {
        const { role } = req.query;
        
        console.log('📋 GET /api/users - Fetching users, role filter:', role);
        
        let query = admin.firestore().collection('users');
        
        // Filter by role if provided
        if (role) {
            query = query.where('role', '==', role);
        }
        
        // Get all users (don't filter by status as it may not exist)
        const snapshot = await query.get();
        
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                id: doc.id,
                email: data.email,
                name: data.name || data.displayName || 'Sin nombre',
                role: data.role,
                status: data.status || 'active'
            };
        });
        
        // Filter active users client-side and sort by name
        const activeUsers = users
            .filter(user => user.status === 'active' || !user.status)
            .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('✅ Found', activeUsers.length, 'users');
        
        res.json({
            success: true,
            users: activeUsers,
            total: activeUsers.length
        });
        
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener usuarios'
        });
    }
}));

/**
 * @route   GET /api/users/list
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get('/list', requireAdmin, asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 20, role, status, search } = req.query;
        const offset = (page - 1) * limit;

        let query = admin.firestore().collection('users');

        // Filter by role
        if (role && ['alumno', 'tutor', 'administrador'].includes(role)) {
            query = query.where('role', '==', role);
        }

        // Filter by status
        if (status && ['active', 'inactive', 'banned'].includes(status)) {
            query = query.where('status', '==', status);
        }

        // Apply pagination
        query = query.orderBy('createdAt', 'desc').limit(parseInt(limit)).offset(offset);

        const snapshot = await query.get();
        
        let users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id, // Use document ID, not data.uid
                email: data.email,
                name: data.name || data.displayName || 'Sin nombre',
                role: data.role,
                status: data.status || 'active',
                createdAt: data.createdAt,
                lastLogin: data.lastLogin,
                profile: {
                    totalClasses: data.profile?.totalClasses || 0,
                    totalStudents: data.profile?.totalStudents || 0,
                    rating: data.profile?.rating || 0
                }
            };
        });

        // Apply text search filter (client-side for now)
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(user => 
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower)
            );
        }

        // Get total count for pagination
        const totalQuery = admin.firestore().collection('users');
        const totalSnapshot = await totalQuery.get();
        const total = totalSnapshot.size;

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalUsers: total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/users/change-role
 * @desc    Change user role (Admin only)
 * @access  Private (Admin)
 */
router.post('/change-role', requireAdmin, asyncHandler(async (req, res) => {
    console.log('🎯 RUTA /change-role ALCANZADA! req.body:', req.body);
    console.log('🎯 Usuario actual:', req.user);
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
        return res.status(400).json({
            success: false,
            error: 'userId and newRole are required'
        });
    }

    if (!['alumno', 'tutor', 'administrador'].includes(newRole)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid role. Must be: alumno, tutor, or administrador'
        });
    }

    try {
        // Check if target user exists
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userData = userDoc.data();

        // Prevent changing own role unless there are other admins
        if (userId === req.user.uid && newRole !== 'administrador') {
            // Check if there are other active admins
            const adminQuery = await admin.firestore()
                .collection('users')
                .where('role', '==', 'administrador')
                .where('status', '==', 'active')
                .get();

            if (adminQuery.docs.length <= 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot remove last administrator'
                });
            }
        }

        // Update user role
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .update({
                role: newRole,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: req.user.uid
            });

        res.json({
            success: true,
            message: `User role changed from ${userData.role} to ${newRole}`,
            data: {
                userId,
                email: userData.email,
                name: userData.name,
                oldRole: userData.role,
                newRole
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/users/change-status
 * @desc    Change user status (active/inactive) - Admin only
 * @access  Private (Admin)
 */
router.post('/change-status', requireAdmin, asyncHandler(async (req, res) => {
    console.log('🎯 RUTA /change-status ALCANZADA! req.body:', req.body);
    console.log('🎯 Usuario actual:', req.user);
    const { userId, newStatus } = req.body;

    if (!userId || !newStatus) {
        return res.status(400).json({
            success: false,
            error: 'userId and newStatus are required'
        });
    }

    if (!['active', 'inactive', 'banned'].includes(newStatus)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid status. Must be: active, inactive, or banned'
        });
    }

    try {
        // Check if target user exists
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userData = userDoc.data();

        // Prevent changing own status
        if (userId === req.user.uid) {
            return res.status(400).json({
                success: false,
                error: 'Cannot change your own status'
            });
        }

        // Update user status
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .update({
                status: newStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: req.user.uid
            });

        res.json({
            success: true,
            message: `User status changed from ${userData.status || 'active'} to ${newStatus}`,
            data: {
                userId,
                email: userData.email,
                name: userData.name,
                oldStatus: userData.status || 'active',
                newStatus
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/users/create
 * @desc    Create new user (Admin only)
 * @access  Private (Admin)
 */
router.post('/create', requireAdmin, asyncHandler(async (req, res) => {
    console.log('🎯 RUTA /create ALCANZADA! req.body:', req.body);
    console.log('🎯 Usuario actual:', req.user);
    
    const { email, password, name, role } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
        return res.status(400).json({
            success: false,
            error: 'email, password, name, and role are required'
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid email format'
        });
    }

    // Validate role
    if (!['alumno', 'tutor', 'administrador'].includes(role)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid role. Must be: alumno, tutor, or administrador'
        });
    }

    // Validate password strength
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'Password must be at least 6 characters long'
        });
    }

    try {
        // Check if user already exists in Authentication
        let userExists = false;
        try {
            await admin.auth().getUserByEmail(email);
            userExists = true;
        } catch (error) {
            // User doesn't exist, that's fine
        }

        if (userExists) {
            return res.status(400).json({
                success: false,
                error: 'A user with this email already exists'
            });
        }

        // Create user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: name,
            emailVerified: true
        });

        console.log('✅ User created in Authentication:', userRecord.uid);

        // Create user document in Firestore
        const userData = {
            email: email,
            name: name,
            displayName: name,
            role: role,
            status: 'active',
            profile: {
                name: name,
                bio: '',
                phone: '',
                subjects: [],
                experience: '',
                rating: 0,
                ratingCount: 0
            },
            preferences: {
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                },
                privacy: {
                    profileVisible: true,
                    contactVisible: false
                }
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: null
        };

        await admin.firestore()
            .collection('users')
            .doc(userRecord.uid)
            .set(userData);

        console.log('✅ User document created in Firestore');

        // Log audit trail
        await admin.firestore()
            .collection('audit_logs')
            .add({
                action: 'user_created',
                performedBy: req.user.uid,
                performedByEmail: req.user.email,
                targetUser: userRecord.uid,
                targetUserEmail: email,
                details: {
                    name: name,
                    role: role
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        res.json({
            success: true,
            message: 'User created successfully',
            data: {
                uid: userRecord.uid,
                email: email,
                name: name,
                role: role,
                status: 'active'
            }
        });

    } catch (error) {
        console.error('Error creating user:', error);
        
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({
                success: false,
                error: 'A user with this email already exists'
            });
        }
        
        if (error.code === 'auth/invalid-email') {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }
        
        if (error.code === 'auth/weak-password') {
            return res.status(400).json({
                success: false,
                error: 'Password is too weak'
            });
        }
        
        throw error;
    }
}));

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user from both Authentication and Firestore
 * @access  Admin only
 */
router.delete('/:userId', requireAdmin, asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const adminUid = req.user.uid;
    
    console.log(`🗑️ Admin ${req.user.email} attempting to delete user: ${userId}`);
    
    // Prevent admin from deleting themselves
    if (userId === adminUid) {
        return res.status(400).json({
            success: false,
            error: 'Cannot delete your own account'
        });
    }
    
    try {
        // 1. Get user data from Firestore first (for logging)
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();
        
        const userData = userDoc.exists ? userDoc.data() : null;
        const userEmail = userData?.email || 'Unknown';
        const userRole = userData?.role || 'Unknown';
        
        console.log(`📋 Deleting user: ${userEmail} (${userRole})`);
        
        // 2. Delete from Authentication
        try {
            await admin.auth().deleteUser(userId);
            console.log(`✅ User deleted from Authentication: ${userEmail}`);
        } catch (authError) {
            if (authError.code === 'auth/user-not-found') {
                console.log(`⚠️ User not found in Authentication: ${userId}`);
            } else {
                throw authError;
            }
        }
        
        // 3. Delete from Firestore
        if (userDoc.exists) {
            await admin.firestore()
                .collection('users')
                .doc(userId)
                .delete();
            console.log(`✅ User deleted from Firestore: ${userEmail}`);
        } else {
            console.log(`⚠️ User not found in Firestore: ${userId}`);
        }
        
        // 4. Create audit log
        await admin.firestore()
            .collection('auditLogs')
            .add({
                action: 'USER_DELETED',
                performedBy: adminUid,
                performedByEmail: req.user.email,
                targetUser: userId,
                targetEmail: userEmail,
                targetRole: userRole,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                details: {
                    deletedFrom: {
                        authentication: true,
                        firestore: userDoc.exists
                    }
                }
            });
        
        res.json({
            success: true,
            message: `User ${userEmail} deleted successfully`,
            data: {
                userId,
                email: userEmail,
                deletedFrom: {
                    authentication: true,
                    firestore: userDoc.exists
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        throw error;
    }
}));

module.exports = router;