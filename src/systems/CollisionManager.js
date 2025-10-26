/**
 * CollisionManager - Handles collision detection and response
 * Manages hit detection, damage calculation, and collision effects
 */

import Matter from 'matter-js';

export class CollisionManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.physicsEngine = null;
        this.collisionPairs = new Map();
        this.hitBoxes = new Map();

        // Collision configuration
        this.config = {
            hitDetection: {
                enabled: true,
                damageMultiplier: 1.0,
                knockbackForce: 5
            },
            effects: {
                hitFlash: true,
                screenShake: true,
                particleEffects: true
            }
        };
    }

    init() {
        console.log('💥 Initializing Collision Manager...');

        this.physicsEngine = this.gameEngine.getPhysicsEngine();
        this.setupCollisionDetection();
        this.createHitBoxes();

        console.log('✅ Collision Manager initialized');
    }

    setupCollisionDetection() {
        if (!this.physicsEngine) return;

        // Set up Matter.js collision events
        Matter.Events.on(this.physicsEngine, 'collisionStart', (event) => {
            this.onCollisionStart(event);
        });

        Matter.Events.on(this.physicsEngine, 'collisionActive', (event) => {
            this.onCollisionActive(event);
        });

        Matter.Events.on(this.physicsEngine, 'collisionEnd', (event) => {
            this.onCollisionEnd(event);
        });
    }

    createHitBoxes() {
        // Create hit boxes for each fighter's attack areas
        this.gameEngine.getFighters().forEach((fighter, index) => {
            const hitBox = this.createFighterHitBox(fighter);
            this.hitBoxes.set(fighter, hitBox);
            this.physicsEngine.world.add(this.physicsEngine.world, hitBox);
        });
    }

    createFighterHitBox(fighter) {
        // Create invisible hit detection areas around fighter's limbs
        const hitBoxBodies = [];

        // Right arm hit box (for punches)
        const rightArmHitBox = Matter.Bodies.rectangle(
            fighter.bodyParts.rightArm.position.x + 15,
            fighter.bodyParts.rightArm.position.y,
            20, 8,
            {
                isSensor: true, // Doesn't participate in physics collisions
                render: { visible: false },
                isStatic: false
            }
        );

        // Left arm hit box
        const leftArmHitBox = Matter.Bodies.rectangle(
            fighter.bodyParts.leftArm.position.x - 15,
            fighter.bodyParts.leftArm.position.y,
            20, 8,
            {
                isSensor: true,
                render: { visible: false },
                isStatic: false
            }
        );

        // Right leg hit box (for kicks)
        const rightLegHitBox = Matter.Bodies.rectangle(
            fighter.bodyParts.rightLeg.position.x + 10,
            fighter.bodyParts.rightLeg.position.y,
            15, 12,
            {
                isSensor: true,
                render: { visible: false },
                isStatic: false
            }
        );

        // Left leg hit box
        const leftLegHitBox = Matter.Bodies.rectangle(
            fighter.bodyParts.leftLeg.position.x - 10,
            fighter.bodyParts.leftLeg.position.y,
            15, 12,
            {
                isSensor: true,
                render: { visible: false },
                isStatic: false
            }
        );

        hitBoxBodies.push(rightArmHitBox, leftArmHitBox, rightLegHitBox, leftLegHitBox);

        // Create constraints to keep hit boxes attached to limbs
        const constraints = [
            Matter.Constraint.create({
                bodyA: fighter.bodyParts.rightArm,
                bodyB: rightArmHitBox,
                pointA: { x: 15, y: 0 },
                pointB: { x: -10, y: 0 },
                stiffness: 1,
                render: { visible: false }
            }),
            Matter.Constraint.create({
                bodyA: fighter.bodyParts.leftArm,
                bodyB: leftArmHitBox,
                pointA: { x: -15, y: 0 },
                pointB: { x: 10, y: 0 },
                stiffness: 1,
                render: { visible: false }
            }),
            Matter.Constraint.create({
                bodyA: fighter.bodyParts.rightLeg,
                bodyB: rightLegHitBox,
                pointA: { x: 10, y: 0 },
                bodyB: { x: -7, y: 0 },
                stiffness: 1,
                render: { visible: false }
            }),
            Matter.Constraint.create({
                bodyA: fighter.bodyParts.leftLeg,
                bodyB: leftLegHitBox,
                pointA: { x: -10, y: 0 },
                bodyB: { x: 7, y: 0 },
                stiffness: 1,
                render: { visible: false }
            })
        ];

        return {
            bodies: hitBoxBodies,
            constraints: constraints
        };
    }

    onCollisionStart(event) {
        const pairs = event.pairs;

        pairs.forEach(pair => {
            this.handleCollision(pair);
        });
    }

    onCollisionActive(event) {
        const pairs = event.pairs;

        pairs.forEach(pair => {
            this.handleOngoingCollision(pair);
        });
    }

    onCollisionEnd(event) {
        const pairs = event.pairs;

        pairs.forEach(pair => {
            this.endCollision(pair);
        });
    }

    handleCollision(pair) {
        const { bodyA, bodyB } = pair;

        // Check if this is a hit box collision
        if (this.isHitBoxCollision(bodyA, bodyB)) {
            this.processHit(pair);
        }

        // Check for ground collision (landing impact)
        if (this.isGroundCollision(bodyA, bodyB)) {
            this.processGroundCollision(pair);
        }
    }

    handleOngoingCollision(pair) {
        // Handle continuous collisions (like being pushed)
        this.handlePushCollision(pair);
    }

    endCollision(pair) {
        // Clean up collision state
        const pairId = this.getPairId(pair);
        this.collisionPairs.delete(pairId);
    }

    isHitBoxCollision(bodyA, bodyB) {
        return (bodyA.isSensor && !bodyB.isSensor) || (bodyB.isSensor && !bodyA.isSensor);
    }

    isGroundCollision(bodyA, bodyB) {
        return (bodyA.isStatic && bodyB.label !== 'ground') ||
               (bodyB.isStatic && bodyA.label !== 'ground');
    }

    processHit(pair) {
        const { bodyA, bodyB } = pair;
        const attacker = this.getFighterFromBody(bodyA.isSensor ? bodyA : bodyB);
        const defender = this.getFighterFromBody(bodyA.isSensor ? bodyB : bodyA);

        if (!attacker || !defender || attacker === defender) return;

        // Calculate damage based on attack type and velocity
        const damage = this.calculateDamage(pair, attacker);
        const knockback = this.calculateKnockback(pair, attacker);

        // Apply damage and effects
        const isDefeated = defender.takeDamage(damage);

        // Apply knockback
        if (knockback > 0) {
            this.applyKnockback(defender, attacker, knockback);
        }

        // Trigger hit effects
        this.triggerHitEffects(attacker, defender, damage);

        // Check for round end
        if (isDefeated) {
            this.handleFighterDefeat(defender);
        }
    }

    processGroundCollision(pair) {
        // Handle landing impact - could cause damage or trigger effects
        const fighterBody = pair.bodyA.isStatic ? pair.bodyB : pair.bodyA;
        const fighter = this.getFighterFromBody(fighterBody);

        if (fighter) {
            // Reset jump state
            fighter.isJumping = false;

            // Small damage if landing too hard
            const velocity = fighterBody.velocity;
            const impactForce = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

            if (impactForce > 15) {
                fighter.takeDamage(impactForce * 0.1);
            }
        }
    }

    handlePushCollision(pair) {
        // Handle fighters pushing against each other
        const fighterA = this.getFighterFromBody(pair.bodyA);
        const fighterB = this.getFighterFromBody(pair.bodyB);

        if (fighterA && fighterB) {
            // Apply pushing force based on mass and velocity
            this.applyPushForce(fighterA, fighterB, pair);
        }
    }

    calculateDamage(pair, attacker) {
        const { bodyA, bodyB } = pair;
        const impactBody = bodyA.isSensor ? bodyB : bodyA;
        const velocity = impactBody.velocity;

        // Base damage calculation
        let baseDamage = 5;

        // Increase damage based on impact velocity
        const impactForce = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        baseDamage += impactForce * 0.5;

        // Bonus damage for different attack types
        if (impactBody === attacker.bodyParts.rightArm || impactBody === attacker.bodyParts.leftArm) {
            baseDamage *= 1.2; // Punch bonus
        } else if (impactBody === attacker.bodyParts.rightLeg || impactBody === attacker.bodyParts.leftLeg) {
            baseDamage *= 1.5; // Kick bonus
        }

        return Math.floor(baseDamage * this.config.hitDetection.damageMultiplier);
    }

    calculateKnockback(pair, attacker) {
        const { bodyA, bodyB } = pair;
        const impactBody = bodyA.isSensor ? bodyB : bodyA;
        const velocity = impactBody.velocity;

        return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) * 0.3;
    }

    applyKnockback(defender, attacker, force) {
        const direction = defender.options.isPlayer1 ?
            { x: 1, y: 0 } : { x: -1, y: 0 };

        Matter.Body.applyForce(defender.bodyParts.torso, defender.bodyParts.torso.position, {
            x: direction.x * force,
            y: direction.y * force * 0.5
        });
    }

    applyPushForce(fighterA, fighterB, pair) {
        const force = 0.1;
        const direction = fighterA.bodyParts.torso.position.x < fighterB.bodyParts.torso.position.x ? 1 : -1;

        Matter.Body.applyForce(fighterA.bodyParts.torso, fighterA.bodyParts.torso.position, {
            x: -direction * force,
            y: 0
        });

        Matter.Body.applyForce(fighterB.bodyParts.torso, fighterB.bodyParts.torso.position, {
            x: direction * force,
            y: 0
        });
    }

    triggerHitEffects(attacker, defender, damage) {
        // Visual effects
        if (this.config.effects.hitFlash) {
            defender.flashEffect();
        }

        // Screen shake
        if (this.config.effects.screenShake) {
            this.triggerScreenShake(damage * 0.01);
        }

        // Particle effects
        if (this.config.effects.particleEffects) {
            this.triggerParticleEffect(defender.getCenterPosition(), damage);
        }

        // Sound effects (placeholder)
        this.playHitSound(damage);
    }

    triggerScreenShake(intensity) {
        // Simple screen shake effect
        document.body.style.animation = `shake ${intensity}s ease-in-out`;
        setTimeout(() => {
            document.body.style.animation = '';
        }, intensity * 1000);
    }

    triggerParticleEffect(position, damage) {
        // Create particle effect at hit location
        // This would integrate with a particle system
        console.log(`💥 Hit effect at (${position.x}, ${position.y}) - Damage: ${damage}`);
    }

    playHitSound(damage) {
        // Placeholder for sound effects
        // In a real implementation, this would play appropriate sound effects
        console.log(`🔊 Hit sound - Damage: ${damage}`);
    }

    getFighterFromBody(body) {
        return this.gameEngine.getFighters().find(fighter => {
            return Object.values(fighter.bodyParts).includes(body);
        });
    }

    getPairId(pair) {
        return `${pair.bodyA.id}-${pair.bodyB.id}`;
    }

    handleFighterDefeat(fighter) {
        console.log(`💀 Fighter defeated: ${fighter.options.isPlayer1 ? 'Player 1' : 'Player 2'}`);

        // Update game state
        const player = fighter.options.isPlayer1 ? 'player1' : 'player2';
        this.gameEngine.getGameState().updateFighterState(player, 0, 0, false);

        // Trigger defeat effects
        this.triggerDefeatEffects(fighter);
    }

    triggerDefeatEffects(fighter) {
        // Visual effects for defeated fighter
        Object.values(fighter.bodyParts).forEach(part => {
            part.render.fillStyle = '#666666'; // Gray out defeated fighter
        });
    }

    update() {
        // Update hit box positions
        this.updateHitBoxes();

        // Process any queued collision effects
        this.processCollisionQueue();
    }

    updateHitBoxes() {
        // Update hit box positions based on fighter limb positions
        this.gameEngine.getFighters().forEach(fighter => {
            const hitBox = this.hitBoxes.get(fighter);
            if (hitBox) {
                this.updateHitBoxPositions(fighter, hitBox);
            }
        });
    }

    updateHitBoxPositions(fighter, hitBox) {
        // Update hit box positions to follow fighter limbs
        // This is handled by Matter.js constraints, but we could add additional logic here
    }

    processCollisionQueue() {
        // Process any delayed collision effects
    }

    // Configuration methods
    setDamageMultiplier(multiplier) {
        this.config.hitDetection.damageMultiplier = multiplier;
    }

    setKnockbackForce(force) {
        this.config.hitDetection.knockbackForce = force;
    }

    enableEffects() {
        this.config.effects.hitFlash = true;
        this.config.effects.screenShake = true;
        this.config.effects.particleEffects = true;
    }

    disableEffects() {
        this.config.effects.hitFlash = false;
        this.config.effects.screenShake = false;
        this.config.effects.particleEffects = false;
    }
}
