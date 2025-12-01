// ClassGo Backend Server - Complete Implementation
// Real user management, authentication, classes, and statistics

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { initFirebaseAdmin } = require('./config/firebaseAdmin');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { authenticateUser } = require('./middleware/authMiddleware');
const { secureInputMiddleware } = require('./validators/inputSanitizer');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const statsRoutes = require('./routes/stats');
const notesRoutes = require('./routes/notes');
const conversationRoutes = require('./routes/conversations');
const attendanceRoutes = require('./routes/attendance');

// Initialize Firebase Admin
initFirebaseAdmin();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with CSP adjustments for frontend assets and Firebase
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://*.firebaseio.com"],
            connectSrc: ["'self'", "http://localhost:3001", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://www.gstatic.com", "https://*.googleapis.com", "https://*.firebaseio.com", "wss://*.firebaseio.com", "https://firestore.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
        },
    },
}));
app.use(compression());

// Rate limiting (aumentado para permitir polling)
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// CORS configuration (simplified since frontend is served from same origin)
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : true, // Allow all origins in development since we serve from same server
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Serve static files from frontend directory
const frontendPath = path.join(__dirname, '..', 'frontend');
const rootPath = path.join(__dirname, '..');

console.log('📁 Serving static files from:', frontendPath);
console.log('📄 Root path:', rootPath);

// Serve frontend static files
app.use('/frontend', express.static(frontendPath));

// Serve CSS and JS files directly without /frontend prefix
app.use('/css', express.static(path.join(frontendPath, 'css')));
app.use('/js', express.static(path.join(frontendPath, 'js')));
app.use('/images', express.static(path.join(frontendPath, 'images')));
app.use('/assets', express.static(path.join(frontendPath, 'assets')));

// Serve root files
app.use('/manifest.json', express.static(path.join(rootPath, 'manifest.json')));
app.use('/sw.js', express.static(path.join(rootPath, 'sw.js')));
app.use('/favicon.svg', express.static(path.join(rootPath, 'favicon.svg')));
app.get('/favicon.ico', (req, res) => {
    res.redirect(301, '/favicon.svg');
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input validation and sanitization (anti-injection protection)
app.use('/api/', secureInputMiddleware);

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Frontend routes - serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'html', 'home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(frontendPath, 'html', 'login.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(frontendPath, 'html', 'home.html'));
});

app.get('/student-dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'html', 'student-dashboard-new.html'));
});

app.get('/tutor-dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'html', 'tutor-dashboard-new.html'));
});

app.get('/clear-cache', (req, res) => {
    res.sendFile(path.join(frontendPath, 'html', 'clear-cache.html'));
});

app.get('/test-tokens', (req, res) => {
    res.sendFile(path.join(frontendPath, 'html', 'test-tokens.html'));
});

app.get('/archer-game', (req, res) => {
    res.sendFile(path.join(frontendPath, 'html', 'archer-game.html'));
});

// Public API Routes (no authentication required)
// Game scores - allow guests to save scores
app.post('/api/stats/game-scores', async (req, res, next) => {
    // Optional: Try to authenticate but don't require it
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const { admin } = require('./config/firebaseAdmin');
            const decoded = await admin.auth().verifyIdToken(token);
            req.user = { uid: decoded.uid, role: decoded.role || 'alumno' };
            console.log('📊 Game score POST - authenticated user:', decoded.uid);
        } catch (err) {
            // Token invalid, continue as guest
            req.user = null;
            console.log('📊 Game score POST - invalid token, treating as guest');
        }
    } else {
        req.user = null;
        console.log('📊 Game score POST - no token, saving as guest');
    }
    
    // Handle the request directly here instead of passing to router
    try {
        const { admin } = require('./config/firebaseAdmin');
        const { playerName, score, correctAnswers, totalQuestions, bestCombo, subject, difficulty } = req.body;
        
        console.log('📊 Saving game score:', { playerName, score, subject, isGuest: !req.user });
        
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
            playerName: playerName.substring(0, 50),
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
        
        console.log('✅ Game score saved:', docRef.id, 'isGuest:', isGuest);
        
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
        console.error('❌ Error saving game score:', error);
        res.status(500).json({
            success: false,
            error: 'Error saving score'
        });
    }
});

// Public leaderboard
app.get('/api/stats/game-scores', statsRoutes);

// API Routes (protected)
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateUser, userRoutes);
app.use('/api/classes', authenticateUser, classRoutes);
app.use('/api/stats', authenticateUser, statsRoutes);
app.use('/api/notes', authenticateUser, notesRoutes);
app.use('/api/conversations', authenticateUser, conversationRoutes);
app.use('/api/attendance', attendanceRoutes); // Permitir registro sin auth para Arduino

// API Documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'ClassGo API v1.0',
        documentation: {
            auth: {
                'POST /api/auth/login': 'User login',
                'POST /api/auth/register': 'User registration',
                'POST /api/auth/refresh': 'Refresh token',
                'POST /api/auth/logout': 'User logout'
            },
            users: {
                'GET /api/users/profile': 'Get user profile',
                'PUT /api/users/profile': 'Update user profile',
                'POST /api/users/change-role': 'Change user role (admin only)',
                'GET /api/users/list': 'List users (admin only)'
            },
            classes: {
                'GET /api/classes': 'Get user classes',
                'POST /api/classes': 'Create new class',
                'PUT /api/classes/:id': 'Update class',
                'DELETE /api/classes/:id': 'Delete class',
                'POST /api/classes/:id/join': 'Join class'
            },
            stats: {
                'GET /api/stats/personal': 'Get personal statistics',
                'GET /api/stats/system': 'Get system statistics (admin only)'
            }
        }
    });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

const server = app.listen(PORT, () => {
    console.log('\n🎉 ========================================');
    console.log('🚀 ClassGo Full Stack Server READY!');
    console.log('🎉 ========================================');
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 Home: http://localhost:${PORT}/home`);
    console.log(`🔐 Login: http://localhost:${PORT}/login`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔥 Firebase: Connected`);
    console.log('========================================\n');
});

module.exports = { app, server };
