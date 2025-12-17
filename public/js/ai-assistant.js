// ===== AI Assistant Module =====
// Intelligent assistant for inventory management

class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.loadHistory();
    }

    loadHistory() {
        const saved = localStorage.getItem('aiChatHistory');
        if (saved) {
            this.messages = JSON.parse(saved);
        }
    }

    saveHistory() {
        localStorage.setItem('aiChatHistory', JSON.stringify(this.messages));
    }

    addMessage(text, isUser = true) {
        const message = {
            text,
            isUser,
            timestamp: new Date().toISOString()
        };
        this.messages.push(message);
        this.saveHistory();
        return message;
    }

    async processQuery(query) {
        const lowerQuery = query.toLowerCase();

        // Get inventory data
        const inventory = await this.getInventoryData();

        // Pattern matching for common queries
        if (lowerQuery.includes('low stock') || lowerQuery.includes('running out')) {
            return this.getLowStockResponse(inventory);
        }

        if (lowerQuery.includes('total value') || lowerQuery.includes('inventory value')) {
            return this.getTotalValueResponse(inventory);
        }

        if (lowerQuery.includes('best selling') || lowerQuery.includes('top products')) {
            return this.getTopProductsResponse(inventory);
        }

        if (lowerQuery.includes('categories') || lowerQuery.includes('category')) {
            return this.getCategoriesResponse(inventory);
        }

        if (lowerQuery.includes('add') && (lowerQuery.includes('product') || lowerQuery.includes('item'))) {
            return "I can help you add items! Click the 'Add Item' button or use the barcode scanner 📷 to quickly add products.";
        }

        if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
            return this.getSalesResponse();
        }

        if (lowerQuery.includes('help') || lowerQuery.includes('what can you do')) {
            return this.getHelpResponse();
        }

        // Default response
        return "I can help you with:\n• Low stock alerts\n• Inventory value\n• Sales analytics\n• Product recommendations\n• Adding items via barcode\n\nWhat would you like to know?";
    }

    async getInventoryData() {
        try {
            const response = await fetch('/api/inventory', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            return data.items || data;
        } catch (error) {
            console.error('Error fetching inventory:', error);
            return [];
        }
    }

    getLowStockResponse(inventory) {
        const lowStock = inventory.filter(item => item.quantity <= item.threshold);

        if (lowStock.length === 0) {
            return "✅ Great news! All items are well-stocked. No low stock alerts.";
        }

        const items = lowStock.slice(0, 5).map(item =>
            `• ${item.name}: ${item.quantity} units (threshold: ${item.threshold})`
        ).join('\n');

        return `⚠️ You have ${lowStock.length} low stock item(s):\n\n${items}${lowStock.length > 5 ? '\n\n...and more. Check the Alerts page for details.' : ''}`;
    }

    getTotalValueResponse(inventory) {
        const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

        return `💰 Your inventory is worth €${totalValue.toFixed(2)}\n\n📊 Total items: ${totalItems}\n📦 Unique products: ${inventory.length}`;
    }

    getTopProductsResponse(inventory) {
        const sorted = inventory
            .map(item => ({
                ...item,
                value: item.quantity * item.price
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        if (sorted.length === 0) {
            return "No products in inventory yet.";
        }

        const items = sorted.map((item, i) =>
            `${i + 1}. ${item.name}: €${item.value.toFixed(2)}`
        ).join('\n');

        return `🏆 Top products by value:\n\n${items}`;
    }

    getCategoriesResponse(inventory) {
        const categories = {};
        inventory.forEach(item => {
            const cat = item.category_name || item.category || 'Uncategorized';
            if (!categories[cat]) {
                categories[cat] = { count: 0, value: 0 };
            }
            categories[cat].count += item.quantity;
            categories[cat].value += item.quantity * item.price;
        });

        const catList = Object.entries(categories)
            .sort((a, b) => b[1].value - a[1].value)
            .slice(0, 5)
            .map(([name, data]) =>
                `• ${name}: ${data.count} items (€${data.value.toFixed(2)})`
            ).join('\n');

        return `📈 Categories overview:\n\n${catList}`;
    }

    getSalesResponse() {
        const salesData = localStorage.getItem('todaySales');
        if (!salesData) {
            return "💵 No sales recorded today yet.";
        }

        const sales = JSON.parse(salesData);
        return `💵 Today's Sales:\n\n• Revenue: €${sales.revenue.toFixed(2)}\n• Transactions: ${sales.transactions}\n\nKeep up the great work! 🎉`;
    }

    getHelpResponse() {
        return `🤖 I'm your AI Inventory Assistant!\n\nI can help you with:\n\n📊 Analytics\n• "Show low stock items"\n• "What's my total inventory value?"\n• "Show top products"\n\n💰 Sales\n• "How are sales today?"\n• "Show revenue"\n\n📦 Inventory\n• "Show categories"\n• "Help me add items"\n\nJust ask me anything!`;
    }

    clearHistory() {
        this.messages = [];
        this.saveHistory();
    }
}

// Initialize AI Assistant
const aiAssistant = new AIAssistant();

// UI Functions
function toggleAIChat() {
    const chatContainer = document.getElementById('aiChatContainer');
    const chatButton = document.getElementById('aiChatButton');

    if (aiAssistant.isOpen) {
        chatContainer.classList.remove('active');
        chatButton.classList.remove('active');
        aiAssistant.isOpen = false;
    } else {
        chatContainer.classList.add('active');
        chatButton.classList.add('active');
        aiAssistant.isOpen = true;
        renderAIMessages();
    }
}

function renderAIMessages() {
    const messagesContainer = document.getElementById('aiMessages');

    if (aiAssistant.messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="ai-welcome">
                <div class="ai-welcome-icon">🤖</div>
                <h3>Hi! I'm your AI Assistant</h3>
                <p>Ask me about your inventory, sales, or anything else!</p>
            </div>
        `;
        return;
    }

    messagesContainer.innerHTML = aiAssistant.messages.map(msg => `
        <div class="ai-message ${msg.isUser ? 'user' : 'assistant'}">
            <div class="ai-message-content">${msg.text.replace(/\n/g, '<br>')}</div>
            <div class="ai-message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
    `).join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    aiAssistant.addMessage(message, true);
    input.value = '';
    renderAIMessages();

    // Show typing indicator
    const messagesContainer = document.getElementById('aiMessages');
    messagesContainer.innerHTML += `
        <div class="ai-message assistant typing">
            <div class="ai-message-content">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Process query
    const response = await aiAssistant.processQuery(message);

    // Remove typing indicator and add response
    aiAssistant.addMessage(response, false);
    renderAIMessages();
}

function clearAIChat() {
    if (confirm('Clear all chat history?')) {
        aiAssistant.clearHistory();
        renderAIMessages();
    }
}
