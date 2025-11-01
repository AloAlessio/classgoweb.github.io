// Authentication Middleware for ClassGo
// Handles Firebase token verification and user role management

const { admin } = require('../config/firebaseAdmin');
const { verifyToken, refreshToken } = require('../utils/tokenManager');

/**
 * Middleware to authenticate users using Firebase ID tokens
 */
const authenticateUser = async (req, res, next) => {
    console.log(`🔑 authenticateUser - ${req.method} ${req.path}`);
    try {
        const authorization = req.headers.authorization;
        
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No valid authentication token provided'
            });
        }

        const token = authorization.split('Bearer ')[1];
        
        // ✅ Verificar token con nuestro sistema
        const { valid, payload, shouldRefresh } = verifyToken(token);
        
        if (!valid) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired or invalid. Please login again.',
                tokenExpired: true // 🔔 Flag para que frontend haga logout
            });
        }
        
        // 🔄 Si el token debe renovarse, generar uno nuevo
        let newToken = null;
        if (shouldRefresh) {
            newToken = refreshToken(payload);
            console.log('🔄 Token refreshed for user:', payload.email);
        }
        
        // Get user data from Firestore para verificar que sigue existiendo
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(payload.userId)
            .get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User document does not exist in database'
            });
        }

        const userData = userDoc.data();
        
        // Attach user info to request object
        req.user = {
            uid: payload.userId,
            email: payload.email,
            name: userData.name || userData.displayName,
            role: userData.role || 'alumno',
            emailVerified: userData.emailVerified || true,
            createdAt: userData.createdAt,
            lastLogin: new Date()
        };

        // 📤 Si hay token nuevo, enviarlo en los headers de respuesta
        if (newToken) {
            res.setHeader('X-New-Token', newToken);
        }

        // Update last login timestamp
        await admin.firestore()
            .collection('users')
            .doc(payload.userId)
            .update({
                lastLogin: admin.firestore.FieldValue.serverTimestamp()
            });

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        return res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid authentication token'
        });
    }
};

/**
 * Middleware to check if user has admin privileges
 */
const requireAdmin = (req, res, next) => {
    console.log('🔒 requireAdmin middleware - req.user:', req.user);
    
    if (!req.user) {
        console.log('❌ requireAdmin - No user in request');
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'administrador') {
        console.log(`❌ requireAdmin - User role is '${req.user.role}', not 'administrador'`);
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Administrator privileges required'
        });
    }

    console.log('✅ requireAdmin - User is admin, proceeding');
    next();
};

/**
 * Middleware to check if user has tutor or admin privileges
 */
const requireTutorOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required'
        });
    }

    if (!['tutor', 'administrador'].includes(req.user.role)) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Tutor or administrator privileges required'
        });
    }

    next();
};

/**
 * Middleware to check if user can access resource (owner or admin)
 */
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        
        if (req.user.role === 'administrador' || req.user.uid === resourceUserId) {
            next();
        } else {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only access your own resources'
            });
        }
    };
};

module.exports = {
    authenticateUser,
    requireAdmin,
    requireTutorOrAdmin,
    requireOwnershipOrAdmin
};