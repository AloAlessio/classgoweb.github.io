// ============================================
// 🔐 TOKEN MANAGER - Sistema de Tokens sin Librerías
// ============================================
// Este archivo maneja la creación, verificación y renovación de tokens
// SIN usar librerías externas como jsonwebtoken

const crypto = require('crypto'); // Nativo de Node.js

// 🔒 SECRET KEY - En producción, usar variable de entorno
const SECRET_KEY = process.env.SECRET_KEY || 'classgo-secret-key-2024-change-in-production';

// ⏱️ CONFIGURACIÓN DE EXPIRACIÓN
const TOKEN_EXPIRATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
const REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // Renovar si quedan menos de 2 horas

/**
 * 🔨 CREAR TOKEN
 * Genera un token firmado con expiración
 * 
 * @param {Object} payload - Datos del usuario { email, userId, role }
 * @returns {String} Token en formato: base64(payload).base64(signature)
 */
function createToken(payload) {
    // 1. Crear payload con timestamp de expiración
    const tokenData = {
        ...payload,
        iat: Date.now(),                    // Issued At (creado en)
        exp: Date.now() + TOKEN_EXPIRATION  // Expires (expira en)
    };
    
    // 2. Convertir payload a base64
    const payloadBase64 = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    
    // 3. Crear firma HMAC SHA256 para verificar que no fue modificado
    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(payloadBase64)
        .digest('base64');
    
    // 4. Token = payload.signature
    return `${payloadBase64}.${signature}`;
}

/**
 * ✅ VERIFICAR TOKEN
 * Verifica que el token sea válido y no haya expirado
 * 
 * @param {String} token - Token a verificar
 * @returns {Object} { valid: boolean, payload: Object|null, shouldRefresh: boolean }
 */
function verifyToken(token) {
    try {
        // 1. Separar payload y firma
        const [payloadBase64, signature] = token.split('.');
        
        if (!payloadBase64 || !signature) {
            return { valid: false, payload: null, shouldRefresh: false };
        }
        
        // 2. Verificar firma (que no haya sido modificado)
        const expectedSignature = crypto
            .createHmac('sha256', SECRET_KEY)
            .update(payloadBase64)
            .digest('base64');
        
        if (signature !== expectedSignature) {
            console.log('❌ Token signature invalid - token was modified');
            return { valid: false, payload: null, shouldRefresh: false };
        }
        
        // 3. Decodificar payload
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
        
        // 4. Verificar expiración
        const now = Date.now();
        
        if (now > payload.exp) {
            console.log('❌ Token expired');
            return { valid: false, payload: null, shouldRefresh: false };
        }
        
        // 5. Verificar si debe renovarse (quedan menos de 2 horas)
        const timeUntilExpiration = payload.exp - now;
        const shouldRefresh = timeUntilExpiration < REFRESH_THRESHOLD;
        
        if (shouldRefresh) {
            console.log(`🔄 Token should refresh - ${Math.round(timeUntilExpiration / 60000)} minutes remaining`);
        }
        
        return { 
            valid: true, 
            payload: payload,
            shouldRefresh: shouldRefresh 
        };
        
    } catch (error) {
        console.error('❌ Token verification error:', error.message);
        return { valid: false, payload: null, shouldRefresh: false };
    }
}

/**
 * 🔄 RENOVAR TOKEN
 * Crea un nuevo token con los mismos datos pero nueva expiración
 * 
 * @param {Object} payload - Payload del token anterior
 * @returns {String} Nuevo token
 */
function refreshToken(payload) {
    // Remover campos de tiempo del payload anterior
    const { iat, exp, ...userData } = payload;
    
    // Crear nuevo token con datos del usuario
    return createToken(userData);
}

/**
 * 📊 OBTENER INFO DEL TOKEN
 * Decodifica el token sin verificar (para debug)
 * 
 * @param {String} token - Token a decodificar
 * @returns {Object|null} Payload decodificado o null
 */
function decodeToken(token) {
    try {
        const [payloadBase64] = token.split('.');
        return JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    } catch (error) {
        return null;
    }
}

/**
 * ⏱️ OBTENER TIEMPO RESTANTE
 * Calcula cuánto tiempo queda antes de que expire el token
 * 
 * @param {String} token - Token a verificar
 * @returns {Number} Milisegundos restantes o 0 si expiró
 */
function getTimeRemaining(token) {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return 0;
    
    const remaining = decoded.exp - Date.now();
    return Math.max(0, remaining);
}

// ============================================
// 📤 EXPORTAR FUNCIONES
// ============================================
module.exports = {
    createToken,
    verifyToken,
    refreshToken,
    decodeToken,
    getTimeRemaining,
    TOKEN_EXPIRATION,
    REFRESH_THRESHOLD
};
