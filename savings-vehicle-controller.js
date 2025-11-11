/**
 * SavingsVehicleController - Savings Vehicle Toggle Management
 *
 * Manages the savings vehicle toggle (USD $ vs BTC ₿) and persists user preference in cookies.
 * This determines which asset the user's savings are held in (dollars or bitcoin).
 *
 * Responsibilities:
 * - Initialize toggle from cookie (or use default)
 * - Handle toggle change events
 * - Save preference to cookie and state manager
 * - Provide current savings vehicle value
 *
 * Dependencies:
 * - config.js (CONFIG.savingsVehicle)
 * - cookie-settings.js (getCookieSetting, setCookieSetting)
 * - state-manager.js (stateManager to update savingsVehicle state)
 *
 * Example:
 * ```javascript
 * const controller = new SavingsVehicleController(CONFIG, stateManager);
 * controller.initialize();
 * console.log(controller.getCurrentVehicle()); // "usd" or "btc"
 * ```
 */
class SavingsVehicleController {
    /**
     * Create a new SavingsVehicleController
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - State manager instance
     */
    constructor(config, stateManager) {
        this.config = config;
        this.stateManager = stateManager;

        // Current savings vehicle ("usd" or "btc")
        this.currentVehicle = null;

        // DOM elements
        this.elements = {
            usdRadio: null,
            btcRadio: null,
            toggleContainer: null
        };
    }

    /**
     * Initialize the controller
     * Reads saved preference from cookie and sets up event listeners
     */
    initialize() {
        // Cache DOM elements
        this.cacheElements();

        // Load saved preference from cookie (or use default)
        this.loadFromCookie();

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements.usdRadio = document.getElementById(this.config.elementIds.savingsVehicleUsd);
        this.elements.btcRadio = document.getElementById(this.config.elementIds.savingsVehicleBtc);
        this.elements.toggleContainer = document.getElementById('savingsVehicleToggle');
    }

    /**
     * Load savings vehicle preference from cookie
     * Falls back to default if no cookie exists
     */
    loadFromCookie() {
        // Get saved preference from cookie
        const savedVehicle = getCookieSetting('savingsVehicle', this.config.savingsVehicle.default);

        // Validate saved value (ensure it's either "usd" or "btc")
        const isValid = savedVehicle === this.config.savingsVehicle.options.USD ||
                       savedVehicle === this.config.savingsVehicle.options.BTC;

        // Use saved value if valid, otherwise use default
        this.currentVehicle = isValid ? savedVehicle : this.config.savingsVehicle.default;

        // Update state manager to match loaded preference
        if (this.stateManager) {
            this.stateManager.setSavingsVehicle(this.currentVehicle);
        }

        // Update UI to match loaded preference
        this.updateUI();
    }

    /**
     * Setup event listeners for toggle changes
     */
    setupEventListeners() {
        if (this.elements.usdRadio) {
            this.elements.usdRadio.addEventListener('change', () => {
                if (this.elements.usdRadio.checked) {
                    this.handleVehicleChange(this.config.savingsVehicle.options.USD);
                }
            });
        }

        if (this.elements.btcRadio) {
            this.elements.btcRadio.addEventListener('change', () => {
                if (this.elements.btcRadio.checked) {
                    this.handleVehicleChange(this.config.savingsVehicle.options.BTC);
                }
            });
        }
    }

    /**
     * Handle savings vehicle change
     * @param {string} newVehicle - New vehicle value ("usd" or "btc")
     */
    handleVehicleChange(newVehicle) {
        // Update current vehicle
        this.currentVehicle = newVehicle;

        // Update state manager (this triggers display updates via subscriptions)
        if (this.stateManager) {
            this.stateManager.setSavingsVehicle(newVehicle);
        }

        // Update toggle background color
        this.updateToggleBackgroundColor();

        // Save to cookie
        this.saveToCookie();

        console.log('Savings vehicle changed to:', newVehicle);
    }

    /**
     * Update UI to match current vehicle
     */
    updateUI() {
        if (this.currentVehicle === this.config.savingsVehicle.options.USD) {
            if (this.elements.usdRadio) {
                this.elements.usdRadio.checked = true;
            }
        } else if (this.currentVehicle === this.config.savingsVehicle.options.BTC) {
            if (this.elements.btcRadio) {
                this.elements.btcRadio.checked = true;
            }
        }

        // Update toggle background color
        this.updateToggleBackgroundColor();
    }

    /**
     * Update toggle background color based on current vehicle
     * USD mode: green (#4CAF50)
     * BTC mode: orange (#F7931A)
     */
    updateToggleBackgroundColor() {
        if (!this.elements.toggleContainer) return;

        if (this.currentVehicle === this.config.savingsVehicle.options.BTC) {
            // BTC mode: add orange class
            this.elements.toggleContainer.classList.add('btc-mode');
        } else {
            // USD mode: remove orange class (reverts to green)
            this.elements.toggleContainer.classList.remove('btc-mode');
        }
    }

    /**
     * Save current vehicle to cookie
     */
    saveToCookie() {
        setCookieSetting('savingsVehicle', this.currentVehicle);
    }

    /**
     * Get current savings vehicle
     * @returns {string} Current vehicle ("usd" or "btc")
     */
    getCurrentVehicle() {
        return this.currentVehicle;
    }

    /**
     * Check if current vehicle is USD
     * @returns {boolean} True if USD
     */
    isUSD() {
        return this.currentVehicle === this.config.savingsVehicle.options.USD;
    }

    /**
     * Check if current vehicle is BTC
     * @returns {boolean} True if BTC
     */
    isBTC() {
        return this.currentVehicle === this.config.savingsVehicle.options.BTC;
    }

    /**
     * Set savings vehicle programmatically
     * @param {string} vehicle - Vehicle to set ("usd" or "btc")
     */
    setVehicle(vehicle) {
        // Validate input
        const isValid = vehicle === this.config.savingsVehicle.options.USD ||
                       vehicle === this.config.savingsVehicle.options.BTC;

        if (!isValid) {
            console.warn('Invalid savings vehicle:', vehicle);
            return;
        }

        // Update current vehicle
        this.currentVehicle = vehicle;

        // Update UI
        this.updateUI();

        // Save to cookie
        this.saveToCookie();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SavingsVehicleController = SavingsVehicleController;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SavingsVehicleController };
}
