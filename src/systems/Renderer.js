/**
 * Renderer - Handles all visual rendering and graphics
 * Manages canvas, animations, UI overlays, and visual effects
 */

import Matter from 'matter-js';

export class Renderer {
    constructor(physicsEngine, worldBounds) {
        this.physicsEngine = physicsEngine;
        this.worldBounds = worldBounds;

        this.canvas = null;
        this.context = null;
        this.devicePixelRatio = window.devicePixelRatio || 1;

        this.config = {
            backgroundColor: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            showDebug: false,
            enableSmoothing: true,
            targetFPS: 60
        };

        this.layers = new Map();
        this.effects = new Map();
        this.animations = new Map();

        this.isInitialized = false;
        this.isRunning = false;
    }

    async init() {
        console.log('🎨 Initializing Renderer...');

        this.setupCanvas();
        this.setupContext();
        // Update canvas size again after context is ready
        this.updateCanvasSize();
        this.setupLayers();
        this.setupEffects();
        this.setupEventListeners();

        this.isInitialized = true;
        console.log('✅ Renderer initialized');
    }

    setupCanvas() {
        // Create main canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'game-canvas';
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${this.config.backgroundColor};
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
        `;

        // Insert canvas into game container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.canvas);
        }

        this.updateCanvasSize();
    }

    setupContext() {
        this.context = this.canvas.getContext('2d');
        this.context.imageSmoothingEnabled = this.config.enableSmoothing;

        // Context scaling is now handled in updateCanvasSize()
    }

    setupLayers() {
        // Define rendering layers (back to front)
        this.layers.set('background', { zIndex: 0, objects: [] });
        this.layers.set('ground', { zIndex: 1, objects: [] });
        this.layers.set('fighters', { zIndex: 2, objects: [] });
        this.layers.set('effects', { zIndex: 3, objects: [] });
        this.layers.set('ui', { zIndex: 4, objects: [] });
        this.layers.set('debug', { zIndex: 5, objects: [] });
    }

    setupEffects() {
        // Initialize visual effects
        this.setupScreenEffects();
        this.setupParticleEffects();
    }

    setupScreenEffects() {
        // Create screen shake effect
        const shakeStyle = document.createElement('style');
        shakeStyle.textContent = `
            @keyframes shake {
                0% { transform: translate(0); }
                25% { transform: translate(-2px, 2px); }
                50% { transform: translate(2px, -2px); }
                75% { transform: translate(-2px, -2px); }
                100% { transform: translate(0); }
            }
        `;
        document.head.appendChild(shakeStyle);
    }

    setupParticleEffects() {
        // Initialize particle system (placeholder)
        this.particles = [];
    }

    setupEventListeners() {
        window.addEventListener('resize', this.handleResize.bind(this));

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    updateCanvasSize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.devicePixelRatio;
        this.canvas.height = rect.height * this.devicePixelRatio;

        // Update context scale only if context exists
        if (this.context) {
            this.context.scale(this.devicePixelRatio, this.devicePixelRatio);
        }
    }

    handleResize() {
        this.updateCanvasSize();
    }

    render() {
        if (!this.isInitialized || !this.context) return;

        // Clear canvas
        this.clearCanvas();

        // Render layers in order
        this.renderLayers();

        // Render effects
        this.renderEffects();

        // Render UI
        this.renderUI();

        // Render debug info
        if (this.config.showDebug) {
            this.renderDebug();
        }
    }

    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderLayers() {
        // Sort layers by z-index
        const sortedLayers = Array.from(this.layers.entries())
            .sort(([,a], [,b]) => a.zIndex - b.zIndex);

        sortedLayers.forEach(([layerName, layer]) => {
            this.renderLayer(layerName, layer);
        });
    }

    renderLayer(layerName, layer) {
        switch (layerName) {
            case 'background':
                this.renderBackground();
                break;
            case 'ground':
                this.renderGround();
                break;
            case 'fighters':
                this.renderFighters();
                break;
            case 'effects':
                this.renderEffects();
                break;
            case 'ui':
                this.renderUI();
                break;
            case 'debug':
                if (this.config.showDebug) {
                    this.renderDebug();
                }
                break;
        }
    }

    renderBackground() {
        // Render animated background
        const time = Date.now() * 0.001;
        const gradient = this.context.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);

        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.3, '#16213e');
        gradient.addColorStop(0.7, '#0f3460');
        gradient.addColorStop(1, '#533483');

        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Add some animated stars or particles
        this.renderBackgroundParticles(time);
    }

    renderBackgroundParticles(time) {
        this.context.fillStyle = 'rgba(255, 255, 255, 0.1)';

        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (Math.sin(time + i) * 50 + this.canvas.height / 2) % this.canvas.height;
            const size = Math.abs(Math.sin(time * 2 + i) * 2 + 1); // Ensure positive radius

            this.context.beginPath();
            this.context.arc(x, y, size, 0, Math.PI * 2);
            this.context.fill();
        }
    }

    renderGround() {
        // Render ground platform
        const groundHeight = 40;
        const groundY = this.canvas.height - groundHeight;

        // Ground shadow
        this.context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.context.fillRect(0, groundY, this.canvas.width, groundHeight);

        // Ground surface
        this.context.fillStyle = '#2c3e50';
        this.context.fillRect(0, groundY + 5, this.canvas.width, groundHeight - 5);

        // Ground texture lines
        this.context.strokeStyle = '#34495e';
        this.context.lineWidth = 2;
        this.context.beginPath();

        for (let x = 0; x < this.canvas.width; x += 20) {
            this.context.moveTo(x, groundY + 10);
            this.context.lineTo(x + 10, groundY + 15);
        }

        this.context.stroke();
    }

    renderFighters() {
        if (!this.physicsEngine) return;

        // Render all fighters
        this.physicsEngine.world.bodies.forEach(body => {
            if (this.isFighterBody(body)) {
                this.renderFighterBody(body);
            }
        });

        // Render fighter constraints (joints) if debug is enabled
        if (this.config.showDebug) {
            this.physicsEngine.world.constraints.forEach(constraint => {
                this.renderConstraint(constraint);
            });
        }
    }

    renderFighterBody(body) {
        const { position, angle, render } = body;

        this.context.save();
        this.context.translate(position.x, position.y);
        this.context.rotate(angle);

        // Body shadow
        this.context.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.context.fillRect(-body.bounds.max.x + position.x + 2, -body.bounds.max.y + position.y + 2,
                           body.bounds.max.x * 2, body.bounds.max.y * 2);

        // Body
        this.context.fillStyle = render.fillStyle || '#e74c3c';
        this.context.fillRect(-body.bounds.max.x + position.x, -body.bounds.max.y + position.y,
                           body.bounds.max.x * 2, body.bounds.max.y * 2);

        // Body outline
        this.context.strokeStyle = '#2c3e50';
        this.context.lineWidth = 2;
        this.context.strokeRect(-body.bounds.max.x + position.x, -body.bounds.max.y + position.y,
                             body.bounds.max.x * 2, body.bounds.max.y * 2);

        this.context.restore();
    }

    renderConstraint(constraint) {
        if (!constraint.pointA || !constraint.pointB) return;

        const startX = constraint.bodyA.position.x + constraint.pointA.x;
        const startY = constraint.bodyA.position.y + constraint.pointA.y;
        const endX = constraint.bodyB.position.x + constraint.pointB.x;
        const endY = constraint.bodyB.position.y + constraint.pointB.y;

        this.context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.context.lineWidth = 1;
        this.context.setLineDash([5, 5]);
        this.context.beginPath();
        this.context.moveTo(startX, startY);
        this.context.lineTo(endX, endY);
        this.context.stroke();
        this.context.setLineDash([]);
    }

    renderEffects() {
        // Render particle effects
        this.renderParticles();

        // Render screen effects
        this.renderScreenEffects();
    }

    renderParticles() {
        this.particles.forEach((particle, index) => {
            particle.update();
            particle.render(this.context);

            // Remove dead particles
            if (particle.isDead) {
                this.particles.splice(index, 1);
            }
        });
    }

    renderScreenEffects() {
        // Render any active screen effects (flash, fade, etc.)
        if (this.screenFlash) {
            this.context.fillStyle = `rgba(255, 255, 255, ${this.screenFlash})`;
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.screenFlash -= 0.05;

            if (this.screenFlash <= 0) {
                this.screenFlash = null;
            }
        }
    }

    renderUI() {
        this.renderHealthBars();
        this.renderControls();
        this.renderGameTitle();
    }

    renderHealthBars() {
        const fighters = this.physicsEngine.world.bodies.filter(body => this.isFighterBody(body));
        if (fighters.length < 2) return;

        // This would integrate with the actual fighter health data
        // For now, just render placeholder health bars
        this.renderHealthBar(50, 50, 200, 20, 100, 100, 'Player 1', '#e74c3c');
        this.renderHealthBar(this.canvas.width - 250, 50, 200, 20, 100, 100, 'Player 2', '#27ae60');
    }

    renderHealthBar(x, y, width, height, current, max, label, color) {
        const percent = current / max;

        // Background
        this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.context.fillRect(x, y, width, height);

        // Health bar
        this.context.fillStyle = percent > 0.5 ? '#27ae60' : percent > 0.25 ? '#f39c12' : '#e74c3c';
        this.context.fillRect(x, y, width * percent, height);

        // Border
        this.context.strokeStyle = color;
        this.context.lineWidth = 2;
        this.context.strokeRect(x, y, width, height);

        // Label
        this.context.fillStyle = 'white';
        this.context.font = '14px Arial';
        this.context.textAlign = 'center';
        this.context.fillText(label, x + width / 2, y - 5);
        this.context.fillText(`${Math.round(percent * 100)}%`, x + width / 2, y + height + 20);
    }

    renderControls() {
        // Render control instructions (initially visible)
        this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.context.fillRect(20, this.canvas.height - 120, 400, 100);

        this.context.fillStyle = 'white';
        this.context.font = '14px Arial';
        this.context.fillText('Controls:', 30, this.canvas.height - 100);
        this.context.fillText('Player 1: A/D (Move) W (Jump) Space (Attack)', 30, this.canvas.height - 80);
        this.context.fillText('Player 2: Arrows (Move) ↑ (Jump) Enter (Attack)', 30, this.canvas.height - 60);
        this.context.fillText('R (Reset) P (Pause) D (Debug)', 30, this.canvas.height - 40);
    }

    renderGameTitle() {
        // Render animated title
        const time = Date.now() * 0.001;
        const alpha = 0.8 + Math.sin(time * 2) * 0.2;

        this.context.fillStyle = `rgba(0, 212, 255, ${alpha})`;
        this.context.font = 'bold 36px Arial';
        this.context.textAlign = 'center';
        this.context.fillText('Stick Fighter', this.canvas.width / 2, 50);
    }

    renderDebug() {
        if (!this.config.showDebug) return;

        // Render debug information
        this.context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.context.fillRect(10, 10, 200, 150);

        this.context.fillStyle = 'white';
        this.context.font = '12px monospace';
        this.context.fillText(`FPS: ${this.getFPS()}`, 20, 30);
        this.context.fillText(`Bodies: ${this.physicsEngine.world.bodies.length}`, 20, 50);
        this.context.fillText(`Constraints: ${this.physicsEngine.world.constraints.length}`, 20, 70);
        this.context.fillText(`Mouse: ${this.getMousePosition()}`, 20, 90);
    }

    getFPS() {
        // Simple FPS calculation
        return Math.round(1000 / 16.67); // Assume 60fps
    }

    getMousePosition() {
        return '0, 0'; // Placeholder
    }

    isFighterBody(body) {
        // Check if body belongs to a fighter (not ground, walls, or hit boxes)
        return body.render.fillStyle &&
               body.render.fillStyle !== '#2c3e50' &&
               !body.isStatic &&
               !body.isSensor;
    }

    // Effect methods
    addScreenFlash(intensity = 0.5) {
        this.screenFlash = intensity;
    }

    addParticle(particle) {
        this.particles.push(particle);
    }

    // Control methods
    start() {
        this.isRunning = true;
    }

    stop() {
        this.isRunning = false;
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        this.isRunning = true;
    }

    // Configuration methods
    setBackgroundColor(color) {
        this.config.backgroundColor = color;
    }

    toggleDebug() {
        this.config.showDebug = !this.config.showDebug;
        console.log(`Debug mode: ${this.config.showDebug ? 'ON' : 'OFF'}`);
    }

    setSmoothing(enabled) {
        this.config.enableSmoothing = enabled;
        if (this.context) {
            this.context.imageSmoothingEnabled = enabled;
        }
    }

    // Cleanup
    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        window.removeEventListener('resize', this.handleResize);
        this.isInitialized = false;
    }
}
