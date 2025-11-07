/**
 * DOM Cache - Centralized DOM element and settings caching
 *
 * Caches both DOM elements and slider values for ultra-fast access.
 * Eliminates repeated querySelector calls and DOM property reads.
 *
 * Responsibilities:
 * - Cache all frequently accessed DOM elements
 * - Cache slider values in memory
 * - Setup event listeners for slider changes
 * - Provide getters with null safety
 *
 * Dependencies:
 * - config.js (for element IDs and selectors)
 * - financial-math.js (for getMonthlyCompoundRate)
 *
 * Example:
 * ```javascript
 * const cache = new DOMCache();
 * cache.initialize();
 *
 * // Get cached elements (no querySelector!)
 * const fillElement = cache.getPigOvalFill();
 * fillElement.style.height = '50%';
 *
 * // Get cached values (no DOM read!)
 * const savings = cache.getMonthlySavings();
 * ```
 */
class DOMCache {
    constructor() {
        // Settings cache (values)
        this.settings = new SettingsCache();

        // DOM elements cache
        this.elements = {};

        // Initialization flag
        this.initialized = false;
    }

    /**
     * Initialize both settings and elements cache
     * Call once during DOMContentLoaded
     */
    initialize() {
        if (this.initialized) return;

        // Initialize settings cache
        this.settings.initialize();

        // Cache all DOM elements
        this.cacheElements();

        this.initialized = true;
    }

    /**
     * Cache all frequently accessed DOM elements
     */
    cacheElements() {
        // Container elements
        this.elements.pigOvalContainer = document.querySelector(CONFIG.selectors.pigOvalContainer);
        this.elements.pigOvalFill = document.querySelector(CONFIG.selectors.pigOvalFill);
        this.elements.bankerMugContainer = document.querySelector(CONFIG.selectors.bankerMugContainer);
        this.elements.bankerMugFill = document.querySelector(CONFIG.selectors.bankerMugFill);

        // Display value elements
        this.elements.pigPercentageDisplay = document.getElementById(CONFIG.elementIds.pigPercentageDisplay);
        this.elements.totalSavingsValue = document.getElementById(CONFIG.elementIds.totalSavingsValue);
        this.elements.currentDateValue = document.getElementById(CONFIG.elementIds.currentDateValue);
        this.elements.ppValue = document.getElementById(CONFIG.elementIds.ppValue);
        this.elements.ppStartDate = document.getElementById(CONFIG.elementIds.ppStartDate);
        this.elements.totalBankValue = document.getElementById(CONFIG.elementIds.totalBankValue);

        // Slider value display elements
        this.elements.savingsValue = document.getElementById(CONFIG.elementIds.savingsValue);
        this.elements.startAmountValue = document.getElementById(CONFIG.elementIds.startAmountValue);
        this.elements.inflationValue = document.getElementById(CONFIG.elementIds.inflationValue);

        // Button elements
        this.elements.pauseButton = document.getElementById(CONFIG.elementIds.pauseButton);
        this.elements.restartButton = document.getElementById(CONFIG.elementIds.restartButton);
        this.elements.balanceStartAmount = document.getElementById(CONFIG.elementIds.balanceStartAmount);
        this.elements.balanceInflation = document.getElementById(CONFIG.elementIds.balanceInflation);
        this.elements.balanceSavings = document.getElementById(CONFIG.elementIds.balanceSavings);

        // Slider elements
        this.elements.savingsSlider = document.getElementById(CONFIG.elementIds.savingsSlider);
        this.elements.startAmountSlider = document.getElementById(CONFIG.elementIds.startAmountSlider);
        this.elements.inflationSlider = document.getElementById(CONFIG.elementIds.inflationSlider);

        // Info and display elements
        this.elements.infoText = document.querySelector(CONFIG.selectors.infoText);

        // Debug elements (may not exist)
        this.elements.debugFillValue = document.getElementById(CONFIG.elementIds.debugFillValue);
        this.elements.debugMugValue = document.getElementById(CONFIG.elementIds.debugMugValue);
        this.elements.debugBankDollars = document.getElementById(CONFIG.elementIds.debugBankDollars);
    }

    // ========================================================================
    // CONTAINER ELEMENTS
    // ========================================================================

    getPigOvalContainer() {
        return this.elements.pigOvalContainer;
    }

    getPigOvalFill() {
        return this.elements.pigOvalFill;
    }

    getBankerMugContainer() {
        return this.elements.bankerMugContainer;
    }

    getBankerMugFill() {
        return this.elements.bankerMugFill;
    }

    // ========================================================================
    // DISPLAY VALUE ELEMENTS
    // ========================================================================

    getPigPercentageDisplay() {
        return this.elements.pigPercentageDisplay;
    }

    getTotalSavingsValue() {
        return this.elements.totalSavingsValue;
    }

    getCurrentDateValue() {
        return this.elements.currentDateValue;
    }

    getPPValue() {
        return this.elements.ppValue;
    }

    getPPStartDate() {
        return this.elements.ppStartDate;
    }

    getTotalBankValue() {
        return this.elements.totalBankValue;
    }

    getSavingsValue() {
        return this.elements.savingsValue;
    }

    getStartAmountValue() {
        return this.elements.startAmountValue;
    }

    getInflationValue() {
        return this.elements.inflationValue;
    }

    // ========================================================================
    // BUTTON ELEMENTS
    // ========================================================================

    getPauseButton() {
        return this.elements.pauseButton;
    }

    getRestartButton() {
        return this.elements.restartButton;
    }

    getBalanceStartAmountButton() {
        return this.elements.balanceStartAmount;
    }

    getBalanceInflationButton() {
        return this.elements.balanceInflation;
    }

    getBalanceSavingsButton() {
        return this.elements.balanceSavings;
    }

    // ========================================================================
    // SLIDER ELEMENTS
    // ========================================================================

    getSavingsSlider() {
        return this.elements.savingsSlider;
    }

    getStartAmountSlider() {
        return this.elements.startAmountSlider;
    }

    getInflationSlider() {
        return this.elements.inflationSlider;
    }

    // ========================================================================
    // INFO ELEMENTS
    // ========================================================================

    getInfoText() {
        return this.elements.infoText;
    }

    // ========================================================================
    // DEBUG ELEMENTS
    // ========================================================================

    getDebugFillValue() {
        return this.elements.debugFillValue;
    }

    getDebugMugValue() {
        return this.elements.debugMugValue;
    }

    getDebugBankDollars() {
        return this.elements.debugBankDollars;
    }

    // ========================================================================
    // SETTINGS DELEGATION (delegate to SettingsCache)
    // ========================================================================

    getMonthlySavings() {
        return this.settings.getMonthlySavings();
    }

    getStartingAmount() {
        return this.settings.getStartingAmount();
    }

    getAnnualInflation() {
        return this.settings.getAnnualInflation();
    }

    getMonthlyInflationRate() {
        return this.settings.getMonthlyInflationRate();
    }
}

/**
 * SettingsCache - Caches slider values in memory
 *
 * Provides ultra-fast access to slider values without reading DOM.
 * Values are updated via event listeners.
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

// Create singleton instances
const domCache = new DOMCache();
const settingsCache = domCache.settings; // For backwards compatibility

// Expose globally for use by other modules
window.domCache = domCache;
window.settingsCache = settingsCache; // Backwards compatibility

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DOMCache, SettingsCache, domCache, settingsCache };
}
