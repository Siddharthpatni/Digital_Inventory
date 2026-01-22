// ===== Digital Inventory - Production-Ready Express Server =====

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');

// Import routes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');

// Import middleware
const logger = require('./utils/logger');
const { requestLogger } = require('./middleware/request-logger');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const { securityHeaders, sanitizeInput, createRateLimiter } = require('./middleware/security');
const { addCSRFToken } = require('./middleware/csrf');
const { initializeRedis, getRedisClient, isRedisAvailable, closeRedis } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===== Security Middleware =====
// Security headers
app.use(securityHeaders);

// Helmet for additional security headers
app.use(helmet({
    contentSecurityPolicy: NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    } : false
}));

// ===== CORS Configuration =====
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// ===== Body Parsing with Size Limits =====
app.use(bodyParser.json({
    limit: process.env.MAX_REQUEST_SIZE || '10mb'
}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: process.env.MAX_REQUEST_SIZE || '10mb'
}));

// ===== Input Sanitization =====
app.use(sanitizeInput);

// ===== Compression =====
app.use(compression());

// ===== Session Configuration =====
let sessionStore;

// Try to use Redis for sessions if available
if (process.env.USE_REDIS !== 'false') {
    try {
        const RedisStore = require('connect-redis').default;
        sessionStore = new RedisStore({
            client: getRedisClient(),
            prefix: 'inventory:sess:',
            ttl: 86400 // 24 hours
        });
        logger.info('Using Redis for session storage');
    } catch (error) {
        logger.warn('Redis not available, falling back to SQLite session store');
        sessionStore = new SQLiteStore({
            db: 'sessions.db',
            dir: path.join(__dirname, '../data'),
            table: 'sessions',
            ttl: 86400000 // 24 hours
        });
    }
} else {
    sessionStore = new SQLiteStore({
        db: 'sessions.db',
        dir: path.join(__dirname, '../data'),
        table: 'sessions',
        ttl: 86400000 // 24 hours
    });
    logger.info('Using SQLite for session storage');
}

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    },
    name: 'inventory.sid' // Custom session cookie name
}));

// ===== Request Logging =====
app.use(requestLogger);

// ===== CSRF Token Middleware =====
// Add CSRF token to all GET requests
app.use((req, res, next) => {
    if (req.method === 'GET' && req.session) {
        addCSRFToken(req, res, next);
    } else {
        next();
    }
});

// ===== Static Files =====
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: NODE_ENV === 'production' ? '1d' : 0
}));

// ===== Rate Limiting =====
// General rate limiter for all routes
const generalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later'
});

// Stricter rate limiter for auth routes
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    message: 'Too many login attempts, please try again later'
});

// Apply rate limiting
if (NODE_ENV === 'production') {
    app.use('/api/', generalLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
}

// ===== Health Check Endpoint =====
app.get('/health', (req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        },
        version: require('../package.json').version || '1.0.0'
    };

    res.json(healthStatus);
});

// ===== API Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', apiRoutes);

// ===== Root Route =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ===== 404 Handler =====
app.use(notFoundHandler);

// ===== Error Handling =====
app.use(errorHandler);

// ===== Process Error Handlers =====
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack
    });

    // In production, attempt graceful shutdown
    if (NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
        reason,
        promise
    });
});

// ===== Graceful Shutdown =====
const gracefulShutdown = (signal) => {
    logger.info(`${signal} signal received: starting graceful shutdown`);

    server.close(() => {
        logger.info('HTTP server closed');

        // Close Redis connection
        closeRedis().then(() => {
            // Close database connections
            sessionStore.close && sessionStore.close();

            logger.info('All connections closed. Exiting process.');
            process.exit(0);
        }).catch((err) => {
            logger.error('Error closing Redis:', err);
            process.exit(1);
        });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ===== Initialize Application =====
async function initializeApp() {
    try {
        // Initialize Redis (optional, falls back to in-memory)
        await initializeRedis();

        // Start server after initialization
        startServer();
    } catch (error) {
        logger.error('Failed to initialize application:', error);
        // Start server anyway with fallback options
        startServer();
    }
}

// ===== Start Server =====
function startServer() {
    const server = app.listen(PORT, () => {
        const startupMessage = `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Digital Inventory Management System                  ║
║                                                            ║
║   Server:      http://localhost:${PORT}${PORT < 10000 ? '     ' : PORT < 100000 ? '    ' : '   '}                    ║
║   Environment: ${NODE_ENV.padEnd(11)}                              ║
║   API:         http://localhost:${PORT}/api${PORT < 10000 ? ' ' : ''}                ║
║   Health:      http://localhost:${PORT}/health${PORT < 10000 ? ' ' : ''}             ║
║                                                            ║
║   📱 QR Code Features:                                     ║
║   • Generate QR codes for inventory items                 ║
║   • Download QR codes (PNG/SVG)                           ║
║   • Batch QR code generation                              ║
║                                                            ║
║   🔐 Login Credentials:                                    ║
║   Manager:    admin / manager123                          ║
║   Sales:      sales / sales123                            ║
║   Warehouse:  warehouse / warehouse123                    ║
║   ${NODE_ENV === 'production' ? '⚠️  CHANGE PASSWORDS IN PRODUCTION!' : '(Development mode)'}                               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`;

        console.log(startupMessage);
        logger.info('Server started successfully', {
            port: PORT,
            environment: NODE_ENV,
            nodeVersion: process.version
        });
    });

    // Set server timeout
    server.timeout = parseInt(process.env.SERVER_TIMEOUT) || 30000; // 30 seconds
}

// Initialize and start the application
initializeApp();

module.exports = app;
