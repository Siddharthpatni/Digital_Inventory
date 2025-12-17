// Quick Test Data Loader - Paste in Browser Console
// This will add sample clothing shop data

(async function () {
    const items = [
        { name: "Men's White T-Shirt", category_name: "T-Shirts", quantity: 45, price: 19.99, threshold: 15 },
        { name: "Women's Black T-Shirt", category_name: "T-Shirts", quantity: 38, price: 22.99, threshold: 15 },
        { name: "Kids Blue T-Shirt", category_name: "T-Shirts", quantity: 25, price: 14.99, threshold: 10 },
        { name: "Men's Dark Blue Jeans", category_name: "Jeans", quantity: 30, price: 59.99, threshold: 12 },
        { name: "Women's Black Jeans", category_name: "Jeans", quantity: 22, price: 64.99, threshold: 12 },
        { name: "Summer Floral Dress", category_name: "Dresses", quantity: 15, price: 79.99, threshold: 8 },
        { name: "Evening Cocktail Dress", category_name: "Dresses", quantity: 12, price: 129.99, threshold: 6 },
        { name: "Leather Jacket Brown", category_name: "Jackets", quantity: 10, price: 199.99, threshold: 5 },
        { name: "Denim Jacket", category_name: "Jackets", quantity: 16, price: 89.99, threshold: 8 },
        { name: "Running Shoes White", category_name: "Shoes", quantity: 28, price: 89.99, threshold: 12 },
        { name: "Casual Sneakers Black", category_name: "Shoes", quantity: 35, price: 79.99, threshold: 15 },
        { name: "Leather Belt Black", category_name: "Accessories", quantity: 42, price: 29.99, threshold: 15 },
        { name: "Sunglasses Aviator", category_name: "Accessories", quantity: 18, price: 49.99, threshold: 10 },
        { name: "Yoga Pants Black", category_name: "Activewear", quantity: 27, price: 44.99, threshold: 12 },
        { name: "Sports Bra Pink", category_name: "Activewear", quantity: 19, price: 34.99, threshold: 10 }
    ];

    console.log('🛍️ Adding clothing shop data...');
    for (const item of items) {
        try {
            await fetch('/api/inventory', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item)
            });
            console.log(`✅ ${item.name}`);
        } catch (e) {
            console.error(`❌ ${item.name}`, e);
        }
    }
    console.log('✨ Done! Reloading...');
    setTimeout(() => location.reload(), 1000);
})();
