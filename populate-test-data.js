#!/usr/bin/env node

/**
 * Comprehensive Test Data Generator with QR Codes
 * 
 * This script populates the inventory with realistic test data across multiple
 * categories and generates QR codes for each product for easy scanning.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const QRCode = require('qrcode');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'inventory.db');
const QR_CODES_DIR = path.join(__dirname, 'public', 'qr-codes');

// Create QR codes directory if it doesn't exist
if (!fs.existsSync(QR_CODES_DIR)) {
    fs.mkdirSync(QR_CODES_DIR, { recursive: true });
}

console.log('🚀 Comprehensive Test Data Generator');
console.log('====================================');
console.log('');

const db = new sqlite3.Database(DB_PATH);

// Comprehensive test inventory across multiple categories
const testInventory = [
    // Electronics
    {
        name: 'iPhone 15 Pro',
        category_name: 'Electronics',
        quantity: 15,
        price: 999.99,
        threshold: 5,
        sku: 'ELEC-IP15P-001',
        barcode: '0194253800000',
        description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system'
    },
    {
        name: 'Samsung Galaxy S24 Ultra',
        category_name: 'Electronics',
        quantity: 12,
        price: 1199.99,
        threshold: 5,
        sku: 'ELEC-SGS24U-002',
        barcode: '8806094000000',
        description: 'Flagship Android phone with S Pen, 200MP camera, and AI features'
    },
    {
        name: 'MacBook Pro 14" M3',
        category_name: 'Electronics',
        quantity: 8,
        price: 1999.99,
        threshold: 3,
        sku: 'ELEC-MBP14-003',
        barcode: '0195949000000',
        description: 'Professional laptop with M3 chip, Liquid Retina XDR display'
    },
    {
        name: 'Sony WH-1000XM5',
        category_name: 'Electronics',
        quantity: 25,
        price: 399.99,
        threshold: 8,
        sku: 'ELEC-SONY-004',
        barcode: '4548736000000',
        description: 'Premium noise-cancelling wireless headphones with 30h battery'
    },
    {
        name: 'iPad Air 11"',
        category_name: 'Electronics',
        quantity: 18,
        price: 599.99,
        threshold: 6,
        sku: 'ELEC-IPAD-005',
        barcode: '0194253900000',
        description: 'Versatile tablet with M2 chip and Apple Pencil Pro support'
    },
    {
        name: 'Dell UltraSharp 27" 4K Monitor',
        category_name: 'Electronics',
        quantity: 10,
        price: 549.99,
        threshold: 4,
        sku: 'ELEC-DELL-006',
        barcode: '8842320000000',
        description: '4K IPS monitor with 99% sRGB, USB-C connectivity'
    },
    {
        name: 'Logitech MX Master 3S',
        category_name: 'Electronics',
        quantity: 30,
        price: 99.99,
        threshold: 10,
        sku: 'ELEC-LOGI-007',
        barcode: '0977660000000',
        description: 'Ergonomic wireless mouse with 8K DPI sensor and quiet clicks'
    },
    {
        name: 'Canon EOS R6 Mark II',
        category_name: 'Electronics',
        quantity: 5,
        price: 2499.99,
        threshold: 2,
        sku: 'ELEC-CANON-008',
        barcode: '4549292000000',
        description: 'Professional mirrorless camera with 24MP sensor and 40fps'
    },

    // Clothing
    {
        name: 'Nike Air Max 90',
        category_name: 'Clothing',
        quantity: 45,
        price: 129.99,
        threshold: 15,
        sku: 'CLTH-NIKE-001',
        barcode: '0193656000000',
        description: 'Classic sneakers with visible Air cushioning, available in multiple sizes'
    },
    {
        name: 'Levi\'s 501 Original Jeans',
        category_name: 'Clothing',
        quantity: 60,
        price: 89.99,
        threshold: 20,
        sku: 'CLTH-LEVI-002',
        barcode: '0045642000000',
        description: 'Iconic straight-fit jeans, 100% cotton denim'
    },
    {
        name: 'Patagonia Down Sweater',
        category_name: 'Clothing',
        quantity: 22,
        price: 229.99,
        threshold: 8,
        sku: 'CLTH-PATA-003',
        barcode: '0889833000000',
        description: 'Lightweight insulated jacket with 800-fill-power down'
    },
    {
        name: 'Adidas Ultraboost 22',
        category_name: 'Clothing',
        quantity: 38,
        price: 189.99,
        threshold: 12,
        sku: 'CLTH-ADID-004',
        barcode: '4066760000000',
        description: 'Performance running shoes with BOOST cushioning technology'
    },
    {
        name: 'Ralph Lauren Oxford Shirt',
        category_name: 'Clothing',
        quantity: 50,
        price: 89.99,
        threshold: 15,
        sku: 'CLTH-RL-005',
        barcode: '0043150000000',
        description: 'Classic button-down shirt in premium cotton, various colors'
    },

    // Food & Beverages
    {
        name: 'Organic Fair Trade Coffee Beans 1kg',
        category_name: 'Food & Beverages',
        quantity: 120,
        price: 24.99,
        threshold: 30,
        sku: 'FOOD-COFFEE-001',
        barcode: '0759780000000',
        description: 'Premium arabica beans from Colombia, medium roast'
    },
    {
        name: 'Italian Extra Virgin Olive Oil 750ml',
        category_name: 'Food & Beverages',
        quantity: 85,
        price: 18.99,
        threshold: 25,
        sku: 'FOOD-OIL-002',
        barcode: '8002200000000',
        description: 'Cold-pressed EVOO from Tuscany, first harvest'
    },
    {
        name: 'Organic Honey 500g',
        category_name: 'Food & Beverages',
        quantity: 95,
        price: 14.99,
        threshold: 20,
        sku: 'FOOD-HONEY-003',
        barcode: '0850360000000',
        description: 'Raw unfiltered honey from local beekeepers'
    },
    {
        name: 'Premium Green Tea (50 bags)',
        category_name: 'Food & Beverages',
        quantity: 75,
        price: 12.99,
        threshold: 20,
        sku: 'FOOD-TEA-004',
        barcode: '0072310000000',
        description: 'Japanese sencha green tea, organic certified'
    },
    {
        name: 'Dark Chocolate Bar 85% Cacao',
        category_name: 'Food & Beverages',
        quantity: 150,
        price: 4.99,
        threshold: 40,
        sku: 'FOOD-CHOC-005',
        barcode: '7622300000000',
        description: 'Swiss premium dark chocolate, 100g bar'
    },

    // Books
    {
        name: 'Atomic Habits by James Clear',
        category_name: 'Books',
        quantity: 35,
        price: 16.99,
        threshold: 10,
        sku: 'BOOK-ATOM-001',
        barcode: '9780735211292',
        description: 'Transform your life with tiny changes in behavior'
    },
    {
        name: 'The Almanack of Naval Ravikant',
        category_name: 'Books',
        quantity: 28,
        price: 19.99,
        threshold: 8,
        sku: 'BOOK-NAVAL-002',
        barcode: '9781544514222',
        description: 'Guide to wealth and happiness'
    },
    {
        name: 'Deep Work by Cal Newport',
        category_name: 'Books',
        quantity: 42,
        price: 15.99,
        threshold: 12,
        sku: 'BOOK-DEEP-003',
        barcode: '9781455586691',
        description: 'Rules for focused success in a distracted world'
    },
    {
        name: 'Sapiens by Yuval Noah Harari',
        category_name: 'Books',
        quantity: 30,
        price: 18.99,
        threshold: 10,
        sku: 'BOOK-SAPI-004',
        barcode: '9780062316097',
        description: 'Brief history of humankind'
    },

    // Home & Garden
    {
        name: 'Dyson V15 Cordless Vacuum',
        category_name: 'Home & Garden',
        quantity: 12,
        price: 649.99,
        threshold: 4,
        sku: 'HOME-DYSON-001',
        barcode: '5025155000000',
        description: 'Powerful cordless vacuum with laser detection and LCD screen'
    },
    {
        name: 'Philips Hue Smart Bulb Starter Kit',
        category_name: 'Home & Garden',
        quantity: 25,
        price: 89.99,
        threshold: 8,
        sku: 'HOME-HUE-002',
        barcode: '0469007000000',
        description: 'Color-changing LED bulbs with bridge, works with Alexa and Google'
    },
    {
        name: 'KitchenAid Stand Mixer',
        category_name: 'Home & Garden',
        quantity: 8,
        price: 449.99,
        threshold: 3,
        sku: 'HOME-KA-003',
        barcode: '0883049000000',
        description: 'Professional 5-quart mixer with 10 speeds'
    },
    {
        name: 'Nespresso Vertuo Plus',
        category_name: 'Home & Garden',
        quantity: 18,
        price: 189.99,
        threshold: 6,
        sku: 'HOME-NESP-004',
        barcode: '7630054000000',
        description: 'Coffee and espresso maker with centrifusion technology'
    },
    {
        name: 'Outdoor Solar Lights (8-pack)',
        category_name: 'Home & Garden',
        quantity: 40,
        price: 39.99,
        threshold: 12,
        sku: 'HOME-SOLAR-005',
        barcode: '0850040000000',
        description: 'Weatherproof LED pathway lights with auto on/off'
    },

    // Sports & Outdoors
    {
        name: 'Yoga Mat Premium 6mm',
        category_name: 'Sports & Outdoors',
        quantity: 55,
        price: 29.99,
        threshold: 15,
        sku: 'SPRT-YOGA-001',
        barcode: '0810037000000',
        description: 'Non-slip TPE mat with carrying strap'
    },
    {
        name: 'Hydro Flask 32oz',
        category_name: 'Sports & Outdoors',
        quantity: 70,
        price: 44.99,
        threshold: 20,
        sku: 'SPRT-HYDRO-002',
        barcode: '0810912000000',
        description: 'Insulated stainless steel water bottle, keeps cold 24h'
    },
    {
        name: 'Camping Tent (4 person)',
        category_name: 'Sports & Outdoors',
        quantity: 15,
        price: 149.99,
        threshold: 5,
        sku: 'SPRT-TENT-003',
        barcode: '0077060000000',
        description: 'Weatherproof dome tent with easy setup'
    },
    {
        name: 'Resistance Bands Set',
        category_name: 'Sports & Outdoors',
        quantity: 45,
        price: 24.99,
        threshold: 12,
        sku: 'SPRT-BAND-004',
        barcode: '0850001000000',
        description: '5 resistance levels with handles and door anchor'
    }
];

// Generate QR code for a product
async function generateQRCode(item, itemId) {
    const productInfo = {
        id: itemId,
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        price: item.price,
        url: `http://localhost:3000/?item=${itemId}`
    };

    const qrFileName = `${item.sku}.png`;
    const qrFilePath = path.join(QR_CODES_DIR, qrFileName);

    try {
        await QRCode.toFile(qrFilePath, JSON.stringify(productInfo), {
            errorCorrectionLevel: 'H',
            type: 'png',
            quality: 0.95,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300
        });
        return qrFileName;
    } catch (err) {
        console.error(`Error generating QR code for ${item.name}:`, err);
        return null;
    }
}

// Clear existing data
async function clearExistingData() {
    return new Promise((resolve) => {
        db.serialize(() => {
            db.run('DELETE FROM sales_transactions', (err) => {
                if (err) console.error('Error clearing sales:', err);
            });
            db.run('DELETE FROM alerts', (err) => {
                if (err) console.error('Error clearing alerts:', err);
            });
            db.run('DELETE FROM inventory', (err) => {
                if (err) console.error('Error clearing inventory:', err);
            });
            db.run('DELETE FROM categories', (err) => {
                if (err) console.error('Error clearing categories:', err);
                resolve();
            });
        });
    });
}

// Get or create category
async function getOrCreateCategory(categoryName) {
    return new Promise((resolve, reject) => {
        db.get('SELECT id FROM categories WHERE name = ?', [categoryName], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (row) {
                resolve(row.id);
            } else {
                db.run('INSERT INTO categories (name) VALUES (?)', [categoryName], function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            }
        });
    });
}

// Insert inventory item
async function insertInventoryItem(item, categoryId) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO inventory (name, category_id, quantity, price, threshold, sku, barcode, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.name, categoryId, item.quantity, item.price, item.threshold, item.sku, item.barcode, item.description],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

// Main function
async function populateTestData() {
    console.log('🗑️  Clearing existing data...');
    await clearExistingData();
    console.log('✅ Existing data cleared');
    console.log('');

    console.log('📦 Adding test inventory items...');
    let itemCount = 0;
    const categoryMap = new Map();

    for (const item of testInventory) {
        try {
            // Get or create category
            let categoryId;
            if (categoryMap.has(item.category_name)) {
                categoryId = categoryMap.get(item.category_name);
            } else {
                categoryId = await getOrCreateCategory(item.category_name);
                categoryMap.set(item.category_name, categoryId);
            }

            // Insert item
            const itemId = await insertInventoryItem(item, categoryId);

            // Generate QR code
            const qrFile = await generateQRCode(item, itemId);

            itemCount++;
            if (itemCount % 5 === 0) {
                console.log(`   ✓ Added ${itemCount} items...`);
            }
        } catch (error) {
            console.error(`Error adding ${item.name}:`, error);
        }
    }

    console.log('');
    console.log('✅ Test Data Population Complete!');
    console.log('===================================');
    console.log(`📦 Total Items: ${itemCount}`);
    console.log(`📂 Categories: ${categoryMap.size}`);
    console.log(`🏷️  QR Codes: ${itemCount} generated in ${QR_CODES_DIR}`);
    console.log('');
    console.log('📋 Categories Summary:');
    for (const [category, id] of categoryMap.entries()) {
        const count = testInventory.filter(item => item.category_name === category).length;
        console.log(`   - ${category}: ${count} items`);
    }
    console.log('');
    console.log('💡 Tip: QR codes are saved in public/qr-codes/ directory');
    console.log('   You can scan them to view product details!');
}

// Run the script
db.serialize(async () => {
    try {
        await populateTestData();
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close(() => {
            console.log('');
            console.log('📊 Database connection closed.');
            process.exit(0);
        });
    }
});
