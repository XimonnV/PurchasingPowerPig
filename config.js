/**
 * Purchasing Power Pig - Configuration
 * 
 * All magic numbers, constants, and configuration values extracted to a single source of truth.
 * Update values here to change behavior across the entire application.
 */

const CONFIG = {
    // ========================================
    // FINANCIAL CALCULATIONS
    // ========================================
    
    /** Total dollar capacity of the pig (full = 100%) */
    PIG_CAPACITY_DOLLARS: 100000,
    
    /** Total dollar capacity of the banker's mug (full = 100%) */
    MUG_CAPACITY_DOLLARS: 70000,
    
    /** Maximum fill level percentage */
    MAX_FILL_PERCENTAGE: 100,
    
    /** Minimum fill level percentage */
    MIN_FILL_PERCENTAGE: 0,
    
    
    // ========================================
    // SLIDER SETTINGS
    // ========================================
    
    sliders: {
        startAmount: {
            min: 0,
            max: 100000,
            default: 50000,
            step: 1000,
            roundTo: 1000  // For balance calculations
        },
        inflation: {
            min: 5,
            max: 20,
            default: 7,
            step: 0.1,
            roundTo: 0.1  // For balance calculations
        },
        savings: {
            min: 0,
            max: 1000,
            default: 100,
            step: 10,
            roundTo: 10  // For balance calculations
        }
    },


    // ========================================
    // SAVINGS VEHICLE
    // ========================================

    savingsVehicle: {
        /** Default savings vehicle */
        default: 'usd',

        /** Available options */
        options: {
            USD: 'usd',
            BTC: 'btc'
        }
    },


    // ========================================
    // ANIMATION TIMING
    // ========================================

    /** Delay before first drop appears when starting/restarting simulation in milliseconds */
    INITIAL_DROP_DELAY_MS: 1000,

    /** Time between drops (1 drop = 1 month) in milliseconds */
    DROP_INTERVAL_MS: 1000,

    /** Delay between drop landing and inflation effect in milliseconds */
    INFLATION_DELAY_MS: 500,
    
    /** Duration of ripple animation in milliseconds */
    RIPPLE_DURATION_MS: 750,
    
    /** Debounce delay for window resize events in milliseconds */
    RESIZE_DEBOUNCE_MS: 150,
    
    
    // ========================================
    // DROP PHYSICS
    // ========================================
    
    drop: {
        /** Base falling speed (pixels per frame) before scale adjustment */
        minSpeed: 3,
        
        /** Random additional speed (pixels per frame) */
        maxSpeedVariation: 1,
        
        /** Size for invisible drops (when savings = $0) */
        invisibleDropSize: 5,
        
        /** Drop size scaling for amounts $1-$100 (base + amount * scale) */
        smallAmountBase: 1,
        smallAmountScale: 0.1,
        smallAmountThreshold: 100,
        
        /** Drop size scaling for amounts $100-$1000 */
        largeAmountBase: 11,
        largeAmountScale: 0.01,
        largeAmountOffset: 100
    },
    
    
    // ========================================
    // RESPONSIVE LAYOUT
    // ========================================
    
    layout: {
        /** Base design height for scaling calculations */
        baseHeight: 1080,
        
        /** Minimum scale factor (640px / 1080px) */
        minScale: 0.593,
        
        /** Maximum scale factor */
        maxScale: 1.0,
        
        /** Aspect ratio threshold for mobile portrait mode (height/width) */
        mobilePortraitRatio: 1.5
    },
    
    
    // ========================================
    // POSITIONING (in pixels, will be scaled by --scale CSS variable)
    // ========================================
    
    positions: {
        banner: {
            top: 20
        },
        pig: {
            top: 200,
            width: 300,
            height: 300
        },
        pigOval: {
            top: 285,
            width: 150,
            height: 115
        },
        pigPercentage: {
            // Vertical offset from pig top
            verticalOffset: 130
        },
        leakOval: {
            top: 397,  // Bottom of pig oval (285 + 115 - 3px adjustment) - where inflation drops originate
            borderWidth: 3,
            heightRatio: 3  // Height = width / heightRatio
        },
        banker: {
            top: 501,  // Pig bottom (200 + 300) + 1px spacing
            width: 500,
            height: 500
        },
        mug: {
            top: 680,
            width: 75,
            height: 125
        }
    },
    
    
    // ========================================
    // Z-INDEX LAYERS
    // ========================================
    
    zIndex: {
        /** Background elements */
        background: 0,
        
        /** Pig image */
        pig: 1,
        
        /** Pig oval fill */
        pigOval: 2,
        
        /** Percentage text on pig */
        pigPercentage: 3,
        
        /** Leak oval showing inflation rate */
        leakOval: 4,
        
        /** Ripple effects inside containers */
        ripple: 10,
        
        /** Money drops (highest - on top of everything) */
        drops: 1000,
        
        /** Banner (should be above drops so drops go behind it) */
        banner: 2000
    },
    
    
    // ========================================
    // COLLISION DETECTION
    // ========================================
    
    collision: {
        /** Offset from container bottom when empty (in pixels) */
        emptyContainerOffset: 5
    },
    
    
    // ========================================
    // DISPLAY FORMATTING
    // ========================================
    
    display: {
        /** Number of decimal places for debug displays */
        debugDecimalPlaces: 2,
        
        /** Month names for date display */
        monthNames: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
    },
    
    
    // ========================================
    // BALANCE ICON STATES
    // ========================================
    
    balanceStates: {
        BALANCED: 'balanced',
        SHRINK: 'shrink',
        GROW: 'grow'
    },
    
    
    // ========================================
    // CSS CLASS NAMES
    // ========================================
    
    cssClasses: {
        scaledElement: 'scaled-element',
        ready: 'ready',
        mobileMode: 'mobile-mode',
        paused: 'paused',
        moneyDrop: 'money-drop',
        pigRipple: 'pig-ripple',
        mugRipple: 'mug-ripple',
        ripple: 'ripple',
        leakOval: 'leak-oval'
    },
    
    
    // ========================================
    // DOM ELEMENT IDs
    // ========================================
    
    elementIds: {
        // Sliders
        startAmountSlider: 'startAmount',
        inflationSlider: 'inflation',
        savingsSlider: 'savings',
        
        // Display values
        startAmountValue: 'startAmountValue',
        inflationValue: 'inflationValue',
        savingsValue: 'savingsValue',
        totalSavingsValue: 'totalSavingsValue',
        totalBankValue: 'totalBankValue',
        currentDateValue: 'currentDateValue',
        pigPercentageDisplay: 'pigPercentageDisplay',
        ppStartDate: 'ppStartDate',
        ppValue: 'ppValue',
        
        // Buttons
        balanceStartAmount: 'balanceStartAmount',
        balanceInflation: 'balanceInflation',
        balanceSavings: 'balanceSavings',
        restartButton: 'restartButton',
        pauseButton: 'pauseButton',

        // Savings Vehicle Toggle
        savingsVehicleToggle: 'savingsVehicleToggle',
        savingsVehicleUsd: 'savingsVehicleUsd',
        savingsVehicleBtc: 'savingsVehicleBtc',

        // Debug (if present)
        debugFillValue: 'debugFillValue',
        debugMugValue: 'debugMugValue',
        debugBankDollars: 'debugBankDollars'
    },
    
    
    // ========================================
    // CSS SELECTORS
    // ========================================
    
    selectors: {
        pigOvalContainer: '.pig-oval-container',
        pigOvalFill: '.pig-oval-fill',
        bankerMugContainer: '.banker-mug-container',
        bankerMugFill: '.banker-mug-fill',
        infoText: '.info-text',
        scaledElements: '.scaled-element',
        leakOval: '.leak-oval'
    },
    

    // ========================================
    // SAVINGS VEHICLE
    // ========================================

    savingsVehicle: {
        options: {
            USD: 'usd',
            BTC: 'btc'
        },
        default: 'usd',
        labels: {
            usd: '$',
            btc: '₿'
        }
    },


    // ========================================
    // BUTTON TEXT
    // ========================================

    buttonText: {
        pause: 'Pause',
        resume: 'Resume'
    },
    
    
    // ========================================
    // IMAGE FILES
    // ========================================

    images: {
        balance: 'balance.png',
        balanceTilt: 'balance-tilt.png'
    },


    // ========================================
    // COLORS
    // ========================================

    colors: {
        // USD savings mode (green)
        usdFillStart: '#2e7d32',
        usdFillEnd: '#4caf50',

        // BTC savings mode (orange)
        btcFillStart: '#F7931A',
        btcFillEnd: '#FFA726'
    }
};

/**
 * Helper function to calculate drop volume for pig fill
 * @param {number} dollarAmount - Dollar amount of the drop
 * @returns {number} Volume as percentage points (0-100)
 */
function calculatePigDropVolume(dollarAmount) {
    return (dollarAmount / CONFIG.PIG_CAPACITY_DOLLARS) * 100;
}

/**
 * Helper function to calculate drop volume for mug fill
 * @param {number} dollarAmount - Dollar amount of the drop
 * @returns {number} Volume as percentage points (0-100)
 */
function calculateMugDropVolume(dollarAmount) {
    return (dollarAmount / CONFIG.MUG_CAPACITY_DOLLARS) * 100;
}

/**
 * Helper function to convert fill percentage back to dollars
 * @param {number} fillPercentage - Fill level (0-100)
 * @param {string} container - 'pig' or 'mug'
 * @returns {number} Dollar amount
 */
function fillPercentageToDollars(fillPercentage, container = 'pig') {
    const capacity = container === 'pig' 
        ? CONFIG.PIG_CAPACITY_DOLLARS 
        : CONFIG.MUG_CAPACITY_DOLLARS;
    return (fillPercentage / 100) * capacity;
}

/**
 * Helper function to calculate leak oval dimensions based on inflation rate
 * Maps inflation percentage (5-20%) to 2/3 of drop size range
 * @param {number} inflationPercent - Annual inflation as percentage (e.g., 7 for 7%)
 * @returns {Object} Object with width and height properties (before scale adjustment)
 */
function calculateLeakOvalSize(inflationPercent) {
    // Calculate min and max drop sizes (same as calculateDropSize logic)
    const minDropSize = CONFIG.drop.smallAmountBase; // 1px
    const maxDropSize = CONFIG.drop.largeAmountBase + 
        (CONFIG.sliders.savings.max - CONFIG.drop.largeAmountOffset) * CONFIG.drop.largeAmountScale; // 20px
    
    // Map inflation percentage to drop size range
    const minInflation = CONFIG.sliders.inflation.min;
    const maxInflation = CONFIG.sliders.inflation.max;
    
    // Linear interpolation: width = min + (inflation - minInflation) / (maxInflation - minInflation) * (max - min)
    // Then multiply by 2/3 to make leak oval smaller and more realistic
    const fullWidth = minDropSize + (inflationPercent - minInflation) / (maxInflation - minInflation) * (maxDropSize - minDropSize);
    const width = fullWidth * (2 / 3);
    const height = width / CONFIG.positions.leakOval.heightRatio;
    
    return { width, height };
}

// Make CONFIG and helper functions available globally
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.calculatePigDropVolume = calculatePigDropVolume;
    window.calculateMugDropVolume = calculateMugDropVolume;
    window.fillPercentageToDollars = fillPercentageToDollars;
    window.calculateLeakOvalSize = calculateLeakOvalSize;
}
