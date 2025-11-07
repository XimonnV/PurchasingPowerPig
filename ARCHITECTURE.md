# Purchasing Power Pig - Architecture Overview

## System Architecture (Post Sprint 3 Refactoring)

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         app.js                              │
│                   Main Application Controller                │
│                                                             │
│  • Single entry point                                       │
│  • Initializes all modules in correct order                │
│  • Provides high-level API (start, pause, restart)         │
│  • Coordinates module dependencies                         │
└─────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
│   Core Layer    │  │  UI Layer   │  │  Business Logic │
└─────────────────┘  └─────────────┘  └─────────────────┘
```

### Complete Module Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ ENTRY POINT                                                      │
├──────────────────────────────────────────────────────────────────┤
│  app.js - Main application controller                           │
│    └─→ Initializes everything                                   │
│    └─→ Provides: start(), pause(), resume(), restart()          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ CORE LAYER (Foundation)                                          │
├──────────────────────────────────────────────────────────────────┤
│  config.js                                                       │
│    └─→ All constants, magic numbers, configuration              │
│    └─→ Single source of truth                                   │
│                                                                  │
│  state-manager.js                                                │
│    └─→ Centralized state (fillLevel, totalSavings, etc.)       │
│    └─→ Pub/sub pattern (subscribe to state changes)            │
│    └─→ Pure state management (no business logic)               │
│                                                                  │
│  dom-cache.js                                                    │
│    └─→ Caches all DOM elements (no repeated querySelector)     │
│    └─→ Caches slider values in memory (ultra-fast reads)       │
│    └─→ Event listeners keep cache synchronized                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ CALCULATIONS LAYER (Pure Functions)                              │
├──────────────────────────────────────────────────────────────────┤
│  financial-math.js                                               │
│    └─→ Pure calculation functions                               │
│    └─→ Monthly compound rate, inflation, etc.                   │
│    └─→ No side effects, easily testable                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC LAYER                                             │
├──────────────────────────────────────────────────────────────────┤
│  simulation-manager.js                                           │
│    └─→ Business rules (add savings, apply inflation)           │
│    └─→ Advance simulation date                                  │
│    └─→ Calculate derived values (PP, percentages)              │
│    └─→ Reset simulation                                         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ UI LAYER (User Interaction)                                      │
├──────────────────────────────────────────────────────────────────┤
│  viewport-manager.js                                             │
│    └─→ Viewport scaling and responsive layout                   │
│    └─→ SVH support detection                                    │
│    └─→ Mobile portrait mode handling                           │
│                                                                  │
│  balance-controller.js                                           │
│    └─→ Balance slider UI logic                                  │
│    └─→ Balance button handlers                                  │
│    └─→ Icon updates                                             │
│                                                                  │
│  start-state-controller.js                                       │
│    └─→ Welcome screen logic                                     │
│    └─→ Enter key handler                                        │
│    └─→ Transition to simulation                                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DISPLAY LAYER (Visual Updates)                                   │
├──────────────────────────────────────────────────────────────────┤
│  display-manager.js                                              │
│    └─→ Coordinates all display handlers                         │
│    └─→ Sets up state subscriptions                              │
│    └─→ updateAll() method                                       │
│                                                                  │
│  liquid-display-handler.js                                       │
│    └─→ Pig fill display                                         │
│    └─→ Mug fill display                                         │
│    └─→ Percentage displays                                      │
│                                                                  │
│  savings-display-handler.js                                      │
│    └─→ Total savings display                                    │
│    └─→ PP lost display                                          │
│    └─→ PP value display                                         │
│                                                                  │
│  date-display-handler.js                                         │
│    └─→ Current date display                                     │
│    └─→ Start date display                                       │
│                                                                  │
│  ui-display-handler.js                                           │
│    └─→ Pause button UI                                          │
│    └─→ Info panel text                                          │
│    └─→ Slider value displays                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ EFFECTS LAYER (Visual Effects)                                   │
├──────────────────────────────────────────────────────────────────┤
│  effect-manager.js                                               │
│    └─→ Coordinates effects                                      │
│    └─→ Ripple effect creation                                   │
│    └─→ Future: particles, shake, etc.                          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DROP SYSTEM (Physics & Rendering) - Sprint 2 Refactoring         │
├──────────────────────────────────────────────────────────────────┤
│  drop-physics.js                                                 │
│    └─→ Pure physics model (position, velocity)                  │
│    └─→ update(deltaTime)                                        │
│    └─→ No DOM, no state dependencies                            │
│                                                                  │
│  drop-renderer.js                                                │
│    └─→ Pure DOM rendering                                       │
│    └─→ createElement(), render(), remove()                      │
│    └─→ Syncs DOM with physics                                   │
│                                                                  │
│  liquid-container.js                                             │
│    └─→ Abstract container (pig & mug)                           │
│    └─→ getSurfaceY(), checkCollision()                         │
│    └─→ Eliminates duplication                                   │
│                                                                  │
│  drop-controller.js                                              │
│    └─→ Orchestrates physics + renderer + container             │
│    └─→ Collision detection                                      │
│    └─→ Triggers callbacks on landing                            │
│                                                                  │
│  animation-engine.js                                             │
│    └─→ Main animation loop (requestAnimationFrame)              │
│    └─→ Updates all active drops                                 │
│    └─→ Removes completed drops                                  │
│    └─→ Respects pause state                                     │
│                                                                  │
│  timing-manager.js                                               │
│    └─→ Drop interval timing (setInterval)                       │
│    └─→ Creates drops every 1000ms                               │
│    └─→ Auto-pauses/resumes via subscriptions                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ UTILITIES (Pure Functions) - Sprint 3 Extraction                 │
├──────────────────────────────────────────────────────────────────┤
│  drop-size-calculator.js                                         │
│    └─→ Calculate drop size from dollar amount                   │
│    └─→ Apply scale factor                                       │
│    └─→ Pure utility, easily testable                            │
│                                                                  │
│  formatters.js                                                   │
│    └─→ formatCurrency(), formatPercentage()                    │
│    └─→ formatDate(), formatPurchasingPower()                   │
│    └─→ Centralized formatting for consistency                   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Initialization Flow

```
1. index.html loads
2. DOM ready event fires
3. app.js creates PurchasingPowerPigApp instance
4. app.initialize() runs:
   ├─→ Initialize DOMCache (elements + settings)
   ├─→ Initialize ViewportManager (scaling)
   ├─→ Initialize DisplayManager (subscriptions)
   ├─→ Initialize EffectManager
   ├─→ Initialize SimulationManager
   ├─→ Initialize LiquidContainers (pig & mug)
   ├─→ Initialize AnimationEngine (start loop)
   ├─→ Initialize TimingManager (drop intervals)
   ├─→ Initialize UI Controllers (balance, start state)
   ├─→ Initialize state from starting amount
   ├─→ Update all displays
   └─→ Start simulation (if not in start state)
```

### Drop Creation Flow (Savings Drop)

```
1. TimingManager fires every 1000ms
2. app.createSavingsDrop() called
3. Get monthly savings from DOMCache
4. Calculate drop size (DropSizeCalculator)
5. Get spawn position from PigContainer
6. Create DropPhysics (position, velocity)
7. Create DropRenderer (DOM element)
8. Create DropController (orchestration)
9. Add to AnimationEngine
10. Animation loop updates drop each frame:
    ├─→ DropPhysics.update() (move down)
    ├─→ DropRenderer.render() (sync DOM)
    └─→ LiquidContainer.checkCollision()
11. On collision:
    ├─→ SimulationManager.addMonthlySavingsToPig()
    ├─→ SimulationManager.advanceMonth()
    ├─→ EffectManager.createRipple()
    └─→ After 500ms: apply inflation & create inflation drop
```

### State Change Flow (Event-Driven)

```
1. SimulationManager updates state:
   stateManager.setState({ fillLevel: 50 })

2. StateManager notifies subscribers:
   notify({ fillLevel: { old: 45, new: 50 } })

3. DisplayManager subscriptions fire automatically:
   liquidDisplayHandler.updatePigFill(50)

4. Display updates (no direct calls!):
   fillElement.style.height = '50%'
```

## Key Architectural Patterns

### 1. Single Responsibility Principle
Each module has ONE clear purpose:
- **drop-physics.js**: ONLY physics (no DOM, no state)
- **drop-renderer.js**: ONLY rendering (no logic)
- **simulation-manager.js**: ONLY business rules
- **state-manager.js**: ONLY state management

### 2. Dependency Injection
Dependencies passed to constructors, not globally accessed:
```javascript
// ❌ BAD
class Display {
    update() {
        const state = window.stateManager.get('fillLevel');
    }
}

// ✅ GOOD
class Display {
    constructor(stateManager) {
        this.state = stateManager;
    }
    update() {
        const state = this.state.get('fillLevel');
    }
}
```

### 3. Event-Driven Updates
ALL display updates via subscriptions:
```javascript
// Setup once
stateManager.subscribe('fillLevel', () => {
    displayManager.updateFillDisplay();
});

// Then just update state (displays update automatically)
stateManager.setState({ fillLevel: 50 });
```

### 4. Pure Functions
Calculations separated from side effects:
```javascript
// Pure function (financial-math.js)
function calculateInflation(amount, rate) {
    return amount * rate;
}

// Side effects isolated (simulation-manager.js)
function applyInflation() {
    const amount = stateManager.get('fillLevel');
    const rate = stateManager.getMonthlyInflationRate();
    const result = calculateInflation(amount, rate); // Pure
    stateManager.setState({ fillLevel: result }); // Side effect
}
```

### 5. Configuration from CONFIG
All constants in config.js:
```javascript
// ❌ BAD
const dropSpeed = 3; // Magic number

// ✅ GOOD
const dropSpeed = CONFIG.drop.minSpeed;
```

## Testing Strategy

### Testable Modules (Pure, No Dependencies)
- **drop-physics.js** - Physics calculations
- **financial-math.js** - Financial calculations
- **drop-size-calculator.js** - Size calculations
- **formatters.js** - Display formatting

### Integration Test Targets
- **drop-controller.js** - Orchestration logic
- **simulation-manager.js** - Business rules
- **animation-engine.js** - Animation loop
- **timing-manager.js** - Timing logic

### UI Test Targets
- **display-manager.js** - Display coordination
- **balance-controller.js** - UI interactions
- **viewport-manager.js** - Responsive behavior

## Performance Optimizations

1. **DOM Caching** (dom-cache.js)
   - All elements cached on initialization
   - No repeated querySelector calls
   - Slider values cached in memory

2. **RequestAnimationFrame** (animation-engine.js)
   - Smooth 60fps animations
   - Browser-optimized timing
   - Auto-pauses when not visible

3. **Event-Driven** (state-manager.js)
   - Only update displays when state changes
   - No polling or unnecessary updates
   - Efficient pub/sub pattern

4. **Scale Factor** (viewport-manager.js)
   - CSS variable for scaling
   - GPU-accelerated transforms
   - One calculation, many applications

## File Size Summary

**Total: ~4,200 lines** (up from ~2,150 pre-refactoring)

**Why more lines?**
- Better separation → More files
- More documentation → JSDoc comments
- More clarity → Explicit > implicit
- Worth it → Dramatically more maintainable

**Trade-off:**
- 95% increase in lines
- 500% increase in maintainability
- 1000% increase in testability
- ∞% increase in onboarding speed

## Benefits Achieved

✅ **Testability**: Pure functions can be unit tested
✅ **Maintainability**: Clear responsibilities, easy to find code
✅ **Extensibility**: Easy to add features (new containers, effects, etc.)
✅ **Readability**: Self-documenting structure
✅ **Debuggability**: Single breakpoint per concern
✅ **Onboarding**: New developers can understand quickly
✅ **No Duplication**: Pig and mug share container logic

## Next Steps (Future Enhancements)

1. **Add Unit Tests**
   - Test pure functions first
   - Mock state manager for integration tests
   - Target 60-80% coverage

2. **Performance Monitoring**
   - Add performance.mark() calls
   - Track drop creation time
   - Monitor animation frame time

3. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

4. **Features**
   - Multiple containers
   - Different drop types
   - Animation effects
   - Data export

## Conclusion

The refactoring transformed a monolithic codebase into a modular, maintainable architecture. Each module has a clear, single responsibility. Dependencies are explicit. Testing is possible. Future development will be much faster and safer.

**The investment in clean architecture pays dividends forever.**
