/**
 * EffectManager - Visual Effects Management
 * 
 * Manages all visual effects in the application, including:
 * - Ripple effects when drops land in liquid
 * - Future effects (splash, glow, particles, etc.)
 * 
 * Responsibilities:
 * - Create and manage ripple effects
 * - Clean up effects after animation completes
 * - Provide extensible API for new effects
 * - Handle effect timing and lifecycle
 * 
 * Dependencies:
 * - config.js (CONFIG constants)
 * 
 * Example:
 * ```javascript
 * const effectManager = new EffectManager(CONFIG);
 * effectManager.createRipple(containerElement, 'pig-ripple');
 * ```
 */
class EffectManager {
    /**
     * Create a new EffectManager
     * @param {Object} config - Configuration object (CONFIG from config.js)
     */
    constructor(config) {
        this.config = config;
        
        // Track active effects for potential management
        this.activeEffects = [];
    }
    
    /**
     * Create a ripple effect when a drop lands in liquid
     * 
     * The ripple appears at the top of the liquid surface and expands outward
     * with a radial gradient, fading as it grows. After the animation completes,
     * the ripple element is automatically removed from the DOM.
     * 
     * @param {HTMLElement} containerElement - The container element (pig oval or mug)
     * @param {string} rippleClass - CSS class for the ripple type ('pig-ripple' or 'mug-ripple')
     * @returns {HTMLElement|null} The created ripple element, or null if creation failed
     * 
     * @example
     * // Create ripple in pig
     * const pigOval = document.querySelector('.pig-oval-container');
     * effectManager.createRipple(pigOval, 'pig-ripple');
     * 
     * // Create ripple in mug
     * const mug = document.querySelector('.banker-mug-container');
     * effectManager.createRipple(mug, 'mug-ripple');
     */
    createRipple(containerElement, rippleClass) {
        if (!containerElement) {
            console.warn('EffectManager: Cannot create ripple - container element is null');
            return null;
        }
        
        // Create ripple element
        const ripple = document.createElement('div');
        ripple.className = `${this.config.cssClasses.ripple} ${rippleClass}`;
        
        // Find the fill element inside the container
        const fill = containerElement.querySelector('.pig-oval-fill, .banker-mug-fill');
        
        if (!fill) {
            console.warn('EffectManager: Cannot create ripple - fill element not found');
            return null;
        }
        
        // Allow overflow so ripple shows at top of liquid
        fill.style.overflow = 'visible';
        
        // Add ripple to fill element
        fill.appendChild(ripple);
        
        // Track active effect
        this.activeEffects.push({
            element: ripple,
            type: 'ripple',
            created: Date.now()
        });
        
        // Remove ripple after animation completes
        setTimeout(() => {
            this.removeEffect(ripple);
        }, this.config.RIPPLE_DURATION_MS);
        
        return ripple;
    }
    
    /**
     * Create a pig ripple effect (convenience method)
     * 
     * @param {HTMLElement} pigOvalContainer - The pig oval container element
     * @returns {HTMLElement|null} The created ripple element
     */
    createPigRipple(pigOvalContainer) {
        return this.createRipple(pigOvalContainer, this.config.cssClasses.pigRipple);
    }
    
    /**
     * Create a mug ripple effect (convenience method)
     * 
     * @param {HTMLElement} mugContainer - The mug container element
     * @returns {HTMLElement|null} The created ripple element
     */
    createMugRipple(mugContainer) {
        return this.createRipple(mugContainer, this.config.cssClasses.mugRipple);
    }
    
    /**
     * Remove an effect element from the DOM and tracking array
     * 
     * @param {HTMLElement} effectElement - The effect element to remove
     */
    removeEffect(effectElement) {
        // Remove from DOM
        if (effectElement && effectElement.parentNode) {
            effectElement.remove();
        }
        
        // Remove from tracking array
        this.activeEffects = this.activeEffects.filter(
            effect => effect.element !== effectElement
        );
    }
    
    /**
     * Clear all active effects immediately
     * Useful for reset or cleanup scenarios
     */
    clearAllEffects() {
        this.activeEffects.forEach(effect => {
            if (effect.element && effect.element.parentNode) {
                effect.element.remove();
            }
        });
        this.activeEffects = [];
    }
    
    /**
     * Get count of active effects
     * Useful for debugging or monitoring performance
     * 
     * @returns {number} Number of active effects
     */
    getActiveEffectCount() {
        return this.activeEffects.length;
    }
    
    /**
     * Get all active effects
     * Useful for debugging
     * 
     * @returns {Array} Array of active effect objects
     */
    getActiveEffects() {
        return [...this.activeEffects];
    }
    
    // ============================================================================
    // FUTURE EFFECTS (Placeholder methods for extensibility)
    // ============================================================================
    
    /**
     * Create a splash effect (placeholder for future implementation)
     * 
     * @param {HTMLElement} containerElement - Container for the splash
     * @param {Object} options - Splash configuration options
     * @returns {HTMLElement|null} The created splash element
     */
    createSplash(containerElement, options = {}) {
        // TODO: Implement splash effect
        console.log('EffectManager: Splash effect not yet implemented');
        return null;
    }
    
    /**
     * Create a glow effect (placeholder for future implementation)
     * 
     * @param {HTMLElement} targetElement - Element to apply glow to
     * @param {Object} options - Glow configuration options
     * @returns {HTMLElement|null} The created glow element
     */
    createGlow(targetElement, options = {}) {
        // TODO: Implement glow effect
        console.log('EffectManager: Glow effect not yet implemented');
        return null;
    }
    
    /**
     * Create a particle effect (placeholder for future implementation)
     * 
     * @param {number} x - X coordinate for particle origin
     * @param {number} y - Y coordinate for particle origin
     * @param {Object} options - Particle configuration options
     * @returns {Array|null} Array of created particle elements
     */
    createParticles(x, y, options = {}) {
        // TODO: Implement particle effect
        console.log('EffectManager: Particle effect not yet implemented');
        return null;
    }
    
    /**
     * Create a shake effect (placeholder for future implementation)
     * 
     * @param {HTMLElement} targetElement - Element to shake
     * @param {Object} options - Shake configuration options
     */
    shake(targetElement, options = {}) {
        // TODO: Implement shake effect
        console.log('EffectManager: Shake effect not yet implemented');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.EffectManager = EffectManager;
}

// Also support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EffectManager };
}
