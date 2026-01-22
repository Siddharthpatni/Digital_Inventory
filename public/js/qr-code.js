// ===== QR Code Management Module =====
// Frontend QR code generation, display, and download functionality

class QRCodeManager {
    constructor() {
        this.currentItemId = null;
        this.currentQRCode = null;
        this.modal = document.getElementById('qrModal');
    }

    /**
     * Generate and display QR code for an inventory item
     * @param {number} itemId - Inventory item ID
     */
    async showQRCode(itemId) {
        try {
            this.currentItemId = itemId;
            const modal = document.getElementById('qrModal');
            const container = document.getElementById('qrCodeContainer');

            // Show modal and loading state
            modal.classList.add('active');
            container.innerHTML = '<div class="qr-loading"><div class="qr-loading-spinner"></div>Generating QR code...</div>';

            // Fetch QR code from API
            const response = await fetch(`/api/inventory/${itemId}/qr?format=dataUrl`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate QR code');
            }

            const data = await response.json();
            this.currentQRCode = data;

            // Display QR code
            this.displayQRCode(data);
        } catch (error) {
            console.error('Error showing QR code:', error);
            this.showToast('Failed to generate QR code', 'error');
            this.closeModal();
        }
    }

    /**
     * Display QR code in modal
     * @param {Object} qrData - QR code data from API
     */
    displayQRCode(qrData) {
        const container = document.getElementById('qrCodeContainer');
        const nameEl = document.getElementById('qrItemName');
        const skuEl = document.getElementById('qrItemSKU');

        // Display QR code image
        container.innerHTML = `<img src="${qrData.dataUrl}" alt="QR Code" class="qr-code-image" />`;

        // Update item info
        nameEl.textContent = qrData.itemName || 'Item';
        skuEl.textContent = qrData.sku ? `SKU: ${qrData.sku}` : 'No SKU';
    }

    /**
     * Download QR code in specified format
     * @param {string} format - 'png' or 'svg'
     */
    async downloadQRCode(format = 'png') {
        if (!this.currentItemId) {
            this.showToast('No QR code to download', 'error');
            return;
        }

        try {
            showLoading();

            // Fetch file from download endpoint
            const response = await fetch(`/api/inventory/${this.currentItemId}/qr/download?format=${format}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download QR code');
            }

            // Get filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `qr-code-${this.currentItemId}.${format}`;

            if (contentDisposition) {
                const matches = /filename="([^"]+)"/.exec(contentDisposition);
                if (matches && matches[1]) {
                    filename = matches[1];
                }
            }

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            hideLoading();
            this.showToast(`QR code downloaded as ${format.toUpperCase()}`, 'success');
        } catch (error) {
            console.error('Error downloading QR code:', error);
            hideLoading();
            this.showToast('Failed to download QR code', 'error');
        }
    }

    /**
     * Print QR code
     */
    printQRCode() {
        if (!this.currentQRCode) {
            this.showToast('No QR code to print', 'error');
            return;
        }

        window.print();
    }

    /**
     * Close QR code modal
     */
    closeModal() {
        const modal = document.getElementById('qrModal');
        modal.classList.remove('active');
        this.currentItemId = null;
        this.currentQRCode = null;
    }

    /**
     * Generate QR codes for multiple items (batch)
     * @param {Array} itemIds - Array of item IDs
     */
    async generateBatchQRCodes(itemIds, format = 'png') {
        if (!itemIds || itemIds.length === 0) {
            this.showToast('No items selected', 'error');
            return;
        }

        try {
            showLoading();

            const response = await fetch('/api/inventory/qr/batch', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ item_ids: itemIds, format })
            });

            if (!response.ok) {
                throw new Error('Failed to generate batch QR codes');
            }

            const data = await response.json();

            hideLoading();

            if (data.success) {
                this.showToast(`Generated ${data.successful} QR codes successfully`, 'success');
                if (data.failed > 0) {
                    this.showToast(`Failed to generate ${data.failed} QR codes`, 'error');
                }
            } else {
                this.showToast('Batch QR code generation failed', 'error');
            }

            return data;
        } catch (error) {
            console.error('Error generating batch QR codes:', error);
            hideLoading();
            this.showToast('Failed to generate batch QR codes', 'error');
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - 'success', 'error', or 'info'
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `qr-toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize QR code manager
const qrManager = new QRCodeManager();

// Global functions for use in HTML
function showQRCode(itemId) {
    qrManager.showQRCode(itemId);
}

function closeQRModal() {
    qrManager.closeModal();
}

function downloadQRCode(format) {
    qrManager.downloadQRCode(format);
}

function printQRCode() {
    qrManager.printQRCode();
}

function generateBatchQRCodes(itemIds, format) {
    return qrManager.generateBatchQRCodes(itemIds, format);
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('qrModal');
    if (e.target === modal) {
        closeQRModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('qrModal');
        if (modal && modal.classList.contains('active')) {
            closeQRModal();
        }
    }
});
