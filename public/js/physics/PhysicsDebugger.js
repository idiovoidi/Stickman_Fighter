export class PhysicsDebugger {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.isEnabled = false;
        this.debugCanvas = this.createDebugCanvas();
        this.ctx = this.debugCanvas.getContext('2d');
        this.debugOptions = {
            showBodies: true,
            showJoints: true,
            showVelocities: true,
            showCollisions: true,
            showBoundingBoxes: true,
            showAngles: true
        };
    }

    createDebugCanvas() {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        document.body.appendChild(canvas);
        return canvas;
    }

    enable() {
        this.isEnabled = true;
        this.debugCanvas.style.display = 'block';
    }

    disable() {
        this.isEnabled = false;
        this.debugCanvas.style.display = 'none';
    }

    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    update() {
        if (!this.isEnabled) return;

        this.resizeCanvas();
        this.ctx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);

        if (this.debugOptions.showBodies) this.drawBodies();
        if (this.debugOptions.showJoints) this.drawJoints();
        if (this.debugOptions.showVelocities) this.drawVelocities();
        if (this.debugOptions.showBoundingBoxes) this.drawBoundingBoxes();
        if (this.debugOptions.showAngles) this.drawAngles();
    }

    resizeCanvas() {
        const render = this.gameEngine.renderer.render;
        this.debugCanvas.width = render.options.width;
        this.debugCanvas.height = render.options.height;
    }

    drawBodies() {
        const bodies = Matter.Composite.allBodies(this.gameEngine.engine.world);
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;

        for (const body of bodies) {
            if (body.parts.length > 1) {
                // Compound body
                for (let i = 1; i < body.parts.length; i++) {
                    this.drawBodyVertices(body.parts[i].vertices);
                }
            } else {
                // Simple body
                this.drawBodyVertices(body.vertices);
            }
        }
        
        this.ctx.stroke();
    }

    drawBodyVertices(vertices) {
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j++) {
            this.ctx.lineTo(vertices[j].x, vertices[j].y);
        }
        this.ctx.lineTo(vertices[0].x, vertices[0].y);
    }

    drawJoints() {
        const constraints = Matter.Composite.allConstraints(this.gameEngine.engine.world);
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 1;

        for (const constraint of constraints) {
            if (!constraint.pointA || !constraint.pointB) continue;

            const bodyA = constraint.bodyA;
            const bodyB = constraint.bodyB;
            
            const pointA = {
                x: bodyA.position.x + constraint.pointA.x,
                y: bodyA.position.y + constraint.pointA.y
            };
            
            const pointB = {
                x: bodyB.position.x + constraint.pointB.x,
                y: bodyB.position.y + constraint.pointB.y
            };

            this.ctx.moveTo(pointA.x, pointA.y);
            this.ctx.lineTo(pointB.x, pointB.y);
        }
        
        this.ctx.stroke();
    }

    drawVelocities() {
        const bodies = Matter.Composite.allBodies(this.gameEngine.engine.world);
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#0000ff';
        this.ctx.lineWidth = 1;

        for (const body of bodies) {
            const velocity = body.velocity;
            const pos = body.position;
            const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            
            if (magnitude > 0.1) {
                this.ctx.moveTo(pos.x, pos.y);
                this.ctx.lineTo(
                    pos.x + velocity.x * 5,
                    pos.y + velocity.y * 5
                );
            }
        }
        
        this.ctx.stroke();
    }

    drawBoundingBoxes() {
        const bodies = Matter.Composite.allBodies(this.gameEngine.engine.world);
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 1;

        for (const body of bodies) {
            const bounds = body.bounds;
            this.ctx.rect(
                bounds.min.x,
                bounds.min.y,
                bounds.max.x - bounds.min.x,
                bounds.max.y - bounds.min.y
            );
        }
        
        this.ctx.stroke();
    }

    drawAngles() {
        const bodies = Matter.Composite.allBodies(this.gameEngine.engine.world);
        
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.lineWidth = 1;

        for (const body of bodies) {
            const pos = body.position;
            const radius = 20;
            
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.ctx.lineTo(
                pos.x + Math.cos(body.angle) * radius,
                pos.y + Math.sin(body.angle) * radius
            );
            this.ctx.stroke();
        }
    }
} 