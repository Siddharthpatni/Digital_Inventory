// ===== Enhanced Database Setup and Management =====
// Professional SQLite database for Digital Inventory System

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/inventory.db');
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

// Initialize database connection with better error handling
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to SQLite database');
        db.run('PRAGMA foreign_keys = ON'); // Enable foreign key constraints
        initializeTables();
    }
});

// ===== Database Schema Initialization =====
function initializeTables() {
    db.serialize(() => {
        // Users table for authentication
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'user')),
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for users
        db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');

        // Categories table (normalized)
        db.run(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Enhanced inventory table
        db.run(`
            CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category_id INTEGER,
                quantity INTEGER NOT NULL DEFAULT 0,
                price REAL NOT NULL DEFAULT 0,
                threshold INTEGER NOT NULL DEFAULT 10,
                sku TEXT UNIQUE,
                barcode TEXT,
                description TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Create indexes for inventory
        db.run('CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku)');
        db.run('CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity)');

        // Alerts table with foreign key
        db.run(`
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                threshold INTEGER NOT NULL,
                is_resolved INTEGER DEFAULT 0,
                resolved_at DATETIME,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES inventory(id) ON DELETE CASCADE
            )
        `);

        db.run('CREATE INDEX IF NOT EXISTS idx_alerts_item ON alerts(item_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(is_resolved)');

        // Audit logs table
        db.run(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id INTEGER,
                old_values TEXT,
                new_values TEXT,
                ip_address TEXT,
                user_agent TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        db.run('CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp)');

        // Settings table
        db.run(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                language TEXT DEFAULT 'en',
                currency TEXT DEFAULT 'EUR',
                default_threshold INTEGER DEFAULT 10,
                enable_alerts INTEGER DEFAULT 1,
                theme TEXT DEFAULT 'light',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert default settings
        db.run(`
            INSERT OR IGNORE INTO settings (id, language, currency, default_threshold, enable_alerts, theme)
            VALUES (1, 'en', 'EUR', 10, 1, 'light')
        `);

        // Sales transactions table
        db.run(`
            CREATE TABLE IF NOT EXISTS sales_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                quantity_sold INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                total_amount REAL NOT NULL,
                sale_date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (item_id) REFERENCES inventory(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Create indexes for sales transactions
        db.run('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_transactions(sale_date)');
        db.run('CREATE INDEX IF NOT EXISTS idx_sales_item ON sales_transactions(item_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales_transactions(created_at)');

        // Create default admin user
        createDefaultAdmin();

        console.log('✅ Database tables initialized with indexes');
    });
}

// Create default admin user
async function createDefaultAdmin() {
    const defaultAdmin = {
        username: 'admin',
        email: 'admin@inventory.com',
        password: 'admin123', // Change this in production!
        role: 'admin'
    };

    try {
        const existing = await getUserByUsername(defaultAdmin.username);
        if (!existing) {
            const passwordHash = await bcrypt.hash(defaultAdmin.password, BCRYPT_ROUNDS);
            await createUser({
                ...defaultAdmin,
                password_hash: passwordHash
            });
            console.log('✅ Default admin user created (username: admin, password: admin123)');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}

// ===== User Management =====

const createUser = (user) => {
    return new Promise((resolve, reject) => {
        const { username, email, password_hash, role = 'user' } = user;
        db.run(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, role],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, username, email, role });
            }
        );
    });
};

const getUserByUsername = (username) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const getUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const getUserById = (id) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT id, username, email, role, is_active, created_at FROM users WHERE id = ?', [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// ===== Audit Logging =====

const createAuditLog = (log) => {
    return new Promise((resolve, reject) => {
        const { user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent } = log;
        db.run(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, action, entity_type, entity_id,
                old_values ? JSON.stringify(old_values) : null,
                new_values ? JSON.stringify(new_values) : null,
                ip_address, user_agent],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            }
        );
    });
};

const getAuditLogs = (filters = {}) => {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT al.*, u.username 
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.user_id) {
            query += ' AND al.user_id = ?';
            params.push(filters.user_id);
        }
        if (filters.entity_type) {
            query += ' AND al.entity_type = ?';
            params.push(filters.entity_type);
        }
        if (filters.entity_id) {
            query += ' AND al.entity_id = ?';
            params.push(filters.entity_id);
        }

        query += ' ORDER BY al.timestamp DESC LIMIT ?';
        params.push(filters.limit || 100);

        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// ===== Category Operations =====

const getAllCategories = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM categories ORDER BY name', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const createCategory = (category) => {
    return new Promise((resolve, reject) => {
        const { name, description } = category;
        db.run(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, name, description });
            }
        );
    });
};

const getCategoryByName = (name) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM categories WHERE name = ?', [name], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// ===== Enhanced Inventory Operations =====

const getAllInventory = (filters = {}) => {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT i.*, c.name as category_name, u.username as created_by_username
            FROM inventory i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN users u ON i.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.category_id) {
            query += ' AND i.category_id = ?';
            params.push(filters.category_id);
        }
        if (filters.search) {
            query += ' AND (i.name LIKE ? OR i.description LIKE ? OR i.sku LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (filters.low_stock) {
            query += ' AND i.quantity <= i.threshold';
        }

        query += ' ORDER BY i.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ? OFFSET ?';
            params.push(filters.limit, filters.offset || 0);
        }

        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const getInventoryById = (id) => {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT i.*, c.name as category_name, u.username as created_by_username
            FROM inventory i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN users u ON i.created_by = u.id
            WHERE i.id = ?
        `, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const createInventoryItem = async (item) => {
    // Ensure category exists
    let categoryId = item.category_id;
    if (item.category_name && !categoryId) {
        let category = await getCategoryByName(item.category_name);
        if (!category) {
            category = await createCategory({ name: item.category_name });
        }
        categoryId = category.id;
    }

    return new Promise((resolve, reject) => {
        const { name, quantity, price, threshold, sku, barcode, description, created_by } = item;
        db.run(
            `INSERT INTO inventory (name, category_id, quantity, price, threshold, sku, barcode, description, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, categoryId, quantity, price, threshold, sku, barcode, description, created_by],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...item, category_id: categoryId });
            }
        );
    });
};

const updateInventoryItem = (id, item) => {
    return new Promise((resolve, reject) => {
        const { name, category_id, quantity, price, threshold, sku, barcode, description } = item;
        db.run(
            `UPDATE inventory 
             SET name = ?, category_id = ?, quantity = ?, price = ?, threshold = ?, 
                 sku = ?, barcode = ?, description = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name, category_id, quantity, price, threshold, sku, barcode, description, id],
            function (err) {
                if (err) reject(err);
                else resolve({ id, ...item });
            }
        );
    });
};

const deleteInventoryItem = (id) => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM inventory WHERE id = ?', [id], function (err) {
            if (err) reject(err);
            else resolve({ deleted: this.changes });
        });
    });
};

// ===== Alerts Operations =====

const getAllAlerts = () => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT a.*, i.name as item_name, i.quantity as current_quantity
            FROM alerts a
            LEFT JOIN inventory i ON a.item_id = i.id
            WHERE a.is_resolved = 0
            ORDER BY a.timestamp DESC
        `, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const createAlert = (alert) => {
    return new Promise((resolve, reject) => {
        const { item_id, item_name, quantity, threshold } = alert;
        db.run(
            'INSERT INTO alerts (item_id, item_name, quantity, threshold) VALUES (?, ?, ?, ?)',
            [item_id, item_name, quantity, threshold],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...alert });
            }
        );
    });
};

const clearAllAlerts = () => {
    return new Promise((resolve, reject) => {
        db.run('UPDATE alerts SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE is_resolved = 0', [], function (err) {
            if (err) reject(err);
            else resolve({ resolved: this.changes });
        });
    });
};

const deleteAlertsByItemId = (itemId) => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM alerts WHERE item_id = ?', [itemId], function (err) {
            if (err) reject(err);
            else resolve({ deleted: this.changes });
        });
    });
};

// ===== Settings Operations =====

const getSettings = () => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM settings WHERE id = 1', [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const updateSettings = (settings) => {
    return new Promise((resolve, reject) => {
        const { language, currency, default_threshold, enable_alerts, theme } = settings;
        db.run(
            `UPDATE settings 
             SET language = ?, currency = ?, default_threshold = ?, enable_alerts = ?, theme = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = 1`,
            [language, currency, default_threshold, enable_alerts, theme],
            function (err) {
                if (err) reject(err);
                else resolve(settings);
            }
        );
    });
};

// ===== Utility Functions =====

const checkLowStock = async () => {
    try {
        const inventory = await getAllInventory();
        const settings = await getSettings();

        if (!settings.enable_alerts) return;

        // Clear existing unresolved alerts
        await clearAllAlerts();

        // Create new alerts for low stock items
        for (const item of inventory) {
            if (item.quantity <= item.threshold) {
                await createAlert({
                    item_id: item.id,
                    item_name: item.name,
                    quantity: item.quantity,
                    threshold: item.threshold
                });
            }
        }
    } catch (error) {
        console.error('Error checking low stock:', error);
    }
};

// ===== Sales Transaction Operations =====

const createSaleTransaction = (transaction) => {
    return new Promise((resolve, reject) => {
        const { item_id, item_name, quantity_sold, unit_price, total_amount, sale_date, created_by } = transaction;
        db.run(
            `INSERT INTO sales_transactions (item_id, item_name, quantity_sold, unit_price, total_amount, sale_date, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [item_id, item_name, quantity_sold, unit_price, total_amount, sale_date || new Date().toISOString().split('T')[0], created_by],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...transaction });
            }
        );
    });
};

const getDailySales = (date) => {
    return new Promise((resolve, reject) => {
        const targetDate = date || new Date().toISOString().split('T')[0];
        db.all(
            `SELECT st.*, i.category_id, c.name as category_name
             FROM sales_transactions st
             LEFT JOIN inventory i ON st.item_id = i.id
             LEFT JOIN categories c ON i.category_id = c.id
             WHERE st.sale_date = ?
             ORDER BY st.created_at DESC`,
            [targetDate],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
};

const getSalesSummaryByDate = (startDate, endDate) => {
    return new Promise((resolve, reject) => {
        const start = startDate || new Date().toISOString().split('T')[0];
        const end = endDate || start;

        db.all(
            `SELECT 
                sale_date,
                COUNT(*) as transaction_count,
                SUM(quantity_sold) as total_quantity,
                SUM(total_amount) as total_revenue
             FROM sales_transactions
             WHERE sale_date BETWEEN ? AND ?
             GROUP BY sale_date
             ORDER BY sale_date DESC`,
            [start, end],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
};

const getTodaySalesSummary = () => {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0];
        db.get(
            `SELECT 
                COUNT(*) as transaction_count,
                COALESCE(SUM(total_amount), 0) as total_revenue
             FROM sales_transactions
             WHERE sale_date = ?`,
            [today],
            (err, row) => {
                if (err) reject(err);
                else resolve(row || { transaction_count: 0, total_revenue: 0 });
            }
        );
    });
};

// Export all functions
module.exports = {
    db,
    // User operations
    createUser,
    getUserByUsername,
    getUserByEmail,
    getUserById,
    // Audit operations
    createAuditLog,
    getAuditLogs,
    // Category operations
    getAllCategories,
    createCategory,
    getCategoryByName,
    // Inventory operations
    getAllInventory,
    getInventoryById,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    // Alert operations
    getAllAlerts,
    createAlert,
    clearAllAlerts,
    deleteAlertsByItemId,
    // Settings operations
    getSettings,
    updateSettings,
    // Utilities
    checkLowStock,
    // Sales operations
    createSaleTransaction,
    getDailySales,
    getSalesSummaryByDate,
    getTodaySalesSummary
};
