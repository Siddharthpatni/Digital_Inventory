// Test Data Generator for Clothing Shop
// Run this in browser console after logging in

async function addClothingShopTestData() {
    const clothingItems = [
        // T-Shirts
        { name: "Men's Basic White T-Shirt", category_name: "T-Shirts", quantity: 45, price: 19.99, threshold: 15, sku: "TS-MW-001", barcode: "1234567890123" },
        { name: "Women's V-Neck Black T-Shirt", category_name: "T-Shirts", quantity: 38, price: 22.99, threshold: 15, sku: "TS-WB-001", barcode: "1234567890124" },
        { name: "Kids Cotton T-Shirt Blue", category_name: "T-Shirts", quantity: 25, price: 14.99, threshold: 10, sku: "TS-KB-001", barcode: "1234567890125" },
        { name: "Graphic Print T-Shirt", category_name: "T-Shirts", quantity: 8, price: 24.99, threshold: 10, sku: "TS-GP-001", barcode: "1234567890126" },

        // Jeans
        { name: "Men's Slim Fit Jeans Dark Blue", category_name: "Jeans", quantity: 30, price: 59.99, threshold: 12, sku: "JN-MS-001", barcode: "2234567890123" },
        { name: "Women's Skinny Jeans Black", category_name: "Jeans", quantity: 22, price: 64.99, threshold: 12, sku: "JN-WS-001", barcode: "2234567890124" },
        { name: "Men's Relaxed Fit Jeans", category_name: "Jeans", quantity: 18, price: 54.99, threshold: 10, sku: "JN-MR-001", barcode: "2234567890125" },
        { name: "Kids Denim Jeans", category_name: "Jeans", quantity: 5, price: 39.99, threshold: 8, sku: "JN-KD-001", barcode: "2234567890126" },

        // Dresses
        { name: "Summer Floral Dress", category_name: "Dresses", quantity: 15, price: 79.99, threshold: 8, sku: "DR-SF-001", barcode: "3234567890123" },
        { name: "Evening Cocktail Dress Black", category_name: "Dresses", quantity: 12, price: 129.99, threshold: 6, sku: "DR-EC-001", barcode: "3234567890124" },
        { name: "Casual Midi Dress", category_name: "Dresses", quantity: 20, price: 69.99, threshold: 10, sku: "DR-CM-001", barcode: "3234567890125" },
        { name: "Maxi Beach Dress", category_name: "Dresses", quantity: 3, price: 89.99, threshold: 5, sku: "DR-MB-001", barcode: "3234567890126" },

        // Jackets
        { name: "Leather Jacket Brown", category_name: "Jackets", quantity: 10, price: 199.99, threshold: 5, sku: "JK-LB-001", barcode: "4234567890123" },
        { name: "Denim Jacket Light Blue", category_name: "Jackets", quantity: 16, price: 89.99, threshold: 8, sku: "JK-DL-001", barcode: "4234567890124" },
        { name: "Winter Puffer Jacket", category_name: "Jackets", quantity: 7, price: 149.99, threshold: 6, sku: "JK-WP-001", barcode: "4234567890125" },
        { name: "Bomber Jacket Black", category_name: "Jackets", quantity: 4, price: 119.99, threshold: 5, sku: "JK-BB-001", barcode: "4234567890126" },

        // Shoes
        { name: "Running Shoes White", category_name: "Shoes", quantity: 28, price: 89.99, threshold: 12, sku: "SH-RW-001", barcode: "5234567890123" },
        { name: "Casual Sneakers Black", category_name: "Shoes", quantity: 35, price: 79.99, threshold: 15, sku: "SH-CS-001", barcode: "5234567890124" },
        { name: "High Heels Red", category_name: "Shoes", quantity: 9, price: 99.99, threshold: 8, sku: "SH-HH-001", barcode: "5234567890125" },
        { name: "Sandals Brown Leather", category_name: "Shoes", quantity: 6, price: 59.99, threshold: 8, sku: "SH-SB-001", barcode: "5234567890126" },

        // Accessories
        { name: "Leather Belt Black", category_name: "Accessories", quantity: 42, price: 29.99, threshold: 15, sku: "AC-LB-001", barcode: "6234567890123" },
        { name: "Sunglasses Aviator", category_name: "Accessories", quantity: 18, price: 49.99, threshold: 10, sku: "AC-SA-001", barcode: "6234567890124" },
        { name: "Wool Scarf Grey", category_name: "Accessories", quantity: 2, price: 34.99, threshold: 5, sku: "AC-WS-001", barcode: "6234567890125" },
        { name: "Baseball Cap Navy", category_name: "Accessories", quantity: 31, price: 24.99, threshold: 12, sku: "AC-BC-001", barcode: "6234567890126" },

        // Activewear
        { name: "Yoga Pants Black", category_name: "Activewear", quantity: 27, price: 44.99, threshold: 12, sku: "AW-YP-001", barcode: "7234567890123" },
        { name: "Sports Bra Pink", category_name: "Activewear", quantity: 19, price: 34.99, threshold: 10, sku: "AW-SB-001", barcode: "7234567890124" },
        { name: "Running Shorts Men", category_name: "Activewear", quantity: 14, price: 29.99, threshold: 10, sku: "AW-RS-001", barcode: "7234567890125" },
        { name: "Gym Tank Top", category_name: "Activewear", quantity: 4, price: 19.99, threshold: 8, sku: "AW-GT-001", barcode: "7234567890126" }
    ];

    console.log('🛍️ Adding clothing shop test data...');
    let successCount = 0;
    let errorCount = 0;

    for (const item of clothingItems) {
        try {
            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item)
            });

            if (response.ok) {
                successCount++;
                console.log(`✅ Added: ${item.name}`);
            } else {
                errorCount++;
                console.error(`❌ Failed: ${item.name}`, await response.text());
            }
        } catch (error) {
            errorCount++;
            console.error(`❌ Error adding ${item.name}:`, error);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully added: ${successCount} items`);
    console.log(`❌ Failed: ${errorCount} items`);
    console.log(`\n🔄 Refreshing page...`);

    setTimeout(() => {
        location.reload();
    }, 1000);
}

// Instructions:
// 1. Open browser console (F12)
// 2. Make sure you're logged in
// 3. Run: addClothingShopTestData()
// 4. Wait for completion and page reload

console.log('📦 Clothing Shop Test Data Generator loaded!');
console.log('Run: addClothingShopTestData()');
