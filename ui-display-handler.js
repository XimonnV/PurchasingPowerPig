/**
 * UIDisplayHandler - UI Element Display Management
 *
 * Responsibilities:
 * - Update pause button text and styling
 * - Update info panel baseline text (dynamic parts only)
 * - Toggle info panel expansion/collapse with [+]/[-] button
 * - Update leak oval size (based on inflation rate)
 * - Position chart panel below info panel in mobile mode
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
            infoDisplay: null,
            chartPanel: null,
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

        // Subscribe to savings vehicle changes to update leak oval visibility
        this.state.subscribe('savingsVehicle', () => {
            this.updateLeakOvalVisibility();
        });

        // Subscribe to simulation finished state to hide/show pause button
        this.state.subscribe('isSimulationFinished', () => {
            this.updatePauseButtonVisibility();
        });

        // Subscribe to start state changes to reposition chart when simulation starts
        this.state.subscribe('isStartState', (isStartState) => {
            // When exiting start state (simulation starting), chart becomes visible
            // Keep trying to position until layout is stable
            if (!isStartState) {
                this.positionChartWithRetry();
            }
        });

        // Subscribe to btcModeEverActive to reposition chart when deposits row visibility changes
        this.state.subscribe('btcModeEverActive', () => {
            // Deposits row visibility affects info panel height, so reposition chart
            this.positionChartPanelAfterLayout();
        });

        // Update displays to match current state
        this.updatePauseButton();
        this.updatePauseButtonVisibility();
        this.updateInfoPanel();
        this.updateLeakOval();
        this.updateLeakOvalVisibility();

        // Position chart panel after browser completes layout
        this.positionChartPanelAfterLayout();

        // Reposition chart on window resize
        window.addEventListener('resize', () => {
            this.positionChartPanelAfterLayout();
        });
    }

    /**
     * Position chart panel after browser completes layout calculations
     * Uses requestAnimationFrame to wait for layout to be ready
     */
    positionChartPanelAfterLayout() {
        // Use double requestAnimationFrame to ensure layout is complete
        // First rAF: queued for next frame
        // Second rAF: ensures layout has been calculated
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.positionChartPanelInMobile();
            });
        });
    }

    /**
     * Position chart panel with retry logic
     * Keeps trying until chart is visible and positioned correctly
     */
    positionChartWithRetry(attempts = 0, maxAttempts = 10) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const positioned = this.positionChartPanelInMobile();

                // If positioning failed (returned early) and we haven't exceeded max attempts, retry
                if (positioned === false && attempts < maxAttempts) {
                    setTimeout(() => {
                        this.positionChartWithRetry(attempts + 1, maxAttempts);
                    }, 50);
                }
            });
        });
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
        this.elements.infoDisplay = document.querySelector('.info-display');
        this.elements.chartPanel = document.querySelector('.chart-panel');

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
        // Info panel expand/collapse button click handler
        if (this.elements.infoExpandButton) {
            this.elements.infoExpandButton.addEventListener('click', () => {
                this.toggleInfoPanel();
            });
        }
    }

    /**
     * Toggle the info panel between expanded and collapsed states
     */
    toggleInfoPanel() {
        if (!this.elements.infoExpandButton || !this.elements.infoExpandedText) return;

        // Check current state by looking at expanded text visibility
        const isExpanded = this.elements.infoExpandedText.style.display === 'block';

        if (isExpanded) {
            // Collapse: hide text and change button to [+]
            this.elements.infoExpandedText.style.display = 'none';
            this.elements.infoExpandButton.textContent = '[+]';
            this.elements.infoExpandButton.title = 'Click for more info';
        } else {
            // Expand: show text and change button to [-]
            this.elements.infoExpandedText.style.display = 'block';
            this.elements.infoExpandButton.textContent = '[-]';
            this.elements.infoExpandButton.title = 'Click to collapse';
        }

        // Reposition chart panel in mobile mode after expansion/collapse
        this.positionChartPanelAfterLayout();
    }

    /**
     * Position chart panel below info panel in mobile mode
     * On desktop, chart stays fixed and is not affected
     * @returns {boolean} True if positioned successfully, false if skipped
     */
    positionChartPanelInMobile() {
        if (!this.elements.chartPanel || !this.elements.infoDisplay) return false;

        // Only reposition in mobile mode
        const isMobile = document.body.classList.contains('mobile-mode');
        if (!isMobile) {
            // Reset to CSS defaults in desktop mode
            this.elements.chartPanel.style.top = '';
            document.body.style.minHeight = '';
            return true; // Successfully reset
        }

        // Check if chart is actually visible (not hidden by start-state CSS)
        const chartStyle = getComputedStyle(this.elements.chartPanel);
        if (chartStyle.display === 'none') {
            console.log('📊 Chart panel hidden - skipping positioning');
            return false; // Not ready yet
        }

        // Get info panel's bottom position
        const infoRect = this.elements.infoDisplay.getBoundingClientRect();
        const infoBottom = infoRect.bottom + window.scrollY; // Absolute position from top of page

        // Verify we got a valid position (not zero/collapsed)
        if (infoBottom === 0 || infoRect.height === 0) {
            console.log('📊 Info panel not laid out yet - skipping positioning');
            return false; // Not ready yet
        }

        // Set chart panel position: info bottom + 20px margin
        const chartTop = infoBottom + 20;
        this.elements.chartPanel.style.top = `${chartTop}px`;

        // Get chart panel height
        const chartHeight = this.elements.chartPanel.offsetHeight;

        // Update body min-height to ensure chart panel is fully visible with bottom margin
        const requiredBodyHeight = chartTop + chartHeight + 20; // chart top + chart height + 20px bottom margin
        document.body.style.minHeight = `${requiredBodyHeight}px`;

        console.log(`📊 Chart panel repositioned to ${chartTop}px (info bottom: ${infoBottom}px + 20px margin)`);
        return true; // Successfully positioned
    }

    /**
     * Create the leak oval element dynamically
     * @returns {HTMLElement} Created leak oval element
     */
    createLeakOval() {
        const leakOval = document.createElement('div');
        leakOval.className = this.config.cssClasses.leakOval;

        // Append to animation-container instead of body to share positioning context with pig/pig-oval
        const animationContainer = document.querySelector('.animation-container');
        if (animationContainer) {
            animationContainer.appendChild(leakOval);
        } else {
            // Fallback to body if animation-container doesn't exist
            document.body.appendChild(leakOval);
        }

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
     * Update pause button visibility based on simulation finished state
     * Hide pause button when simulation is finished (360 months reached)
     */
    updatePauseButtonVisibility() {
        if (!this.elements.pauseButton) return;

        const isFinished = this.state.get('isSimulationFinished');

        if (isFinished) {
            this.elements.pauseButton.style.display = 'none';
        } else {
            this.elements.pauseButton.style.display = '';
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
     * Update leak oval visibility based on current savings vehicle
     * USD: leak oval visible (inflation applies)
     * BTC: leak oval hidden (BTC doesn't leak)
     */
    updateLeakOvalVisibility() {
        if (!this.elements.leakOval) return;

        const vehicle = this.state.getSavingsVehicle();

        if (vehicle === this.config.savingsVehicle.options.BTC) {
            // BTC mode: hide leak oval (BTC doesn't leak)
            this.elements.leakOval.style.display = 'none';
        } else {
            // USD mode: show leak oval (inflation applies)
            this.elements.leakOval.style.display = 'block';
        }
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
