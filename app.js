/**
 * PurchasingPowerPigApp - Main Application Controller
 *
 * Single entry point for the Purchasing Power Pig application.
 * Initializes all modules in correct dependency order and provides a high-level API.
 *
 * Responsibilities:
 * - Initialize all managers and controllers
 * - Coordinate module dependencies
 * - Provide high-level API (start, pause, resume, restart)
 * - Expose managers for debugging
 *
 * Dependencies:
 * - All other modules (loaded before this)
 *
 * Example:
 * ```javascript
 * const app = new PurchasingPowerPigApp();
 * app.initialize();
 *
 * // High-level API
 * app.pause();
 * app.resume();
 * app.restart();
 * ```
 */
class PurchasingPowerPigApp {
    constructor() {
        // Configuration
        this.config = CONFIG;

        // Core managers (initialized in initialize())
        this.stateManager = null;
        this.settingsCache = null;
        this.viewportManager = null;
        this.displayManager = null;
        this.effectManager = null;
        this.simulationManager = null;

        // Drop system
        this.pigContainer = null;
        this.mugContainer = null;
        this.animationEngine = null;
        this.timingManager = null;

        // UI controllers
        this.balanceController = null;
        this.startStateController = null;

        // Session tracking (increments on restart to invalidate pending callbacks)
        this.sessionId = 0;

        // Initialization state
        this.initialized = false;
    }

    /**
     * Initialize the application
     * Sets up all modules in correct dependency order
     */
    initialize() {
        if (this.initialized) {
            console.warn('PurchasingPowerPigApp already initialized');
            return;
        }

        console.log('🚀 Initializing Purchasing Power Pig...');

        // 1. Core state and DOM cache
        this.stateManager = window.stateManager;
        this.domCache = window.domCache;

        if (!this.stateManager) {
            throw new Error('StateManager not found. Ensure state-manager.js is loaded.');
        }

        if (!this.domCache) {
            throw new Error('DOMCache not found. Ensure dom-cache.js is loaded.');
        }

        console.log('  → StateManager found:', !!this.stateManager);
        console.log('  → DOMCache found:', !!this.domCache);

        // 2. Initialize DOMCache (includes settings cache)
        if (!this.domCache.initialized) {
            this.domCache.initialize();
            console.log('✓ DOMCache initialized (elements + settings)');
        } else {
            console.log('✓ DOMCache already initialized');
        }

        // 3. Initialize ViewportManager
        this.viewportManager = new ViewportManager(this.config, this.stateManager);
        this.viewportManager.initialize();
        console.log('✓ ViewportManager initialized');

        // 4. Initialize DisplayManager (sets up all display handlers and subscriptions)
        this.displayManager = new DisplayManager(this.config, this.stateManager);
        this.displayManager.initialize();
        console.log('✓ DisplayManager initialized');

        // 5. Initialize EffectManager
        this.effectManager = new EffectManager(this.config);
        console.log('✓ EffectManager initialized');

        // 6. Initialize SimulationManager
        this.simulationManager = new SimulationManager(this.config, this.stateManager);
        console.log('✓ SimulationManager initialized');

        // 7. Initialize liquid containers
        this.pigContainer = new LiquidContainer(
            this.config.selectors.pigOvalContainer,
            'fillLevel',
            this.config,
            this.stateManager
        );
        this.mugContainer = new LiquidContainer(
            this.config.selectors.bankerMugContainer,
            'mugFillLevel',
            this.config,
            this.stateManager
        );
        console.log('✓ Liquid containers initialized');

        // 8. Initialize AnimationEngine
        this.animationEngine = new AnimationEngine(this.stateManager);
        this.animationEngine.start();
        console.log('✓ AnimationEngine started');

        // 9. Initialize TimingManager (creates drops every 1000ms)
        this.timingManager = new TimingManager(
            this.config,
            this.stateManager,
            () => this.createSavingsDrop()
        );
        console.log('✓ TimingManager initialized');

        // 10. Initialize UI Controllers
        this.balanceController = new BalanceController(this.config, this.stateManager);
        this.balanceController.initialize();
        console.log('✓ BalanceController initialized');

        this.startStateController = new StartStateController(this.config, this.stateManager, this);
        this.startStateController.initialize();
        console.log('✓ StartStateController initialized');

        // 11. Initialize simulation state from starting amount
        this.simulationManager.initializeFromStartingAmount();
        console.log('✓ Simulation state initialized');

        // 12. Update all displays to match initial state
        this.displayManager.updateAllDisplays();
        console.log('✓ Initial display update complete');

        // 13. Start simulation if not in start state
        const isStartState = this.stateManager.get('isStartState');
        console.log('  → isStartState:', isStartState);

        if (!isStartState) {
            this.start();
            console.log('✓ Simulation started (not in start state)');
        } else {
            console.log('✓ In start state - simulation will start on user action');
        }

        // Mark as initialized
        this.initialized = true;

        // Expose managers globally for debugging
        this.exposeForDebugging();

        console.log('✅ Purchasing Power Pig initialized successfully!');
    }

    /**
     * Expose managers globally for debugging and external access
     */
    exposeForDebugging() {
        // Note: window.app is set in index.html after initialization
        window.displayManager = this.displayManager;
        window.effectManager = this.effectManager;
        window.animationEngine = this.animationEngine;
        window.timingManager = this.timingManager;
        window.simulationManager = this.simulationManager;
        window.pigContainer = this.pigContainer;
        window.mugContainer = this.mugContainer;
        window.balanceController = this.balanceController;
        window.startStateController = this.startStateController;

        console.log('✓ Managers exposed globally for debugging');
    }

    // ========================================================================
    // HIGH-LEVEL API
    // ========================================================================

    /**
     * Start the simulation
     * Creates first drop after configured delay, then starts timing manager for subsequent drops
     */
    start() {
        if (!this.initialized) {
            throw new Error('App not initialized. Call initialize() first.');
        }

        // Increment session ID to invalidate any pending callbacks from previous session
        this.sessionId++;

        // Create first savings drop after initial delay
        setTimeout(() => {
            this.createSavingsDrop();
            // Start timing manager after first drop (for subsequent drops)
            this.timingManager.start();
        }, this.config.INITIAL_DROP_DELAY_MS);
    }

    /**
     * Pause the simulation
     */
    pause() {
        if (!this.initialized) return;
        this.stateManager.setPaused(true);
    }

    /**
     * Resume the simulation
     */
    resume() {
        if (!this.initialized) return;
        this.stateManager.setPaused(false);
    }

    /**
     * Toggle pause state
     * @returns {boolean} New pause state
     */
    togglePause() {
        if (!this.initialized) return false;

        const isPaused = this.stateManager.togglePause();

        // Reset lastDropTime to prevent burst of drops on resume
        if (!isPaused) {
            this.stateManager.updateLastDropTime(performance.now());
        }

        return isPaused;
    }

    /**
     * Restart the simulation
     * Clears all drops, resets to initial state, then creates first drop after configured delay
     */
    restart() {
        if (!this.initialized) return;

        // Increment session ID to invalidate any pending callbacks (e.g., scheduled inflation drops)
        this.sessionId++;

        // Clear all active drops
        this.animationEngine.clearAllDrops();

        // Reset simulation
        this.simulationManager.reset();

        // Stop timing manager
        this.timingManager.stop();

        // Create first savings drop after initial delay
        setTimeout(() => {
            this.createSavingsDrop();
            // Restart timing manager after first drop (for subsequent drops)
            this.timingManager.start();
        }, this.config.INITIAL_DROP_DELAY_MS);
    }

    // ========================================================================
    // DROP CREATION
    // ========================================================================

    /**
     * Calculate drop size based on dollar amount
     * @param {number} amount - Dollar amount
     * @returns {number} Drop size in pixels (scaled)
     */
    calculateDropSize(amount) {
        let size;
        if (amount <= this.config.drop.smallAmountThreshold) {
            size = this.config.drop.smallAmountBase + amount * this.config.drop.smallAmountScale;
        } else {
            size = this.config.drop.largeAmountBase +
                (amount - this.config.drop.largeAmountOffset) * this.config.drop.largeAmountScale;
        }

        // Apply viewport scale factor
        const scaleFactor = this.getScaleFactor();
        return size * scaleFactor;
    }

    /**
     * Get the current scale factor from CSS
     * @returns {number} Scale factor
     */
    getScaleFactor() {
        const scale = getComputedStyle(document.documentElement)
            .getPropertyValue('--scale').trim();
        return parseFloat(scale) || 1;
    }

    /**
     * Create a new savings drop (falls from top to pig)
     */
    createSavingsDrop() {
        const savings = this.stateManager.getMonthlySavings();

        // No drop if savings is 0
        if (savings === 0) return;

        // Calculate drop size
        const size = this.calculateDropSize(savings);

        // Get drop spawn position from pig container
        const spawnPos = this.pigContainer.getDropSpawnPosition(size);
        if (!spawnPos) return;

        // Create drop components
        const physics = new DropPhysics(
            spawnPos.x,
            spawnPos.y,
            (this.config.drop.minSpeed + Math.random() * this.config.drop.maxSpeedVariation) *
                this.getScaleFactor()
        );
        const renderer = new DropRenderer(physics, size, this.config);

        // Create drop controller with landing callback
        const controller = new DropController(physics, renderer, this.pigContainer, size, {
            onLand: (ctrl) => {
                // Add monthly savings when drop lands
                this.simulationManager.addMonthlySavingsToPig();

                // Advance month
                this.simulationManager.advanceMonth();

                // Capture current session ID to check if restart happened before inflation triggers
                const currentSessionId = this.sessionId;

                // Schedule inflation 500ms later
                setTimeout(() => {
                    // Check if session is still valid (no restart happened)
                    if (this.sessionId !== currentSessionId) {
                        // Session changed (restart was called), skip this inflation drop
                        return;
                    }

                    // Apply inflation and get dollar amount lost
                    const inflationDollars = this.simulationManager.applyMonthlyInflation();

                    // Create visual inflation drop
                    if (inflationDollars > 0) {
                        this.createInflationDrop(inflationDollars);
                    }
                }, this.config.INFLATION_DELAY_MS);

                // Create ripple effect
                const containerElement = this.pigContainer.getElement();
                if (containerElement && this.effectManager) {
                    this.effectManager.createRipple(containerElement, this.config.cssClasses.pigRipple);
                }
            }
        });

        // Add to animation engine
        this.animationEngine.addDrop(controller);
    }

    /**
     * Create an inflation drop (falls from pig to banker's mug)
     * @param {number} dollarAmount - Dollar amount this drop represents
     */
    createInflationDrop(dollarAmount) {
        if (dollarAmount <= 0) return;

        // Calculate drop size
        const size = this.calculateDropSize(dollarAmount);

        // Get pig container bottom as starting point
        const pigBounds = this.pigContainer.getBounds();
        if (!pigBounds) return;

        const dropX = pigBounds.left + (pigBounds.width / 2) - (size / 2);
        const dropY = pigBounds.bottom;

        // Create drop components
        const physics = new DropPhysics(
            dropX,
            dropY,
            (this.config.drop.minSpeed + Math.random() * this.config.drop.maxSpeedVariation) *
                this.getScaleFactor()
        );
        const renderer = new DropRenderer(physics, size, this.config);

        // Create drop controller with landing callback
        const controller = new DropController(physics, renderer, this.mugContainer, size, {
            onLand: (ctrl) => {
                // Add inflation loss to banker's mug
                const amount = ctrl.getDollarAmount();
                this.simulationManager.addInflationLossToMug(amount);

                // Create ripple effect
                const containerElement = this.mugContainer.getElement();
                if (containerElement && this.effectManager) {
                    this.effectManager.createRipple(containerElement, this.config.cssClasses.mugRipple);
                }
            }
        });

        // Set dollar amount on controller
        controller.setDollarAmount(dollarAmount);

        // Add to animation engine
        this.animationEngine.addDrop(controller);
    }

    // ========================================================================
    // GETTERS (for external access)
    // ========================================================================

    /**
     * Get state manager
     * @returns {StateManager} State manager instance
     */
    getStateManager() {
        return this.stateManager;
    }

    /**
     * Get simulation manager
     * @returns {SimulationManager} Simulation manager instance
     */
    getSimulationManager() {
        return this.simulationManager;
    }

    /**
     * Get animation engine
     * @returns {AnimationEngine} Animation engine instance
     */
    getAnimationEngine() {
        return this.animationEngine;
    }

    /**
     * Check if app is initialized
     * @returns {boolean} True if initialized
     */
    isInitialized() {
        return this.initialized;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PurchasingPowerPigApp = PurchasingPowerPigApp;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PurchasingPowerPigApp };
}
