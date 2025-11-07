/**
 * DropRenderer - Pure DOM rendering for drops
 *
 * Handles creating, updating, and removing drop DOM elements.
 * Separated from physics so rendering can be tested/mocked independently.
 *
 * Responsibilities:
 * - Create drop DOM element
 * - Update DOM element position from physics model
 * - Remove drop element from DOM
 * - Apply visual styling
 *
 * Dependencies:
 * - config.js (for CSS class names and drop height multiplier)
 * - DropPhysics (to read position from)
 *
 * Example:
 * ```javascript
 * const physics = new DropPhysics(100, 0, 5);
 * const renderer = new DropRenderer(physics, 20, CONFIG);
 * renderer.render(); // Update DOM based on physics position
 * renderer.remove(); // Clean up DOM element
 * ```
 */
class DropRenderer {
    /**
     * Create a new drop renderer
     * @param {DropPhysics} physics - Physics model to read position from
     * @param {number} size - Drop size in pixels (width)
     * @param {Object} config - CONFIG object for constants
     */
    constructor(physics, size, config) {
        this.physics = physics;
        this.size = size;
        this.config = config;
        this.element = this.createElement();
    }

    /**
     * Create the drop DOM element and add to document
     * @returns {HTMLElement} Created drop element
     */
    createElement() {
        const drop = document.createElement('div');
        drop.className = this.config.cssClasses.moneyDrop;

        // Set initial position and size
        const pos = this.physics.getPosition();
        drop.style.left = pos.x + 'px';
        drop.style.top = pos.y + 'px';
        drop.style.width = this.size + 'px';

        // Drop height is 1.5x width for teardrop shape
        drop.style.height = (this.size * 1.5) + 'px';

        // Add to document
        document.body.appendChild(drop);

        return drop;
    }

    /**
     * Update DOM element position from physics model
     * Call this every frame to sync visual position with physics
     */
    render() {
        if (!this.element) return;

        const pos = this.physics.getPosition();
        this.element.style.left = pos.x + 'px';
        this.element.style.top = pos.y + 'px';
    }

    /**
     * Remove drop element from DOM
     * Call this when drop animation is complete
     */
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.remove();
        }
        this.element = null;
    }

    /**
     * Get the DOM element (for advanced use cases)
     * @returns {HTMLElement|null} Drop element
     */
    getElement() {
        return this.element;
    }

    /**
     * Check if element still exists in DOM
     * @returns {boolean} True if element exists
     */
    isActive() {
        return this.element !== null && this.element.parentNode !== null;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DropRenderer = DropRenderer;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DropRenderer };
}
