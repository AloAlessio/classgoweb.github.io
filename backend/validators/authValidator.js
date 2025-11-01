// Validation schemas for authentication endpoints
// Uses Joi for request validation

const Joi = require('joi');
const { validationErrorHandler } = require('../middleware/errorMiddleware');

// Available roles in the system
const VALID_ROLES = ['alumno', 'tutor', 'administrador'];

/**
 * Registration validation schema
 * Nota: El campo 'role' NO es aceptado en registro público
 * Solo el admin puede asignar roles usando /api/users/create
 */
const registrationSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'any.required': 'Password is required'
        }),
    
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'any.required': 'Name is required'
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
        .messages({
            'any.required': 'User ID is required'
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
    name: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    
    bio: Joi.string()
        .max(500)
        .allow('')
        .optional()
        .messages({
            'string.max': 'Bio cannot exceed 500 characters'
        }),
    
    subjects: Joi.array()
        .items(Joi.string())
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