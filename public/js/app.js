// ===== Digital Inventory Management System =====
// Frontend Application with API Integration

// ===== Configuration =====
const API_BASE_URL = '/api';

// ===== Authentication Helper =====
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Handle 401 responses globally
async function handleResponse(response) {
    if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please login again.');
    }
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Request failed');
    }
    return response.json();
}

// ===== Global State =====
let inventory = [];
let alerts = [];
let settings = {
    language: 'en',
    currency: 'EUR',
    default_threshold: 10,
    enable_alerts: 1,
    theme: 'light'
};

// Sales tracking
let todaySales = {
    revenue: 0,
    transactions: 0,
    date: new Date().toDateString()
};

// Load sales data from localStorage
function loadSalesData() {
    const saved = localStorage.getItem('todaySales');
    if (saved) {
        const data = JSON.parse(saved);
        const today = new Date().toDateString();
        if (data.date === today) {
            todaySales = data;
        } else {
            // New day, reset sales
            todaySales = { revenue: 0, transactions: 0, date: today };
            saveSalesData();
        }
    }
}

// Save sales data to localStorage
function saveSalesData() {
    localStorage.setItem('todaySales', JSON.stringify(todaySales));
}

// Record a sale
function recordSale(amount) {
    todaySales.revenue += amount;
    todaySales.transactions++;
    saveSalesData();
    updateDashboard();
}

// ===== UI Utility Functions =====
// Loading overlay
function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = overlay.querySelector('.loading-text');
    text.textContent = message;
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('active');
}

// Toast notifications
function showToast(title, message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ===== API Functions =====
const api = {
    // Inventory endpoints
    async getInventory() {
        const response = await fetch(`${API_BASE_URL}/inventory`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async createItem(item) {
        const response = await fetch(`${API_BASE_URL}/inventory`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(item)
        });
        return handleResponse(response);
    },

    async updateItem(id, item) {
        const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(item)
        });
        return handleResponse(response);
    },

    async deleteItem(id) {
        const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Alerts endpoints
    async getAlerts() {
        const response = await fetch(`${API_BASE_URL}/alerts`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async clearAlerts() {
        const response = await fetch(`${API_BASE_URL}/alerts`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async refreshAlerts() {
        const response = await fetch(`${API_BASE_URL}/alerts/refresh`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Settings endpoints
    async getSettings() {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async updateSettings(newSettings) {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(newSettings)
        });
        return handleResponse(response);
    },

    // Export/Import
    async exportData() {
        const response = await fetch(`${API_BASE_URL}/export`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async importData(data) {
        const response = await fetch(`${API_BASE_URL}/import`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    // Sales endpoints
    async createSale(saleData) {
        const response = await fetch(`${API_BASE_URL}/sales`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(saleData)
        });
        return handleResponse(response);
    },

    async getDailySales(date) {
        const url = date ? `${API_BASE_URL}/sales/daily?date=${date}` : `${API_BASE_URL}/sales/daily`;
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async getTodaySalesSummary() {
        const response = await fetch(`${API_BASE_URL}/sales/today`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    }
};

// ===== Translations =====
const translations = {
    en: {
        dashboard: 'Dashboard',
        addItem: 'Add Item',
        todaySales: "Today's Sales",
        transactions: 'transactions',
        totalItems: 'Total Items',
        totalValue: 'Total Value',
        lowStock: 'Low Stock Alerts',
        categories: 'Categories',
        quickActions: 'Quick Actions',
        stockLevel: 'Stock Level',
        alerts: 'Alerts',
        inventory: 'Effortless Inventory Tracking',
        analytics: 'Past Data Analysis',
        settings: 'Settings',
        stock: 'Stock',
        searchItems: 'Search items...',
        all: 'All',
        inStock: 'In Stock',
        clearAll: 'Clear All',
        export: 'Export',
        import: 'Import',
        itemName: 'Item Name',
        category: 'Category',
        quantity: 'Quantity',
        price: 'Price',
        threshold: 'Threshold',
        actions: 'Actions',
        categoryBreakdown: 'Category Breakdown',
        stockTrends: 'Stock Trends',
        topItems: 'Top Items by Value',
        generalSettings: 'General Settings',
        language: 'Language',
        currency: 'Currency',
        defaultThreshold: 'Default Low Stock Threshold',
        notifications: 'Notifications',
        enableAlerts: 'Enable Low Stock Alerts',
        dataManagement: 'Data Management',
        clearAllData: 'Clear All Data',
        addNewItem: 'Add New Item',
        editItem: 'Edit Item',
        cancel: 'Cancel',
        save: 'Save',
        lowStockThreshold: 'Low Stock Threshold',
        edit: 'Edit',
        delete: 'Delete',
        noAlertsMessage: 'No alerts at the moment. All stock levels are good!',
        noItemsMessage: 'No items in inventory. Click "Add Item" to get started!',
        confirmDelete: 'Are you sure you want to delete this item?',
        confirmClearData: 'Are you sure you want to clear all data? This cannot be undone!',
        itemAdded: 'Item added successfully!',
        itemUpdated: 'Item updated successfully!',
        itemDeleted: 'Item deleted successfully!',
        dataCleared: 'All data cleared successfully!',
        lowStockAlert: 'Low stock alert for',
        todaysSalesHistory: "Today's Sales History",
        recordSale: 'Record Sale',
        selectItem: 'Select Item',
        unitPrice: 'Unit Price'
    },
    de: {
        dashboard: 'Dashboard',
        addItem: 'Artikel hinzufügen',
        todaySales: 'Heutige Verkäufe',
        transactions: 'Transaktionen',
        totalItems: 'Gesamtartikel',
        totalValue: 'Gesamtwert',
        lowStock: 'Niedrige Lagerbestände',
        categories: 'Kategorien',
        quickActions: 'Schnellaktionen',
        stockLevel: 'Lagerbestand',
        alerts: 'Warnungen',
        inventory: 'Mühelose Bestandsverfolgung',
        analytics: 'Datenanalyse',
        settings: 'Einstellungen',
        stock: 'Lager',
        searchItems: 'Artikel suchen...',
        all: 'Alle',
        inStock: 'Auf Lager',
        clearAll: 'Alle löschen',
        export: 'Exportieren',
        import: 'Importieren',
        itemName: 'Artikelname',
        category: 'Kategorie',
        quantity: 'Menge',
        price: 'Preis',
        threshold: 'Schwellenwert',
        actions: 'Aktionen',
        categoryBreakdown: 'Kategorieübersicht',
        stockTrends: 'Lagertrends',
        topItems: 'Top-Artikel nach Wert',
        generalSettings: 'Allgemeine Einstellungen',
        language: 'Sprache',
        currency: 'Währung',
        defaultThreshold: 'Standard-Niedrigbestandsschwelle',
        notifications: 'Benachrichtigungen',
        enableAlerts: 'Niedrigbestandswarnungen aktivieren',
        dataManagement: 'Datenverwaltung',
        clearAllData: 'Alle Daten löschen',
        addNewItem: 'Neuen Artikel hinzufügen',
        editItem: 'Artikel bearbeiten',
        cancel: 'Abbrechen',
        save: 'Speichern',
        lowStockThreshold: 'Niedrigbestandsschwelle',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        noAlertsMessage: 'Keine Warnungen im Moment. Alle Lagerbestände sind gut!',
        noItemsMessage: 'Keine Artikel im Inventar. Klicken Sie auf "Artikel hinzufügen", um zu beginnen!',
        confirmDelete: 'Möchten Sie diesen Artikel wirklich löschen?',
        confirmClearData: 'Möchten Sie wirklich alle Daten löschen? Dies kann nicht rückgängig gemacht werden!',
        itemAdded: 'Artikel erfolgreich hinzugefügt!',
        itemUpdated: 'Artikel erfolgreich aktualisiert!',
        itemDeleted: 'Artikel erfolgreich gelöscht!',
        dataCleared: 'Alle Daten erfolgreich gelöscht!',
        lowStockAlert: 'Niedrigbestandswarnung für',
        todaysSalesHistory: 'Heutige Verkaufshistorie',
        recordSale: 'Verkauf erfassen',
        selectItem: 'Artikel auswählen',
        unitPrice: 'Stückpreis'
    }
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    if (!checkAuth()) {
        return; // Will redirect to login
    }

    loadSalesData();
    await loadData();
    initializeEventListeners();
    await updateDashboard();
    await renderStockList();
    await renderAlerts();
    await renderInventoryTable();
    await renderAnalytics();
    applyTranslations();
});

// ===== Data Loading =====
async function loadData() {
    try {
        // Load all data from API
        const inventoryResponse = await api.getInventory();
        inventory = inventoryResponse.items || inventoryResponse || [];

        const alertsResponse = await api.getAlerts();
        alerts = Array.isArray(alertsResponse) ? alertsResponse : [];

        const loadedSettings = await api.getSettings();

        if (loadedSettings) {
            settings = {
                language: loadedSettings.language || 'en',
                currency: loadedSettings.currency || 'EUR',
                default_threshold: loadedSettings.default_threshold || 10,
                enable_alerts: loadedSettings.enable_alerts || 1,
                theme: loadedSettings.theme || 'light'
            };
            applySettings();
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function saveSettings() {
    try {
        await api.updateSettings(settings);
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// ===== Event Listeners =====
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.page;
            navigateTo(page);
        });
    });

    // Add Item Button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            console.log('Add Item button clicked');
            openModal();
        });
    } else {
        console.error('Add Item button not found!');
    }

    // Item Form
    document.getElementById('itemForm').addEventListener('submit', handleItemSubmit);

    // Search
    document.getElementById('stockSearch').addEventListener('input', handleSearch);

    // Filter Tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const filter = e.currentTarget.dataset.filter;
            filterStock(filter);
        });
    });

    // Language Toggle
    document.getElementById('languageToggle').addEventListener('click', toggleLanguage);
    document.getElementById('languageSelect').addEventListener('change', async (e) => {
        settings.language = e.target.value;
        await saveSettings();
        applyTranslations();
        await updateDashboard();
    });

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Logout Button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
        }
    });

    // Settings
    document.getElementById('currencySelect').addEventListener('change', async (e) => {
        settings.currency = e.target.value;
        await saveSettings();
        await updateDashboard();
        await renderStockList();
        await renderInventoryTable();
        await renderAnalytics();
    });

    document.getElementById('defaultThreshold').addEventListener('change', async (e) => {
        settings.default_threshold = parseInt(e.target.value);
        await saveSettings();
    });

    document.getElementById('enableAlerts').addEventListener('change', async (e) => {
        settings.enable_alerts = e.target.checked ? 1 : 0;
        await saveSettings();
    });

    // Clear Alerts
    document.getElementById('clearAlertsBtn').addEventListener('click', async () => {
        try {
            await api.clearAlerts();
            await renderAlerts();
            await updateDashboard();
        } catch (error) {
            console.error('Error clearing alerts:', error);
        }
    });

    // Clear Data
    document.getElementById('clearDataBtn').addEventListener('click', async () => {
        if (confirm(translate('confirmClearData'))) {
            try {
                // Delete all items
                for (const item of inventory) {
                    await api.deleteItem(item.id);
                }
                await loadData();
                await updateDashboard();
                await renderStockList();
                await renderAlerts();
                await renderInventoryTable();
                await renderAnalytics();
            } catch (error) {
                console.error('Error clearing data:', error);
            }
        }
    });

    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', importData);

    // Sales Modal
    const recordSaleBtn = document.getElementById('recordSaleBtn');
    if (recordSaleBtn) {
        recordSaleBtn.addEventListener('click', openSaleModal);
    }

    const saleForm = document.getElementById('saleForm');
    if (saleForm) {
        saleForm.addEventListener('submit', handleSaleSubmit);
    }

    // Sale item selection change
    const saleItemSelect = document.getElementById('saleItemSelect');
    if (saleItemSelect) {
        saleItemSelect.addEventListener('change', updateSaleForm);
    }

    // Sale quantity change
    const saleQuantity = document.getElementById('saleQuantity');
    if (saleQuantity) {
        saleQuantity.addEventListener('input', calculateSaleTotal);
    }
}

// ===== Navigation =====
function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show selected page
    document.getElementById(page).classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // Refresh content based on page
    if (page === 'dashboard') {
        updateDashboard();
        loadDailySales();
    }
    if (page === 'stock') renderStockList();
    if (page === 'alerts') renderAlerts();
    if (page === 'inventory') renderInventoryTable();
    if (page === 'analytics') renderAnalytics();
}

// ===== Dashboard =====
async function updateDashboard() {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.threshold);
    const categories = [...new Set(inventory.map(item => item.category_name))];

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
    document.getElementById('lowStockCount').textContent = lowStockItems.length;
    document.getElementById('categoriesCount').textContent = categories.length;
    document.getElementById('alertBadge').textContent = alerts.length;

    // Update today's sales from API
    try {
        const salesSummary = await api.getTodaySalesSummary();
        document.getElementById('todaySales').textContent = formatCurrency(salesSummary.total_revenue || 0);
        const transText = `${salesSummary.transaction_count || 0} ${translate('transactions')}`;
        document.getElementById('todayTransactions').textContent = transText;
    } catch (error) {
        console.error('Error loading sales summary:', error);
    }

    // Load daily sales list
    await loadDailySales();
}

// ===== Stock Management =====
async function renderStockList(filter = 'all', searchTerm = '') {
    const stockList = document.getElementById('stockList');
    let items = [...inventory];

    // Apply filter
    if (filter === 'low') {
        items = items.filter(item => item.quantity <= item.threshold);
    } else if (filter === 'instock') {
        items = items.filter(item => item.quantity > item.threshold);
    }

    // Apply search
    if (searchTerm) {
        items = items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.category_name && item.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    if (items.length === 0) {
        stockList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>${translate('noItemsMessage')}</p>
            </div>
        `;
        return;
    }

    stockList.innerHTML = items.map(item => `
        <div class="stock-item ${item.quantity <= item.threshold ? 'low-stock' : ''}">
            <div class="stock-item-info">
                <div class="stock-item-name">${item.name}</div>
                <span class="stock-item-category">${item.category_name || 'Uncategorized'}</span>
            </div>
            <div class="stock-item-details">
                <div class="stock-quantity">
                    <div class="stock-quantity-label">${translate('quantity')}</div>
                    <div class="stock-quantity-value">${item.quantity}</div>
                </div>
                <div class="stock-quantity">
                    <div class="stock-quantity-label">${translate('price')}</div>
                    <div class="stock-quantity-value">${formatCurrency(item.price)}</div>
                </div>
                <div class="stock-actions">
                    <button class="stock-btn sell" onclick="sellItem(${item.id})" title="Sell 1 unit">💰 Sell</button>
                    <button class="stock-btn" onclick="adjustStock(${item.id}, -1)">-</button>
                    <button class="stock-btn" onclick="adjustStock(${item.id}, 1)">+</button>
                    <button class="stock-btn edit" onclick="editItem(${item.id})">${translate('edit')}</button>
                    <button class="stock-btn delete" onclick="deleteItem(${item.id})">${translate('delete')}</button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterStock(filter) {
    const searchTerm = document.getElementById('stockSearch').value;
    renderStockList(filter, searchTerm);
}

function handleSearch(e) {
    const searchTerm = e.target.value;
    const activeFilter = document.querySelector('.filter-tab.active').dataset.filter;
    renderStockList(activeFilter, searchTerm);
}

async function adjustStock(id, change) {
    try {
        const item = inventory.find(i => i.id === id);
        if (item) {
            const newQuantity = Math.max(0, item.quantity + change);
            showLoading('Updating stock...');

            await api.updateItem(id, {
                ...item,
                quantity: newQuantity
            });

            await loadData();
            await updateDashboard();
            await renderStockList();
            await renderInventoryTable();
            await renderAnalytics();

            const action = change > 0 ? 'increased' : 'decreased';
            showToast('Stock Updated', `${item.name} stock ${action}`, 'success', 2000);
        }
    } catch (error) {
        console.error('Error adjusting stock:', error);
        showToast('Error', error.message || 'Failed to update stock', 'error');
    } finally {
        hideLoading();
    }
}

// Sell item function
async function sellItem(id) {
    try {
        const item = inventory.find(i => i.id === id);
        if (!item) return;

        if (item.quantity <= 0) {
            showToast('Out of Stock', `${item.name} is currently unavailable`, 'warning');
            return;
        }

        const confirmSell = confirm(`Sell 1 unit of ${item.name} for ${formatCurrency(item.price)}?`);
        if (!confirmSell) return;

        showLoading('Processing sale...');

        // Record the sale through API (this will also update inventory)
        await api.createSale({
            item_id: id,
            quantity: 1
        });

        // Reload all data
        await loadData();
        await updateDashboard();
        await loadDailySales();
        await renderStockList();
        await renderInventoryTable();
        await renderAnalytics();

        // Show success message
        showToast('Sale Recorded', `1 × ${item.name} = ${formatCurrency(item.price)}`, 'success');
    } catch (error) {
        console.error('Error selling item:', error);
        showToast('Sale Failed', error.message || 'Error processing sale', 'error');
    } finally {
        hideLoading();
    }
}

// ===== Item CRUD Operations =====
let editingItemId = null;

function openModal(itemId = null) {
    console.log('openModal called with itemId:', itemId);
    const modal = document.getElementById('itemModal');
    const form = document.getElementById('itemForm');
    const modalTitle = document.getElementById('modalTitle');

    if (!modal) {
        console.error('Modal element not found!');
        return;
    }

    form.reset();
    editingItemId = itemId;

    if (itemId) {
        const item = inventory.find(i => i.id === itemId);
        if (item) {
            modalTitle.textContent = translate('editItem');
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemCategory').value = item.category_name || '';
            document.getElementById('itemQuantity').value = item.quantity;
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemThreshold').value = item.threshold;
        }
    } else {
        modalTitle.textContent = translate('addNewItem');
        document.getElementById('itemThreshold').value = settings.default_threshold;
    }

    // Update category datalist
    const categories = [...new Set(inventory.map(item => item.category_name).filter(Boolean))];
    document.getElementById('categoryList').innerHTML = categories.map(cat =>
        `<option value="${cat}">`
    ).join('');

    console.log('Adding active class to modal');
    modal.classList.add('active');
    console.log('Modal classes:', modal.className);
}

function closeModal() {
    document.getElementById('itemModal').classList.remove('active');
    editingItemId = null;
}

async function handleItemSubmit(e) {
    e.preventDefault();

    const itemData = {
        name: document.getElementById('itemName').value,
        category_name: document.getElementById('itemCategory').value,
        quantity: parseInt(document.getElementById('itemQuantity').value),
        price: parseFloat(document.getElementById('itemPrice').value),
        threshold: parseInt(document.getElementById('itemThreshold').value)
    };

    try {
        showLoading(editingItemId ? 'Updating item...' : 'Adding item...');

        if (editingItemId) {
            await api.updateItem(editingItemId, itemData);
            showToast('Success', `${itemData.name} updated successfully`, 'success');
        } else {
            await api.createItem(itemData);
            showToast('Success', `${itemData.name} added to inventory`, 'success');
        }

        await loadData();
        closeModal();
        await updateDashboard();
        await renderStockList();
        await renderInventoryTable();
        await renderAnalytics();
    } catch (error) {
        console.error('Error saving item:', error);
        showToast('Error', error.message || 'Failed to save item. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function editItem(id) {
    openModal(id);
}

async function deleteItem(id) {
    const item = inventory.find(i => i.id === id);
    if (confirm(translate('confirmDelete'))) {
        try {
            showLoading('Deleting item...');
            await api.deleteItem(id);
            await loadData();
            await updateDashboard();
            await renderStockList();
            await renderAlerts();
            await renderInventoryTable();
            await renderAnalytics();
            showToast('Deleted', `${item?.name || 'Item'} removed from inventory`, 'info');
        } catch (error) {
            console.error('Error deleting item:', error);
            showToast('Error', error.message || 'Failed to delete item', 'error');
        } finally {
            hideLoading();
        }
    }
}

// ===== Alerts =====
async function renderAlerts() {
    const alertsList = document.getElementById('alertsList');

    if (alerts.length === 0) {
        alertsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <p>${translate('noAlertsMessage')}</p>
            </div>
        `;
        return;
    }

    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item">
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
                <div class="alert-title">${translate('lowStockAlert')} ${alert.item_name}</div>
                <div class="alert-message">
                    ${translate('quantity')}: ${alert.quantity} / ${translate('threshold')}: ${alert.threshold}
                </div>
                <div class="alert-time">${formatDate(alert.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

// ===== Inventory Table =====
async function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');

    if (inventory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    ${translate('noItemsMessage')}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = inventory.map(item => `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.category_name || 'Uncategorized'}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.threshold}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editItem(${item.id})">${translate('edit')}</button>
                    <button class="table-btn delete" onclick="deleteItem(${item.id})">${translate('delete')}</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== Analytics =====
async function renderAnalytics() {
    renderCategoryChart();
    renderStockTrends();
    renderTopItems();
}

function renderCategoryChart() {
    const categoryData = {};
    inventory.forEach(item => {
        const category = item.category_name || 'Uncategorized';
        if (!categoryData[category]) {
            categoryData[category] = 0;
        }
        categoryData[category] += item.quantity;
    });

    const maxValue = Math.max(...Object.values(categoryData), 1);
    const chartContainer = document.getElementById('categoryChart');

    if (Object.keys(categoryData).length === 0) {
        chartContainer.innerHTML = `<p style="text-align: center; color: var(--gray-500);">${translate('noItemsMessage')}</p>`;
        return;
    }

    chartContainer.innerHTML = Object.entries(categoryData).map(([category, count]) => {
        const percentage = (count / maxValue) * 100;
        return `
            <div class="chart-bar">
                <div class="chart-label">${category}</div>
                <div class="chart-bar-fill" style="width: ${percentage}%">
                    <span class="chart-value">${count}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderStockTrends() {
    const trendsContainer = document.getElementById('stockTrends');

    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const avgPrice = inventory.length > 0 ? inventory.reduce((sum, item) => sum + item.price, 0) / inventory.length : 0;
    const lowStockPercentage = inventory.length > 0 ? (inventory.filter(item => item.quantity <= item.threshold).length / inventory.length * 100) : 0;

    trendsContainer.innerHTML = `
        <div class="trend-item">
            <span><strong>${translate('totalItems')}:</strong></span>
            <span>${totalStock}</span>
        </div>
        <div class="trend-item">
            <span><strong>Average ${translate('price')}:</strong></span>
            <span>${formatCurrency(avgPrice)}</span>
        </div>
        <div class="trend-item">
            <span><strong>${translate('lowStock')} %:</strong></span>
            <span>${lowStockPercentage.toFixed(1)}%</span>
        </div>
    `;
}

function renderTopItems() {
    const topItemsContainer = document.getElementById('topItems');

    const itemsByValue = inventory
        .map(item => ({
            ...item,
            totalValue: item.quantity * item.price
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5);

    if (itemsByValue.length === 0) {
        topItemsContainer.innerHTML = `<p style="text-align: center; color: var(--gray-500);">${translate('noItemsMessage')}</p>`;
        return;
    }

    topItemsContainer.innerHTML = itemsByValue.map((item, index) => `
        <div class="top-item">
            <div class="top-item-rank">${index + 1}</div>
            <div class="top-item-info">
                <div class="top-item-name">${item.name}</div>
                <div style="font-size: var(--font-size-sm); color: var(--gray-600);">${item.category_name || 'Uncategorized'}</div>
            </div>
            <div class="top-item-value">${formatCurrency(item.totalValue)}</div>
        </div>
    `).join('');
}

// ===== Settings & Preferences =====
function applySettings() {
    document.getElementById('languageSelect').value = settings.language;
    document.getElementById('currencySelect').value = settings.currency;
    document.getElementById('defaultThreshold').value = settings.default_threshold;
    document.getElementById('enableAlerts').checked = settings.enable_alerts === 1;
    document.getElementById('currentLang').textContent = settings.language.toUpperCase();

    if (settings.theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.querySelector('.theme-icon').textContent = '☀️';
    }
}

async function toggleLanguage() {
    settings.language = settings.language === 'en' ? 'de' : 'en';
    await saveSettings();
    applyTranslations();
    await updateDashboard();
    await renderStockList();
    await renderAlerts();
    await renderInventoryTable();
    await renderAnalytics();
    document.getElementById('currentLang').textContent = settings.language.toUpperCase();
}

async function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');

    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        settings.theme = 'light';
    } else {
        body.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        settings.theme = 'dark';
    }

    await saveSettings();
}

// ===== Internationalization =====
function translate(key) {
    return translations[settings.language][key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = translate(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = translate(key);
    });
}

// ===== Utility Functions =====
function formatCurrency(value) {
    const symbols = {
        EUR: '€',
        USD: '$',
        GBP: '£'
    };

    return `${symbols[settings.currency]}${value.toFixed(2)}`;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US');
}

// ===== Data Import/Export =====
async function exportData() {
    try {
        const data = await api.exportData();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);

                await api.importData(data);
                await loadData();
                await updateDashboard();
                await renderStockList();
                await renderAlerts();
                await renderInventoryTable();
                await renderAnalytics();
                applyTranslations();

                alert('Data imported successfully!');
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error importing data. Please check the file format.');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// ===== Sales Management =====

// Load and display daily sales
async function loadDailySales() {
    try {
        const salesData = await api.getDailySales();
        const salesList = document.getElementById('dailySalesList');

        if (!salesList) return;

        if (!salesData.transactions || salesData.transactions.length === 0) {
            salesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💰</div>
                    <p>No sales recorded today</p>
                </div>
            `;
            return;
        }

        salesList.innerHTML = salesData.transactions.map(sale => `
            <div class="sales-item">
                <div class="sale-item-info">
                    <div class="sale-item-name">${sale.item_name}</div>
                    <div class="sale-item-time">${formatTime(sale.created_at)}</div>
                </div>
                <div class="sale-item-details">
                    <div class="sale-detail">
                        <span class="sale-label">Qty:</span>
                        <span class="sale-value">${sale.quantity_sold}</span>
                    </div>
                    <div class="sale-detail">
                        <span class="sale-label">@</span>
                        <span class="sale-value">${formatCurrency(sale.unit_price)}</span>
                    </div>
                    <div class="sale-total">${formatCurrency(sale.total_amount)}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading daily sales:', error);
    }
}

// Open sale modal
function openSaleModal() {
    const modal = document.getElementById('saleModal');
    const form = document.getElementById('saleForm');
    const select = document.getElementById('saleItemSelect');

    if (!modal || !select) return;

    form.reset();

    // Populate items dropdown
    select.innerHTML = '<option value="">-- Choose an item --</option>';
    inventory.forEach(item => {
        if (item.quantity > 0) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.quantity} available)`;
            option.dataset.price = item.price;
            option.dataset.quantity = item.quantity;
            select.appendChild(option);
        }
    });

    modal.classList.add('active');
}

// Close sale modal
function closeSaleModal() {
    const modal = document.getElementById('saleModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Update sale form when item is selected
function updateSaleForm() {
    const select = document.getElementById('saleItemSelect');
    const priceInput = document.getElementById('salePrice');
    const qtyInput = document.getElementById('saleQuantity');
    const availableQty = document.getElementById('availableQty');

    const selectedOption = select.options[select.selectedIndex];

    if (selectedOption && selectedOption.value) {
        const price = parseFloat(selectedOption.dataset.price);
        const maxQty = parseInt(selectedOption.dataset.quantity);

        priceInput.value = price.toFixed(2);
        qtyInput.max = maxQty;
        qtyInput.value = '';
        availableQty.textContent = `Available: ${maxQty} units`;

        calculateSaleTotal();
    } else {
        priceInput.value = '';
        qtyInput.value = '';
        availableQty.textContent = '';
        document.getElementById('saleTotal').value = '';
    }
}

// Calculate sale total
function calculateSaleTotal() {
    const quantity = parseFloat(document.getElementById('saleQuantity').value) || 0;
    const price = parseFloat(document.getElementById('salePrice').value) || 0;
    const total = quantity * price;

    document.getElementById('saleTotal').value = total.toFixed(2);
}

// Handle sale form submission
async function handleSaleSubmit(e) {
    e.preventDefault();

    const itemId = parseInt(document.getElementById('saleItemSelect').value);
    const quantity = parseInt(document.getElementById('saleQuantity').value);

    if (!itemId || !quantity || quantity <= 0) {
        alert('Please select an item and enter a valid quantity');
        return;
    }

    try {
        const result = await api.createSale({
            item_id: itemId,
            quantity: quantity
        });

        // Success - reload data
        await loadData();
        await updateDashboard();
        await loadDailySales();
        await renderStockList();
        await renderInventoryTable();

        closeSaleModal();

        // Show success message
        const item = inventory.find(i => i.id === itemId);
        if (item) {
            alert(`Sale recorded! ${quantity} × ${item.name} = ${formatCurrency(result.sale.total_amount)}`);
        }
    } catch (error) {
        console.error('Error recording sale:', error);
        alert(error.message || 'Error recording sale. Please try again.');
    }
}

// Format time for sales list
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString(settings.language === 'de' ? 'de-DE' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

