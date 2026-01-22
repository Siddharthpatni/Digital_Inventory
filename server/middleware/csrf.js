/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing requests
 */

const crypto = require('crypto');

// Store CSRF tokens in session
const CSRF_SECRET_LENGTH = 32;
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token for the current session
 */
const generateCSRFToken = (req) => {
    if (!req.session) {
        throw new Error('Session is required for CSRF protection');
    }

    // Generate or retrieve CSRF secret for this session
    if (!req.session.csrfSecret) {
        req.session.csrfSecret = crypto.randomBytes(CSRF_SECRET_LENGTH).toString('hex');
    }

    // Generate a new token
    const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');

    // Store token in session
    if (!req.session.csrfTokens) {
        req.session.csrfTokens = [];
    }

    req.session.csrfTokens.push(token);

    // Keep only last 10 tokens (prevent memory leak)
    if (req.session.csrfTokens.length > 10) {
        req.session.csrfTokens = req.session.csrfTokens.slice(-10);
    }

    return token;
};

/**
 * Validate CSRF token from request
 */
const validateCSRFToken = (req) => {
    if (!req.session || !req.session.csrfTokens) {
        return false;
    }

    // Get token from headers or body
    const token = req.headers['x-csrf-token'] ||
        req.headers['csrf-token'] ||
        req.body._csrf;

    if (!token) {
        return false;
    }

    // Check if token exists in session
    const index = req.session.csrfTokens.indexOf(token);
    if (index === -1) {
        return false;
    }

    // Remove used token (one-time use)
    req.session.csrfTokens.splice(index, 1);

    return true;
};

/**
 * Middleware to protect against CSRF attacks
 * Should be applied to all state-changing routes (POST, PUT, DELETE, PATCH)
 */
const csrfProtection = (req, res, next) => {
    // Skip CSRF check for GET and HEAD requests
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next();
    }

    // Exempt authentication endpoints (already protected by rate limiting and account lockout)
    const exemptPaths = ['/api/auth/login', '/api/auth/logout'];
    if (exemptPaths.includes(req.path)) {
        return next();
    }

    // Validate CSRF token
    if (!validateCSRFToken(req)) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or missing CSRF token',
            message: 'This request appears to be forged. Please refresh the page and try again.'
        });
    }

    next();
};

/**
 * Middleware to add CSRF token to response
 * Can be used on GET requests to provide token to client
 */
const addCSRFToken = (req, res, next) => {
    const token = generateCSRFToken(req);
    res.locals.csrfToken = token;

    // Also add to response headers for API clients
    res.setHeader('X-CSRF-Token', token);

    next();
};

/**
 * Route handler to get a new CSRF token
 */
const getCSRFToken = (req, res) => {
    const token = generateCSRFToken(req);
    res.json({
        success: true,
        csrfToken: token
    });
};

module.exports = {
    csrfProtection,
    addCSRFToken,
    getCSRFToken,
    generateCSRFToken,
    validateCSRFToken
};
