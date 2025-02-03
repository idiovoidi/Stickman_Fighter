import { StickMan } from './StickMan.js';
import { AIController } from './AIController.js';
import { GameWorld } from './GameWorld.js';
import { Renderer } from './Renderer.js';
import { GameState } from './GameState.js';
import { GameStates } from './GameState.js';
import { GameLoop } from './GameLoop.js';
import { CollisionHandler } from './physics/CollisionHandler.js';
import { PhysicsDebugger } from './physics/PhysicsDebugger.js';
import { ParticleSystem } from './effects/ParticleSystem.js';
import { EffectSystem } from './effects/EffectSystem.js';

/**
 * @class GameEngine
 * @description Main game engine class that coordinates all game systems and components
 */
export class GameEngine {
    /**
     * @constructor
     * @description Initializes the game engine and all its subsystems
     */
    constructor() {
        this.engine = Matter.Engine.create();
        this.gameState = new GameState();
        this.renderer = new Renderer(this.engine);
        this.gameWorld = new GameWorld(this.engine);
        this.fighters = [];
        this.aiControllers = [];
        
        window.engine = this.engine; // For compatibility with existing code
        this.setupEventListeners();

        this.gameLoop = new GameLoop({
            fps: 60,
            maxFrameSkip: 10
        });

        this.setupGameLoop();

        this.events = new EventTarget();
        this.collisionHandler = new CollisionHandler(this);

        this.physicsDebugger = new PhysicsDebugger(this);
        this.setupDebugControls();

        this.particleSystem = new ParticleSystem(this.renderer);
        this.effectSystem = new EffectSystem(this.renderer);
        
        this.setupEffects();
    }

    /**
     * @method setupEventListeners
     * @description Sets up event listeners for game state changes
     * @private
     */
    setupEventListeners() {
        this.gameState.events.addEventListener('stateChanged', (e) => {
            const { currentState, previousState } = e.detail;
            
            switch (currentState) {
                case GameStates.PLAYING:
                    Matter.Engine.run(this.engine);
                    if (this.renderer) {
                        this.renderer.start();
                    }
                    break;
                
                case GameStates.PAUSED:
                    Matter.Engine.clear(this.engine);
                    if (this.renderer) {
                        this.renderer.stop();
                    }
                    break;
                
                case GameStates.ROUND_END:
                    this.resetFighterPositions();
                    break;
                
                case GameStates.GAME_OVER:
                    this.showGameOverScreen();
                    break;
                
                case GameStates.MENU:
                    this.showMainMenu();
                    break;
            }
        });
    }

    setupGameLoop() {
        this.gameLoop.setUpdateFunction((deltaTime) => this.update(deltaTime));
        this.gameLoop.setRenderFunction((alpha) => this.render(alpha));
    }

    /**
     * @method initialize
     * @description Initializes the game world, fighters, and starts the game loop
     * @public
     */
    initialize() {
        // Create the game world first
        this.gameWorld.createBoundaries();
        this.gameWorld.createGround();
        
        // Setup fighters after world is created
        this.setupFighters();
        
        // Start the game state
        this.gameState.setState(GameStates.PLAYING);
        
        // Start the game loop
        this.gameLoop.start();
    }

    setupFighters() {
        this.fighters = [
            new StickMan(200, 300, true),
            new StickMan(600, 300, false)
        ];

        this.aiControllers = [
            new AIController(this.fighters[0], this.fighters[1]),
            new AIController(this.fighters[1], this.fighters[0])
        ];
    }

    /**
     * @method update
     * @description Main update loop for game logic
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    update(deltaTime) {
        if (this.gameState.isState(GameStates.PLAYING)) {
            // Update physics with fixed timestep
            Matter.Engine.update(this.engine, deltaTime * 1000);
            
            // Update AI controllers
            this.aiControllers.forEach(ai => ai.update(deltaTime));
            
            // Check for collisions
            this.checkCollisions();
            
            this.particleSystem.update(deltaTime);
            this.effectSystem.update(deltaTime);
        }
    }

    /**
     * @method render
     * @description Renders the current game state
     * @param {number} alpha - Interpolation factor between frames
     */
    render(alpha) {
        if (this.gameState.isState(GameStates.PLAYING)) {
            this.interpolatePositions(alpha);
            
            // Mark all dynamic layers as dirty
            this.renderer.layeredRenderer.markDirty('fighters');
            this.renderer.layeredRenderer.markDirty('effects');
            this.renderer.layeredRenderer.markDirty('ui');
            this.renderer.layeredRenderer.markDirty('debug');
            
            // Ensure the renderer has access to the game world
            this.renderer.setGameWorld(this.gameWorld);
            
            this.renderer.render();
        }
    }

    interpolatePositions(alpha) {
        // Store previous positions for interpolation
        this.fighters.forEach(fighter => {
            Object.values(fighter.parts).forEach(part => {
                if (!part.previousPosition) {
                    part.previousPosition = { x: part.position.x, y: part.position.y };
                }

                const interpolatedX = part.previousPosition.x + (part.position.x - part.previousPosition.x) * alpha;
                const interpolatedY = part.previousPosition.y + (part.position.y - part.previousPosition.y) * alpha;

                Matter.Body.setPosition(part, {
                    x: interpolatedX,
                    y: interpolatedY
                });

                // Store current position for next frame
                part.previousPosition = { x: part.position.x, y: part.position.y };
            });
        });
    }

    startGameLoop() {
        this.gameLoop.start();
    }

    stopGameLoop() {
        this.gameLoop.stop();
    }

    checkCollisions() {
        // Add collision detection logic here
        // This could trigger score updates through gameState.updateScore()
    }

    reset() {
        this.fighters.forEach(fighter => fighter.reset());
        this.gameState.reset();
    }

    togglePause() {
        this.gameState.togglePause();
        if (this.gameState.isState(GameStates.PAUSED)) {
            this.stopGameLoop();
        } else {
            this.startGameLoop();
        }
    }

    resetFighterPositions() {
        // Implement the logic to reset fighter positions
    }

    showGameOverScreen() {
        // Implement the logic to show the game over screen
    }

    showMainMenu() {
        // Implement the logic to show the main menu
    }

    setupDebugControls() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'd') {
                this.physicsDebugger.toggle();
            }
        });
    }

    setupEffects() {
        // Setup particle emitters
        this.particleSystem.createEmitter('hit', {
            color: '#ff0000',
            size: 2,
            sizeVariance: 2,
            speed: 200,
            speedVariance: 100,
            life: 0.5,
            lifeVariance: 0.2,
            gravity: 500
        });

        this.particleSystem.createEmitter('dust', {
            color: '#cccccc',
            size: 1,
            sizeVariance: 1,
            speed: 100,
            speedVariance: 50,
            life: 0.3,
            lifeVariance: 0.1,
            gravity: 0
        });

        // Register effects
        this.effectSystem.registerEffect('hitFlash', {
            duration: 0.1,
            scale: 1.5
        });
    }
} 