/**
 * Settings Storage - Persistent user preference storage
 *
 * Utilities for storing and retrieving user preferences using localStorage.
 * Settings are stored as JSON for easy extensibility.
 * localStorage works with file:// protocol (unlike cookies).
 *
 * Settings Structure:
 * ```json
 * {
 *   "savingsVehicle": "usd"  // or "btc"
 * }
 * ```
 *
 * Example:
 * ```javascript
 * // Get current settings
 * const settings = getSettings();
 * console.log(settings.savingsVehicle); // "usd"
 *
 * // Update settings
 * setSetting('savingsVehicle', 'btc');
 * ```
 */

/** localStorage key for storing user preferences */
const SETTINGS_STORAGE_KEY = 'ppp_settings';

/**
 * Get all settings from localStorage
 * @returns {Object} Settings object (empty object if no settings exist)
 */
function getSettings() {
    try {
        const value = localStorage.getItem(SETTINGS_STORAGE_KEY);

        if (!value) {
            return {};
        }

        return JSON.parse(value);
    } catch (e) {
        console.warn('Failed to parse settings from localStorage:', e);
        return {};
    }
}

/**
 * Get a specific setting value
 * @param {string} key - Setting key (e.g., 'savingsVehicle')
 * @param {*} defaultValue - Default value if setting doesn't exist
 * @returns {*} Setting value or default
 */
function getSetting(key, defaultValue = null) {
    const settings = getSettings();
    return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
}

/**
 * Set a specific setting value in localStorage
 * Merges with existing settings
 * @param {string} key - Setting key (e.g., 'savingsVehicle')
 * @param {*} value - Setting value
 */
function setSetting(key, value) {
    const settings = getSettings();
    console.log('Current settings before update:', settings);
    settings[key] = value;
    console.log('Settings after update:', settings);
    saveSettings(settings);

    // Verify it was saved
    const verified = getSetting(key);
    console.log(`Verification - ${key} saved as:`, verified);
}

/**
 * Set all settings in localStorage (replaces existing)
 * @param {Object} settings - Settings object to store
 */
function saveSettings(settings) {
    try {
        const jsonValue = JSON.stringify(settings);
        localStorage.setItem(SETTINGS_STORAGE_KEY, jsonValue);
        console.log('💾 Settings saved to localStorage:', jsonValue);
    } catch (e) {
        console.error('Failed to save settings to localStorage:', e);
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.getSettings = getSettings;
    window.getSetting = getSetting;
    window.setSetting = setSetting;
    window.saveSettings = saveSettings;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSettings,
        getSetting,
        setSetting,
        saveSettings
    };
}
