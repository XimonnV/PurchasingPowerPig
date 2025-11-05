/**
 * DOM Cache and Settings Management
 * 
 * Caches slider VALUES (not just DOM elements) and updates them via event listeners.
 * This provides ultra-fast memory access instead of repeatedly reading DOM properties.
 * 
 * Integrated with CONFIG from config.js
 */

class SettingsCache {
    constructor() {
        // Cache VALUES directly in memory
        this.monthlySavings = CONFIG.sliders.savings.default;
        this.startAmount = CONFIG.sliders.startAmount.default;
        this.annualInflation = CONFIG.sliders.inflation.default / 100; // Store as decimal
        
        // Flag to track initialization
        this.initialized = false;
    }
    
    /**
     * Initialize cached values from DOM and setup event listeners
     * Called once during DOMContentLoaded
     */
    initialize() {
        if (this.initialized) return;
        
        // Get initial values from DOM
        this.initializeValues();
        
        // Setup event listeners to keep cache updated
        this.setupListeners();
        
        this.initialized = true;
    }
    
    /**
     * Read initial values from sliders
     */
    initializeValues() {
        const savingsSlider = document.getElementById(CONFIG.elementIds.savingsSlider);
        const startAmountSlider = document.getElementById(CONFIG.elementIds.startAmountSlider);
        const inflationSlider = document.getElementById(CONFIG.elementIds.inflationSlider);
        
        if (savingsSlider) {
            this.monthlySavings = parseInt(savingsSlider.value);
        }
        
        if (startAmountSlider) {
            this.startAmount = parseInt(startAmountSlider.value);
        }
        
        if (inflationSlider) {
            this.annualInflation = parseFloat(inflationSlider.value) / 100;
        }
    }
    
    /**
     * Setup event listeners to update cached values when sliders change
     */
    setupListeners() {
        // Savings slider
        const savingsSlider = document.getElementById(CONFIG.elementIds.savingsSlider);
        if (savingsSlider) {
            savingsSlider.addEventListener('input', (e) => {
                this.monthlySavings = parseInt(e.target.value);
            });
        }
        
        // Starting amount slider
        const startAmountSlider = document.getElementById(CONFIG.elementIds.startAmountSlider);
        if (startAmountSlider) {
            startAmountSlider.addEventListener('input', (e) => {
                this.startAmount = parseInt(e.target.value);
            });
        }
        
        // Inflation slider
        const inflationSlider = document.getElementById(CONFIG.elementIds.inflationSlider);
        if (inflationSlider) {
            inflationSlider.addEventListener('input', (e) => {
                this.annualInflation = parseFloat(e.target.value) / 100;
            });
        }
    }
    
    /**
     * Get monthly savings value (from memory - ultra fast)
     * @returns {number} Monthly savings amount
     */
    getMonthlySavings() {
        return this.monthlySavings;
    }
    
    /**
     * Get starting amount value (from memory - ultra fast)
     * @returns {number} Starting amount
     */
    getStartingAmount() {
        return this.startAmount;
    }
    
    /**
     * Get annual inflation rate (from memory - ultra fast)
     * @returns {number} Annual inflation as decimal (e.g., 0.07 for 7%)
     */
    getAnnualInflation() {
        return this.annualInflation;
    }
    
    /**
     * Get monthly inflation rate using compound interest formula
     * Uses shared function from financial-math.js
     * @returns {number} Monthly inflation rate as decimal
     */
    getMonthlyInflationRate() {
        return getMonthlyCompoundRate(this.annualInflation);
    }
}

// Create singleton instance
const settingsCache = new SettingsCache();

// Expose globally for use by other modules
window.settingsCache = settingsCache;

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettingsCache, settingsCache };
}
