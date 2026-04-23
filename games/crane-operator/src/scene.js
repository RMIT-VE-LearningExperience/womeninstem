/**
 * Three.js scene setup, camera, lighting, and construction site environment
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLights();
        this.setupEnvironment();
        this.setupControls();

        // Camera views
        this.currentView = 'orbit'; // 'orbit' or 'cab'
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            500
        );
        this.camera.position.set(30, 20, 30);
        this.camera.lookAt(0, 5, 0);

        // Store cab view position (will be updated based on crane position)
        this.cabViewOffset = new THREE.Vector3(0, 15, 2);
    }

    setupLights() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 80, 30);
        sun.castShadow = true;
        sun.shadow.camera.left = -50;
        sun.shadow.camera.right = 50;
        sun.shadow.camera.top = 50;
        sun.shadow.camera.bottom = -50;
        sun.shadow.camera.near = 0.1;
        sun.shadow.camera.far = 200;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.bias = -0.0001;
        this.scene.add(sun);

        // Hemisphere light for better ambient
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.4);
        this.scene.add(hemiLight);
    }

    setupEnvironment() {
        // Ground plane
        const groundGeom = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            roughness: 0.8,
            metalness: 0.2
        });
        this.ground = new THREE.Mesh(groundGeom, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Concrete slab area
        const slabGeom = new THREE.BoxGeometry(20, 0.3, 20);
        const slabMat = new THREE.MeshStandardMaterial({
            color: 0x9e9e9e,
            roughness: 0.7
        });
        const slab = new THREE.Mesh(slabGeom, slabMat);
        slab.position.set(0, 0.15, 0);
        slab.receiveShadow = true;
        slab.castShadow = true;
        this.scene.add(slab);

        // Scaffold frame (simple structure)
        this.createScaffold(-15, 0, -15);
        this.createScaffold(15, 0, -15);

        // Fence perimeter
        this.createFence();

        // Power line area (safety hazard)
        this.createPowerLineArea();
    }

    createScaffold(x, y, z) {
        const group = new THREE.Group();
        const poleMat = new THREE.MeshStandardMaterial({
            color: 0xffa500,
            roughness: 0.6,
            metalness: 0.4
        });

        // Vertical poles
        const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 8, 8);
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const pole = new THREE.Mesh(poleGeom, poleMat);
                pole.position.set(i * 3 - 1.5, 4, j * 3 - 1.5);
                pole.castShadow = true;
                group.add(pole);
            }
        }

        // Horizontal beams
        const beamGeom = new THREE.BoxGeometry(3.5, 0.1, 0.1);
        for (let h = 2; h < 8; h += 2) {
            for (let i = 0; i < 2; i++) {
                const beam = new THREE.Mesh(beamGeom, poleMat);
                beam.position.set(0, h, i * 3 - 1.5);
                beam.castShadow = true;
                group.add(beam);
            }
        }

        group.position.set(x, y, z);
        this.scene.add(group);
    }

    createFence() {
        const fenceMat = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            roughness: 0.7
        });

        const posts = [
            [-40, 0, -40], [40, 0, -40],
            [40, 0, 40], [-40, 0, 40]
        ];

        posts.forEach(pos => {
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
                fenceMat
            );
            post.position.set(pos[0], 1, pos[2]);
            post.castShadow = true;
            this.scene.add(post);
        });
    }

    createPowerLineArea() {
        // Safety volume (invisible collision zone)
        const safetyGeom = new THREE.BoxGeometry(4, 8, 4);
        const safetyMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        this.safetyVolume = new THREE.Mesh(safetyGeom, safetyMat);
        this.safetyVolume.position.set(12, 6, -10);
        this.safetyVolume.visible = false; // Hidden by default, enable for debugging
        this.scene.add(this.safetyVolume);

        // Visual power line indicator (poles + wire)
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
        const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 12, 8), poleMat);
        pole1.position.set(10, 6, -10);
        pole1.castShadow = true;
        this.scene.add(pole1);

        const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 12, 8), poleMat);
        pole2.position.set(14, 6, -10);
        pole2.castShadow = true;
        this.scene.add(pole2);

        // Wire
        const wireGeom = new THREE.CylinderGeometry(0.05, 0.05, 4, 8);
        wireGeom.rotateZ(Math.PI / 2);
        const wire = new THREE.Mesh(wireGeom, new THREE.MeshStandardMaterial({ color: 0x000000 }));
        wire.position.set(12, 10, -10);
        this.scene.add(wire);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 80;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.target.set(0, 5, 0);
    }

    /**
     * Toggle between orbit and cab view
     */
    toggleView(cranePosition) {
        if (this.currentView === 'orbit') {
            // Switch to cab view
            this.currentView = 'cab';
            this.controls.enabled = false;
            // Position camera at crane cab height
            this.camera.position.copy(cranePosition).add(this.cabViewOffset);
            this.camera.lookAt(cranePosition.x, 0, cranePosition.z);
        } else {
            // Switch back to orbit
            this.currentView = 'orbit';
            this.controls.enabled = true;
            this.camera.position.set(30, 20, 30);
            this.controls.target.set(0, 5, 0);
        }
    }

    /**
     * Update cab view position if in cab mode
     */
    updateCabView(cranePosition, jibRotation) {
        if (this.currentView === 'cab') {
            // Update camera to follow crane rotation
            const offset = new THREE.Vector3(0, 15, 2);
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), jibRotation);
            this.camera.position.copy(cranePosition).add(offset);

            // Look in the direction of the jib
            const lookTarget = cranePosition.clone();
            const forward = new THREE.Vector3(0, 0, -10);
            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), jibRotation);
            lookTarget.add(forward);
            this.camera.lookAt(lookTarget);
        }
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        if (this.controls.enabled) {
            this.controls.update();
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Get safety volume bounds for collision detection
     */
    getSafetyVolumeBounds() {
        const pos = this.safetyVolume.position;
        const scale = 2; // Half-extents
        return {
            min: { x: pos.x - scale, y: pos.y - 4, z: pos.z - scale },
            max: { x: pos.x + scale, y: pos.y + 4, z: pos.z + scale }
        };
    }
}
