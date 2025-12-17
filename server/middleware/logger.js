// ===== Request Logging Middleware =====
// Morgan-based HTTP request logging

const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
);

// Custom token for user information
morgan.token('user', (req) => {
    return req.user ? `${req.user.username}(${req.user.id})` : 'anonymous';
});

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
    if (!req._startAt || !res._startAt) {
        return '';
    }
    const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
        (res._startAt[1] - req._startAt[1]) * 1e-6;
    return ms.toFixed(3);
});

// Custom format for development
const devFormat = ':method :url :status :response-time ms - :user - :res[content-length]';

// Custom format for production (combined with user info)
const prodFormat = ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

// Development logger (console)
const developmentLogger = morgan(devFormat, {
    skip: (req, res) => res.statusCode < 400 // Only log errors in development
});

// Production logger (file)
const productionLogger = morgan(prodFormat, {
    stream: accessLogStream
});

// Combined logger
const logger = process.env.NODE_ENV === 'production'
    ? productionLogger
    : developmentLogger;

// Audit log helper
const createAuditLog = async (req, action, entityType, entityId, oldValues, newValues) => {
    const db = require('../models/database');

    try {
        await db.createAuditLog({
            user_id: req.user ? req.user.id : null,
            action,
            entity_type: entityType,
            entity_id: entityId,
            old_values: oldValues,
            new_values: newValues,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('user-agent')
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};

module.exports = {
    logger,
    createAuditLog
};
