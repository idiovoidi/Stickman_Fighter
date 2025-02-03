class GameEngine {
    constructor() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.renderer = this.createRenderer();
        this.fighters = [];
        this.aiControllers = [];
        
        window.engine = this.engine; // For compatibility with existing code
    }

    createRenderer() {
        return Matter.Render.create({
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

    initialize() {
        // Create ground
        const ground = Matter.Bodies.rectangle(400, 580, 810, 40, {
            isStatic: true,
            render: { fillStyle: '#666' }
        });
        Matter.World.add(this.world, ground);

        // Create fighters
        this.fighters = [
            new StickMan(200, 300, true),
            new StickMan(600, 300, false)
        ];

        // Create AI controllers
        this.aiControllers = [
            new AIController(this.fighters[0], this.fighters[1]),
            new AIController(this.fighters[1], this.fighters[0])
        ];

        // Start game loop
        this.startGameLoop();
    }

    startGameLoop() {
        Matter.Engine.run(this.engine);
        Matter.Render.run(this.renderer);
        this.update();
    }

    update() {
        this.aiControllers.forEach(ai => ai.update());
        requestAnimationFrame(() => this.update());
    }

    reset() {
        this.fighters.forEach(fighter => fighter.reset());
    }
} 