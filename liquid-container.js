/**
 * LiquidContainer - Abstract container for pig and mug
 *
 * Provides a unified interface for liquid containers (pig and mug).
 * Eliminates duplication between pig and mug collision detection logic.
 *
 * Responsibilities:
 * - Get container's liquid surface Y position
 * - Check collision with drops
 * - Provide container element reference
 * - Calculate collision target Y
 *
 * Dependencies:
 * - config.js (for collision constants)
 * - state-manager.js (to read fill levels)
 *
 * Example:
 * ```javascript
 * const pigContainer = new LiquidContainer(
 *     CONFIG.selectors.pigOvalContainer,
 *     'fillLevel',
 *     CONFIG,
 *     stateManager
 * );
 * const surfaceY = pigContainer.getSurfaceY();
 * const hasCollision = pigContainer.checkCollision(dropY, dropSize);
 * ```
 */
class LiquidContainer {
    /**
     * Create a liquid container abstraction
     * @param {string} selector - CSS selector for container element
     * @param {string} fillLevelKey - State key for fill level ('fillLevel' or 'mugFillLevel')
     * @param {Object} config - CONFIG object
     * @param {StateManager} stateManager - State manager instance
     */
    constructor(selector, fillLevelKey, config, stateManager) {
        this.selector = selector;
        this.fillLevelKey = fillLevelKey;
        this.config = config;
        this.stateManager = stateManager;
    }

    /**
     * Get the container DOM element
     * @returns {HTMLElement|null} Container element or null if not found
     */
    getElement() {
        return document.querySelector(this.selector);
    }

    /**
     * Get current fill level from state
     * @returns {number} Fill level percentage (0-100)
     */
    getFillLevel() {
        return this.stateManager.get(this.fillLevelKey);
    }

    /**
     * Get the Y position of the liquid surface
     * @returns {number|null} Surface Y position in pixels, or null if container not found
     */
    getSurfaceY() {
        const container = this.getElement();
        if (!container) return null;

        const rect = container.getBoundingClientRect();
        const fillLevel = this.getFillLevel();

        // Calculate fill height
        const fillHeight = (fillLevel / 100) * rect.height;

        // Surface is at bottom minus fill height
        const surfaceY = rect.bottom - fillHeight;

        return surfaceY;
    }

    /**
     * Get the target Y position for collision detection
     * Takes into account empty container offset
     * @returns {number|null} Target Y position, or null if container not found
     */
    getTargetY() {
        const container = this.getElement();
        if (!container) return null;

        const rect = container.getBoundingClientRect();
        const fillLevel = this.getFillLevel();

        if (fillLevel > 0) {
            // If container has liquid, target is the surface
            return this.getSurfaceY();
        } else {
            // If empty, target is bottom with offset
            return rect.bottom - this.config.collision.emptyContainerOffset;
        }
    }

    /**
     * Check if a drop at given position has collided with this container
     * @param {number} dropY - Drop's Y position
     * @param {number} dropSize - Drop's size (for collision offset)
     * @returns {boolean} True if collision detected
     */
    checkCollision(dropY, dropSize) {
        const targetY = this.getTargetY();
        if (targetY === null) return false;

        // Drop hits target when its center reaches the target Y
        return dropY >= targetY - (dropSize / 2);
    }

    /**
     * Get container bounding rectangle
     * @returns {DOMRect|null} Container bounds, or null if not found
     */
    getBounds() {
        const container = this.getElement();
        return container ? container.getBoundingClientRect() : null;
    }

    /**
     * Calculate the center X position of the container
     * Useful for positioning drops
     * @returns {number|null} Center X position, or null if container not found
     */
    getCenterX() {
        const bounds = this.getBounds();
        if (!bounds) return null;
        return bounds.left + (bounds.width / 2);
    }

    /**
     * Calculate drop spawn position (centered above container)
     * @param {number} dropSize - Size of drop to spawn
     * @returns {{x: number, y: number}|null} Spawn position {x, y} or null if container not found
     */
    getDropSpawnPosition(dropSize) {
        const bounds = this.getBounds();
        if (!bounds) return null;

        return {
            x: bounds.left + (bounds.width / 2) - (dropSize / 2),
            y: 0 // Spawn at top of viewport
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.LiquidContainer = LiquidContainer;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LiquidContainer };
}
