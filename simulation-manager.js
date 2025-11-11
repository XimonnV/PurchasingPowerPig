/**
 * SimulationManager - Business logic for the simulation
 *
 * Handles all business rules and calculations for the purchasing power simulation.
 * Extracted from StateManager to keep state management pure.
 *
 * Responsibilities:
 * - Add monthly savings to pig
 * - Apply monthly inflation
 * - Add inflation losses to mug
 * - Advance simulation date
 * - Calculate derived values (PP, percentages)
 *
 * Dependencies:
 * - config.js (for CONFIG constants)
 * - state-manager.js (to read/write state)
 * - financial-math.js (calculation functions)
 *
 * Example:
 * ```javascript
 * const simManager = new SimulationManager(CONFIG, stateManager);
 *
 * // When savings drop lands
 * simManager.addMonthlySavingsToPig();
 * simManager.advanceMonth();
 *
 * // After delay, apply inflation
 * const inflationDollars = simManager.applyMonthlyInflation();
 * if (inflationDollars > 0) {
 *     createInflationDrop(inflationDollars);
 * }
 * ```
 */
class SimulationManager {
    /**
     * Create simulation manager
     * @param {Object} config - CONFIG object
     * @param {StateManager} stateManager - State manager instance
     */
    constructor(config, stateManager) {
        this.config = config;
        this.stateManager = stateManager;
    }

    /**
     * Add monthly savings to pig fill level
     * Delegates to StateManager which handles cumulative inflation factor
     * Uses current monthly savings from settings cache
     * @returns {boolean} Whether savings were added (false if pig full or savings is 0)
     */
    addMonthlySavingsToPig() {
        // Delegate to state manager (which uses cumulative inflation factor)
        return this.stateManager.addMonthlySavingsToPig();
    }

    /**
     * Apply monthly inflation to purchasing power
     * Delegates to StateManager which handles cumulative inflation factor
     * @returns {number} Dollar amount of purchasing power lost to inflation
     */
    applyMonthlyInflation() {
        // Delegate to state manager (which uses cumulative inflation factor)
        return this.stateManager.applyMonthlyInflation();
    }

    /**
     * Add inflation loss to banker's mug
     * @param {number} dollarAmount - Dollar amount to add to mug
     * @returns {boolean} Whether amount was added (false if mug full or amount <= 0)
     */
    addInflationLossToMug(dollarAmount) {
        if (dollarAmount <= 0) return false;

        // Add to bank total
        const currentBankTotal = this.stateManager.get('totalBankSavings');
        this.stateManager.setState({
            totalBankSavings: currentBankTotal + dollarAmount
        });

        // Add to mug fill level if not full
        const mugFillLevel = this.stateManager.get('mugFillLevel');
        if (mugFillLevel < this.config.MAX_FILL_PERCENTAGE) {
            const dropVolume = calculateMugDropVolume(dollarAmount);
            const newMugFillLevel = Math.min(
                this.config.MAX_FILL_PERCENTAGE,
                mugFillLevel + dropVolume
            );
            this.stateManager.setState({ mugFillLevel: newMugFillLevel });
            return true;
        }

        return false;
    }

    /**
     * Advance simulation date by one month
     */
    advanceMonth() {
        const currentDate = this.stateManager.get('currentSimDate');
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        this.stateManager.setState({ currentSimDate: newDate });
    }

    /**
     * Get current purchasing power value in dollars
     * Delegates to StateManager which uses cumulative inflation factor
     * @returns {number} Purchasing power in dollars
     */
    getPPValue() {
        return this.stateManager.getPPValue();
    }

    /**
     * Get percentage of purchasing power lost
     * Delegates to StateManager which uses cumulative inflation factor
     * @returns {number} Percentage (0-100)
     */
    getPurchasingPowerLostPercentage() {
        return this.stateManager.getPurchasingPowerLostPercentage();
    }

    /**
     * Reset simulation to initial state
     * Delegates to StateManager which handles cumulative inflation factor initialization
     * @param {number|null} startAmount - Starting amount (null = use current from settings)
     */
    reset(startAmount = null) {
        // Delegate to state manager (which initializes cumulative inflation factor)
        this.stateManager.reset(startAmount);
    }

    /**
     * Initialize from starting amount (convenience method)
     */
    initializeFromStartingAmount() {
        this.stateManager.initializeFromStartingAmount();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SimulationManager = SimulationManager;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimulationManager };
}
