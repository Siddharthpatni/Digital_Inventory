// Database Seed Script - Clothing Shop with 1 Year Historical Data
// Run with: node server/seed-database.js

const db = require('./models/database');
const bcrypt = require('bcrypt');

// Clothing shop inventory items
const clothingItems = [
    // T-Shirts
    { name: "Men's Basic White T-Shirt", category_name: "T-Shirts", quantity: 45, price: 19.99, threshold: 15, sku: "TS-MW-001", barcode: "1234567890123" },
    { name: "Women's V-Neck Black T-Shirt", category_name: "T-Shirts", quantity: 38, price: 22.99, threshold: 15, sku: "TS-WB-001", barcode: "1234567890124" },
    { name: "Kids Cotton T-Shirt Blue", category_name: "T-Shirts", quantity: 25, price: 14.99, threshold: 10, sku: "TS-KB-001", barcode: "1234567890125" },
    { name: "Graphic Print T-Shirt", category_name: "T-Shirts", quantity: 8, price: 24.99, threshold: 10, sku: "TS-GP-001", barcode: "1234567890126" },
    { name: "Polo Shirt Navy", category_name: "T-Shirts", quantity: 32, price: 34.99, threshold: 12, sku: "TS-PN-001", barcode: "1234567890127" },

    // Jeans
    { name: "Men's Slim Fit Jeans Dark Blue", category_name: "Jeans", quantity: 30, price: 59.99, threshold: 12, sku: "JN-MS-001", barcode: "2234567890123" },
    { name: "Women's Skinny Jeans Black", category_name: "Jeans", quantity: 22, price: 64.99, threshold: 12, sku: "JN-WS-001", barcode: "2234567890124" },
    { name: "Men's Relaxed Fit Jeans", category_name: "Jeans", quantity: 18, price: 54.99, threshold: 10, sku: "JN-MR-001", barcode: "2234567890125" },
    { name: "Kids Denim Jeans", category_name: "Jeans", quantity: 5, price: 39.99, threshold: 8, sku: "JN-KD-001", barcode: "2234567890126" },
    { name: "Women's High Waist Jeans", category_name: "Jeans", quantity: 28, price: 69.99, threshold: 12, sku: "JN-WH-001", barcode: "2234567890127" },

    // Dresses
    { name: "Summer Floral Dress", category_name: "Dresses", quantity: 15, price: 79.99, threshold: 8, sku: "DR-SF-001", barcode: "3234567890123" },
    { name: "Evening Cocktail Dress Black", category_name: "Dresses", quantity: 12, price: 129.99, threshold: 6, sku: "DR-EC-001", barcode: "3234567890124" },
    { name: "Casual Midi Dress", category_name: "Dresses", quantity: 20, price: 69.99, threshold: 10, sku: "DR-CM-001", barcode: "3234567890125" },
    { name: "Maxi Beach Dress", category_name: "Dresses", quantity: 3, price: 89.99, threshold: 5, sku: "DR-MB-001", barcode: "3234567890126" },
    { name: "Office Pencil Dress", category_name: "Dresses", quantity: 17, price: 94.99, threshold: 8, sku: "DR-OP-001", barcode: "3234567890127" },

    // Jackets
    { name: "Leather Jacket Brown", category_name: "Jackets", quantity: 10, price: 199.99, threshold: 5, sku: "JK-LB-001", barcode: "4234567890123" },
    { name: "Denim Jacket Light Blue", category_name: "Jackets", quantity: 16, price: 89.99, threshold: 8, sku: "JK-DL-001", barcode: "4234567890124" },
    { name: "Winter Puffer Jacket", category_name: "Jackets", quantity: 7, price: 149.99, threshold: 6, sku: "JK-WP-001", barcode: "4234567890125" },
    { name: "Bomber Jacket Black", category_name: "Jackets", quantity: 4, price: 119.99, threshold: 5, sku: "JK-BB-001", barcode: "4234567890126" },
    { name: "Windbreaker Jacket", category_name: "Jackets", quantity: 13, price: 79.99, threshold: 8, sku: "JK-WB-001", barcode: "4234567890127" },

    // Shoes
    { name: "Running Shoes White", category_name: "Shoes", quantity: 28, price: 89.99, threshold: 12, sku: "SH-RW-001", barcode: "5234567890123" },
    { name: "Casual Sneakers Black", category_name: "Shoes", quantity: 35, price: 79.99, threshold: 15, sku: "SH-CS-001", barcode: "5234567890124" },
    { name: "High Heels Red", category_name: "Shoes", quantity: 9, price: 99.99, threshold: 8, sku: "SH-HH-001", barcode: "5234567890125" },
    { name: "Sandals Brown Leather", category_name: "Shoes", quantity: 6, price: 59.99, threshold: 8, sku: "SH-SB-001", barcode: "5234567890126" },
    { name: "Boots Black Ankle", category_name: "Shoes", quantity: 14, price: 129.99, threshold: 10, sku: "SH-BA-001", barcode: "5234567890127" },

    // Accessories
    { name: "Leather Belt Black", category_name: "Accessories", quantity: 42, price: 29.99, threshold: 15, sku: "AC-LB-001", barcode: "6234567890123" },
    { name: "Sunglasses Aviator", category_name: "Accessories", quantity: 18, price: 49.99, threshold: 10, sku: "AC-SA-001", barcode: "6234567890124" },
    { name: "Wool Scarf Grey", category_name: "Accessories", quantity: 2, price: 34.99, threshold: 5, sku: "AC-WS-001", barcode: "6234567890125" },
    { name: "Baseball Cap Navy", category_name: "Accessories", quantity: 31, price: 24.99, threshold: 12, sku: "AC-BC-001", barcode: "6234567890126" },
    { name: "Leather Wallet Brown", category_name: "Accessories", quantity: 25, price: 44.99, threshold: 10, sku: "AC-LW-001", barcode: "6234567890127" },

    // Activewear
    { name: "Yoga Pants Black", category_name: "Activewear", quantity: 27, price: 44.99, threshold: 12, sku: "AW-YP-001", barcode: "7234567890123" },
    { name: "Sports Bra Pink", category_name: "Activewear", quantity: 19, price: 34.99, threshold: 10, sku: "AW-SB-001", barcode: "7234567890124" },
    { name: "Running Shorts Men", category_name: "Activewear", quantity: 14, price: 29.99, threshold: 10, sku: "AW-RS-001", barcode: "7234567890125" },
    { name: "Gym Tank Top", category_name: "Activewear", quantity: 4, price: 19.99, threshold: 8, sku: "AW-GT-001", barcode: "7234567890126" },
    { name: "Compression Leggings", category_name: "Activewear", quantity: 22, price: 49.99, threshold: 10, sku: "AW-CL-001", barcode: "7234567890127" }
];

async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    try {
        // Get admin user
        const admin = await db.getUserByUsername('admin');
        if (!admin) {
            console.error('❌ Admin user not found. Please run npm run init-db first.');
            process.exit(1);
        }

        console.log('✅ Admin user found\n');

        // Add inventory items
        console.log('📦 Adding inventory items...');
        const addedItems = [];

        for (const item of clothingItems) {
            try {
                const newItem = await db.createInventoryItem({
                    ...item,
                    created_by: admin.id
                });
                addedItems.push(newItem);
                console.log(`  ✅ ${item.name}`);
            } catch (error) {
                console.log(`  ⚠️  ${item.name} (may already exist)`);
            }
        }

        console.log(`\n✅ Added ${addedItems.length} inventory items\n`);

        // Generate historical data for the past year
        console.log('📊 Generating 1 year of historical data...');

        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

        // Generate sales data for each month
        let totalSales = 0;
        const salesByMonth = {};

        for (let month = 0; month < 12; month++) {
            const monthDate = new Date(oneYearAgo);
            monthDate.setMonth(oneYearAgo.getMonth() + month);
            const monthKey = monthDate.toISOString().slice(0, 7); // YYYY-MM

            salesByMonth[monthKey] = {
                revenue: 0,
                transactions: 0,
                items: {}
            };

            // Generate 50-150 transactions per month
            const transactionsThisMonth = Math.floor(Math.random() * 100) + 50;

            for (let i = 0; i < transactionsThisMonth; i++) {
                // Random item from inventory
                const randomItem = addedItems[Math.floor(Math.random() * addedItems.length)];
                const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items per transaction
                const revenue = randomItem.price * quantity;

                salesByMonth[monthKey].revenue += revenue;
                salesByMonth[monthKey].transactions++;
                totalSales += revenue;

                if (!salesByMonth[monthKey].items[randomItem.name]) {
                    salesByMonth[monthKey].items[randomItem.name] = 0;
                }
                salesByMonth[monthKey].items[randomItem.name] += quantity;
            }

            console.log(`  ✅ ${monthKey}: €${salesByMonth[monthKey].revenue.toFixed(2)} (${salesByMonth[monthKey].transactions} transactions)`);
        }

        console.log(`\n💰 Total sales (1 year): €${totalSales.toFixed(2)}\n`);

        // Save historical data to a JSON file for reference
        const fs = require('fs');
        const historicalData = {
            generatedAt: new Date().toISOString(),
            period: {
                start: oneYearAgo.toISOString(),
                end: now.toISOString()
            },
            summary: {
                totalRevenue: totalSales,
                totalTransactions: Object.values(salesByMonth).reduce((sum, m) => sum + m.transactions, 0),
                averageMonthlyRevenue: totalSales / 12,
                inventoryItems: addedItems.length
            },
            monthlyData: salesByMonth
        };

        fs.writeFileSync(
            './data/historical-sales-data.json',
            JSON.stringify(historicalData, null, 2)
        );

        console.log('✅ Historical data saved to data/historical-sales-data.json\n');

        // Check for low stock and create alerts
        await db.checkLowStock();
        const alerts = await db.getAllAlerts();
        console.log(`⚠️  Generated ${alerts.length} low stock alerts\n`);

        console.log('🎉 Database seeding complete!\n');
        console.log('📊 Summary:');
        console.log(`   • Inventory items: ${addedItems.length}`);
        console.log(`   • Historical period: 1 year`);
        console.log(`   • Total revenue: €${totalSales.toFixed(2)}`);
        console.log(`   • Total transactions: ${Object.values(salesByMonth).reduce((sum, m) => sum + m.transactions, 0)}`);
        console.log(`   • Low stock alerts: ${alerts.length}`);
        console.log('\n✨ You can now login and explore the application!\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();
