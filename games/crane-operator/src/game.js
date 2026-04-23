/**
 * Game logic, rules, zones, scoring, and load management
 */

import * as THREE from 'three';
import { distance3D, isPointInBounds, isBodySettled } from './utils.js';

export class GameManager {
    constructor(scene, physics, ui, cameraController = null) {
        this.scene = scene;
        this.physics = physics;
        this.ui = ui;
        this.cameraController = cameraController;

        // Game state
        this.loads = [];
        this.dropZones = [];
        this.currentLoadIndex = 0;
        this.attachedLoad = null;
        this.attachConstraint = null;
        this.completedCount = 0;
        this.startTime = Date.now();
        this.windLevel = 0; // 0=Off, 1=Breezy, 2=Strong
        this.safetyVolumeBounds = null;

        this.setupLoads();
        this.setupDropZones();
    }

    setupLoads() {
        const pickupZone = { x: -8, y: 0.5, z: 8 };
        
        // Load configurations
        const loadConfigs = [
            {
                name: 'Pallet',
                size: { x: 1.2, y: 0.3, z: 1.2 },
                color: 0x8b4513,
                mass: 80,
                targetZone: 'A'
            },
            {
                name: 'Steel Beam',
                size: { x: 4, y: 0.3, z: 0.3 },
                color: 0x708090,
                mass: 150,
                targetZone: 'B'
            },
            {
                name: 'HVAC Unit',
                size: { x: 1.5, y: 1.2, z: 1.5 },
                color: 0x4682b4,
                mass: 200,
                targetZone: 'C'
            }
        ];

        loadConfigs.forEach((config, index) => {
            const position = {
                x: pickupZone.x + index * 2,
                y: pickupZone.y + config.size.y / 2,
                z: pickupZone.z
            };

            // Create visual mesh
            const geometry = new THREE.BoxGeometry(config.size.x, config.size.y, config.size.z);
            const material = new THREE.MeshStandardMaterial({
                color: config.color,
                roughness: 0.7,
                metalness: 0.3
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(position.x, position.y, position.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Scale mesh 2.5x for better visibility (physics body unchanged)
            mesh.scale.set(2.5, 2.5, 2.5);

            this.scene.scene.add(mesh);

            // Create physics body (original size)
            const body = this.physics.createLoadBody(config.name, position, config.size, config.mass);

            // Add label
            const label = this.createLabel(config.name);
            label.position.y = config.size.y / 2 + 0.5;

            // Compensate label scaling (inverse of mesh scale)
            label.scale.set(1/2.5, 1/2.5, 1);

            mesh.add(label);

            this.loads.push({
                name: config.name,
                mesh: mesh,
                body: body,
                targetZone: config.targetZone,
                completed: false,
                initialPosition: { ...position }
            });
        });

        // Create pickup zone marker
        this.createZoneMarker(pickupZone.x + 2, pickupZone.z, 8, 4, 0x00ff00, 'Pickup');
    }

    setupDropZones() {
        const zones = [
            { name: 'A', label: 'Slab', position: { x: 8, z: -8 }, size: { x: 4.5, z: 4.5 }, color: 0xffeb3b },
            { name: 'B', label: 'Steel Laydown', position: { x: -10, z: -10 }, size: { x: 6, z: 4.5 }, color: 0x2196f3 },
            { name: 'C', label: 'Rooftop Plant', position: { x: 0, z: -15 }, size: { x: 4.5, z: 4.5 }, color: 0xf44336 }
        ];

        zones.forEach(zone => {
            this.createZoneMarker(zone.position.x, zone.position.z, zone.size.x, zone.size.z, zone.color, `Zone ${zone.name}: ${zone.label}`);
            
            this.dropZones.push({
                name: zone.name,
                label: zone.label,
                bounds: {
                    min: { 
                        x: zone.position.x - zone.size.x / 2, 
                        y: 0, 
                        z: zone.position.z - zone.size.z / 2 
                    },
                    max: { 
                        x: zone.position.x + zone.size.x / 2, 
                        y: 5, 
                        z: zone.position.z + zone.size.z / 2 
                    }
                }
            });
        });
    }

    createZoneMarker(x, z, width, depth, color, labelText) {
        // Thick outline
        const outlineGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, 0.1, depth));
        const outlineMat = new THREE.LineBasicMaterial({ color: color, linewidth: 5 });
        const outline = new THREE.LineSegments(outlineGeom, outlineMat);
        outline.position.set(x, 0.05, z);
        this.scene.scene.add(outline);

        // Semi-transparent fill
        const fillGeom = new THREE.PlaneGeometry(width, depth);
        const fillMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const fill = new THREE.Mesh(fillGeom, fillMat);
        fill.rotation.x = -Math.PI / 2;
        fill.position.set(x, 0.06, z);
        this.scene.scene.add(fill);

        // Beacon poles at corners
        const beaconGeom = new THREE.CylinderGeometry(0.15, 0.15, 5, 8);
        const beaconMat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.6
        });

        const corners = [
            [x - width/2, z - depth/2],
            [x + width/2, z - depth/2],
            [x - width/2, z + depth/2],
            [x + width/2, z + depth/2]
        ];

        corners.forEach(([cx, cz]) => {
            const beacon = new THREE.Mesh(beaconGeom, beaconMat.clone());
            beacon.position.set(cx, 2.5, cz);
            beacon.castShadow = true;
            this.scene.scene.add(beacon);
        });

        // Elevated label
        const label = this.createLabel(labelText);
        label.position.set(x, 5.5, z);
        this.scene.scene.add(label);
    }

    createLabel(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#ffffff';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);
        return sprite;
    }

    /**
     * Try to attach current load to hook
     */
    tryAttach(hookPosition) {
        if (this.attachedLoad) {
            this.ui.showMessage('Already attached to a load!', 'warning');
            return;
        }

        const currentLoad = this.loads[this.currentLoadIndex];
        if (currentLoad.completed) {
            this.ui.showMessage('This load is already placed!', 'warning');
            return;
        }

        const loadPos = currentLoad.body.position;
        const dist = distance3D(hookPosition, loadPos);

        if (dist < 2.0) {
            // Attach
            this.attachedLoad = currentLoad;
            this.attachConstraint = this.physics.attachLoad(currentLoad.body, hookPosition);
            this.ui.updateAttachStatus(true);
            this.ui.showMessage(`Attached ${currentLoad.name}`, 'success');

            // Trigger camera event
            if (this.cameraController) {
                this.cameraController.onLoadAttached();
            }
        } else {
            this.ui.showMessage('Hook too far from load', 'warning');
        }
    }

    /**
     * Detach current load
     */
    tryDetach() {
        if (!this.attachedLoad) {
            this.ui.showMessage('No load attached!', 'warning');
            return;
        }

        const load = this.attachedLoad;
        const settled = isBodySettled(load.body, 1.0);

        // Detach
        this.physics.detachLoad(this.attachConstraint);
        this.attachedLoad = null;
        this.attachConstraint = null;
        this.ui.updateAttachStatus(false);

        // Trigger camera event
        if (this.cameraController) {
            this.cameraController.onLoadDetached();
        }

        // Check if placed in correct zone
        if (settled) {
            setTimeout(() => this.checkZonePlacement(load), 500);
        } else {
            this.ui.showMessage('Detached (load still moving)', 'info');
        }
    }

    /**
     * Check if load is in correct drop zone
     */
    checkZonePlacement(load) {
        const loadPos = load.body.position;
        const settled = isBodySettled(load.body, 0.3);

        if (!settled) {
            this.ui.showMessage('Load not settled yet', 'warning');
            return;
        }

        // Find which zone the load is in
        let inZone = null;
        for (const zone of this.dropZones) {
            if (isPointInBounds(loadPos, zone.bounds)) {
                inZone = zone;
                break;
            }
        }

        if (!inZone) {
            this.ui.showMessage('Not in any drop zone', 'warning');
            return;
        }

        // Check if correct zone
        if (inZone.name === load.targetZone) {
            load.completed = true;
            this.completedCount++;
            this.ui.updateCompleted(this.completedCount);
            this.ui.showZoneFeedback(true, `Zone ${inZone.name}: ${inZone.label}`);

            // Change load color to indicate completion
            load.mesh.material.color.setHex(0x4caf50);
            load.mesh.material.emissive.setHex(0x2e7d32);
            load.mesh.material.emissiveIntensity = 0.3;

            // Move to next load
            this.selectNextLoad();

            // Check win condition
            if (this.completedCount >= 3) {
                const elapsed = (Date.now() - this.startTime) / 1000;
                this.ui.showCompletion(elapsed);
            }
        } else {
            const correctZone = this.dropZones.find(z => z.name === load.targetZone);
            this.ui.showZoneFeedback(false, `Zone ${correctZone.name}: ${correctZone.label}`);
        }
    }

    /**
     * Select next available load
     */
    selectNextLoad() {
        for (let i = 0; i < this.loads.length; i++) {
            if (!this.loads[i].completed) {
                this.currentLoadIndex = i;
                this.ui.updateCurrentLoad(this.loads[i].name);
                return;
            }
        }
        this.ui.updateCurrentLoad('All Complete!');
    }

    /**
     * Reset current load to pickup zone
     */
    resetCurrentLoad() {
        if (this.attachedLoad) {
            this.tryDetach();
        }

        const load = this.loads[this.currentLoadIndex];
        if (!load.completed) {
            this.physics.resetLoadPosition(load.body, load.initialPosition);
            this.ui.showMessage(`Reset ${load.name} to pickup zone`, 'info');
        }
    }

    /**
     * Toggle wind level
     */
    toggleWind() {
        this.windLevel = (this.windLevel + 1) % 3;
        this.ui.updateWindState(this.windLevel);
        
        const windNames = ['Off', 'Breezy', 'Strong'];
        this.ui.showMessage(`Wind: ${windNames[this.windLevel]}`, 'info');
    }

    /**
     * Check safety volume collision
     */
    checkSafetyCollision(hookPosition) {
        if (!this.safetyVolumeBounds) return false;
        
        if (this.attachedLoad) {
            const loadPos = this.attachedLoad.body.position;
            if (isPointInBounds(loadPos, this.safetyVolumeBounds)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Update game state
     */
    update(deltaTime, hookPosition) {
        // Update timer
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.ui.updateTimer(elapsed);

        // Sync physics bodies to visual meshes
        this.loads.forEach(load => {
            load.mesh.position.copy(load.body.position);
            load.mesh.quaternion.copy(load.body.quaternion);
        });

        // Update constraint position if attached
        if (this.attachedLoad && this.attachConstraint) {
            this.physics.updateConstraintPosition(this.attachConstraint, hookPosition);

            // Apply wind to attached load
            if (this.windLevel > 0) {
                this.physics.applyWind(this.attachedLoad.body, this.windLevel);
            }
        }

        // Check safety collision
        if (this.checkSafetyCollision(hookPosition)) {
            this.ui.showSafetyWarning('Danger: Power line area!');
        }
    }

    /**
     * Initialize current load selection
     */
    init() {
        this.ui.updateCurrentLoad(this.loads[0].name);
        this.safetyVolumeBounds = this.scene.getSafetyVolumeBounds();
    }
}
