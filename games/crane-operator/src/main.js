/**
 * Main application bootstrap and game loop
 */

import * as THREE from 'three';
import { SceneManager } from './scene.js';
import { PhysicsWorld } from './physics.js';
import { TowerCrane } from './crane.js';
import { GameManager } from './game.js';
import { UI } from './ui.js';
import { CameraController } from './CameraController.js';
import { MiniMap } from './MiniMap.js';
import { Settings } from './Settings.js';

class CraneOperatorGame {
    constructor() {
        this.container = document.getElementById('canvas-container');

        // Initialize systems
        this.ui = new UI();
        this.scene = new SceneManager(this.container);
        this.physics = new PhysicsWorld();
        this.crane = new TowerCrane(this.scene.scene);

        // Camera controller
        this.cameraController = new CameraController(this.scene.camera, this.scene);

        // Game manager with camera controller reference
        this.game = new GameManager(this.scene, this.physics, this.ui, this.cameraController);

        // Mini map
        this.miniMap = new MiniMap();

        // Settings
        this.settings = new Settings(this.cameraController);

        // Targeting aid
        this.targetingAid = this.createTargetingAid();
        this.landingCircle = this.createLandingCircle();

        // Control state
        this.controls = {
            slewLeft: false,
            slewRight: false,
            trolleyIn: false,
            trolleyOut: false,
            hoistUp: false,
            hoistDown: false
        };
        this.precisionMode = false;
        this.paused = false;

        // Timing
        this.clock = new THREE.Clock();
        this.lastTime = 0;

        this.setupControls();
        this.setupResize();
        this.game.init();

        // Initialize IK target position
        this.crane.initializeIKTarget();

        // Hide loading and start
        this.ui.hideLoading();
        this.animate();
    }

    setupControls() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft': // Move hook left (world space)
                this.controls.slewLeft = true;
                e.preventDefault();
                break;
            case 'ArrowRight': // Move hook right (world space)
                this.controls.slewRight = true;
                e.preventDefault();
                break;
            case 'ArrowUp': // Move hook forward (world space)
                this.controls.trolleyIn = true;
                e.preventDefault();
                break;
            case 'ArrowDown': // Move hook backward (world space)
                this.controls.trolleyOut = true;
                e.preventDefault();
                break;
            case 'r':
            case 'R':
                this.controls.hoistUp = true;
                break;
            case 'f':
            case 'F':
                this.controls.hoistDown = true;
                break;
            case 'Shift':
                this.precisionMode = true;
                break;
            case ' ':
                e.preventDefault();
                this.handleSpaceKey();
                break;
            case 'c':
            case 'C':
                this.game.resetCurrentLoad();
                break;
            case 'w':
            case 'W':
                this.game.toggleWind();
                break;
            case 'v':
            case 'V':
                this.toggleCameraView();
                break;
            case '1':
                this.setCameraMode('followHook');
                break;
            case '2':
                this.setCameraMode('followLoad');
                break;
            case '3':
                this.setCameraMode('focusPickup');
                break;
            case '4':
                this.setCameraMode('focusTarget');
                break;
            case 'm':
            case 'M':
                this.miniMap.toggle();
                this.ui.showMessage(this.miniMap.visible ? 'Mini map shown' : 'Mini map hidden', 'info', 1500);
                break;
            case 's':
            case 'S':
                this.paused = this.settings.toggle();
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowLeft':
                this.controls.slewLeft = false;
                break;
            case 'ArrowRight':
                this.controls.slewRight = false;
                break;
            case 'ArrowUp':
                this.controls.trolleyIn = false;
                break;
            case 'ArrowDown':
                this.controls.trolleyOut = false;
                break;
            case 'r':
            case 'R':
                this.controls.hoistUp = false;
                break;
            case 'f':
            case 'F':
                this.controls.hoistDown = false;
                break;
            case 'Shift':
                this.precisionMode = false;
                break;
        }
    }

    handleSpaceKey() {
        if (this.game.attachedLoad) {
            this.game.tryDetach();
        } else {
            const hookPos = this.crane.getHookPhysicsPosition();
            this.game.tryAttach(hookPos);
        }
    }

    toggleCameraView() {
        // Prevent if in focus mode
        if (['followHook', 'followLoad', 'focusPickup', 'focusTarget'].includes(this.cameraController.mode)) {
            this.ui.showMessage('Manual camera disabled in focus mode', 'warning', 1500);
            return;
        }

        const cabPos = this.crane.getCabPosition();
        this.scene.toggleView(cabPos);

        const viewName = this.scene.currentView === 'orbit' ? 'Orbit View' : 'Cab View';
        this.ui.showMessage(viewName, 'info', 1500);
    }

    setupResize() {
        window.addEventListener('resize', () => {
            this.scene.handleResize();
            this.miniMap.handleResize();
        });
    }

    setCameraMode(mode) {
        this.cameraController.setMode(mode);
        this.scene.currentView = mode; // Sync with scene

        const modeNames = {
            followHook: 'Follow Hook',
            followLoad: 'Follow Load',
            focusPickup: 'Focus Pickup',
            focusTarget: 'Focus Target'
        };
        this.ui.showMessage(modeNames[mode], 'info', 1500);
    }

    createTargetingAid() {
        const container = document.createElement('div');
        container.id = 'targeting-aid';
        container.innerHTML = `
            <div class="reticle"></div>
            <div class="distance-display" id="distance-display">Distance: --</div>
            <div class="attach-status-display" id="attach-readiness">--</div>
        `;
        document.body.appendChild(container);
        return container;
    }

    createLandingCircle() {
        const geometry = new THREE.RingGeometry(0.8, 1.0, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            opacity: 0.6,
            transparent: true,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(geometry, material);
        circle.rotation.x = -Math.PI / 2;
        this.scene.scene.add(circle);
        return circle;
    }

    updateTargetingAid(hookPos) {
        const currentLoad = this.game.loads[this.game.currentLoadIndex];
        if (!currentLoad || currentLoad.completed) {
            document.getElementById('distance-display').textContent = 'Distance: --';
            document.getElementById('attach-readiness').textContent = '--';
            return;
        }

        const loadPos = currentLoad.body.position;
        const distance = Math.sqrt(
            Math.pow(hookPos.x - loadPos.x, 2) +
            Math.pow(hookPos.y - loadPos.y, 2) +
            Math.pow(hookPos.z - loadPos.z, 2)
        );

        document.getElementById('distance-display').textContent = `To target: ${distance.toFixed(1)} m`;

        // Check attach readiness
        if (this.game.attachedLoad) {
            document.getElementById('attach-readiness').textContent = 'Load attached';
        } else if (distance < 2.0) {
            document.getElementById('attach-readiness').textContent = 'Ready to attach';
        } else {
            document.getElementById('attach-readiness').textContent = 'Lower hook to attach';
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.paused ? 0 : this.clock.getDelta();

        // Update crane
        this.crane.update(this.controls, deltaTime, this.precisionMode);

        // Update physics
        this.physics.step(deltaTime);

        // Update game logic
        const hookPos = this.crane.getHookPhysicsPosition();
        this.game.update(deltaTime, hookPos);

        // Update camera controller
        const cameraOverridden = this.cameraController.update(
            hookPos,
            this.game.attachedLoad ? this.game.attachedLoad.body.position : hookPos,
            this.game.attachedLoad,
            this.game.dropZones,
            this.game.currentLoadIndex,
            this.game.loads
        );

        // Update traditional camera if not overridden
        if (!cameraOverridden) {
            if (this.scene.currentView === 'cab') {
                this.scene.updateCabView(
                    this.crane.getCabPosition(),
                    this.crane.getJibRotation()
                );
            }
            this.scene.update();
        }

        // Update landing circle position
        this.landingCircle.position.set(hookPos.x, 0.05, hookPos.z);

        // Update targeting aid
        this.updateTargetingAid(hookPos);

        // Render mini map
        this.miniMap.render(
            { x: 0, z: 0 }, // Crane base at origin
            hookPos,
            this.game.loads,
            this.game.dropZones,
            this.game.currentLoadIndex
        );

        // Render scene
        this.scene.render();
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CraneOperatorGame();
    });
} else {
    new CraneOperatorGame();
}
