// ===== Input Validation Middleware =====
// Express-validator based validation for API endpoints

const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// ===== User Validation Rules =====

const validateUserRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('role')
        .optional()
        .isIn(['admin', 'manager', 'user'])
        .withMessage('Role must be admin, manager, or user'),

    handleValidationErrors
];

const validateUserLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

// ===== Inventory Validation Rules =====

const validateInventoryItem = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Item name is required')
        .isLength({ max: 200 })
        .withMessage('Item name must not exceed 200 characters'),

    body('category_name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Category name must not exceed 100 characters'),

    body('quantity')
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer'),

    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a non-negative number'),

    body('threshold')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Threshold must be a positive integer'),

    body('sku')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('SKU must not exceed 50 characters'),

    body('barcode')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Barcode must not exceed 50 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),

    handleValidationErrors
];

const validateInventoryUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid item ID'),

    ...validateInventoryItem
];

const validateInventoryId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid item ID'),

    handleValidationErrors
];

// ===== Settings Validation Rules =====

const validateSettings = [
    body('language')
        .optional()
        .isIn(['en', 'de'])
        .withMessage('Language must be en or de'),

    body('currency')
        .optional()
        .isIn(['EUR', 'USD', 'GBP'])
        .withMessage('Currency must be EUR, USD, or GBP'),

    body('default_threshold')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Default threshold must be between 1 and 1000'),

    body('enable_alerts')
        .optional()
        .isInt({ min: 0, max: 1 })
        .withMessage('Enable alerts must be 0 or 1'),

    body('theme')
        .optional()
        .isIn(['light', 'dark'])
        .withMessage('Theme must be light or dark'),

    handleValidationErrors
];

// ===== Query Parameter Validation =====

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    handleValidationErrors
];

const validateSearch = [
    query('search')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Search term must not exceed 200 characters'),

    query('category_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),

    query('low_stock')
        .optional()
        .isBoolean()
        .withMessage('Low stock must be a boolean'),

    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateUserLogin,
    validateInventoryItem,
    validateInventoryUpdate,
    validateInventoryId,
    validateSettings,
    validatePagination,
    validateSearch
};
