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
     * Uses current monthly savings from settings cache
     * @returns {boolean} Whether savings were added (false if pig full or savings is 0)
     */
    addMonthlySavingsToPig() {
        const monthlySavings = this.stateManager.getMonthlySavings();

        if (monthlySavings === 0) return false;

        // Add to total savings
        const currentTotal = this.stateManager.get('totalSavings');
        this.stateManager.setState({
            totalSavings: currentTotal + monthlySavings
        });

        // Add to fill level if not full
        const fillLevel = this.stateManager.get('fillLevel');
        if (fillLevel < this.config.MAX_FILL_PERCENTAGE) {
            const dropVolume = calculatePigDropVolume(monthlySavings);
            const newFillLevel = Math.min(
                this.config.MAX_FILL_PERCENTAGE,
                fillLevel + dropVolume
            );
            this.stateManager.setState({ fillLevel: newFillLevel });
            return true;
        }

        return false;
    }

    /**
     * Apply monthly inflation to pig fill level
     * Reduces fill level by monthly inflation rate
     * @returns {number} Dollar amount lost to inflation
     */
    applyMonthlyInflation() {
        const monthlyRate = this.stateManager.getMonthlyInflationRate();
        const fillLevel = this.stateManager.get('fillLevel');

        const inflationReduction = fillLevel * monthlyRate; // percentage points lost
        const inflationDollars = fillPercentageToDollars(inflationReduction, 'pig');

        // Reduce fill level
        const newFillLevel = Math.max(
            this.config.MIN_FILL_PERCENTAGE,
            fillLevel * (1 - monthlyRate)
        );
        this.stateManager.setState({ fillLevel: newFillLevel });

        return inflationDollars;
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
     * @returns {number} Purchasing power in dollars (based on fillLevel)
     */
    getPPValue() {
        const fillLevel = this.stateManager.get('fillLevel');
        return Math.round(fillPercentageToDollars(fillLevel, 'pig'));
    }

    /**
     * Get percentage of purchasing power lost
     * @returns {number} Percentage (0-100)
     */
    getPurchasingPowerLostPercentage() {
        const totalSavings = this.stateManager.get('totalSavings');
        const totalBankSavings = this.stateManager.get('totalBankSavings');

        if (totalSavings === 0) return 0;
        return Math.round((totalBankSavings / totalSavings) * 100);
    }

    /**
     * Reset simulation to initial state
     * @param {number|null} startAmount - Starting amount (null = use current from settings)
     */
    reset(startAmount = null) {
        // Use provided amount or get from settings cache
        const amount = startAmount !== null ? startAmount : this.stateManager.getStartingAmount();

        // Calculate initial fill level
        const initialFillLevel = (amount / this.config.PIG_CAPACITY_DOLLARS) * 100;

        // Set simulation start date to now
        const startDate = new Date();

        this.stateManager.setState({
            fillLevel: initialFillLevel,
            totalSavings: amount,
            totalBankSavings: 0,
            mugFillLevel: this.config.MIN_FILL_PERCENTAGE,
            isPaused: false,
            currentSimDate: new Date(startDate),
            simulationStartDate: new Date(startDate)
        });
    }

    /**
     * Initialize from starting amount (convenience method)
     */
    initializeFromStartingAmount() {
        this.reset(this.stateManager.getStartingAmount());
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
