/**
 * DateDisplayHandler - Simulation Date Display Management
 * 
 * Responsibilities:
 * - Update current simulation date display (YYYY Month)
 * - Format dates for display
 * 
 * Dependencies:
 * - config.js (CONFIG constants)
 * - state-manager.js (state values)
 * 
 * Example:
 * ```javascript
 * const dateHandler = new DateDisplayHandler(CONFIG, stateManager);
 * dateHandler.initialize();
 * ```
 */
class DateDisplayHandler {
    /**
     * Create a new DateDisplayHandler
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - State manager instance
     */
    constructor(config, stateManager) {
        this.config = config;
        this.state = stateManager;
        
        // Cache DOM elements
        this.elements = {
            currentDateValue: null
        };
    }
    
    /**
     * Initialize the date display handler
     * Caches DOM elements and sets up initial display
     */
    initialize() {
        // Cache DOM elements
        this.cacheElements();
        
        // Update display to match current state
        this.updateDateDisplay();
    }
    
    /**
     * Cache all DOM elements used by this handler
     */
    cacheElements() {
        this.elements.currentDateValue = document.getElementById(this.config.elementIds.currentDateValue);
    }
    
    /**
     * Update the simulation date display
     * Format: YYYY Month (e.g., "2025 October")
     */
    updateDateDisplay() {
        if (!this.elements.currentDateValue) return;
        
        const formattedDate = this.state.getFormattedDate();
        this.elements.currentDateValue.textContent = formattedDate;
    }
    
    /**
     * Get current simulation date
     * @returns {Date} Current simulation date
     */
    getCurrentDate() {
        return this.state.get('currentSimDate');
    }
    
    /**
     * Get formatted current date string
     * @returns {string} Formatted date (e.g., "2025 October")
     */
    getFormattedDate() {
        return this.state.getFormattedDate();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DateDisplayHandler = DateDisplayHandler;
}

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DateDisplayHandler };
}
