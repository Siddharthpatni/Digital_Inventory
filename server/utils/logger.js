/**
 * Production Logger Utility
 * Winston-based logging with multiple transports and log rotation
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

// Create transports based on environment
const transports = [];

// Console transport (always active)
transports.push(
    new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
    })
);

// File transports for production
if (process.env.NODE_ENV === 'production') {
    // All logs
    transports.push(
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: logFormat,
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        })
    );

    // Error logs
    transports.push(
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: logFormat,
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        })
    );

    // Access logs
    transports.push(
        new winston.transports.File({
            filename: path.join(logsDir, 'access.log'),
            format: logFormat,
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
});

// Add request logging helper
logger.logRequest = (req, res, duration) => {
    const logData = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        user: req.user ? req.user.id : 'anonymous'
    };

    if (res.statusCode >= 500) {
        logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
        logger.warn('Request error', logData);
    } else {
        logger.info('Request completed', logData);
    }
};

// Add error logging helper
logger.logError = (error, context = {}) => {
    logger.error('Application error', {
        message: error.message,
        stack: error.stack,
        ...context
    });
};

// Add database logging helper
logger.logDatabase = (action, details = {}) => {
    logger.debug('Database operation', {
        action,
        ...details
    });
};

// Stream for Morgan (HTTP request logger)
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

module.exports = logger;
