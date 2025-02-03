import { GameEngine } from './GameEngine.js';
import { InputManager } from './InputManager.js';
import { StickMan } from './StickMan.js';
import { AIController } from './AIController.js';
import { PersonalityTraits } from './ai/PersonalityTraits.js';

// Initialize Matter.js
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;

class Game {
    constructor() {
        this.engine = Engine.create();
        window.engine = this.engine; // For compatibility
        
        this.setupRenderer();
        this.setupWorld();
        this.setupFighters();
        this.setupGameLoop();
    }

    setupRenderer() {
        this.render = Render.create({
            element: document.body,
            engine: this.engine,
            options: {
                width: 800,
                height: 600,
                wireframes: false,
                background: '#f0f0f0'
            }
        });
    }

    setupWorld() {
        // Create ground
        const ground = Bodies.rectangle(400, 580, 810, 40, {
            isStatic: true,
            render: {
                fillStyle: '#666'
            }
        });

        // Add ground to world
        World.add(this.engine.world, ground);
    }

    setupFighters() {
        // Create fighters
        this.leftFighter = new StickMan(200, 300, true);
        this.rightFighter = new StickMan(600, 300, false);

        // Create AI controllers with different personalities
        this.leftAI = new AIController(
            this.leftFighter, 
            this.rightFighter, 
            PersonalityTraits.AGGRESSIVE
        );
        this.rightAI = new AIController(
            this.rightFighter, 
            this.leftFighter, 
            PersonalityTraits.DEFENSIVE
        );
    }

    setupGameLoop() {
        // Run the engine
        Engine.run(this.engine);
        Render.run(this.render);

        // Game loop
        const gameLoop = () => {
            if (!this.gameState?.isPaused) {
                this.leftAI.update();
                this.rightAI.update();
            }
            requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }

    reset() {
        if (this.leftFighter) this.leftFighter.reset();
        if (this.rightFighter) this.rightFighter.reset();
    }
}

// Initialize game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameEngine();
    window.game = game; // Make game accessible for debug controls
    
    // Initialize the game world and start the game loop
    game.initialize();
}); 