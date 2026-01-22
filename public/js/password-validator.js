// Password Validation Utility
// Validates password strength and enforces complexity requirements

const PasswordValidator = {
    // Password requirements
    requirements: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    },

    // Common weak passwords to reject
    commonPasswords: [
        'password', 'password123', '12345678', 'qwerty', 'abc123',
        'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
        'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
        'bailey', 'passw0rd', 'shadow', '123123', '654321',
        'superman', 'qazwsx', 'michael', 'football', 'admin',
        'admin123', 'welcome', 'login', 'test', 'user'
    ],

    /**
     * Validate password against all requirements
     * @param {string} password - The password to validate
     * @returns {Object} - Validation result with passed flag and messages
     */
    validate(password) {
        const result = {
            passed: true,
            strength: 0,
            messages: [],
            suggestions: []
        };

        if (!password) {
            result.passed = false;
            result.messages.push('Password is required');
            return result;
        }

        // Check length
        if (password.length < this.requirements.minLength) {
            result.passed = false;
            result.messages.push(`Password must be at least ${this.requirements.minLength} characters long`);
        } else if (password.length > this.requirements.maxLength) {
            result.passed = false;
            result.messages.push(`Password must not exceed ${this.requirements.maxLength} characters`);
        } else {
            result.strength += 20;
        }

        // Check for uppercase
        if (this.requirements.requireUppercase && !/[A-Z]/.test(password)) {
            result.passed = false;
            result.messages.push('Password must contain at least one uppercase letter');
        } else if (/[A-Z]/.test(password)) {
            result.strength += 20;
        }

        // Check for lowercase
        if (this.requirements.requireLowercase && !/[a-z]/.test(password)) {
            result.passed = false;
            result.messages.push('Password must contain at least one lowercase letter');
        } else if (/[a-z]/.test(password)) {
            result.strength += 20;
        }

        // Check for numbers
        if (this.requirements.requireNumbers && !/[0-9]/.test(password)) {
            result.passed = false;
            result.messages.push('Password must contain at least one number');
        } else if (/[0-9]/.test(password)) {
            result.strength += 20;
        }

        // Check for special characters
        if (this.requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            result.passed = false;
            result.messages.push('Password must contain at least one special character');
        } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            result.strength += 20;
        }

        // Check against common passwords
        if (this.commonPasswords.includes(password.toLowerCase())) {
            result.passed = false;
            result.messages.push('This password is too common. Please choose a stronger password');
            result.strength = 0;
        }

        // Check for repeated characters
        if (/(.)\1{2,}/.test(password)) {
            result.suggestions.push('Avoid using repeated characters');
            result.strength = Math.max(0, result.strength - 10);
        }

        // Check for sequential characters
        if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
            result.suggestions.push('Avoid using sequential characters');
            result.strength = Math.max(0, result.strength - 10);
        }

        // Add bonus for length
        if (password.length >= 12) {
            result.strength += 10;
        }
        if (password.length >= 16) {
            result.strength += 10;
        }

        // Cap strength at 100
        result.strength = Math.min(100, result.strength);

        return result;
    },

    /**
     * Get strength level based on score
     * @param {number} strength - Strength score (0-100)
     * @returns {Object} - Level info with name and color
     */
    getStrengthLevel(strength) {
        if (strength < 40) {
            return { level: 'weak', name: 'Weak', color: '#ef4444' };
        } else if (strength < 60) {
            return { level: 'fair', name: 'Fair', color: '#f59e0b' };
        } else if (strength < 80) {
            return { level: 'good', name: 'Good', color: '#3b82f6' };
        } else {
            return { level: 'strong', name: 'Strong', color: '#10b981' };
        }
    },

    /**
     * Generate a strong random password
     * @param {number} length - Desired password length (default 16)
     * @returns {string} - Generated password
     */
    generatePassword(length = 16) {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const all = uppercase + lowercase + numbers + special;

        let password = '';

        // Ensure at least one of each required type
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        // Fill the rest randomly
        for (let i = password.length; i < length; i++) {
            password += all[Math.floor(Math.random() * all.length)];
        }

        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordValidator;
}
