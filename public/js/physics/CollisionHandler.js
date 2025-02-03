/**
 * @class CollisionHandler
 * @description Handles physics collisions and damage calculations between fighters
 */
export class CollisionHandler {
    /**
     * @constructor
     * @param {GameEngine} gameEngine - Reference to the main game engine
     */
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.collisionPairs = new Map();
        this.setupCollisionEvents();
    }

    setupCollisionEvents() {
        Matter.Events.on(this.gameEngine.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => this.handleCollision(pair));
        });
    }

    handleCollision(pair) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Get the fighters involved in the collision
        const [attackerPart, defenderPart] = this.identifyCollisionParts(bodyA, bodyB);
        if (!attackerPart || !defenderPart) return;

        const damage = this.calculateDamage(attackerPart, defenderPart, pair.collision.depth);
        this.applyCollisionEffects(attackerPart, defenderPart, damage);
    }

    identifyCollisionParts(bodyA, bodyB) {
        const fighterA = this.getFighterFromBody(bodyA);
        const fighterB = this.getFighterFromBody(bodyB);

        if (!fighterA || !fighterB) return [null, null];

        // Determine which fighter is attacking
        if (fighterA.isAttacking && !fighterB.isAttacking) {
            return [bodyA, bodyB];
        } else if (fighterB.isAttacking && !fighterA.isAttacking) {
            return [bodyB, bodyA];
        }

        return [null, null];
    }

    getFighterFromBody(body) {
        // Search through fighters to find which one owns this body part
        for (const fighter of this.gameEngine.fighters) {
            if (Object.values(fighter.parts).includes(body)) {
                return fighter;
            }
        }
        return null;
    }

    /**
     * @method calculateDamage
     * @description Calculates damage based on collision parameters and body parts
     * @param {Matter.Body} attackerPart - The attacking body part
     * @param {Matter.Body} defenderPart - The defending body part
     * @param {number} collisionDepth - Depth of the collision
     * @returns {number} Calculated damage amount
     * @private
     */
    calculateDamage(attackerPart, defenderPart, collisionDepth) {
        const baseMultipliers = {
            head: { damage: 2.0, receive: 1.5 },
            torso: { damage: 1.0, receive: 1.0 },
            leftArm: { damage: 1.2, receive: 0.8 },
            rightArm: { damage: 1.2, receive: 0.8 },
            leftLeg: { damage: 1.5, receive: 0.8 },
            rightLeg: { damage: 1.5, receive: 0.8 }
        };

        // Get the part names
        const attackPartName = this.getBodyPartName(attackerPart);
        const defendPartName = this.getBodyPartName(defenderPart);

        // Calculate velocity magnitude of the attacking part
        const velocity = Matter.Vector.magnitude(attackerPart.velocity);
        
        // Base damage calculation
        let damage = velocity * collisionDepth * 0.01;

        // Apply multipliers based on body parts involved
        damage *= baseMultipliers[attackPartName]?.damage || 1.0;
        damage *= baseMultipliers[defendPartName]?.receive || 1.0;

        return Math.min(Math.max(damage, 0), 50); // Cap damage between 0 and 50
    }

    getBodyPartName(body) {
        const fighter = this.getFighterFromBody(body);
        if (!fighter) return null;

        return Object.entries(fighter.parts)
            .find(([_, part]) => part === body)?.[0] || null;
    }

    applyCollisionEffects(attackerPart, defenderPart, damage) {
        const defender = this.getFighterFromBody(defenderPart);
        const attacker = this.getFighterFromBody(attackerPart);
        
        if (!defender || !attacker) return;

        // Apply knockback
        this.applyKnockback(defenderPart, attackerPart, damage);

        // Apply stun effect
        if (damage > 10) {
            defender.stun(damage * 50); // Stun duration based on damage
        }

        // Trigger hit effects
        this.triggerHitEffects(attackerPart, defenderPart, damage);

        // Update game state
        this.gameEngine.gameState.updateScore(
            attacker.isLeftSide ? 'player1' : 'player2',
            Math.floor(damage)
        );
    }

    applyKnockback(defenderPart, attackerPart, damage) {
        const knockbackForce = damage * 0.05;
        const knockbackDirection = Matter.Vector.normalise(
            Matter.Vector.sub(defenderPart.position, attackerPart.position)
        );

        Matter.Body.applyForce(defenderPart, defenderPart.position, {
            x: knockbackDirection.x * knockbackForce,
            y: knockbackDirection.y * knockbackForce
        });
    }

    triggerHitEffects(attackerPart, defenderPart, damage) {
        // Create hit effect at collision point
        const collisionPoint = Matter.Vector.add(
            defenderPart.position,
            Matter.Vector.mult(
                Matter.Vector.normalise(
                    Matter.Vector.sub(attackerPart.position, defenderPart.position)
                ),
                -defenderPart.circleRadius || -10
            )
        );

        // Dispatch hit effect event
        this.gameEngine.events.dispatchEvent(new CustomEvent('hitEffect', {
            detail: {
                position: collisionPoint,
                damage: damage,
                type: this.getBodyPartName(defenderPart)
            }
        }));
    }
} 