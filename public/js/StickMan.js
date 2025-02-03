import { AnimationController } from './animation/AnimationController.js';
import { Tween } from './animation/Tween.js';

/**
 * @class StickMan
 * @description Represents a stick figure fighter with physics-based movement and animations
 */
export class StickMan {
    /**
     * @constructor
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     * @param {boolean} isLeftSide - Whether the fighter starts on the left side
     */
    constructor(x, y, isLeftSide = true) {
        this.engine = window.engine;
        this.isLeftSide = isLeftSide;
        this.parts = {};
        this.joints = [];
        this.moves = [];
        this.isAttacking = false;
        this.isStunned = false;
        
        // Create stick man parts
        this.createBody(x, y);
        this.setupMoves();
        this.animations = new AnimationController();
        this.setupAnimations();
    }

    /**
     * @method createBody
     * @description Creates the physics bodies and joints for the stick figure
     * @param {number} x - X position to create the body
     * @param {number} y - Y position to create the body
     * @private
     */
    createBody(x, y) {
        const options = {
            friction: 0.5,
            restitution: 0.2,
            density: 0.001,
            render: {
                fillStyle: this.isLeftSide ? '#ff4444' : '#44ff44'
            }
        };

        // Create body parts
        this.parts = {
            head: Matter.Bodies.circle(x, y - 50, 15, options),
            torso: Matter.Bodies.rectangle(x, y, 10, 40, options),
            leftArm: Matter.Bodies.rectangle(x - 20, y - 20, 40, 5, options),
            rightArm: Matter.Bodies.rectangle(x + 20, y - 20, 40, 5, options),
            leftLeg: Matter.Bodies.rectangle(x - 10, y + 30, 5, 40, options),
            rightLeg: Matter.Bodies.rectangle(x + 10, y + 30, 5, 40, options)
        };

        // Create joints
        this.joints = [
            // Head to torso
            Matter.Constraint.create({
                bodyA: this.parts.head,
                bodyB: this.parts.torso,
                pointA: { x: 0, y: 15 },
                pointB: { x: 0, y: -20 },
                stiffness: 0.9,
                render: { visible: false }
            }),
            // Arms
            Matter.Constraint.create({
                bodyA: this.parts.torso,
                bodyB: this.parts.leftArm,
                pointA: { x: -5, y: -15 },
                pointB: { x: 20, y: 0 },
                stiffness: 0.6
            }),
            Matter.Constraint.create({
                bodyA: this.parts.torso,
                bodyB: this.parts.rightArm,
                pointA: { x: 5, y: -15 },
                pointB: { x: -20, y: 0 },
                stiffness: 0.6
            }),
            // Legs
            Matter.Constraint.create({
                bodyA: this.parts.torso,
                bodyB: this.parts.leftLeg,
                pointA: { x: -5, y: 20 },
                pointB: { x: 0, y: -20 },
                stiffness: 0.6
            }),
            Matter.Constraint.create({
                bodyA: this.parts.torso,
                bodyB: this.parts.rightLeg,
                pointA: { x: 5, y: 20 },
                pointB: { x: 0, y: -20 },
                stiffness: 0.6
            })
        ];

        // Add all parts to the world
        Matter.World.add(this.engine.world, [...Object.values(this.parts), ...this.joints]);
    }

    setupMoves() {
        this.moves = {
            punch: () => {
                if (this.isAttacking || this.isStunned) return;
                this.isAttacking = true;
                
                this.animations.playAnimation('punch', {
                    onComplete: () => {
                        this.isAttacking = false;
                        // Reset arm position
                        const arm = this.isLeftSide ? this.parts.rightArm : this.parts.leftArm;
                        Matter.Body.setAngle(arm, 0);
                    }
                });
            },
            
            kick: () => {
                if (this.isAttacking || this.isStunned) return;
                this.isAttacking = true;
                
                this.animations.playAnimation('kick', {
                    onComplete: () => {
                        this.isAttacking = false;
                        // Reset leg position
                        const leg = this.isLeftSide ? this.parts.rightLeg : this.parts.leftLeg;
                        Matter.Body.setAngle(leg, 0);
                    }
                });
            },
            
            jump: () => {
                if (this.isStunned) return;
                this.animations.playAnimation('jump');
            }
        };
    }

    setupAnimations() {
        // Punch animation
        this.animations.createAnimation('punch', {
            duration: 500,
            easing: Tween.Easing.easeOutCubic,
            onUpdate: (value) => {
                const arm = this.isLeftSide ? this.parts.rightArm : this.parts.leftArm;
                const angle = this.isLeftSide ? value * Math.PI/2 : -value * Math.PI/2;
                Matter.Body.setAngle(arm, angle);
            }
        });

        // Kick animation
        this.animations.createAnimation('kick', {
            duration: 700,
            easing: Tween.Easing.easeOutElastic,
            onUpdate: (value) => {
                const leg = this.isLeftSide ? this.parts.rightLeg : this.parts.leftLeg;
                const angle = this.isLeftSide ? value * Math.PI/2 : -value * Math.PI/2;
                Matter.Body.setAngle(leg, angle);
            }
        });

        // Jump animation
        this.animations.createAnimation('jump', {
            duration: 1000,
            easing: Tween.Easing.easeOutQuad,
            onUpdate: (value) => {
                const force = -10 * (1 - value);
                Matter.Body.setVelocity(this.parts.torso, { 
                    x: this.parts.torso.velocity.x,
                    y: force
                });
            }
        });

        // Stun animation
        this.animations.createAnimation('stun', {
            duration: 500,
            easing: Tween.Easing.easeInOutQuad,
            onUpdate: (value) => {
                Object.values(this.parts).forEach(part => {
                    const originalColor = this.isLeftSide ? '#ff4444' : '#44ff44';
                    part.render.fillStyle = value < 0.5 ? '#ff0000' : originalColor;
                });
            }
        });
    }

    /**
     * @method stun
     * @description Applies a stun effect to the fighter
     * @param {number} duration - Duration of the stun in milliseconds
     * @public
     */
    stun(duration) {
        if (this.isStunned) return;
        
        this.isStunned = true;
        this.animations.playAnimation('stun', {
            duration: duration,
            onComplete: () => {
                this.isStunned = false;
            }
        });
    }

    reset() {
        this.animations.stopAll();
        this.isAttacking = false;
        this.isStunned = false;
        Object.values(this.parts).forEach(part => {
            Matter.Body.setVelocity(part, { x: 0, y: 0 });
            Matter.Body.setAngle(part, 0);
            Matter.Body.setAngularVelocity(part, 0);
        });
    }

    remove() {
        Matter.World.remove(this.engine.world, [...Object.values(this.parts), ...this.joints]);
    }

    moveLeft() {
        Matter.Body.setVelocity(this.parts.torso, { x: -5, y: this.parts.torso.velocity.y });
    }

    moveRight() {
        Matter.Body.setVelocity(this.parts.torso, { x: 5, y: this.parts.torso.velocity.y });
    }
} 