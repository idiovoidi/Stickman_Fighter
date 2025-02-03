class GameWorld {
    constructor(engine) {
        this.engine = engine;
        this.world = engine.world;
        this.bodies = new Map();
    }

    createGround() {
        const ground = Matter.Bodies.rectangle(400, 580, 810, 40, {
            isStatic: true,
            render: { fillStyle: '#666' }
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