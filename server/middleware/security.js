/**
 * Security Middleware
 * CSRF protection, XSS prevention, and input sanitization
 */

const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Input sanitization middleware
 * Removes potentially dangerous characters from inputs
 */
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remove script tags and dangerous patterns
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        }
        if (typeof obj === 'object' && obj !== null) {
            for (let key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }
    if (req.query) {
        req.query = sanitize(req.query);
    }
    if (req.params) {
        req.params = sanitize(req.params);
    }

    next();
};

/**
 * SQL injection prevention helper
 * Validates that input doesn't contain SQL injection patterns
 */
const validateSQLSafe = (value) => {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
        /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,
        /(UNION|OR|AND)\s+.*=/gi
    ];

    for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
            return false;
        }
    }
    return true;
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy (basic)
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self';"
    );

    next();
};

/**
 * Rate limiting tracker (simple in-memory implementation)
 * For production, use Redis or similar
 */
const rateLimitStore = new Map();

const createRateLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100, // limit each IP to 100 requests per windowMs
        message = 'Too many requests, please try again later'
    } = options;

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        // Get or create rate limit record
        let record = rateLimitStore.get(key);

        if (!record) {
            record = { count: 0, resetTime: now + windowMs };
            rateLimitStore.set(key, record);
        }

        // Reset if window has passed
        if (now > record.resetTime) {
            record.count = 0;
            record.resetTime = now + windowMs;
        }

        // Increment counter
        record.count++;

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
        res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

        // Check if limit exceeded
        if (record.count > max) {
            logger.warn('Rate limit exceeded', {
                ip: key,
                url: req.originalUrl,
                count: record.count
            });

            return res.status(429).json({
                success: false,
                error: {
                    message,
                    statusCode: 429,
                    retryAfter: Math.ceil((record.resetTime - now) / 1000)
                }
            });
        }

        next();
    };
};

// Clean up old rate limit records periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime + 60000) { // 1 minute after reset
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Run every minute

module.exports = {
    sanitizeInput,
    validateSQLSafe,
    securityHeaders,
    createRateLimiter
};
