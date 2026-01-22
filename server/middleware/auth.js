// ===== Authentication Middleware =====
// Session-based authentication for protected routes

// Require authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        // Set req.user for convenience in route handlers
        req.user = {
            id: req.session.userId,
            username: req.session.username,
            email: req.session.email,
            role: req.session.userRole
        };
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Optional auth - doesn't block, just adds user info if logged in
function optionalAuth(req, res, next) {
    if (req.session && req.session.userId) {
        req.user = {
            id: req.session.userId,
            username: req.session.username,
            email: req.session.email,
            role: req.session.userRole
        };
    }
    next();
}

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.session.userRole)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: roles,
                current: req.session.userRole
            });
        }

        next();
    };
};

module.exports = {
    requireAuth,
    optionalAuth,
    authorize
};
