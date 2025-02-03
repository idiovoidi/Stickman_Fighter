// Initialize Matter.js
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;

// Create engine
const engine = Engine.create();
window.engine = engine;

// Create renderer
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#f0f0f0'
    }
});

// Create ground
const ground = Bodies.rectangle(400, 580, 810, 40, {
    isStatic: true,
    render: {
        fillStyle: '#666'
    }
});

// Add ground to world
World.add(engine.world, ground);

// Create fighters
const leftFighter = new StickMan(200, 300, true);
const rightFighter = new StickMan(600, 300, false);

// Create AI controllers
const leftAI = new AIController(leftFighter, rightFighter);
const rightAI = new AIController(rightFighter, leftFighter);

// Game loop
function gameLoop() {
    leftAI.update();
    rightAI.update();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Run the engine
Engine.run(engine);
Render.run(render);

// Optional: Add manual controls for testing
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'r': // Reset positions
            leftFighter.reset();
            rightFighter.reset();
            break;
    }
});

class Game {
    constructor() {
        this.gameEngine = new GameEngine();
        this.inputManager = new InputManager(this.gameEngine);
    }

    start() {
        this.gameEngine.initialize();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
    game.start();
}); 