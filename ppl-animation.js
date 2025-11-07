/**
 * Purchasing Power Pig - Animation Module (Refactored Sprint 2)
 *
 * Simplified coordination layer for the animation system.
 * Drop system now split into focused modules:
 * - drop-physics.js: Pure physics model
 * - drop-renderer.js: Pure DOM rendering
 * - liquid-container.js: Container abstraction
 * - drop-controller.js: Drop orchestration
 * - animation-engine.js: Animation loop
 * - timing-manager.js: Drop interval timing
 * - simulation-manager.js: Business logic
 *
 * This file now primarily handles:
 * - Initialization and coordination
 * - Drop creation logic
 * - Integration between modules
 *
 * Dependencies (must be loaded in order):
 * 1. config.js
 * 2. financial-math.js
 * 3. dom-cache.js
 * 4. state-manager.js
 * 5. viewport-manager.js
 * 6. display-manager.js (+ all handlers)
 * 7. effect-manager.js
 * 8. drop-physics.js
 * 9. drop-renderer.js
 * 10. liquid-container.js
 * 11. drop-controller.js
 * 12. animation-engine.js
 * 13. timing-manager.js
 * 14. simulation-manager.js
 */

// ============================================================================
// MODULE INSTANCES (initialized in DOMContentLoaded)
// ============================================================================

let viewportManager = null;
let displayManager = null;
let effectManager = null;
let animationEngine = null;
let timingManager = null;
let simulationManager = null;
let pigContainer = null;
let mugContainer = null;

// ============================================================================
// VIEWPORT UTILITIES
// ============================================================================

/**
 * Get the current scale factor from CSS
 * This reads the --scale CSS variable set by ViewportManager
 */
function getScaleFactor() {
    const scale = getComputedStyle(document.documentElement).getPropertyValue('--scale').trim();
    return parseFloat(scale) || 1;
}

// ============================================================================
// DROP SIZE CALCULATION
// ============================================================================

/**
 * Calculate drop size based on dollar amount
 * @param {number} amount - Dollar amount
 * @returns {number} Drop size in pixels (scaled)
 */
function calculateDropSize(amount) {
    let size;
    if (amount <= CONFIG.drop.smallAmountThreshold) {
        size = CONFIG.drop.smallAmountBase + amount * CONFIG.drop.smallAmountScale;
    } else {
        size = CONFIG.drop.largeAmountBase + (amount - CONFIG.drop.largeAmountOffset) * CONFIG.drop.largeAmountScale;
    }

    // Apply viewport scale factor
    const scaleFactor = getScaleFactor();
    return size * scaleFactor;
}

// ============================================================================
// DROP CREATION
// ============================================================================

/**
 * Create a new savings drop (falls from top to pig)
 */
function createSavingsDrop() {
    const savings = stateManager.getMonthlySavings();

    // No drop if savings is 0
    if (savings === 0) return;

    // Calculate drop size
    const size = calculateDropSize(savings);

    // Get drop spawn position from pig container
    const spawnPos = pigContainer.getDropSpawnPosition(size);
    if (!spawnPos) return;

    // Create drop components
    const physics = new DropPhysics(spawnPos.x, spawnPos.y,
        (CONFIG.drop.minSpeed + Math.random() * CONFIG.drop.maxSpeedVariation) * getScaleFactor()
    );
    const renderer = new DropRenderer(physics, size, CONFIG);

    // Create drop controller with landing callback
    const controller = new DropController(physics, renderer, pigContainer, size, {
        onLand: (ctrl) => {
            // Add monthly savings when drop lands
            simulationManager.addMonthlySavingsToPig();

            // Advance month
            simulationManager.advanceMonth();

            // Schedule inflation 500ms later
            setTimeout(() => {
                // Apply inflation and get dollar amount lost
                const inflationDollars = simulationManager.applyMonthlyInflation();

                // Create visual inflation drop
                if (inflationDollars > 0) {
                    createInflationDrop(inflationDollars);
                }
            }, CONFIG.INFLATION_DELAY_MS);

            // Create ripple effect
            const containerElement = pigContainer.getElement();
            if (containerElement && effectManager) {
                effectManager.createRipple(containerElement, CONFIG.cssClasses.pigRipple);
            }
        }
    });

    // Add to animation engine
    animationEngine.addDrop(controller);
}

/**
 * Create an inflation drop (falls from pig to banker's mug)
 * @param {number} dollarAmount - Dollar amount this drop represents
 */
function createInflationDrop(dollarAmount) {
    if (dollarAmount <= 0) return;

    // Calculate drop size
    const size = calculateDropSize(dollarAmount);

    // Get pig container bottom as starting point
    const pigBounds = pigContainer.getBounds();
    if (!pigBounds) return;

    const dropX = pigBounds.left + (pigBounds.width / 2) - (size / 2);
    const dropY = pigBounds.bottom;

    // Create drop components
    const physics = new DropPhysics(dropX, dropY,
        (CONFIG.drop.minSpeed + Math.random() * CONFIG.drop.maxSpeedVariation) * getScaleFactor()
    );
    const renderer = new DropRenderer(physics, size, CONFIG);

    // Create drop controller with landing callback
    const controller = new DropController(physics, renderer, mugContainer, size, {
        onLand: (ctrl) => {
            // Add inflation loss to banker's mug
            const amount = ctrl.getDollarAmount();
            simulationManager.addInflationLossToMug(amount);

            // Create ripple effect
            const containerElement = mugContainer.getElement();
            if (containerElement && effectManager) {
                effectManager.createRipple(containerElement, CONFIG.cssClasses.mugRipple);
            }
        }
    });

    // Set dollar amount on controller
    controller.setDollarAmount(dollarAmount);

    // Add to animation engine
    animationEngine.addDrop(controller);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize ViewportManager
    viewportManager = new ViewportManager(CONFIG, stateManager);
    viewportManager.initialize();

    // 2. Ensure SettingsCache is initialized
    if (window.settingsCache && !window.settingsCache.initialized) {
        window.settingsCache.initialize();
    }

    // 3. Initialize DisplayManager (sets up all display handlers and subscriptions)
    displayManager = new DisplayManager(CONFIG, stateManager);
    displayManager.initialize();

    // 4. Initialize EffectManager (handles visual effects like ripples)
    effectManager = new EffectManager(CONFIG);

    // 5. Initialize SimulationManager (business logic)
    simulationManager = new SimulationManager(CONFIG, stateManager);

    // 6. Initialize liquid containers
    pigContainer = new LiquidContainer(
        CONFIG.selectors.pigOvalContainer,
        'fillLevel',
        CONFIG,
        stateManager
    );
    mugContainer = new LiquidContainer(
        CONFIG.selectors.bankerMugContainer,
        'mugFillLevel',
        CONFIG,
        stateManager
    );

    // 7. Initialize AnimationEngine
    animationEngine = new AnimationEngine(stateManager);
    animationEngine.start();

    // 8. Initialize TimingManager (creates drops every 1000ms)
    timingManager = new TimingManager(CONFIG, stateManager, createSavingsDrop);

    // 9. Initialize state from starting amount
    simulationManager.initializeFromStartingAmount();

    // 10. Update all displays to match initial state
    displayManager.updateAllDisplays();

    // 11. Only start simulation if not in start state
    const isStartState = stateManager.get('isStartState');
    if (!isStartState) {
        startSimulation();
    }

    // 12. Expose managers globally for debugging and external access
    window.displayManager = displayManager;
    window.effectManager = effectManager;
    window.animationEngine = animationEngine;
    window.timingManager = timingManager;
    window.simulationManager = simulationManager;
    window.pigContainer = pigContainer;
    window.mugContainer = mugContainer;
});

// ============================================================================
// SIMULATION START
// ============================================================================

/**
 * Start the simulation (create first drop and start timer)
 * Called either on initialization (if not in start state) or when user exits start state
 */
function startSimulation() {
    // Create first savings drop
    createSavingsDrop();

    // Start timing manager (creates drops every 1000ms)
    timingManager.start();
}

// Expose globally for HTML to call when exiting start state
window.startSimulation = startSimulation;

// ============================================================================
// LEGACY COMPATIBILITY (for backwards compatibility)
// ============================================================================

/**
 * Legacy reset function (delegates to simulation manager and animation engine)
 */
function resetPigFill() {
    // Clear all active drops
    animationEngine.clearAllDrops();

    // Reset simulation
    simulationManager.reset();

    // Create first savings drop
    createSavingsDrop();

    // Restart timing manager
    timingManager.stop();
    timingManager.start();
}

/**
 * Legacy initialize function (delegates to simulation manager)
 */
function initializeFromStartingAmount() {
    simulationManager.initializeFromStartingAmount();
}

/**
 * Legacy toggle pause function (delegates to state manager)
 */
function togglePause() {
    const isPaused = stateManager.togglePause();

    // Reset lastDropTime to prevent burst of drops on resume
    if (!isPaused) {
        stateManager.updateLastDropTime(performance.now());
    }

    // UI update happens automatically via isPaused subscription
}

// Expose legacy functions globally for backwards compatibility
window.resetPigFill = resetPigFill;
window.initializeFromStartingAmount = initializeFromStartingAmount;
window.togglePause = togglePause;
