import { LayeredRenderer } from './rendering/LayeredRenderer.js';

export class Renderer {
    constructor(engine) {
        this.engine = engine;
        this.layeredRenderer = new LayeredRenderer(800, 600);
        this.gameWorld = null;
        this.isRunning = false;
        this.animationFrameId = null;
        this.setupRenderFunctions();
    }

    /**
     * @method start
     * @description Starts the rendering loop
     * @public
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.renderLoop();
    }

    /**
     * @method stop
     * @description Stops the rendering loop
     * @public
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * @method renderLoop
     * @description Main rendering loop
     * @private
     */
    renderLoop() {
        if (!this.isRunning) return;

        this.render();
        this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
    }

    /**
     * @method render
     * @description Renders all layers
     * @public
     */
    render() {
        if (!this.isRunning) return;
        this.layeredRenderer.render(this.renderFunctions);
    }

    setGameWorld(gameWorld) {
        this.gameWorld = gameWorld;
        this.renderStatic();
    }

    setupRenderFunctions() {
        this.renderFunctions = new Map([
            ['background', (ctx) => this.renderBackground(ctx)],
            ['ground', (ctx) => this.renderGround(ctx)],
            ['effects', (ctx) => this.renderEffects(ctx)],
            ['fighters', (ctx) => this.renderFighters(ctx)],
            ['ui', (ctx) => this.renderUI(ctx)],
            ['debug', (ctx) => this.renderDebug(ctx)]
        ]);
    }

    renderStatic() {
        // Render static layers once
        this.renderBackground(this.layeredRenderer.getContext('background'));
        this.renderGround(this.layeredRenderer.getContext('ground'));
    }

    renderBackground(ctx) {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, '#2c3e50');   // Dark blue at top
        gradient.addColorStop(1, '#3498db');   // Lighter blue at bottom
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Add decorative elements
        this.drawClouds(ctx);
        this.drawMountains(ctx);
    }

    drawClouds(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        // Define cloud positions
        const cloudPositions = [
            { x: 100, y: 100, scale: 1 },
            { x: 300, y: 150, scale: 0.8 },
            { x: 600, y: 120, scale: 1.2 }
        ];

        cloudPositions.forEach(cloud => {
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            ctx.scale(cloud.scale, cloud.scale);
            
            // Draw cloud shape
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.arc(20, -10, 15, 0, Math.PI * 2);
            ctx.arc(-20, -10, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    drawMountains(ctx) {
        ctx.fillStyle = '#34495e';  // Dark mountain color
        
        // Draw multiple mountains
        ctx.beginPath();
        ctx.moveTo(0, 500);
        ctx.lineTo(200, 200);
        ctx.lineTo(400, 450);
        ctx.lineTo(600, 250);
        ctx.lineTo(800, 500);
        ctx.fill();

        // Add snow caps
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.moveTo(180, 220);
        ctx.lineTo(200, 200);
        ctx.lineTo(220, 220);
        ctx.lineTo(200, 230);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(580, 270);
        ctx.lineTo(600, 250);
        ctx.lineTo(620, 270);
        ctx.lineTo(600, 280);
        ctx.fill();
    }

    renderGround(ctx) {
        if (!this.gameWorld) return;
        
        // Get the ground body from the game world
        const ground = this.gameWorld.bodies.get('ground');
        if (!ground) return;

        // Draw ground with styling
        ctx.fillStyle = ground.render.fillStyle;
        ctx.strokeStyle = ground.render.strokeStyle;
        ctx.lineWidth = ground.render.lineWidth;
        
        ctx.beginPath();
        const vertices = ground.vertices;
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Add ground details/texture
        this.drawGroundDetails(ctx, ground);
    }

    drawGroundDetails(ctx, ground) {
        // Add a grass-like texture on top of the ground
        const grassHeight = 5;
        const segmentWidth = 3;
        
        ctx.strokeStyle = '#3d3d3d';
        ctx.lineWidth = 1;
        
        for (let x = ground.bounds.min.x; x < ground.bounds.max.x; x += segmentWidth) {
            const randomHeight = grassHeight * (0.8 + Math.random() * 0.4);
            ctx.beginPath();
            ctx.moveTo(x, ground.bounds.min.y);
            ctx.lineTo(x, ground.bounds.min.y - randomHeight);
            ctx.stroke();
        }
    }

    renderEffects(ctx) {
        // Render particles and effects
        this.engine.particleSystem?.render(ctx);
        this.engine.effectSystem?.render(ctx);
    }

    renderFighters(ctx) {
        const bodies = Matter.Composite.allBodies(this.engine.world);
        
        bodies.forEach(body => {
            if (!body.isStatic && body.render) {
                ctx.fillStyle = body.render.fillStyle;
                ctx.strokeStyle = body.render.strokeStyle || '#000';
                ctx.lineWidth = body.render.lineWidth || 1;
                
                ctx.beginPath();
                const vertices = body.vertices;
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (let i = 1; i < vertices.length; i++) {
                    ctx.lineTo(vertices[i].x, vertices[i].y);
                }
                ctx.closePath();
                ctx.fill();
                if (body.render.lineWidth > 0) {
                    ctx.stroke();
                }
            }
        });
    }

    renderUI(ctx) {
        // Render health bars, scores, etc.
        ctx.font = '20px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        
        // Add UI elements here
    }

    renderDebug(ctx) {
        // Debug rendering is handled by PhysicsDebugger
        this.engine.physicsDebugger?.render(ctx);
    }

    resize(width, height) {
        this.layeredRenderer.width = width;
        this.layeredRenderer.height = height;
        this.layeredRenderer.layers.forEach(layer => {
            layer.canvas.width = width;
            layer.canvas.height = height;
        });
        this.renderStatic();
    }
} 