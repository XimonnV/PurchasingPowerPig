/**
 * Formatters - Display formatting utilities
 *
 * Pure utility functions for formatting values for display.
 * Centralized formatting ensures consistency across the application.
 *
 * Responsibilities:
 * - Format currency values
 * - Format percentages
 * - Format dates
 * - Format numbers with proper separators
 *
 * Dependencies:
 * - config.js (for display configuration)
 *
 * Example:
 * ```javascript
 * formatCurrency(1234.56); // "$1,235"
 * formatPercentage(45.678); // "46%"
 * formatDate(new Date()); // "2025 January"
 * ```
 */

/**
 * Format a number as currency (rounded to nearest dollar)
 * @param {number} amount - Dollar amount
 * @returns {string} Formatted currency string (e.g., "$1,234")
 */
function formatCurrency(amount) {
    const rounded = Math.round(amount);
    return '$' + rounded.toLocaleString('en-US');
}

/**
 * Format a number as percentage (rounded to nearest percent)
 * @param {number} value - Percentage value (0-100)
 * @returns {string} Formatted percentage string (e.g., "45%")
 */
function formatPercentage(value) {
    const rounded = Math.round(value);
    return rounded + '%';
}

/**
 * Format a date as "YYYY Month"
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (e.g., "2025 January")
 */
function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return 'Invalid Date';
    }

    const year = date.getFullYear();
    const month = CONFIG.display.monthNames[date.getMonth()];
    return `${year} ${month}`;
}

/**
 * Format a date as "YYYY-MM" (for PP display)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (e.g., "2025-01")
 */
function formatDateShort(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return 'Invalid Date';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Format purchasing power value for display
 * Combines currency and date reference
 * @param {number} amount - Dollar amount
 * @param {string} referenceDate - Reference date string (e.g., "2025-01")
 * @returns {string} Formatted PP string (e.g., "$(2025-01)1,234")
 */
function formatPurchasingPower(amount, referenceDate) {
    const formatted = formatCurrency(amount);
    return `$(${referenceDate})${formatted.substring(1)}`; // Remove $ and re-add with date
}

/**
 * Format a number with thousands separators
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default 0)
 * @returns {string} Formatted number string (e.g., "1,234.56")
 */
function formatNumber(num, decimals = 0) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Format a decimal as percentage with specified precision
 * @param {number} decimal - Decimal value (e.g., 0.07 for 7%)
 * @param {number} decimals - Number of decimal places (default 1)
 * @returns {string} Formatted percentage string (e.g., "7.0%")
 */
function formatDecimalAsPercentage(decimal, decimals = 1) {
    const percent = decimal * 100;
    return formatNumber(percent, decimals) + '%';
}

/**
 * Format a slider value for display
 * Applies proper formatting based on the type of value
 * @param {string} sliderType - Type of slider ('savings', 'startAmount', 'inflation')
 * @param {number} value - Slider value
 * @returns {string} Formatted value string
 */
function formatSliderValue(sliderType, value) {
    switch (sliderType) {
        case 'savings':
        case 'startAmount':
            return formatCurrency(value);
        case 'inflation':
            return formatNumber(value, 1); // Show 1 decimal place
        default:
            return String(value);
    }
}

/**
 * Format debug value (for debug display)
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places (default from CONFIG)
 * @returns {string} Formatted debug value
 */
function formatDebugValue(value, decimals = null) {
    const precision = decimals !== null ? decimals : CONFIG.display.debugDecimalPlaces;
    return formatNumber(value, precision);
}

// Export all formatters
if (typeof window !== 'undefined') {
    window.formatCurrency = formatCurrency;
    window.formatPercentage = formatPercentage;
    window.formatDate = formatDate;
    window.formatDateShort = formatDateShort;
    window.formatPurchasingPower = formatPurchasingPower;
    window.formatNumber = formatNumber;
    window.formatDecimalAsPercentage = formatDecimalAsPercentage;
    window.formatSliderValue = formatSliderValue;
    window.formatDebugValue = formatDebugValue;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency,
        formatPercentage,
        formatDate,
        formatDateShort,
        formatPurchasingPower,
        formatNumber,
        formatDecimalAsPercentage,
        formatSliderValue,
        formatDebugValue
    };
}
