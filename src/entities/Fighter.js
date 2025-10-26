/**
 * Fighter - Represents a stick figure fighter in the game
 * Handles physics, animation, and combat mechanics
 */

import Matter from 'matter-js';

export class Fighter {
    constructor(x, y, options = {}) {
        this.position = { x, y };
        this.options = {
            isPlayer1: true,
            color: '#e74c3c',
            controls: {
                left: 'KeyA',
                right: 'KeyD',
                jump: 'KeyW',
                attack: 'Space'
            },
            ...options
        };

        this.bodyParts = {};
        this.constraints = [];
        this.moves = [];

        // Fighter stats
        this.health = 100;
        this.maxHealth = 100;
        this.stamina = 100;
        this.maxStamina = 100;

        // Combat state
        this.isAttacking = false;
        this.isBlocking = false;
        this.isJumping = false;
        this.isGrounded = true;
        this.attackCooldown = 0;
        this.lastAttackTime = 0;

        // Animation state
        this.currentAnimation = 'idle';
        this.animationFrame = 0;

        // Create the fighter's physical body
        this.createBody();
        this.setupMoves();
        this.setupAnimation();
    }

    createBody() {
        const { color } = this.options;

        // Create body parts with proper physics properties
        this.bodyParts = {
            head: Matter.Bodies.circle(this.position.x, this.position.y - 50, 12, {
                render: { fillStyle: color },
                friction: 0.8,
                restitution: 0.3,
                density: 0.001
            }),

            torso: Matter.Bodies.rectangle(this.position.x, this.position.y, 12, 35, {
                render: { fillStyle: color },
                friction: 0.8,
                restitution: 0.2,
                density: 0.001
            }),

            leftArm: Matter.Bodies.rectangle(
                this.position.x - 18, this.position.y - 15,
                25, 4,
                {
                    render: { fillStyle: color },
                    friction: 0.6,
                    restitution: 0.4,
                    density: 0.0005
                }
            ),

            rightArm: Matter.Bodies.rectangle(
                this.position.x + 18, this.position.y - 15,
                25, 4,
                {
                    render: { fillStyle: color },
                    friction: 0.6,
                    restitution: 0.4,
                    density: 0.0005
                }
            ),

            leftLeg: Matter.Bodies.rectangle(
                this.position.x - 8, this.position.y + 25,
                4, 30,
                {
                    render: { fillStyle: color },
                    friction: 0.9,
                    restitution: 0.1,
                    density: 0.0008
                }
            ),

            rightLeg: Matter.Bodies.rectangle(
                this.position.x + 8, this.position.y + 25,
                4, 30,
                {
                    render: { fillStyle: color },
                    friction: 0.9,
                    restitution: 0.1,
                    density: 0.0008
                }
            )
        };

        // Create joints between body parts
        this.constraints = [
            // Head to torso
            Matter.Constraint.create({
                bodyA: this.bodyParts.head,
                bodyB: this.bodyParts.torso,
                pointA: { x: 0, y: 12 },
                pointB: { x: 0, y: -17 },
                stiffness: 0.8,
                damping: 0.1,
                render: { visible: false }
            }),

            // Arms to torso
            Matter.Constraint.create({
                bodyA: this.bodyParts.torso,
                bodyB: this.bodyParts.leftArm,
                pointA: { x: -6, y: -12 },
                pointB: { x: 12, y: 0 },
                stiffness: 0.6,
                damping: 0.05,
                render: { visible: false }
            }),

            Matter.Constraint.create({
                bodyA: this.bodyParts.torso,
                bodyB: this.bodyParts.rightArm,
                pointA: { x: 6, y: -12 },
                pointB: { x: -12, y: 0 },
                stiffness: 0.6,
                damping: 0.05,
                render: { visible: false }
            }),

            // Legs to torso
            Matter.Constraint.create({
                bodyA: this.bodyParts.torso,
                bodyB: this.bodyParts.leftLeg,
                pointA: { x: -4, y: 17 },
                pointB: { x: 0, y: -15 },
                stiffness: 0.7,
                damping: 0.05,
                render: { visible: false }
            }),

            Matter.Constraint.create({
                bodyA: this.bodyParts.torso,
                bodyB: this.bodyParts.rightLeg,
                pointA: { x: 4, y: 17 },
                pointB: { x: 0, y: -15 },
                stiffness: 0.7,
                damping: 0.05,
                render: { visible: false }
            })
        ];
    }

    setupMoves() {
        this.moves = {
            punch: {
                execute: () => this.executePunch(),
                staminaCost: 15,
                damage: 10,
                range: 40
            },

            kick: {
                execute: () => this.executeKick(),
                staminaCost: 20,
                damage: 15,
                range: 35
            },

            jump: {
                execute: () => this.executeJump(),
                staminaCost: 10,
                damage: 0,
                range: 0
            },

            block: {
                execute: () => this.executeBlock(),
                staminaCost: 5,
                damage: 0,
                range: 0
            }
        };
    }

    setupAnimation() {
        this.animations = {
            idle: { frames: 1, speed: 0 },
            walk: { frames: 4, speed: 0.2 },
            attack: { frames: 3, speed: 0.15 },
            hurt: { frames: 2, speed: 0.1 },
            jump: { frames: 2, speed: 0.3 }
        };
    }

    update(deltaTime) {
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Regenerate stamina slowly
        if (this.stamina < this.maxStamina) {
            this.stamina += 10 * deltaTime;
            this.stamina = Math.min(this.stamina, this.maxStamina);
        }

        // Update animation
        this.updateAnimation(deltaTime);

        // Check if fighter is grounded
        this.checkGrounded();
    }

    updateAnimation(deltaTime) {
        const animation = this.animations[this.currentAnimation];
        if (animation) {
            this.animationFrame += animation.speed * deltaTime * 60; // 60 FPS base
            if (this.animationFrame >= animation.frames) {
                this.animationFrame = 0;
            }
        }
    }

    checkGrounded() {
        const torso = this.bodyParts.torso;
        const groundY = 580; // Ground level
        const tolerance = 10;

        this.isGrounded = Math.abs(torso.position.y - groundY + 17) < tolerance;
    }

    executePunch() {
        if (this.isAttacking || this.attackCooldown > 0 || this.stamina < this.moves.punch.staminaCost) {
            return false;
        }

        this.isAttacking = true;
        this.stamina -= this.moves.punch.staminaCost;
        this.attackCooldown = 0.5;
        this.currentAnimation = 'attack';

        const arm = this.options.isPlayer1 ? this.bodyParts.rightArm : this.bodyParts.leftArm;
        const direction = this.options.isPlayer1 ? 1 : -1;

        // Apply punch force
        Matter.Body.setAngularVelocity(arm, direction * 0.3);
        Matter.Body.setVelocity(arm, {
            x: direction * 15,
            y: -3
        });

        // Reset attack state after animation
        setTimeout(() => {
            this.isAttacking = false;
            this.currentAnimation = 'idle';
        }, 400);

        return true;
    }

    executeKick() {
        if (this.isAttacking || this.attackCooldown > 0 || this.stamina < this.moves.kick.staminaCost) {
            return false;
        }

        this.isAttacking = true;
        this.stamina -= this.moves.kick.staminaCost;
        this.attackCooldown = 0.7;
        this.currentAnimation = 'attack';

        const leg = this.options.isPlayer1 ? this.bodyParts.rightLeg : this.bodyParts.leftLeg;
        const direction = this.options.isPlayer1 ? 1 : -1;

        // Apply kick force
        Matter.Body.setAngularVelocity(leg, direction * 0.4);
        Matter.Body.setVelocity(leg, {
            x: direction * 20,
            y: 0
        });

        // Reset attack state after animation
        setTimeout(() => {
            this.isAttacking = false;
            this.currentAnimation = 'idle';
        }, 600);

        return true;
    }

    executeJump() {
        if (this.stamina < this.moves.jump.staminaCost || !this.isGrounded) {
            return false;
        }

        this.stamina -= this.moves.jump.staminaCost;
        this.currentAnimation = 'jump';

        // Apply jump force to torso
        Matter.Body.setVelocity(this.bodyParts.torso, {
            x: this.bodyParts.torso.velocity.x,
            y: this.bodyParts.torso.velocity.y - 12
        });

        return true;
    }

    executeBlock() {
        if (this.stamina < this.moves.block.staminaCost) {
            return false;
        }

        this.isBlocking = true;
        this.stamina -= this.moves.block.staminaCost * 0.1; // Continuous drain while blocking
        this.currentAnimation = 'block';

        return true;
    }

    stopBlocking() {
        this.isBlocking = false;
        this.currentAnimation = 'idle';
    }

    takeDamage(damage, attacker = null) {
        if (this.isBlocking) {
            damage *= 0.3; // Reduce damage while blocking
        }

        this.health -= damage;
        this.health = Math.max(0, this.health);

        if (this.health > 0) {
            this.currentAnimation = 'hurt';
            setTimeout(() => {
                if (this.currentAnimation === 'hurt') {
                    this.currentAnimation = 'idle';
                }
            }, 300);
        }

        // Flash effect
        this.flashEffect();

        // Apply knockback if attacker is provided
        if (attacker) {
            this.applyKnockback(attacker, damage);
        }

        return this.health <= 0; // Return true if fighter is defeated
    }

    applyKnockback(attacker, damage) {
        const direction = this.options.isPlayer1 ?
            { x: 1, y: 0 } : { x: -1, y: 0 };

        const knockbackForce = damage * 0.01;
        Matter.Body.applyForce(this.bodyParts.torso, this.bodyParts.torso.position, {
            x: direction.x * knockbackForce,
            y: direction.y * knockbackForce * 0.5
        });
    }

    flashEffect() {
        const originalColor = this.options.color;
        Object.values(this.bodyParts).forEach(part => {
            part.render.fillStyle = '#ffffff';
        });

        setTimeout(() => {
            Object.values(this.bodyParts).forEach(part => {
                part.render.fillStyle = originalColor;
            });
        }, 100);
    }

    reset() {
        // Reset position
        Matter.Body.setPosition(this.bodyParts.torso, this.position);
        Matter.Body.setVelocity(this.bodyParts.torso, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(this.bodyParts.torso, 0);

        // Reset all body parts
        Object.values(this.bodyParts).forEach(part => {
            Matter.Body.setVelocity(part, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(part, 0);
            Matter.Body.setPosition(part, {
                x: part.position.x,
                y: part.position.y
            });
        });

        // Reset stats
        this.health = this.maxHealth;
        this.stamina = this.maxStamina;
        this.isAttacking = false;
        this.isBlocking = false;
        this.attackCooldown = 0;
        this.currentAnimation = 'idle';
    }

    // Movement methods
    move(direction) {
        if (!this.isGrounded) return;

        const force = direction * 0.001;
        Matter.Body.setVelocity(this.bodyParts.torso, {
            x: this.bodyParts.torso.velocity.x + force,
            y: this.bodyParts.torso.velocity.y
        });

        // Limit horizontal velocity
        const maxVelocity = 5;
        if (Math.abs(this.bodyParts.torso.velocity.x) > maxVelocity) {
            Matter.Body.setVelocity(this.bodyParts.torso, {
                x: direction * maxVelocity,
                y: this.bodyParts.torso.velocity.y
            });
        }
    }

    stopMoving() {
        // Gradually slow down instead of stopping immediately
        const currentVelocity = this.bodyParts.torso.velocity;
        Matter.Body.setVelocity(this.bodyParts.torso, {
            x: currentVelocity.x * 0.8,
            y: currentVelocity.y
        });
    }

    // Combat methods
    executeMove(moveType) {
        switch (moveType) {
            case 'punch':
                return this.executePunch();
            case 'kick':
                return this.executeKick();
            case 'jump':
                return this.executeJump();
            case 'block':
                return this.executeBlock();
            default:
                return false;
        }
    }

    // Getters
    getHealthPercent() {
        return (this.health / this.maxHealth) * 100;
    }

    getStaminaPercent() {
        return (this.stamina / this.maxStamina) * 100;
    }

    getCenterPosition() {
        return this.bodyParts.torso.position;
    }

    isAlive() {
        return this.health > 0;
    }
}
