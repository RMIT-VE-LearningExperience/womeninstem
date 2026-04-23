/**
 * Utility Functions for Carpenter Defects Game
 */

/**
 * Format time in seconds to MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate elapsed time in seconds
 * @param {number} startTime - Start timestamp
 * @returns {number} Elapsed seconds
 */
export function getElapsedSeconds(startTime) {
    return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get random element from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random element
 */
export function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Save game state to localStorage
 * @param {Object} state - Game state to save
 */
export function saveGameState(state) {
    try {
        localStorage.setItem('carpenter-defects-game', JSON.stringify(state));
    } catch (error) {
        console.warn('Failed to save game state:', error);
    }
}

/**
 * Load game state from localStorage
 * @returns {Object|null} Saved game state or null
 */
export function loadGameState() {
    try {
        const saved = localStorage.getItem('carpenter-defects-game');
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.warn('Failed to load game state:', error);
        return null;
    }
}

/**
 * Clear saved game state
 */
export function clearSavedGameState() {
    try {
        localStorage.removeItem('carpenter-defects-game');
    } catch (error) {
        console.warn('Failed to clear game state:', error);
    }
}

/**
 * Save high score to localStorage
 * @param {number} score - Score to save
 */
export function saveHighScore(score) {
    try {
        const currentHigh = getHighScore();
        if (score > currentHigh) {
            localStorage.setItem('carpenter-defects-highscore', score.toString());
            return true;
        }
        return false;
    } catch (error) {
        console.warn('Failed to save high score:', error);
        return false;
    }
}

/**
 * Get high score from localStorage
 * @returns {number} High score (0 if none saved)
 */
export function getHighScore() {
    try {
        const saved = localStorage.getItem('carpenter-defects-highscore');
        return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
        console.warn('Failed to get high score:', error);
        return 0;
    }
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
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

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get viewport dimensions
 * @returns {Object} Width and height
 */
export function getViewportSize() {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

/**
 * Add event listener with automatic cleanup
 * @param {Element} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} Cleanup function
 */
export function addListener(element, event, handler) {
    element.addEventListener(event, handler);
    return () => element.removeEventListener(event, handler);
}

/**
 * Wait for specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Play sound effect (placeholder for future implementation)
 * @param {string} soundName - Name of sound to play
 */
export function playSound(soundName) {
    // Future: implement sound effects
    console.log('Sound:', soundName);
}

/**
 * Show notification (fallback for browsers without notification API)
 * @param {string} message - Notification message
 */
export function showNotification(message) {
    console.log('Notification:', message);
}

/**
 * Log game event for analytics (placeholder)
 * @param {string} eventName - Event name
 * @param {Object} data - Event data
 */
export function logEvent(eventName, data) {
    console.log('Event:', eventName, data);
}
