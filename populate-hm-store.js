#!/usr/bin/env node

/**
 * Populate Database with H&M-Style Clothing Store Data
 * Comprehensive inventory matching H&M's product variety and pricing
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'inventory.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🏪 H&M Style Clothing Store Data Populator');
console.log('==========================================\n');

// H&M-style categories
const categories = [
    { name: "Women's Tops", description: 'Blouses, shirts, and tops' },
    { name: "Women's Bottoms", description: 'Jeans, trousers, skirts' },
    { name: "Women's Dresses", description: 'Casual and formal dresses' },
    { name: "Women's Outerwear", description: 'Jackets, coats, blazers' },
    { name: "Men's Shirts", description: 'Casual and formal shirts' },
    { name: "Men's Pants", description: 'Jeans, chinos, trousers' },
    { name: "Men's Outerwear", description: 'Jackets and coats' },
    { name: "Kids' Clothing", description: "Children's apparel" },
    { name: 'Sportswear', description: 'Athletic and activewear' },
    { name: 'Underwear & Basics', description: 'Essentials and basics' },
    { name: 'Accessories', description: 'Bags, belts, hats, scarves' },
    { name: 'Footwear', description: 'Shoes and sneakers' }
];

// Comprehensive H&M-style inventory
const hmItems = [
    // Women's Tops (12 items)
    { name: 'Ribbed Turtleneck Top', category: "Women's Tops", quantity: 45, price: 12.99, threshold: 15, sku: 'WTP-RTN-001', barcode: '5001234567001' },
    { name: 'Oversized Graphic T-Shirt', category: "Women's Tops", quantity: 52, price: 9.99, threshold: 20, sku: 'WTP-OGR-002', barcode: '5001234567002' },
    { name: 'Linen Blend Blouse', category: "Women's Tops", quantity: 38, price: 24.99, threshold: 15, sku: 'WTP-LNB-003', barcode: '5001234567003' },
    { name: 'V-Neck Long Sleeve', category: "Women's Tops", quantity: 42, price: 14.99, threshold: 15, sku: 'WTP-VNL-004', barcode: '5001234567004' },
    { name: 'Puff Sleeve Blouse', category: "Women's Tops", quantity: 28, price: 19.99, threshold: 12, sku: 'WTP-PSB-005', barcode: '5001234567005' },
    { name: 'Cropped Fitted Tee', category: "Women's Tops", quantity: 56, price: 7.99, threshold: 20, sku: 'WTP-CFT-006', barcode: '5001234567006' },
    { name: 'Silk Touch Cami', category: "Women's Tops", quantity: 34, price: 16.99, threshold: 15, sku: 'WTP-STC-007', barcode: '5001234567007' },
    { name: 'Striped Long Sleeve Top', category: "Women's Tops", quantity: 40, price: 15.99, threshold: 15, sku: 'WTP-SLS-008', barcode: '5001234567008' },
    { name: 'Knitted Sweater', category: "Women's Tops", quantity: 32, price: 29.99, threshold: 12, sku: 'WTP-KNS-009', barcode: '5001234567009' },
    { name: 'Tank Top 3-Pack', category: "Women's Tops", quantity: 48, price: 12.99, threshold: 18, sku: 'WTP-TK3-010', barcode: '5001234567010' },
    { name: 'Ruffle Hem Blouse', category: "Women's Tops", quantity: 25, price: 22.99, threshold: 10, sku: 'WTP-RHB-011', barcode: '5001234567011' },
    { name: 'Tie-Front Crop Top', category: "Women's Tops", quantity: 36, price: 13.99, threshold: 15, sku: 'WTP-TFC-012', barcode: '5001234567012' },

    // Women's Bottoms (10 items)
    { name: 'Skinny High Jeans', category: "Women's Bottoms", quantity: 38, price: 29.99, threshold: 15, sku: 'WBT-SHJ-001', barcode: '5001234567013' },
    { name: 'Mom Jeans', category: "Women's Bottoms", quantity: 42, price: 34.99, threshold: 15, sku: 'WBT-MOM-002', barcode: '5001234567014' },
    { name: 'Wide Leg Trousers', category: "Women's Bottoms", quantity: 30, price: 39.99, threshold: 12, sku: 'WBT-WLT-003', barcode: '5001234567015' },
    { name: 'Straight Ankle Jeans', category: "Women's Bottoms", quantity: 35, price: 32.99, threshold: 15, sku: 'WBT-SAJ-004', barcode: '5001234567016' },
    { name: 'Pleated Mini Skirt', category: "Women's Bottoms", quantity: 28, price: 19.99, threshold: 12, sku: 'WBT-PMS-005', barcode: '5001234567017' },
    { name: 'Midi Pencil Skirt', category: "Women's Bottoms", quantity: 22, price: 24.99, threshold: 10, sku: 'WBT-MPS-006', barcode: '5001234567018' },
    { name: 'Cargo Pants', category: "Women's Bottoms", quantity: 26, price: 36.99, threshold: 12, sku: 'WBT-CRG-007', barcode: '5001234567019' },
    { name: 'Flowy Palazzo Pants', category: "Women's Bottoms", quantity: 24, price: 27.99, threshold: 10, sku: 'WBT-FPP-008', barcode: '5001234567020' },
    { name: 'Denim Shorts', category: "Women's Bottoms", quantity: 44, price: 19.99, threshold: 15, sku: 'WBT-DNS-009', barcode: '5001234567021' },
    { name: 'Leggings 2-Pack', category: "Women's Bottoms", quantity: 50, price: 14.99, threshold: 20, sku: 'WBT-LEG-010', barcode: '5001234567022' },

    // Women's Dresses (8 items)
    { name: 'Floral Midi Dress', category: "Women's Dresses", quantity: 18, price: 34.99, threshold: 8, sku: 'WDR-FMD-001', barcode: '5001234567023' },
    { name: 'Ribbed Bodycon Dress', category: "Women's Dresses", quantity: 22, price: 24.99, threshold: 10, sku: 'WDR-RBD-002', barcode: '5001234567024' },
    { name: 'Shirt Dress', category: "Women's Dresses", quantity: 20, price: 29.99, threshold: 10, sku: 'WDR-SHD-003', barcode: '5001234567025' },
    { name: 'Wrap Dress', category: "Women's Dresses", quantity: 16, price: 39.99, threshold: 8, sku: 'WDR-WRP-004', barcode: '5001234567026' },
    { name: 'Smocked Mini Dress', category: "Women's Dresses", quantity: 24, price: 27.99, threshold: 10, sku: 'WDR-SMD-005', barcode: '5001234567027' },
    { name: 'Knit Sweater Dress', category: "Women's Dresses", quantity: 14, price: 44.99, threshold: 8, sku: 'WDR-KSD-006', barcode: '5001234567028' },
    { name: 'Maxi Dress', category: "Women's Dresses", quantity: 12, price: 49.99, threshold: 6, sku: 'WDR-MXD-007', barcode: '5001234567029' },
    { name: 'Denim Dress', category: "Women's Dresses", quantity: 15, price: 36.99, threshold: 8, sku: 'WDR-DND-008', barcode: '5001234567030' },

    // Women's Outerwear (7 items)
    { name: 'Oversized Blazer', category: "Women's Outerwear", quantity: 16, price: 59.99, threshold: 8, sku: 'WOW-OBZ-001', barcode: '5001234567031' },
    { name: 'Denim Jacket', category: "Women's Outerwear", quantity: 20, price: 49.99, threshold: 10, sku: 'WOW-DNJ-002', barcode: '5001234567032' },
    { name: 'Puffer Jacket', category: "Women's Outerwear", quantity: 14, price: 69.99, threshold: 8, sku: 'WOW-PFJ-003', barcode: '5001234567033' },
    { name: 'Trench Coat', category: "Women's Outerwear", quantity: 10, price: 79.99, threshold: 6, sku: 'WOW-TRC-004', barcode: '5001234567034' },
    { name: 'Faux Leather Jacket', category: "Women's Outerwear", quantity: 12, price: 54.99, threshold: 6, sku: 'WOW-FLJ-005', barcode: '5001234567035' },
    { name: 'Knit Cardigan', category: "Women's Outerwear", quantity: 28, price: 34.99, threshold: 12, sku: 'WOW-KCD-006', barcode: '5001234567036' },
    { name: 'Wool Blend Coat', category: "Women's Outerwear", quantity: 8, price: 89.99, threshold: 5, sku: 'WOW-WBC-007', barcode: '5001234567037' },

    // Men's Shirts (10 items)
    { name: 'Regular Fit Oxford Shirt', category: "Men's Shirts", quantity: 36, price: 24.99, threshold: 15, sku: 'MSH-OXF-001', barcode: '5001234567038' },
    { name: 'Slim Fit Dress Shirt', category: "Men's Shirts", quantity: 32, price: 29.99, threshold: 15, sku: 'MSH-SFD-002', barcode: '5001234567039' },
    { name: 'Casual Linen Shirt', category: "Men's Shirts", quantity: 28, price: 27.99, threshold: 12, sku: 'MSH-LIN-003', barcode: '5001234567040' },
    { name: 'Flannel Shirt', category: "Men's Shirts", quantity: 24, price: 22.99, threshold: 12, sku: 'MSH-FLN-004', barcode: '5001234567041' },
    { name: 'Graphic T-Shirt', category: "Men's Shirts", quantity: 48, price: 9.99, threshold: 20, sku: 'MSH-GRT-005', barcode: '5001234567042' },
    { name: 'Polo Shirt', category: "Men's Shirts", quantity: 40, price: 17.99, threshold: 15, sku: 'MSH-POL-006', barcode: '5001234567043' },
    { name: 'Henley Shirt', category: "Men's Shirts", quantity: 34, price: 16.99, threshold: 15, sku: 'MSH-HEN-007', barcode: '5001234567044' },
    { name: 'Basic T-Shirt 3-Pack', category: "Men's Shirts", quantity: 44, price: 14.99, threshold: 18, sku: 'MSH-BT3-008', barcode: '5001234567045' },
    { name: 'Striped Long Sleeve', category: "Men's Shirts", quantity: 30, price: 19.99, threshold: 12, sku: 'MSH-STR-009', barcode: '5001234567046' },
    { name: 'Muscle Fit Tee', category: "Men's Shirts", quantity: 38, price: 12.99, threshold: 15, sku: 'MSH-MFT-010', barcode: '5001234567047' },

    // Men's Pants (8 items)
    { name: 'Slim Fit Jeans', category: "Men's Pants", quantity: 35, price: 34.99, threshold: 15, sku: 'MPN-SFJ-001', barcode: '5001234567048' },
    { name: 'Regular Fit Chinos', category: "Men's Pants", quantity: 32, price: 29.99, threshold: 12, sku: 'MPN-RFC-002', barcode: '5001234567049' },
    { name: 'Straight Leg Jeans', category: "Men's Pants", quantity: 30, price: 32.99, threshold: 12, sku: 'MPN-SLJ-003', barcode: '5001234567050' },
    { name: 'Cargo Joggers', category: "Men's Pants", quantity: 28, price: 36.99, threshold: 12, sku: 'MPN-CGJ-004', barcode: '5001234567051' },
    { name: 'Dress Trousers', category: "Men's Pants", quantity: 24, price: 39.99, threshold: 10, sku: 'MPN-DRT-005', barcode: '5001234567052' },
    { name: 'Athletic Joggers', category: "Men's Pants", quantity: 40, price: 27.99, threshold: 15, sku: 'MPN-ATJ-006', barcode: '5001234567053' },
    { name: 'Shorts', category: "Men's Pants", quantity: 42, price: 19.99, threshold: 15, sku: 'MPN-SHT-007', barcode: '5001234567054' },
    { name: 'Relaxed Fit Jeans', category: "Men's Pants", quantity: 26, price: 36.99, threshold: 12, sku: 'MPN-RFJ-008', barcode: '5001234567055' },

    // Men's Outerwear (6 items)
    { name: 'Bomber Jacket', category: "Men's Outerwear", quantity: 18, price: 59.99, threshold: 10, sku: 'MOW-BMB-001', barcode: '5001234567056' },
    { name: 'Denim Jacket', category: "Men's Outerwear", quantity: 16, price: 49.99, threshold: 8, sku: 'MOW-DNJ-002', barcode: '5001234567057' },
    { name: 'Parka', category: "Men's Outerwear", quantity: 12, price: 89.99, threshold: 6, sku: 'MOW-PRK-003', barcode: '5001234567058' },
    { name: 'Hoodie', category: "Men's Outerwear", quantity: 45, price: 29.99, threshold: 18, sku: 'MOW-HOD-004', barcode: '5001234567059' },
    { name: 'Zip-Up Jacket', category: "Men's Outerwear", quantity: 22, price: 39.99, threshold: 10, sku: 'MOW-ZIP-005', barcode: '5001234567060' },
    { name: 'Tailored Blazer', category: "Men's Outerwear", quantity: 14, price: 79.99, threshold: 8, sku: 'MOW-TBZ-006', barcode: '5001234567061' },

    // Kids' Clothing (8 items)
    { name: "Kids' Graphic Tee", category: "Kids' Clothing", quantity: 60, price: 6.99, threshold: 25, sku: 'KID-GRT-001', barcode: '5001234567062' },
    { name: "Kids' Denim Jeans", category: "Kids' Clothing", quantity: 45, price: 19.99, threshold: 20, sku: 'KID-DNJ-002', barcode: '5001234567063' },
    { name: "Kids' Hoodie", category: "Kids' Clothing", quantity: 50, price: 17.99, threshold: 20, sku: 'KID-HOD-003', barcode: '5001234567064' },
    { name: "Kids' Dress", category: "Kids' Clothing", quantity: 35, price: 16.99, threshold: 15, sku: 'KID-DRS-004', barcode: '5001234567065' },
    { name: "Kids' Leggings 2-Pack", category: "Kids' Clothing", quantity: 55, price: 9.99, threshold: 25, sku: 'KID-LEG-005', barcode: '5001234567066' },
    { name: "Kids' Jacket", category: "Kids' Clothing", quantity: 28, price: 29.99, threshold: 12, sku: 'KID-JCK-006', barcode: '5001234567067' },
    { name: "Kids' Shorts Set", category: "Kids' Clothing", quantity: 40, price: 14.99, threshold: 18, sku: 'KID-SHS-007', barcode: '5001234567068' },
    { name: "Kids' Pajama Set", category: "Kids' Clothing", quantity: 48, price: 12.99, threshold: 20, sku: 'KID-PJS-008', barcode: '5001234567069' },

    // Sportswear (7 items)
    { name: 'Training Tights', category: 'Sportswear', quantity: 38, price: 24.99, threshold: 15, sku: 'SPT-TRT-001', barcode: '5001234567070' },
    { name: 'Sports Bra', category: 'Sportswear', quantity: 42, price: 19.99, threshold: 18, sku: 'SPT-BRA-002', barcode: '5001234567071' },
    { name: 'Running Shorts', category: 'Sportswear', quantity: 46, price: 16.99, threshold: 18, sku: 'SPT-RSH-003', barcode: '5001234567072' },
    { name: 'Track Jacket', category: 'Sportswear', quantity: 24, price: 39.99, threshold: 12, sku: 'SPT-TRJ-004', barcode: '5001234567073' },
    { name: 'Yoga Set', category: 'Sportswear', quantity: 20, price: 44.99, threshold: 10, sku: 'SPT-YGS-005', barcode: '5001234567074' },
    { name: 'Performance Tank', category: 'Sportswear', quantity: 50, price: 14.99, threshold: 20, sku: 'SPT-PTK-006', barcode: '5001234567075' },
    { name: 'Training Hoodie', category: 'Sportswear', quantity: 32, price: 34.99, threshold: 15, sku: 'SPT-THD-007', barcode: '5001234567076' },

    // Underwear & Basics (6 items)
    { name: 'Cotton Briefs 5-Pack', category: 'Underwear & Basics', quantity: 80, price: 12.99, threshold: 30, sku: 'UND-CB5-001', barcode: '5001234567077' },
    { name: 'Boxer Shorts 3-Pack', category: 'Underwear & Basics', quantity: 75, price: 14.99, threshold: 30, sku: 'UND-BX3-002', barcode: '5001234567078' },
    { name: 'Sports Socks 7-Pack', category: 'Underwear & Basics', quantity: 90, price: 9.99, threshold: 35, sku: 'UND-SS7-003', barcode: '5001234567079' },
    { name: 'Seamless Bralette 2-Pack', category: 'Underwear & Basics', quantity: 60, price: 16.99, threshold: 25, sku: 'UND-SB2-004', barcode: '5001234567080' },
    { name: 'Basic Tank Tops 3-Pack', category: 'Underwear & Basics', quantity: 70, price: 11.99, threshold: 30, sku: 'UND-BT3-005', barcode: '5001234567081' },
    { name: 'Thermal Set', category: 'Underwear & Basics', quantity: 35, price: 19.99, threshold: 15, sku: 'UND-THS-006', barcode: '5001234567082' },

    // Accessories (8 items)
    { name: 'Canvas Tote Bag', category: 'Accessories', quantity: 45, price: 9.99, threshold: 18, sku: 'ACC-CTB-001', barcode: '5001234567083' },
    { name: 'Leather Belt', category: 'Accessories', quantity: 50, price: 14.99, threshold: 20, sku: 'ACC-LBT-002', barcode: '5001234567084' },
    { name: 'Beanie', category: 'Accessories', quantity: 55, price: 8.99, threshold: 20, sku: 'ACC-BNE-003', barcode: '5001234567085' },
    { name: 'Baseball Cap', category: 'Accessories', quantity: 60, price: 12.99, threshold: 25, sku: 'ACC-BCP-004', barcode: '5001234567086' },
    { name: 'Scarf', category: 'Accessories', quantity: 40, price: 16.99, threshold: 15, sku: 'ACC-SCF-005', barcode: '5001234567087' },
    { name: 'Crossbody Bag', category: 'Accessories', quantity: 28, price: 24.99, threshold: 12, sku: 'ACC-CBB-006', barcode: '5001234567088' },
    { name: 'Sunglasses', category: 'Accessories', quantity: 42, price: 14.99, threshold: 18, sku: 'ACC-SNG-007', barcode: '5001234567089' },
    { name: 'Hair Accessories Set', category: 'Accessories', quantity: 65, price: 6.99, threshold: 25, sku: 'ACC-HAS-008', barcode: '5001234567090' },

    // Footwear (6 items)
    { name: 'Canvas Sneakers', category: 'Footwear', quantity: 48, price: 24.99, threshold: 18, sku: 'FTW-CVS-001', barcode: '5001234567091' },
    { name: 'Ankle Boots', category: 'Footwear', quantity: 30, price: 49.99, threshold: 12, sku: 'FTW-ANB-002', barcode: '5001234567092' },
    { name: 'Slides', category: 'Footwear', quantity: 55, price: 12.99, threshold: 20, sku: 'FTW-SLD-003', barcode: '5001234567093' },
    { name: 'Chelsea Boots', category: 'Footwear', quantity: 24, price: 59.99, threshold: 10, sku: 'FTW-CHB-004', barcode: '5001234567094' },
    { name: 'Running Sneakers', category: 'Footwear', quantity: 40, price: 39.99, threshold: 15, sku: 'FTW-RNS-005', barcode: '5001234567095' },
    { name: 'Loafers', category: 'Footwear', quantity: 32, price: 34.99, threshold: 12, sku: 'FTW-LOF-006', barcode: '5001234567096' }
];

async function populateDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                console.log('🗑️  Clearing existing inventory...');
                await new Promise((res) => db.run('DELETE FROM inventory', () => res()));
                await new Promise((res) => db.run('DELETE FROM categories', () => res()));
                await new Promise((res) => db.run('DELETE FROM sales_transactions', () => res()));
                console.log('✅ Cleared old data\n');

                console.log('📦 Creating H&M-style categories...');

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

                console.log('👕 Adding H&M inventory items...');

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
                for (const item of hmItems) {
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

                console.log(`✅ Added ${itemCount} H&M-style items\n`);

                // Show summary
                console.log('📊 Inventory Summary by Category:');
                console.log('==================================');
                for (const cat of categories) {
                    const catItems = hmItems.filter(i => i.category === cat.name);
                    const count = catItems.length;
                    const totalQty = catItems.reduce((sum, item) => sum + item.quantity, 0);
                    const totalValue = catItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                    console.log(`${cat.name.padEnd(25)} ${count} items  |  ${totalQty} units  |  €${totalValue.toFixed(2)}`);
                }

                const totalValue = hmItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                const totalItems = hmItems.reduce((sum, item) => sum + item.quantity, 0);

                console.log('\n💰 Total Inventory Value: €' + totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 }));
                console.log('📦 Total Items in Stock: ' + totalItems.toLocaleString());
                console.log('🏷️  Total Product Lines: ' + hmItems.length);

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
        console.log('\n✨ H&M-style database populated successfully!');
        console.log('\n📈 Next step: Run `node generate-yearly-data.js` to generate sales history');
        db.close();
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        db.close();
        process.exit(1);
    });
