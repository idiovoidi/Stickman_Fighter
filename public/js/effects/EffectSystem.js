import { ObjectPool } from '../utils/ObjectPool.js';

class Effect {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.rotation = 0;
        this.scale = 1;
        this.alpha = 1;
        this.life = 1;
        this.maxLife = 1;
        this.sprite = null;
        this.active = false;
    }

    init(config) {
        Object.assign(this, config);
        this.active = true;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        this.alpha = this.life / this.maxLife;
    }

    isDead() {
        return this.life <= 0;
    }

    reset() {
        this.active = false;
        this.life = 0;
        this.alpha = 1;
        this.scale = 1;
        this.rotation = 0;
    }
}

export class EffectSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.effectPool = new ObjectPool(() => new Effect(), 20);
        this.effectTypes = new Map();
    }

    registerEffect(name, config) {
        this.effectTypes.set(name, config);
    }

    spawn(name, position, options = {}) {
        const config = this.effectTypes.get(name);
        if (!config) return;

        const effect = this.effectPool.acquire();
        if (effect) {
            effect.init({
                ...config,
                ...options,
                position: { ...position },
                life: config.duration,
                maxLife: config.duration
            });
        }
        return effect;
    }

    update(deltaTime) {
        this.effectPool.update(deltaTime);
    }

    render(ctx) {
        this.effectPool.activeObjects.forEach(effect => {
            ctx.save();
            ctx.globalAlpha = effect.alpha;
            ctx.translate(effect.position.x, effect.position.y);
            ctx.rotate(effect.rotation);
            ctx.scale(effect.scale, effect.scale);
            
            if (effect.sprite) {
                // Draw sprite
                ctx.drawImage(
                    effect.sprite,
                    -effect.sprite.width / 2,
                    -effect.sprite.height / 2
                );
            }
            
            ctx.restore();
        });
    }
} 