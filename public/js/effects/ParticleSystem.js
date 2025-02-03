import { ObjectPool } from '../utils/ObjectPool.js';

class Particle {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.color = '#ffffff';
        this.alpha = 1;
        this.size = 1;
        this.life = 1;
        this.maxLife = 1;
        this.active = false;
    }

    init(config) {
        Object.assign(this, config);
        this.active = true;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        this.alpha = this.life / this.maxLife;
        
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }

    isDead() {
        return this.life <= 0;
    }

    reset() {
        this.active = false;
        this.life = 0;
        this.alpha = 1;
    }
}

export class ParticleSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.particlePool = new ObjectPool(() => new Particle(), 100);
        this.emitters = new Map();
    }

    createEmitter(name, config) {
        this.emitters.set(name, config);
    }

    emit(name, position, count = 1) {
        const config = this.emitters.get(name);
        if (!config) return;

        for (let i = 0; i < count; i++) {
            const particle = this.particlePool.acquire();
            if (particle) {
                const angle = Math.random() * Math.PI * 2;
                const speed = config.speed + Math.random() * config.speedVariance;
                
                particle.init({
                    position: { x: position.x, y: position.y },
                    velocity: {
                        x: Math.cos(angle) * speed,
                        y: Math.sin(angle) * speed
                    },
                    acceleration: { x: 0, y: config.gravity || 0 },
                    color: config.color,
                    size: config.size + Math.random() * config.sizeVariance,
                    life: config.life + Math.random() * config.lifeVariance,
                    maxLife: config.life + Math.random() * config.lifeVariance
                });
            }
        }
    }

    update(deltaTime) {
        this.particlePool.update(deltaTime);
    }

    render(ctx) {
        this.particlePool.activeObjects.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
} 