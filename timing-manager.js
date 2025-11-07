/**
 * TimingManager - Manages drop creation timing
 *
 * Handles the interval timer that creates savings drops every second (1 drop = 1 month).
 * Automatically pauses/resumes based on state manager pause state.
 *
 * Responsibilities:
 * - Create savings drops at regular intervals (default 1000ms)
 * - Start/stop interval timer
 * - Pause/resume (via state manager subscription)
 * - Trigger callback to create drop
 *
 * Dependencies:
 * - config.js (for DROP_INTERVAL_MS)
 * - state-manager.js (to check pause state and subscribe to changes)
 *
 * Example:
 * ```javascript
 * const timingManager = new TimingManager(CONFIG, stateManager, () => {
 *     createSavingsDrop(); // Your drop creation logic
 * });
 * timingManager.start();
 * ```
 */
class TimingManager {
    /**
     * Create timing manager
     * @param {Object} config - CONFIG object
     * @param {StateManager} stateManager - State manager instance
     * @param {Function} createDropCallback - Callback to create a drop: () => void
     */
    constructor(config, stateManager, createDropCallback) {
        this.config = config;
        this.stateManager = stateManager;
        this.createDropCallback = createDropCallback;
        this.intervalId = null;
        this.running = false;

        // Subscribe to pause state changes
        this.setupPauseSubscription();
    }

    /**
     * Setup subscription to pause state
     * Automatically pauses/resumes interval when state changes
     */
    setupPauseSubscription() {
        this.stateManager.subscribe('isPaused', () => {
            const isPaused = this.stateManager.get('isPaused');
            if (isPaused) {
                this.stopInterval();
            } else if (this.running) {
                // Only restart interval if timing manager is running
                this.startInterval();
            }
        });
    }

    /**
     * Start the timing manager
     * Begins creating drops at regular intervals
     */
    start() {
        if (this.running) return;

        this.running = true;

        // Don't start interval if paused
        const isPaused = this.stateManager.get('isPaused');
        if (!isPaused) {
            this.startInterval();
        }
    }

    /**
     * Stop the timing manager
     * Stops creating drops
     */
    stop() {
        this.running = false;
        this.stopInterval();
    }

    /**
     * Start the interval timer (internal)
     */
    startInterval() {
        // Clear any existing interval
        this.stopInterval();

        // Create drops at regular intervals
        this.intervalId = setInterval(() => {
            const isPaused = this.stateManager.get('isPaused');
            if (!isPaused) {
                this.createDropCallback();
            }
        }, this.config.DROP_INTERVAL_MS);
    }

    /**
     * Stop the interval timer (internal)
     */
    stopInterval() {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Pause drop creation (keeps running state, just stops interval)
     * Note: This is handled automatically via state manager subscription
     */
    pause() {
        this.stopInterval();
    }

    /**
     * Resume drop creation (if was running)
     * Note: This is handled automatically via state manager subscription
     */
    resume() {
        if (this.running) {
            const isPaused = this.stateManager.get('isPaused');
            if (!isPaused) {
                this.startInterval();
            }
        }
    }

    /**
     * Check if timing manager is running
     * @returns {boolean} True if running
     */
    isRunning() {
        return this.running;
    }

    /**
     * Check if interval is active (creating drops)
     * @returns {boolean} True if interval is active
     */
    isIntervalActive() {
        return this.intervalId !== null;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.TimingManager = TimingManager;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimingManager };
}
