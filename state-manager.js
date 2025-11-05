/**
 * StateManager - Centralized state management for Purchasing Power Pig
 * 
 * Manages all application state including:
 * - Simulation state (fill levels, savings, dates)
 * - Animation state (drops, timing, pause)
 * - UI state (viewport dimensions, scaling)
 * 
 * NOTE: Input state (slider values) is managed by dom-cache.js SettingsCache
 * 
 * Dependencies:
 * - config.js (CONFIG constants)
 * - dom-cache.js (settingsCache for slider values)
 */
class StateManager {
    constructor() {
        this.state = {
            // Simulation state
            fillLevel: CONFIG.MIN_FILL_PERCENTAGE,  // Pig fill percentage (0-100)
            totalSavings: 0,                        // Total dollar amount saved
            totalBankSavings: 0,                    // Total dollar amount lost to inflation
            mugFillLevel: CONFIG.MIN_FILL_PERCENTAGE, // Banker's mug fill percentage (0-100)
            currentSimDate: new Date(),             // Current simulation date
            simulationStartDate: new Date(),        // Date when simulation started (for PP reference)
            
            // Animation state
            drops: [],                              // Array of active Drop objects
            lastDropTime: 0,                        // Timestamp of last drop creation
            isPaused: false,                        // Animation pause state
            isStartState: true,                     // Whether in initial start/welcome state
            
            // UI state
            previousWidth: window.innerWidth,
            previousHeight: window.innerHeight,
            svhSupported: false,                    // Small viewport height support flag
            heightProbe: null,                      // DOM element for height detection
            scale: 1                                // Current viewport scale factor
        };
        
        this.listeners = new Map(); // Map of event types to listener arrays
    }
    
    /**
     * Subscribe to state changes
     * @param {string} event - Event type to listen for ('*' for all changes)
     * @param {Function} listener - Callback function (state, changes) => void
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(listener);
        
        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(event);
            if (listeners) {
                const index = listeners.indexOf(listener);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }
    
    /**
     * Notify listeners of state changes
     * @param {Object} changes - Object with changed state keys and their old/new values
     */
    notify(changes) {
        // Notify specific listeners
        for (const key in changes) {
            const listeners = this.listeners.get(key);
            if (listeners) {
                listeners.forEach(listener => listener(this.state, changes));
            }
        }
        
        // Notify wildcard listeners
        const wildcardListeners = this.listeners.get('*');
        if (wildcardListeners) {
            wildcardListeners.forEach(listener => listener(this.state, changes));
        }
    }
    
    /**
     * Get current state (returns a shallow copy)
     * @returns {Object} Current state
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Get a specific state value
     * @param {string} key - State key to retrieve
     * @returns {*} State value
     */
    get(key) {
        return this.state[key];
    }
    
    /**
     * Update state with new values
     * @param {Object} updates - Object with state keys to update
     */
    setState(updates) {
        const changes = {};
        
        for (const key in updates) {
            if (this.state.hasOwnProperty(key)) {
                if (this.state[key] !== updates[key]) {
                    changes[key] = { 
                        old: this.state[key], 
                        new: updates[key] 
                    };
                    this.state[key] = updates[key];
                }
            }
        }
        
        if (Object.keys(changes).length > 0) {
            this.notify(changes);
        }
    }
    
    // ========== Convenience Methods for Input Values (from SettingsCache) ==========
    
    /**
     * Get current monthly savings from SettingsCache
     * @returns {number} Monthly savings amount
     */
    getMonthlySavings() {
        return window.settingsCache ? window.settingsCache.getMonthlySavings() : CONFIG.sliders.savings.default;
    }
    
    /**
     * Get current starting amount from SettingsCache
     * @returns {number} Starting amount
     */
    getStartingAmount() {
        return window.settingsCache ? window.settingsCache.getStartingAmount() : CONFIG.sliders.startAmount.default;
    }
    
    /**
     * Get current annual inflation rate from SettingsCache
     * @returns {number} Annual inflation as decimal (e.g., 0.07 for 7%)
     */
    getAnnualInflation() {
        return window.settingsCache ? window.settingsCache.getAnnualInflation() : (CONFIG.sliders.inflation.default / 100);
    }
    
    /**
     * Get current monthly inflation rate from SettingsCache
     * @returns {number} Monthly inflation rate as decimal
     */
    getMonthlyInflationRate() {
        return window.settingsCache ? window.settingsCache.getMonthlyInflationRate() : getMonthlyCompoundRate(CONFIG.sliders.inflation.default / 100);
    }
    
    // ========== Convenience Methods for Common Operations ==========
    
    /**
     * Add a drop to the drops array
     * @param {Drop} drop - Drop instance to add
     */
    addDrop(drop) {
        this.setState({ drops: [...this.state.drops, drop] });
    }
    
    /**
     * Remove a drop from the drops array
     * @param {Drop} drop - Drop instance to remove
     */
    removeDrop(drop) {
        this.setState({ 
            drops: this.state.drops.filter(d => d !== drop) 
        });
    }
    
    /**
     * Filter drops array (e.g., remove completed drops)
     * @param {Function} predicate - Filter function (drop) => boolean
     */
    filterDrops(predicate) {
        this.setState({ 
            drops: this.state.drops.filter(predicate) 
        });
    }
    
    /**
     * Update pig fill level (clamped to min/max from CONFIG)
     * @param {number} level - New fill level percentage
     */
    updateFillLevel(level) {
        this.setState({ 
            fillLevel: Math.min(CONFIG.MAX_FILL_PERCENTAGE, Math.max(CONFIG.MIN_FILL_PERCENTAGE, level)) 
        });
    }
    
    /**
     * Update banker's mug fill level (clamped to min/max from CONFIG)
     * @param {number} level - New fill level percentage
     */
    updateMugFillLevel(level) {
        this.setState({ 
            mugFillLevel: Math.min(CONFIG.MAX_FILL_PERCENTAGE, Math.max(CONFIG.MIN_FILL_PERCENTAGE, level)) 
        });
    }
    
    /**
     * Add amount to total savings
     * @param {number} amount - Dollar amount to add
     */
    addToTotalSavings(amount) {
        this.setState({ 
            totalSavings: this.state.totalSavings + amount 
        });
    }
    
    /**
     * Add amount to bank savings (inflation losses)
     * @param {number} amount - Dollar amount to add
     */
    addToBankSavings(amount) {
        this.setState({ 
            totalBankSavings: this.state.totalBankSavings + amount 
        });
    }
    
    /**
     * Reduce fill level by monthly inflation
     * Uses current inflation rate from SettingsCache
     * @returns {number} Dollar amount lost to inflation
     */
    applyMonthlyInflation() {
        const monthlyRate = this.getMonthlyInflationRate();
        const inflationReduction = this.state.fillLevel * monthlyRate; // percentage points lost
        const inflationDollars = fillPercentageToDollars(inflationReduction, 'pig');
        
        // Reduce fill level
        this.updateFillLevel(this.state.fillLevel * (1 - monthlyRate));
        
        return inflationDollars;
    }
    
    /**
     * Add monthly savings to pig fill level
     * Uses current monthly savings from SettingsCache
     * Returns false if pig is full, true if added
     * @returns {boolean} Whether savings were added (false if pig full)
     */
    addMonthlySavingsToPig() {
        const monthlySavings = this.getMonthlySavings();
        
        if (monthlySavings === 0) return false;
        
        // Add to total savings
        this.addToTotalSavings(monthlySavings);
        
        // Add to fill level if not full
        if (this.state.fillLevel < CONFIG.MAX_FILL_PERCENTAGE) {
            const dropVolume = calculatePigDropVolume(monthlySavings);
            this.updateFillLevel(this.state.fillLevel + dropVolume);
            return true;
        }
        
        return false;
    }
    
    /**
     * Add inflation loss to banker's mug
     * @param {number} dollarAmount - Dollar amount to add to mug
     * @returns {boolean} Whether amount was added (false if mug full)
     */
    addInflationLossToMug(dollarAmount) {
        if (dollarAmount <= 0) return false;
        
        // Add to bank total
        this.addToBankSavings(dollarAmount);
        
        // Add to mug fill level if not full
        if (this.state.mugFillLevel < CONFIG.MAX_FILL_PERCENTAGE) {
            const dropVolume = calculateMugDropVolume(dollarAmount);
            this.updateMugFillLevel(this.state.mugFillLevel + dropVolume);
            return true;
        }
        
        return false;
    }
    
    /**
     * Toggle pause state
     * @returns {boolean} New pause state
     */
    togglePause() {
        const newPauseState = !this.state.isPaused;
        this.setState({ isPaused: newPauseState });
        return newPauseState;
    }
    
    /**
     * Set pause state explicitly
     * @param {boolean} paused - New pause state
     */
    setPaused(paused) {
        this.setState({ isPaused: paused });
    }
    
    /**
     * Update simulation date (advance by one month)
     */
    advanceMonth() {
        const newDate = new Date(this.state.currentSimDate);
        newDate.setMonth(newDate.getMonth() + 1);
        this.setState({ currentSimDate: newDate });
    }
    
    /**
     * Update last drop time (for drop interval tracking)
     * @param {number} timestamp - Performance timestamp
     */
    updateLastDropTime(timestamp) {
        this.setState({ lastDropTime: timestamp });
    }
    
    /**
     * Update viewport state
     * @param {Object} viewport - Viewport properties (width, height, scale, etc.)
     */
    updateViewport(viewport) {
        this.setState(viewport);
    }
    
    /**
     * Reset simulation to initial state
     * @param {number} startAmount - Starting amount for reset (if null, uses current from SettingsCache)
     */
    reset(startAmount = null) {
        // Clean up existing drops
        this.state.drops.forEach(drop => {
            if (drop.element && drop.element.parentNode) {
                drop.element.remove();
            }
        });
        
        // Use provided amount or get from SettingsCache
        const amount = startAmount !== null ? startAmount : this.getStartingAmount();
        
        // Calculate initial fill level using CONFIG constant
        const initialFillLevel = (amount / CONFIG.PIG_CAPACITY_DOLLARS) * 100;
        
        // Set simulation start date to now
        const startDate = new Date();
        
        this.setState({
            fillLevel: initialFillLevel,
            totalSavings: amount,
            totalBankSavings: 0,
            mugFillLevel: CONFIG.MIN_FILL_PERCENTAGE,
            drops: [],
            lastDropTime: 0,
            isPaused: false,
            currentSimDate: new Date(startDate),
            simulationStartDate: new Date(startDate)
        });
    }
    
    /**
     * Initialize from starting amount (used when slider changes)
     * Convenience method that calls reset with the current starting amount
     */
    initializeFromStartingAmount() {
        this.reset(this.getStartingAmount());
    }
    
    /**
     * Get formatted current date for display
     * @returns {string} Formatted date string (e.g., "2025 October")
     */
    getFormattedDate() {
        const year = this.state.currentSimDate.getFullYear();
        const month = CONFIG.display.monthNames[this.state.currentSimDate.getMonth()];
        return `${year} ${month}`;
    }
    
    /**
     * Get formatted simulation start date for PP display
     * @returns {string} Formatted date string (e.g., "2025-10")
     */
    getFormattedStartDate() {
        const year = this.state.simulationStartDate.getFullYear();
        const month = String(this.state.simulationStartDate.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }
    
    /**
     * Get current purchasing power value in dollars
     * @returns {number} Purchasing power in dollars (based on fillLevel)
     */
    getPPValue() {
        return Math.round(fillPercentageToDollars(this.state.fillLevel, 'pig'));
    }
    
    /**
     * Get percentage of purchasing power lost
     * @returns {number} Percentage (0-100)
     */
    getPurchasingPowerLostPercentage() {
        if (this.state.totalSavings === 0) return 0;
        return Math.round((this.state.totalBankSavings / this.state.totalSavings) * 100);
    }
    
    /**
     * Get pig fill as dollar amount
     * @returns {number} Dollar amount in pig
     */
    getPigDollars() {
        return fillPercentageToDollars(this.state.fillLevel, 'pig');
    }
    
    /**
     * Get mug fill as dollar amount
     * @returns {number} Dollar amount in mug
     */
    getMugDollars() {
        return fillPercentageToDollars(this.state.mugFillLevel, 'mug');
    }
}

// Create singleton instance
const stateManager = new StateManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.stateManager = stateManager;
}

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StateManager, stateManager };
}
