/**
 * QR Code Generator Utility
 * Production-ready QR code generation with multiple format support
 */

const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

class QRCodeGenerator {
    constructor(options = {}) {
        this.outputDir = options.outputDir || path.join(__dirname, '../../public/qr-codes');
        this.baseUrl = options.baseUrl || process.env.BASE_URL || 'http://localhost:3000';

        // Default QR code options
        this.defaultOptions = {
            errorCorrectionLevel: 'H',
            type: 'png',
            quality: 0.95,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300
        };
    }

    /**
     * Ensure output directory exists
     */
    async ensureOutputDir() {
        try {
            await fs.access(this.outputDir);
        } catch {
            await fs.mkdir(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generate product QR code data
     */
    generateProductData(item) {
        return {
            id: item.id,
            name: item.name,
            sku: item.sku || null,
            barcode: item.barcode || null,
            price: item.price,
            category: item.category_name || item.category,
            url: `${this.baseUrl}/?item=${item.id}`,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate QR code as PNG file
     * @param {Object} item - Inventory item
     * @param {Object} options - QR code options
     * @returns {Promise<Object>} - { fileName, filePath, url }
     */
    async generatePNG(item, options = {}) {
        try {
            await this.ensureOutputDir();

            const productData = this.generateProductData(item);
            const fileName = `qr-${item.id}-${item.sku || 'item'}.png`;
            const filePath = path.join(this.outputDir, fileName);

            const qrOptions = { ...this.defaultOptions, ...options };

            await QRCode.toFile(filePath, JSON.stringify(productData), qrOptions);

            return {
                success: true,
                fileName,
                filePath,
                url: `/qr-codes/${fileName}`,
                format: 'png'
            };
        } catch (error) {
            console.error('Error generating PNG QR code:', error);
            throw new Error(`Failed to generate QR code: ${error.message}`);
        }
    }

    /**
     * Generate QR code as SVG
     * @param {Object} item - Inventory item
     * @param {Object} options - QR code options
     * @returns {Promise<Object>} - { svg, fileName, filePath, url }
     */
    async generateSVG(item, options = {}) {
        try {
            await this.ensureOutputDir();

            const productData = this.generateProductData(item);
            const fileName = `qr-${item.id}-${item.sku || 'item'}.svg`;
            const filePath = path.join(this.outputDir, fileName);

            const qrOptions = {
                ...this.defaultOptions,
                ...options,
                type: 'svg'
            };

            const svg = await QRCode.toString(JSON.stringify(productData), qrOptions);
            await fs.writeFile(filePath, svg, 'utf8');

            return {
                success: true,
                svg,
                fileName,
                filePath,
                url: `/qr-codes/${fileName}`,
                format: 'svg'
            };
        } catch (error) {
            console.error('Error generating SVG QR code:', error);
            throw new Error(`Failed to generate QR code: ${error.message}`);
        }
    }

    /**
     * Generate QR code as data URL (base64)
     * @param {Object} item - Inventory item
     * @param {Object} options - QR code options
     * @returns {Promise<Object>} - { dataUrl, format }
     */
    async generateDataURL(item, options = {}) {
        try {
            const productData = this.generateProductData(item);
            const qrOptions = { ...this.defaultOptions, ...options };

            const dataUrl = await QRCode.toDataURL(JSON.stringify(productData), qrOptions);

            return {
                success: true,
                dataUrl,
                format: 'dataUrl'
            };
        } catch (error) {
            console.error('Error generating data URL QR code:', error);
            throw new Error(`Failed to generate QR code: ${error.message}`);
        }
    }

    /**
     * Generate QR code in specified format
     * @param {Object} item - Inventory item
     * @param {String} format - 'png', 'svg', or 'dataUrl'
     * @param {Object} options - QR code options
     * @returns {Promise<Object>}
     */
    async generate(item, format = 'png', options = {}) {
        if (!item || !item.id) {
            throw new Error('Invalid item: id is required');
        }

        switch (format.toLowerCase()) {
            case 'png':
                return await this.generatePNG(item, options);
            case 'svg':
                return await this.generateSVG(item, options);
            case 'dataurl':
            case 'data-url':
                return await this.generateDataURL(item, options);
            default:
                throw new Error(`Unsupported format: ${format}. Use 'png', 'svg', or 'dataUrl'`);
        }
    }

    /**
     * Generate QR codes for multiple items (batch)
     * @param {Array} items - Array of inventory items
     * @param {String} format - QR code format
     * @param {Object} options - QR code options
     * @returns {Promise<Array>} - Array of results
     */
    async generateBatch(items, format = 'png', options = {}) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Invalid items: array of items is required');
        }

        const results = [];
        const errors = [];

        for (const item of items) {
            try {
                const result = await this.generate(item, format, options);
                results.push({ itemId: item.id, ...result });
            } catch (error) {
                errors.push({
                    itemId: item.id,
                    error: error.message
                });
            }
        }

        return {
            success: errors.length === 0,
            total: items.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors
        };
    }

    /**
     * Delete QR code file
     * @param {String} fileName - QR code file name
     */
    async delete(fileName) {
        try {
            const filePath = path.join(this.outputDir, fileName);
            await fs.unlink(filePath);
            return { success: true, message: 'QR code deleted' };
        } catch (error) {
            if (error.code === 'ENOENT') {
                return { success: false, message: 'QR code not found' };
            }
            throw new Error(`Failed to delete QR code: ${error.message}`);
        }
    }

    /**
     * Check if QR code exists
     * @param {String} fileName - QR code file name
     */
    async exists(fileName) {
        try {
            const filePath = path.join(this.outputDir, fileName);
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

// Export singleton instance
const qrGenerator = new QRCodeGenerator();

module.exports = qrGenerator;
module.exports.QRCodeGenerator = QRCodeGenerator;
