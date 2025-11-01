// Authentication Routes for ClassGo
// Handles user registration, login, role assignment, and profile management

const express = require('express');
const { admin } = require('../config/firebaseAdmin');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { authenticateUser, requireAdmin } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin, validateRoleChange } = require('../validators/authValidator');
const { createToken } = require('../utils/tokenManager');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', asyncHandler(async (req, res) => {
    // Registro público - siempre crea usuarios con rol 'alumno'
    // Solo el admin puede crear usuarios con otros roles usando /api/users/create
    const { email, password, name } = validateRegistration(req.body);
    const role = 'alumno'; // Forzado a alumno por seguridad

    try {
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
            emailVerified: false
        });

        // Create user document in Firestore
        const userDoc = {
            uid: userRecord.uid,
            email: userRecord.email,
            name,
            role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: admin.firestore.FieldValue.serverTimestamp(),
            profile: {
                avatar: null,
                bio: '',
                subjects: [],
                experience: 0,
                rating: 0,
                totalClasses: 0,
                totalStudents: 0
            },
            settings: {
                emailNotifications: true,
                pushNotifications: true,
                publicProfile: false
            },
            status: 'active'
        };

        await admin.firestore()
            .collection('users')
            .doc(userRecord.uid)
            .set(userDoc);

        // Generate custom token for immediate login
        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                uid: userRecord.uid,
                email: userRecord.email,
                name,
                role,
                customToken
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }
        
        throw error;
    }
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email/password (Firebase Auth on backend)
 * @access  Public
 */
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password, idToken } = req.body;
    
    // Support both direct email/password and Firebase token
    let decodedToken;
    
    if (idToken) {
        // Original Firebase token-based login
        const validation = validateLogin(req.body);
        decodedToken = await admin.auth().verifyIdToken(validation.idToken);
    } else if (email && password) {
        // Direct email/password login with Firebase Auth verification
        try {
            // ⭐ VERIFY PASSWORD using Firebase REST API
            const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY || 'AIzaSyA5D1UCIQ2nzNwVPHFoub46uflwM4PKzmo'}`;
            
            const verifyResponse = await fetch(verifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    returnSecureToken: true
                })
            });
            
            const verifyData = await verifyResponse.json();
            
            if (!verifyResponse.ok) {
                console.log('❌ Password verification failed:', verifyData.error?.message);
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }
            
            console.log('✅ Password verified for:', email);
            
            // Try to get user from Firebase Auth by email
            let firebaseUser;
            try {
                firebaseUser = await admin.auth().getUserByEmail(email);
            } catch (authError) {
                // User might not exist in Firebase Auth, check Firestore only
                console.log('User not in Firebase Auth, checking Firestore only');
            }
            
            // Check if user exists in Firestore by email
            let usersSnapshot = await admin.firestore()
                .collection('users')
                .where('email', '==', email)
                .limit(1)
                .get();
            
            // If not found in Firestore but exists in Firebase Auth, create Firestore document
            if (usersSnapshot.empty && firebaseUser) {
                console.log('Creating Firestore document for existing Firebase user');
                const newUserDoc = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || email.split('@')[0],
                    role: 'alumno', // default role
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
                    profile: {
                        avatar: firebaseUser.photoURL || null,
                        bio: '',
                        subjects: [],
                        experience: 0,
                        rating: 0,
                        totalClasses: 0,
                        totalStudents: 0
                    },
                    settings: {
                        emailNotifications: true,
                        pushNotifications: true,
                        publicProfile: false
                    },
                    status: 'active'
                };
                
                await admin.firestore()
                    .collection('users')
                    .doc(firebaseUser.uid)
                    .set(newUserDoc);
                
                // Re-query to get the document we just created
                usersSnapshot = await admin.firestore()
                    .collection('users')
                    .doc(firebaseUser.uid)
                    .get();
            }
            
            if (usersSnapshot.empty && !firebaseUser) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials - user not found'
                });
            }
            
            const userDoc = usersSnapshot.docs ? usersSnapshot.docs[0] : usersSnapshot;
            const userData = userDoc.data();
            
            // ✅ Check if user is active (IMPORTANT: Block inactive/banned users)
            if (userData.status === 'inactive' || userData.status === 'banned') {
                return res.status(403).json({
                    success: false,
                    error: 'Account is inactive or suspended. Please contact support.'
                });
            }
            
            // Update last login
            await admin.firestore()
                .collection('users')
                .doc(userDoc.id)
                .update({
                    lastLogin: admin.firestore.FieldValue.serverTimestamp()
                });
            
            // ✅ Crear token con expiración (24h)
            const token = createToken({
                email: email,
                userId: userDoc.id,
                role: userData.role
            });
            
            console.log('✅ Login successful:', {
                email: userData.email,
                name: userData.name || userData.displayName,
                role: userData.role,
                uid: userDoc.id
            });
            
            return res.json({
                success: true,
                message: 'Login successful',
                token: token,
                user: {
                    id: userDoc.id,
                    uid: userData.uid || userDoc.id,
                    email: userData.email,
                    nombre: userData.name || userData.displayName || email.split('@')[0],
                    rol: userData.role,
                    profile: userData.profile || {},
                    settings: userData.settings || {}
                }
            });
        } catch (loginError) {
            console.error('Login error:', loginError);
            return res.status(500).json({
                success: false,
                error: 'Login failed: ' + loginError.message
            });
        }
    } else {
        return res.status(400).json({
            success: false,
            error: 'Email and password or idToken required'
        });
    }

    // This code path is for Firebase token-based authentication
    try {
        // Get user data from Firestore
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(decodedToken.uid)
            .get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }

        const userData = userDoc.data();

        // Check if user is active
        if (userData.status === 'inactive' || userData.status === 'banned') {
            return res.status(403).json({
                success: false,
                error: 'Account is inactive or suspended'
            });
        }

        // Update last login
        await admin.firestore()
            .collection('users')
            .doc(decodedToken.uid)
            .update({
                lastLogin: admin.firestore.FieldValue.serverTimestamp()
            });

        res.json({
            success: true,
            message: 'Login successful',
            token: idToken,
            user: {
                id: decodedToken.uid,
                uid: decodedToken.uid, // Use decoded token UID, not userData.uid
                email: userData.email,
                nombre: userData.name,
                rol: userData.role,
                profile: userData.profile,
                settings: userData.settings,
                lastLogin: userData.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                error: 'Token expired, please login again'
            });
        }
        
        throw error;
    }
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh user token and get updated profile
 * @access  Private
 */
router.post('/refresh', authenticateUser, asyncHandler(async (req, res) => {
    try {
        // Get fresh user data
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
            message: 'Profile refreshed',
            data: {
                uid: req.user.uid, // Use authenticated user UID
                email: userData.email,
                name: userData.name,
                role: userData.role,
                profile: userData.profile,
                settings: userData.settings,
                lastLogin: userData.lastLogin
            }
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/auth/change-role
 * @desc    Change user role (Admin only)
 * @access  Private (Admin)
 */
router.post('/change-role', authenticateUser, requireAdmin, asyncHandler(async (req, res) => {
    const { userId, newRole } = validateRoleChange(req.body);

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

        // Log role change
        await admin.firestore()
            .collection('auditLog')
            .add({
                action: 'role_change',
                targetUserId: userId,
                targetUserEmail: userData.email,
                oldRole: userData.role,
                newRole: newRole,
                performedBy: req.user.uid,
                performedByEmail: req.user.email,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
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
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke tokens)
 * @access  Private
 */
router.post('/logout', authenticateUser, asyncHandler(async (req, res) => {
    try {
        // Revoke all user tokens
        await admin.auth().revokeRefreshTokens(req.user.uid);

        // Update logout timestamp
        await admin.firestore()
            .collection('users')
            .doc(req.user.uid)
            .update({
                lastLogout: admin.firestore.FieldValue.serverTimestamp()
            });

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        throw error;
    }
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'Email is required'
        });
    }

    try {
        // Generate password reset link
        const resetLink = await admin.auth().generatePasswordResetLink(email);

        // In production, you would send this via email service
        // For now, we'll just return success
        console.log(`📧 Password reset link for ${email}:`, resetLink);

        // Log the reset request
        await admin.firestore()
            .collection('auditLogs')
            .add({
                action: 'password_reset_requested',
                email,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                resetLink // Remove this in production for security
            });

        res.json({
            success: true,
            message: 'Password reset email sent. Please check your inbox.',
            // In development, return the link. Remove in production!
            resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
        });

    } catch (error) {
        console.error('Password reset error:', error);
        
        if (error.code === 'auth/user-not-found') {
            // Don't reveal if email exists (security best practice)
            return res.json({
                success: true,
                message: 'If that email exists, a password reset link has been sent.'
            });
        }
        
        throw error;
    }
}));

/**
 * @route   POST /api/auth/test-token
 * @desc    Generate a test token with custom expiration (TESTING ONLY)
 * @access  Private (requires valid token)
 */
router.post('/test-token', authenticateUser, asyncHandler(async (req, res) => {
    const { hoursUntilExpiration } = req.body;
    
    if (!hoursUntilExpiration || hoursUntilExpiration < 0 || hoursUntilExpiration > 24) {
        return res.status(400).json({
            success: false,
            message: 'hoursUntilExpiration must be between 0 and 24'
        });
    }
    
    // Importar crypto para crear token personalizado
    const crypto = require('crypto');
    const SECRET_KEY = process.env.SECRET_KEY || 'classgo-secret-key-2024-change-in-production';
    
    // Crear token que expire en X horas
    const tokenData = {
        email: req.user.email,
        userId: req.user.uid,
        role: req.user.role,
        iat: Date.now() - (24 - hoursUntilExpiration) * 60 * 60 * 1000, // Ajustar iat
        exp: Date.now() + hoursUntilExpiration * 60 * 60 * 1000  // Expira en X horas
    };
    
    const payloadBase64 = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(payloadBase64)
        .digest('base64');
    
    const testToken = `${payloadBase64}.${signature}`;
    
    res.json({
        success: true,
        message: `Test token generated (expires in ${hoursUntilExpiration}h)`,
        token: testToken,
        expiresAt: new Date(tokenData.exp).toISOString(),
        shouldRefresh: hoursUntilExpiration < 2
    });
}));

module.exports = router;