#!/usr/bin/env node

/**
 * Quick script to populate database with test data including barcodes
 * Run: node populate-with-barcodes.js
 */

const testData = require('./test-data-with-barcodes');
const { createInventoryItem, getAllInventory, checkLowStock } = require('./server/models/database');

console.log('📦 Populating database with test data (with barcodes)...\n');

async function populateDatabase() {
    try {
        // Get existing inventory to check if we need to clear
        const existing = await getAllInventory();
        console.log(`Found ${existing.length} existing items\n`);

        console.log('Adding new items with barcodes...\n');

        let count = 0;
        for (const item of testData) {
            try {
                await createInventoryItem(item);
                count++;
                console.log(`✅ Added: ${item.name} (Barcode: ${item.barcode})`);
            } catch (error) {
                console.error(`❌ Error adding ${item.name}:`, error.message);
            }
        }

        console.log(`\n🎉 Successfully added ${count}/${testData.length} items with barcodes!`);

        // Show category summary
        console.log('\n📊 Categories included:');
        const categories = [...new Set(testData.map(item => item.category_name))];
        categories.forEach(cat => {
            const items = testData.filter(item => item.category_name === cat);
            console.log(`   - ${cat}: ${items.length} items`);
        });

        // Refresh alerts
        console.log('\n🔔 Refreshing low stock alerts...');
        await checkLowStock();
        console.log('✅ Alerts refreshed');

        console.log('\n✅ Database population complete!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error populating database:', error);
        process.exit(1);
    }
}

populateDatabase();
