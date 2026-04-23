/**
 * Cannon-es physics world and bodies
 */

import * as CANNON from 'cannon-es';

export class PhysicsWorld {
    constructor() {
        this.setupWorld();
        this.bodies = new Map();
        this.constraints = [];
        this.setupGround();
    }

    setupWorld() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        this.world.defaultContactMaterial.contactEquationStiffness = 1e8;
        this.world.defaultContactMaterial.contactEquationRelaxation = 3;
        
        // Add damping to settle loads
        this.world.defaultContactMaterial.friction = 0.4;
        this.world.defaultContactMaterial.restitution = 0.1;
    }

    setupGround() {
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane(),
            material: new CANNON.Material({ friction: 0.5, restitution: 0.1 })
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
        this.bodies.set('ground', groundBody);
    }

    /**
     * Create a physics body for a load
     */
    createLoadBody(name, position, size, mass = 100) {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            linearDamping: 0.3,
            angularDamping: 0.3
        });
        this.world.addBody(body);
        this.bodies.set(name, body);
        return body;
    }

    /**
     * Attach load to hook with point-to-point constraint
     */
    attachLoad(loadBody, hookPosition) {
        const constraint = new CANNON.PointToPointConstraint(
            loadBody,
            new CANNON.Vec3(0, loadBody.shapes[0].halfExtents.y, 0),
            new CANNON.Body({ mass: 0 }),
            new CANNON.Vec3(hookPosition.x, hookPosition.y, hookPosition.z)
        );
        this.world.addConstraint(constraint);
        this.constraints.push(constraint);
        return constraint;
    }

    /**
     * Detach load from hook
     */
    detachLoad(constraint) {
        if (constraint) {
            this.world.removeConstraint(constraint);
            const index = this.constraints.indexOf(constraint);
            if (index > -1) {
                this.constraints.splice(index, 1);
            }
        }
    }

    /**
     * Apply wind force to a body
     */
    applyWind(body, windLevel) {
        if (windLevel === 0) return;

        const windStrength = windLevel === 1 ? 20 : 50;
        const windDir = new CANNON.Vec3(
            Math.sin(Date.now() * 0.001) * windStrength,
            0,
            Math.cos(Date.now() * 0.0015) * windStrength
        );
        body.applyForce(windDir, body.position);
    }

    /**
     * Update constraint to follow hook position
     */
    updateConstraintPosition(constraint, hookPosition) {
        if (constraint && constraint.pivotB) {
            constraint.pivotB.set(hookPosition.x, hookPosition.y, hookPosition.z);
        }
    }

    /**
     * Reset load to position
     */
    resetLoadPosition(body, position) {
        body.position.set(position.x, position.y, position.z);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.quaternion.set(0, 0, 0, 1);
    }

    /**
     * Step physics simulation
     */
    step(deltaTime) {
        const fixedTimeStep = 1.0 / 60.0;
        this.world.step(fixedTimeStep, deltaTime, 3);
    }

    /**
     * Get body by name
     */
    getBody(name) {
        return this.bodies.get(name);
    }
}
