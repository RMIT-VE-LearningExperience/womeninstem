/**
 * Utility functions for crane operator game
 */

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if a point is within a box bounds
 * @param {Object} point - {x, y, z}
 * @param {Object} bounds - {min: {x, y, z}, max: {x, y, z}}
 * @returns {boolean}
 */
export function isPointInBounds(point, bounds) {
    return point.x >= bounds.min.x && point.x <= bounds.max.x &&
           point.y >= bounds.min.y && point.y <= bounds.max.y &&
           point.z >= bounds.min.z && point.z <= bounds.max.z;
}

/**
 * Calculate distance between two 3D points
 * @param {Object} p1 - {x, y, z}
 * @param {Object} p2 - {x, y, z}
 * @returns {number}
 */
export function distance3D(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Clamp a value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * @param {number} start
 * @param {number} end
 * @param {number} alpha - 0 to 1
 * @returns {number}
 */
export function lerp(start, end, alpha) {
    return start + (end - start) * alpha;
}

/**
 * Check if physics body velocity is settled (low enough)
 * @param {Object} body - Cannon.js body
 * @param {number} threshold - Velocity threshold
 * @returns {boolean}
 */
export function isBodySettled(body, threshold = 0.5) {
    const vel = body.velocity;
    const angVel = body.angularVelocity;
    return Math.abs(vel.x) < threshold &&
           Math.abs(vel.y) < threshold &&
           Math.abs(vel.z) < threshold &&
           Math.abs(angVel.x) < threshold &&
           Math.abs(angVel.y) < threshold &&
           Math.abs(angVel.z) < threshold;
}

/**
 * Generate a random float between min and max
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomFloat(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Debounce function calls
 * @param {Function} func
 * @param {number} wait - Milliseconds to wait
 * @returns {Function}
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
