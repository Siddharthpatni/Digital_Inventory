#!/usr/bin/env node

/**
 * Populate Database with Clothing Store Sample Data
 * Creates realistic clothing inventory items for a retail clothing store
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'inventory.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🏪 Clothing Store Data Populator');
console.log('=================================\n');

// Clothing categories
const categories = [
    { name: 'T-Shirts', description: 'Casual t-shirts and tops' },
    { name: 'Jeans', description: 'Denim jeans and pants' },
    { name: 'Dresses', description: 'Women\'s dresses' },
    { name: 'Jackets', description: 'Outerwear and jackets' },
    { name: 'Shoes', description: 'Footwear and sneakers' },
    { name: 'Accessories', description: 'Bags, belts, and accessories' },
    { name: 'Sportswear', description: 'Athletic and workout clothing' }
];

// Sample clothing items
const clothingItems = [
    // T-Shirts
    { name: 'Basic White T-Shirt', category: 'T-Shirts', quantity: 45, price: 19.99, threshold: 15, sku: 'TSH-WHT-001', barcode: '4001234567890' },
    { name: 'Black Graphic Tee', category: 'T-Shirts', quantity: 32, price: 24.99, threshold: 12, sku: 'TSH-BLK-002', barcode: '4001234567891' },
    { name: 'Striped Long Sleeve', category: 'T-Shirts', quantity: 28, price: 29.99, threshold: 10, sku: 'TSH-STR-003', barcode: '4001234567892' },
    { name: 'V-Neck Premium Tee', category: 'T-Shirts', quantity: 38, price: 34.99, threshold: 15, sku: 'TSH-VNK-004', barcode: '4001234567893' },

    // Jeans
    { name: 'Classic Blue Jeans', category: 'Jeans', quantity: 25, price: 79.99, threshold: 8, sku: 'JEN-BLU-001', barcode: '4001234567894' },
    { name: 'Black Skinny Jeans', category: 'Jeans', quantity: 18, price: 89.99, threshold: 8, sku: 'JEN-BLK-002', barcode: '4001234567895' },
    { name: 'Ripped Boyfriend Jeans', category: 'Jeans', quantity: 15, price: 94.99, threshold: 6, sku: 'JEN-RIP-003', barcode: '4001234567896' },
    { name: 'High-Waist Straight Jeans', category: 'Jeans', quantity: 22, price: 84.99, threshold: 8, sku: 'JEN-HWS-004', barcode: '4001234567897' },

    // Dresses
    { name: 'Summer Floral Dress', category: 'Dresses', quantity: 12, price: 59.99, threshold: 5, sku: 'DRS-FLO-001', barcode: '4001234567898' },
    { name: 'Black Evening Dress', category: 'Dresses', quantity: 8, price: 129.99, threshold: 4, sku: 'DRS-EVE-002', barcode: '4001234567899' },
    { name: 'Casual Midi Dress', category: 'Dresses', quantity: 16, price: 69.99, threshold: 6, sku: 'DRS-MID-003', barcode: '4001234567900' },
    { name: 'Wrap Dress', category: 'Dresses', quantity: 10, price: 74.99, threshold: 5, sku: 'DRS-WRP-004', barcode: '4001234567901' },

    // Jackets
    { name: 'Denim Jacket', category: 'Jackets', quantity: 14, price: 119.99, threshold: 6, sku: 'JCK-DEN-001', barcode: '4001234567902' },
    { name: 'Leather Biker Jacket', category: 'Jackets', quantity: 6, price: 249.99, threshold: 3, sku: 'JCK-LEA-002', barcode: '4001234567903' },
    { name: 'Bomber Jacket', category: 'Jackets', quantity: 11, price: 149.99, threshold: 5, sku: 'JCK-BOM-003', barcode: '4001234567904' },
    { name: 'Parka Winter Coat', category: 'Jackets', quantity: 9, price: 189.99, threshold: 4, sku: 'JCK-PRK-004', barcode: '4001234567905' },

    // Shoes
    { name: 'White Sneakers', category: 'Shoes', quantity: 35, price: 89.99, threshold: 12, sku: 'SHO-SNK-001', barcode: '4001234567906' },
    { name: 'Black Boots', category: 'Shoes', quantity: 20, price: 139.99, threshold: 8, sku: 'SHO-BOT-002', barcode: '4001234567907' },
    { name: 'Running Shoes', category: 'Shoes', quantity: 28, price: 119.99, threshold: 10, sku: 'SHO-RUN-003', barcode: '4001234567908' },
    { name: 'Sandals', category: 'Shoes', quantity: 24, price: 49.99, threshold: 10, sku: 'SHO-SND-004', barcode: '4001234567909' },

    // Accessories
    { name: 'Leather Belt', category: 'Accessories', quantity: 42, price: 39.99, threshold: 15, sku: 'ACC-BLT-001', barcode: '4001234567910' },
    { name: 'Canvas Tote Bag', category: 'Accessories', quantity: 30, price: 44.99, threshold: 12, sku: 'ACC-BAG-002', barcode: '4001234567911' },
    { name: 'Baseball Cap', category: 'Accessories', quantity: 48, price: 24.99, threshold: 15, sku: 'ACC-CAP-003', barcode: '4001234567912' },
    { name: 'Sunglasses', category: 'Accessories', quantity: 36, price: 79.99, threshold: 12, sku: 'ACC-SUN-004', barcode: '4001234567913' },

    // Sportswear
    { name: 'Yoga Pants', category: 'Sportswear', quantity: 26, price: 54.99, threshold: 10, sku: 'SPT-YOG-001', barcode: '4001234567914' },
    { name: 'Sports Bra', category: 'Sportswear', quantity: 34, price: 39.99, threshold: 12, sku: 'SPT-BRA-002', barcode: '4001234567915' },
    { name: 'Track Jacket', category: 'Sportswear', quantity: 18, price: 69.99, threshold: 8, sku: 'SPT-TRK-003', barcode: '4001234567916' },
    { name: 'Performance Shorts', category: 'Sportswear', quantity: 40, price: 34.99, threshold: 15, sku: 'SPT-SHT-004', barcode: '4001234567917' }
];

async function populateDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                console.log('📦 Creating categories...');

                // Insert categories
                for (const cat of categories) {
                    await new Promise((res) => {
                        db.run(
                            'INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)',
                            [cat.name, cat.description],
                            () => res()
                        );
                    });
                }
                console.log(`✅ Created ${categories.length} categories\n`);

                console.log('👕 Adding clothing inventory items...');

                // Get category IDs
                const categoryMap = {};
                await new Promise((res) => {
                    db.all('SELECT * FROM categories', (err, rows) => {
                        rows.forEach(row => {
                            categoryMap[row.name] = row.id;
                        });
                        res();
                    });
                });

                // Insert inventory items
                let itemCount = 0;
                for (const item of clothingItems) {
                    await new Promise((res) => {
                        db.run(
                            `INSERT INTO inventory (name, category_id, quantity, price, threshold, sku, barcode, created_by) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                            [
                                item.name,
                                categoryMap[item.category],
                                item.quantity,
                                item.price,
                                item.threshold,
                                item.sku,
                                item.barcode
                            ],
                            () => {
                                itemCount++;
                                res();
                            }
                        );
                    });
                }

                console.log(`✅ Added ${itemCount} clothing items\n`);

                // Show summary
                console.log('📊 Inventory Summary:');
                console.log('====================');
                for (const cat of categories) {
                    const count = clothingItems.filter(i => i.category === cat.name).length;
                    console.log(`${cat.name}: ${count} items`);
                }

                const totalValue = clothingItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                const totalItems = clothingItems.reduce((sum, item) => sum + item.quantity, 0);

                console.log('\n💰 Total Inventory Value: €' + totalValue.toFixed(2));
                console.log('📦 Total Items in Stock: ' + totalItems);

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Run the populator
populateDatabase()
    .then(() => {
        console.log('\n✨ Database populated successfully!');
        console.log('You can now run: node generate-yearly-data.js');
        db.close();
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        db.close();
        process.exit(1);
    });
