// ===== Error Handling Middleware =====
// Centralized error handling for the application

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error classes
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}

class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

// Error logger
const logError = (err, req) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
            name: err.name,
            message: err.message,
            statusCode: err.statusCode,
            stack: err.stack
        },
        request: {
            method: req.method,
            url: req.url,
            params: req.params,
            query: req.query,
            body: req.body,
            ip: req.ip,
            user: req.user ? { id: req.user.id, username: req.user.username } : null
        }
    };

    // In production, you would send this to a logging service
    console.error('❌ Error:', JSON.stringify(errorLog, null, 2));
};

// Development error response
const sendErrorDev = (err, req, res) => {
    res.status(err.statusCode || 500).json({
        status: 'error',
        error: {
            message: err.message,
            name: err.name,
            statusCode: err.statusCode,
            stack: err.stack,
            timestamp: err.timestamp
        },
        request: {
            method: req.method,
            url: req.url
        }
    });
};

// Production error response
const sendErrorProd = (err, req, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            status: 'error',
            message: err.message,
            timestamp: err.timestamp
        });
    }
    // Programming or unknown error: don't leak error details
    else {
        console.error('💥 CRITICAL ERROR:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.',
            timestamp: new Date().toISOString()
        });
    }
};

// Handle specific database errors
const handleDatabaseError = (err) => {
    if (err.code === 'SQLITE_CONSTRAINT') {
        if (err.message.includes('UNIQUE')) {
            return new ConflictError('A record with this value already exists');
        }
        if (err.message.includes('FOREIGN KEY')) {
            return new ValidationError('Invalid reference to related data');
        }
    }

    if (err.code === 'SQLITE_ERROR') {
        return new AppError('Database operation failed', 500, false);
    }

    return err;
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
    // Log the error
    logError(err, req);

    // Handle specific error types
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.statusCode = err.statusCode;
    error.isOperational = err.isOperational;
    error.timestamp = err.timestamp || new Date().toISOString();

    // Handle database errors
    if (err.code && err.code.startsWith('SQLITE_')) {
        error = handleDatabaseError(err);
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AuthenticationError('Invalid token');
    }
    if (err.name === 'TokenExpiredError') {
        error = new AuthenticationError('Token expired');
    }

    // Send error response
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
        sendErrorDev(error, req, res);
    } else {
        sendErrorProd(error, req, res);
    }
};

// 404 handler
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl}`);
    next(error);
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    errorHandler,
    notFoundHandler,
    asyncHandler
};
