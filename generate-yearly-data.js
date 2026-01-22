#!/usr/bin/env node

/**
 * Generate One Year of Historical Sales Data
 * 
 * This script generates realistic sales data for the past year to enable
 * better analytics visualization and testing.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'inventory.db');

// Configuration
const DAYS_OF_HISTORY = 300; // ~10 months
const END_DATE = new Date(); // Today
const START_DATE = new Date(END_DATE);
START_DATE.setDate(START_DATE.getDate() - DAYS_OF_HISTORY);

console.log('🚀 Historical Sales Data Generator');
console.log('===================================');
console.log(`📅 Generating data from ${START_DATE.toLocaleDateString()} to ${END_DATE.toLocaleDateString()}`);
console.log(`📊 Total days: ${DAYS_OF_HISTORY}`);
console.log('');

const db = new sqlite3.Database(DB_PATH);

// Seasonal multipliers for realistic patterns
function getSeasonalMultiplier(date) {
    const month = date.getMonth();
    const day = date.getDate();

    // Holiday season boost (Nov-Dec)
    if (month === 10 || month === 11) return 1.8;

    // Black Friday / Cyber Monday (late Nov)
    if (month === 10 && day >= 23 && day <= 30) return 2.5;

    // Christmas week
    if (month === 11 && day >= 20 && day <= 25) return 3.0;

    // New Year sales (early Jan)
    if (month === 0 && day <= 15) return 2.0;

    // Summer dip (July-Aug)
    if (month === 6 || month === 7) return 0.7;

    // Spring boost (March-May)
    if (month >= 2 && month <= 4) return 1.3;

    return 1.0;
}

// Weekend multiplier
function getWeekendMultiplier(date) {
    const dayOfWeek = date.getDay();
    // Saturday and Sunday
    if (dayOfWeek === 0 || dayOfWeek === 6) return 1.5;
    // Friday
    if (dayOfWeek === 5) return 1.3;
    return 1.0;
}

// Generate random number within range
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random float within range
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Main generation function
async function generateHistoricalData() {
    return new Promise((resolve, reject) => {
        // First, get all items from inventory
        db.all('SELECT * FROM inventory', async (err, items) => {
            if (err) {
                console.error('❌ Error fetching items:', err);
                reject(err);
                return;
            }

            if (items.length === 0) {
                console.error('❌ No items in inventory. Please add items first.');
                reject(new Error('No items in inventory'));
                return;
            }

            console.log(`📦 Found ${items.length} items in inventory`);
            console.log('');

            let totalSales = 0;
            let totalRevenue = 0;
            let salesByDate = {};

            // Generate sales for each day
            const currentDate = new Date(START_DATE);

            while (currentDate <= END_DATE) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const seasonal = getSeasonalMultiplier(currentDate);
                const weekend = getWeekendMultiplier(currentDate);

                // Base transactions per day: 5-20, modified by multipliers
                const baseTransactions = randomInt(5, 20);
                const transactionsToday = Math.floor(baseTransactions * seasonal * weekend);

                let dailySales = 0;
                let dailyRevenue = 0;

                // Generate transactions for this day
                for (let i = 0; i < transactionsToday; i++) {
                    // Pick random item(s) - 70% single item, 30% multiple items
                    const itemCount = Math.random() < 0.7 ? 1 : randomInt(2, 3);

                    for (let j = 0; j < itemCount; j++) {
                        const randomItem = items[randomInt(0, items.length - 1)];
                        const quantity = randomInt(1, 5);
                        const totalPrice = randomItem.price * quantity;

                        // Add some time variation throughout the day
                        const hour = randomInt(9, 21); // Store hours 9 AM - 9 PM
                        const minute = randomInt(0, 59);
                        const second = randomInt(0, 59);

                        const saleDate = new Date(currentDate);
                        saleDate.setHours(hour, minute, second, 0);

                        // Insert sale record using correct schema
                        await new Promise((resolveSale) => {
                            db.run(
                                `INSERT INTO sales_transactions (item_id, item_name, quantity_sold, unit_price, total_amount, sale_date) VALUES (?, ?, ?, ?, ?, ?)`,
                                [randomItem.id, randomItem.name, quantity, randomItem.price, totalPrice, dateStr],
                                (err) => {
                                    if (err) {
                                        console.error('Error inserting sale:', err);
                                    }
                                    resolveSale();
                                }
                            );
                        });

                        dailySales += quantity;
                        dailyRevenue += totalPrice;
                        totalSales += quantity;
                        totalRevenue += totalPrice;
                    }
                }

                salesByDate[dateStr] = {
                    transactions: transactionsToday,
                    items: dailySales,
                    revenue: dailyRevenue
                };

                // Progress indicator (every 30 days)
                const daysDone = Math.floor((currentDate - START_DATE) / (1000 * 60 * 60 * 24));
                if (daysDone % 30 === 0) {
                    const progress = Math.floor((daysDone / DAYS_OF_HISTORY) * 100);
                    console.log(`⏳ Progress: ${progress}% - Generated ${totalSales} sales so far...`);
                }

                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }

            console.log('');
            console.log('✅ Data Generation Complete!');
            console.log('===================================');
            console.log(`📈 Total Sales Records: ${totalSales.toLocaleString()}`);
            console.log(`💰 Total Revenue: €${totalRevenue.toFixed(2).toLocaleString()}`);
            console.log(`📅 Days Covered: ${DAYS_OF_HISTORY}`);
            console.log(`📊 Average Daily Revenue: €${(totalRevenue / DAYS_OF_HISTORY).toFixed(2)}`);
            console.log('');

            // Show some sample stats
            const sortedDates = Object.keys(salesByDate).sort();
            console.log('📋 Sample Daily Stats:');
            console.log('-----------------------------------');
            for (let i = 0; i < Math.min(5, sortedDates.length); i++) {
                const date = sortedDates[i];
                const stats = salesByDate[date];
                console.log(`${date}: ${stats.transactions} transactions, €${stats.revenue.toFixed(2)}`);
            }
            console.log('...');
            for (let i = Math.max(0, sortedDates.length - 5); i < sortedDates.length; i++) {
                const date = sortedDates[i];
                const stats = salesByDate[date];
                console.log(`${date}: ${stats.transactions} transactions, €${stats.revenue.toFixed(2)}`);
            }

            resolve();
        });
    });
}

// Run the generator
db.serialize(async () => {
    try {
        console.log('🔄 Starting data generation...');
        console.log('');

        await generateHistoricalData();

        console.log('');
        console.log('🎉 All done! You can now view the analytics with one year of data.');
        console.log('');

    } catch (error) {
        console.error('❌ Error during generation:', error);
    } finally {
        db.close(() => {
            console.log('📊 Database connection closed.');
            process.exit(0);
        });
    }
});
