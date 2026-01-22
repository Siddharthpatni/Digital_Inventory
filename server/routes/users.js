/**
 * User Management Routes
 * Admin-only endpoints for managing users
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const {
    createUser,
    getUserById,
    getUserByUsername,
    getUserByEmail,
    updateUserPassword
} = require('../models/database');
const { requireAuth, authorize } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { validatePasswordStrength } = require('../utils/password-validator');

// Get all users (admin only)
router.get('/', requireAuth, authorize('admin'), async (req, res) => {
    try {
        const db = require('../models/database').db;

        db.all(
            'SELECT id, username, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC',
            [],
            (err, users) => {
                if (err) {
                    console.error('Error fetching users:', err);
                    return res.status(500).json({ error: 'Failed to fetch users' });
                }

                res.json({
                    success: true,
                    users
                });
            }
        );
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single user (admin only)
router.get('/:id', requireAuth, authorize('admin'), async (req, res) => {
    try {
        const user = await getUserById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new user (admin only)
router.post('/', requireAuth, authorize('admin'), csrfProtection, async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            error: 'Username, email, and password are required'
        });
    }

    try {
        // Check if username already exists
        const existingUsername = await getUserByUsername(username);
        if (existingUsername) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Check if email already exists
        const existingEmail = await getUserByEmail(email);
        if (existingEmail) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Validate password
        const validation = validatePasswordStrength(password);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Password does not meet security requirements',
                details: validation.errors
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await createUser({
            username,
            email,
            password_hash,
            role: role || 'user'
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user (admin only)
router.put('/:id', requireAuth, authorize('admin'), csrfProtection, async (req, res) => {
    const { username, email, role, is_active } = req.body;

    try {
        const user = await getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const db = require('../models/database').db;

        // Update user
        db.run(
            `UPDATE users 
             SET username = ?, email = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [username || user.username, email || user.email, role || user.role,
            is_active !== undefined ? is_active : user.is_active, req.params.id],
            function (err) {
                if (err) {
                    console.error('Update user error:', err);
                    return res.status(500).json({ error: 'Failed to update user' });
                }

                res.json({
                    success: true,
                    message: 'User updated successfully'
                });
            }
        );
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user (admin only)
router.delete('/:id', requireAuth, authorize('admin'), csrfProtection, async (req, res) => {
    try {
        // Prevent deleting own account
        if (req.session.userId === parseInt(req.params.id)) {
            return res.status(400).json({
                error: 'Cannot delete your own account'
            });
        }

        const user = await getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const db = require('../models/database').db;

        db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
            if (err) {
                console.error('Delete user error:', err);
                return res.status(500).json({ error: 'Failed to delete user' });
            }

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset user password (admin only)
router.post('/:id/reset-password', requireAuth, authorize('admin'), csrfProtection, async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
    }

    try {
        const user = await getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate new password
        const validation = validatePasswordStrength(newPassword);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Password does not meet security requirements',
                details: validation.errors
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await updateUserPassword(user.id, newPasswordHash);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
