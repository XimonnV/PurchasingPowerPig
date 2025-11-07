/**
 * AnimationEngine - Main animation loop manager
 *
 * Manages the requestAnimationFrame loop and coordinates updates for all active drops.
 * Handles pause/resume and tracks active drop controllers.
 *
 * Responsibilities:
 * - Run main animation loop via requestAnimationFrame
 * - Update all active drop controllers each frame
 * - Remove completed drops from active list
 * - Respect pause state
 * - Provide API to add drops
 *
 * Dependencies:
 * - state-manager.js (to check pause state)
 * - DropController (updates each frame)
 *
 * Example:
 * ```javascript
 * const engine = new AnimationEngine(stateManager);
 * engine.start();
 *
 * // Add drops as they're created
 * const dropController = createDrop();
 * engine.addDrop(dropController);
 * ```
 */
class AnimationEngine {
    /**
     * Create animation engine
     * @param {StateManager} stateManager - State manager instance
     */
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.drops = []; // Array of active DropController instances
        this.running = false;
        this.animationFrameId = null;
    }

    /**
     * Start the animation loop
     * Safe to call multiple times (won't start multiple loops)
     */
    start() {
        if (this.running) return;

        this.running = true;
        this.animate();
    }

    /**
     * Stop the animation loop
     * Cleans up all active drops
     */
    stop() {
        this.running = false;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Clean up all drops
        this.drops.forEach(drop => drop.remove());
        this.drops = [];
    }

    /**
     * Main animation loop
     * Called via requestAnimationFrame
     */
    animate() {
        if (!this.running) return;

        const isPaused = this.stateManager.get('isPaused');

        // Only update drops if not paused
        if (!isPaused) {
            this.updateDrops();
        }

        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Update all active drops
     * Removes completed drops from the list
     */
    updateDrops() {
        // Update all drops and filter out completed ones
        this.drops = this.drops.filter(drop => {
            const stillActive = drop.update();
            return stillActive;
        });
    }

    /**
     * Add a drop to the animation engine
     * @param {DropController} dropController - Drop controller to animate
     */
    addDrop(dropController) {
        this.drops.push(dropController);
    }

    /**
     * Remove a specific drop
     * @param {DropController} dropController - Drop to remove
     */
    removeDrop(dropController) {
        const index = this.drops.indexOf(dropController);
        if (index > -1) {
            dropController.remove();
            this.drops.splice(index, 1);
        }
    }

    /**
     * Get count of active drops
     * @returns {number} Number of active drops
     */
    getDropCount() {
        return this.drops.length;
    }

    /**
     * Clear all drops without stopping the engine
     * Useful for reset
     */
    clearAllDrops() {
        this.drops.forEach(drop => drop.remove());
        this.drops = [];
    }

    /**
     * Check if engine is running
     * @returns {boolean} True if running
     */
    isRunning() {
        return this.running;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AnimationEngine = AnimationEngine;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnimationEngine };
}
