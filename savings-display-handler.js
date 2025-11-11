/**
 * SavingsDisplayHandler - Savings Panel Display Management
 * 
 * Responsibilities:
 * - Update total savings display ($XX,XXX)
 * - Update purchasing power lost percentage (XX%)
 * - Update purchasing power value display ($(YYYY-MM)XXXXX)
 * - Update debug displays for bank dollars
 * 
 * Dependencies:
 * - config.js (CONFIG constants)
 * - state-manager.js (state values)
 * 
 * Example:
 * ```javascript
 * const savingsHandler = new SavingsDisplayHandler(CONFIG, stateManager);
 * savingsHandler.initialize();
 * ```
 */
class SavingsDisplayHandler {
    /**
     * Create a new SavingsDisplayHandler
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - State manager instance
     */
    constructor(config, stateManager) {
        this.config = config;
        this.state = stateManager;
        
        // Cache DOM elements
        this.elements = {
            totalSavingsValue: null,
            totalBankValue: null,
            ppValue: null,
            ppStartDate: null,
            debugBankDollars: null
        };
    }
    
    /**
     * Initialize the savings display handler
     * Caches DOM elements and sets up initial display
     */
    initialize() {
        // Cache DOM elements
        this.cacheElements();
        
        // Update displays to match current state
        this.updateSavingsDisplay();
        this.updatePPDisplay();
    }
    
    /**
     * Cache all DOM elements used by this handler
     */
    cacheElements() {
        this.elements.totalSavingsValue = document.getElementById(this.config.elementIds.totalSavingsValue);
        this.elements.totalBankValue = document.getElementById(this.config.elementIds.totalBankValue);
        
        // PP display - look for both possible element IDs
        this.elements.ppValue = document.getElementById(this.config.elementIds.ppValue);
        this.elements.ppStartDate = document.getElementById(this.config.elementIds.ppStartDate);
        
        // Debug
        this.elements.debugBankDollars = document.getElementById(this.config.elementIds.debugBankDollars);
    }
    
    /**
     * Update the savings amount and purchasing power lost percentage
     */
    updateSavingsDisplay() {
        const totalSavings = this.state.get('totalSavings');
        const totalBankSavings = this.state.get('totalBankSavings');
        const savingsVehicle = this.state.get('savingsVehicle');

        // Update total savings display (format depends on vehicle)
        if (this.elements.totalSavingsValue) {
            if (savingsVehicle === 'btc') {
                const totalBtc = this.state.getTotalSavingsBtc();
                this.elements.totalSavingsValue.textContent = this.formatBtcAmount(totalBtc);
            } else {
                // Floor to whole number (no decimals)
                const totalSavingsFloored = Math.floor(totalSavings);
                this.elements.totalSavingsValue.textContent = '$' + totalSavingsFloored.toLocaleString();
            }
        }

        // Update purchasing power gained/lost with dynamic label
        if (this.elements.totalBankValue) {
            const ppInfo = this.state.getPPGainedOrLostInfo();

            // Update percentage value
            this.elements.totalBankValue.textContent = ppInfo.percentage + '%';

            // Update label text (PP Lost vs PP Gained)
            const parentLabel = this.elements.totalBankValue.parentElement;
            if (parentLabel && parentLabel.firstChild?.nodeType === Node.TEXT_NODE) {
                parentLabel.firstChild.textContent = ppInfo.label + ': ';
            }
        }

        // Update debug display with bank dollar amount
        if (this.elements.debugBankDollars) {
            this.elements.debugBankDollars.textContent = '$' + totalBankSavings.toLocaleString();
        }
    }

    /**
     * Format BTC amount for display
     * @param {number} btcAmount - Amount in BTC
     * @returns {string} Formatted BTC string (e.g., "₿0.81232")
     */
    formatBtcAmount(btcAmount) {
        // Format with 5 decimal places for readability
        return '₿' + btcAmount.toFixed(5);
    }
    
    /**
     * Update the purchasing power (PP) value display
     * Format: $(YYYY-MM)XXXXX where YYYY-MM is the simulation start date
     */
    updatePPDisplay() {
        // Get PP value in dollars (based on current fill level)
        const ppValue = this.state.getPPValue();
        
        // Get formatted start date for PP reference (YYYY-MM format)
        const startDate = this.state.getFormattedStartDate();
        
        // Check if we have the combined element (ppValueFormatted) or separate elements
        const combinedElement = document.getElementById('ppValueFormatted');
        
        if (combinedElement) {
            // New format: Combined display with date prefix
            combinedElement.textContent = `$(${startDate})${ppValue.toLocaleString()}`;
        } else {
            // Old format: Separate ppStartDate and ppValue elements
            if (this.elements.ppStartDate) {
                this.elements.ppStartDate.textContent = startDate;
            }
            
            if (this.elements.ppValue) {
                this.elements.ppValue.textContent = '$' + ppValue.toLocaleString();
            }
        }
    }
    
    /**
     * Get current total savings
     * @returns {number} Total savings in dollars
     */
    getTotalSavings() {
        return this.state.get('totalSavings');
    }
    
    /**
     * Get current total bank savings (losses)
     * @returns {number} Total inflation losses in dollars
     */
    getTotalBankSavings() {
        return this.state.get('totalBankSavings');
    }
    
    /**
     * Get current purchasing power lost percentage
     * @returns {number} Percentage (0-100)
     */
    getPPLostPercentage() {
        return this.state.getPurchasingPowerLostPercentage();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SavingsDisplayHandler = SavingsDisplayHandler;
}

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SavingsDisplayHandler };
}
