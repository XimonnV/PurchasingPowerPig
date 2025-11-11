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
            totalSavings: 0,                        // Total dollar amount saved (current value, can differ from nominal in BTC mode)
            totalSavingsBtc: 0,                     // Total BTC amount saved (BTC mode)
            nominalDollarsSaved: 0,                 // Nominal dollar amount deposited (for PP Lost/Gained calculation)
            totalBankSavings: 0,                    // Total dollar amount lost to inflation
            mugFillLevel: CONFIG.MIN_FILL_PERCENTAGE, // Banker's mug fill percentage (0-100)
            currentSimDate: new Date(),             // Current simulation date
            simulationStartDate: new Date(),        // Date when simulation started (for PP reference)
            savingsVehicle: 'usd',                  // Savings vehicle ('usd' or 'btc')
            fullPigBtcCapacity: 0,                  // Full pig capacity in BTC (calculated at simulation start)
            cumulativeInflationFactor: 1.0,         // Cumulative inflation erosion factor (1.0 = no erosion)

            // Animation state
            lastDropTime: 0,                        // Timestamp of last drop creation
            isPaused: false,                        // Animation pause state
            isStartState: true,                     // Whether in initial start/welcome state
            isSimulationFinished: false,            // Whether simulation reached 360 months
            
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
     * Apply monthly inflation to purchasing power
     * Updates cumulative inflation factor and recalculates fill level
     * Uses current inflation rate from SettingsCache
     * @returns {number} Dollar amount of purchasing power lost to inflation
     */
    applyMonthlyInflation() {
        const monthlyRate = this.getMonthlyInflationRate();
        const oldFactor = this.state.cumulativeInflationFactor;

        // Update cumulative inflation factor
        const newFactor = oldFactor * (1 + monthlyRate);
        this.setState({ cumulativeInflationFactor: newFactor });

        // Debug: Log cumulative inflation factor
        console.log(`💸 Inflation applied: Factor ${oldFactor.toFixed(6)} → ${newFactor.toFixed(6)} (${((newFactor - 1) * 100).toFixed(2)}% cumulative erosion)`);

        // Recalculate fill level from purchasing power
        const purchasingPower = this.state.totalSavings / newFactor;
        const newFillLevel = (purchasingPower / CONFIG.PIG_CAPACITY_DOLLARS) * 100;
        this.updateFillLevel(newFillLevel);

        // Calculate inflation loss in dollars (for visual drop)
        const inflationDollars = calculateInflationLossFromFactor(
            this.state.totalSavings,
            oldFactor,
            newFactor
        );

        return inflationDollars;
    }
    
    /**
     * Add monthly savings to pig fill level
     * Uses current monthly savings from SettingsCache
     * Recalculates fill level based on purchasing power
     * Returns false if pig is full, true if added
     * @returns {boolean} Whether savings were added (false if pig full)
     */
    addMonthlySavingsToPig() {
        const monthlySavings = this.getMonthlySavings();

        if (monthlySavings === 0) return false;

        const savingsVehicle = this.state.savingsVehicle;

        if (savingsVehicle === 'btc') {
            // BTC mode: Convert USD monthly savings to BTC at current date
            const currentDate = this.state.currentSimDate;
            const btcAmount = convertUsdToBtc(monthlySavings, currentDate);

            // Add to BTC total and track nominal dollar amount
            const newTotalBtc = this.state.totalSavingsBtc + btcAmount;
            const newNominalDollars = this.state.nominalDollarsSaved + monthlySavings;

            this.setState({
                totalSavingsBtc: newTotalBtc,
                nominalDollarsSaved: newNominalDollars  // Track nominal dollars deposited
            });

            // Recalculate fill level based on BTC capacity
            const fullPigBtc = this.state.fullPigBtcCapacity;
            const newFillLevel = (newTotalBtc / fullPigBtc) * 100;

            console.log(`💰 Added ${btcAmount.toFixed(8)} BTC (from $${monthlySavings}) at ${currentDate.toISOString().split('T')[0]}`);

            // Check if pig is full
            if (newFillLevel >= CONFIG.MAX_FILL_PERCENTAGE) {
                this.updateFillLevel(CONFIG.MAX_FILL_PERCENTAGE);
                return false;
            }

            this.updateFillLevel(newFillLevel);
            return true;

        } else {
            // USD mode: Use existing logic with cumulative inflation factor

            // Add to total savings (in USD mode, totalSavings = nominalDollarsSaved)
            this.addToTotalSavings(monthlySavings);

            // Also increment nominal dollars
            this.setState({
                nominalDollarsSaved: this.state.nominalDollarsSaved + monthlySavings
            });

            // Recalculate fill level from purchasing power
            const purchasingPower = this.state.totalSavings / this.state.cumulativeInflationFactor;
            const newFillLevel = (purchasingPower / CONFIG.PIG_CAPACITY_DOLLARS) * 100;

            // Check if pig is full
            if (newFillLevel >= CONFIG.MAX_FILL_PERCENTAGE) {
                this.updateFillLevel(CONFIG.MAX_FILL_PERCENTAGE);
                return false;
            }

            this.updateFillLevel(newFillLevel);
            return true;
        }
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
     * Get current savings vehicle
     * @returns {string} Savings vehicle ('usd' or 'btc')
     */
    getSavingsVehicle() {
        return this.state.savingsVehicle;
    }

    /**
     * Set savings vehicle and convert between USD and BTC
     * @param {string} newVehicle - Savings vehicle ('usd' or 'btc')
     */
    setSavingsVehicle(newVehicle) {
        const oldVehicle = this.state.savingsVehicle;

        // If switching vehicles, convert the savings
        if (oldVehicle !== newVehicle) {
            this.convertSavingsVehicle(oldVehicle, newVehicle);
        }

        this.setState({ savingsVehicle: newVehicle });
    }

    /**
     * Convert savings between USD and BTC using current simulation date
     * @param {string} fromVehicle - Current vehicle ('usd' or 'btc')
     * @param {string} toVehicle - Target vehicle ('usd' or 'btc')
     */
    convertSavingsVehicle(fromVehicle, toVehicle) {
        const currentDate = this.state.currentSimDate;

        if (fromVehicle === 'usd' && toVehicle === 'btc') {
            // USD → BTC: Convert total USD savings to BTC at current date
            const usdAmount = this.state.totalSavings;
            const btcAmount = convertUsdToBtc(usdAmount, currentDate);
            this.setState({ totalSavingsBtc: btcAmount });

            console.log(`💱 Converted $${usdAmount.toLocaleString()} → ${btcAmount.toFixed(8)} BTC at ${currentDate.toISOString().split('T')[0]}`);
        } else if (fromVehicle === 'btc' && toVehicle === 'usd') {
            // BTC → USD: Convert total BTC savings to USD at current date
            const btcAmount = this.state.totalSavingsBtc;
            const usdAmount = convertBtcToUsd(btcAmount, currentDate);
            this.setState({ totalSavings: usdAmount });

            console.log(`💱 Converted ${btcAmount.toFixed(8)} BTC → $${usdAmount.toLocaleString()} at ${currentDate.toISOString().split('T')[0]}`);
        }
    }

    /**
     * Get full pig capacity in BTC (calculated at simulation start date)
     * This value represents how many BTC equal $100,000 at the simulation start date
     * @returns {number} Full pig capacity in BTC (always positive, 0 if not yet calculated)
     */
    getFullPigBtcCapacity() {
        const capacity = this.state.fullPigBtcCapacity;

        // Ensure we always return a non-negative value
        if (!capacity || capacity <= 0 || isNaN(capacity)) {
            return 0;
        }

        return capacity;
    }

    /**
     * Get cumulative inflation factor
     * This tracks how much purchasing power has eroded due to inflation
     * @returns {number} Cumulative inflation factor (1.0 = no erosion, higher = more erosion)
     */
    getCumulativeInflationFactor() {
        return this.state.cumulativeInflationFactor;
    }

    /**
     * Get total savings in BTC
     * @returns {number} Total BTC amount saved
     */
    getTotalSavingsBtc() {
        return this.state.totalSavingsBtc;
    }

    /**
     * Update viewport state
     * @param {Object} viewport - Viewport properties (width, height, scale, etc.)
     */
    updateViewport(viewport) {
        this.setState(viewport);
    }
    
    /**
     * Reset simulation state to initial values
     * NOTE: This only resets state values, not drops. Drop cleanup is handled by AnimationEngine.
     * @param {number} startAmount - Starting amount for reset (if null, uses current from SettingsCache)
     */
    reset(startAmount = null) {
        // Use provided amount or get from SettingsCache
        const amount = startAmount !== null ? startAmount : this.getStartingAmount();

        // Set simulation start date to now
        const startDate = new Date();

        // Calculate full pig capacity in BTC at simulation start date
        // This value is stored so it remains constant throughout the simulation
        const fullPigBtc = calculateFullPigInBtc(startDate);

        // Debug log to verify calculation
        if (fullPigBtc > 0) {
            console.log(`✓ Full pig BTC capacity calculated: ${fullPigBtc.toFixed(8)} BTC at ${startDate.toISOString()}`);
        } else {
            console.error('❌ Failed to calculate full pig BTC capacity. Check that financial-math.js is loaded.');
        }

        // Convert starting amount to BTC (for BTC mode)
        const startAmountBtc = convertUsdToBtc(amount, startDate);

        // Determine fill level based on current vehicle
        const currentVehicle = this.state.savingsVehicle;
        let initialFillLevel;

        if (currentVehicle === 'btc') {
            // BTC mode: fill level based on BTC capacity
            initialFillLevel = (startAmountBtc / fullPigBtc) * 100;
            console.log(`🔄 Reset in BTC mode: ${amount.toLocaleString()} = ${startAmountBtc.toFixed(8)} BTC`);
        } else {
            // USD mode: fill level based on USD capacity
            initialFillLevel = (amount / CONFIG.PIG_CAPACITY_DOLLARS) * 100;
        }

        this.setState({
            fillLevel: initialFillLevel,
            totalSavings: amount,                 // Always store USD amount
            totalSavingsBtc: startAmountBtc,      // Always store BTC equivalent
            nominalDollarsSaved: amount,          // Initialize nominal amount
            totalBankSavings: 0,
            mugFillLevel: CONFIG.MIN_FILL_PERCENTAGE,
            lastDropTime: 0,
            isPaused: false,
            isSimulationFinished: false,          // Reset finished state
            currentSimDate: new Date(startDate),
            simulationStartDate: new Date(startDate),
            fullPigBtcCapacity: fullPigBtc,
            cumulativeInflationFactor: 1.0  // Reset to 1.0 (no erosion at start)
            // Note: savingsVehicle is NOT reset - it persists across restarts
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
     * Get months elapsed since simulation started
     * @returns {number} Number of months elapsed
     */
    getMonthsElapsed() {
        const startDate = this.state.simulationStartDate;
        const currentDate = this.state.currentSimDate;

        // Calculate month difference
        const yearDiff = currentDate.getFullYear() - startDate.getFullYear();
        const monthDiff = currentDate.getMonth() - startDate.getMonth();

        return yearDiff * 12 + monthDiff;
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
     * Calculated from total savings adjusted by cumulative inflation factor
     * @returns {number} Purchasing power in dollars
     */
    getPPValue() {
        const savingsVehicle = this.state.savingsVehicle;

        if (savingsVehicle === 'btc') {
            // BTC mode: Convert BTC to USD at current date, then adjust for inflation
            const currentDate = this.state.currentSimDate;
            const totalBtc = this.state.totalSavingsBtc;
            const usdValue = convertBtcToUsd(totalBtc, currentDate);
            const purchasingPower = usdValue / this.state.cumulativeInflationFactor;
            return Math.round(purchasingPower);
        } else {
            // USD mode: Divide total savings by cumulative inflation factor
            const purchasingPower = this.state.totalSavings / this.state.cumulativeInflationFactor;
            return Math.round(purchasingPower);
        }
    }

    /**
     * Get percentage of purchasing power lost
     * Calculated from cumulative inflation factor
     * @returns {number} Percentage (0-100)
     */
    getPurchasingPowerLostPercentage() {
        const factor = this.state.cumulativeInflationFactor;
        if (factor <= 0 || factor === 1.0) return 0;
        return Math.round((1 - 1/factor) * 100);
    }

    /**
     * Get purchasing power gained or lost information
     * Compares PP value to nominal dollars saved
     * @returns {Object} { label: 'PP Lost' or 'PP Gained', percentage: number, isGain: boolean }
     */
    getPPGainedOrLostInfo() {
        const nominalDollars = this.state.nominalDollarsSaved;
        const ppValue = this.getPPValue();

        if (nominalDollars === 0) {
            // At the very start, show "PP Lost: 0%"
            return {
                label: 'PP Lost',
                percentage: 0,
                isGain: false
            };
        }

        if (ppValue > nominalDollars) {
            // Gain: PP is higher than nominal (can happen in BTC mode)
            const gainPercentage = ((ppValue - nominalDollars) / nominalDollars) * 100;
            return {
                label: 'PP Gained',
                percentage: Math.round(gainPercentage),
                isGain: true
            };
        } else {
            // Loss or equal: PP is lower than or equal to nominal
            const lossPercentage = ((nominalDollars - ppValue) / nominalDollars) * 100;
            return {
                label: 'PP Lost',
                percentage: Math.round(lossPercentage),
                isGain: false
            };
        }
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
