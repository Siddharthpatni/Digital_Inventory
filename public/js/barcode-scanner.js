// ===== Barcode Scanner Module =====
// Camera-based barcode scanning for quick product entry

class BarcodeScanner {
    constructor() {
        this.isScanning = false;
        this.stream = null;
    }

    async startScanning() {
        const modal = document.getElementById('barcodeScannerModal');
        const video = document.getElementById('barcodeVideo');
        const result = document.getElementById('barcodeResult');

        modal.classList.add('active');
        result.textContent = 'Initializing camera...';

        try {
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera on mobile
            });

            video.srcObject = this.stream;
            video.play();

            result.textContent = 'Position barcode in view...';
            this.isScanning = true;

            // Initialize Quagga
            await this.initQuagga();
        } catch (error) {
            console.error('Camera access error:', error);
            result.textContent = 'Camera access denied. Please use manual entry.';
            alert('Camera access is required for barcode scanning. Please grant permission or use manual entry.');
        }
    }

    async initQuagga() {
        const video = document.getElementById('barcodeVideo');

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: video,
                constraints: {
                    facingMode: "environment"
                }
            },
            decoder: {
                readers: [
                    "ean_reader",
                    "ean_8_reader",
                    "code_128_reader",
                    "code_39_reader",
                    "upc_reader"
                ]
            }
        }, (err) => {
            if (err) {
                console.error('Quagga init error:', err);
                document.getElementById('barcodeResult').textContent = 'Scanner initialization failed';
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected(this.onBarcodeDetected.bind(this));
    }

    onBarcodeDetected(result) {
        const code = result.codeResult.code;
        const resultDiv = document.getElementById('barcodeResult');

        resultDiv.textContent = `Barcode detected: ${code}`;

        // Stop scanning
        this.stopScanning();

        // Look up product or open add form
        this.handleBarcodeResult(code);
    }

    async handleBarcodeResult(barcode) {
        // Check if product exists in inventory
        try {
            const response = await fetch(`/api/inventory?search=${barcode}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            const items = data.items || data;

            const existingItem = items.find(item =>
                item.barcode === barcode || item.sku === barcode
            );

            if (existingItem) {
                // Product exists, ask to update quantity
                const add = confirm(`${existingItem.name} found!\n\nCurrent quantity: ${existingItem.quantity}\n\nAdd more stock?`);
                if (add) {
                    const quantity = prompt('How many units to add?', '1');
                    if (quantity) {
                        await this.updateStock(existingItem.id, parseInt(quantity));
                    }
                }
            } else {
                // New product, open add form with barcode
                this.openAddFormWithBarcode(barcode);
            }
        } catch (error) {
            console.error('Error looking up barcode:', error);
            this.openAddFormWithBarcode(barcode);
        }

        this.closeScannerModal();
    }

    openAddFormWithBarcode(barcode) {
        // Close scanner modal
        this.closeScannerModal();

        // Open add item modal with barcode pre-filled
        openModal();

        // Try to fetch product info from external API (optional)
        this.fetchProductInfo(barcode);
    }

    async fetchProductInfo(barcode) {
        // This is a placeholder for external product database lookup
        // You can integrate with APIs like Open Food Facts, UPC Database, etc.

        // For now, just set the barcode
        setTimeout(() => {
            const barcodeInput = document.getElementById('itemBarcode');
            if (barcodeInput) {
                barcodeInput.value = barcode;
            }
        }, 100);
    }

    async updateStock(itemId, quantityToAdd) {
        try {
            const response = await fetch(`/api/inventory/${itemId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const item = await response.json();

            await fetch(`/api/inventory/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...item,
                    quantity: item.quantity + quantityToAdd
                })
            });

            alert(`Stock updated! New quantity: ${item.quantity + quantityToAdd}`);
            location.reload();
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Error updating stock');
        }
    }

    stopScanning() {
        this.isScanning = false;

        if (Quagga) {
            Quagga.stop();
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    closeScannerModal() {
        this.stopScanning();
        const modal = document.getElementById('barcodeScannerModal');
        modal.classList.remove('active');
    }

    manualEntry() {
        const barcode = prompt('Enter barcode manually:');
        if (barcode) {
            this.handleBarcodeResult(barcode);
        }
    }
}

// Initialize barcode scanner
const barcodeScanner = new BarcodeScanner();

// UI Functions
function openBarcodeScanner() {
    barcodeScanner.startScanning();
}

function closeBarcodeScanner() {
    barcodeScanner.closeScannerModal();
}

function manualBarcodeEntry() {
    barcodeScanner.manualEntry();
}
