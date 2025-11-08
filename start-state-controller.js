/**
 * StartStateController - Start/Welcome Screen Management
 *
 * Responsibilities:
 * - Manage start/welcome state transitions
 * - Handle "Start" button behavior (restart button in start state)
 * - Handle Enter key to begin simulation
 * - Update restart button text based on state
 * - Coordinate transition animations
 *
 * Dependencies:
 * - config.js (CONFIG constants)
 * - state-manager.js (state updates)
 * - app.js (for restart functionality)
 *
 * Example:
 * ```javascript
 * const startStateController = new StartStateController(CONFIG, stateManager, app);
 * startStateController.initialize();
 * ```
 */
class StartStateController {
    /**
     * Create a new StartStateController
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - State manager instance
     * @param {Object} app - App instance (for restart functionality)
     */
    constructor(config, stateManager, app = null) {
        this.config = config;
        this.stateManager = stateManager;
        this.app = app;
        
        // Cache DOM elements
        this.elements = {
            overlay: null,
            restartButton: null,
            pauseButton: null
        };
        
        // Bind methods to preserve 'this' context
        this.handleRestartClick = this.handleRestartClick.bind(this);
        this.handleEnterKey = this.handleEnterKey.bind(this);
        this.handlePauseClick = this.handlePauseClick.bind(this);
    }
    
    /**
     * Initialize the start state controller
     * Caches DOM elements, sets up event listeners, and updates initial UI
     */
    initialize() {
        // 1. Cache DOM elements
        this.cacheElements();
        
        // 2. Setup event listeners
        this.setupEventListeners();
        
        // 3. Update UI based on current state
        this.updateRestartButtonText();
    }
    
    /**
     * Cache all DOM elements used by this controller
     */
    cacheElements() {
        this.elements.overlay = document.getElementById('startOverlay');
        this.elements.restartButton = document.getElementById(this.config.elementIds.restartButton);
        this.elements.pauseButton = document.getElementById(this.config.elementIds.pauseButton);
    }
    
    /**
     * Setup event listeners for start state interactions
     */
    setupEventListeners() {
        // Restart button (becomes "Start" button in start state)
        if (this.elements.restartButton) {
            this.elements.restartButton.addEventListener('click', this.handleRestartClick);
        }
        
        // Enter key listener (start simulation if in start state)
        document.addEventListener('keydown', this.handleEnterKey);
        
        // Pause button
        if (this.elements.pauseButton) {
            this.elements.pauseButton.addEventListener('click', this.handlePauseClick);
        }
    }
    
    /**
     * Handle restart button click
     * Behavior changes based on whether we're in start state or not
     */
    handleRestartClick() {
        const isStartState = this.stateManager ? this.stateManager.get('isStartState') : false;

        if (isStartState) {
            // In start state: exit and begin simulation
            this.exitStartState();
        } else {
            // Normal state: restart the simulation
            // Use app.restart() if available, otherwise fall back to global function
            if (this.app && this.app.restart) {
                this.app.restart();
            } else if (typeof window.resetPigFill === 'function') {
                window.resetPigFill();
            }
        }
    }
    
    /**
     * Handle Enter key press
     * If in start state, exit and begin simulation
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleEnterKey(e) {
        if (e.key === 'Enter') {
            const isStartState = this.stateManager ? this.stateManager.get('isStartState') : false;
            
            if (isStartState) {
                this.exitStartState();
            }
        }
    }
    
    /**
     * Handle pause button click
     * Toggles pause state and prevents burst of drops on resume
     */
    handlePauseClick() {
        if (this.stateManager) {
            const isPaused = this.stateManager.togglePause();
            
            // Reset lastDropTime to prevent burst of drops on resume
            if (!isPaused) {
                this.stateManager.updateLastDropTime(performance.now());
            }
            
            // UI update happens automatically via isPaused subscription
        }
    }
    
    /**
     * Exit start state and begin simulation
     * Handles transition animations and state updates
     */
    exitStartState() {
        // 1. Remove start-state class from body (triggers CSS transition)
        document.body.classList.remove('start-state');
        
        // 2. Hide overlay with fade-out
        if (this.elements.overlay) {
            this.elements.overlay.classList.add('hidden');
        }
        
        // 3. Update state manager
        if (this.stateManager) {
            this.stateManager.setState({ isStartState: false });
        }
        
        // 4. Update restart button text
        this.updateRestartButtonText();
        
        // 5. Wait 500ms for transition, then start simulation
        setTimeout(() => {
            this.startSimulation();
        }, 500);
    }
    
    /**
     * Start the simulation
     * Calls the global startSimulation function if available
     */
    startSimulation() {
        if (typeof window.startSimulation === 'function') {
            window.startSimulation();
        }
    }
    
    /**
     * Update restart button text based on current state
     * Shows "Start" in start state, "Restart" in normal state
     */
    updateRestartButtonText() {
        if (!this.elements.restartButton) return;
        
        const isStartState = this.stateManager ? this.stateManager.get('isStartState') : false;
        this.elements.restartButton.textContent = isStartState ? 'Start' : 'Restart';
    }
    
    /**
     * Enter start state (useful for programmatic control)
     * Shows welcome screen and resets UI
     */
    enterStartState() {
        // 1. Add start-state class to body
        document.body.classList.add('start-state');
        
        // 2. Show overlay
        if (this.elements.overlay) {
            this.elements.overlay.classList.remove('hidden');
        }
        
        // 3. Update state manager
        if (this.stateManager) {
            this.stateManager.setState({ isStartState: true });
        }
        
        // 4. Update restart button text
        this.updateRestartButtonText();
    }
    
    /**
     * Check if currently in start state
     * @returns {boolean} True if in start state
     */
    isInStartState() {
        return this.stateManager ? this.stateManager.get('isStartState') : false;
    }
    
    /**
     * Cleanup method - removes event listeners
     * Call this if you need to destroy the controller
     */
    destroy() {
        // Remove restart button listener
        if (this.elements.restartButton) {
            this.elements.restartButton.removeEventListener('click', this.handleRestartClick);
        }
        
        // Remove Enter key listener
        document.removeEventListener('keydown', this.handleEnterKey);
        
        // Remove pause button listener
        if (this.elements.pauseButton) {
            this.elements.pauseButton.removeEventListener('click', this.handlePauseClick);
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.StartStateController = StartStateController;
}

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StartStateController };
}
