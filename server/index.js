// ===== Digital Inventory - Professional Express Server =====

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const apiRoutes = require('./routes/api');
const { logger } = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Security Middleware =====
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development, configure properly in production
}));

// ===== Rate Limiting =====
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// ===== CORS Configuration =====
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// ===== Body Parsing =====
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ===== Compression =====
app.use(compression());

// ===== Request Logging =====
app.use(logger);

// ===== Static Files =====
app.use(express.static(path.join(__dirname, '../public')));

// ===== Health Check Endpoint =====
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ===== API Routes =====
app.use('/api', apiRoutes);

// ===== Root Route =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ===== 404 Handler =====
app.use(notFoundHandler);

// ===== Error Handling =====
app.use(errorHandler);

// ===== Graceful Shutdown =====
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

// ===== Start Server =====
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Digital Inventory Management System                  ║
║                                                            ║
║   Server:      http://localhost:${PORT}                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║   API:         http://localhost:${PORT}/api                    ║
║   Health:      http://localhost:${PORT}/health                 ║
║                                                            ║
║   Default Admin Credentials:                              ║
║   Username: admin                                         ║
║   Password: admin123                                      ║
║   (Please change in production!)                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
