/**
 * Request Logger Middleware
 * Logs all incoming requests with response times and user tracking
 */

const logger = require('../utils/logger');

/**
 * Request logger middleware
 * Logs request details and response time
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.logRequest(req, res, duration);
    });

    next();
};

/**
 * User action logger - for audit trail
 * Logs important user actions (create, update, delete)
 */
const auditLogger = (action) => {
    return (req, res, next) => {
        const logData = {
            action,
            user: req.user ? req.user.id : 'anonymous',
            username: req.user ? req.user.username : 'anonymous',
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString(),
            resource: req.originalUrl,
            method: req.method
        };

        // Log after successful response
        const originalSend = res.send;
        res.send = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logger.info('User action', logData);
            }
            originalSend.call(this, data);
        };

        next();
    };
};

module.exports = {
    requestLogger,
    auditLogger
};
