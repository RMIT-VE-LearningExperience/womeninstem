/**
 * UI and HUD management
 */

import { formatTime } from './utils.js';

export class UI {
    constructor() {
        // HUD elements
        this.currentLoadEl = document.getElementById('current-load');
        this.attachStatusEl = document.getElementById('attach-status');
        this.windStateEl = document.getElementById('wind-state');
        this.timerEl = document.getElementById('timer');
        this.completedEl = document.getElementById('completed');
        this.messageEl = document.getElementById('message');
        this.loadingEl = document.getElementById('loading');

        this.messageTimeout = null;
    }

    /**
     * Update current load display
     */
    updateCurrentLoad(loadName) {
        this.currentLoadEl.textContent = loadName || 'None';
    }

    /**
     * Update attach status
     */
    updateAttachStatus(attached) {
        this.attachStatusEl.textContent = attached ? 'Attached' : 'Detached';
        if (attached) {
            this.attachStatusEl.classList.add('success');
            this.attachStatusEl.classList.remove('warning');
        } else {
            this.attachStatusEl.classList.remove('success');
            this.attachStatusEl.classList.add('warning');
        }
    }

    /**
     * Update wind state display
     */
    updateWindState(windLevel) {
        const windStates = ['Off', 'Breezy', 'Strong'];
        this.windStateEl.textContent = windStates[windLevel] || 'Off';

        if (windLevel === 0) {
            this.windStateEl.classList.remove('warning', 'danger');
        } else if (windLevel === 1) {
            this.windStateEl.classList.add('warning');
            this.windStateEl.classList.remove('danger');
        } else {
            this.windStateEl.classList.add('danger');
            this.windStateEl.classList.remove('warning');
        }
    }

    /**
     * Update timer display
     */
    updateTimer(seconds) {
        this.timerEl.textContent = formatTime(seconds);
    }

    /**
     * Update completed count
     */
    updateCompleted(count, total = 3) {
        this.completedEl.textContent = `${count}/${total}`;
        if (count === total) {
            this.completedEl.classList.add('success');
        }
    }

    /**
     * Show temporary message
     */
    showMessage(text, type = 'info', duration = 3000) {
        this.messageEl.textContent = text;
        this.messageEl.className = 'show';

        if (type === 'success') {
            this.messageEl.classList.add('success');
        } else if (type === 'warning') {
            this.messageEl.classList.add('warning');
        } else if (type === 'danger') {
            this.messageEl.classList.add('danger');
        }

        // Clear previous timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        // Auto-hide after duration
        this.messageTimeout = setTimeout(() => {
            this.messageEl.classList.remove('show');
        }, duration);
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        setTimeout(() => {
            this.loadingEl.classList.add('hidden');
        }, 500);
    }

    /**
     * Show completion screen
     */
    showCompletion(timeSeconds) {
        const formattedTime = formatTime(timeSeconds);
        this.showMessage(
            `🎉 All loads placed! Time: ${formattedTime}`,
            'success',
            10000
        );
    }

    /**
     * Show safety warning
     */
    showSafetyWarning(message) {
        this.showMessage(`⚠️ ${message}`, 'danger', 2000);
    }

    /**
     * Show zone feedback
     */
    showZoneFeedback(correct, zoneName) {
        if (correct) {
            this.showMessage(`✓ Correct! Placed in ${zoneName}`, 'success', 3000);
        } else {
            this.showMessage(`✗ Wrong zone! Target: ${zoneName}`, 'warning', 3000);
        }
    }
}
