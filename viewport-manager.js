/**
 * ViewportManager - Responsive Layout and Scaling Management
 * 
 * Responsibilities:
 * - Detect and manage viewport dimensions
 * - Calculate and apply responsive scaling
 * - Detect mobile vs desktop layout
 * - Handle SVH (Small Viewport Height) support
 * - Manage window resize events
 * - Show/hide scaled elements with smooth transitions
 * 
 * Dependencies:
 * - config.js (CONFIG constants)
 * - state-manager.js (optional - for state updates)
 * 
 * Example:
 * ```javascript
 * const viewportManager = new ViewportManager(CONFIG, stateManager);
 * viewportManager.initialize();
 * ```
 */
class ViewportManager {
    /**
     * Create a new ViewportManager
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - Optional state manager for viewport state tracking
     */
    constructor(config, stateManager = null) {
        this.config = config;
        this.stateManager = stateManager;
        
        // Viewport state
        this.previousWidth = window.innerWidth;
        this.previousHeight = window.innerHeight;
        this.svhSupported = false;
        this.heightProbe = null;
        this.currentScale = 1;
        
        // Debounced resize handler (will be set in initialize)
        this.debouncedResize = null;
    }
    
    /**
     * Initialize the viewport manager
     * Sets up height probe, applies initial scale, and starts listening for resize events
     */
    initialize() {
        // 1. Initialize height probe for SVH detection
        this.initializeHeightProbe();
        
        // 2. Apply initial scale and layout
        const initialHeight = this.updateWindowHeight();
        this.calculateAndApplyScale(initialHeight);
        this.adjustForMobile();
        
        // 3. Show scaled elements (they start hidden in CSS)
        this.showScaledElements();
        
        // 4. Setup resize listener with debouncing
        this.setupResizeListener();
    }
    
    /**
     * Create a hidden probe element to detect SVH support and get pixel value
     * SVH (Small Viewport Height) is stable even when browser chrome shows/hides
     */
    initializeHeightProbe() {
        this.heightProbe = document.createElement('div');
        this.heightProbe.style.cssText = 'position:fixed; top:-9999px; height:100svh; pointer-events:none;';
        document.body.appendChild(this.heightProbe);
        
        // Check if SVH is supported by the browser
        const probeHeight = this.heightProbe.offsetHeight;
        this.svhSupported = probeHeight > 0 && probeHeight <= window.innerHeight;
        
        // Update state manager if available
        if (this.stateManager) {
            this.stateManager.updateViewport({ 
                svhSupported: this.svhSupported, 
                heightProbe: this.heightProbe 
            });
        }
    }
    
    /**
     * Get stable height using SVH if supported, otherwise use min-lock fallback
     * This prevents layout jumps when mobile browser chrome shows/hides
     * 
     * @param {number} currentInnerHeight - Current window.innerHeight value
     * @returns {number} Stable height in pixels
     */
    getStableHeight(currentInnerHeight) {
        // If SVH is supported, use it (most stable)
        if (this.svhSupported && this.heightProbe) {
            const probeHeight = this.heightProbe.offsetHeight;
            if (probeHeight > 0 && probeHeight <= window.innerHeight) {
                return probeHeight;
            }
        }
        
        // Fallback: Use min-lock logic for browsers without SVH support
        // Only update height if width changed (rotation) or height decreased
        const widthChanged = window.innerWidth !== this.previousWidth;
        const heightDecreased = currentInnerHeight < this.previousHeight;
        
        let stableHeight = this.previousHeight;
        
        if (widthChanged || heightDecreased) {
            stableHeight = currentInnerHeight;
        }
        
        return stableHeight;
    }
    
    /**
     * Update the CSS --window-height variable with constrained height
     * Returns the constrained height value for further calculations
     * 
     * @returns {number} Constrained height in pixels
     */
    updateWindowHeight() {
        const currentHeight = window.innerHeight;
        const stableHeight = this.getStableHeight(currentHeight);
        
        // Set CSS custom property for use in styles
        document.documentElement.style.setProperty('--window-height', `${stableHeight}px`);
        
        // Update tracking variables
        this.previousWidth = window.innerWidth;
        this.previousHeight = currentHeight;
        
        // Update state manager if available
        if (this.stateManager) {
            this.stateManager.updateViewport({ 
                previousWidth: this.previousWidth, 
                previousHeight: this.previousHeight 
            });
        }
        
        return stableHeight;
    }
    
    /**
     * Calculate scale factor based on viewport height and apply to CSS
     * Scale is clamped between minScale and maxScale from config
     * 
     * @param {number} height - Viewport height in pixels (optional, uses window.innerHeight if not provided)
     */
    calculateAndApplyScale(height) {
        const viewportHeight = height !== undefined ? height : window.innerHeight;
        
        // Calculate scale: viewport height / base design height
        let scale = viewportHeight / this.config.layout.baseHeight;
        
        // Clamp to min/max range from config
        scale = Math.max(
            this.config.layout.minScale, 
            Math.min(this.config.layout.maxScale, scale)
        );
        
        // Apply scale to CSS custom property
        document.documentElement.style.setProperty('--scale', scale);
        
        // Store current scale
        this.currentScale = scale;
        
        // Update state manager if available
        if (this.stateManager) {
            this.stateManager.updateViewport({ scale });
        }
    }
    
    /**
     * Detect mobile portrait mode and adjust panel positions via CSS class
     * Mobile portrait is detected when height/width ratio exceeds threshold
     */
    adjustForMobile() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspectRatio = height / width;
        const isMobilePortrait = aspectRatio > this.config.layout.mobilePortraitRatio;
        
        const body = document.body;
        
        if (isMobilePortrait) {
            body.classList.add(this.config.cssClasses.mobileMode);
        } else {
            body.classList.remove(this.config.cssClasses.mobileMode);
        }
    }
    
    /**
     * Show scaled elements after scale is applied
     * Elements start with opacity: 0 and get 'ready' class added
     */
    showScaledElements() {
        const elements = document.querySelectorAll(this.config.selectors.scaledElements);
        elements.forEach(el => el.classList.add(this.config.cssClasses.ready));
    }
    
    /**
     * Setup debounced resize event listener
     * Debouncing prevents excessive recalculations during resize
     */
    setupResizeListener() {
        // Create debounced version of resize handler
        this.debouncedResize = this.debounce(() => {
            this.handleResize();
        }, this.config.RESIZE_DEBOUNCE_MS);
        
        // Attach to window
        window.addEventListener('resize', this.debouncedResize);
    }
    
    /**
     * Handle window resize events
     * Intelligently updates scale based on SVH support and orientation
     */
    handleResize() {
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;
        const aspectRatio = currentHeight / currentWidth;
        const isMobilePortrait = aspectRatio > this.config.layout.mobilePortraitRatio;
        const widthChanged = currentWidth !== this.previousWidth;
        
        // Update constrained height
        const constrainedHeight = this.updateWindowHeight();
        
        // If SVH is supported, always update scale (SVH handles stability)
        // If not supported, only update scale on width change (rotation) in mobile mode
        if (this.svhSupported || !isMobilePortrait || widthChanged) {
            this.calculateAndApplyScale(constrainedHeight);
        }
        
        // Adjust mobile layout
        this.adjustForMobile();
    }
    
    /**
     * Debounce function to limit event frequency
     * Returns a debounced version of the provided function
     * 
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
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
    
    /**
     * Get current scale factor
     * @returns {number} Current scale factor (0.593 to 1.0)
     */
    getScale() {
        return this.currentScale;
    }
    
    /**
     * Get current viewport dimensions
     * @returns {Object} { width, height, scale, isMobile }
     */
    getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            scale: this.currentScale,
            isMobile: document.body.classList.contains(this.config.cssClasses.mobileMode),
            svhSupported: this.svhSupported
        };
    }
    
    /**
     * Cleanup method - removes event listeners and probe element
     * Call this if you need to destroy the viewport manager
     */
    destroy() {
        if (this.debouncedResize) {
            window.removeEventListener('resize', this.debouncedResize);
        }
        
        if (this.heightProbe && this.heightProbe.parentNode) {
            this.heightProbe.parentNode.removeChild(this.heightProbe);
        }
    }
}

// Create singleton instance (initialized in index.html or main app)
// Exported globally for use by other modules
if (typeof window !== 'undefined') {
    window.ViewportManager = ViewportManager;
}

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ViewportManager };
}
