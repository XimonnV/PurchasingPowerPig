/**
 * UIDisplayHandler - UI Element Display Management
 *
 * Responsibilities:
 * - Update pause button text and styling
 * - Update info panel baseline text (dynamic parts only)
 * - Handle info panel expand/collapse interaction
 * - Update leak oval size (based on inflation rate)
 *
 * Dependencies:
 * - config.js (CONFIG constants)
 * - state-manager.js (state values)
 * - formatters.js (formatCurrencyK, formatDate)
 *
 * Example:
 * ```javascript
 * const uiHandler = new UIDisplayHandler(CONFIG, stateManager);
 * uiHandler.initialize();
 * ```
 */
class UIDisplayHandler {
    /**
     * Create a new UIDisplayHandler
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - State manager instance
     */
    constructor(config, stateManager) {
        this.config = config;
        this.state = stateManager;

        // Cache DOM elements
        this.elements = {
            pauseButton: null,
            infoText: null,
            baselineAmount: null,
            baselineDate: null,
            infoExpandButton: null,
            infoExpandedText: null,
            leakOval: null
        };
    }

    /**
     * Initialize the UI display handler
     * Caches DOM elements, sets up event listeners, and updates initial display
     */
    initialize() {
        // Cache DOM elements
        this.cacheElements();

        // Setup event listeners
        this.setupEventListeners();

        // Update displays to match current state
        this.updatePauseButton();
        this.updateInfoPanel();
        this.updateLeakOval();
    }

    /**
     * Cache all DOM elements used by this handler
     */
    cacheElements() {
        this.elements.pauseButton = document.getElementById(this.config.elementIds.pauseButton);
        this.elements.infoText = document.querySelector(this.config.selectors.infoText);

        // Info panel dynamic elements
        this.elements.baselineAmount = document.getElementById('baselineAmount');
        this.elements.baselineDate = document.getElementById('baselineDate');
        this.elements.infoExpandButton = document.getElementById('infoExpandButton');
        this.elements.infoExpandedText = document.getElementById('infoExpandedText');

        // Leak oval - create if it doesn't exist
        let leakOval = document.querySelector(this.config.selectors.leakOval);
        if (!leakOval) {
            leakOval = this.createLeakOval();
        }
        this.elements.leakOval = leakOval;
    }

    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Info panel expand button click handler
        if (this.elements.infoExpandButton) {
            this.elements.infoExpandButton.addEventListener('click', () => {
                this.expandInfoPanel();
            });
        }
    }

    /**
     * Expand the info panel to show additional explanation
     * This is a one-way operation (no collapse)
     */
    expandInfoPanel() {
        // Hide the [+] button
        if (this.elements.infoExpandButton) {
            this.elements.infoExpandButton.style.display = 'none';
        }

        // Show the expanded text
        if (this.elements.infoExpandedText) {
            this.elements.infoExpandedText.style.display = 'block';
        }
    }

    /**
     * Create the leak oval element dynamically
     * @returns {HTMLElement} Created leak oval element
     */
    createLeakOval() {
        const leakOval = document.createElement('div');
        leakOval.className = this.config.cssClasses.leakOval;
        document.body.appendChild(leakOval);
        return leakOval;
    }

    /**
     * Update pause button text and styling based on pause state
     */
    updatePauseButton() {
        if (!this.elements.pauseButton) return;

        const isPaused = this.state.get('isPaused');

        // Update button text
        this.elements.pauseButton.textContent = isPaused
            ? this.config.buttonText.resume
            : this.config.buttonText.pause;

        // Update button styling
        if (isPaused) {
            this.elements.pauseButton.classList.add(this.config.cssClasses.paused);
        } else {
            this.elements.pauseButton.classList.remove(this.config.cssClasses.paused);
        }
    }

    /**
     * Update info panel baseline text (dynamic parts only)
     * Updates the baseline amount ($100K) and date (2025 October)
     * The static text is in HTML, only dynamic parts are updated here
     */
    updateInfoPanel() {
        // Update baseline amount from CONFIG
        if (this.elements.baselineAmount) {
            const capacityDollars = this.config.PIG_CAPACITY_DOLLARS;
            this.elements.baselineAmount.textContent = formatCurrencyK(capacityDollars);
        }

        // Update baseline date
        if (this.elements.baselineDate) {
            const now = new Date();
            const year = now.getFullYear();
            const month = this.config.display.monthNames[now.getMonth()];
            this.elements.baselineDate.textContent = `${year} ${month}`;
        }
    }

    /**
     * Update leak oval size based on current inflation rate
     * The leak oval visualizes the inflation rate as an oval at the bottom of the pig
     */
    updateLeakOval() {
        if (!this.elements.leakOval) return;

        // Get current inflation rate from settings
        const annualInflationPercent = this.state.getAnnualInflation() * 100;

        // Calculate oval size using helper function from config.js
        const { width, height } = calculateLeakOvalSize(annualInflationPercent);

        // Apply scale factor (leak oval scales with viewport)
        const scaleFactor = getScaleFactor();
        const scaledWidth = width * scaleFactor;
        const scaledHeight = height * scaleFactor;

        // Update element size
        this.elements.leakOval.style.width = scaledWidth + 'px';
        this.elements.leakOval.style.height = scaledHeight + 'px';
    }

    /**
     * Get current pause state
     * @returns {boolean} True if paused
     */
    isPaused() {
        return this.state.get('isPaused');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.UIDisplayHandler = UIDisplayHandler;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIDisplayHandler };
}
