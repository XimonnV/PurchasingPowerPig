/**
 * DropController - Orchestrates drop physics, rendering, and collision
 *
 * Coordinates the physics model, renderer, and container to create a complete drop lifecycle.
 * Handles collision detection and triggers callbacks when drop lands.
 *
 * Responsibilities:
 * - Update physics each frame
 * - Update renderer to match physics
 * - Check for collision with container
 * - Trigger onLand callback when collision occurs
 * - Clean up resources when drop is complete
 *
 * Dependencies:
 * - DropPhysics (physics model)
 * - DropRenderer (DOM rendering)
 * - LiquidContainer (collision detection)
 *
 * Example:
 * ```javascript
 * const physics = new DropPhysics(100, 0, 5);
 * const renderer = new DropRenderer(physics, 20, CONFIG);
 * const container = new LiquidContainer('.pig-oval-container', 'fillLevel', CONFIG, stateManager);
 *
 * const controller = new DropController(physics, renderer, container, dropSize, {
 *     onLand: (controller) => {
 *         console.log('Drop landed!');
 *         stateManager.addMonthlySavingsToPig();
 *     }
 * });
 *
 * // In animation loop:
 * const stillActive = controller.update();
 * if (!stillActive) {
 *     // Drop completed, remove from active drops
 * }
 * ```
 */
class DropController {
    /**
     * Create a drop controller
     * @param {DropPhysics} physics - Physics model
     * @param {DropRenderer} renderer - DOM renderer
     * @param {LiquidContainer} container - Target container
     * @param {number} dropSize - Size of drop (for collision detection)
     * @param {Object} callbacks - Callback functions
     * @param {Function} callbacks.onLand - Called when drop lands: (controller) => void
     */
    constructor(physics, renderer, container, dropSize, callbacks = {}) {
        this.physics = physics;
        this.renderer = renderer;
        this.container = container;
        this.dropSize = dropSize;
        this.callbacks = callbacks;
        this.active = true;
        this.dollarAmount = 0; // Can be set externally for inflation drops
    }

    /**
     * Update drop physics, rendering, and check for collision
     * Call this every frame in the animation loop
     * @returns {boolean} True if drop is still active, false if completed
     */
    update() {
        if (!this.active) return false;

        // Update physics (move drop down)
        this.physics.update(1);

        // Update renderer (sync DOM with physics)
        this.renderer.render();

        // Check for collision with container
        const dropY = this.physics.y;
        if (this.container.checkCollision(dropY, this.dropSize)) {
            this.land();
            return false; // Drop is complete
        }

        return true; // Drop still falling
    }

    /**
     * Handle drop landing (collision detected)
     * Triggers onLand callback and cleans up resources
     */
    land() {
        // Trigger onLand callback
        if (this.callbacks.onLand) {
            this.callbacks.onLand(this);
        }

        // Clean up renderer
        this.renderer.remove();

        // Mark as inactive
        this.active = false;
    }

    /**
     * Force remove drop (e.g., on reset/cleanup)
     * Call this to manually remove a drop before it lands
     */
    remove() {
        if (!this.active) return;

        this.renderer.remove();
        this.active = false;
    }

    /**
     * Check if drop is still active
     * @returns {boolean} True if drop is active
     */
    isActive() {
        return this.active;
    }

    /**
     * Get drop position
     * @returns {{x: number, y: number}} Current position
     */
    getPosition() {
        return this.physics.getPosition();
    }

    /**
     * Set dollar amount (for inflation drops)
     * @param {number} amount - Dollar amount this drop represents
     */
    setDollarAmount(amount) {
        this.dollarAmount = amount;
    }

    /**
     * Get dollar amount
     * @returns {number} Dollar amount
     */
    getDollarAmount() {
        return this.dollarAmount;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DropController = DropController;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DropController };
}
