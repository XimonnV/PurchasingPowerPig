/**
 * Cookie Settings - Persistent user preference storage
 *
 * Utilities for storing and retrieving user preferences in browser cookies.
 * Settings are stored as JSON for easy extensibility.
 *
 * Responsibilities:
 * - Read settings from cookie
 * - Write settings to cookie
 * - Merge new settings with existing
 * - Parse/stringify JSON safely
 *
 * Cookie Structure:
 * ```json
 * {
 *   "savingsVehicle": "usd"  // or "btc"
 * }
 * ```
 *
 * Example:
 * ```javascript
 * // Get current settings
 * const settings = getCookieSettings();
 * console.log(settings.savingsVehicle); // "usd"
 *
 * // Update settings
 * setCookieSetting('savingsVehicle', 'btc');
 * ```
 */

/** Cookie name for storing user preferences */
const SETTINGS_COOKIE_NAME = 'ppp_settings';

/** Cookie expiration in days */
const COOKIE_EXPIRATION_DAYS = 365; // 1 year

/**
 * Get all settings from cookie
 * @returns {Object} Settings object (empty object if no cookie exists)
 */
function getCookieSettings() {
    const cookieValue = getCookie(SETTINGS_COOKIE_NAME);

    if (!cookieValue) {
        return {};
    }

    try {
        return JSON.parse(cookieValue);
    } catch (e) {
        console.warn('Failed to parse settings cookie:', e);
        return {};
    }
}

/**
 * Get a specific setting value from cookie
 * @param {string} key - Setting key (e.g., 'savingsVehicle')
 * @param {*} defaultValue - Default value if setting doesn't exist
 * @returns {*} Setting value or default
 */
function getCookieSetting(key, defaultValue = null) {
    const settings = getCookieSettings();
    return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
}

/**
 * Set a specific setting value in cookie
 * Merges with existing settings
 * @param {string} key - Setting key (e.g., 'savingsVehicle')
 * @param {*} value - Setting value
 */
function setCookieSetting(key, value) {
    const settings = getCookieSettings();
    settings[key] = value;
    setCookieSettings(settings);
}

/**
 * Set all settings in cookie (replaces existing)
 * @param {Object} settings - Settings object to store
 */
function setCookieSettings(settings) {
    try {
        const jsonValue = JSON.stringify(settings);
        setCookie(SETTINGS_COOKIE_NAME, jsonValue, COOKIE_EXPIRATION_DAYS);
    } catch (e) {
        console.error('Failed to stringify settings:', e);
    }
}

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }

    return null;
}

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration in days
 */
function setCookie(name, value, days) {
    let expires = "";

    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }

    document.cookie = name + "=" + value + expires + "; path=/";
}

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 */
function deleteCookie(name) {
    setCookie(name, "", -1);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.getCookieSettings = getCookieSettings;
    window.getCookieSetting = getCookieSetting;
    window.setCookieSetting = setCookieSetting;
    window.setCookieSettings = setCookieSettings;
    window.getCookie = getCookie;
    window.setCookie = setCookie;
    window.deleteCookie = deleteCookie;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCookieSettings,
        getCookieSetting,
        setCookieSetting,
        setCookieSettings,
        getCookie,
        setCookie,
        deleteCookie
    };
}
