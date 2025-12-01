// Validation schemas for authentication endpoints
// Uses Joi for request validation with anti-injection patterns

const Joi = require('joi');
const { validationErrorHandler } = require('../middleware/errorMiddleware');
const { sanitizeEmail, sanitizeId, containsDangerousPattern, SQL_INJECTION_PATTERNS, XSS_PATTERNS } = require('./inputSanitizer');

// Available roles in the system
const VALID_ROLES = ['alumno', 'tutor', 'administrador'];

// Custom Joi extension for injection detection
const safeString = Joi.string().custom((value, helpers) => {
    if (containsDangerousPattern(value, SQL_INJECTION_PATTERNS)) {
        return helpers.error('string.injection', { value });
    }
    if (containsDangerousPattern(value, XSS_PATTERNS)) {
        return helpers.error('string.xss', { value });
    }
    return value;
}).messages({
    'string.injection': 'Input contains potentially dangerous patterns',
    'string.xss': 'Input contains potentially dangerous HTML/script content'
});

/**
 * Registration validation schema
 * Nota: El campo 'role' NO es aceptado en registro público
 * Solo el admin puede asignar roles usando /api/users/create
 */
const registrationSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .max(254)
        .custom((value, helpers) => {
            const sanitized = sanitizeEmail(value);
            if (!sanitized) {
                return helpers.error('string.email');
            }
            return sanitized;
        })
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
            'string.max': 'Email cannot exceed 254 characters'
        }),
    
    password: Joi.string()
        .min(6)
        .max(128)
        .required()
        .pattern(/^[^\s<>'"`;\\]*$/) // No spaces, quotes, or special chars that could be injection
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.max': 'Password cannot exceed 128 characters',
            'any.required': 'Password is required',
            'string.pattern.base': 'Password contains invalid characters'
        }),
    
    name: safeString
        .min(2)
        .max(100)
        .required()
        .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-'.]+$/) // Only letters, spaces, hyphens, apostrophes
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'any.required': 'Name is required',
            'string.pattern.base': 'Name contains invalid characters'
        })
    // Campo 'role' removido - siempre será 'alumno' en registro público
});

/**
 * Login validation schema
 */
const loginSchema = Joi.object({
    idToken: Joi.string()
        .required()
        .messages({
            'any.required': 'ID token is required'
        })
});

/**
 * Role change validation schema
 */
const roleChangeSchema = Joi.object({
    userId: Joi.string()
        .required()
        .pattern(/^[a-zA-Z0-9_-]+$/) // Only alphanumeric, underscore, hyphen
        .max(128)
        .messages({
            'any.required': 'User ID is required',
            'string.pattern.base': 'Invalid user ID format',
            'string.max': 'User ID cannot exceed 128 characters'
        }),
    
    newRole: Joi.string()
        .valid(...VALID_ROLES)
        .required()
        .messages({
            'any.only': `Role must be one of: ${VALID_ROLES.join(', ')}`,
            'any.required': 'New role is required'
        })
});

/**
 * Profile update validation schema
 */
const profileUpdateSchema = Joi.object({
    name: safeString
        .min(2)
        .max(100)
        .optional()
        .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-'.]+$/)
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'string.pattern.base': 'Name contains invalid characters'
        }),
    
    bio: safeString
        .max(500)
        .allow('')
        .optional()
        .messages({
            'string.max': 'Bio cannot exceed 500 characters'
        }),
    
    subjects: Joi.array()
        .items(safeString.max(50).pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-0-9]+$/))
        .max(10)
        .optional()
        .messages({
            'array.max': 'Cannot have more than 10 subjects'
        }),
    
    settings: Joi.object({
        emailNotifications: Joi.boolean().optional(),
        pushNotifications: Joi.boolean().optional(),
        publicProfile: Joi.boolean().optional()
    }).optional()
});

/**
 * Validate registration data
 */
const validateRegistration = (data) => {
    try {
        const { error, value } = registrationSchema.validate(data);
        if (error) {
            validationErrorHandler(error);
        }
        return value;
    } catch (error) {
        throw error;
    }
};

/**
 * Validate login data
 */
const validateLogin = (data) => {
    try {
        const { error, value } = loginSchema.validate(data);
        if (error) {
            validationErrorHandler(error);
        }
        return value;
    } catch (error) {
        throw error;
    }
};

/**
 * Validate role change data
 */
const validateRoleChange = (data) => {
    try {
        const { error, value } = roleChangeSchema.validate(data);
        if (error) {
            validationErrorHandler(error);
        }
        return value;
    } catch (error) {
        throw error;
    }
};

/**
 * Validate profile update data
 */
const validateProfileUpdate = (data) => {
    try {
        const { error, value } = profileUpdateSchema.validate(data);
        if (error) {
            validationErrorHandler(error);
        }
        return value;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    VALID_ROLES,
    validateRegistration,
    validateLogin,
    validateRoleChange,
    validateProfileUpdate,
    // Export schemas for testing
    registrationSchema,
    loginSchema,
    roleChangeSchema,
    profileUpdateSchema
};