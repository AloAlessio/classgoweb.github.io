// Error Handling Middleware for ClassGo Backend

/**
 * Custom error class for API errors
 */
class APIError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 404 Not Found middleware
 */
const notFound = (req, res, next) => {
    // Silently ignore Chrome DevTools requests
    if (req.originalUrl.includes('/.well-known/')) {
        return res.status(404).end();
    }
    
    const error = new APIError(`Not found - ${req.originalUrl}`, 404);
    next(error);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        user: req.user?.email || 'Anonymous'
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new APIError(message, 404);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new APIError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new APIError(message, 400);
    }

    // Firestore index errors
    if (err.code === 9 || (err.message && err.message.includes('requires an index'))) {
        const message = 'Database index required. Please check server logs for index creation URL.';
        error = new APIError(message, 500);
    }

    // Firebase errors
    if (err.code && typeof err.code === 'string' && err.code.startsWith('auth/')) {
        switch (err.code) {
            case 'auth/user-not-found':
                error = new APIError('User not found', 404);
                break;
            case 'auth/email-already-exists':
                error = new APIError('Email already exists', 400);
                break;
            case 'auth/invalid-email':
                error = new APIError('Invalid email format', 400);
                break;
            case 'auth/weak-password':
                error = new APIError('Password too weak', 400);
                break;
            default:
                error = new APIError('Authentication error', 401);
        }
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new APIError('Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new APIError('Token expired', 401);
    }

    // Rate limiting errors
    if (err.status === 429) {
        error = new APIError('Too many requests, please try again later', 429);
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            status: statusCode,
            ...(process.env.NODE_ENV === 'development' && { 
                stack: err.stack,
                details: err 
            })
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    });
};

/**
 * Async error wrapper to catch async function errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error handler
 */
const validationErrorHandler = (error) => {
    if (error.isJoi) {
        const message = error.details.map(detail => detail.message).join(', ');
        throw new APIError(message, 400);
    }
    throw error;
};

module.exports = {
    APIError,
    notFound,
    errorHandler,
    asyncHandler,
    validationErrorHandler
};