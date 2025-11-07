/**
 * LiquidDisplayHandler - Liquid Fill Level Display Management
 * 
 * Responsibilities:
 * - Update pig oval fill visual (height)
 * - Update pig percentage display (centered on pig)
 * - Update banker's mug fill visual (height)
 * - Update debug displays for fill levels
 * 
 * Dependencies:
 * - config.js (CONFIG constants)
 * - state-manager.js (state values)
 * 
 * Example:
 * ```javascript
 * const liquidHandler = new LiquidDisplayHandler(CONFIG, stateManager);
 * liquidHandler.initialize();
 * ```
 */
class LiquidDisplayHandler {
    /**
     * Create a new LiquidDisplayHandler
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - State manager instance
     */
    constructor(config, stateManager) {
        this.config = config;
        this.state = stateManager;
        
        // Cache DOM elements
        this.elements = {
            // Pig display elements
            pigOvalFill: null,
            pigPercentageDisplay: null,
            debugFillValue: null,
            
            // Mug display elements
            bankerMugFill: null,
            debugMugValue: null
        };
    }
    
    /**
     * Initialize the liquid display handler
     * Caches DOM elements and sets up initial display
     */
    initialize() {
        // Cache DOM elements
        this.cacheElements();
        
        // Update displays to match current state
        this.updatePigDisplay();
        this.updateMugDisplay();
    }
    
    /**
     * Cache all DOM elements used by this handler
     */
    cacheElements() {
        // Pig elements
        this.elements.pigOvalFill = document.querySelector(this.config.selectors.pigOvalFill);
        this.elements.pigPercentageDisplay = document.getElementById(this.config.elementIds.pigPercentageDisplay);
        this.elements.debugFillValue = document.getElementById(this.config.elementIds.debugFillValue);
        
        // Mug elements
        this.elements.bankerMugFill = document.querySelector(this.config.selectors.bankerMugFill);
        this.elements.debugMugValue = document.getElementById(this.config.elementIds.debugMugValue);
    }
    
    /**
     * Update the visual fill level of the pig
     * Updates both the oval fill height and the percentage text overlay
     */
    updatePigDisplay() {
        const fillLevel = this.state.get('fillLevel');
        
        // Update oval fill height
        if (this.elements.pigOvalFill) {
            this.elements.pigOvalFill.style.height = fillLevel + '%';
        }
        
        // Update percentage display centered on pig
        if (this.elements.pigPercentageDisplay) {
            const percentValue = Math.round(fillLevel);
            this.elements.pigPercentageDisplay.textContent = percentValue + '%';
            
            // Show percentage only when pig has some fill
            this.elements.pigPercentageDisplay.style.display = fillLevel > 0 ? 'block' : 'none';
        }
        
        // Update debug display for pig fill
        if (this.elements.debugFillValue) {
            this.elements.debugFillValue.textContent = fillLevel.toFixed(this.config.display.debugDecimalPlaces);
        }
    }
    
    /**
     * Update the visual fill level of the banker's mug
     */
    updateMugDisplay() {
        const mugFillLevel = this.state.get('mugFillLevel');
        
        // Update mug fill height
        if (this.elements.bankerMugFill) {
            this.elements.bankerMugFill.style.height = mugFillLevel + '%';
        }
        
        // Update debug display for mug fill
        if (this.elements.debugMugValue) {
            this.elements.debugMugValue.textContent = mugFillLevel.toFixed(this.config.display.debugDecimalPlaces);
        }
    }
    
    /**
     * Get current pig fill level as percentage
     * @returns {number} Fill level (0-100)
     */
    getPigFillLevel() {
        return this.state.get('fillLevel');
    }
    
    /**
     * Get current mug fill level as percentage
     * @returns {number} Fill level (0-100)
     */
    getMugFillLevel() {
        return this.state.get('mugFillLevel');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.LiquidDisplayHandler = LiquidDisplayHandler;
}

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LiquidDisplayHandler };
}
