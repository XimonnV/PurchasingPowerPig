/**
 * BalanceController - Balance UI and Slider Management
 * 
 * Responsibilities:
 * - Manage balance icon states (balanced, grow, shrink)
 * - Handle slider input events (Starting Amount, Inflation, Monthly Savings)
 * - Handle balance button clicks (calculate optimal values)
 * - Check and update balance state
 * - Update display values when sliders change
 * 
 * Dependencies:
 * - config.js (CONFIG constants)
 * - financial-math.js (calculation functions)
 * - state-manager.js (state updates)
 * - dom-cache.js (optional - for caching)
 * 
 * Example:
 * ```javascript
 * const balanceController = new BalanceController(CONFIG, stateManager);
 * balanceController.initialize();
 * ```
 */
class BalanceController {
    /**
     * Create a new BalanceController
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - State manager instance
     */
    constructor(config, stateManager) {
        this.config = config;
        this.stateManager = stateManager;
        
        // Cache DOM elements
        this.elements = {
            // Sliders
            startAmountSlider: null,
            inflationSlider: null,
            savingsSlider: null,
            
            // Display values
            startAmountValue: null,
            inflationValue: null,
            savingsValue: null,
            
            // Balance buttons
            balanceStartAmount: null,
            balanceInflation: null,
            balanceSavings: null
        };
    }
    
    /**
     * Initialize the balance controller
     * Caches DOM elements, sets up event listeners, and performs initial balance check
     */
    initialize() {
        // 1. Cache DOM elements
        this.cacheElements();

        // 2. Setup event listeners
        this.setupSliderListeners();
        this.setupBalanceButtonListeners();

        // 3. Subscribe to totalSavings changes to update balance icons during simulation
        this.stateManager.subscribe('totalSavings', () => {
            this.checkBalance();
        });

        // 4. Perform initial balance check
        this.checkBalance();
    }
    
    /**
     * Cache all DOM elements used by this controller
     */
    cacheElements() {
        // Sliders
        this.elements.startAmountSlider = document.getElementById(this.config.elementIds.startAmountSlider);
        this.elements.inflationSlider = document.getElementById(this.config.elementIds.inflationSlider);
        this.elements.savingsSlider = document.getElementById(this.config.elementIds.savingsSlider);
        
        // Display values
        this.elements.startAmountValue = document.getElementById(this.config.elementIds.startAmountValue);
        this.elements.inflationValue = document.getElementById(this.config.elementIds.inflationValue);
        this.elements.savingsValue = document.getElementById(this.config.elementIds.savingsValue);
        
        // Balance buttons
        this.elements.balanceStartAmount = document.getElementById(this.config.elementIds.balanceStartAmount);
        this.elements.balanceInflation = document.getElementById(this.config.elementIds.balanceInflation);
        this.elements.balanceSavings = document.getElementById(this.config.elementIds.balanceSavings);
    }
    
    /**
     * Set balance icon for all three balance buttons
     * @param {string} iconFile - Icon filename (from CONFIG.images)
     * @param {boolean} flipHorizontal - Whether to flip the icon horizontally
     */
    setBalanceIcon(iconFile, flipHorizontal = false) {
        const buttons = [
            this.elements.balanceStartAmount,
            this.elements.balanceInflation,
            this.elements.balanceSavings
        ];
        
        buttons.forEach(button => {
            if (button) {
                button.style.backgroundImage = `url('${iconFile}')`;
                // Apply horizontal flip using CSS transform
                if (flipHorizontal) {
                    button.style.transform = 'scaleX(-1)';
                } else {
                    button.style.transform = 'scaleX(1)';
                }
            }
        });
    }
    
    /**
     * Check if current values are balanced and update icon accordingly
     * During simulation, uses current savings value instead of starting amount
     */
    checkBalance() {
        // Use current savings if simulation is running, otherwise use starting amount
        const isStartState = this.stateManager.get('isStartState');
        let baseAmount;

        if (isStartState) {
            // Not running: use starting amount from slider
            baseAmount = parseInt(this.elements.startAmountSlider.value);
        } else {
            // Running: use current savings value (starting amount + accumulated savings)
            baseAmount = Math.floor(this.stateManager.get('totalSavings'));
        }

        const currentInflation = parseFloat(this.elements.inflationSlider.value);
        const currentSavings = parseInt(this.elements.savingsSlider.value);

        // Get balance state from financial-math.js
        const balanceState = getBalanceState(baseAmount, currentSavings, currentInflation);

        // Update icon based on state
        if (balanceState === this.config.balanceStates.BALANCED) {
            // Balanced: show balance icon (no flip)
            this.setBalanceIcon(this.config.images.balance, false);
        } else if (balanceState === this.config.balanceStates.GROW) {
            // Growing: show tilted icon (no flip - tilts right)
            this.setBalanceIcon(this.config.images.balanceTilt, false);
        } else if (balanceState === this.config.balanceStates.SHRINK) {
            // Shrinking: show tilted icon (flipped - tilts left)
            this.setBalanceIcon(this.config.images.balanceTilt, true);
        }
    }
    
    /**
     * Setup event listeners for all three sliders
     */
    setupSliderListeners() {
        // Starting Amount slider
        if (this.elements.startAmountSlider) {
            this.elements.startAmountSlider.addEventListener('input', (e) => {
                this.handleStartAmountChange(e);
            });
        }
        
        // Inflation slider
        if (this.elements.inflationSlider) {
            this.elements.inflationSlider.addEventListener('input', (e) => {
                this.handleInflationChange(e);
            });
        }
        
        // Monthly Savings slider
        if (this.elements.savingsSlider) {
            this.elements.savingsSlider.addEventListener('input', (e) => {
                this.handleSavingsChange(e);
            });
        }
    }
    
    /**
     * Handle Starting Amount slider change
     * @param {Event} e - Input event
     */
    handleStartAmountChange(e) {
        const newValue = parseInt(e.target.value);

        // Update display value
        if (this.elements.startAmountValue) {
            this.elements.startAmountValue.textContent = newValue;
        }

        // Don't reset if simulation is finished (wait for manual restart)
        const isFinished = this.stateManager.get('isSimulationFinished');
        if (isFinished) {
            this.checkBalance();
            return;
        }

        // Only reset if value actually changed (prevent duplicate resets)
        if (this.stateManager) {
            const currentSavings = this.stateManager.get('totalSavings');
            // Only reset if the starting amount differs from current savings
            // (indicating this is a user slider move, not a balance button click that already reset)
            if (currentSavings !== newValue) {
                this.stateManager.reset(newValue);
            }
        }

        // Check balance state
        this.checkBalance();
    }
    
    /**
     * Handle Inflation slider change
     * @param {Event} e - Input event
     */
    handleInflationChange(e) {
        // Update display value
        if (this.elements.inflationValue) {
            this.elements.inflationValue.textContent = e.target.value;
        }
        
        // Update leak oval size (inflation visualization)
        if (window.displayManager) {
            window.displayManager.updateLeakOval();
        }
        
        // Check balance state
        this.checkBalance();
    }
    
    /**
     * Handle Monthly Savings slider change
     * @param {Event} e - Input event
     */
    handleSavingsChange(e) {
        // Update display value
        if (this.elements.savingsValue) {
            this.elements.savingsValue.textContent = e.target.value;
        }
        
        // Check balance state
        this.checkBalance();
    }
    
    /**
     * Setup event listeners for all three balance buttons
     */
    setupBalanceButtonListeners() {
        // Balance button for Starting Amount
        if (this.elements.balanceStartAmount) {
            this.elements.balanceStartAmount.addEventListener('click', () => {
                this.handleBalanceStartAmount();
            });
        }
        
        // Balance button for Monthly Savings
        if (this.elements.balanceSavings) {
            this.elements.balanceSavings.addEventListener('click', () => {
                this.handleBalanceSavings();
            });
        }
        
        // Balance button for Inflation
        if (this.elements.balanceInflation) {
            this.elements.balanceInflation.addEventListener('click', () => {
                this.handleBalanceInflation();
            });
        }
    }
    
    /**
     * Handle Balance Starting Amount button click
     * Calculates optimal starting amount based on current savings and inflation
     */
    handleBalanceStartAmount() {
        // Don't reset if simulation is finished (wait for manual restart)
        const isFinished = this.stateManager.get('isSimulationFinished');
        if (isFinished) return;

        const monthlySavings = parseInt(this.elements.savingsSlider.value);
        const annualInflationPercent = parseFloat(this.elements.inflationSlider.value);

        // Calculate balanced amount using financial-math.js function
        const calculatedAmount = calculateBalancedStartAmount(monthlySavings, annualInflationPercent);

        // Set all buttons to balanced icon immediately (no flip)
        this.setBalanceIcon(this.config.images.balance, false);

        // Set the slider value
        this.elements.startAmountSlider.value = calculatedAmount;

        // Trigger input event to update settingsCache and display
        this.elements.startAmountSlider.dispatchEvent(new Event('input', { bubbles: true }));

        // IMPORTANT: Reset state manager with calculated value directly
        // Don't rely on settingsCache being updated yet (race condition)
        if (this.stateManager) {
            this.stateManager.reset(calculatedAmount);
        }
    }
    
    /**
     * Handle Balance Monthly Savings button click
     * Calculates optimal monthly savings based on current starting amount and inflation
     * During simulation, uses current savings value instead of starting amount
     */
    handleBalanceSavings() {
        // Use current savings if simulation is running, otherwise use starting amount
        const isStartState = this.stateManager.get('isStartState');
        let baseAmount;

        if (isStartState) {
            // Not running: use starting amount from slider
            baseAmount = parseInt(this.elements.startAmountSlider.value);
        } else {
            // Running: use current savings value (starting amount + accumulated savings)
            baseAmount = Math.floor(this.stateManager.get('totalSavings'));
        }

        const annualInflationPercent = parseFloat(this.elements.inflationSlider.value);

        // Calculate balanced savings using financial-math.js function
        const calculatedSavings = calculateBalancedSavings(baseAmount, annualInflationPercent);

        // Set all buttons to balanced icon immediately (no flip)
        this.setBalanceIcon(this.config.images.balance, false);

        // Set the slider value
        this.elements.savingsSlider.value = calculatedSavings;

        // Trigger input event to update settingsCache
        this.elements.savingsSlider.dispatchEvent(new Event('input', { bubbles: true }));

        // Display value is updated by the input event listener
    }
    
    /**
     * Handle Balance Inflation button click
     * Calculates optimal inflation rate based on current starting amount and savings
     * During simulation, uses current savings value instead of starting amount
     */
    handleBalanceInflation() {
        // Use current savings if simulation is running, otherwise use starting amount
        const isStartState = this.stateManager.get('isStartState');
        let baseAmount;

        if (isStartState) {
            // Not running: use starting amount from slider
            baseAmount = parseInt(this.elements.startAmountSlider.value);
        } else {
            // Running: use current savings value (starting amount + accumulated savings)
            baseAmount = Math.floor(this.stateManager.get('totalSavings'));
        }

        const monthlySavings = parseInt(this.elements.savingsSlider.value);

        // Calculate balanced inflation using financial-math.js function
        const calculatedInflation = calculateBalancedInflation(baseAmount, monthlySavings);

        // Set all buttons to balanced icon immediately (no flip)
        this.setBalanceIcon(this.config.images.balance, false);

        // Set the slider value
        this.elements.inflationSlider.value = calculatedInflation;

        // Trigger input event to update settingsCache
        this.elements.inflationSlider.dispatchEvent(new Event('input', { bubbles: true }));

        // Display value is updated by the input event listener
    }
    
    /**
     * Get current slider values
     * @returns {Object} Object with startAmount, inflation, savings
     */
    getValues() {
        return {
            startAmount: parseInt(this.elements.startAmountSlider.value),
            inflation: parseFloat(this.elements.inflationSlider.value),
            savings: parseInt(this.elements.savingsSlider.value)
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.BalanceController = BalanceController;
}

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BalanceController };
}
