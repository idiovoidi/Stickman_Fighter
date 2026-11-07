import { TAU, easeOutCubic } from '../../utils/math.js';

const MAX_PARTICLES = 700;

/** World-space particles: additive sparks, expanding impact rings and soft dust puffs. */
export class ParticleSystem {
    #items = [];

    clear() {
        this.#items = [];
    }

    sparks(x, y, { count = 12, color = '#ffffff', speed = 600, direction = 0, spread = Math.PI * 0.9, life = 0.35, width = 3 } = {}) {
        for (let i = 0; i < count; i++) {
            const base = direction === 0 ? Math.random() * TAU : direction > 0 ? 0 : Math.PI;
            const angle = direction === 0 ? base : base + (Math.random() - 0.5) * spread;
            const velocity = speed * (0.35 + Math.random() * 0.65);
            this.#add({
                kind: 'spark', x, y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 120,
                life: life * (0.5 + Math.random() * 0.5),
                color, width: width * (0.6 + Math.random() * 0.8),
            });
        }
    }

    ring(x, y, { color = 'rgba(255, 255, 255, 0.9)', radius = 40, width = 4, life = 0.25 } = {}) {
        this.#add({ kind: 'ring', x, y, vx: 0, vy: 0, life, color, radius, width });
    }

    dust(x, y, { count = 6, spread = 30, color = 'rgba(200, 180, 255, 0.35)', rise = 60, size = 10 } = {}) {
        for (let i = 0; i < count; i++) {
            this.#add({
                kind: 'dust',
                x: x + (Math.random() - 0.5) * spread,
                y: y - Math.random() * 6,
                vx: (Math.random() - 0.5) * spread * 4,
                vy: -rise * (0.4 + Math.random() * 0.6),
                life: 0.4 + Math.random() * 0.35,
                color, radius: size * (0.6 + Math.random() * 0.8),
            });
        }
    }

    update(dt) {
        const items = this.#items;
        for (let i = items.length - 1; i >= 0; i--) {
            const p = items[i];
            p.age += dt;
            if (p.age >= p.life) {
                items[i] = items[items.length - 1];
                items.pop();
                continue;
            }
            if (p.kind === 'spark') {
                p.vy += 900 * dt;
                p.vx *= Math.exp(-3 * dt);
            } else if (p.kind === 'dust') {
                p.vx *= Math.exp(-4 * dt);
                p.vy *= Math.exp(-2 * dt);
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    }

    draw(ctx) {
        if (!this.#items.length) return;
        ctx.save();
        ctx.lineCap = 'round';

        for (const p of this.#items) {
            if (p.kind !== 'dust') continue;
            const t = p.age / p.life;
            ctx.globalAlpha = 1 - t;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * (1 + t * 1.5), 0, TAU);
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'lighter';
        for (const p of this.#items) {
            const t = p.age / p.life;
            ctx.globalAlpha = 1 - t;
            if (p.kind === 'spark') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.width * (1 - t * 0.5);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
                ctx.stroke();
            } else if (p.kind === 'ring') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.width * (1 - t);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * easeOutCubic(t), 0, TAU);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    #add(particle) {
        if (this.#items.length >= MAX_PARTICLES) this.#items.shift();
        particle.age = 0;
        this.#items.push(particle);
    }
}
