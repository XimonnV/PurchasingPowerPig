/**
 * Purchasing Power Pig - Animation Module
 * 
 * Handles animation rendering, drop physics, and visual updates.
 * All state management delegated to state-manager.js
 * All calculations delegated to financial-math.js
 * All settings read from settingsCache (dom-cache.js)
 * All constants from config.js
 * 
 * Dependencies (must be loaded in order):
 * 1. config.js
 * 2. financial-math.js
 * 3. dom-cache.js
 * 4. state-manager.js
 */

// ============================================================================
// VIEWPORT AND SCALING
// ============================================================================

// Track previous window dimensions for smart height updates
let previousWidth = window.innerWidth;
let previousHeight = window.innerHeight;

// svh support detection
let svhSupported = false;
let heightProbe = null;

/**
 * Create a hidden probe element to detect svh support and get pixel value
 */
function initializeHeightProbe() {
    heightProbe = document.createElement('div');
    heightProbe.style.cssText = 'position:fixed; top:-9999px; height:100svh; pointer-events:none;';
    document.body.appendChild(heightProbe);
    
    // Check if svh is supported
    const probeHeight = heightProbe.offsetHeight;
    svhSupported = probeHeight > 0 && probeHeight <= window.innerHeight;
    
    // Update state manager
    stateManager.updateViewport({ svhSupported, heightProbe });
}

/**
 * Get stable height (svh if supported, else fallback to innerHeight with min-lock)
 */
function getStableHeight(currentInnerHeight) {
    if (svhSupported && heightProbe) {
        const probeHeight = heightProbe.offsetHeight;
        if (probeHeight > 0 && probeHeight <= window.innerHeight) {
            return probeHeight;
        }
    }
    
    // Fallback: Use min-lock logic for browsers without svh support
    const widthChanged = window.innerWidth !== previousWidth;
    const heightDecreased = currentInnerHeight < previousHeight;
    
    let stableHeight = previousHeight;
    
    if (widthChanged || heightDecreased) {
        stableHeight = currentInnerHeight;
    }
    
    return stableHeight;
}

/**
 * Calculate and update window height based on actual available space
 * Returns the constrained height value
 */
function updateWindowHeight() {
    const currentHeight = window.innerHeight;
    const stableHeight = getStableHeight(currentHeight);
    
    document.documentElement.style.setProperty('--window-height', `${stableHeight}px`);
    
    // Update tracking variables
    previousWidth = window.innerWidth;
    previousHeight = currentHeight;
    
    // Update state manager
    stateManager.updateViewport({ 
        previousWidth, 
        previousHeight 
    });
    
    return stableHeight;
}

/**
 * Calculate and apply responsive scale based on viewport height
 */
function calculateAndApplyScale(height) {
    const viewportHeight = height !== undefined ? height : window.innerHeight;
    
    // Calculate scale: clamp between minScale and maxScale from CONFIG
    let scale = viewportHeight / CONFIG.layout.baseHeight;
    scale = Math.max(CONFIG.layout.minScale, Math.min(CONFIG.layout.maxScale, scale));
    
    // Apply scale to CSS variable
    document.documentElement.style.setProperty('--scale', scale);
    
    // Update state manager
    stateManager.updateViewport({ scale });
}

/**
 * Detect mobile portrait mode and adjust panel positions
 */
function adjustForMobile() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobilePortrait = (height / width) > CONFIG.layout.mobilePortraitRatio;
    
    const body = document.body;
    
    if (isMobilePortrait) {
        body.classList.add(CONFIG.cssClasses.mobileMode);
    } else {
        body.classList.remove(CONFIG.cssClasses.mobileMode);
    }
}

/**
 * Show scaled elements after scale is applied
 */
function showScaledElements() {
    const elements = document.querySelectorAll(CONFIG.selectors.scaledElements);
    elements.forEach(el => el.classList.add(CONFIG.cssClasses.ready));
}

/**
 * Debounce function to limit resize event frequency
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================================================
// DROP CLASS
// ============================================================================

/**
 * Get the current scale factor from CSS
 */
function getScaleFactor() {
    const scale = getComputedStyle(document.documentElement).getPropertyValue('--scale').trim();
    return parseFloat(scale) || 1;
}

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
            // Add monthly savings using state manager
            stateManager.addMonthlySavingsToPig();
            
            // Create ripple effect
            createRipple(oval, CONFIG.cssClasses.pigRipple);
            
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
            // Add inflation loss to mug using state manager
            stateManager.addInflationLossToMug(this.dollarAmount);
            
            // Create ripple effect
            createRipple(mug, CONFIG.cssClasses.mugRipple);
            
            // Remove drop
            this.element.remove();
            return false;
        }
        
        return true;
    }
}

// ============================================================================
// VISUAL EFFECTS
// ============================================================================

/**
 * Create a ripple effect on liquid surface
 * @param {HTMLElement} container - Container element for the ripple
 * @param {string} rippleClass - CSS class for ripple styling
 */
function createRipple(container, rippleClass) {
    const ripple = document.createElement('div');
    ripple.className = `${CONFIG.cssClasses.ripple} ${rippleClass}`;
    container.querySelector('.pig-oval-fill, .banker-mug-fill').appendChild(ripple);
    
    // Remove ripple after animation completes
    setTimeout(() => {
        ripple.remove();
    }, CONFIG.RIPPLE_DURATION_MS);
}

// ============================================================================
// DISPLAY UPDATES
// ============================================================================

/**
 * Update the visual fill level for pig
 */
function updateFillDisplay() {
    const fillElement = document.querySelector(CONFIG.selectors.pigOvalFill);
    const fillLevel = stateManager.get('fillLevel');
    
    if (fillElement) {
        fillElement.style.height = fillLevel + '%';
    }
    
    // Update pig percentage display
    const percentDisplay = document.getElementById(CONFIG.elementIds.pigPercentageDisplay);
    if (percentDisplay) {
        percentDisplay.textContent = Math.round(fillLevel) + '%';
        percentDisplay.style.display = fillLevel > 0 ? 'block' : 'none';
    }
    
    // Update debug display if visible
    const debugValue = document.getElementById(CONFIG.elementIds.debugFillValue);
    if (debugValue) {
        debugValue.textContent = fillLevel.toFixed(CONFIG.display.debugDecimalPlaces);
    }
}

/**
 * Update the mug fill level
 */
function updateMugFillDisplay() {
    const fillElement = document.querySelector(CONFIG.selectors.bankerMugFill);
    const mugFillLevel = stateManager.get('mugFillLevel');
    
    if (fillElement) {
        fillElement.style.height = mugFillLevel + '%';
    }
    
    // Update debug display
    const debugMugValue = document.getElementById(CONFIG.elementIds.debugMugValue);
    if (debugMugValue) {
        debugMugValue.textContent = mugFillLevel.toFixed(CONFIG.display.debugDecimalPlaces);
    }
}

/**
 * Update the savings amount display
 */
function updateSavingsDisplay() {
    const totalSavings = stateManager.get('totalSavings');
    const totalBankSavings = stateManager.get('totalBankSavings');
    
    const savingsValue = document.getElementById(CONFIG.elementIds.totalSavingsValue);
    if (savingsValue) {
        savingsValue.textContent = '$' + totalSavings.toLocaleString();
    }
    
    const bankValue = document.getElementById(CONFIG.elementIds.totalBankValue);
    if (bankValue) {
        const percentage = stateManager.getPurchasingPowerLostPercentage();
        bankValue.textContent = percentage + '%';
    }
    
    // Update debug display
    const debugBankDollars = document.getElementById(CONFIG.elementIds.debugBankDollars);
    if (debugBankDollars) {
        debugBankDollars.textContent = '$' + totalBankSavings.toLocaleString();
    }
}

/**
 * Update the date display
 */
function updateDateDisplay() {
    const dateValue = document.getElementById(CONFIG.elementIds.currentDateValue);
    if (dateValue) {
        dateValue.textContent = stateManager.getFormattedDate();
    }
}

/**
 * Update the PP (Purchasing Power) display
 */
function updatePPDisplay() {
    const ppStartDate = document.getElementById(CONFIG.elementIds.ppStartDate);
    const ppValue = document.getElementById(CONFIG.elementIds.ppValue);
    
    if (ppStartDate) {
        ppStartDate.textContent = stateManager.getFormattedStartDate();
    }
    
    if (ppValue) {
        ppValue.textContent = '$' + stateManager.getPPValue().toLocaleString();
    }
}

/**
 * Update the pause button UI based on current pause state
 */
function updatePauseButtonUI() {
    const isPaused = stateManager.get('isPaused');
    const pauseButton = document.getElementById(CONFIG.elementIds.pauseButton);
    
    if (pauseButton) {
        if (isPaused) {
            pauseButton.textContent = CONFIG.buttonText.resume;
            pauseButton.classList.add(CONFIG.cssClasses.paused);
        } else {
            pauseButton.textContent = CONFIG.buttonText.pause;
            pauseButton.classList.remove(CONFIG.cssClasses.paused);
        }
    }
}

/**
 * Update the info panel with the baseline date
 */
function updateInfoPanel() {
    const infoText = document.querySelector(CONFIG.selectors.infoText);
    if (infoText) {
        const now = new Date();
        const year = now.getFullYear();
        const month = CONFIG.display.monthNames[now.getMonth()];
        infoText.textContent = `A full pig equals the purchasing power of $${CONFIG.PIG_CAPACITY_DOLLARS.toLocaleString()} at ${year} ${month}`;
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
    
    // Create invisible drop if savings is 0
    const size = savings === 0 ? CONFIG.drop.invisibleDropSize : calculateDropSize(savings);

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
 */
function createInflationDrop(dollarAmount) {
    if (dollarAmount <= 0) return;

    // Calculate drop size
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
    const lastDropTime = stateManager.get('lastDropTime');
    
    // Skip updates if paused
    if (!isPaused) {
        // Create drops every DROP_INTERVAL_MS (1 month interval)
        if (timestamp - lastDropTime >= CONFIG.DROP_INTERVAL_MS) {
            // First apply monthly inflation to reduce fillLevel
            const inflationDollars = stateManager.applyMonthlyInflation();
            
            // Update visual display
            updateFillDisplay();
            
            // Create inflation drop if there's a reduction
            if (inflationDollars > 0) {
                // Small delay before inflation drop appears
                setTimeout(() => {
                    createInflationDrop(inflationDollars);
                }, CONFIG.INFLATION_DELAY_MS);
            }
            
            // Then create the savings drop
            createDrop();
            
            // Advance simulation date
            stateManager.advanceMonth();
            updateDateDisplay();
            
            // Update last drop time
            stateManager.updateLastDropTime(timestamp);
        }

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

// ============================================================================
// STATE CHANGE SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to state changes for automatic display updates
 */
function setupStateSubscriptions() {
    // Update fill display when fillLevel changes
    stateManager.subscribe('fillLevel', () => {
        updateFillDisplay();
        updatePPDisplay(); // PP value depends on fillLevel
    });
    
    // Update mug display when mugFillLevel changes
    stateManager.subscribe('mugFillLevel', () => {
        updateMugFillDisplay();
    });
    
    // Update savings display when totalSavings or totalBankSavings changes
    stateManager.subscribe('totalSavings', () => {
        updateSavingsDisplay();
    });
    
    stateManager.subscribe('totalBankSavings', () => {
        updateSavingsDisplay();
    });
    
    // Update date display when currentSimDate changes
    stateManager.subscribe('currentSimDate', () => {
        updateDateDisplay();
    });
    
    // Update PP display when simulationStartDate changes
    stateManager.subscribe('simulationStartDate', () => {
        updatePPDisplay();
    });
    
    // Update pause button UI when isPaused changes
    stateManager.subscribe('isPaused', () => {
        updatePauseButtonUI();
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize height probe early (before DOM ready)
initializeHeightProbe();

// Apply scale immediately when script loads
const initialHeight = updateWindowHeight();
calculateAndApplyScale(initialHeight);
adjustForMobile();

// Listen for window resize with debouncing
const debouncedResize = debounce(() => {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const isMobilePortrait = (currentHeight / currentWidth) > CONFIG.layout.mobilePortraitRatio;
    const widthChanged = currentWidth !== previousWidth;
    
    // Update constrained height
    const constrainedHeight = updateWindowHeight();
    
    // Update scale based on svh support and orientation
    if (svhSupported || !isMobilePortrait || widthChanged) {
        calculateAndApplyScale(constrainedHeight);
    }
    
    adjustForMobile();
}, CONFIG.RESIZE_DEBOUNCE_MS);

window.addEventListener('resize', debouncedResize);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Ensure height probe is initialized
    if (!heightProbe) {
        initializeHeightProbe();
    }
    
    // Ensure SettingsCache is initialized
    if (window.settingsCache && !window.settingsCache.initialized) {
        window.settingsCache.initialize();
    }
    
    // Apply scale and mobile adjustments
    const constrainedHeight = updateWindowHeight();
    calculateAndApplyScale(constrainedHeight);
    adjustForMobile();
    
    // Show scaled elements
    showScaledElements();
    
    // Setup state change subscriptions for automatic display updates
    setupStateSubscriptions();
    
    // Initialize state from starting amount
    stateManager.initializeFromStartingAmount();
    
    // Update all displays
    updateFillDisplay();
    updateMugFillDisplay();
    updateSavingsDisplay();
    updateDateDisplay();
    updatePPDisplay();
    updatePauseButtonUI();
    updateInfoPanel();
    
    // Start animation loop
    requestAnimationFrame(animate);
});

// ============================================================================
// LEGACY COMPATIBILITY (for backwards compatibility)
// ============================================================================

/**
 * Legacy reset function (delegates to state manager)
 */
function resetPigFill() {
    stateManager.reset();
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
