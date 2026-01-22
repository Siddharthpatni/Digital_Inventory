const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { getUserByUsername, getUserById, updateUserPassword } = require('../models/database');
const { validatePasswordStrength } = require('../utils/password-validator');
const { getCSRFToken, csrfProtection } = require('../middleware/csrf');

// Account lockout configuration
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map(); // In production, use Redis

/**
 * Check if account is locked
 */
function isAccountLocked(username) {
    const attempts = loginAttempts.get(username);
    if (!attempts) return false;

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        const now = Date.now();
        if (now - attempts.lastAttempt < LOCKOUT_DURATION) {
            return true;
        } else {
            // Lockout period expired, reset attempts
            loginAttempts.delete(username);
            return false;
        }
    }
    return false;
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt(username) {
    const attempts = loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    loginAttempts.set(username, attempts);

    return {
        remaining: Math.max(0, MAX_LOGIN_ATTEMPTS - attempts.count),
        locked: attempts.count >= MAX_LOGIN_ATTEMPTS
    };
}

/**
 * Clear failed login attempts
 */
function clearFailedAttempts(username) {
    loginAttempts.delete(username);
}

// Get CSRF token endpoint
router.get('/csrf-token', getCSRFToken);

// Login endpoint (exempt from CSRF - protected by rate limiting and account lockout instead)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Check if account is locked
        if (isAccountLocked(username)) {
            return res.status(423).json({
                error: 'Account temporarily locked due to too many failed attempts',
                locked: true,
                retryAfter: Math.ceil(LOCKOUT_DURATION / 1000 / 60) // minutes
            });
        }

        // Get user from database
        const user = await getUserByUsername(username);

        if (!user) {
            const attemptInfo = recordFailedAttempt(username);
            return res.status(401).json({
                error: 'Invalid username or password',
                attemptsRemaining: attemptInfo.remaining
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                error: 'Account is deactivated. Please contact an administrator.'
            });
        }

        // Compare password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            const attemptInfo = recordFailedAttempt(username);
            return res.status(401).json({
                error: 'Invalid username or password',
                attemptsRemaining: attemptInfo.remaining
            });
        }

        // Successful login - clear failed attempts
        clearFailedAttempts(username);

        // Create session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.fullName = user.username;
        req.session.email = user.email;
        req.session.userRole = user.role;

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.clearCookie('inventory.sid'); // Match the cookie name from server/index.js
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Get current session
router.get('/session', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                fullName: req.session.fullName,
                email: req.session.email,
                role: req.session.userRole
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Change password endpoint (requires authentication)
router.post('/change-password', csrfProtection, async (req, res) => {
    // Check authentication
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            error: 'Current password and new password are required'
        });
    }

    try {
        // Get user
        const user = await getUserById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Validate new password strength
        const validation = validatePasswordStrength(newPassword);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'New password does not meet security requirements',
                details: validation.errors
            });
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
        if (isSamePassword) {
            return res.status(400).json({
                error: 'New password must be different from current password'
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await updateUserPassword(user.id, newPasswordHash);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

