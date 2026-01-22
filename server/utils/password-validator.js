/**
 * Password Validation Middleware and Utility
 * Server-side password strength validation
 */

const passwordRequirements = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
};

// Common weak passwords that should be rejected
const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321',
    'superman', 'qazwsx', 'michael', 'football', 'admin',
    'admin123', 'welcome', 'login', 'test', 'user', 'root',
    'toor', 'pass', '1234', '12345', '123456', '1234567'
];

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result
 */
function validatePasswordStrength(password) {
    const errors = [];

    if (!password) {
        return {
            valid: false,
            errors: ['Password is required']
        };
    }

    // Check length
    if (password.length < passwordRequirements.minLength) {
        errors.push(`Password must be at least ${passwordRequirements.minLength} characters long`);
    }

    if (password.length > passwordRequirements.maxLength) {
        errors.push(`Password must not exceed ${passwordRequirements.maxLength} characters`);
    }

    // Check for uppercase letters
    if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letters
    if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    // Check for numbers
    if (passwordRequirements.requireNumbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Check for special characters
    if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
    }

    // Check against common passwords
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('This password is too common. Please choose a more secure password');
    }

    // Check for repeated characters (3+ in a row)
    if (/(.)\1{2,}/.test(password)) {
        errors.push('Password should not contain the same character repeated 3+ times');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Express middleware to validate password in request body
 */
function validatePasswordMiddleware(req, res, next) {
    const password = req.body.password || req.body.newPassword;

    if (!password) {
        return res.status(400).json({
            success: false,
            error: 'Password is required'
        });
    }

    const validation = validatePasswordStrength(password);

    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            error: 'Password does not meet security requirements',
            details: validation.errors
        });
    }

    next();
}

module.exports = {
    validatePasswordStrength,
    validatePasswordMiddleware,
    passwordRequirements
};
