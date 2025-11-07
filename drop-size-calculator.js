/**
 * DropSizeCalculator - Utility for calculating drop sizes
 *
 * Pure utility functions for calculating drop sizes based on dollar amounts.
 * Extracted from app.js to follow DRY principles and enable reuse/testing.
 *
 * Responsibilities:
 * - Calculate base drop size from dollar amount
 * - Apply scale factor to drop size
 * - Provide consistent sizing across the application
 *
 * Dependencies:
 * - config.js (for drop configuration constants)
 *
 * Example:
 * ```javascript
 * const calculator = new DropSizeCalculator(CONFIG);
 * const size = calculator.calculateDropSize(100, 1.0); // 100 dollars, 1x scale
 * ```
 */
class DropSizeCalculator {
    /**
     * Create drop size calculator
     * @param {Object} config - CONFIG object
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * Calculate drop size based on dollar amount
     * @param {number} amount - Dollar amount
     * @param {number} scaleFactor - Viewport scale factor (default 1.0)
     * @returns {number} Drop size in pixels (scaled)
     */
    calculateDropSize(amount, scaleFactor = 1.0) {
        const baseSize = this.calculateBaseSize(amount);
        return baseSize * scaleFactor;
    }

    /**
     * Calculate base drop size (before scale factor)
     * @param {number} amount - Dollar amount
     * @returns {number} Base drop size in pixels
     */
    calculateBaseSize(amount) {
        if (amount <= this.config.drop.smallAmountThreshold) {
            // Small amounts: $0-$100 (linear scale)
            return this.config.drop.smallAmountBase +
                   amount * this.config.drop.smallAmountScale;
        } else {
            // Large amounts: $100+ (different scale)
            return this.config.drop.largeAmountBase +
                   (amount - this.config.drop.largeAmountOffset) *
                   this.config.drop.largeAmountScale;
        }
    }

    /**
     * Calculate minimum drop size (for $0)
     * @returns {number} Minimum drop size in pixels
     */
    getMinDropSize() {
        return this.config.drop.invisibleDropSize;
    }

    /**
     * Calculate maximum drop size (for max savings amount)
     * @returns {number} Maximum drop size in pixels
     */
    getMaxDropSize() {
        const maxSavings = this.config.sliders.savings.max;
        return this.calculateBaseSize(maxSavings);
    }

    /**
     * Get drop size range
     * @returns {{min: number, max: number}} Size range
     */
    getSizeRange() {
        return {
            min: this.getMinDropSize(),
            max: this.getMaxDropSize()
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DropSizeCalculator = DropSizeCalculator;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DropSizeCalculator };
}
