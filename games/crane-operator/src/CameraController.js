/**
 * Camera focus modes with smooth transitions
 * Manages 4 camera presets: Follow Hook, Follow Load, Focus Pickup, Focus Target
 */
import * as THREE from 'three';

export class CameraController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        // Camera modes: 'orbit', 'cab', 'followHook', 'followLoad', 'focusPickup', 'focusTarget'
        this.mode = 'followHook';
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        this.smoothing = 0.1; // Lerp factor for damped movement

        // Auto-switch timer
        this.detachTimer = null;

        // Current look-at point for smooth transitions
        this.currentLookAt = new THREE.Vector3();
    }

    /**
     * Set camera mode
     */
    setMode(mode, params = {}) {
        this.mode = mode;
        this.modeParams = params;

        // Cancel auto-switch timer if any
        if (this.detachTimer) {
            clearTimeout(this.detachTimer);
            this.detachTimer = null;
        }
    }

    /**
     * Auto-switch to follow load when attached
     */
    onLoadAttached() {
        this.setMode('followLoad');
    }

    /**
     * Auto-switch to follow hook 1 second after detach
     */
    onLoadDetached() {
        this.detachTimer = setTimeout(() => {
            if (this.mode === 'followLoad') {
                this.setMode('followHook');
            }
        }, 1000);
    }

    /**
     * Update camera based on current mode
     * @returns {boolean} True if camera was overridden, false if using OrbitControls
     */
    update(hookPos, loadPos, attachedLoad, dropZones, currentLoadIndex, loads) {
        switch (this.mode) {
            case 'orbit':
            case 'cab':
                // Handled by OrbitControls or cab view in scene.js
                return false; // Signal: don't override camera

            case 'followHook':
                this.updateFollowHook(hookPos);
                break;

            case 'followLoad':
                if (attachedLoad) {
                    this.updateFollowLoad(loadPos);
                } else {
                    // Fallback to hook if no load attached
                    this.updateFollowHook(hookPos);
                }
                break;

            case 'focusPickup':
                this.updateFocusPickup();
                break;

            case 'focusTarget':
                this.updateFocusTarget(dropZones, loads, currentLoadIndex);
                break;
        }

        // Apply smooth transitions
        this.camera.position.lerp(this.targetPosition, this.smoothing);

        // Smooth look-at transition
        this.currentLookAt.lerp(this.targetLookAt, this.smoothing);
        this.camera.lookAt(this.currentLookAt);

        // Ground collision prevention
        if (this.camera.position.y < 1.5) {
            this.camera.position.y = 1.5;
        }

        return true; // Signal: camera position overridden
    }

    /**
     * Follow Hook mode - camera behind and above hook
     */
    updateFollowHook(hookPos) {
        this.targetPosition.set(
            hookPos.x + 8,
            hookPos.y + 5,
            hookPos.z + 8
        );
        this.targetLookAt.set(hookPos.x, hookPos.y, hookPos.z);
    }

    /**
     * Follow Load mode - camera framing load and hook
     */
    updateFollowLoad(loadPos) {
        this.targetPosition.set(
            loadPos.x + 10,
            loadPos.y + 8,
            loadPos.z + 10
        );
        this.targetLookAt.set(loadPos.x, loadPos.y, loadPos.z);
    }

    /**
     * Focus Pickup mode - frame pickup zone
     */
    updateFocusPickup() {
        // Pickup zone center: (-8, 0, 8) with 8x4 size
        this.targetPosition.set(-8, 12, 16);
        this.targetLookAt.set(-8, 0, 8);
    }

    /**
     * Focus Target mode - frame correct drop zone for current load
     */
    updateFocusTarget(dropZones, loads, currentLoadIndex) {
        const currentLoad = loads[currentLoadIndex];
        if (!currentLoad) return;

        const targetZone = dropZones.find(z => z.name === currentLoad.targetZone);
        if (!targetZone) return;

        // Calculate zone center from bounds
        const center = new THREE.Vector3(
            (targetZone.bounds.min.x + targetZone.bounds.max.x) / 2,
            0,
            (targetZone.bounds.min.z + targetZone.bounds.max.z) / 2
        );

        // Position camera to frame target zone
        this.targetPosition.set(
            center.x + 8,
            10,
            center.z + 8
        );
        this.targetLookAt.copy(center);
    }
}
