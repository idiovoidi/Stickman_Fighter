/**
 * PhysicsManager - Handles Matter.js physics engine setup and management
 * Provides clean interface for physics operations
 */

import Matter from 'matter-js';

export class PhysicsManager {
    constructor() {
        this.engine = null;
        this.world = null;
        this.config = {
            gravity: { x: 0, y: 1 },
            enableSleeping: false,
            velocityIterations: 6,
            positionIterations: 6
        };
    }

    init() {
        console.log('🔧 Initializing Physics Manager...');

        // Create Matter.js engine
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;

        // Configure physics
        this.engine.gravity = this.config.gravity;
        this.engine.enableSleeping = this.config.enableSleeping;
        this.engine.velocityIterations = this.config.velocityIterations;
        this.engine.positionIterations = this.config.positionIterations;

        console.log('✅ Physics Manager initialized');
        return this.engine;
    }

    update(deltaTime) {
        if (this.engine) {
            // Update physics with fixed timestep
            Matter.Engine.update(this.engine, deltaTime * 1000);
        }
    }

    addBody(body) {
        if (this.world) {
            Matter.World.add(this.world, body);
        }
    }

    addBodies(bodies) {
        if (this.world && Array.isArray(bodies)) {
            Matter.World.add(this.world, bodies);
        }
    }

    removeBody(body) {
        if (this.world) {
            Matter.World.remove(this.world, body);
        }
    }

    removeBodies(bodies) {
        if (this.world && Array.isArray(bodies)) {
            Matter.World.remove(this.world, bodies);
        }
    }

    // Utility methods
    setGravity(gravity) {
        if (this.engine) {
            this.engine.gravity = gravity;
        }
    }

    getGravity() {
        return this.engine ? { ...this.engine.gravity } : null;
    }

    // Collision detection helpers
    getBodiesInBounds(bounds) {
        if (!this.world) return [];

        return Matter.Query.region(this.world.bodies, bounds);
    }

    getBodiesAtPoint(point, radius = 0) {
        if (!this.world) return [];

        const bounds = {
            min: { x: point.x - radius, y: point.y - radius },
            max: { x: point.x + radius, y: point.y + radius }
        };

        return this.getBodiesInBounds(bounds);
    }

    // Debug methods
    enableDebug() {
        if (this.engine) {
            this.engine.render = this.engine.render || {};
            this.engine.render.options = this.engine.render.options || {};
            this.engine.render.options.showDebug = true;
            this.engine.render.options.showVelocity = true;
            this.engine.render.options.showAngleIndicator = true;
        }
    }

    disableDebug() {
        if (this.engine && this.engine.render && this.engine.render.options) {
            this.engine.render.options.showDebug = false;
            this.engine.render.options.showVelocity = false;
            this.engine.render.options.showAngleIndicator = false;
        }
    }

    // Cleanup
    destroy() {
        if (this.engine) {
            Matter.World.clear(this.world, false);
            Matter.Engine.clear(this.engine);
            this.engine = null;
            this.world = null;
        }
    }
}
