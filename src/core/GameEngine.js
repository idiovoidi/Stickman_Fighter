/**
 * GameEngine - Core game logic and coordination
 * Manages physics, fighters, AI, and game state
 */

import Matter from 'matter-js';
import { Fighter } from '../entities/Fighter.js';
import { InputManager } from './InputManager.js';
import { CollisionManager } from '../systems/CollisionManager.js';
import { GameState } from './GameState.js';
import { Renderer } from '../systems/Renderer.js';
import { UIManager } from '../systems/UIManager.js';

export class GameEngine {
    constructor() {
        this.physicsEngine = null;
        this.renderer = null;
        this.inputManager = null;
        this.collisionManager = null;
        this.gameState = null;
        this.uiManager = null;

        this.fighters = [];
        this.aiControllers = [];

        this.isRunning = false;
        this.lastTime = 0;
        this.animationFrame = null;

        // Game configuration
        this.config = {
            gravity: { x: 0, y: 1 },
            worldBounds: { width: 800, height: 600 },
            fighterStartPositions: [
                { x: 200, y: 300 },
                { x: 600, y: 300 }
            ]
        };
    }

    async init() {
        console.log('🔧 Initializing Game Engine...');

        // Initialize Matter.js physics
        this.physicsEngine = Matter.Engine.create();
        this.physicsEngine.world.gravity = this.config.gravity;

        // Initialize game systems
        this.gameState = new GameState();
        this.inputManager = new InputManager();
        this.collisionManager = new CollisionManager(this);
        this.renderer = new Renderer(this.physicsEngine, this.config.worldBounds);
        this.uiManager = new UIManager();

        // Setup world bounds and ground
        this.setupWorld();

        // Initialize systems
        await this.renderer.init();
        await this.uiManager.init();
        this.inputManager.init(this);
        this.collisionManager.init();

        // Create fighters
        await this.createFighters();

        // Connect UI to game
        this.uiManager.setGameEngine(this);

        console.log('✅ Game Engine initialized');
    }

    setupWorld() {
        const { width, height } = this.config.worldBounds;

        // Create ground
        const ground = Matter.Bodies.rectangle(
            width / 2, height + 20,
            width + 40, 40,
            {
                isStatic: true,
                render: { fillStyle: '#2c3e50' }
            }
        );

        // Create walls (invisible boundaries)
        const leftWall = Matter.Bodies.rectangle(
            -10, height / 2,
            20, height,
            {
                isStatic: true,
                render: { visible: false }
            }
        );

        const rightWall = Matter.Bodies.rectangle(
            width + 10, height / 2,
            20, height,
            {
                isStatic: true,
                render: { visible: false }
            }
        );

        Matter.World.add(this.physicsEngine.world, [ground, leftWall, rightWall]);
    }

    async createFighters() {
        console.log('🤖 Creating fighters...');

        // Create player 1 (human controlled)
        const player1 = new Fighter(
            this.config.fighterStartPositions[0].x,
            this.config.fighterStartPositions[0].y,
            {
                isPlayer1: true,
                color: '#e74c3c',
                controls: {
                    left: 'KeyA',
                    right: 'KeyD',
                    jump: 'KeyW',
                    attack: 'Space'
                }
            }
        );

        // Create player 2 (AI controlled)
        const player2 = new Fighter(
            this.config.fighterStartPositions[1].x,
            this.config.fighterStartPositions[1].y,
            {
                isPlayer1: false,
                color: '#27ae60',
                controls: {
                    left: 'ArrowLeft',
                    right: 'ArrowRight',
                    jump: 'ArrowUp',
                    attack: 'Enter'
                }
            }
        );

        // Add fighters to physics world
        this.fighters = [player1, player2];

        for (const fighter of this.fighters) {
            Matter.World.add(this.physicsEngine.world, [
                ...Object.values(fighter.bodyParts),
                ...fighter.constraints
            ]);
        }

        // Set up AI for player 2
        if (player2) {
            const { AIController } = await import('../ai/AIController.js');
            const aiController = new AIController(player2, player1);
            this.aiControllers.push(aiController);
        }

        console.log('✅ Fighters created');
    }

    start() {
        if (this.isRunning) return;

        console.log('🚀 Starting game loop...');
        this.isRunning = true;
        this.gameState.setState('playing');
        this.gameLoop();
    }

    pause() {
        this.isRunning = false;
        this.gameState.setState('paused');
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.gameState.setState('playing');
            this.gameLoop();
        }
    }

    gameLoop = (currentTime = 0) => {
        if (!this.isRunning) return;

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/30); // Cap at 30fps minimum
        this.lastTime = currentTime;

        // Update game systems
        this.update(deltaTime);

        // Render
        this.renderer.render();

        // Continue loop
        this.animationFrame = requestAnimationFrame(this.gameLoop);
    };

    update(deltaTime) {
        // Update physics
        Matter.Engine.update(this.physicsEngine, deltaTime * 1000);

        // Update input
        this.inputManager.update(deltaTime);

        // Update fighters
        this.fighters.forEach(fighter => fighter.update(deltaTime));

        // Update AI
        this.aiControllers.forEach(ai => ai.update(deltaTime));

        // Update game state
        this.gameState.update(deltaTime);

        // Check collisions
        this.collisionManager.update();
    }

    reset() {
        console.log('🔄 Resetting game...');

        // Reset fighters
        this.fighters.forEach(fighter => fighter.reset());

        // Reset game state
        this.gameState.reset();

        console.log('✅ Game reset');
    }

    // Control methods
    togglePause() {
        this.gameState.togglePause();
        if (this.gameState.isState('paused')) {
            this.pause();
        } else {
            this.resume();
        }
    }

    toggleDebug() {
        this.renderer.toggleDebug();
        this.uiManager.toggleDebugPanel();
    }

    handleResize() {
        this.renderer.handleResize();
    }

    // Getters for external access
    getFighters() {
        return this.fighters;
    }

    getGameState() {
        return this.gameState;
    }

    getPhysicsEngine() {
        return this.physicsEngine;
    }
}
