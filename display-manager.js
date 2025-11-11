/**
 * DisplayManager - Display Layer Coordinator
 * 
 * Coordinates all display handlers and sets up state change subscriptions
 * for automatic, event-driven display updates.
 * 
 * Responsibilities:
 * - Initialize all display handlers
 * - Setup state change subscriptions
 * - Coordinate display updates across multiple handlers
 * - Provide unified API for display operations
 * 
 * Dependencies:
 * - config.js (CONFIG constants)
 * - state-manager.js (state subscriptions)
 * - liquid-display-handler.js (pig and mug fills)
 * - savings-display-handler.js (savings panel)
 * - date-display-handler.js (date display)
 * - ui-display-handler.js (UI elements)
 * - chart-handler.js (Plotly.js chart)
 * 
 * Example:
 * ```javascript
 * const displayManager = new DisplayManager(CONFIG, stateManager);
 * displayManager.initialize();
 * ```
 */
class DisplayManager {
    /**
     * Create a new DisplayManager
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - State manager instance
     */
    constructor(config, stateManager) {
        this.config = config;
        this.state = stateManager;
        
        // Create display handlers
        this.handlers = {
            liquid: new LiquidDisplayHandler(config, stateManager),
            savings: new SavingsDisplayHandler(config, stateManager),
            date: new DateDisplayHandler(config, stateManager),
            ui: new UIDisplayHandler(config, stateManager),
            chart: new ChartHandler(config, stateManager)
        };
        
        // Store unsubscribe functions for cleanup
        this.unsubscribers = [];
    }
    
    /**
     * Initialize the display manager
     * Initializes all handlers and sets up state change subscriptions
     */
    initialize() {
        // 1. Initialize all handlers
        this.initializeHandlers();
        
        // 2. Setup state change subscriptions for automatic updates
        this.setupSubscriptions();
    }
    
    /**
     * Initialize all display handlers
     */
    initializeHandlers() {
        this.handlers.liquid.initialize();
        this.handlers.savings.initialize();
        this.handlers.date.initialize();
        this.handlers.ui.initialize();
        this.handlers.chart.initialize();
    }
    
    /**
     * Setup state change subscriptions for automatic display updates
     * This creates an event-driven system where displays update automatically
     * when state changes, without manual calls.
     */
    setupSubscriptions() {
        // Pig fill level changes → update pig display only
        this.unsubscribers.push(
            this.state.subscribe('fillLevel', () => {
                this.handlers.liquid.updatePigDisplay();
            })
        );

        // Mug fill level changes → update mug display
        this.unsubscribers.push(
            this.state.subscribe('mugFillLevel', () => {
                this.handlers.liquid.updateMugDisplay();
            })
        );

        // Total savings changes → update savings display and PP display
        this.unsubscribers.push(
            this.state.subscribe('totalSavings', () => {
                this.handlers.savings.updateSavingsDisplay();
                this.handlers.savings.updatePPDisplay(); // PP = totalSavings / cumulativeFactor
            })
        );

        // Total BTC savings changes → update savings display and PP display (BTC mode)
        this.unsubscribers.push(
            this.state.subscribe('totalSavingsBtc', () => {
                this.handlers.savings.updateSavingsDisplay();
                this.handlers.savings.updatePPDisplay(); // PP = (totalSavingsBtc × price) / cumulativeFactor
            })
        );

        // Savings vehicle changes → update savings display (switch $ ↔ ₿ format)
        this.unsubscribers.push(
            this.state.subscribe('savingsVehicle', () => {
                this.handlers.savings.updateSavingsDisplay();
                this.handlers.savings.updatePPDisplay();
            })
        );

        // Cumulative inflation factor changes → update PP and savings displays
        this.unsubscribers.push(
            this.state.subscribe('cumulativeInflationFactor', () => {
                this.handlers.savings.updatePPDisplay(); // PP = totalSavings / cumulativeFactor
                this.handlers.savings.updateSavingsDisplay(); // PP Lost % uses cumulativeFactor
            })
        );
        
        // Bank savings (inflation losses) changes → update savings display
        this.unsubscribers.push(
            this.state.subscribe('totalBankSavings', () => {
                this.handlers.savings.updateSavingsDisplay();
            })
        );
        
        // Simulation date changes → update date display and PP display (BTC mode needs this)
        this.unsubscribers.push(
            this.state.subscribe('currentSimDate', () => {
                this.handlers.date.updateDateDisplay();
                this.handlers.savings.updatePPDisplay(); // BTC mode: PP depends on current date (BTC price)
                this.handlers.savings.updateSavingsDisplay(); // PP Lost/Gained % depends on PP value
            })
        );
        
        // Simulation start date changes → update PP display
        this.unsubscribers.push(
            this.state.subscribe('simulationStartDate', () => {
                this.handlers.savings.updatePPDisplay();
            })
        );
        
        // Pause state changes → update pause button
        this.unsubscribers.push(
            this.state.subscribe('isPaused', () => {
                this.handlers.ui.updatePauseButton();
            })
        );
    }
    
    /**
     * Update all displays to match current state
     * Useful for initialization or after bulk state changes
     */
    updateAllDisplays() {
        this.handlers.liquid.updatePigDisplay();
        this.handlers.liquid.updateMugDisplay();
        this.handlers.savings.updateSavingsDisplay();
        this.handlers.savings.updatePPDisplay();
        this.handlers.date.updateDateDisplay();
        this.handlers.ui.updatePauseButton();
        this.handlers.ui.updateInfoPanel();
        this.handlers.ui.updateLeakOval();
    }
    
    /**
     * Update leak oval (call when inflation slider changes)
     * This is the only display that needs manual updates (responds to slider, not state)
     */
    updateLeakOval() {
        this.handlers.ui.updateLeakOval();
    }
    
    /**
     * Get a specific handler
     * @param {string} name - Handler name ('liquid', 'savings', 'date', 'ui', 'chart')
     * @returns {Object} Handler instance
     */
    getHandler(name) {
        return this.handlers[name];
    }
    
    /**
     * Cleanup method - removes all subscriptions
     * Call this if you need to destroy the display manager
     */
    destroy() {
        // Unsubscribe from all state changes
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DisplayManager = DisplayManager;
}

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DisplayManager };
}
