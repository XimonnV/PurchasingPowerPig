/**
 * Purchasing Power Pig - Animation Module (Refactored)
 * 
 * Handles animation rendering, drop physics, and visual updates.
 * Display updates delegated to display-manager.js
 * Visual effects delegated to effect-manager.js
 * State management delegated to state-manager.js
 * Calculations delegated to financial-math.js
 * Settings read from settingsCache (dom-cache.js)
 * Constants from config.js
 * Viewport/scaling managed by viewport-manager.js
 * 
 * Dependencies (must be loaded in order):
 * 1. config.js
 * 2. financial-math.js
 * 3. dom-cache.js
 * 4. state-manager.js
 * 5. viewport-manager.js
 * 6. display-manager.js (+ all handlers)
 * 7. effect-manager.js
 */

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
// DROP CLASS
// ============================================================================

/**
 * Drop class - represents a falling money drop
 */
class Drop {
    constructor(startX, startY, size, target = 'pig') {
        this.x = startX;
        this.y = startY;
        this.size = size;
        // Scale falling speed based on viewport scale
        const scaleFactor = getScaleFactor();
        this.speed = (CONFIG.drop.minSpeed + Math.random() * CONFIG.drop.maxSpeedVariation) * scaleFactor;
        this.target = target; // 'pig' or 'mug'
        this.dollarAmount = 0; // Will be set externally
        this.element = this.createElement();
    }

    createElement() {
        const drop = document.createElement('div');
        drop.className = CONFIG.cssClasses.moneyDrop;
        drop.style.left = this.x + 'px';
        drop.style.top = this.y + 'px';
        drop.style.width = this.size + 'px';
        drop.style.height = (this.size * 1.5) + 'px';
        document.body.appendChild(drop);
        return drop;
    }

    update() {
        this.y += this.speed;
        this.element.style.top = this.y + 'px';

        if (this.target === 'pig') {
            return this.updatePigTarget();
        } else if (this.target === 'mug') {
            return this.updateMugTarget();
        }
        
        return true;
    }
    
    updatePigTarget() {
        // Check if drop reached the oval container
        const oval = document.querySelector(CONFIG.selectors.pigOvalContainer);
        if (!oval) return true;

        const ovalRect = oval.getBoundingClientRect();
        const fillLevel = stateManager.get('fillLevel');
        
        // Calculate current fill level position in oval
        const fillHeight = (fillLevel / 100) * ovalRect.height;
        const waterSurfaceY = ovalRect.bottom - fillHeight;

        // Check if drop hits the water surface (or bottom of empty container)
        const targetY = fillLevel > 0 ? waterSurfaceY : ovalRect.bottom - CONFIG.collision.emptyContainerOffset;

        if (this.y >= targetY - this.size / 2) {
            // Add monthly savings when drop lands (pig grows)
            stateManager.addMonthlySavingsToPig();
            
            // Advance month
            stateManager.advanceMonth();
            
            // Schedule inflation 500ms later
            setTimeout(() => {
                // Calculate and apply monthly inflation immediately
                const monthlyRate = stateManager.getMonthlyInflationRate();
                const currentFillLevel = stateManager.get('fillLevel');
                const inflationReduction = currentFillLevel * monthlyRate; // percentage points
                const inflationDollars = fillPercentageToDollars(inflationReduction, 'pig');
                
                // Apply inflation immediately (pig shrinks now)
                if (inflationReduction > 0) {
                    stateManager.updateFillLevel(currentFillLevel - inflationReduction);
                }
                
                // Create inflation drop (purely visual - value already applied)
                if (inflationDollars > 0) {
                    createInflationDrop(inflationDollars);
                }
            }, CONFIG.INFLATION_DELAY_MS);
            
            // Create ripple effect
            if (window.effectManager) {
                window.effectManager.createRipple(oval, CONFIG.cssClasses.pigRipple);
            }
            
            // Remove drop
            this.element.remove();
            return false;
        }
        
        return true;
    }
    
    updateMugTarget() {
        // Check if drop reached the banker's mug
        const mug = document.querySelector(CONFIG.selectors.bankerMugContainer);
        if (!mug) return true;

        const mugRect = mug.getBoundingClientRect();
        const mugFillLevel = stateManager.get('mugFillLevel');
        
        // Calculate current fill level position in mug
        const fillHeight = (mugFillLevel / 100) * mugRect.height;
        const waterSurfaceY = mugRect.bottom - fillHeight;

        // Check if drop hits the water surface (or bottom of empty container)
        const targetY = mugFillLevel > 0 ? waterSurfaceY : mugRect.bottom - CONFIG.collision.emptyContainerOffset;

        if (this.y >= targetY - this.size / 2) {
            // Add inflation loss to banker's mug
            stateManager.addInflationLossToMug(this.dollarAmount);
            
            // Create ripple effect
            if (window.effectManager) {
                window.effectManager.createRipple(mug, CONFIG.cssClasses.mugRipple);
            }
            
            // Remove drop
            this.element.remove();
            return false;
        }
        
        return true;
    }
}

// ============================================================================
// DROP CREATION
// ============================================================================

/**
 * Calculate drop size based on dollar amount
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

/**
 * Create a new savings drop
 */
function createDrop() {
    const savings = stateManager.getMonthlySavings();
    
    // No drop if savings is 0
    if (savings === 0) return;

    // Calculate drop size using helper function
    const size = calculateDropSize(savings);

    // Get pig and oval position
    const oval = document.querySelector(CONFIG.selectors.pigOvalContainer);
    if (!oval) return;

    const ovalRect = oval.getBoundingClientRect();
    const dropX = ovalRect.left + ovalRect.width / 2 - size / 2;
    const dropY = 0;

    const drop = new Drop(dropX, dropY, size, 'pig');
    stateManager.addDrop(drop);
}

/**
 * Create an inflation drop (falls from pig to banker's mug)
 * 
 * @param {number} dollarAmount - Dollar amount this drop represents
 */
function createInflationDrop(dollarAmount) {
    if (dollarAmount <= 0) return;

    // Calculate drop size using helper function
    const size = calculateDropSize(dollarAmount);

    // Get pig oval position - drop starts from bottom
    const oval = document.querySelector(CONFIG.selectors.pigOvalContainer);
    if (!oval) return;

    const ovalRect = oval.getBoundingClientRect();
    const dropX = ovalRect.left + ovalRect.width / 2 - size / 2;
    const dropY = ovalRect.bottom;

    const drop = new Drop(dropX, dropY, size, 'mug');
    drop.dollarAmount = dollarAmount;
    stateManager.addDrop(drop);
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

/**
 * Main animation loop
 */
function animate(timestamp) {
    const isPaused = stateManager.get('isPaused');
    
    // Skip updates if paused
    if (!isPaused) {
        // Update all drops and filter out completed ones
        const drops = stateManager.get('drops');
        const activeDrops = drops.filter(drop => drop.update());
        
        // Only update state if drops changed
        if (activeDrops.length !== drops.length) {
            stateManager.setState({ drops: activeDrops });
        }
    }

    requestAnimationFrame(animate);
}

/**
 * Interval timer for creating savings drops (every 1000ms)
 */
let savingsDropInterval = null;

/**
 * Start the savings drop interval timer
 */
function startSavingsDropTimer() {
    // Clear any existing interval
    if (savingsDropInterval) {
        clearInterval(savingsDropInterval);
    }
    
    // Create savings drops every 1000ms
    savingsDropInterval = setInterval(() => {
        if (!stateManager.get('isPaused')) {
            createDrop();
        }
    }, CONFIG.DROP_INTERVAL_MS);
}

/**
 * Stop the savings drop interval timer
 */
function stopSavingsDropTimer() {
    if (savingsDropInterval) {
        clearInterval(savingsDropInterval);
        savingsDropInterval = null;
    }
}

// ============================================================================
// STATE CHANGE SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to pause state changes to control the savings drop timer
 */
function setupTimingSubscription() {
    // Start/stop savings drop timer based on pause state
    stateManager.subscribe('isPaused', () => {
        const isPaused = stateManager.get('isPaused');
        if (isPaused) {
            stopSavingsDropTimer();
        } else {
            startSavingsDropTimer();
        }
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Global references (initialized in DOMContentLoaded)
let viewportManager = null;
let displayManager = null;
let effectManager = null;

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
    
    // 5. Setup timing subscription (pause/resume)
    setupTimingSubscription();
    
    // 6. Initialize state from starting amount
    stateManager.initializeFromStartingAmount();
    
    // 7. Update all displays to match initial state
    displayManager.updateAllDisplays();
    
    // 8. Start animation loop (for drop physics)
    requestAnimationFrame(animate);
    
    // 9. Only start simulation if not in start state
    const isStartState = stateManager.get('isStartState');
    if (!isStartState) {
        startSimulation();
    }
    
    // 10. Expose managers globally for access by other modules
    window.displayManager = displayManager;
    window.effectManager = effectManager;
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
    createDrop();
    
    // Start interval timer for subsequent savings drops (every 1000ms)
    startSavingsDropTimer();
}

// Expose globally for HTML to call when exiting start state
window.startSimulation = startSimulation;

// ============================================================================
// LEGACY COMPATIBILITY (for backwards compatibility)
// ============================================================================

/**
 * Legacy reset function (delegates to state manager)
 */
function resetPigFill() {
    stateManager.reset();
    // Create first savings drop
    createDrop();
    // Restart the savings drop interval timer
    startSavingsDropTimer();
}

/**
 * Legacy initialize function (delegates to state manager)
 */
function initializeFromStartingAmount() {
    stateManager.initializeFromStartingAmount();
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
