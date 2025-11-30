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
            connectSrc: ["'self'", "http://localhost:3001", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://*.googleapis.com", "https://*.firebaseio.com", "wss://*.firebaseio.com", "https://firestore.googleapis.com"],
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

// API Routes
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
