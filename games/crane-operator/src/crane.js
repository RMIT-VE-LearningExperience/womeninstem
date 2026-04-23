/**
 * Tower crane model and controls
 */

import * as THREE from 'three';
import { clamp } from './utils.js';

export class TowerCrane {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        
        // Crane state
        this.jibRotation = 0; // Radians
        this.trolleyPosition = 0; // 0 to 1 (0=center, 1=end of jib)
        this.hoistHeight = 0; // Meters above ground
        this.maxHoistHeight = 20;
        this.jibLength = 15;
        this.mastHeight = 18;

        // IK target position (world space X, Z)
        this.targetHookX = 0;
        this.targetHookZ = 0;
        
        // Movement speeds
        this.slewSpeed = 0.5;    // Radians per second
        this.trolleySpeed = 2.0; // Units per second
        this.hoistSpeed = 3.0;   // Meters per second
        this.precisionMultiplier = 0.3;
        
        // Build crane
        this.buildCrane();
        this.scene.add(this.group);
    }

    buildCrane() {
        // Base
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xff9800, roughness: 0.6, metalness: 0.4 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 1, 8), baseMat);
        base.position.y = 0.5;
        base.castShadow = true;
        base.receiveShadow = true;
        this.group.add(base);

        // Mast (tower)
        const mastMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.6, metalness: 0.5 });
        this.mast = new THREE.Group();
        
        // Main mast structure
        const mastGeom = new THREE.BoxGeometry(1.5, this.mastHeight, 1.5);
        const mastMesh = new THREE.Mesh(mastGeom, mastMat);
        mastMesh.position.y = this.mastHeight / 2;
        mastMesh.castShadow = true;
        this.mast.add(mastMesh);
        
        // Cross braces for realism
        for (let i = 0; i < 4; i++) {
            const brace = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 3, 0.1),
                mastMat
            );
            brace.position.y = i * 4 + 2;
            brace.position.x = (i % 2) * 1.2 - 0.6;
            brace.rotation.z = Math.PI / 4;
            this.mast.add(brace);
        }
        
        this.group.add(this.mast);

        // Rotating jib assembly
        this.jibAssembly = new THREE.Group();
        this.jibAssembly.position.y = this.mastHeight;
        
        // Cab
        const cabGeom = new THREE.BoxGeometry(2, 2, 2);
        const cabMat = new THREE.MeshStandardMaterial({ color: 0x1976d2, roughness: 0.4 });
        const cab = new THREE.Mesh(cabGeom, cabMat);
        cab.position.y = 1;
        cab.castShadow = true;
        this.jibAssembly.add(cab);

        // Windows
        const windowMat = new THREE.MeshStandardMaterial({ 
            color: 0x90caf9, 
            roughness: 0.1, 
            metalness: 0.9,
            transparent: true,
            opacity: 0.6
        });
        const window1 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), windowMat);
        window1.position.set(0, 1, 1.01);
        this.jibAssembly.add(window1);

        // Main jib (boom)
        const jibMat = new THREE.MeshStandardMaterial({ color: 0xf44336, roughness: 0.7, metalness: 0.3 });
        const jibGeom = new THREE.BoxGeometry(this.jibLength, 0.4, 0.4);
        this.jib = new THREE.Mesh(jibGeom, jibMat);
        this.jib.position.set(this.jibLength / 2, 2, 0);
        this.jib.castShadow = true;
        this.jibAssembly.add(this.jib);

        // Jib support cables
        for (let i = 0; i < 3; i++) {
            const cable = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 5, 6),
                new THREE.MeshStandardMaterial({ color: 0x424242 })
            );
            cable.position.set(i * 5 + 2, 4.5, 0);
            cable.rotation.z = -Math.PI / 6;
            this.jibAssembly.add(cable);
        }

        // Counter-jib (balance weight side)
        const counterJibGeom = new THREE.BoxGeometry(6, 0.4, 0.4);
        const counterJib = new THREE.Mesh(counterJibGeom, jibMat);
        counterJib.position.set(-3, 2, 0);
        counterJib.castShadow = true;
        this.jibAssembly.add(counterJib);

        // Counter-weight
        const weightGeom = new THREE.BoxGeometry(1.5, 1, 1.5);
        const weightMat = new THREE.MeshStandardMaterial({ color: 0x616161, roughness: 0.8 });
        const weight = new THREE.Mesh(weightGeom, weightMat);
        weight.position.set(-5.5, 1.5, 0);
        weight.castShadow = true;
        this.jibAssembly.add(weight);

        // Trolley (moves along jib)
        this.trolley = new THREE.Group();
        const trolleyGeom = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const trolleyMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.5 });
        const trolleyMesh = new THREE.Mesh(trolleyGeom, trolleyMat);
        trolleyMesh.castShadow = true;
        this.trolley.add(trolleyMesh);
        this.trolley.position.y = 1.8;
        this.jibAssembly.add(this.trolley);

        // Hook cable (visual only)
        this.hookCable = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 1, 8),
            new THREE.MeshStandardMaterial({ color: 0x212121 })
        );
        this.trolley.add(this.hookCable);

        // Hook
        const hookGeom = new THREE.SphereGeometry(0.2, 8, 8);
        const hookMat = new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.3, metalness: 0.7 });
        this.hook = new THREE.Mesh(hookGeom, hookMat);
        this.hook.castShadow = true;
        this.trolley.add(this.hook);

        this.mast.add(this.jibAssembly);
    }

    /**
     * Update crane controls with inverse kinematics
     */
    update(controls, deltaTime, precisionMode) {
        if (deltaTime === 0) return;

        const speedMult = precisionMode ? this.precisionMultiplier : 1.0;
        const moveSpeed = (precisionMode ? 1.5 : 4.5) * speedMult; // m/s in world space
        const hoistSpeed = (precisionMode ? 1.0 : 2.0) * speedMult;

        // Update target hook position based on controls (world space)
        if (controls.slewLeft) {
            this.targetHookX -= moveSpeed * deltaTime;
        }
        if (controls.slewRight) {
            this.targetHookX += moveSpeed * deltaTime;
        }
        if (controls.trolleyIn) {
            this.targetHookZ -= moveSpeed * deltaTime;
        }
        if (controls.trolleyOut) {
            this.targetHookZ += moveSpeed * deltaTime;
        }

        // Calculate IK solution
        const ik = this.calculateIK(this.targetHookX, this.targetHookZ);

        // Smooth transition to target with damping
        const smoothing = 0.15; // Lerp factor
        this.jibRotation += this.angleDelta(ik.jibRotation, this.jibRotation) * smoothing;
        this.trolleyPosition += (ik.trolleyPosition - this.trolleyPosition) * smoothing;

        // Clamp trolley position
        this.trolleyPosition = clamp(this.trolleyPosition, 0, 1);

        // Hoist up/down (unchanged)
        if (controls.hoistUp) {
            this.hoistHeight += hoistSpeed * deltaTime;
        }
        if (controls.hoistDown) {
            this.hoistHeight -= hoistSpeed * deltaTime;
        }
        this.hoistHeight = clamp(this.hoistHeight, 0, this.maxHoistHeight);

        // Apply transformations
        this.jibAssembly.rotation.y = this.jibRotation;

        // Move trolley along jib
        const trolleyX = this.trolleyPosition * this.jibLength;
        this.trolley.position.x = trolleyX;

        // Update hook cable and hook position
        const cableLength = this.mastHeight - this.hoistHeight + 2;
        this.hookCable.scale.y = cableLength;
        this.hookCable.position.y = -cableLength / 2 - 0.3;
        this.hook.position.y = -cableLength - 0.5;
    }

    /**
     * Calculate jib rotation and trolley position from desired hook position
     * @param {number} targetX - Desired hook X position (world space)
     * @param {number} targetZ - Desired hook Z position (world space)
     * @returns {object} { jibRotation, trolleyPosition, clamped }
     */
    calculateIK(targetX, targetZ) {
        const distance = Math.sqrt(targetX * targetX + targetZ * targetZ);
        const maxReach = this.jibLength;

        let finalX = targetX;
        let finalZ = targetZ;
        let clamped = false;

        // Clamp to maximum reach
        if (distance > maxReach) {
            const scale = maxReach / distance;
            finalX = targetX * scale;
            finalZ = targetZ * scale;
            clamped = true;
        }

        // Handle near-zero case (hook at crane center)
        if (Math.abs(finalX) < 0.01 && Math.abs(finalZ) < 0.01) {
            return {
                jibRotation: this.jibRotation, // Keep current rotation
                trolleyPosition: 0,
                clamped: false
            };
        }

        const finalDistance = Math.sqrt(finalX * finalX + finalZ * finalZ);
        const jibRotation = Math.atan2(finalZ, finalX);
        const trolleyPosition = Math.min(finalDistance / this.jibLength, 1.0);

        return { jibRotation, trolleyPosition, clamped };
    }

    /**
     * Calculate shortest angular distance between two angles
     * Handles wraparound (-π to π)
     */
    angleDelta(target, current) {
        let delta = target - current;

        // Normalize to [-π, π]
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;

        return delta;
    }

    /**
     * Initialize target position from current hook position
     * Call this once at startup
     */
    initializeIKTarget() {
        const hookPos = this.getHookPosition();
        this.targetHookX = hookPos.x;
        this.targetHookZ = hookPos.z;
    }

    /**
     * Get world position of the hook
     */
    getHookPosition() {
        const hookWorldPos = new THREE.Vector3();
        this.hook.getWorldPosition(hookWorldPos);
        return hookWorldPos;
    }

    /**
     * Get hook position for physics attachment
     */
    getHookPhysicsPosition() {
        const pos = this.getHookPosition();
        return { x: pos.x, y: pos.y, z: pos.z };
    }

    /**
     * Get crane cab position for camera
     */
    getCabPosition() {
        const cabWorldPos = new THREE.Vector3();
        this.jibAssembly.children[0].getWorldPosition(cabWorldPos);
        return cabWorldPos;
    }

    /**
     * Get current jib rotation for camera
     */
    getJibRotation() {
        return this.jibRotation;
    }
}
