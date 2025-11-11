/**
 * Financial Mathematics Utilities
 * 
 * Shared calculation functions for compound interest, balance calculations,
 * and financial conversions. Used by both animation and UI control logic.
 * 
 * All functions are exposed globally via window object for easy access.
 */

/**
 * Convert annual compound interest rate to monthly compound rate
 * 
 * @param {number} annualRate - Annual interest rate as decimal (e.g., 0.12 for 12%)
 * @returns {number} Monthly compound rate as decimal
 * 
 * @example
 * getMonthlyCompoundRate(0.12) // Returns 0.009489 (0.9489% per month)
 * 
 * Math: (1 + annual)^(1/12) - 1
 * Explanation: Find the monthly rate that compounds to the annual rate over 12 months
 */
function getMonthlyCompoundRate(annualRate) {
    return Math.pow(1 + annualRate, 1/12) - 1;
}

/**
 * Convert monthly compound rate back to annual rate
 * 
 * @param {number} monthlyRate - Monthly interest rate as decimal
 * @returns {number} Annual compound rate as decimal
 * 
 * @example
 * monthlyToAnnualRate(0.009489) // Returns ~0.12 (12% annual)
 * 
 * Math: (1 + monthly)^12 - 1
 * Explanation: Compound the monthly rate over 12 months to get annual rate
 */
function monthlyToAnnualRate(monthlyRate) {
    return Math.pow(1 + monthlyRate, 12) - 1;
}

/**
 * Calculate balanced starting amount given monthly savings and inflation rate
 * 
 * For balance (pig stays same size):
 * monthly savings = starting amount × monthly rate
 * Therefore: starting amount = monthly savings / monthly rate
 * 
 * @param {number} monthlySavings - Monthly savings in dollars
 * @param {number} annualInflationPercent - Annual inflation as percentage (e.g., 12 for 12%)
 * @param {number} roundTo - Round result to nearest multiple (default: 1000)
 * @param {number} min - Minimum allowed value (default: 0)
 * @param {number} max - Maximum allowed value (default: 100000)
 * @returns {number} Balanced starting amount, rounded and clamped
 * 
 * @example
 * calculateBalancedStartAmount(560, 12) // Returns 59000 (rounded to nearest 1000)
 */
function calculateBalancedStartAmount(monthlySavings, annualInflationPercent, roundTo = 1000, min = 0, max = 100000) {
    const annualInflation = annualInflationPercent / 100;
    
    // Handle edge case: if inflation is 0, return max
    if (annualInflation === 0) {
        return max;
    }
    
    // Calculate monthly compound rate
    const monthlyRate = getMonthlyCompoundRate(annualInflation);
    
    // Calculate: starting amount = monthly savings / monthly rate
    let calculatedAmount = monthlySavings / monthlyRate;
    
    // Round to specified multiple
    calculatedAmount = Math.round(calculatedAmount / roundTo) * roundTo;
    
    // Clamp to min/max range
    return Math.max(min, Math.min(max, calculatedAmount));
}

/**
 * Calculate balanced monthly savings given starting amount and inflation rate
 * 
 * For balance (pig stays same size):
 * monthly savings = starting amount × monthly rate
 * 
 * @param {number} startingAmount - Starting amount in dollars
 * @param {number} annualInflationPercent - Annual inflation as percentage (e.g., 12 for 12%)
 * @param {number} roundTo - Round result to nearest multiple (default: 10)
 * @param {number} min - Minimum allowed value (default: 0)
 * @param {number} max - Maximum allowed value (default: 1000)
 * @returns {number} Balanced monthly savings, rounded and clamped
 * 
 * @example
 * calculateBalancedSavings(59000, 12) // Returns 560 (rounded to nearest 10)
 */
function calculateBalancedSavings(startingAmount, annualInflationPercent, roundTo = 10, min = 0, max = 1000) {
    const annualInflation = annualInflationPercent / 100;
    
    // Calculate monthly compound rate
    const monthlyRate = getMonthlyCompoundRate(annualInflation);
    
    // Calculate: monthly savings = starting amount × monthly rate
    let calculatedSavings = startingAmount * monthlyRate;
    
    // Round to specified multiple
    calculatedSavings = Math.round(calculatedSavings / roundTo) * roundTo;
    
    // Clamp to min/max range
    return Math.max(min, Math.min(max, calculatedSavings));
}

/**
 * Calculate balanced inflation rate given starting amount and monthly savings
 * 
 * For balance (pig stays same size):
 * monthly savings = starting amount × monthly rate
 * Therefore: monthly rate = monthly savings / starting amount
 * Then convert monthly rate back to annual percentage
 * 
 * @param {number} startingAmount - Starting amount in dollars
 * @param {number} monthlySavings - Monthly savings in dollars
 * @param {number} roundTo - Round result to decimal places (default: 0.1)
 * @param {number} min - Minimum allowed value (default: 5)
 * @param {number} max - Maximum allowed value (default: 20)
 * @returns {number} Balanced annual inflation rate as percentage
 * 
 * @example
 * calculateBalancedInflation(59000, 560) // Returns 11.4% (rounded to 0.1)
 */
function calculateBalancedInflation(startingAmount, monthlySavings, roundTo = 0.1, min = 5, max = 20) {
    // Handle edge case: if starting amount is 0, return default
    if (startingAmount === 0) {
        return 7; // Default inflation rate
    }
    
    // Calculate monthly rate: monthly savings / starting amount
    const monthlyRate = monthlySavings / startingAmount;
    
    // Convert monthly rate back to annual percentage
    const annualRate = monthlyToAnnualRate(monthlyRate);
    let calculatedInflation = annualRate * 100;
    
    // Round to specified decimal places
    const factor = 1 / roundTo;
    calculatedInflation = Math.round(calculatedInflation * factor) / factor;
    
    // Clamp to min/max range
    return Math.max(min, Math.min(max, calculatedInflation));
}

/**
 * Calculate monthly inflation loss from a given balance
 *
 * @param {number} currentBalance - Current balance in dollars
 * @param {number} annualInflationPercent - Annual inflation as percentage
 * @returns {number} Dollar amount lost to inflation this month
 *
 * @example
 * calculateMonthlyInflationLoss(56000, 12) // Returns ~531.38
 */
function calculateMonthlyInflationLoss(currentBalance, annualInflationPercent) {
    const annualInflation = annualInflationPercent / 100;
    const monthlyRate = getMonthlyCompoundRate(annualInflation);
    return currentBalance * monthlyRate;
}

/**
 * Calculate inflation loss in dollars based on cumulative factor change
 * This calculates how many dollars of purchasing power were lost due to inflation
 *
 * @param {number} totalSavings - Total nominal dollars saved
 * @param {number} oldFactor - Cumulative inflation factor before this month
 * @param {number} newFactor - Cumulative inflation factor after this month
 * @returns {number} Dollar amount of purchasing power lost this month
 *
 * @example
 * // If you have $52,000 saved, and factor goes from 1.112 to 1.118:
 * calculateInflationLossFromFactor(52000, 1.112, 1.118) // Returns ~281.47
 * // This means you lost $281.47 in purchasing power
 */
function calculateInflationLossFromFactor(totalSavings, oldFactor, newFactor) {
    // Purchasing power before inflation
    const ppBefore = totalSavings / oldFactor;

    // Purchasing power after inflation
    const ppAfter = totalSavings / newFactor;

    // Loss in purchasing power (in dollars)
    const loss = ppBefore - ppAfter;

    return Math.max(0, loss); // Ensure non-negative
}

/**
 * Determine balance state: will pig grow, shrink, or stay balanced?
 * 
 * @param {number} startingAmount - Starting amount in dollars
 * @param {number} monthlySavings - Monthly savings in dollars
 * @param {number} annualInflationPercent - Annual inflation as percentage
 * @returns {string} One of: 'balanced', 'grow', 'shrink'
 * 
 * @example
 * getBalanceState(56000, 560, 12) // Returns 'grow' (savings > loss)
 * getBalanceState(56000, 500, 12) // Returns 'shrink' (savings < loss)
 * getBalanceState(59000, 560, 12) // Returns 'balanced' (savings ≈ loss)
 */
function getBalanceState(startingAmount, monthlySavings, annualInflationPercent) {
    const monthlyLoss = calculateMonthlyInflationLoss(startingAmount, annualInflationPercent);
    
    // Use epsilon that accounts for rounding in balance calculations
    // - Starting amount rounds to $1000 → max ~$10/month error
    // - Savings rounds to $10 → $10 error  
    // - Inflation rounds to 0.1% → minimal error
    const epsilon = 10.0; // Within $10 is considered balanced (accounts for rounding)
    
    if (Math.abs(monthlySavings - monthlyLoss) < epsilon) {
        return 'balanced';
    } else if (monthlySavings > monthlyLoss) {
        return 'grow';
    } else {
        return 'shrink';
    }
}

/**
 * Check if current values create a balanced state
 *
 * Returns true if any of the three values (startAmount, savings, inflation)
 * matches its calculated balanced value.
 *
 * @param {number} startAmount - Current starting amount
 * @param {number} savings - Current monthly savings
 * @param {number} inflation - Current annual inflation percentage
 * @returns {boolean} True if values are balanced
 */
function isBalanced(startAmount, savings, inflation) {
    // Calculate what each balanced value would be
    const balancedStartAmount = calculateBalancedStartAmount(savings, inflation);
    const balancedSavings = calculateBalancedSavings(startAmount, inflation);
    const balancedInflation = calculateBalancedInflation(startAmount, savings);

    // Check if any of the three calculations match current values
    return (startAmount === balancedStartAmount) ||
           (savings === balancedSavings) ||
           (Math.abs(inflation - balancedInflation) < 0.01); // Float comparison with epsilon
}

/**
 * Bitcoin Power Law - Calculate BTC price in USD using Porkopolis Economics power law model
 *
 * Formula: Price (USD) = 10^{(-17.0161223 + 5.8451542 × log₁₀(t))}
 * where:
 * - t = days since Bitcoin's genesis block (January 3, 2009)
 *
 * @param {Date} date - Date to calculate BTC price for (defaults to current date)
 * @returns {number} Bitcoin price in USD
 *
 * @example
 * getBitcoinPowerLawPrice(new Date('2024-01-01')) // Returns ~$68,513
 * getBitcoinPowerLawPrice() // Returns price for current date
 */
function getBitcoinPowerLawPrice(date = new Date()) {
    // Bitcoin genesis block timestamp: January 3, 2009
    const GENESIS_BLOCK_DATE = new Date('2009-01-03T00:00:00Z');

    // Power law constants from Porkopolis Economics
    const C = -17.0161223;
    const D = 5.8451542;

    // Calculate days since genesis block
    const millisecondsSinceGenesis = date.getTime() - GENESIS_BLOCK_DATE.getTime();
    const daysSinceGenesis = millisecondsSinceGenesis / (1000 * 60 * 60 * 24);

    // Calculate price using power law: Price = 10^(C + D * log10(t))
    const price = Math.pow(10, C + D * Math.log10(daysSinceGenesis));

    return price;
}

/**
 * Convert USD to BTC using Bitcoin Power Law
 *
 * @param {number} usdAmount - Amount in USD
 * @param {Date} date - Date to use for conversion rate (defaults to current date)
 * @returns {number} Equivalent amount in BTC
 *
 * @example
 * convertUsdToBtc(100000) // Returns ~1.142 BTC (at current power law price)
 * convertUsdToBtc(87542, new Date('2024-01-01')) // Returns ~1.0 BTC
 */
function convertUsdToBtc(usdAmount, date = new Date()) {
    const btcPrice = getBitcoinPowerLawPrice(date);
    return usdAmount / btcPrice;
}

/**
 * Convert BTC to USD using Bitcoin Power Law
 *
 * @param {number} btcAmount - Amount in BTC
 * @param {Date} date - Date to use for conversion rate (defaults to current date)
 * @returns {number} Equivalent amount in USD
 *
 * @example
 * convertBtcToUsd(1.0) // Returns ~$87,542 (at current power law price)
 * convertBtcToUsd(1.0, new Date('2024-01-01')) // Returns ~$87,542
 */
function convertBtcToUsd(btcAmount, date = new Date()) {
    const btcPrice = getBitcoinPowerLawPrice(date);
    return btcAmount * btcPrice;
}

/**
 * Calculate the maximum pig oval capacity in BTC at a given date
 * Uses the pig capacity in dollars (from CONFIG) and converts to BTC using power law
 *
 * @param {Date} date - Date to use for BTC price calculation (typically simulation start date)
 * @returns {number} Full pig capacity in BTC (always positive)
 *
 * @example
 * // If PIG_CAPACITY_DOLLARS = $100,000 and BTC price on 2024-01-01 is $62,805
 * calculateFullPigInBtc(new Date('2024-01-01')) // Returns ~1.592 BTC
 *
 * // For today with BTC at $103,534
 * calculateFullPigInBtc(new Date()) // Returns ~0.9659 BTC
 */
function calculateFullPigInBtc(date = new Date()) {
    // Read pig capacity from CONFIG
    const pigCapacityDollars = CONFIG.PIG_CAPACITY_DOLLARS;

    // Validate input
    if (!pigCapacityDollars || pigCapacityDollars <= 0) {
        console.error('Invalid PIG_CAPACITY_DOLLARS:', pigCapacityDollars);
        return 0;
    }

    // Convert to BTC using power law price at the given date
    const btcAmount = convertUsdToBtc(pigCapacityDollars, date);

    // Ensure positive result
    if (btcAmount <= 0 || isNaN(btcAmount)) {
        console.error('Invalid BTC calculation result:', btcAmount);
        return 0;
    }

    return btcAmount;
}

// ============================================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================================

if (typeof window !== 'undefined') {
    // Core conversion functions
    window.getMonthlyCompoundRate = getMonthlyCompoundRate;
    window.monthlyToAnnualRate = monthlyToAnnualRate;

    // Balance calculation functions
    window.calculateBalancedStartAmount = calculateBalancedStartAmount;
    window.calculateBalancedSavings = calculateBalancedSavings;
    window.calculateBalancedInflation = calculateBalancedInflation;

    // Utility functions
    window.calculateMonthlyInflationLoss = calculateMonthlyInflationLoss;
    window.calculateInflationLossFromFactor = calculateInflationLossFromFactor;
    window.getBalanceState = getBalanceState;
    window.isBalanced = isBalanced;

    // Bitcoin Power Law functions
    window.getBitcoinPowerLawPrice = getBitcoinPowerLawPrice;
    window.convertUsdToBtc = convertUsdToBtc;
    window.convertBtcToUsd = convertBtcToUsd;
    window.calculateFullPigInBtc = calculateFullPigInBtc;

    // Create namespace for cleaner access (optional, but recommended)
    window.FinancialMath = {
        getMonthlyCompoundRate,
        monthlyToAnnualRate,
        calculateBalancedStartAmount,
        calculateBalancedSavings,
        calculateBalancedInflation,
        calculateMonthlyInflationLoss,
        calculateInflationLossFromFactor,
        getBalanceState,
        isBalanced,
        getBitcoinPowerLawPrice,
        convertUsdToBtc,
        convertBtcToUsd,
        calculateFullPigInBtc
    };
}
