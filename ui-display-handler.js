/**
 * UIDisplayHandler - UI Element Display Management
 * 
 * Responsibilities:
 * - Update pause button text and styling
 * - Update info panel baseline text
 * - Update leak oval size (based on inflation rate)
 * 
 * Dependencies:
 * - config.js (CONFIG constants)
 * - state-manager.js (state values)
 * 
 * Example:
 * ```javascript
 * const uiHandler = new UIDisplayHandler(CONFIG, stateManager);
 * uiHandler.initialize();
 * ```
 */
class UIDisplayHandler {
    /**
     * Create a new UIDisplayHandler
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - State manager instance
     */
    constructor(config, stateManager) {
        this.config = config;
        this.state = stateManager;
        
        // Cache DOM elements
        this.elements = {
            pauseButton: null,
            infoText: null,
            leakOval: null
        };
    }
    
    /**
     * Initialize the UI display handler
     * Caches DOM elements and sets up initial display
     */
    initialize() {
        // Cache DOM elements
        this.cacheElements();
        
        // Update displays to match current state
        this.updatePauseButton();
        this.updateInfoPanel();
        this.updateLeakOval();
    }
    
    /**
     * Cache all DOM elements used by this handler
     */
    cacheElements() {
        this.elements.pauseButton = document.getElementById(this.config.elementIds.pauseButton);
        this.elements.infoText = document.querySelector(this.config.selectors.infoText);
        
        // Leak oval - create if it doesn't exist
        let leakOval = document.querySelector(this.config.selectors.leakOval);
        if (!leakOval) {
            leakOval = this.createLeakOval();
        }
        this.elements.leakOval = leakOval;
    }
    
    /**
     * Create the leak oval element dynamically
     * @returns {HTMLElement} Created leak oval element
     */
    createLeakOval() {
        const leakOval = document.createElement('div');
        leakOval.className = this.config.cssClasses.leakOval;
        document.body.appendChild(leakOval);
        return leakOval;
    }
    
    /**
     * Update pause button text and styling based on pause state
     */
    updatePauseButton() {
        if (!this.elements.pauseButton) return;
        
        const isPaused = this.state.get('isPaused');
        
        // Update button text
        this.elements.pauseButton.textContent = isPaused 
            ? this.config.buttonText.resume 
            : this.config.buttonText.pause;
        
        // Update button styling
        if (isPaused) {
            this.elements.pauseButton.classList.add(this.config.cssClasses.paused);
        } else {
            this.elements.pauseButton.classList.remove(this.config.cssClasses.paused);
        }
    }
    
    /**
     * Update info panel baseline text
     * Shows the purchasing power baseline date and amount
     */
    updateInfoPanel() {
        if (!this.elements.infoText) return;
        
        // Get current date for baseline
        const now = new Date();
        const year = now.getFullYear();
        const month = this.config.display.monthNames[now.getMonth()];
        
        // Update text
        this.elements.infoText.textContent = 
            `A full pig equals the purchasing power of $100K at ${year} ${month}`;
    }
    
    /**
     * Update leak oval size based on current inflation rate
     * The leak oval visualizes the inflation rate as an oval at the bottom of the pig
     */
    updateLeakOval() {
        if (!this.elements.leakOval) return;
        
        // Get current inflation rate from settings
        const annualInflationPercent = this.state.getAnnualInflation() * 100;
        
        // Calculate oval size using helper function from config.js
        const { width, height } = calculateLeakOvalSize(annualInflationPercent);
        
        // Apply scale factor (leak oval scales with viewport)
        const scaleFactor = getScaleFactor();
        const scaledWidth = width * scaleFactor;
        const scaledHeight = height * scaleFactor;
        
        // Update element size
        this.elements.leakOval.style.width = scaledWidth + 'px';
        this.elements.leakOval.style.height = scaledHeight + 'px';
    }
    
    /**
     * Get current pause state
     * @returns {boolean} True if paused
     */
    isPaused() {
        return this.state.get('isPaused');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.UIDisplayHandler = UIDisplayHandler;
}

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIDisplayHandler };
}
