class StickMan {
    constructor(x, y, isLeftSide = true) {
        this.engine = window.engine;
        this.isLeftSide = isLeftSide;
        this.parts = {};
        this.joints = [];
        this.moves = [];
        this.isAttacking = false;
        
        // Create stick man parts
        this.createBody(x, y);
        this.setupMoves();
    }

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
                if (this.isAttacking) return;
                this.isAttacking = true;
                
                const arm = this.isLeftSide ? this.parts.rightArm : this.parts.leftArm;
                const force = this.isLeftSide ? 0.05 : -0.05;
                
                Matter.Body.setAngularVelocity(arm, force);
                Matter.Body.setVelocity(arm, { x: this.isLeftSide ? 10 : -10, y: -2 });
                
                setTimeout(() => {
                    this.isAttacking = false;
                }, 500);
            },
            
            kick: () => {
                if (this.isAttacking) return;
                this.isAttacking = true;
                
                const leg = this.isLeftSide ? this.parts.rightLeg : this.parts.leftLeg;
                const force = this.isLeftSide ? 0.1 : -0.1;
                
                Matter.Body.setAngularVelocity(leg, force);
                Matter.Body.setVelocity(leg, { x: this.isLeftSide ? 15 : -15, y: 0 });
                
                setTimeout(() => {
                    this.isAttacking = false;
                }, 700);
            },
            
            jump: () => {
                Matter.Body.setVelocity(this.parts.torso, { x: 0, y: -10 });
            }
        };
    }

    reset() {
        Object.values(this.parts).forEach(part => {
            Matter.Body.setVelocity(part, { x: 0, y: 0 });
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