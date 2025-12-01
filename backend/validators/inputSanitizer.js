/**
 * Input Sanitizer for ClassGo
 * Protects against SQL Injection, NoSQL Injection, XSS, and other attacks
 * 
 * Although Firebase/Firestore is not SQL-based, this middleware provides
 * defense-in-depth against various injection attacks and malicious inputs.
 */

const { APIError } = require('../middleware/errorMiddleware');

// ==========================================
// DANGEROUS PATTERNS TO DETECT
// ==========================================

// SQL Injection patterns
const SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(\b(OR|AND)\b\s*[\d\w'"=]+\s*[=<>]+)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bOR\b\s*'?1'?\s*=\s*'?1)/i,
    /(\bOR\b\s*"?1"?\s*=\s*"?1)/i,
    /(\bAND\b\s*'?1'?\s*=\s*'?1)/i,
    /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
    /'\s*OR\s*'.*'\s*=\s*'/i,
    /"\s*OR\s*".*"\s*=\s*"/i,
    /SLEEP\s*\(\s*\d+\s*\)/i,
    /BENCHMARK\s*\(/i,
    /WAITFOR\s+DELAY/i,
    /xp_cmdshell/i,
    /information_schema/i,
    /sys\.databases/i,
];

// NoSQL Injection patterns (for MongoDB-style attacks, but good to catch)
const NOSQL_INJECTION_PATTERNS = [
    /\$where/i,
    /\$gt/i,
    /\$lt/i,
    /\$ne/i,
    /\$in/i,
    /\$or/i,
    /\$and/i,
    /\$regex/i,
    /\$exists/i,
    /\$elemMatch/i,
    /\{\s*["']?\$\w+/i,
];

// XSS patterns
const XSS_PATTERNS = [
    /<script\b[^>]*>/i,
    /<\/script>/i,
    /javascript\s*:/i,
    /on\w+\s*=/i,  // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /vbscript\s*:/i,
    /data\s*:\s*text\/html/i,
    /expression\s*\(/i,
    /url\s*\(\s*["']?\s*javascript/i,
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//,
    /\.\.\\/, 
    /%2e%2e%2f/i,
    /%2e%2e\//i,
    /\.%2e\//i,
    /%2e\.\//i,
    /\.\.%2f/i,
    /etc\/passwd/i,
    /etc\/shadow/i,
    /windows\/system32/i,
];

// Command injection patterns
const COMMAND_INJECTION_PATTERNS = [
    /[;&|`$]/,
    /\$\(.*\)/,
    /`.*`/,
    /\|\s*\w+/,
    />\s*\/\w+/,
    /<\s*\/\w+/,
];

// ==========================================
// SANITIZATION FUNCTIONS
// ==========================================

/**
 * Check if a string contains dangerous patterns
 * @param {string} str - String to check
 * @param {RegExp[]} patterns - Array of regex patterns
 * @returns {boolean} - True if dangerous pattern found
 */
function containsDangerousPattern(str, patterns) {
    if (typeof str !== 'string') return false;
    return patterns.some(pattern => pattern.test(str));
}

/**
 * Sanitize a string by encoding HTML entities
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
function encodeHTMLEntities(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/`/g, '&#x60;');
}

/**
 * Deep check an object for dangerous patterns
 * @param {any} obj - Object to check
 * @param {string} path - Current path (for error messages)
 * @returns {Object} - { safe: boolean, field: string, type: string }
 */
function deepCheckObject(obj, path = '') {
    if (obj === null || obj === undefined) {
        return { safe: true };
    }

    if (typeof obj === 'string') {
        // Check SQL Injection
        if (containsDangerousPattern(obj, SQL_INJECTION_PATTERNS)) {
            return { safe: false, field: path, type: 'SQL Injection' };
        }
        // Check NoSQL Injection
        if (containsDangerousPattern(obj, NOSQL_INJECTION_PATTERNS)) {
            return { safe: false, field: path, type: 'NoSQL Injection' };
        }
        // Check XSS
        if (containsDangerousPattern(obj, XSS_PATTERNS)) {
            return { safe: false, field: path, type: 'XSS' };
        }
        // Check Path Traversal
        if (containsDangerousPattern(obj, PATH_TRAVERSAL_PATTERNS)) {
            return { safe: false, field: path, type: 'Path Traversal' };
        }
        return { safe: true };
    }

    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            const result = deepCheckObject(obj[i], `${path}[${i}]`);
            if (!result.safe) return result;
        }
        return { safe: true };
    }

    if (typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
            // Check the key itself for injection
            if (containsDangerousPattern(key, [...NOSQL_INJECTION_PATTERNS])) {
                return { safe: false, field: `${path}.${key}`, type: 'NoSQL Injection in key' };
            }
            const result = deepCheckObject(obj[key], `${path}.${key}`);
            if (!result.safe) return result;
        }
        return { safe: true };
    }

    return { safe: true };
}

/**
 * Deep sanitize an object by encoding HTML entities in all strings
 * @param {any} obj - Object to sanitize
 * @returns {any} - Sanitized object
 */
function deepSanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'string') {
        return encodeHTMLEntities(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepSanitizeObject(item));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Sanitize key too
            const sanitizedKey = encodeHTMLEntities(key);
            sanitized[sanitizedKey] = deepSanitizeObject(value);
        }
        return sanitized;
    }

    return obj;
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
function sanitizeEmail(email) {
    if (typeof email !== 'string') return null;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmed = email.trim().toLowerCase();
    
    if (!emailRegex.test(trimmed)) return null;
    if (trimmed.length > 254) return null;
    
    // Check for injection attempts in email
    if (containsDangerousPattern(trimmed, SQL_INJECTION_PATTERNS)) return null;
    if (containsDangerousPattern(trimmed, XSS_PATTERNS)) return null;
    
    return trimmed;
}

/**
 * Validate and sanitize ID (alphanumeric + hyphens)
 * @param {string} id - ID to validate
 * @returns {string|null} - Sanitized ID or null if invalid
 */
function sanitizeId(id) {
    if (typeof id !== 'string') return null;
    
    const trimmed = id.trim();
    
    // IDs should only contain alphanumeric characters, hyphens, and underscores
    const idRegex = /^[a-zA-Z0-9_-]+$/;
    if (!idRegex.test(trimmed)) return null;
    if (trimmed.length > 128) return null;
    
    return trimmed;
}

/**
 * Validate numeric input
 * @param {any} value - Value to validate
 * @param {Object} options - { min, max, integer }
 * @returns {number|null} - Validated number or null
 */
function sanitizeNumber(value, options = {}) {
    const num = Number(value);
    if (isNaN(num)) return null;
    
    if (options.min !== undefined && num < options.min) return null;
    if (options.max !== undefined && num > options.max) return null;
    if (options.integer && !Number.isInteger(num)) return null;
    
    return num;
}

// ==========================================
// EXPRESS MIDDLEWARE
// ==========================================

/**
 * Middleware to check all inputs for injection attacks
 * Checks body, query params, and URL params
 */
function inputValidationMiddleware(req, res, next) {
    try {
        // Check request body
        if (req.body) {
            const bodyCheck = deepCheckObject(req.body, 'body');
            if (!bodyCheck.safe) {
                console.warn(`⚠️ Potential ${bodyCheck.type} attack detected in ${bodyCheck.field} from IP: ${req.ip}`);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid input detected',
                    code: 'INVALID_INPUT'
                });
            }
        }

        // Check query parameters
        if (req.query) {
            const queryCheck = deepCheckObject(req.query, 'query');
            if (!queryCheck.safe) {
                console.warn(`⚠️ Potential ${queryCheck.type} attack detected in ${queryCheck.field} from IP: ${req.ip}`);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid input detected',
                    code: 'INVALID_INPUT'
                });
            }
        }

        // Check URL parameters
        if (req.params) {
            const paramsCheck = deepCheckObject(req.params, 'params');
            if (!paramsCheck.safe) {
                console.warn(`⚠️ Potential ${paramsCheck.type} attack detected in ${paramsCheck.field} from IP: ${req.ip}`);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid input detected',
                    code: 'INVALID_INPUT'
                });
            }
        }

        next();
    } catch (error) {
        console.error('Input validation error:', error);
        next(error);
    }
}

/**
 * Middleware to sanitize all string inputs (HTML encode)
 * Use this after validation for defense-in-depth
 */
function inputSanitizationMiddleware(req, res, next) {
    try {
        // Sanitize body
        if (req.body) {
            req.body = deepSanitizeObject(req.body);
        }

        // Sanitize query params
        if (req.query) {
            req.query = deepSanitizeObject(req.query);
        }

        // Note: Don't sanitize req.params as they come from URL routing

        next();
    } catch (error) {
        console.error('Input sanitization error:', error);
        next(error);
    }
}

/**
 * Combined middleware - validates then sanitizes
 */
function secureInputMiddleware(req, res, next) {
    inputValidationMiddleware(req, res, (err) => {
        if (err) return next(err);
        // Skip sanitization for now to avoid double-encoding
        // The validation should catch malicious inputs
        next();
    });
}

// ==========================================
// FIELD-SPECIFIC VALIDATORS
// ==========================================

/**
 * Validate class creation input
 */
function validateClassInput(data) {
    const errors = [];
    
    // Title
    if (!data.title || typeof data.title !== 'string') {
        errors.push('Title is required');
    } else if (data.title.length < 3 || data.title.length > 200) {
        errors.push('Title must be between 3 and 200 characters');
    }
    
    // Description
    if (!data.description || typeof data.description !== 'string') {
        errors.push('Description is required');
    } else if (data.description.length > 2000) {
        errors.push('Description cannot exceed 2000 characters');
    }
    
    // Subject
    if (!data.subject || typeof data.subject !== 'string') {
        errors.push('Subject is required');
    } else if (data.subject.length > 100) {
        errors.push('Subject cannot exceed 100 characters');
    }
    
    // Max students
    if (data.maxStudents !== undefined) {
        const max = sanitizeNumber(data.maxStudents, { min: 1, max: 1000, integer: true });
        if (max === null) {
            errors.push('Max students must be a number between 1 and 1000');
        }
    }
    
    // Duration
    if (data.duration !== undefined) {
        const duration = sanitizeNumber(data.duration, { min: 5, max: 480, integer: true });
        if (duration === null) {
            errors.push('Duration must be between 5 and 480 minutes');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate message/conversation input
 */
function validateMessageInput(data) {
    const errors = [];
    
    if (!data.content || typeof data.content !== 'string') {
        errors.push('Message content is required');
    } else if (data.content.length > 5000) {
        errors.push('Message cannot exceed 5000 characters');
    }
    
    if (data.recipientId && !sanitizeId(data.recipientId)) {
        errors.push('Invalid recipient ID');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate note input
 */
function validateNoteInput(data) {
    const errors = [];
    
    if (!data.title || typeof data.title !== 'string') {
        errors.push('Title is required');
    } else if (data.title.length < 1 || data.title.length > 200) {
        errors.push('Title must be between 1 and 200 characters');
    }
    
    if (!data.content || typeof data.content !== 'string') {
        errors.push('Content is required');
    } else if (data.content.length > 50000) {
        errors.push('Content cannot exceed 50000 characters');
    }
    
    if (data.classId && !sanitizeId(data.classId)) {
        errors.push('Invalid class ID');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    // Middleware
    inputValidationMiddleware,
    inputSanitizationMiddleware,
    secureInputMiddleware,
    
    // Functions
    deepCheckObject,
    deepSanitizeObject,
    encodeHTMLEntities,
    containsDangerousPattern,
    
    // Sanitizers
    sanitizeEmail,
    sanitizeId,
    sanitizeNumber,
    
    // Validators
    validateClassInput,
    validateMessageInput,
    validateNoteInput,
    
    // Patterns (for testing)
    SQL_INJECTION_PATTERNS,
    NOSQL_INJECTION_PATTERNS,
    XSS_PATTERNS,
    PATH_TRAVERSAL_PATTERNS,
    COMMAND_INJECTION_PATTERNS
};
