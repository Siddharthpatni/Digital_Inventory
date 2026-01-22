// ===== Enhanced API Routes for Digital Inventory =====
// Professional RESTful API with authentication, validation, and audit logging

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../models/database');
const { requireAuth, optionalAuth, authorize } = require('../middleware/auth');
const {
    validateUserRegistration,
    validateUserLogin,
    validateInventoryItem,
    validateInventoryUpdate,
    validateInventoryId,
    validateSettings,
    validatePagination,
    validateSearch
} = require('../middleware/validation');
const { asyncHandler, NotFoundError, AuthenticationError, ConflictError } = require('../middleware/errorHandler');
const { createAuditLog } = require('../middleware/logger');

// ===== Inventory Routes =====

// GET all inventory items (with optional auth, pagination, search, filters)
router.get('/inventory', optionalAuth, validatePagination, validateSearch, asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search, category_id, low_stock } = req.query;

    const filters = {
        search,
        category_id: category_id ? parseInt(category_id) : null,
        low_stock: low_stock === 'true',
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const items = await db.getAllInventory(filters);

    res.json({
        items,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: items.length
        }
    });
}));

// GET single inventory item
router.get('/inventory/:id', optionalAuth, validateInventoryId, asyncHandler(async (req, res) => {
    const item = await db.getInventoryById(req.params.id);
    if (!item) {
        throw new NotFoundError('Inventory item');
    }
    res.json(item);
}));

// POST create new inventory item (requires authentication)
router.post('/inventory', requireAuth, validateInventoryItem, asyncHandler(async (req, res) => {
    const { name, category_name, quantity, price, threshold, sku, barcode, description } = req.body;

    const newItem = await db.createInventoryItem({
        name,
        category_name,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        threshold: threshold ? parseInt(threshold) : 10,
        sku,
        barcode,
        description,
        created_by: req.user.id
    });

    // Check for low stock alerts
    await db.checkLowStock();

    // Audit log
    await createAuditLog(req, 'CREATE', 'inventory', newItem.id, null, newItem);

    res.status(201).json({
        message: 'Item created successfully',
        item: newItem
    });
}));

// PUT update inventory item (requires authentication)
router.put('/inventory/:id', requireAuth, validateInventoryUpdate, asyncHandler(async (req, res) => {
    const { name, category_id, quantity, price, threshold, sku, barcode, description } = req.body;

    // Get old values for audit
    const oldItem = await db.getInventoryById(req.params.id);
    if (!oldItem) {
        throw new NotFoundError('Inventory item');
    }

    const updatedItem = await db.updateInventoryItem(req.params.id, {
        name,
        category_id: category_id ? parseInt(category_id) : oldItem.category_id,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        threshold: parseInt(threshold),
        sku,
        barcode,
        description
    });

    // Check for low stock alerts
    await db.checkLowStock();

    // Audit log
    await createAuditLog(req, 'UPDATE', 'inventory', req.params.id, oldItem, updatedItem);

    res.json({
        message: 'Item updated successfully',
        item: updatedItem
    });
}));

// DELETE inventory item (requires admin or manager role)
router.delete('/inventory/:id', requireAuth, authorize('admin', 'manager'), validateInventoryId, asyncHandler(async (req, res) => {
    // Get item for audit
    const item = await db.getInventoryById(req.params.id);
    if (!item) {
        throw new NotFoundError('Inventory item');
    }

    await db.deleteAlertsByItemId(req.params.id);
    const result = await db.deleteInventoryItem(req.params.id);

    // Audit log
    await createAuditLog(req, 'DELETE', 'inventory', req.params.id, item, null);

    res.json({
        message: 'Item deleted successfully',
        deleted: result.deleted
    });
}));

// ===== QR Code Routes =====

const qrGenerator = require('../utils/qr-generator');
const path = require('path');
const fs = require('fs').promises;

// GET QR code for specific inventory item (returns data URL by default)
router.get('/inventory/:id/qr', optionalAuth, validateInventoryId, asyncHandler(async (req, res) => {
    const item = await db.getInventoryById(req.params.id);
    if (!item) {
        throw new NotFoundError('Inventory item');
    }

    const format = req.query.format || 'dataUrl'; // png, svg, or dataUrl

    try {
        const qrCode = await qrGenerator.generate(item, format);

        // Audit log
        if (req.user) {
            await createAuditLog(req, 'GENERATE', 'qr-code', item.id, null, { format });
        }

        res.json({
            success: true,
            itemId: item.id,
            itemName: item.name,
            sku: item.sku,
            ...qrCode
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}));

// GET download QR code as file
router.get('/inventory/:id/qr/download', optionalAuth, validateInventoryId, asyncHandler(async (req, res) => {
    const item = await db.getInventoryById(req.params.id);
    if (!item) {
        throw new NotFoundError('Inventory item');
    }

    const format = req.query.format || 'png'; // png or svg

    try {
        const qrCode = await qrGenerator.generate(item, format);

        // Set appropriate headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${qrCode.fileName}"`);
        res.setHeader('Content-Type', format === 'svg' ? 'image/svg+xml' : 'image/png');

        // Send file
        const fileContent = await fs.readFile(qrCode.filePath);
        res.send(fileContent);

        // Audit log
        if (req.user) {
            await createAuditLog(req, 'DOWNLOAD', 'qr-code', item.id, null, { format });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}));

// POST generate QR codes for multiple items (batch)
router.post('/inventory/qr/batch', requireAuth, asyncHandler(async (req, res) => {
    const { item_ids, format = 'png' } = req.body;

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'item_ids array is required'
        });
    }

    try {
        // Fetch items
        const items = [];
        for (const id of item_ids) {
            const item = await db.getInventoryById(id);
            if (item) {
                items.push(item);
            }
        }

        // Generate QR codes
        const result = await qrGenerator.generateBatch(items, format);

        // Audit log
        await createAuditLog(req, 'GENERATE_BATCH', 'qr-code', null, null, {
            count: items.length,
            format
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}));

// DELETE QR code file
router.delete('/inventory/:id/qr', requireAuth, validateInventoryId, asyncHandler(async (req, res) => {
    const item = await db.getInventoryById(req.params.id);
    if (!item) {
        throw new NotFoundError('Inventory item');
    }

    const fileName = `qr-${item.id}-${item.sku || 'item'}.png`;

    try {
        const result = await qrGenerator.delete(fileName);

        // Also try to delete SVG if it exists
        const svgFileName = `qr-${item.id}-${item.sku || 'item'}.svg`;
        await qrGenerator.delete(svgFileName);

        // Audit log
        await createAuditLog(req, 'DELETE', 'qr-code', item.id, null, null);

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}));


// ===== Category Routes =====

// GET all categories
router.get('/categories', asyncHandler(async (req, res) => {
    const categories = await db.getAllCategories();
    res.json(categories);
}));

// POST create category (requires authentication)
router.post('/categories', requireAuth, asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const category = await db.createCategory({ name, description });

    // Audit log
    await createAuditLog(req, 'CREATE', 'category', category.id, null, category);

    res.status(201).json({
        message: 'Category created successfully',
        category
    });
}));

// ===== Alerts Routes =====

// GET all alerts
router.get('/alerts', optionalAuth, asyncHandler(async (req, res) => {
    const alerts = await db.getAllAlerts();
    res.json(alerts);
}));

// DELETE all alerts (clear/resolve)
router.delete('/alerts', requireAuth, asyncHandler(async (req, res) => {
    const result = await db.clearAllAlerts();

    // Audit log
    await createAuditLog(req, 'CLEAR', 'alerts', null, null, { resolved: result.resolved });

    res.json({
        message: 'All alerts cleared',
        resolved: result.resolved
    });
}));

// POST refresh alerts (check low stock)
router.post('/alerts/refresh', optionalAuth, asyncHandler(async (req, res) => {
    await db.checkLowStock();
    const alerts = await db.getAllAlerts();
    res.json(alerts);
}));

// ===== Settings Routes =====

// GET settings
router.get('/settings', asyncHandler(async (req, res) => {
    const settings = await db.getSettings();
    res.json(settings);
}));

// PUT update settings (requires authentication)
router.put('/settings', requireAuth, validateSettings, asyncHandler(async (req, res) => {
    const { language, currency, default_threshold, enable_alerts, theme } = req.body;

    // Get old settings for audit
    const oldSettings = await db.getSettings();

    const updatedSettings = await db.updateSettings({
        language: language || oldSettings.language,
        currency: currency || oldSettings.currency,
        default_threshold: default_threshold ? parseInt(default_threshold) : oldSettings.default_threshold,
        enable_alerts: enable_alerts !== undefined ? (enable_alerts ? 1 : 0) : oldSettings.enable_alerts,
        theme: theme || oldSettings.theme
    });

    // Audit log
    await createAuditLog(req, 'UPDATE', 'settings', 1, oldSettings, updatedSettings);

    res.json({
        message: 'Settings updated successfully',
        settings: updatedSettings
    });
}));

// ===== Audit Logs Routes (Admin only) =====

// GET audit logs
router.get('/audit-logs', requireAuth, authorize('admin'), asyncHandler(async (req, res) => {
    const { user_id, entity_type, entity_id, limit = 100 } = req.query;

    const filters = {
        user_id: user_id ? parseInt(user_id) : null,
        entity_type,
        entity_id: entity_id ? parseInt(entity_id) : null,
        limit: parseInt(limit)
    };

    const logs = await db.getAuditLogs(filters);
    res.json(logs);
}));

// ===== Data Management Routes =====

// GET export data
router.get('/export', optionalAuth, asyncHandler(async (req, res) => {
    const inventory = await db.getAllInventory();
    const alerts = await db.getAllAlerts();
    const settings = await db.getSettings();
    const categories = await db.getAllCategories();

    res.json({
        inventory,
        alerts,
        settings,
        categories,
        exportDate: new Date().toISOString(),
        exportedBy: req.user ? req.user.username : 'anonymous'
    });
}));

// POST import data (requires admin role)
router.post('/import', requireAuth, authorize('admin'), asyncHandler(async (req, res) => {
    const { inventory, settings, categories } = req.body;

    let imported = { inventory: 0, categories: 0 };

    // Import categories first
    if (categories && Array.isArray(categories)) {
        for (const category of categories) {
            try {
                await db.createCategory(category);
                imported.categories++;
            } catch (error) {
                // Skip if category already exists
                console.log(`Category ${category.name} already exists, skipping`);
            }
        }
    }

    // Import inventory
    if (inventory && Array.isArray(inventory)) {
        for (const item of inventory) {
            try {
                await db.createInventoryItem({
                    ...item,
                    created_by: req.user.id
                });
                imported.inventory++;
            } catch (error) {
                console.error('Error importing item:', error);
            }
        }
    }

    // Update settings
    if (settings) {
        await db.updateSettings(settings);
    }

    await db.checkLowStock();

    // Audit log
    await createAuditLog(req, 'IMPORT', 'data', null, null, imported);

    res.json({
        message: 'Data imported successfully',
        imported
    });
}));

// ===== Statistics Routes =====

// GET dashboard statistics
router.get('/stats/dashboard', optionalAuth, asyncHandler(async (req, res) => {
    const inventory = await db.getAllInventory();
    const alerts = await db.getAllAlerts();
    const categories = await db.getAllCategories();

    const stats = {
        totalItems: inventory.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0),
        lowStockCount: alerts.length,
        categoriesCount: categories.length,
        inventoryCount: inventory.length,
        topCategories: {},
        recentActivity: []
    };

    // Calculate top categories
    inventory.forEach(item => {
        const catName = item.category_name || 'Uncategorized';
        if (!stats.topCategories[catName]) {
            stats.topCategories[catName] = { count: 0, value: 0 };
        }
        stats.topCategories[catName].count += item.quantity;
        stats.topCategories[catName].value += item.quantity * item.price;
    });

    res.json(stats);
}));

// ===== Sales Transaction Routes =====

// POST create new sale transaction (requires authentication)
router.post('/sales', requireAuth, asyncHandler(async (req, res) => {
    const { item_id, quantity } = req.body;

    // Validate input
    if (!item_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid item_id or quantity' });
    }

    // Get item details
    const item = await db.getInventoryById(item_id);
    if (!item) {
        throw new NotFoundError('Inventory item');
    }

    // Check if sufficient quantity available
    if (item.quantity < quantity) {
        return res.status(400).json({
            error: 'Insufficient inventory',
            available: item.quantity,
            requested: quantity
        });
    }

    // Calculate total
    const total_amount = item.price * quantity;
    const sale_date = new Date().toISOString().split('T')[0];

    // Create sale transaction
    const sale = await db.createSaleTransaction({
        item_id: item.id,
        item_name: item.name,
        quantity_sold: parseInt(quantity),
        unit_price: parseFloat(item.price),
        total_amount: parseFloat(total_amount),
        sale_date,
        created_by: req.user ? req.user.id : null
    });

    // Update inventory quantity
    const newQuantity = item.quantity - quantity;
    await db.updateInventoryItem(item.id, {
        ...item,
        quantity: newQuantity
    });

    // Check for low stock alerts
    await db.checkLowStock();

    // Audit log
    await createAuditLog(req, 'CREATE', 'sale', sale.id, null, sale);

    res.status(201).json({
        message: 'Sale recorded successfully',
        sale,
        updated_inventory: {
            id: item.id,
            name: item.name,
            previous_quantity: item.quantity,
            new_quantity: newQuantity
        }
    });
}));

// GET daily sales (optional date parameter)
router.get('/sales/daily', optionalAuth, asyncHandler(async (req, res) => {
    const { date } = req.query;

    // Validate date format if provided
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const sales = await db.getDailySales(date);

    // Calculate summary
    const summary = {
        date: date || new Date().toISOString().split('T')[0],
        transaction_count: sales.length,
        total_revenue: sales.reduce((sum, sale) => sum + sale.total_amount, 0),
        total_items_sold: sales.reduce((sum, sale) => sum + sale.quantity_sold, 0)
    };

    res.json({
        summary,
        transactions: sales
    });
}));

// GET sales summary by date range
router.get('/sales/summary', optionalAuth, asyncHandler(async (req, res) => {
    const { start, end } = req.query;

    // Validate date formats if provided
    if (start && !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
        return res.status(400).json({ error: 'Invalid start date format. Use YYYY-MM-DD' });
    }
    if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
        return res.status(400).json({ error: 'Invalid end date format. Use YYYY-MM-DD' });
    }

    const summary = await db.getSalesSummaryByDate(start, end);
    res.json(summary);
}));

// GET today's sales summary (quick endpoint for dashboard)
router.get('/sales/today', optionalAuth, asyncHandler(async (req, res) => {
    const summary = await db.getTodaySalesSummary();
    res.json(summary);
}));

module.exports = router;
