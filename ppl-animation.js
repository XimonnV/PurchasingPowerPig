// Pig and oval container configuration
const pigConfig = {
    width: 300,
    ovalWidth: 200,
    ovalHeight: 150
};

// Animation state
let fillLevel = 0; // 0 to 100 (percentage)
let totalSavings = 0; // Total dollar amount saved
let totalBankSavings = 0; // Total dollar amount lost to inflation (in banker's mug)
let mugFillLevel = 0; // 0 to 100 (percentage) for banker's mug
let drops = [];
let lastDropTime = 0;
const dropInterval = 1000; // 1 second
let isPaused = false; // Pause state
let currentSimDate = new Date(); // Current simulation date (year and month)

// Calculate and apply responsive scale based on viewport height
function calculateAndApplyScale() {
    const baseHeight = 1080; // Base design height
    const minHeight = 640; // Minimum supported height
    const viewportHeight = window.innerHeight;
    
    // Calculate scale: clamp between (640/1080 = 0.593) and 1.0
    let scale = viewportHeight / baseHeight;
    scale = Math.max(0.593, Math.min(1.0, scale));
    
    // Apply scale to CSS variable
    document.documentElement.style.setProperty('--scale', scale);
    
    return scale;
}

// Show scaled elements after scale is applied
function showScaledElements() {
    const elements = document.querySelectorAll('.scaled-element');
    elements.forEach(el => el.classList.add('ready'));
}

// Debounce function to limit resize event frequency
function debounce(func, wait) {
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

// Apply scale immediately when script loads (before DOM is ready)
calculateAndApplyScale();

// Listen for window resize with debouncing
const debouncedResize = debounce(() => {
    calculateAndApplyScale();
}, 150);

window.addEventListener('resize', debouncedResize);

// Get slider values
function getMonthlySavings() {
    const slider = document.getElementById('savings');
    return slider ? parseInt(slider.value) : 0;
}

function getStartingAmount() {
    const slider = document.getElementById('startAmount');
    return slider ? parseInt(slider.value) : 50000;
}

function getAnnualInflation() {
    const slider = document.getElementById('inflation');
    return slider ? parseFloat(slider.value) / 100 : 0.07;
}

function getMonthlyInflationRate() {
    const annualRate = getAnnualInflation();
    return Math.pow(1 + annualRate, 1/12) - 1;
}

// Get the current scale factor from CSS
function getScaleFactor() {
    const scale = getComputedStyle(document.documentElement).getPropertyValue('--scale').trim();
    return parseFloat(scale) || 1;
}

// Drop class
class Drop {
    constructor(startX, startY, size, target = 'pig') {
        this.x = startX;
        this.y = startY;
        this.size = size;
        // Scale falling speed based on viewport scale
        const scaleFactor = getScaleFactor();
        this.speed = (3 + Math.random() * 2) * scaleFactor; // Falling speed scaled
        this.target = target; // 'pig' or 'mug'
        this.dollarAmount = 0; // Will be set externally
        this.element = this.createElement();
    }

    createElement() {
        const drop = document.createElement('div');
        drop.className = 'money-drop';
        drop.style.left = this.x + 'px';
        drop.style.top = this.y + 'px';
        drop.style.width = this.size + 'px';
        drop.style.height = (this.size * 1.5) + 'px';
        document.body.appendChild(drop);
        return drop;
    }

    update() {
        this.y += this.speed;
        this.element.style.top = this.y + 'px';

        if (this.target === 'pig') {
            // Check if drop reached the oval container
            const oval = document.querySelector('.pig-oval-container');
            if (!oval) return true;

            const ovalRect = oval.getBoundingClientRect();
            const ovalCenterY = ovalRect.top + ovalRect.height / 2;
            
            // Calculate current fill level position in oval (use actual oval height)
            const fillHeight = (fillLevel / 100) * ovalRect.height;
            const waterSurfaceY = ovalRect.bottom - fillHeight;

            // Check if drop hits the water surface (or bottom of empty container)
            const targetY = fillLevel > 0 ? waterSurfaceY : ovalRect.bottom - 5;

            if (this.y >= targetY - this.size / 2) {
                // Add monthly savings to total
                const monthlySavings = getMonthlySavings();
                totalSavings += monthlySavings;
                updateSavingsDisplay();
                
                // Add to fill level if not full (based on dollar amount)
                if (fillLevel < 100) {
                    const dropVolume = monthlySavings / 1000; // $100,000 total to fill
                    fillLevel = Math.min(100, fillLevel + dropVolume);
                    updateFillDisplay();
                }
                
                // Remove drop
                this.element.remove();
                return false;
            }
        } else if (this.target === 'mug') {
            // Check if drop reached the banker's mug
            const mug = document.querySelector('.banker-mug-container');
            if (!mug) return true;

            const mugRect = mug.getBoundingClientRect();
            
            // Calculate current fill level position in mug (use actual mug height)
            const fillHeight = (mugFillLevel / 100) * mugRect.height;
            const waterSurfaceY = mugRect.bottom - fillHeight;

            // Check if drop hits the water surface (or bottom of empty container)
            const targetY = mugFillLevel > 0 ? waterSurfaceY : mugRect.bottom - 5;

            if (this.y >= targetY - this.size / 2) {
                // Add inflation loss to bank total
                totalBankSavings += this.dollarAmount;
                updateSavingsDisplay();
                
                // Add to mug fill level if not full
                if (mugFillLevel < 100) {
                    const dropVolume = this.dollarAmount / 700; // $70,000 total to fill mug
                    mugFillLevel = Math.min(100, mugFillLevel + dropVolume);
                    updateMugFillDisplay();
                }
                
                // Remove drop
                this.element.remove();
                return false;
            }
        }

        return true;
    }
}

// Update the visual fill level
function updateFillDisplay() {
    const fillElement = document.querySelector('.pig-oval-fill');
    if (fillElement) {
        fillElement.style.height = fillLevel + '%';
    }
    
    // Update debug display for pig fill
    const debugValue = document.getElementById('debugFillValue');
    if (debugValue) {
        debugValue.textContent = fillLevel.toFixed(2);
    }
}

// Update the mug fill level
function updateMugFillDisplay() {
    const fillElement = document.querySelector('.banker-mug-fill');
    if (fillElement) {
        fillElement.style.height = mugFillLevel + '%';
    }
    
    // Update debug display for mug fill
    const debugMugValue = document.getElementById('debugMugValue');
    if (debugMugValue) {
        debugMugValue.textContent = mugFillLevel.toFixed(2);
    }
}

// Update the savings amount display
function updateSavingsDisplay() {
    const savingsValue = document.getElementById('totalSavingsValue');
    if (savingsValue) {
        savingsValue.textContent = '$' + totalSavings.toLocaleString();
    }
    
    const bankValue = document.getElementById('totalBankValue');
    if (bankValue) {
        // Calculate percentage: (totalBankSavings / totalSavings) * 100, rounded to whole number
        const percentage = totalSavings > 0 ? Math.round((totalBankSavings / totalSavings) * 100) : 0;
        bankValue.textContent = percentage + '%';
    }
    
    // Update debug display with bank dollar amount
    const debugBankDollars = document.getElementById('debugBankDollars');
    if (debugBankDollars) {
        debugBankDollars.textContent = '$' + totalBankSavings.toLocaleString();
    }
}

// Update the date display
function updateDateDisplay() {
    const dateValue = document.getElementById('currentDateValue');
    if (dateValue) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const year = currentSimDate.getFullYear();
        const month = monthNames[currentSimDate.getMonth()];
        dateValue.textContent = year + ' ' + month;
    }
}

// Update the info panel with the baseline date
function updateInfoPanel() {
    const infoText = document.querySelector('.info-text');
    if (infoText) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const now = new Date();
        const year = now.getFullYear();
        const month = monthNames[now.getMonth()];
        infoText.textContent = `A full pig equals the purchasing power of $100K at ${year} ${month}`;
    }
}

// Initialize fill level and savings based on starting amount
function initializeFromStartingAmount() {
    const startingAmount = getStartingAmount();
    totalSavings = startingAmount;
    totalBankSavings = 0;
    fillLevel = (startingAmount / 100000) * 100; // Since pig fills at $100,000
    mugFillLevel = 0;
    currentSimDate = new Date(); // Reset to current date
    updateFillDisplay();
    updateMugFillDisplay();
    updateSavingsDisplay();
    updateDateDisplay();
    updateInfoPanel();
}

// Create a new drop
function createDrop() {
    const savings = getMonthlySavings();
    
    // No drop if savings is 0
    if (savings === 0) return;

    // Calculate drop size with smaller sizes for low values
    // $1-$100: scales from 1.1px to 11px
    // $100-$1000: scales from 11px to 20px
    let size;
    if (savings <= 100) {
        size = 1 + savings * 0.1; // Linear scaling for small amounts
    } else {
        size = 11 + (savings - 100) * 0.01; // Slower scaling for larger amounts
    }
    
    // Apply viewport scale factor
    const scaleFactor = getScaleFactor();
    size = size * scaleFactor;

    // Get pig and oval position
    const oval = document.querySelector('.pig-oval-container');
    if (!oval) return;

    const ovalRect = oval.getBoundingClientRect();
    const dropX = ovalRect.left + ovalRect.width / 2 - size / 2;
    const dropY = 0;

    drops.push(new Drop(dropX, dropY, size, 'pig'));
}

// Create an inflation drop (falls from pig to banker's mug)
function createInflationDrop(dollarAmount) {
    if (dollarAmount <= 0) return;

    // Calculate drop size with same formula as savings drops
    let size;
    if (dollarAmount <= 100) {
        size = 1 + dollarAmount * 0.1;
    } else {
        size = 11 + (dollarAmount - 100) * 0.01;
    }
    
    // Apply viewport scale factor
    const scaleFactor = getScaleFactor();
    size = size * scaleFactor;

    // Get pig oval position - drop starts from bottom
    const oval = document.querySelector('.pig-oval-container');
    if (!oval) return;

    const ovalRect = oval.getBoundingClientRect();
    const dropX = ovalRect.left + ovalRect.width / 2 - size / 2;
    const dropY = ovalRect.bottom; // Start from bottom of oval

    const drop = new Drop(dropX, dropY, size, 'mug');
    drop.dollarAmount = dollarAmount;
    drops.push(drop);
}

// Animation loop
function animate(timestamp) {
    // Skip updates if paused
    if (!isPaused) {
        // Create drops every second (1 month interval)
        if (timestamp - lastDropTime >= dropInterval) {
            // First apply monthly inflation to reduce fillLevel
            const monthlyInflation = getMonthlyInflationRate();
            const inflationReduction = fillLevel * monthlyInflation; // percentage points lost
            const inflationDollars = (inflationReduction / 100) * 100000; // convert to dollars
            
            fillLevel = fillLevel * (1 - monthlyInflation);
            updateFillDisplay();
            
            // Create inflation drop if there's a reduction
            if (inflationDollars > 0) {
                createInflationDrop(inflationDollars);
            }
            
            // Then create the savings drop
            createDrop();
            
            // Increment the simulation date by one month
            currentSimDate.setMonth(currentSimDate.getMonth() + 1);
            updateDateDisplay();
            
            lastDropTime = timestamp;
        }

        // Update all drops
        drops = drops.filter(drop => drop.update());
    }

    requestAnimationFrame(animate);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Ensure scale is applied (in case resize happened before DOM loaded)
    calculateAndApplyScale();
    
    // Show scaled elements now that everything is ready
    showScaledElements();
    
    // Initialize fill and savings from starting amount
    initializeFromStartingAmount();
    
    // Start animation
    requestAnimationFrame(animate);
});

// Reset function (can be called from outside)
function resetPigFill() {
    drops.forEach(drop => drop.element.remove());
    drops = [];
    initializeFromStartingAmount();
}

// Toggle pause function
function togglePause() {
    isPaused = !isPaused;
    
    const pauseButton = document.getElementById('pauseButton');
    if (pauseButton) {
        if (isPaused) {
            pauseButton.textContent = 'Resume';
            pauseButton.classList.add('paused');
        } else {
            pauseButton.textContent = 'Pause';
            pauseButton.classList.remove('paused');
            // Reset lastDropTime to current time to prevent burst of drops
            lastDropTime = performance.now();
        }
    }
}

// Expose functions globally
window.resetPigFill = resetPigFill;
window.initializeFromStartingAmount = initializeFromStartingAmount;
window.togglePause = togglePause;
