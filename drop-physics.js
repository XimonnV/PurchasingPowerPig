/**
 * DropPhysics - Pure physics model for falling drops
 *
 * Handles position and velocity calculations without any rendering or business logic.
 * This is a pure data model that can be tested without DOM or state dependencies.
 *
 * Responsibilities:
 * - Store drop position (x, y)
 * - Store drop velocity (speed)
 * - Update position based on velocity
 * - Check if drop has reached a target Y position
 *
 * Dependencies: None (pure model)
 *
 * Example:
 * ```javascript
 * const physics = new DropPhysics(100, 0, 5);
 * physics.update(1);  // Move drop down by speed
 * if (physics.hasReachedTarget(400)) {
 *     console.log('Drop landed!');
 * }
 * ```
 */
class DropPhysics {
    /**
     * Create a new drop physics model
     * @param {number} x - Initial X position in pixels
     * @param {number} y - Initial Y position in pixels
     * @param {number} speed - Falling speed in pixels per frame
     */
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
    }

    /**
     * Update position based on velocity
     * @param {number} deltaTime - Time multiplier (usually 1 for fixed timestep)
     */
    update(deltaTime = 1) {
        this.y += this.speed * deltaTime;
    }

    /**
     * Check if drop has reached or passed a target Y position
     * @param {number} targetY - Target Y position in pixels
     * @param {number} dropSize - Size of drop for collision offset (optional)
     * @returns {boolean} True if drop has reached target
     */
    hasReachedTarget(targetY, dropSize = 0) {
        // Check if the center/bottom of drop has reached target
        return this.y >= targetY - (dropSize / 2);
    }

    /**
     * Get current position
     * @returns {{x: number, y: number}} Position object
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Set position (useful for debugging or special cases)
     * @param {number} x - New X position
     * @param {number} y - New Y position
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DropPhysics = DropPhysics;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DropPhysics };
}
