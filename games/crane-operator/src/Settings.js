/**
 * Settings modal and preferences management
 * Handles UI scaling and camera mode selection with localStorage persistence
 */
export class Settings {
    constructor(cameraController) {
        this.cameraController = cameraController;
        this.loadSettings();
        this.createModal();
        this.applySettings();
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('craneOperator_settings');
        this.settings = saved ? JSON.parse(saved) : {
            uiScale: 1.0,
            cameraMode: 'followHook'
        };
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('craneOperator_settings', JSON.stringify(this.settings));
    }

    /**
     * Create modal HTML structure
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'settings-modal';
        modal.innerHTML = `
            <div class="settings-backdrop"></div>
            <div class="settings-panel">
                <h2>Settings</h2>

                <div class="setting-item">
                    <label>UI Scale</label>
                    <input type="range" id="ui-scale-slider"
                           min="0.8" max="1.4" step="0.1"
                           value="${this.settings.uiScale}">
                    <span id="ui-scale-value">${this.settings.uiScale}</span>
                </div>

                <div class="setting-item">
                    <label>Default Camera Mode</label>
                    <select id="camera-mode-select">
                        <option value="followHook">Follow Hook</option>
                        <option value="followLoad">Follow Load</option>
                        <option value="focusPickup">Focus Pickup</option>
                        <option value="focusTarget">Focus Target</option>
                    </select>
                </div>

                <div class="settings-actions">
                    <button id="settings-close" class="btn-primary">Close</button>
                    <button id="settings-reset" class="btn-secondary">Reset</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        this.modal = modal;
        this.modal.style.display = 'none';

        // Set up event listeners
        document.getElementById('ui-scale-slider').addEventListener('input', (e) => {
            this.settings.uiScale = parseFloat(e.target.value);
            document.getElementById('ui-scale-value').textContent = this.settings.uiScale;
            this.applySettings();
        });

        document.getElementById('camera-mode-select').addEventListener('change', (e) => {
            this.settings.cameraMode = e.target.value;
        });

        document.getElementById('settings-close').addEventListener('click', () => {
            this.close();
        });

        document.getElementById('settings-reset').addEventListener('click', () => {
            this.reset();
        });

        // Set initial select value
        document.getElementById('camera-mode-select').value = this.settings.cameraMode;
    }

    /**
     * Apply settings (UI scale via CSS variable)
     */
    applySettings() {
        document.documentElement.style.setProperty('--ui-scale', this.settings.uiScale);
    }

    /**
     * Open settings modal
     * @returns {boolean} Pause state (true = pause game)
     */
    open() {
        this.modal.style.display = 'block';
        return true; // Signal to pause game
    }

    /**
     * Close settings modal
     * @returns {boolean} Pause state (false = resume game)
     */
    close() {
        this.modal.style.display = 'none';
        this.saveSettings();
        return false; // Signal to resume game
    }

    /**
     * Reset settings to defaults
     */
    reset() {
        this.settings = {
            uiScale: 1.0,
            cameraMode: 'followHook'
        };
        document.getElementById('ui-scale-slider').value = 1.0;
        document.getElementById('ui-scale-value').textContent = '1.0';
        document.getElementById('camera-mode-select').value = 'followHook';
        this.applySettings();
    }

    /**
     * Toggle settings modal
     * @returns {boolean} Pause state
     */
    toggle() {
        if (this.modal.style.display === 'none') {
            return this.open();
        } else {
            return this.close();
        }
    }
}
