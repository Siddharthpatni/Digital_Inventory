/**
 * Centralized Error Handler Middleware
 * Production-ready error handling with proper logging and sanitization
 */

const logger = require('../utils/logger');

/**
 * Custom Application Error Class
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (err, includeStack = false) => {
    const response = {
        success: false,
        error: {
            message: err.message || 'An unexpected error occurred',
            statusCode: err.statusCode || 500,
            timestamp: err.timestamp || new Date().toISOString()
        }
    };

    // Include stack trace only in development
    if (includeStack && process.env.NODE_ENV !== 'production') {
        response.error.stack = err.stack;
    }

    return response;
};

/**
 * Development error handler - includes detailed error information
 */
const developmentErrorHandler = (err, req, res, next) => {
    logger.logError(err, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id
    });

    res.status(err.statusCode || 500).json(formatErrorResponse(err, true));
};

/**
 * Production error handler - sanitized error messages
 */
const productionErrorHandler = (err, req, res, next) => {
    // Log all errors
    logger.logError(err, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id
    });

    // Don't leak error details in production for non-operational errors
    if (!err.isOperational) {
        return res.status(500).json({
            success: false,
            error: {
                message: 'An unexpected error occurred. Please try again later.',
                statusCode: 500,
                timestamp: new Date().toISOString()
            }
        });
    }

    res.status(err.statusCode || 500).json(formatErrorResponse(err, false));
};

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Set default values
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        err.statusCode = 400;
        err.message = 'Validation Error: ' + err.message;
    }

    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        err.statusCode = 401;
        err.message = 'Invalid or expired token';
    }

    if (err.code === 'SQLITE_CONSTRAINT') {
        err.statusCode = 409;
        err.message = 'Database constraint violation';
    }

    if (err.type === 'entity.too.large') {
        err.statusCode = 413;
        err.message = 'Request payload too large';
    }

    // Use appropriate handler based on environment
    if (process.env.NODE_ENV === 'production') {
        productionErrorHandler(err, req, res, next);
    } else {
        developmentErrorHandler(err, req, res, next);
    }
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(
        `Route not found: ${req.method} ${req.originalUrl}`,
        404
    );
    next(error);
};

/**
 * Async error wrapper - catches errors in async route handlers
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    AppError,
    errorHandler,
    notFoundHandler,
    catchAsync
};
