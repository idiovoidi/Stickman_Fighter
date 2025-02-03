/**
 * @class GameWorld
 * @description Manages the physical world and its boundaries
 */
export class GameWorld {
    constructor(engine) {
        this.engine = engine;
        this.world = engine.world;
        this.bodies = new Map();
        this.createBoundaries();
    }

    /**
     * @method createBoundaries
     * @description Creates invisible walls around the game area
     * @private
     */
    createBoundaries() {
        const wallOptions = {
            isStatic: true,
            render: { visible: false }
        };

        // Create walls
        const walls = [
            // Left wall
            Matter.Bodies.rectangle(-10, 300, 20, 600, wallOptions),
            // Right wall
            Matter.Bodies.rectangle(810, 300, 20, 600, wallOptions),
            // Top wall (ceiling)
            Matter.Bodies.rectangle(400, -10, 820, 20, wallOptions)
        ];

        walls.forEach(wall => this.addBody(`wall_${walls.indexOf(wall)}`, wall));
    }

    /**
     * @method createGround
     * @description Creates the ground platform with visual styling
     */
    createGround() {
        const ground = Matter.Bodies.rectangle(400, 580, 810, 40, {
            isStatic: true,
            render: { 
                fillStyle: '#4a4a4a',
                strokeStyle: '#2d2d2d',
                lineWidth: 2
            },
            friction: 0.8,
            restitution: 0.2
        });
        
        this.addBody('ground', ground);
        return ground;
    }

    addBody(id, body) {
        this.bodies.set(id, body);
        Matter.World.add(this.world, body);
    }

    removeBody(id) {
        const body = this.bodies.get(id);
        if (body) {
            Matter.World.remove(this.world, body);
            this.bodies.delete(id);
        }
    }

    clear() {
        this.bodies.forEach((body, id) => this.removeBody(id));
    }
} 